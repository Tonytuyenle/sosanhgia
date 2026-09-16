import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import pg from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';
export const dataDir=path.resolve(process.env.DATA_DIR||'data');
fs.mkdirSync(dataDir,{recursive:true});
let sqlite,pool;
const context=new AsyncLocalStorage();
const sqlitePath=path.join(dataDir,'vugia.sqlite');
export const dbMode=process.env.DATABASE_URL?'PostgreSQL':'SQLite cục bộ';
export async function init(){
 if(process.env.DATABASE_URL)pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
 else {const SQL=await initSqlJs();sqlite=new SQL.Database(fs.existsSync(sqlitePath)?fs.readFileSync(sqlitePath):undefined);}
 await run('CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(collection,id))');
}
function persist(){if(sqlite){const tmp=sqlitePath+'.tmp';fs.writeFileSync(tmp,Buffer.from(sqlite.export()));fs.renameSync(tmp,sqlitePath);}}
async function run(sql,params=[]){if(pool)return (context.getStore()?.client||pool).query(sql.replace(/\?/g,(()=>{let i=0;return()=>'$'+ ++i;})()),params);sqlite.run(sql,params);}
async function rows(sql,params=[]){if(pool)return (await (context.getStore()?.client||pool).query(sql.replace(/\?/g,(()=>{let i=0;return()=>'$'+ ++i;})()),params)).rows;const stmt=sqlite.prepare(sql);try{stmt.bind(params);const out=[];while(stmt.step())out.push(stmt.getAsObject());return out;}finally{stmt.free();}}
export async function all(collection){return (await rows('SELECT body FROM records WHERE collection = ?',[collection])).map(r=>JSON.parse(r.body));}
export async function get(collection,id){const r=await rows('SELECT body FROM records WHERE collection = ? AND id = ?',[collection,id]);return r[0]?JSON.parse(r[0].body):null;}
export async function put(collection,value){await run('INSERT INTO records(collection,id,body) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET body=excluded.body',[collection,value.id,JSON.stringify(value)]);if(!inTransaction)persist();return value;}
export async function remove(collection,id){await run('DELETE FROM records WHERE collection = ? AND id = ?',[collection,id]);if(!inTransaction)persist();}
let inTransaction=false,queue=Promise.resolve();
export function transaction(fn){const result=queue.then(async()=>{const client=pool?await pool.connect():null;return context.run({client},async()=>{inTransaction=true;await run('BEGIN');try{const value=await fn();await run('COMMIT');persist();return value;}catch(e){await run('ROLLBACK');throw e;}finally{inTransaction=false;client?.release();}});});queue=result.catch(()=>{});return result;}
