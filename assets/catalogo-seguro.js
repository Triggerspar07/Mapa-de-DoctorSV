(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DoctorSVCatalogoSeguro=api;})(globalThis,function(){
 'use strict';
 function createSession(blobs,cryptoApi){
  let current=null,records=[],version=0,unlocked=false;
  function clear(){version++;records=[];unlocked=false;}
  return {
   select(key){clear();current=key;},close(){clear();current=null;},lock:clear,
   rows:()=>records,isUnlocked:()=>unlocked,
   async unlock(password){
    const token=++version,keyName=current,blob=blobs[keyName];if(!blob)throw Error('Catálogo no protegido');
    const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    const base=await cryptoApi.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
    const key=await cryptoApi.subtle.deriveKey({name:'PBKDF2',salt:bytes(blob.salt),iterations:blob.iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    const plain=await cryptoApi.subtle.decrypt({name:'AES-GCM',iv:bytes(blob.iv)},key,bytes(blob.data));
    if(token!==version||keyName!==current)return false;
    const value=JSON.parse(new TextDecoder().decode(plain));if(!Array.isArray(value))throw Error('Formato de catálogo no válido');
    records=value;unlocked=true;return true;
   }
  };
 }
 return {createSession};
});
