import DataLoader from 'dataloader';
import { Pool } from 'pg';
export function createLoaders(db:Pool){
 return {userById:new DataLoader<number,any>(async ids=>{const q=await db.query('SELECT id,email,full_name,role FROM users WHERE id=ANY($1::int[])',[ids]);const m=new Map(q.rows.map(x=>[x.id,x]));return ids.map(id=>m.get(id)??null);}),
 planById:new DataLoader<number,any>(async ids=>{const q=await db.query('SELECT * FROM benefit_plans WHERE id=ANY($1::int[])',[ids]);const m=new Map(q.rows.map(x=>[x.id,x]));return ids.map(id=>m.get(id)??null);}),
 enrollmentById:new DataLoader<number,any>(async ids=>{const q=await db.query('SELECT * FROM enrollments WHERE id=ANY($1::int[])',[ids]);const m=new Map(q.rows.map(x=>[x.id,x]));return ids.map(id=>m.get(id)??null);})};
}
