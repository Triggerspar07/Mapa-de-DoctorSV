/* Enlaces desde el explorador territorial; no contienen coordenadas ni credenciales. */
globalThis.DoctorSVEnlaces=(()=>{
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function resolve(search,rows){
    const params=new URLSearchParams(search);
    const target=params.get('centro');
    if(target===null)return {status:'none'};
    const match=/^farmacia:([A-Za-z0-9_-]{1,80})$/.exec(target);
    if(!match)return {status:'invalid'};
    const pharmacies=rows.filter(row=>row.tipo==='farmacia');
    const exact=pharmacies.filter(row=>String(row.codigo).trim()===match[1]);
    const candidates=exact.length?exact:pharmacies.filter(row=>row.codigoAnterior===match[1]);
    if(!candidates.length)return {status:'missing'};
    const name=params.get('nombre');
    const matches=name?candidates.filter(row=>normalize(row.nombre)===normalize(name)):candidates;
    if(!matches.length)return {status:'mismatch'};
    if(matches.length!==1)return {status:'ambiguous'};
    return {status:'found',branch:matches[0]};
  }
  function showNotice(message){
    const notice=document.createElement('section');
    notice.className='aviso-enlace-centro';notice.setAttribute('role','status');
    notice.style.cssText='position:fixed;top:90px;right:16px;z-index:3000;max-width:min(380px,calc(100vw - 32px));padding:18px;border-radius:12px;background:var(--surface,#fff);color:var(--text,#19334a);border:1px solid var(--border,#b7c7d6);box-shadow:0 8px 24px #0002;font:14px/1.6 sans-serif';
    const text=document.createElement('p');text.textContent=message;text.style.margin='0 0 12px';notice.append(text);
    const close=document.createElement('button');close.type='button';close.textContent='Cerrar aviso';close.style.cssText='padding:8px 12px;cursor:pointer;border:1px solid currentColor;border-radius:6px;color:inherit;background:transparent;font:inherit';
    close.addEventListener('click',()=>notice.remove());notice.append(close);document.body.append(notice);
  }
  function open(search,rows,select,notify=showNotice){
    const result=resolve(search,rows);
    if(result.status==='found')select(result.branch.id);
    else if(result.status!=='none')notify(({
      invalid:'El enlace de la farmacia no es válido. Puedes buscarla por nombre o código.',
      missing:'La farmacia del enlace no está registrada en esta versión de DoctorSV. Puedes buscarla por nombre o código.',
      mismatch:'El código solicitado figura con otro nombre en DoctorSV. Confirma la identidad de la farmacia mediante el buscador.',
      ambiguous:'Hay varias farmacias con el código solicitado. Confirma la sucursal mediante el buscador.'
    })[result.status]);
    return result;
  }
  function visibleOffset(rect,panel,point){
    let left=rect.left,right=rect.right,top=rect.top,bottom=rect.bottom;
    const overlaps=panel.left<right&&panel.right>left&&panel.top<bottom&&panel.bottom>top;
    if(overlaps){
      if(panel.left>left&&panel.right>=right)right=panel.left;
      else if(panel.right<right&&panel.left<=left)left=panel.right;
      else if(panel.top>top&&panel.bottom>=bottom)bottom=panel.top;
      else if(panel.bottom<bottom&&panel.top<=top)top=panel.bottom;
    }
    return [point.x-((left+right)/2-rect.left),point.y-((top+bottom)/2-rect.top)];
  }
  return {resolve,open,visibleOffset};
})();

if(typeof document!=='undefined'&&typeof SUCURSALES!=='undefined'&&typeof seleccionarResultadoBusqueda==='function'){
  DoctorSVEnlaces.open(location.search,SUCURSALES,id=>{
    const panel=document.getElementById('panelDetalle');
    const transition=panel.style.transition;
    panel.style.transition='none';
    const maxHeight=panel.style.maxHeight;
    if(matchMedia('(max-width: 900px)').matches){
      panel.style.maxHeight='50%';
      const onClose=new MutationObserver(()=>{
        if(!panel.classList.contains('abierto')){panel.style.maxHeight=maxHeight;onClose.disconnect();}
      });
      onClose.observe(panel,{attributes:true,attributeFilter:['class']});
    }
    seleccionarResultadoBusqueda(id,{animar:false});
    document.getElementById('resultadosBuscarSucursal').style.display='none';
    const branch=SUCURSALES.find(row=>row.id===id);
    if(branch.ubicada){
      const rect=mapa.getContainer().getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
      const point=mapa.latLngToContainerPoint([branch.lat,branch.lng]);
      mapa.panBy(DoctorSVEnlaces.visibleOffset(rect,panelRect,point),{animate:false});
    }
    panel.style.transition=transition;
  });
}
