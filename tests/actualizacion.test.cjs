const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('../scripts/actualizacion.cjs');
const old={Código:'A',Nombre:'Centro Uno',Proveedor:'Red',Dirección:'Calle Uno 1',Latitud:13.7,Longitud:-89.2,IdEstable:'imagen:A',USG:'X',AuditoriaUbicacion:{estado:'heredada_sin_reconfirmacion_actual'},ubicacionPendiente:false};
test('código reutilizado no hereda coordenadas ni auditoría de otro centro',()=>{
 const {rows}=api.reconcile('imagen',[{...old,Código:'A',Nombre:'Centro Dos',Dirección:'Calle Dos 2',Latitud:13.8,USG:undefined,IdEstable:undefined,AuditoriaUbicacion:undefined}], [old]);
 assert.equal(rows[0].ubicacionPendiente,true); assert.notEqual(rows[0].AuditoriaUbicacion.estado,old.AuditoriaUbicacion.estado);
});
test('cambio de código con misma identidad conserva procedencia sin duplicar',()=>{
 const incoming={...old,Código:'B'};delete incoming.AuditoriaUbicacion;delete incoming.IdEstable;
 const {rows,absent}=api.reconcile('imagen',[incoming],[old]); assert.equal(rows.length,1);assert.equal(rows[0].IdEstable,'imagen:B');assert.equal(rows[0].ubicacionPendiente,false);assert.equal(absent.length,0);
});
test('una capacidad ausente en fuente nueva no hereda la marca previa',()=>{
 const r={...old};delete r.USG;const {rows}=api.reconcile('imagen',[r],[old]);assert.equal(rows[0].USG,undefined);
});
test('longitud positiva, vacíos y coordenadas fuera del país quedan pendientes con motivo específico',()=>{
 for(const [lat,lng,pattern] of [[13.98,89.56,/positiva/i],['',-89.2,/faltan/i],[42,-89.2,/fuera/i]]){
 const {rows}=api.reconcile('imagen',[{...old,Latitud:lat,Longitud:lng}],[]);assert.equal(rows[0].ubicacionPendiente,true);assert.match(rows[0].AuditoriaUbicacion.motivos.join(' '),pattern);
 }
});
test('coordenada corregida se conserva al reintroducir el original sin cambios de dirección',()=>{
 const audited={...old,Latitud:13.71,CoordenadasOriginales:{Latitud:13.7,Longitud:-89.2},AuditoriaUbicacion:{estado:'corregida_contrastada'}};
 const {rows}=api.reconcile('imagen',[old],[audited]);assert.equal(rows[0].Latitud,13.71);assert.equal(rows[0].ubicacionPendiente,false);
});
test('un error original de signo o decimales no sustituye una corrección histórica del mismo centro',()=>{
 const audited={...old,CoordenadasOriginales:{Latitud:1370000,Longitud:89.2},AuditoriaUbicacion:{estado:'corregida_contrastada'}};
 const {rows}=api.reconcile('imagen',[{...old,Latitud:1370000,Longitud:89.2}],[audited]);
 assert.equal(rows[0].ubicacionPendiente,false);assert.equal(rows[0].Latitud,13.7);assert.equal(rows[0].Longitud,-89.2);
});
test('estudios inactivos son restringidos; temporales siguen públicos; nunca incluyen precios',()=>{
 const input={Medicamentos:[{Descripción:'M1',Fase:'FASE 1',Estado:'Activo','Precio Roll Out con IVA':1},{Descripción:'M3',Fase:'FASE 3',Estado:'Inactivo'}],Imagenes:[{Descripción:'I3',Estado:'Inactivo',Costo:42},{Descripción:'IT',Estado:'Inactivo temporal'}],'Laboratorios ':[{Descripción:'L3',Estado:'Inactivo'}],'Atenciones presenciales':[{Descripción:'A3',Estado:'Inactivo'}]};
 const r=api.catalogs(input);assert.equal(r.publicos.Imagenes.length,1);assert.equal(r.estudios3.length,3);assert.equal(r.medicamentos3.length,1);assert.equal(r.publicos.Medicamentos.length,1);assert.doesNotMatch(JSON.stringify(r),/Precio|Costo/);
});
