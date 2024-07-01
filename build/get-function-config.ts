import { TSFunction, FunctionConfig, Volatility } from './types.js';

const fallbackReturnType = 'JSONB';
const defaultVolatility = 'VOLATILE';
const typeMap = {
  number: 'float8',
  string: 'text',
  boolean: 'boolean',
  Date: 'date'
};

const getTypeFromMap = (type: string) => {
  const typeLocal = type.split('.').pop();
  return typeMap[typeLocal ?? type];
};

export const getFunctionConfig = (fn: TSFunction): FunctionConfig => {
  const config: FunctionConfig = {
    // defaults
    paramTypeMapping: {},
    volatility: defaultVolatility,
    sqlReturnType: getTypeFromMap(fn.returnType) || fallbackReturnType,
    customSchema: '',
    trigger: false
  };

  // default param type mapping
  for (const param of fn.parameters) {
    config.paramTypeMapping[param.name] = getTypeFromMap(param.type) || null;
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
};
