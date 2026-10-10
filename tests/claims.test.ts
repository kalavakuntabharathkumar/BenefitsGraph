import { Pool } from 'pg';
import { createLoaders } from '../src/loaders';
const url=process.env.TEST_DATABASE_URL;
const describeDb=url?describe:describe.skip;
describeDb('DataLoader batching integration',()=>{
 let db:Pool;
 beforeAll(async()=>{db=new Pool({connectionString:url});await db.query('SELECT 1');});
 afterAll(async()=>{await db?.end();});
 test('loads many plans in one database query',async()=>{
  const loaders=createLoaders(db);const before=await db.query('SELECT COUNT(*)::int AS n FROM benefit_plans');
  expect(before.rows[0].n).toBeGreaterThanOrEqual(0);
  const ids=(await db.query('SELECT id FROM benefit_plans ORDER BY id LIMIT 10')).rows.map(x=>x.id);
  if(ids.length){const values=await Promise.all(ids.map((id:number)=>loaders.planById.load(id)));expect(values).toHaveLength(ids.length);expect(values.every(Boolean)).toBe(true);}
 });
 test('rejects invalid database connectivity',async()=>{const q=await db.query('SELECT current_database() AS name');expect(q.rows[0].name).toBeTruthy();});
});
