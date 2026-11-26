# Revisión de ubicaciones y agrupación por zoom · 25/11/2026

Fuente y búsqueda del 25/11/2026; HTML actualizado el 26/11/2026.

Esta revisión sustituye el resultado de pendientes de pin del reporte anterior del mismo día. Se revisaron los **8 centros activos** y los **9 de otros estados** que entonces no se representaban. Se consultó nuevamente el roll out, directorios propios y de aseguradoras, registros CNR/SRS, nueve registros actuales del CSSP mediante su buscador público y fuentes cartográficas/de comercios del mismo inmueble. Se buscaron nombres, teléfonos y direcciones; las búsquedas sin coincidencia útil no se contabilizan como confirmaciones.

## Resultado y límites

- 1.193 centros representados, incluidos 984 activos; ningún registro queda sin representación cartográfica.
- **53 ubicaciones de referencia** conservan validación pendiente. No se afirma que todas las puertas estén confirmadas.
- Las referencias no tienen círculos amarillos, contorno especial, prefijos en el marcador ni listas laterales diferenciadas. Su condición aparece únicamente en la **ficha**, dentro de **UBICACIÓN DE REFERENCIA · PENDIENTE DE VALIDAR**, con **Ver qué falta validar** cerrado por defecto.
- Las referencias de una hoja, de un inmueble y de un tramo de dirección se distinguen en el motivo. Las coordenadas válidas declaradas de sedes con conflicto de código/domicilio se muestran como referencias solicitadas por el usuario; no se certifica que sean el local vigente.
- Las referencias siguen excluidas de los cálculos de ruta del mapa oficial. Mostrar un punto no acredita apertura ni estado regulatorio.

## Hallazgos concretos

- **Cristal 20 / E10F3381:** [Aeroflash](https://aeroflash.online/aeroflashgo/?p=goSucursales) identifica Cristal 20 de **El Triunfo**, teléfono **77599260**, igual al roll out. Se corrige distrito/municipio a El Triunfo, Usulután Norte, conservando el punto de la hoja como referencia. La Cristal 20 de Corinto del directorio de la cadena tiene otra dirección y teléfono, por lo que no se traslada esta ficha a Corinto. Falta confirmar la esquina/puerta y la numeración de avenida.
- **PRORAD 59:** el [aviso de la unidad](https://www.findhealthclinics.org/SV/Puerto-la-Libertad/112037235135506/Puerto-de-La-Libertad-Prorad) y la hoja apuntan a The Point. El [directorio de The Coffee Cup](https://www.thecoffeecup.com.sv/frontend/sucursales.php), comercio del mismo inmueble, publica un [enlace de The Point](https://maps.app.goo.gl/1dn6vAWWFs2jX5FQA) cuyo destino contiene 13.4879,-89.3474879. Se usa ese punto **de inmueble** como referencia y se descarta el antiguo del Puerto. No confirma la puerta 3A ni que haya terminado la interrupción temporal anunciada por PRORAD.
- **Santa Elena 797:** la [consulta CSSP actual](https://www.cssp.gob.sv/establecimientos/faces/lista.xhtml) identifica la sucursal 2 en **Santa Ana**, 13 calle oriente entre avenida Independencia y tercera avenida sur, no en Ahuachapán. Se representa como referencia aproximada el punto medio del [tramo cartográfico](https://www.openstreetmap.org/way/409898272) que une ambas avenidas. No se presenta como coordenada de puerta. CSSP y OSM difieren en la orientación Oriente/Poniente; esa nomenclatura y el traslado/historial siguen por validar.
- **Minero R 2282:** la consulta CSSP actual confirma Residencial Miramar 2, San Juan Nonualco. Ya no se utiliza como conflicto vigente la antigua dirección de Escalón. Continúan por validar la puerta y el polígono 1734 del registro frente a 1724 de la hoja; el pin es referencia.
- **Santa María San Miguel:** [CNR](https://www.cnr.gob.sv/documentos/rc/julio_agosto_2016/Asientos_de_Matricula_de_Empresa_1a_vez_julio_agosto_2016.pdf) respalda el domicilio 9a avenida sur 108-B. El [directorio de la cadena](https://farmaciacristal.com/index.php/sucursales/) publica Santa María 2 con número 513-A y otro teléfono. Se representa la hoja como referencia y se conserva la validación de renumeración/identidad, sin inventar un traslado confirmado.
- **La Esperanza Tacuba:** [un comercio vecino](https://www.ciberonline.com/ubicacion/index.html) confirma la referencia local de la farmacia en la salida a San Juan; no aporta el punto exacto de su puerta. Se representa el punto declarado y se mantiene la validación de entrada y contacto.
- **Metapaneco 537:** un [directorio con el mismo teléfono](https://www.todosbiz.com/SV/laboratorio-cl%C3%ADnico-metapaneco-2402-4125) respalda identidad/localidad; CSSP actual mantiene otra nomenclatura del Callejón El Tamarindo. El [hospital](https://hospitalmetapaneco.com/) describe la sucursal 1, que no se utiliza para sustituir la sede 537.
- **Concepción 551 / imágenes 421A / atención 551AP:** se consultaron registros actuales por categoría. CSSP 551 de laboratorio indica cuarta avenida norte 29 y CSSP 421 de laboratorio indica Roosevelt Oriente 24. Eso no confirma por sí solo la sede de imágenes 421A ni la atención 551AP. Sus puntos declarados se representan como referencias separadas y las contradicciones permanecen dentro de cada ficha.
- **Retirados:** las ubicaciones de La Buena 53/79, La Joya, Testlab y CLIDESSA se conservan como referencias históricas de las fichas retiradas, sin convertirlas en una sucursal vigente homónima. Los casos se documentan individualmente en el informe JSON y en el CSV.

## Agrupación por zoom

Se incorpora Leaflet.markercluster 1.5.3 localmente, con su licencia MIT. Al alejar se ven grupos numéricos y al acercar se despliegan sus establecimientos. El número suma **centros**, incluso cuando un marcador base ya representa varios centros del mismo inmueble.

La agrupación visual por proximidad no fusiona identidades ni acredita direcciones compartidas. La agrupación anterior de una misma dirección conserva su selector individual. En el zoom máximo se pueden separar coincidencias; búsquedas, enlaces directos, filtros y fichas siguen encontrando el centro exacto. Si el complemento no carga, permanece la capa ordinaria de centros.

Sólo el mapa oficial usa esta agrupación; el código propio de demostración y los catálogos cifrados quedan intactos. Atlas sincroniza las 446 farmacias y elimina también la marca visual de referencia fuera de la ficha.

## Verificación

- 33 pruebas de DoctorSV y 20 de Atlas.
- 1.193 identificadores únicos; estados, nombres, teléfonos, horarios y servicios conservados respecto de la actualización de la hoja.
- Concordancia de coordenadas y clasificación administrativa de las 446 farmacias entre proyectos.
- Navegador: 984 centros activos representados en la capa; vista nacional con 22 agrupaciones y sin círculos amarillos. En una muestra fija de 52 marcadores de Colonia Médica, se pasa de 1 agrupación en zoom 11 a 33 grupos/puntos en zoom 16.
- Clic en un grupo acerca el mapa sin crear un origen; la búsqueda revela el marcador elegido; el detalle de referencia es plegable y cerrado por defecto, también en móvil.
- El filtro de retiradas permanece independiente de inactivas y los enlaces a retiradas funcionan.

[Revisión individual y fuentes](revision-ubicaciones-y-zoom-2026-11-25.json) · [Referencias vigentes y qué falta validar](referencias-vigentes-2026-11-25.csv).
