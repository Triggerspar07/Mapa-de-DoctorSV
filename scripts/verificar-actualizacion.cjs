'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {catalogs,code,coordinateReason}=require('./actualizacion.cjs');
const [branchesPath,catalogPath,keyPath]=process.argv.slice(2);
if(!keyPath)throw Error('Uso: node scripts/verificar-actualizacion.cjs SUCURSALES CATALOGO CLAVE_LOCAL');
const parse=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const incoming=parse(branchesPath),html=fs.readFileSync('index.html','utf8');
const line=html.split(/\r?\n/).find(l=>l.startsWith('const FUENTE_RED_SERVICIOS ='));
const data=JSON.parse(line.slice(line.indexOf('=')+1).trim().replace(/;$/,''));
let verified=0,marks=0;const identityFields=new Set(['Cadena','Proveedor','Código','Codigo','Nombre','Nombre Establecimiento','Dirección','Municipio','Departamento','Distrito','Latitud','Longitud']);
const ids=new Set();
for(const sheet of ['Farmacias ','Laboratorios','Imagenes','Atenciones presenciales']){
 assert.equal(data[sheet].length,incoming[sheet].length,sheet+' count');
 for(const r of incoming[sheet]){
  const candidates=data[sheet].filter(x=>code(x)===code(r));assert.equal(candidates.length,1,'Código único '+code(r));const out=candidates[0];
  assert(!ids.has(out.IdEstable),'ID repetido');ids.add(out.IdEstable);
  // All source operational fields must survive exactly. Geography alone may have audited corrections.
  for(const [key,value] of Object.entries(r))if(!identityFields.has(key)){assert.deepEqual(out[key],value,sheet+' '+code(r)+' '+key);marks++;}
  // No positive historical mark can survive an absent new source field.
  for(const [key,value] of Object.entries(out))if(['SI','NO','X'].includes(value)&&!identityFields.has(key))assert.equal(value,r[key],sheet+' stale '+key);
  if(out.ubicacionPendiente)assert(out.AuditoriaUbicacion.motivos?.join(' ').length>35,'Motivo concreto '+out.IdEstable);
  else {assert.equal(coordinateReason(out),'','Mapped invalid '+out.IdEstable);assert(['validada_geograficamente','corregida_contrastada','confirmada_fuente_externa','heredada_sin_reconfirmacion_actual'].includes(out.AuditoriaUbicacion.estado));}
  verified++;
 }
}
const ctx={};vm.runInNewContext(fs.readFileSync('assets/catalogos-datos.js','utf8'),ctx);const payload=JSON.parse(JSON.stringify(ctx.DoctorSVCatalogosDatos));const expected=catalogs(parse(catalogPath));assert.deepEqual(payload.publicos,expected.publicos);
const password=fs.readFileSync(keyPath,'utf8').trim();
for(const [key,rows] of [['fase3',expected.medicamentos3],['estudios3',expected.estudios3]]){
 const b=payload.protegidos[key],raw=Buffer.from(b.data,'base64'),cipher=crypto.createDecipheriv('aes-256-gcm',crypto.pbkdf2Sync(password,Buffer.from(b.salt,'base64'),b.iterations,32,'sha256'),Buffer.from(b.iv,'base64'));
 cipher.setAuthTag(raw.subarray(-16));const decoded=JSON.parse(Buffer.concat([cipher.update(raw.subarray(0,-16)),cipher.final()]).toString('utf8'));assert.deepEqual(decoded,rows);
 for(const row of rows){assert(!html.includes(JSON.stringify(row.Descripción)),'Descripción protegida en HTML');assert(!JSON.stringify(payload.publicos).includes(JSON.stringify(row.Descripción)),'Fila reservada en catálogo público');}
}
for(const [key,value] of Object.entries(payload.publicos))for(const row of value)assert(!Object.keys(row).some(k=>/precio|costo/i.test(k)),'Precios en '+key);
for(const file of ['index.html','assets/catalogos-datos.js','reporte-actualizacion-2026-11-04.json','REPORTE-2026-11-04.md'])assert(!fs.readFileSync(file,'utf8').includes(password),'Clave en '+file);
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);
for(const file of ['assets/catalogo-seguro.js','assets/catalogo-nacional.js','assets/enlaces-centros.js'])new vm.Script(fs.readFileSync(file,'utf8'));
const pending=['Farmacias ','Laboratorios','Imagenes','Atenciones presenciales'].flatMap(k=>data[k]).filter(r=>r.ubicacionPendiente);const report=parse('reporte-actualizacion-2026-11-04.json');assert.equal(pending.length,report.pendientes.length);
console.log(JSON.stringify({centrosVerificados:verified,camposOperativosVerificados:marks,ubicacionesPendientes:pending.length,catalogosPublicos:'idénticos a fuente sin precios',cifrado:'ambos catálogos descifran y coinciden con la fuente',sintaxis:'correcta',clave:'ausente del repositorio'}));
