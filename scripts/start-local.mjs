import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT không hợp lệ');
const url=`http://localhost:${port}`;
async function running(){try{const r=await fetch(url+'/api/status',{signal:AbortSignal.timeout(1500)});const s=await r.json();return r.ok&&typeof s.setup==='boolean'&&typeof s.storage==='string';}catch{return false;}}
function open(){console.log('Mở phần mềm: '+url);if(process.platform==='win32')spawn('cmd.exe',['/d','/c','start','',url],{stdio:'ignore',windowsHide:true}).on('error',()=>console.log('Mở đường dẫn trên trong trình duyệt.'));}
function npm(command){const r=spawnSync(process.platform==='win32'?'cmd.exe':'npm',process.platform==='win32'?['/d','/s','/c','npm '+command]:command.split(' '),{stdio:'inherit'});if(r.error)console.error(r.error.message);if(r.status!==0)process.exit(r.status||1);}
if(await running()){open();process.exitCode=0;}
else{
 if(!fs.existsSync('node_modules/express'))npm('ci');
 npm('run build');
 const child=spawn(process.execPath,['server/index.js'],{stdio:'inherit'});
 let ended=false;
 child.on('error',e=>{ended=true;console.error(e.message);process.exitCode=1;});
 child.on('exit',code=>{ended=true;process.exitCode=code||0;});
 process.on('SIGINT',()=>child.kill());
 let ready=false;
 for(let i=0;i<60&&!ended;i++){if(await running()){ready=true;open();break;}await new Promise(r=>setTimeout(r,500));}
 if(!ready&&!ended)console.log('Máy chủ chưa sẵn sàng. Kiểm tra thông báo bên trên.');
}
