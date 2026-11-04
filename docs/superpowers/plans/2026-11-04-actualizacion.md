# Actualización de DoctorSV, 4 de noviembre de 2026

**Objetivo:** incorporar los JSON entregados, conservar estados y servicios por centro, explicar ubicaciones pendientes y proteger los catálogos de fase 3. Publicar en el repositorio existente. Mostrar propuestas de logo y aplicar únicamente la elegida.

**Arquitectura:** conservar la aplicación estática y sus filtros, demo y enlaces desde Atlas. Reconciliar identidades y auditorías mediante un módulo de importación probado; reemplazar datos incrustados. Catálogos públicos sin precios y catálogos restringidos cifrados con AES-GCM/PBKDF2.

## Restricciones

- No inferir disponibilidad individual desde el catálogo nacional.
- SI/X significa disponible; NO significa no disponible; ausencia significa sin dato.
- Medicamentos: respetar Fase; estudios inactivos pasan al apartado Fase 3 por instrucción del usuario. Los temporales permanecen en su catálogo ordinario.
- No publicar archivos originales con precios ni contraseñas. Entregar una nueva contraseña de fase 3 al usuario.
- No geolocalizar por semejanza de nombre, punto de municipio o cercanía. Conservar evidencia e historial; explicar pendientes concretos.
- Actualizar solo DoctorSV; conservar Atlas/Nyx y el mapa territorial.

## Tareas y verificación

- [x] 1. Crear pruebas de reconciliación: cambio de código con identidad igual, código reutilizado con identidad distinta, capacidades eliminadas, ausencia de coordenadas, longitud positiva y conservación de correcciones históricas. Ejecutar RED, implementar `scripts/actualizacion.cjs`, ejecutar GREEN.
- [x] 2. Contrastar pendientes con fuente nueva y evidencia pública. Incorporar decisiones documentadas, registrar pendientes por centro y emitir informe Markdown/CSV sin datos restringidos.
- [x] 3. Probar separación de fases y eliminación de precios; cifrar los medicamentos actualizados y los estudios de fase 3. Verificar contraseña correcta/incorrecta y ausencia de datos protegidos en fuente pública.
- [x] 4. Añadir pestaña de estudios restringidos con filtros por tipo, estado, grupo y búsqueda. Probar desbloqueo, cambio de pestañas, cierre y bloqueo sin conservar filas descifradas visibles.
- [x] 5. Mostrar propuestas de logo y esperar elección mientras avanza lo demás; incorporar el seleccionado.
- [ ] 6. Ejecutar pruebas Node, revisión independiente, comprobar flujos en navegador escritorio/móvil, publicar con actualización condicional de main y verificar GitHub Pages.

## Foco de revisión

Identidades con códigos reutilizados; marcas SI/X ausentes al actualizar; coordenadas contradictorias con dirección; estudios inactivos filtrados fuera del catálogo público; desbloqueo asíncrono que termina después de cerrar o cambiar de pestaña; enlaces territoriales existentes y demo aislada.

## Verificación final

17 pruebas Node aprobadas. El verificador contrasta 1178 centros y 14016 campos operativos contra la fuente; compara catálogos públicos y descifra ambos apartados restringidos. Revisión independiente sin hallazgos críticos ni importantes. Navegador de escritorio y móvil: búsqueda, tipos de estudio, error de clave, acceso correcto y bloqueo comprobados.

Decisiones documentadas: mantener un medicamento sin fase dentro del acceso reservado, identificado para revisión; utilizar Estado textual porque JSON no conserva colores; recuperar correcciones históricas sin presentarlas como nuevas confirmaciones externas.
