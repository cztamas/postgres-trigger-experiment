export type TSFunctionParameter = {
  name: string;
  type: string;
};

export type TSFunction = {
  name: string;
  isExported: boolean;
  parameters: TSFunctionParameter[];
  comments: string[];
  returnType: string;
  jsdocTags: { name: string; commentText: string }[];
};

export type TSCompiler = {
  createSourceFile(inputFilePath: string);

  getFunctions: () => TSFunction[];
};

export type Volatility = 'VOLATILE' | 'STABLE' | 'IMMUTABLE';
export type Mode = 'inline' | 'start_proc' | 'bundle';

export type BuildArgs = {
  mode: Mode;
  inputFile: string;
  scopePrefix: string;
};

export type GetPLV8SQLFunctionsArgs = {
  scopePrefix: string;
  pgFunctionDelimiter: string;
  mode: Mode;
  bundledJs: string;
  fallbackReturnType: string;
  defaultVolatility: Volatility;
  outputFolder: string;
};

export type PLV8ify = {
  init(inputFilePath: string): void;
  build: (options: BuildArgs) => Promise<string>;
  write: (path: string, string: string) => void;

  getPLV8SQLFunctions({
    mode,
    scopePrefix,
    pgFunctionDelimiter,
    fallbackReturnType,
    bundledJs
  }: GetPLV8SQLFunctionsArgs): {
    filename: string;
    sql: string;
  }[];
};
