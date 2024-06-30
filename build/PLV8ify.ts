import { Mode } from 'fs';
import { BuildMode, GetPLV8SQLFunctionsArgs, Volatility, TSFunction } from './types.js';
import { match } from 'ts-pattern';
import { bundle } from './EsBuild';
import { getFunctionsInFile } from './TsMorph';

interface GetPLV8SQLFunctionArgs {
  fn: TSFunction;
  scopePrefix: string;
  pgFunctionDelimiter: string;
  mode: Mode;
  bundledJs: string;
  fallbackReturnType: string;
  defaultVolatility: Volatility;
}

/** configuration for how a JS function should be transformed into a SQL function */
type FnSqlConfig = {
  paramTypeMapping: {
    [name: string]: string | null;
  };
  volatility: Volatility | null;
  sqlReturnType: string | null;
  customSchema: string;
  trigger: boolean;
};

export const build = async ({
  mode,
  inputFile,
  scopePrefix
}: {
  mode: BuildMode;
  inputFile: string;
  scopePrefix: string;
}) => {
  const bundledJsWithExportBlock = await bundle(inputFile);
  const bundledJs = bundledJsWithExportBlock.replace(/export\s*{[^}]*};/gs, '');

  const modeAdjustedBundledJs = match(mode)
    .with('inline', () => bundledJs)
    .with('start_proc', () =>
      // Remove var from var plv8ify to make it attach to the global scope in start_proc mode
      bundledJs.replace(`var ${scopePrefix} =`, `this.${scopePrefix} =`)
    )
    .with('bundle', () => bundledJs)
    .exhaustive();
  return modeAdjustedBundledJs;
};

export class PLV8ify {
  private _typeMap: Record<string, string> = {
    number: 'float8',
    string: 'text',
    boolean: 'boolean',
    Date: 'date'
  };

  private getScopedName(fn: TSFunction, scopePrefix: string) {
    const scopedName = scopePrefix + fn.name;
    return scopedName;
  }

  private getFileName(outputFolder: string, fn: TSFunction, scopePrefix: string) {
    const scopedName = this.getScopedName(fn, scopePrefix);
    return `${outputFolder}/${scopedName}.plv8.sql`;
  }
  private getTypeFromMap(type: string) {
    const typeLocal = type.split('.').pop();
    return this._typeMap[typeLocal ?? type];
  }

  getPLV8SQLFunctions({
    scopePrefix,
    pgFunctionDelimiter,
    mode,
    inputFilePath,
    bundledJs,
    fallbackReturnType,
    defaultVolatility,
    outputFolder
  }: GetPLV8SQLFunctionsArgs) {
    const functions = getFunctionsInFile(inputFilePath);
    const exportedFunctions = functions.filter(fn => fn.isExported);
    const sqls = exportedFunctions.map(fn => {
      return {
        filename: this.getFileName(outputFolder, fn, scopePrefix),
        sql: this.getPLV8SQLFunction({
          fn,
          scopePrefix,
          pgFunctionDelimiter,
          mode,
          bundledJs,
          fallbackReturnType,
          defaultVolatility
        })
      };
    });

    const startProcSQLs = [];
    if (mode === 'start_proc' || mode === 'bundle') {
      // -- PLV8 + Server
      const virtualInitFn: TSFunction = {
        name: '_init',
        comments: [],
        isExported: false,
        parameters: [],
        returnType: 'void',
        jsdocTags: []
      };

      if (mode === 'bundle') {
        // make the function declarations available in the global scope
        for (const fn of exportedFunctions) {
          bundledJs += `globalThis.${fn.name} = ${fn.name};\n`;
        }

        // set a global symbol so that we can check if the init function has been called
        bundledJs += `globalThis[Symbol.for('${scopePrefix}_initialized')] = true;\n`;
      }

      const initFunction = this.getPLV8SQLFunction({
        fn: virtualInitFn,
        scopePrefix,
        pgFunctionDelimiter: '$$',
        mode: 'inline',
        bundledJs,
        defaultVolatility,
        fallbackReturnType: 'void'
      });

      const initFileName = this.getFileName(outputFolder, virtualInitFn, scopePrefix);
      startProcSQLs.push({
        filename: initFileName,
        sql: initFunction
      });
    }

    if (mode === 'start_proc') {
      const startFunctionName = 'start';
      const virtualStartFn: TSFunction = {
        name: startFunctionName,
        comments: [],
        isExported: false,
        parameters: [],
        returnType: 'void',
        jsdocTags: []
      };
      const startProcSQLScript = this.getStartProcSQLScript({ scopePrefix });
      const startProcFileName = this.getFileName(outputFolder, virtualStartFn, scopePrefix);
      startProcSQLs.push({
        filename: startProcFileName,
        sql: startProcSQLScript
      });
    }

    return sqls.concat(startProcSQLs);
  }

  /**
   * handles all the processing for jsdoc / magic comments
   */
  private getFnSqlConfig(fn: TSFunction): FnSqlConfig {
    const config: FnSqlConfig = {
      // defaults
      paramTypeMapping: {},
      volatility: null,
      sqlReturnType: this.getTypeFromMap(fn.returnType) || null,
      customSchema: '',
      trigger: false
    };

    // default param type mapping
    for (const param of fn.parameters) {
      config.paramTypeMapping[param.name] = this.getTypeFromMap(param.type) || null;
    }

    // process magic comments (legacy format)
    for (const comment of fn.comments) {
      const volatilityMatch = comment.match(
        /^\/\/@plv8ify-volatility-(STABLE|IMMUTABLE|VOLATILE)/imu
      );
      if (volatilityMatch) config.volatility = volatilityMatch[1] as Volatility;

      const schemaMatch = comment.match(/^\/\/@plv8ify-schema-name (.+)/imu);
      if (schemaMatch) config.customSchema = schemaMatch[1];

      for (const param of fn.parameters) {
        const paramMatch = comment.match(/^\/\/@plv8ify-param (.+) ([\s\S]+)/imu);
        if (paramMatch && paramMatch[1] === param.name)
          config.paramTypeMapping[param.name] = paramMatch[2];
      }

      const returnMatch = comment.match(/^\/\/@plv8ify-return ([\s\S]+)/imu);
      if (returnMatch) config.sqlReturnType = returnMatch[1];

      if (comment.match(/^\/\/@plv8ify-trigger/imu)) config.trigger = true;
    }

    // process jsdoc tags
    for (const tag of fn.jsdocTags) {
      if (
        tag.name === 'plv8ify_volatility' &&
        ['STABLE', 'IMMUTABLE', 'VOLATILE'].includes(tag.commentText.toUpperCase())
      ) {
        config.volatility = tag.commentText as Volatility;
      }

      if (tag.name === 'plv8ify_schema_name') config.customSchema = tag.commentText;

      // expected format: `/** @plv8ify_param {sqlParamType} paramName */`
      const paramMatch = tag.commentText.match(/^\{(.+)\} ([\s\S]+)/imu); // return type should be in curly braces, similar to jsdoc @return
      if (tag.name === 'plv8ify_param' && paramMatch)
        config.paramTypeMapping[paramMatch[2]] = paramMatch[1];

      // expected format: `/** @plv8ify_return {sqlType} */`
      // expected format: `/** @plv8ify_returns {sqlType} */`
      const returnMatch = tag.commentText.match(/^\{(.+)\}/imu); // param type should be in curly braces, similar to jsdoc @param
      if (['plv8ify_return', 'plv8ify_returns'].includes(tag.name) && returnMatch)
        config.sqlReturnType = returnMatch[1];

      if (tag.name === 'plv8ify_trigger') config.trigger = true;
    }

    // triggers don't have return types
    if (config.trigger) config.sqlReturnType = 'TRIGGER';

    return config;
  }

  getPLV8SQLFunction({
    fn,
    scopePrefix,
    pgFunctionDelimiter,
    mode,
    bundledJs,
    fallbackReturnType,
    defaultVolatility
  }: GetPLV8SQLFunctionArgs) {
    let { customSchema, paramTypeMapping, volatility, sqlReturnType, trigger } =
      this.getFnSqlConfig(fn);
    if (!volatility) volatility = defaultVolatility;
    if (!sqlReturnType) sqlReturnType = fallbackReturnType;

    const sqlParametersString = trigger
      ? '' // triggers don't have parameters
      : fn.parameters
          .map(param => `${param.name} ${paramTypeMapping[param.name] || fallbackReturnType}`)
          .join(',');

    const jsParametersString = fn.parameters.map(param => param.name).join(',');

    const scopedName = (customSchema ? customSchema + '.' : '') + scopePrefix + fn.name;

    return [
      `DROP FUNCTION IF EXISTS ${scopedName}(${sqlParametersString});`,
      `CREATE OR REPLACE FUNCTION ${scopedName}(${sqlParametersString}) RETURNS ${sqlReturnType} AS ${pgFunctionDelimiter}`,
      match(mode)
        .with('inline', () => bundledJs)
        .with(
          'bundle',
          () =>
            `if (!globalThis[Symbol.for('${scopePrefix}_initialized')]) plv8.execute('SELECT ${scopePrefix}_init();');`
        )
        .otherwise(() => ''),
      match(sqlReturnType.toLowerCase())
        .with('void', () => '')
        .otherwise(() => `return ${fn.name}(${jsParametersString})`),
      '',
      `${pgFunctionDelimiter} LANGUAGE plv8 ${volatility} STRICT;`
    ].join('\n');
  }

  private getStartProcSQLScript = ({ scopePrefix }) =>
    `
SET plv8.start_proc = ${scopePrefix}_init;
SELECT plv8_reset();
`;
}
