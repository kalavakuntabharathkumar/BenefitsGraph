import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './pool';
async function main(){
 const hash=await bcrypt.hash('Password123!',10);
 const hr=await pool.query("INSERT INTO users(email,password_hash,full_name,role) VALUES($1,$2,$3,'HR_ADMIN') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id",['hr@example.com',hash,'HR Administrator']);
 const emp=await pool.query("INSERT INTO users(email,password_hash,full_name,role) VALUES($1,$2,$3,'EMPLOYEE') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id",['employee@example.com',hash,'Alex Employee']);
 const plan=await pool.query("INSERT INTO benefit_plans(name,plan_type,annual_premium_cents,deductible_cents,copay_cents,coverage_percent) SELECT 'Core Health','HEALTH',120000,50000,2500,80 WHERE NOT EXISTS(SELECT 1 FROM benefit_plans WHERE name='Core Health') RETURNING id");
 const planId=plan.rows[0]?.id ?? (await pool.query("SELECT id FROM benefit_plans WHERE name='Core Health'")).rows[0].id;
 await pool.query("INSERT INTO enrollments(user_id,plan_id,effective_date) VALUES($1,$2,CURRENT_DATE) ON CONFLICT(user_id,plan_id) DO NOTHING",[emp.rows[0].id,planId]);
 console.log('Seed complete'); await pool.end();
}
main().catch(async e=>{console.error(e);await pool.end();process.exit(1)});
