export type TSFunction = {
  name: string;
  isExported: boolean;
  parameters: { name: string; type: string }[];
  comments: string[];
  returnType: string;
  jsdocTags: { name: string; commentText: string }[];
};

export type FunctionConfig = {
  paramTypeMapping: {
    [name: string]: string | null;
  };
  volatility: Volatility | null;
  sqlReturnType: string | null;
  customSchema: string;
  trigger: boolean;
};

export type Volatility = 'VOLATILE' | 'STABLE' | 'IMMUTABLE';
