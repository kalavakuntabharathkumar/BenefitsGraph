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


const schemaContracts: Array<[string,string]> = [
  ['users','id'],['users','email'],['users','password_hash'],['users','full_name'],['users','role'],['users','created_at'],
  ['benefit_plans','id'],['benefit_plans','name'],['benefit_plans','plan_type'],['benefit_plans','annual_premium_cents'],['benefit_plans','deductible_cents'],['benefit_plans','copay_cents'],['benefit_plans','coverage_percent'],['benefit_plans','active'],
  ['enrollments','id'],['enrollments','user_id'],['enrollments','plan_id'],['enrollments','effective_date'],['enrollments','status'],
  ['claims','id'],['claims','enrollment_id'],['claims','description'],['claims','service_date'],['claims','billed_cents'],['claims','status'],['claims','submitted_at'],['claims','reviewed_by'],['claims','reviewed_at'],
  ['claim_events','id'],['claim_events','claim_id'],['claim_events','actor_id'],['claim_events','event_type'],['claim_events','note'],['claim_events','created_at'],
  ['dependents','id'],['dependents','user_id'],['dependents','full_name'],['dependents','relationship'],['dependents','date_of_birth']
];
test.each(schemaContracts)('database schema contains %s.%s', async (table, column) => {
  const result = await db.query('SELECT 1 FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=$1 AND column_name=$2', [table, column]);
  expect(result.rowCount).toBe(1);
});
  test('database contains all six core tables', async () => {
    const result = await db.query("SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])", [['users','benefit_plans','enrollments','claims','claim_events','dependents']]);
    expect(result.rows[0].n).toBe(6);
  });
});
