const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('function coincideToken('),html.indexOf('function renderResultadosBuscarSucursal('));
const rows=[
 {id:'zaragoza',nombre:'Farmacia Zaragoza',cadena:'Cristal',distrito:'Zaragoza',departamento:'La Libertad',tipo:'farmacia'},
 {id:'tacuba',nombre:'Farmacia Tacuba',direccion:'Calle de la estación',departamento:'Ahuachapán',tipo:'farmacia'},
 {id:'imagen',nombre:'Centro Médico',servicios:['TAC de cráneo','ECG','USG abdominal','MAPA'],tipo:'imagen'},
 {id:'lab',nombre:'Laboratorio San José',servicios:['Hemograma completo'],tipo:'laboratorio'},
 {id:'demo',nombre:'Farmacia Demo',cadena:'Demo',tipo:'farmacia',demo:true}
];
function search(query,allowed=rows){
 const context={SUCURSALES:rows,universoBusqueda:()=>allowed,normalizarTexto:s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(),MEDICAMENTOS_FASE2:{Demo:[{nombre:'Acetaminofén'}]},INDICE_PRUEBAS_ESPECIALES:[{sucursal:rows[3],pruebas:['Ferritina sérica']}]};
 vm.createContext(context);vm.runInContext(code,context);
 return JSON.parse(JSON.stringify(context.buscarSucursalesTexto(query)));
}
const ids=q=>search(q).map(r=>r.sucursal.id);
test('encuentra nombres, cadenas y ubicaciones con palabras de una a cuatro letras',()=>{
 for(const q of ['z','za','zar','zara','zaragoza','cr','cris','lib'])assert(ids(q).includes('zaragoza'),q);
 assert.deepEqual(ids('farm zara'),['zaragoza']);
});
test('encuentra servicios y pruebas especiales mientras se escribe',()=>{
 assert.deepEqual(ids('hemo'),['lab']);assert.equal(search('ferr')[0].coincideCon.tipo,'prueba_especial');
 assert.deepEqual(ids('san jo'),['lab']);
});
test('las siglas médicas completas no coinciden con nombres de lugares ni fragmentos internos',()=>{
 for(const q of ['TAC','ECG','USG','MAPA'])assert.deepEqual(ids(q),['imagen'],q);
 assert.deepEqual(ids('tac cra'),['imagen']);assert(!ids('tac').includes('tacuba'));
});
test('mantiene búsqueda sin tildes, mayúsculas ni espacios adicionales',()=>{
 assert.deepEqual(ids('  SAN   JO  '),['lab']);assert.deepEqual(ids('centro med'),['imagen']);
});
test('los resultados parciales respetan el universo filtrado por ubicación y tipo',()=>{
 assert.deepEqual(search('farm',rows.slice(0,1)).map(r=>r.sucursal.id),['zaragoza']);
 assert.deepEqual(search('zara',rows.slice(1)),[]);assert.deepEqual(search('ferr',rows.slice(0,1)),[]);
});
test('conserva el alcance de medicamentos de demostración',()=>{
 assert.deepEqual(ids('acet'),['demo']);assert.deepEqual(search('acet',rows.filter(r=>!r.demo)),[]);
});
test('consultas vacías y signos de expresiones regulares no producen errores ni coincidencias falsas',()=>{
 for(const q of ['','   ','[','(','.','*','\\'])assert.deepEqual(search(q),[],q);
});
