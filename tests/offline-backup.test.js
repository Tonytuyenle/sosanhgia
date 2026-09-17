import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareBackup,missingBackupImages} from '../offline/backup.js';
const image='data:image/png;base64,aGVsbG8=';
const key='/api/assets/brand/model.png';
test('backup includes referenced main and detail images, excluding accounts',async()=>{
 const state={products:[{image:key,images:key+'\n/api/assets/brand/detail.png'}],brands:[],images:{},users:[{password:'not-for-export'}],seedSync:{seen:['p1']}};
 const visited=[];const directory={async getDirectoryHandle(name){visited.push(name);return this;},async getFileHandle(name){return {getFile:async()=>({name,size:5})};}};
 const payload=await prepareBackup(state,{directoryPicker:async()=>directory,readDataURL:async()=>image});
 assert.equal(Object.keys(payload.images).length,2);assert.equal(payload.images[key],image);assert.ok(visited.includes('data'));assert.equal(payload.users,undefined);assert.deepEqual(payload.seedSync,state.seedSync);assert.deepEqual(state.images,{});
});
test('portable embedded images require no folder access',async()=>{
 const payload=await prepareBackup({products:[{image:key}],brands:[],images:{[key]:image}},{directoryPicker:()=>{throw Error('Should not ask');}});
 assert.equal(payload.images[key],image);
});
test('reject path traversal and incomplete backup instead of claiming images saved',async()=>{
 await assert.rejects(prepareBackup({products:[{image:'/api/assets/../vugia.sqlite'}],images:{}},{directoryPicker:async()=>({})}),/không hợp lệ/);
 await assert.rejects(prepareBackup({products:[{image:key}],images:{}},{directoryPicker:async()=>({getDirectoryHandle:async()=>{throw Object.assign(Error(),{name:'NotFoundError'});},getFileHandle:async()=>{throw Object.assign(Error(),{name:'NotFoundError'});}})}),/Không tìm thấy ảnh/);
 assert.deepEqual(missingBackupImages({products:[{image:'data:image/png;base64,a'}],images:{}}),[]);
});
