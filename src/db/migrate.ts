import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './pool';
async function main(){const sql=await readFile('db/migrations/001_init.sql','utf8'); await pool.query(sql); console.log('Database migration complete'); await pool.end();}
main().catch(async e=>{console.error(e); await pool.end(); process.exit(1);});
