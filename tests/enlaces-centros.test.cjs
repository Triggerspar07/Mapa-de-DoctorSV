const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={URLSearchParams};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/enlaces-centros.js'),'utf8'),context);
const resolve=(query,rows)=>JSON.parse(JSON.stringify(context.DoctorSVEnlaces.resolve(query,rows)));
const row={id:'farmacia:E10F1506',tipo:'farmacia',codigo:'E10F1506',nombre:'FARMACIA EL CARMEN',activo:true,ubicada:true};

test('resuelve la farmacia exacta por código y nombre, independientemente de mayúsculas y acentos',()=>{
  assert.deepEqual(resolve('?centro=farmacia%3AE10F1506&nombre=Farmacia+El+Carmen',[row]),{status:'found',branch:row});
});
test('inactivas y pendientes de ubicación siguen abriendo su ficha por identidad',()=>{
  const inactive={...row,activo:false,ubicada:false};
  assert.equal(resolve('?centro=farmacia:E10F1506',[inactive]).branch.id,row.id);
});
test('no abre otra farmacia si el código fue reutilizado con un nombre distinto',()=>{
  assert.equal(resolve('?centro=farmacia:E10F1506&nombre=Otra+farmacia',[row]).status,'mismatch');
});
test('el código anterior de una farmacia corregida abre la misma ficha con su código vigente',()=>{
  const brasil={...row,id:'farmacia:E10F0420',codigo:'E10F0420',codigoAnterior:'E10F420',nombre:'FARMACIAS BRASIL N° 08'};
  assert.equal(resolve('?centro=farmacia:E10F420&nombre=Farmacias+Brasil+N%C2%B0+08',[brasil]).branch.id,brasil.id);
  assert.equal(resolve('?centro=farmacia:E10F420&nombre=Otra',[brasil]).status,'mismatch');
});
test('no escoge arbitrariamente cuando dos registros comparten código',()=>{
  const other={...row,id:'farmacia:E10F1506:copia-2',nombre:'Otra farmacia'};
  assert.equal(resolve('?centro=farmacia:E10F1506',[row,other]).status,'ambiguous');
  assert.equal(resolve('?centro=farmacia:E10F1506&nombre=Otra+farmacia',[row,other]).branch.id,other.id);
});
test('distingue acceso normal, enlace inválido y código desconocido',()=>{
  assert.equal(resolve('',[row]).status,'none');
  assert.equal(resolve('?centro=javascript:alert(1)',[row]).status,'invalid');
  assert.equal(resolve('?centro=farmacia:INEXISTENTE',[row]).status,'missing');
});
test('el controlador usa la selección existente y avisa sin seleccionar para identidades contradictorias',()=>{
  let selected=null,message=null;
  context.DoctorSVEnlaces.open('?centro=farmacia:E10F1506',[row],id=>selected=id,text=>message=text);
  assert.equal(selected,row.id);assert.equal(message,null);
  selected=null;
  context.DoctorSVEnlaces.open('?centro=farmacia:E10F1506&nombre=Otra',[row],id=>selected=id,text=>message=text);
  assert.equal(selected,null);assert.ok(message);
});

test('el punto se centra en el espacio libre a la izquierda del panel de escritorio',()=>{
  const offset=context.DoctorSVEnlaces.visibleOffset({left:300,top:100,right:1100,bottom:700},{left:700,top:100,right:1100,bottom:700},{x:400,y:300});
  assert.deepEqual(Array.from(offset),[200,0]);
});
test('el punto se centra encima de la ficha móvil y un panel externo no desplaza el mapa',()=>{
  const rect={left:0,top:100,right:400,bottom:800},point={x:200,y:350};
  assert.deepEqual(Array.from(context.DoctorSVEnlaces.visibleOffset(rect,{left:0,top:450,right:400,bottom:800},point)),[0,175]);
  assert.deepEqual(Array.from(context.DoctorSVEnlaces.visibleOffset(rect,{left:450,top:100,right:800,bottom:700},point)),[0,0]);
});
