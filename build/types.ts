export type TSFunction = {
  name: string;
  isExported: boolean;
  parameters: { name: string; type: string }[];
  comments: string[];
  returnType: string;
  jsdocTags: { name: string; commentText: string }[];
};

export type Volatility = 'VOLATILE' | 'STABLE' | 'IMMUTABLE';
export type BuildMode = 'inline' | 'start_proc' | 'bundle';

export type GetPLV8SQLFunctionsArgs = {
  scopePrefix: string;
  pgFunctionDelimiter: string;
  mode: BuildMode;
  bundledJs: string;
  inputFilePath: string;
  fallbackReturnType: string;
  defaultVolatility: Volatility;
  outputFolder: string;
};
