import path from 'path';
import { PLV8ify } from '../build/PLV8ify';
import { createBundle } from '../build/bundle';
import { pgClient } from './db';

export const buildAndLoadTsToDb = async (dirName: string, relativePath: string) => {
  const codeFilePath = path.join(dirName, relativePath);

  const plv8ify = new PLV8ify();

  const bundledJs = await createBundle({
    mode: 'inline',
    inputFile: codeFilePath,
    scopePrefix: ''
  });

  const sqlFiles = plv8ify.getPLV8SQLFunctions({
    mode: 'inline',
    scopePrefix: '',
    defaultVolatility: 'VOLATILE',
    bundledJs,
    inputFilePath: codeFilePath,
    pgFunctionDelimiter: '$plv8ify$',
    fallbackReturnType: 'JSONB',
    outputFolder: 'does-not-matter'
  });

  await Promise.all(sqlFiles.map(({ sql }) => pgClient.query(sql)));
};
