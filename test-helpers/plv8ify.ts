import path from 'path';
import { getPLV8SQLFunctions } from '../build/get-sql-functions';
import { bundle } from '../build/bundle';
import { pgClient } from './db';

export const buildAndLoadTsToDb = async (dirName: string, relativePath: string) => {
  const codeFilePath = path.join(dirName, relativePath);

  const bundledJs = await bundle(codeFilePath);
  const sqlFiles = getPLV8SQLFunctions({
    scopePrefix: '',
    bundledJs,
    inputFilePath: codeFilePath
  });

  await Promise.all(sqlFiles.map(sql => pgClient.query(sql)));
};
