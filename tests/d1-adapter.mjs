import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function database(file=':memory:'){
 const sql=new DatabaseSync(file);
 for(const f of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')))sql.exec(fs.readFileSync('drizzle/'+f,'utf8').replaceAll('--> statement-breakpoint','').replaceAll('CREATE TABLE `','CREATE TABLE IF NOT EXISTS `'));
 const execute=(q,args,kind)=>{const st=sql.prepare(q);if(kind==='first')return st.get(...args)||null;if(kind==='all')return {results:st.all(...args)};const r=st.run(...args);return {meta:{changes:Number(r.changes)}}};
 const prepare=(q,args=[])=>({q,args,bind(...a){return prepare(q,a)},async first(){return execute(q,args,'first')},async all(){return execute(q,args,'all')},async run(){return execute(q,args,'run')}});
 return {prepare,async batch(ops){sql.exec('BEGIN IMMEDIATE');try{const results=ops.map(op=>execute(op.q,op.args,'run'));sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}},close(){sql.close()}};
}
