import { match } from 'ts-pattern';
import { TSFunction } from './types';
import { getFunctionsInFile } from './TsMorph';
import { getFunctionConfig } from './get-function-config';

const fallbackReturnType = 'JSONB';

export const getPLV8SQLFunctions = ({
  scopePrefix,
  inputFilePath,
  bundledJs
}: {
  scopePrefix: string;
  bundledJs: string;
  inputFilePath: string;
}) => {
  const exportedFunctions = getFunctionsInFile(inputFilePath).filter(fn => fn.isExported);

  return exportedFunctions.map(fn => getPLV8SQLFunction({ fn, scopePrefix, bundledJs }));
};

const getPLV8SQLFunction = ({
  fn,
  scopePrefix,
  bundledJs
}: {
  fn: TSFunction;
  scopePrefix: string;
  bundledJs: string;
}) => {
  const { customSchema, paramTypeMapping, volatility, sqlReturnType, trigger } =
    getFunctionConfig(fn);

  const sqlParametersString = trigger
    ? '' // triggers don't have parameters
    : fn.parameters
        .map(param => `${param.name} ${paramTypeMapping[param.name] || fallbackReturnType}`)
        .join(',');

  const jsParametersString = fn.parameters.map(param => param.name).join(',');

  const scopedName = (customSchema ? customSchema + '.' : '') + scopePrefix + fn.name;

  return [
    `DROP FUNCTION IF EXISTS ${scopedName}(${sqlParametersString});`,
    `CREATE OR REPLACE FUNCTION ${scopedName}(${sqlParametersString}) RETURNS ${sqlReturnType} AS $$`,
    bundledJs,
    match(sqlReturnType.toLowerCase())
      .with('void', () => '')
      .otherwise(() => `return ${fn.name}(${jsParametersString})`),
    '',
    `$$ LANGUAGE plv8 ${volatility} STRICT;`
  ].join('\n');
};
