(()=>{'use strict';
 const {publicos,protegidos}=DoctorSVCatalogosDatos;
 const session=DoctorSVCatalogoSeguro.createSession(protegidos,crypto);
 const $=id=>document.getElementById(id),dialog=$('catalogoNacional');
 const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valor=(r,k,fallback='Sin dato')=>r[k]===undefined||r[k]===null||String(r[k]).trim()===''?fallback:String(r[k]);
 const control=r=>{const v=normal(valor(r,'Control Especial'));return ['si','x','true'].includes(v)?'Sí':['no','false'].includes(v)?'No':'Sin dato';};
 const grupo=r=>valor(r,'GRUPO',valor(r,'GRUPO TERAPEUTICO','No asignado'));
 const especial=r=>valor(r,'Especialista',valor(r,'Especialidad'));
 let tab='Medicamentos',request=0;
 const protectedTab=()=>Object.hasOwn(protegidos,tab),meds=()=>tab==='Medicamentos'||tab==='fase3';
 const rows=()=>protectedTab()?session.rows():publicos[tab]||[];
 function options(id,values,first){$(id).replaceChildren(new Option(first,''),...Array.from(new Set(values)).sort((a,b)=>a.localeCompare(b,'es')).map(v=>new Option(v,v)));}
 function prepare(){
  const locked=protectedTab()&&!session.isUnlocked(),r=rows();
  $('catAcceso').hidden=!locked;$('catContenido').hidden=locked;$('catBloquear').hidden=!protectedTab();
  $('catAccesoTitulo').textContent=tab==='estudios3'?'Acceso a estudios de Fase 3':'Acceso a medicamentos de Fase 3';
  $('catAccesoNota').textContent=tab==='estudios3'?'Imágenes, laboratorios y atención presencial con estado Inactivo en la fuente. No representan oferta activa.':'Introduce la contraseña para consultar este listado reservado.';
  $('catError').textContent='';$('catClave').value='';$('catBuscar').value='';
  options('catEstado',r.map(x=>valor(x,'Estado')),'Todos los estados');options('catFase',r.map(x=>valor(x,'Fase')),'Todas las fases');
  options('catTipo',r.map(x=>valor(x,'Tipo de estudio')),'Todos los tipos');options('catGrupo',r.map(grupo),'Todos los grupos');
  options('catEspecialista',r.map(especial),'Todos');options('catTratamiento',r.map(x=>valor(x,'Tipo de Tratamiento (tercerias)')),'Todos');options('catConvenio',r.map(x=>valor(x,'CONVENIO')),'Todos');
  $('catControl').value='';$('catControlLabel').hidden=!meds();$('catFaseLabel').hidden=!meds();$('catTratamientoLabel').hidden=!meds();$('catTipoLabel').hidden=tab!=='estudios3';$('catConvenioLabel').hidden=!r.some(x=>x.CONVENIO);
  render();if(locked&&dialog.open)$('catClave').focus();
 }
 function render(){
  const terms=normal($('catBuscar').value).split(/\s+/).filter(Boolean);
  const filters=[['catEstado',r=>valor(r,'Estado')],['catGrupo',grupo],['catEspecialista',especial],['catConvenio',r=>valor(r,'CONVENIO')]];
  if(meds())filters.push(['catFase',r=>valor(r,'Fase')],['catTratamiento',r=>valor(r,'Tipo de Tratamiento (tercerias)')],['catControl',control]);
  if(tab==='estudios3')filters.push(['catTipo',r=>valor(r,'Tipo de estudio')]);
  const all=rows(),filtered=all.filter(r=>terms.every(t=>normal(Object.values(r).join(' ')).includes(t))&&filters.every(([id,value])=>!$(id).value||value(r)===$(id).value));
  const columns=meds()?[['Medicamento','Descripción'],['Estado','Estado'],['Fase','Fase'],['Convenio','CONVENIO'],['Tratamiento (tercerías)','Tipo de Tratamiento (tercerias)'],['Control especial','Control Especial'],['Inyectable','Inyectable'],['Especialista','Especialista'],['Grupo','GRUPO'],['Grupo terapéutico','GRUPO TERAPEUTICO'],['Código P2H','Codigo P2H'],['Código TCA','Codigo TCA'],['Código de barras','Código de Barras']]:[['Estudio / servicio','Descripción'],...(tab==='estudios3'?[['Tipo de estudio','Tipo de estudio']]:[]),['Estado','Estado'],['Especialista / especialidad','Especialista'],['Grupo','GRUPO'],...(['Laboratorios ','estudios3'].includes(tab)?[['Tipo de prueba','TIPO DE PRUEBA']]:[]),['Convenio','CONVENIO'],['Clave artículo','Clave Artículo'],['Clave corta','Clave Corta']];
  $('catHead').innerHTML='<tr>'+columns.map(([label])=>'<th scope="col">'+esc(label)+'</th>').join('')+'</tr>';
  $('catBody').innerHTML=filtered.map(r=>'<tr>'+columns.map(([,key])=>{let v=key==='Control Especial'?control(r):key==='GRUPO'?grupo(r):key==='Especialista'?especial(r):valor(r,key);const cls=({'activo':'activo','inactivo':'inactivo','inactivo temporal':'temporal'}[normal(v)]||'desconocido');return '<td>'+(key==='Estado'?'<span class="cat-status cat-status--'+cls+'">':'')+esc(v)+(key==='Estado'?'</span>':'')+'</td>';}).join('')+'</tr>').join('');
  const unclassified=tab==='fase3'?all.filter(r=>!r.Fase).length:0;
  $('catTotal').textContent=filtered.length+' de '+all.length+' registros'+(unclassified?' · '+unclassified+' sin fase informada, reservado para revisión':'');$('catVacio').hidden=!!filtered.length;
 }
 function select(key){request++;session.select(key);tab=key;$('catDesbloquear').disabled=false;document.querySelectorAll('[data-cat]').forEach(b=>{const active=b.dataset.cat===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active)$('catPanel').setAttribute('aria-labelledby',b.id);});prepare();}
 const btn=document.createElement('button');btn.id='abrirCatalogoNacional';btn.type='button';btn.textContent='Medicamentos y estudios';document.querySelector('.mapas-tabs').after(btn);btn.onclick=()=>{dialog.showModal();prepare();};
 $('catCerrar').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{request++;session.close();select('Medicamentos');$('catClave').value='';});
 document.querySelectorAll('[data-cat]').forEach(b=>{b.onclick=()=>select(b.dataset.cat);b.onkeydown=e=>{const buttons=[...document.querySelectorAll('[data-cat]')],i=buttons.indexOf(b);let next;if(e.key==='ArrowRight')next=(i+1)%buttons.length;else if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else return;e.preventDefault();select(buttons[next].dataset.cat);buttons[next].focus();};});
 ['catBuscar','catEstado','catFase','catGrupo','catEspecialista','catTratamiento','catConvenio','catControl','catTipo'].forEach(id=>$(id).addEventListener('input',render));
 $('catBloquear').onclick=()=>{request++;session.lock();prepare();};
 $('catAcceso').onsubmit=async e=>{e.preventDefault();const token=++request,password=$('catClave').value;$('catClave').value='';$('catDesbloquear').disabled=true;$('catError').textContent='';try{if(await session.unlock(password)){if(token===request&&dialog.open)prepare();}}catch(err){if(token===request)$('catError').textContent='No se pudo desbloquear. Comprueba la contraseña y usa una conexión HTTPS.';}finally{if(token===request)$('catDesbloquear').disabled=false;}};
 new MutationObserver(()=>{btn.hidden=$('tabDemo').getAttribute('aria-selected')==='true';}).observe($('tabDemo'),{attributes:true,attributeFilter:['aria-selected']});
})();
