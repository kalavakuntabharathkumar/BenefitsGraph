import { requireRole, requireViewer, Viewer } from '../src/auth';
describe('authorization helpers',()=>{
 const employee:Viewer={id:1,email:'e@example.com',fullName:'Employee',role:'EMPLOYEE'};
 test('requires an authenticated viewer',()=>{expect(()=>requireViewer(null)).toThrow('Authentication required');expect(requireViewer(employee)).toEqual(employee);});
 test('blocks employee from HR-only operations',()=>{expect(()=>requireRole(employee,'HR_ADMIN')).toThrow('Insufficient permissions');});
 test('allows HR administrator',()=>{expect(()=>requireRole({...employee,role:'HR_ADMIN'},'HR_ADMIN')).not.toThrow();});
});
