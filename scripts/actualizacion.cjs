'use strict';
const crypto=require('node:crypto');
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const code=r=>String(r['Código']??r.Codigo??'').trim();
const name=r=>r.Nombre??r['Nombre Establecimiento']??'';
const coord=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
const identity=(a,b)=>normalize(name(a))===normalize(name(b))&&normalize(a.Proveedor)===normalize(b.Proveedor);
const sameAddress=(a,b)=>normalize(a.Dirección)===normalize(b.Dirección);
function coordinateReason(r){
 const lat=coord(r.Latitud),lng=coord(r.Longitud);
 if(!Number.isFinite(lat)||!Number.isFinite(lng))return 'Faltan coordenadas numéricas completas en el archivo recibido. Se necesita latitud y longitud del establecimiento.';
 if(lng>0)return 'La longitud es positiva ('+lng+'); El Salvador utiliza longitudes negativas. El punto recibido queda fuera del país. Se requiere corroborar el signo y la dirección antes de corregirlo.';
 if(lat<13.1||lat>14.5||lng< -90.15||lng> -87.6)return 'Coordenadas fuera del rango geográfico de El Salvador: '+lat+', '+lng+'. Se requiere corregir el punto con evidencia del establecimiento.';
 return '';
}
function distance(a,b){const x=(coord(a.Longitud)-coord(b.Longitud))*108000,y=(coord(a.Latitud)-coord(b.Latitud))*111000;return Math.hypot(x,y);}
function reconcile(tipo,incoming,previous,{previousSource=[],fecha='2026-11-04',fuente='Sucursales roll out 4-11-2026.json'}={}){
 const matched=new Set(),changes=[];
 const sourceByCode=new Map(previousSource.map(row=>[code(row),row]));
 const rows=incoming.map((input,index)=>{
  const r={...input};
  let candidates=previous.filter(o=>code(o)===code(r)&&identity(o,r));
  if(!candidates.length)candidates=previous.filter(o=>identity(o,r)&&sameAddress(o,r));
  // A name edit can keep identity only with the same code, provider and full address.
  if(!candidates.length)candidates=previous.filter(o=>code(o)===code(r)&&normalize(o.Proveedor)===normalize(r.Proveedor)&&sameAddress(o,r));
  const old=candidates.length===1?candidates[0]:null;
  if(old)matched.add(old);
  r.IdEstable=tipo+':'+encodeURIComponent(code(r)||'sin-codigo-'+(index+1));
  r.CoordenadasOriginales={Latitud:input.Latitud??null,Longitud:input.Longitud??null};
  r.AuditoriaActualizacion={fecha,fuente,fila:index+1,codigoAnterior:old?code(old):null};
  let reason=coordinateReason(r);
  const auditable=old&&['validada_geograficamente','corregida_contrastada','confirmada_fuente_externa','heredada_sin_reconfirmacion_actual'].includes(old.AuditoriaUbicacion?.estado);
  if(old){
   r.AuditoriaUbicacion=structuredClone(old.AuditoriaUbicacion||{});
   const oldSource=sourceByCode.get(code(old));
   const previousAddress=old.AuditoriaActualizacion?.direccionFuente??(oldSource&&identity(old,oldSource)?oldSource.Dirección:old.Dirección);
   const sameSourceAddress=sameAddress({Dirección:previousAddress},r);
   const original=old.CoordenadasOriginales;
   const sameOriginal=original&&['Latitud','Longitud'].every(key=>String(original[key]??'').trim()===String(r[key]??'').trim());
   const closeToOriginal=distance(original||{},r)<=5;
   if(!r.Distrito&&old.Distrito){r.Distrito=old.Distrito;r.DistritoPendiente=!!old.DistritoPendiente;}
   // Full address is unchanged: preserve an audited correction even when the source repeats its old coordinate.
   if((sameAddress(old,r)||sameSourceAddress)&&auditable&&!old.ubicacionPendiente&&!coordinateReason(old)&&((!reason&&distance(old,r)<=100)||sameOriginal||closeToOriginal)){
    r.Latitud=old.Latitud;r.Longitud=old.Longitud;r.ubicacionPendiente=false;
    if(sameSourceAddress&&(sameOriginal||closeToOriginal)&&!sameAddress(old,r)){
     r.AuditoriaActualizacion.direccionFuente=r.Dirección;
     r.Dirección=old.Dirección;
    }
    for(const k of ['Distrito','DistritoPendiente','Municipio','Departamento','GrupoUbicacion','EvidenciaGrupo'])if(old[k]!==undefined)r[k]=old[k];
   }else{
    r.ubicacionPendiente=true;
    reason=reason||(old.ubicacionPendiente&&sameSourceAddress?(old.AuditoriaUbicacion?.motivos||[]).join(' '):'')||(!(sameAddress(old,r)||sameSourceAddress)?'La dirección cambió respecto de la ubicación auditada. Falta confirmar si es un traslado o una corrección de texto; no se reutiliza el punto anterior.':'Las coordenadas requieren un nuevo contraste con la dirección y el local vigente.');
   }
  }else{
   r.ubicacionPendiente=true;
   reason=reason||(candidates.length>1?'La identidad coincide con varios registros anteriores. Falta resolver el establecimiento exacto.':previous.some(o=>code(o)===code(r))?'El código fue reutilizado para un nombre o dirección diferente. No se hereda el punto de la sucursal anterior.':'Centro incorporado sin una ubicación previamente auditada. Las coordenadas tienen formato válido, pero falta contrastar el punto con la dirección y la identidad del establecimiento.');
  }
  if(r.ubicacionPendiente){r.AuditoriaUbicacion={...(r.AuditoriaUbicacion||{}),estado:'pendiente',fechaRevision:fecha,motivo:reason,motivos:[reason],coordenadasConfirmadasExternamente:false};delete r.GrupoUbicacion;}
  changes.push({id:r.IdEstable,codigo:code(r),nombre:name(r),nuevo:!old,codigoAnterior:old?code(old):null,estadoAnterior:old?.Estatus??old?.Status??null,estado:r.Estatus??r.Status,pendiente:r.ubicacionPendiente});
  return r;
 });
 return {rows,changes,absent:previous.filter(r=>!matched.has(r))};
}
function catalogs(source){
 // Positive allowlist: costs and unrelated spreadsheet helper columns never enter the application.
 const fields=['Codigo P2H','Codigo TCA','Código de Barras','Descripción','Estado','Tipo de Tratamiento (tercerias)','Control Especial','Inyectable','Especialista','GRUPO','GRUPO TERAPEUTICO','Tipo de inventario','Fase','CONVENIO','Clave Artículo','Clave Corta','TIPO DE PRUEBA','Especialidad'];
 const clean=r=>Object.fromEntries(fields.filter(k=>Object.keys(r).some(x=>x.trim()===k)).map(k=>[k,r[Object.keys(r).find(x=>x.trim()===k)]]));
 const publicos={},medicamentos3=[],estudios3=[];
 for(const key of ['Medicamentos','Imagenes','Laboratorios ','Atenciones presenciales']){
  publicos[key]=[];
  for(const raw of source[key]||[]){const r=clean(raw);
   if(key==='Medicamentos'){
    if(['FASE1','FASE2'].includes(normalize(r.Fase)))publicos[key].push(r);
    else medicamentos3.push(r);
   }else if(normalize(r.Estado)==='INACTIVO')estudios3.push({...r,'Tipo de estudio':key.trim(),'Fase':'FASE 3'});
   else publicos[key].push(r);
  }
 }
 return {publicos,medicamentos3,estudios3};
}
function encrypt(value,password){
 const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12),iterations=600000;
 const key=crypto.pbkdf2Sync(password,salt,iterations,32,'sha256');const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final(),cipher.getAuthTag()]);
 return {salt:salt.toString('base64'),iv:iv.toString('base64'),data:data.toString('base64'),iterations};
}
module.exports={normalize,code,name,coordinateReason,reconcile,catalogs,encrypt};
