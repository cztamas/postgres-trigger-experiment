import { match } from 'ts-pattern';
import { TSFunction } from './types';
import { getFunctionsInFile, bundle } from './build';
import { getFunctionConfig } from './get-function-config';

const fallbackReturnType = 'JSONB';

export const getSQLFunctions = async ({
  scopePrefix,
  inputFilePath
}: {
  scopePrefix: string;
  inputFilePath: string;
}) => {
  const bundledJs = await bundle(inputFilePath);
  const exportedFunctions = getFunctionsInFile(inputFilePath).filter(fn => fn.isExported);

  return exportedFunctions.map(fn => getSQLFunction({ fn, scopePrefix, bundledJs }));
};

const getSQLFunction = ({
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
