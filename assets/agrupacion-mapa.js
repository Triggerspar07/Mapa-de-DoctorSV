/* Agrupación visual por zoom. Los registros y los grupos de una misma dirección conservan su identidad. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DoctorSVAgrupacion=factory();})(globalThis,function(){
  'use strict';
  function numeroCentros(markers){return markers.reduce((total,marker)=>total+(Number.isInteger(marker._doctorSVCount)&&marker._doctorSVCount>0?marker._doctorSVCount:1),0);}
  function radio(zoom){return zoom<=9?70:zoom<=12?52:zoom<=15?38:24;}
  function crearCapa(L){
    if(!L.markerClusterGroup)return L.layerGroup();
    return L.markerClusterGroup({maxClusterRadius:radio,showCoverageOnHover:false,zoomToBoundsOnClick:true,spiderfyOnMaxZoom:true,removeOutsideVisibleBounds:true,animate:false,animateAddingMarkers:false,
      iconCreateFunction(cluster){const count=numeroCentros(cluster.getAllChildMarkers()),size=count>=100?50:count>=10?44:38;
        return L.divIcon({className:'mapa-cluster',html:'<span role="img" aria-label="'+count+' centros. Acerca el mapa para verlos." title="'+count+' centros; acerca para ver las sucursales">'+count+'</span>',iconSize:[size,size],iconAnchor:[size/2,size/2]});}
    });
  }
  return {numeroCentros,radio,crearCapa};
});
