import path from 'path';
import { PLV8ify } from '../build/PLV8ify';
import { bundle } from '../build/bundle';
import { pgClient } from './db';

export const buildAndLoadTsToDb = async (dirName: string, relativePath: string) => {
  const codeFilePath = path.join(dirName, relativePath);

  const plv8ify = new PLV8ify();

  const bundledJs = await bundle(codeFilePath);

  const sqlFiles = plv8ify.getPLV8SQLFunctions({
    scopePrefix: '',
    bundledJs,
    inputFilePath: codeFilePath
  });

  await Promise.all(sqlFiles.map(sql => pgClient.query(sql)));
};
