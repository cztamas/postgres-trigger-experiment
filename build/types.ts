export type TSFunction = {
  name: string;
  isExported: boolean;
  parameters: { name: string; type: string }[];
  comments: string[];
  returnType: string;
  jsdocTags: { name: string; commentText: string }[];
};

export type Volatility = 'VOLATILE' | 'STABLE' | 'IMMUTABLE';
