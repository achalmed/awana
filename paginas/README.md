---
tipo: readme
estado: activo
---
# paginas/ — las páginas del editor de piezas

Las sirve la base común de los editores (Ruray) bajo `/api/piezas/editor/` (`Editor.carpeta` de `awana/api.py`):
primero de aquí y, lo común del estudio (`estudio-tema.css`, `estudio-iconos.js`, `estudio-movil.js`), desde Ruray.
Piden todo relativo a su carpeta; no se reescriben para el servidor.

| archivo | qué es |
|---|---|
| `editor.html` | publicaciones de diseño: plantillas de marca, paletas por roles, marcos, exportación a redes, SVG editable e imprenta (manual: `editor-de-piezas.md`, en los docs de Unancha) |
| `editor-avanzado.js`, `editor-avanzado.css` | `E.Avz`: inicio (tamaños, recientes, galería), Elementos, kit de Marca, recorte en el marco, efectos de texto, tira de páginas, «Cambiar tamaño» y exportar todas las páginas |
| `qr.js`, `empaquetar.js` | codificador QR local y escritores de ZIP y PDF de varias páginas (sin red ni dependencias) |
| `imgbank.js` | el banco embebido para el modo sin servidor (lo escribe `embeber-foto.py`) |
| `preprensa.py`, `embeber-foto.py` | herramientas de escritorio (no se sirven): PNG de imprenta → CMYK con perfil ICC; añadir una foto al banco embebido. Usan la `lib/` del estudio de Ruray |

## Imprenta: de RGB a CMYK

El navegador exporta en RGB. Para offset, el PNG de imprenta se pasa a CMYK con perfil ICC:

```bash
python3 paginas/preprensa.py <pieza-imprenta.png>                  # papel couché (ISO Coated v2 300 %)
python3 paginas/preprensa.py <pieza-imprenta.png> --papel mate     # papel no estucado (PSO Uncoated)
python3 paginas/preprensa.py <pieza-imprenta.png> --dpi 300 --salida <dir>
```

Escribe `<nombre>-CMYK.tif` y `<nombre>-CMYK.pdf` en la salida de impresos del perfil (o en `--salida`). Requiere
Pillow con littleCMS y los perfiles ICC instalados. Antes de enviar: sangrado de 3 mm y marcas activas, 300 ppp o
más, CMYK con el perfil del papel real, textos a 4 mm o más del corte, y se envía el TIFF o el PDF, no el PNG.

## Arquitectura del editor de piezas

Un solo archivo con módulos en la cabecera del script: `E.State`, `E.History` (instantáneas y autoguardado),
`E.Render`, `E.View`, `E.Input`, `E.Color`, `E.Pal`, `E.Panels`, `E.Props`, `E.Layers`, `E.Tpl`, `E.Export`,
`E.SvgEditable`, `E.SvgImport`, `E.Keys`. `editor-avanzado.js` añade `E.Avz` sobre ese modelo (paneles por
`E.Panels.registrar`, secciones de Diseño por `E.Avz.propsExtra`, tira por `E.Avz.tiraPaginas`) sin tipos de
objeto nuevos; los marcos con forma son imágenes con `mask:"path"` y `maskD` (trazado 0..100), que pintan igual el
lienzo, el canvas de exportación y el SVG editable.

- **Añadir una plantilla**: un objeto `{cat, name, make(){ return B("<paleta>")…done() }}` en `E.Tpl`. Después,
  `generar.py actualizar --aplicar` (adaptadores de Unancha) la lleva también a Inkscape.
- **Añadir una paleta**: una entrada en `FAMILIAS` (variantes `[fondo, acento]`); `PALETAS` conserva los roles
  base con que se construyen las plantillas.
- **Añadir una forma**: una entrada en `FORMAS`.
- **Colores**: solo por el bloque generado `TOKENS_COLOR`; la regresión de `generar.py comprobar` (adaptadores de Unancha)
  falla si un color de token se escribe a mano.

## Límite honesto

- La interfaz no tiene pruebas automáticas: los botones y paneles se comprueban abriendo el editor. Sí hay una
  regresión automática del modelo y de la exportación: `generar.py comprobar` (adaptadores de Unancha) abre
  `editor.html` sin interfaz en Chrome, exporta el SVG editable, lo pasa por Inkscape, lo importa de vuelta y
  compara (sale con 1 si algo falla), y comprueba que ningún color de token esté escrito a mano.
- Fuera de Chrome o Chromium la exportación de video puede fallar.
- Las plantillas nativas llevan marcadores (`{{titular}}`, `{{region}}`, `{{sede}}`…) que se llenan con
  `marca.textos` de `/api/design` (el perfil); sin perfil quedan textos neutros.
