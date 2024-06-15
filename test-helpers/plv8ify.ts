import path from 'path';
import { PLV8ifyCLI } from 'plv8ify';
import { db } from '../src/db';

export const buildAndLoadTsToDb = async (dirName: string, relativePath: string) => {
  const codeFilePath = path.join(dirName, relativePath);

  const plv8ify = new PLV8ifyCLI('esbuild');
  plv8ify.init(codeFilePath, 'types.ts');

  const bundledJs = await plv8ify.build({
    mode: 'inline',
    inputFile: codeFilePath,
    scopePrefix: ''
  });

  const sqlFiles = plv8ify.getPLV8SQLFunctions({
    mode: 'inline',
    scopePrefix: '',
    defaultVolatility: 'IMMUTABLE',
    bundledJs,
    pgFunctionDelimiter: '$plv8ify$',
    fallbackReturnType: 'JSONB',
    outputFolder: 'does-not-matter'
  });

  await Promise.all(sqlFiles.map(({ sql }) => db.raw(sql)));
};