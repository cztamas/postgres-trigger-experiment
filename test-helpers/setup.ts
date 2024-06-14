import '../env/load-env';
import { db } from '../src/db';

afterAll(async () => {
  await db.destroy();
});
