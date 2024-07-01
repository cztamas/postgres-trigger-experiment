import path from 'path';
import { getSQLFunctions } from '../build/get-sql-functions';
import { pgClient } from './db';

export const buildAndLoadTsToDb = async (dirName: string, relativePath: string) => {
  const codeFilePath = path.join(dirName, relativePath);

  const sqlFiles = await getSQLFunctions({
    scopePrefix: '',
    inputFilePath: codeFilePath
  });

  await Promise.all(sqlFiles.map(sql => pgClient.query(sql)));
};
