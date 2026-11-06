import { gql } from 'graphql-tag';
import { GraphQLError } from 'graphql';
import { pool } from './db/pool';
import { authenticate, requireRole, requireViewer, Viewer } from './auth';
export const typeDefs=gql`
 enum Role { EMPLOYEE HR_ADMIN }
 enum ClaimStatus { SUBMITTED APPROVED REJECTED }
 type User { id:ID! email:String! fullName:String! role:Role! enrollments:[Enrollment!]! }
 type BenefitPlan { id:ID! name:String! planType:String! annualPremiumCents:Int! deductibleCents:Int! copayCents:Int! coveragePercent:Int! }
 type Enrollment { id:ID! effectiveDate:String! status:String! plan:BenefitPlan! user:User! }
 type Claim { id:ID! description:String! serviceDate:String! billedCents:Int! status:ClaimStatus! submittedAt:String! enrollment:Enrollment! }
 type AuthPayload { token:String! user:User! }
 input SubmitClaimInput { enrollmentId:ID! description:String! serviceDate:String! billedCents:Int! }
 type Query { me:User, plans:[BenefitPlan!]!, myClaims:[Claim!]!, claims(status:ClaimStatus):[Claim!]!, employees:[User!]! }
 type Mutation { login(email:String!,password:String!):AuthPayload, submitClaim(input:SubmitClaimInput!):Claim!, reviewClaim(claimId:ID!,status:ClaimStatus!,note:String):Claim! }
`;
type Context={viewer:Viewer|null;loaders:ReturnType<typeof import('./loaders').createLoaders>};
export const resolvers={
 Query:{me:(_:unknown,__:unknown,{viewer}:Context)=>viewer,plans:async()=> (await pool.query('SELECT * FROM benefit_plans WHERE active=true ORDER BY id')).rows,
 myClaims:async(_:unknown,__:unknown,{viewer}:Context)=>{const v=requireViewer(viewer);return (await pool.query('SELECT c.* FROM claims c JOIN enrollments e ON e.id=c.enrollment_id WHERE e.user_id=$1 ORDER BY c.submitted_at DESC',[v.id])).rows;},
 claims:async(_:unknown,args:{status?:string},{viewer}:Context)=>{const v=requireViewer(viewer);requireRole(v,'HR_ADMIN');return (await pool.query('SELECT * FROM claims WHERE ($1::text IS NULL OR status=$1) ORDER BY submitted_at DESC',[args.status??null])).rows;},
 employees:async(_:unknown,__:unknown,{viewer}:Context)=>{const v=requireViewer(viewer);requireRole(v,'HR_ADMIN');return (await pool.query("SELECT id,email,full_name,role FROM users WHERE role='EMPLOYEE' ORDER BY id")).rows;}},
 Mutation:{login:async(_:unknown,args:{email:string;password:string})=>{const result=await authenticate(args.email,args.password);if(!result)throw new GraphQLError('Invalid email or password',{extensions:{code:'UNAUTHENTICATED'}});return {token:result.token,user:result.viewer};},
 submitClaim:async(_:unknown,args:{input:{enrollmentId:string;description:string;serviceDate:string;billedCents:number}},{viewer}:Context)=>{const v=requireViewer(viewer);const input=args.input;if(input.billedCents<=0||!input.description.trim())throw new GraphQLError('Claim amount and description must be valid');const enrollment=await pool.query("SELECT id FROM enrollments WHERE id=$1 AND user_id=$2 AND status='ACTIVE'",[Number(input.enrollmentId),v.id]);if(!enrollment.rowCount)throw new GraphQLError('Active enrollment not found',{extensions:{code:'FORBIDDEN'}});const c=await pool.query('INSERT INTO claims(enrollment_id,description,service_date,billed_cents) VALUES($1,$2,$3,$4) RETURNING *',[Number(input.enrollmentId),input.description.trim(),input.serviceDate,input.billedCents]);await pool.query("INSERT INTO claim_events(claim_id,actor_id,event_type,note) VALUES($1,$2,'SUBMITTED','Claim submitted')",[c.rows[0].id,v.id]);return c.rows[0];},
 reviewClaim:async(_:unknown,args:{claimId:string;status:'APPROVED'|'REJECTED';note?:string},{viewer}:Context)=>{const v=requireViewer(viewer);requireRole(v,'HR_ADMIN');if(!['APPROVED','REJECTED'].includes(args.status))throw new GraphQLError('Invalid review status');const c=await pool.query("UPDATE claims SET status=$1,reviewed_by=$2,reviewed_at=NOW() WHERE id=$3 AND status='SUBMITTED' RETURNING *",[args.status,v.id,Number(args.claimId)]);if(!c.rowCount)throw new GraphQLError('Submitted claim not found');await pool.query('INSERT INTO claim_events(claim_id,actor_id,event_type,note) VALUES($1,$2,$3,$4)',[Number(args.claimId),v.id,args.status,args.note??null]);return c.rows[0];}}
 ,User:{fullName:(u:any)=>u.full_name??u.fullName,enrollments:async(u:any)=> (await pool.query('SELECT * FROM enrollments WHERE user_id=$1 ORDER BY id',[u.id])).rows},
 BenefitPlan:{planType:(p:any)=>p.plan_type,annualPremiumCents:(p:any)=>p.annual_premium_cents,deductibleCents:(p:any)=>p.deductible_cents,copayCents:(p:any)=>p.copay_cents,coveragePercent:(p:any)=>p.coverage_percent},
 Enrollment:{effectiveDate:(e:any)=>String(e.effective_date).slice(0,10),plan:(e:any,_:unknown,c:Context)=>c.loaders.planById.load(e.plan_id),user:(e:any,_:unknown,c:Context)=>c.loaders.userById.load(e.user_id)},
 Claim:{serviceDate:(c:any)=>String(c.service_date).slice(0,10),billedCents:(c:any)=>c.billed_cents,submittedAt:(c:any)=>c.submitted_at.toISOString(),enrollment:(c:any,_:unknown,ctx:Context)=>ctx.loaders.enrollmentById.load(c.enrollment_id)}
};
