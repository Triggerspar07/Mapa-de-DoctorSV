'use strict';
// node scripts/aplicar-actualizacion.cjs SUCURSALES_JSON CATALOGO_JSON AUDITORIA_JSON...
// Los archivos originales y la clave permanecen fuera del repositorio.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {reconcile,catalogs,encrypt,code,name,normalize,coordinateReason}=require('./actualizacion.cjs');
const [branchesPath,catalogPath,...auditPaths]=process.argv.slice(2);
if(!branchesPath||!catalogPath)throw Error('Se necesitan los archivos de sucursales y catálogo');
const parse=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const branches=parse(branchesPath),catalog=catalogs(parse(catalogPath));
const baseline=execFileSync('git',['show','69bb81e205091e1a908e5ea03fe4ba530480317a:index.html'],{encoding:'utf8',maxBuffer:12000000});
const extract=h=>{const l=h.split(/\r?\n/).find(l=>l.startsWith('const FUENTE_RED_SERVICIOS ='));return JSON.parse(l.slice(l.indexOf('=')+1).trim().replace(/;$/,''));};
const previous=extract(baseline),data={},changes=[],absent=[];
const types=[['Farmacias ','farmacia'],['Laboratorios','laboratorio'],['Imagenes','imagen'],['Atenciones presenciales','atencion']];
for(const [sheet,type] of types){const result=reconcile(type,branches[sheet],previous[sheet]);data[sheet]=result.rows;changes.push(...result.changes);absent.push(...result.absent.map(r=>({hoja:sheet,codigo:code(r),nombre:name(r),motivo:'Registro anterior ausente con ese código; el archivo nuevo es la fuente de estados vigente. Se revisan equivalencias por identidad, sin duplicar centros.'})));}
const decisions=auditPaths.flatMap(parse);
for(const decision of decisions){
 const r=data[decision.hoja]?.find(r=>code(r)===String(decision.codigo));if(!r)throw Error('Decisión sin registro: '+JSON.stringify([decision.hoja,decision.codigo]));
 const prior=structuredClone(r.AuditoriaUbicacion||{});
 for(const field of ['Latitud','Longitud','Dirección','Distrito','Municipio','Departamento'])if(decision[field]!==undefined)r[field]=['Latitud','Longitud'].includes(field)?Number(decision[field]):decision[field];
 const located=decision.decision!=='conservar_pendiente';
 if(located&&coordinateReason(r))throw Error('Decisión con coordenada inválida '+decision.codigo);
 r.ubicacionPendiente=!located;if(located&&r.Distrito)r.DistritoPendiente=false;
 r.AuditoriaUbicacion={...prior,estado:!located?'pendiente':decision.decision==='confirmar'?'confirmada_fuente_externa':'corregida_contrastada',fecha:decision.decision==='confirmar'?'2026-11-04':prior.fecha||'2026-10-08',fechaRevision:'2026-11-04',tipoRevision:decision.decision,motivo:decision.motivo,motivos:[decision.motivo],fuentes:decision.fuentes||[],coordenadasConfirmadasExternamente:decision.decision==='confirmar',revisionActual:decision.revisionActual||{fecha:'2026-11-04',alcance:decision.decision==='confirmar'?'Consulta del directorio del proveedor':'Comparación de fuente nueva e historial; se distinguen las consultas web en la evidencia.'}};
}
// AP Vargas declara el mismo establecimiento del laboratorio auditado y sólo cambia el signo.
const vargas=data['Atenciones presenciales'].find(r=>code(r)==='2602AP'),lab=data.Laboratorios.find(r=>code(r)==='2602');
if(vargas&&lab&&!lab.ubicacionPendiente&&normalize(vargas.Proveedor)===normalize(lab.Proveedor)&&normalize(vargas.Dirección)===normalize(lab.Dirección)&&Number(vargas.Latitud)===Number(lab.Latitud)&&Number(vargas.Longitud)===-Number(lab.Longitud)){
 const original={...vargas.CoordenadasOriginales};vargas.Latitud=lab.Latitud;vargas.Longitud=lab.Longitud;vargas.Distrito=lab.Distrito;vargas.Municipio=lab.Municipio;vargas.Departamento=lab.Departamento;vargas.DistritoPendiente=lab.DistritoPendiente;vargas.ubicacionPendiente=false;
 vargas.AuditoriaUbicacion={estado:'corregida_contrastada',fecha:'2026-11-04',tipoRevision:'correccion_mismo_establecimiento',coordenadasConfirmadasExternamente:false,motivo:'El JSON de atención presencial tiene longitud positiva '+original.Longitud+'. Se corrige a '+lab.Longitud+' por coincidencia exacta de proveedor, dirección, latitud y valor absoluto de longitud con Laboratorio Clínico Vargas 2602, cuyo punto ya estaba auditado. Es recuperación de la ubicación del mismo inmueble; no una reconfirmación externa actual.',fuentes:lab.AuditoriaUbicacion?.fuentes||[],referenciaRegistro:'laboratorio:2602',coordenadasOriginalesJson:original};vargas.AuditoriaUbicacion.motivos=[vargas.AuditoriaUbicacion.motivo];
}
// La clasificación administrativa declarada del centro Velliny es Ciudad Arce, no La Libertad Costa.
const velliny=data['Atenciones presenciales'].find(r=>code(r)==='1599AP');if(velliny){velliny.Distrito='CIUDAD ARCE';velliny.Municipio='LA LIBERTAD CENTRO';velliny.Departamento='LA LIBERTAD';velliny.DistritoPendiente=false;}
// Sólo se conservan tablas auxiliares del catálogo público, nunca hojas originales de tarifas.
data.CATALOGOS=Array.from({length:Math.max(catalog.publicos['Laboratorios '].length,catalog.publicos.Imagenes.length)},(_,i)=>({'__EMPTY':catalog.publicos['Laboratorios '][i]?.Descripción||'','__EMPTY_6':catalog.publicos.Imagenes[i]?.GRUPO||''}));
const all=types.flatMap(([sheet])=>data[sheet]),pending=all.filter(r=>r.ubicacionPendiente),states={};
for(const r of all){const s=r.Estatus??r.Status;states[s]=(states[s]||0)+1;}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const summary={total:all.length,estados:states,activosUbicados:all.filter(r=>(r.Estatus??r.Status)==='ACTIVO'&&!r.ubicacionPendiente).length,activosPendientes:all.filter(r=>(r.Estatus??r.Status)==='ACTIVO'&&r.ubicacionPendiente).length,pendientes:pending.length};
data._Auditoria={procesadoEl:'2026-11-04',actualizadoHtmlEl:'2026-11-04',zonaHoraria:'America/El_Salvador',fuenteArchivo:path.basename(branchesPath),sha256Fuente:sha(branchesPath),sha256Catalogo:sha(catalogPath),origenFecha:'Fuente recibida el 04/11/2026. Estados y capacidades proceden del archivo entregado. Se conservan correcciones geográficas documentadas; los casos sin evidencia suficiente permanecen pendientes.',resumenActual:summary,nota:'El catálogo general no acredita disponibilidad por sucursal. Los colores de celdas no se conservan en JSON; se utiliza Estado textual. Las X de modalidades se interpretan según la fuente, sin inferir colores ausentes.'};
let html=fs.readFileSync('index.html','utf8');
html=html.replace(/^const FUENTE_RED_SERVICIOS = .*;\r?$/m,'const FUENTE_RED_SERVICIOS = '+JSON.stringify(data)+';');
fs.writeFileSync('index.html',html);
const secretPath=path.join(process.env.USERPROFILE,'.codex','doctorsv-fase3-20261104.key');
if(!fs.existsSync(secretPath))fs.writeFileSync(secretPath,'Asclepio-'+crypto.randomBytes(12).toString('base64url')+'!',{mode:0o600,flag:'wx'});
const password=fs.readFileSync(secretPath,'utf8').trim();
fs.writeFileSync('assets/catalogos-datos.js','globalThis.DoctorSVCatalogosDatos = '+JSON.stringify({fecha:'2026-11-04',publicos:catalog.publicos,protegidos:{fase3:encrypt(catalog.medicamentos3,password),estudios3:encrypt(catalog.estudios3,password)}})+';\n');
const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const pendingRows=pending.map(r=>({id:r.IdEstable,tipo:types.find(([sheet])=>data[sheet].includes(r))[1],codigo:code(r),nombre:name(r),estado:r.Estatus??r.Status,direccion:r.Dirección,latitudFuente:r.CoordenadasOriginales.Latitud,longitudFuente:r.CoordenadasOriginales.Longitud,motivo:r.AuditoriaUbicacion.motivos.join(' '),fuentes:(r.AuditoriaUbicacion.fuentes||[]).map(f=>f.url).join(' | ')}));
const cols=Object.keys(pendingRows[0]||{});fs.writeFileSync('ubicaciones-pendientes-2026-11-04.csv','\uFEFF'+[cols.map(csvCell).join(','),...pendingRows.map(r=>cols.map(k=>csvCell(r[k])).join(','))].join('\r\n'));
const report={fecha:'2026-11-04',resumen:summary,porTipo:Object.fromEntries(types.map(([sheet])=>[sheet,{total:data[sheet].length,pendientes:data[sheet].filter(r=>r.ubicacionPendiente).length}])),catalogosPublicos:Object.fromEntries(Object.entries(catalog.publicos).map(([k,v])=>[k,v.length])),catalogosProtegidos:{medicamentosFase3:catalog.medicamentos3.filter(r=>normalize(r.Fase)==='FASE3').length,medicamentosSinFase:catalog.medicamentos3.filter(r=>!r.Fase).length,estudiosFase3:catalog.estudios3.length},cambiosEstado:changes.filter(c=>c.estadoAnterior&&c.estado!==c.estadoAnterior),nuevasIdentidades:changes.filter(c=>c.nuevo),codigosAnterioresAusentes:absent,ubicacionesRevisadas:decisions,pendientes:pendingRows};
fs.writeFileSync('reporte-actualizacion-2026-11-04.json',JSON.stringify(report,null,2));
const md=['# Actualización DoctorSV · 4 de noviembre de 2026','',
'Fuente de sucursales y catálogo: JSON entregados por el usuario. Los estados operativos y las capacidades se actualizaron desde esas fuentes. No se publican precios ni costos.',
'','## Centros','',...Object.entries(summary).map(([k,v])=>'- '+k+': '+(typeof v==='object'?JSON.stringify(v):v)),
'','## Catálogos','',...Object.entries(report.catalogosPublicos).map(([k,v])=>'- '+k.trim()+': '+v+' registros públicos.'),'- Fase 3 medicamentos: 117 registros y 1 medicamento sin fase informada, reservado para revisión; no se le asignó fase por suposición.','- Fase 3 estudios: 236 (129 imágenes, 104 laboratorios, 3 atenciones presenciales), todos con estado Inactivo. Los temporales permanecen en su catálogo ordinario.','- Ambos apartados restringidos usan nueva clave de acceso, entregada por separado. AES-256-GCM, PBKDF2-SHA256 con 600000 iteraciones. Bloqueo al cerrar o cambiar de pestaña.','',
'## Ubicaciones','',
'Se revisaron las ubicaciones pendientes comparando identidad, dirección, coordenadas recibidas y auditoría anterior, con consultas públicas adicionales documentadas. Las recuperaciones históricas se distinguen de las verificaciones externas actuales. No se afirma visita física ni geolocalización exacta de los casos pendientes.',
'','La Buena 47, La Buena 95 y Cristal 6 recuperan punto mediante directorios oficiales actuales. Garden Mall se conserva con código 1 y estado RETIRADO; E10F10841 ahora corresponde a Ramblas San Miguel y no recibe el punto de Garden Mall. Vital Puerto cambia de PTE51 a 3109 y RAPIMED AP de 327AP a 2322AP sin duplicación. Vargas AP corrige signo de longitud por coincidencia con la sede de laboratorio previamente auditada.',
'','[Descargar todos los pendientes y sus motivos](ubicaciones-pendientes-2026-11-04.csv). Las fichas y la lista de pendientes también muestran el motivo.',
'','## Alcance de los estudios por centro','',
'Se reemplazaron las capacidades por las marcas del nuevo archivo. SI/X: disponible según la fuente; NO: no disponible; celda ausente: sin dato. Se muestran las pruebas individuales de laboratorio, las modalidades de imagen y los 20 campos de atención presencial. El catálogo nacional no se atribuye completo a un establecimiento. El JSON no conserva el color de las celdas: no permite distinguir una X roja de una X sin color. Para fase 3 se utiliza el Estado textual Inactivo del catálogo según instrucción del usuario.',
'','## Motivos individuales pendientes','',...pendingRows.map(r=>'- **'+r.tipo+' · '+r.codigo+' · '+r.nombre+'** ('+r.estado+'): '+r.motivo),''];
fs.writeFileSync('REPORTE-2026-11-04.md',md.join('\n'));
console.log(JSON.stringify({resumen:summary,porTipo:report.porTipo,catalogos:report.catalogosPublicos,protegidos:report.catalogosProtegidos,cambiosEstado:report.cambiosEstado.length,nuevasIdentidades:report.nuevasIdentidades.length,ausentes:absent}));
