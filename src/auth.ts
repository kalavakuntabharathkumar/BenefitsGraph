import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { pool } from './db/pool';
export type Role='EMPLOYEE'|'HR_ADMIN';
export interface Viewer { id:number; email:string; fullName:string; role:Role }
export async function authenticate(email:string,password:string):Promise<{token:string;viewer:Viewer}|null>{
 const result=await pool.query('SELECT id,email,full_name,role,password_hash FROM users WHERE email=$1',[email]);
 const user=result.rows[0]; if(!user || !(await bcrypt.compare(password,user.password_hash))) return null;
 const viewer:Viewer={id:user.id,email:user.email,fullName:user.full_name,role:user.role};
 const token=jwt.sign({sub:user.id,email:user.email,role:user.role},process.env.JWT_SECRET||'development-secret',{expiresIn:'8h'});
 return {token,viewer};
}
export function requireViewer(viewer:Viewer|null):Viewer{if(!viewer) throw new GraphQLError('Authentication required',{extensions:{code:'UNAUTHENTICATED'}});return viewer;}
export function requireRole(viewer:Viewer,role:Role){if(viewer.role!==role) throw new GraphQLError('Insufficient permissions',{extensions:{code:'FORBIDDEN'}});}
