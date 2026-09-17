const internalPrefix='/api/assets/';
const embeddedImage=value=>/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value||'');
export function missingBackupImages(state){
 const refs=new Set();
 for(const p of state.products)for(const value of [p.image,p.packaging,...String(p.images||'').split('\n')]){
  const src=String(value||'').trim();
  if(src.startsWith(internalPrefix)&&!embeddedImage(state.images?.[src]))refs.add(src);
 }
 return [...refs];
}
async function findImage(directory,relative){
 // Users may select the project directory, data/, or assets/ itself.
 for(const prefix of [['data','assets'],['assets'],[]]){
  try{
   let folder=directory;const parts=[...prefix,...relative];
   for(const part of parts.slice(0,-1))folder=await folder.getDirectoryHandle(part);
   const handle=await folder.getFileHandle(parts.at(-1));return await handle.getFile();
  }catch(e){if(!['NotFoundError','TypeMismatchError'].includes(e.name))throw e;}
 }
 throw Error('Không tìm thấy ảnh '+relative.join('/')+'. Chọn thư mục dự án có data/assets.');
}
const readDataURL=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
export async function prepareBackup(state,options={}){
 const missing=missingBackupImages(state),images={...state.images};
 if(missing.length){
  const picker=options.directoryPicker||(globalThis.showDirectoryPicker&&(()=>globalThis.showDirectoryPicker({id:'vugia-backup-images',mode:'read'})));
  if(!picker)throw Error('Để sao lưu kèm ảnh, mở bản BAN-OFFLINE/index.html hoặc dùng Chrome/Edge có hỗ trợ chọn thư mục.');
  const directory=await picker();
  for(const src of missing){
   const parts=src.slice(internalPrefix.length).split('/');
   if(parts.some(p=>!p||p==='.'||p==='..'||/[\\:%\u0000]/.test(p))||! /\.(png|jpg|jpeg|webp|gif)$/i.test(parts.at(-1)))throw Error('Đường dẫn ảnh không hợp lệ: '+src);
   const file=await findImage(directory,parts);
   if(file.size>30*1024*1024)throw Error('Ảnh vượt quá 30 MB: '+file.name);
   const data=await (options.readDataURL||readDataURL)(file);
   if(!embeddedImage(data))throw Error('Tệp không phải ảnh được hỗ trợ: '+file.name);
   images[src]=data;
  }
 }
 // Keep business data only. Never serialize browser sessions or server accounts.
 const payload={format:'vugia-offline',version:1,at:new Date().toISOString(),products:state.products,brands:state.brands,images};
 for(const key of ['matches','weights','opportunities','proposals','follows','imports','seedSync'])if(state[key]!==undefined)payload[key]=state[key];
 return payload;
}
