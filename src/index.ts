import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';
import { pool } from './db/pool';
import { createLoaders } from './loaders';
import { typeDefs,resolvers } from './schema';
import { Viewer } from './auth';
async function main(){const server=new ApolloServer({typeDefs,resolvers});const {url}=await startStandaloneServer(server,{listen:{port:Number(process.env.PORT||4000)},context:async({req})=>{const header=req.headers.authorization||'';let viewer:Viewer|null=null;if(header.startsWith('Bearer ')){try{const payload=jwt.verify(header.slice(7),process.env.JWT_SECRET||'development-secret') as any;const q=await pool.query('SELECT id,email,full_name,role FROM users WHERE id=$1',[Number(payload.sub)]);if(q.rows[0])viewer={id:q.rows[0].id,email:q.rows[0].email,fullName:q.rows[0].full_name,role:q.rows[0].role};}catch{viewer=null;}}return {viewer,loaders:createLoaders(pool)};}});console.log(`BenefitsGraph ready at ${url}`);}
main().catch(e=>{console.error(e);process.exit(1)});
