# Mapa
Un mapa con la finalidad de poder brindar una resoluciòn y gestiòn de manera rapida y precisa

Pagina del mapa: https://triggerspar07.github.io/Mapa-de-DoctorSV/

## Actualización del 6 de noviembre de 2026

La red contiene 1 184 centros, 446 farmacias, 326 laboratorios, 177 centros de imagen y 235 de atención presencial. Se usaron las cuatro pestañas de la [hoja Roll Out de sucursales](https://docs.google.com/spreadsheets/d/10Ko3nX_pYL2DHlkLcBniA7ugsgY9HCOv/edit?gid=1558926714). Los códigos se validaron por categoría. El código SRS de Brasil VIII es E10F0420 y los enlaces con E10F420 también abren esa farmacia.

Hay 1 008 activos, 71 inactivos temporales, 34 inactivos y 71 retirados. Ramblas San Miguel figura inactiva porque el registro de la SRS indica suspensión y el Roll Out figura activo. Las [57 ubicaciones pendientes](ubicaciones-pendientes-2026-11-06.csv) conservan ficha y motivo. Se revisó la coherencia de departamento, municipio y distrito con el catálogo territorial. Los distritos sin evidencia suficiente se muestran como pendientes.

Se cotejaron los teléfonos, los tres horarios y todas las marcas de los nueve campos de laboratorio, las siete modalidades de imagen y los veinte procedimientos. Una celda vacía se muestra como «Sin dato» o queda fuera de la lista de disponibles. El catálogo general de medicamentos y estudios sigue su propia fuente.

## Actualización del 4 de noviembre de 2026

La red contiene 1178 centros: 1005 activos, 74 inactivos temporales, 30 inactivos y 69 retirados. Los filtros de cada tipo permiten incluir los centros no activos. Las 54 ubicaciones pendientes conservan una ficha con el motivo y no generan marcadores ni rutas.

- [Informe de actualización y criterios](REPORTE-2026-11-04.md).
- [Listado completo de ubicaciones pendientes](ubicaciones-pendientes-2026-11-04.csv).
- [Auditoría estructurada](reporte-actualizacion-2026-11-04.json).

El catálogo general muestra 240 medicamentos de fases 1 y 2, 101 estudios de imágenes, 69 de laboratorio y 21 atenciones presenciales. Los 236 estudios con estado Inactivo se consultan en **Fase 3 · Estudios**, con contraseña. El apartado de medicamentos reservado contiene 117 de fase 3 y un registro sin fase informada, identificado para revisión. Los inactivos temporales permanecen en su categoría ordinaria.

Los dos apartados de fase 3 utilizan una nueva clave, entregada por separado al responsable. Se cifran con AES-256-GCM y PBKDF2-SHA256, 600000 iteraciones. Cambiar de pestaña, bloquear o cerrar elimina el catálogo descifrado de la sesión. La clave y los archivos originales con tarifas no se publican. No se deben añadir al repositorio.

Las capacidades por centro proceden exclusivamente de sus marcas SI/X/NO del archivo de sucursales. Una celda ausente significa sin dato. El JSON no conserva los colores de las celdas: la separación de estudios de fase 3 utiliza su Estado textual Inactivo. El catálogo nacional no demuestra disponibilidad de todos sus estudios en cada centro.

El logo Asclepio fue seleccionado por el responsable del proyecto. Las pruebas se ejecutan con `node --test`. El importador y el verificador están en `scripts/`; requieren los archivos originales como entradas locales y una clave local fuera del repositorio.

## Enlaces desde el mapa territorial

El mapa acepta `?centro=farmacia%3AE10F1506&nombre=FARMACIA+EL+CARMEN`. El código y el nombre se contrastan con los registros actuales antes de abrir la ficha y centrar el punto. Las sucursales inactivas se hacen visibles mediante el selector existente. Si una ubicación está pendiente, solo se abre su ficha; no se crean coordenadas.

Los códigos inexistentes, ambiguos o con un nombre distinto muestran un aviso y no abren otra farmacia por aproximación. La vista normal sin parámetros conserva su comportamiento. Pruebas: `node --test`.
