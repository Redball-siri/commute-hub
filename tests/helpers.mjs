import '../public/config.js';import '../public/seed.js';import {handleApi,commit} from '../server/api.mjs';import {database} from './d1-adapter.mjs';
export const C=globalThis.CommuteConfig,now=new Date('2026-11-06T00:00:00Z'),admin={role:'admin',name:'管理員'},employee={role:'employee',employee:'A01234',name:'測試同仁'};
export const seed=()=>C.normalizeState(globalThis.CommuteSeed);
export async function fixture(state=seed()){
 const DB=database();await commit(DB,null,state);
 async function call(path,body,cookie='',method='POST',extra={}){return handleApi(new Request('https://test.local'+path,{method,headers:{'content-type':'application/json',cookie,...extra},...(method==='GET'?{}:{body:JSON.stringify(body)})}),{DB})}
 async function login(actor){const res=await call('/api/session',actor);return res.headers.get('set-cookie').split(';')[0]}
 const employeeCookie=await login(employee),adminCookie=await login(admin);
 async function read(){return (await call('/api/state',null,'','GET')).json()}
 async function action(body,cookie=employeeCookie){const {revision}=await read();return call('/api/action',{...body,revision},cookie)}
 return {DB,call,login,read,action,employeeCookie,adminCookie};
}
