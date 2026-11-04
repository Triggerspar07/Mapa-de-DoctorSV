# Mapa
Un mapa con la finalidad de poder brindar una resoluciòn y gestiòn de manera rapida y precisa

Pagina del mapa: https://triggerspar07.github.io/Mapa-de-DoctorSV/

## Enlaces desde el mapa territorial

El mapa acepta `?centro=farmacia%3AE10F1506&nombre=FARMACIA+EL+CARMEN`. El código y el nombre se contrastan con los registros actuales antes de abrir la ficha y centrar el punto. Las sucursales inactivas se hacen visibles mediante el selector existente. Si una ubicación está pendiente, solo se abre su ficha; no se crean coordenadas.

Los códigos inexistentes, ambiguos o con un nombre distinto muestran un aviso y no abren otra farmacia por aproximación. La vista normal sin parámetros conserva su comportamiento. Pruebas: `node --test`.
