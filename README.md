# sulfata-datos

Copia al día del **Registro de Productos Fitosanitarios** del Ministerio de Agricultura, Pesca y Alimentación (MAPA), convertida a una base SQLite para la app **Sulfata**.

> Sulfata no está afiliada al MAPA ni a ningún organismo oficial. La fuente oficial es el registro del MAPA: <https://servicio.mapa.gob.es/regfiweb>. Comprueba siempre la etiqueta del producto.

## Fuente y reutilización

- **Fuente:** Ministerio de Agricultura, Pesca y Alimentación, Registro de Productos Fitosanitarios («Productos autorizados», exportación JSON de regfiweb).
- **Condiciones:** el aviso legal del MAPA permite reutilizar la información sin autorización expresa, siempre que se cite la fuente. Cada publicación indica la fecha de los datos del MAPA (`fecha_datos`).
- Los datos no se modifican: solo se cambia el formato y se unifican las formas de escribir «no procede» en el plazo de seguridad.

## Qué se publica

Cada día a las 05:00 UTC, una acción de GitHub:

1. descarga el JSON de productos autorizados del MAPA;
2. lo convierte a SQLite (`tool/datos/convertir.ts`);
3. comprueba que tiene entre 1.500 y 3.000 productos, más de 50.000 usos, una fecha no anterior a la publicada y que responde a una consulta de prueba;
4. si la fecha es nueva, publica una *Release* con `sulfata.db.gz` y `version.json`.

Si una comprobación falla, no se publica nada. Si el MAPA no ha cambiado la fecha, tampoco.

La última versión está siempre en:

- <https://github.com/005Jan/sulfata-datos/releases/latest/download/version.json>
- <https://github.com/005Jan/sulfata-datos/releases/latest/download/sulfata.db.gz>

## Código

Los scripts de `tool/datos` y `src/datos` son copia de los del repositorio de la app, donde tienen sus tests. Se ejecutan con Node 24 sin compilar.

## revisor.json

Código de acceso del revisor de Google Play (D72 de Sulfata). Solo lleva la **huella SHA-256** del código y su caducidad (30 días como mucho), nunca el código. Entre revisiones queda vacío (`{}`); se rellena antes de cada envío a Google y el código se escribe en las notas para el revisor. Cambiar o vaciar la huella lo revoca.
