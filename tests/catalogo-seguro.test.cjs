const {test}=require('node:test'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const {encrypt}=require('../scripts/actualizacion.cjs');
const api=require('../assets/catalogo-seguro.js');
test('descifra solo con contraseña correcta y bloquea al cerrar o cambiar de pestaña',async()=>{
 const blobs={estudios3:encrypt([{Descripción:'Estudio reservado'}],'clave de prueba')};
 const s=api.createSession(blobs,webcrypto);s.select('estudios3');
 await assert.rejects(s.unlock('incorrecta'));assert.equal(s.rows().length,0);
 assert.equal(await s.unlock('clave de prueba'),true);assert.equal(s.rows()[0].Descripción,'Estudio reservado');
 s.select('Imagenes');assert.equal(s.rows().length,0);
 s.select('estudios3');assert.equal(s.rows().length,0);
 await s.unlock('clave de prueba');s.close();assert.equal(s.rows().length,0);
});
test('un descifrado que termina después de cerrar no repone datos',async()=>{
 const s=api.createSession({estudios3:encrypt([{Descripción:'privado'}],'clave')},webcrypto);s.select('estudios3');
 const pending=s.unlock('clave');s.close();assert.equal(await pending,false);assert.equal(s.rows().length,0);
});
