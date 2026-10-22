#!/usr/bin/env python3
"""paginas/embeber-foto.py — añade o actualiza una imagen en el banco embebido del editor (imgbank.js) para el modo sin servidor."""
# ============================================================
# EMBEBER-FOTO — añade/actualiza una imagen en el banco EMBEBIDO
# del editor (imgbank.js → window.BANCO), para el modo sin servidor.
#
# Uso:
#   python3 embeber-foto.py <imagen> "<nombre en el banco>" ["crédito"]
#
# Ejemplo (tras reemplazar el busto con una versión editada):
#   python3 embeber-foto.py \
#     "../../recursos/retratos/titular-busto.png" \
#     "Titular — retrato busto (sin bandera)"
#
# Si el nombre ya existe, se REEMPLAZA (idempotente). Con el servidor
# (./abrir-editor.sh) esto no es necesario: el banco es la carpeta viva.
# Requiere: Python 3 + Pillow (PIL).
# ============================================================
import base64, io, json, os, sys

from PIL import Image

# El estudio de Ruray (su lib/nucleo), hermano de este repositorio o en ESTUDIO_DIR (2026-10-21, al salir a Awana).
sys.path.insert(0, os.environ.get("ESTUDIO_DIR") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ruray", "estudio"))
from lib import nucleo  # noqa: E402  raíz y logger de core/ (RQ-COD-06)

log = nucleo.registro("identidad-visual.embeber_foto")

AQUI = os.path.dirname(os.path.abspath(__file__))
JS = os.path.join(AQUI, "imgbank.js")
ALTO_MAX = 1000          # px; suficiente para el lienzo del editor
CALIDAD = 80             # WebP

if len(sys.argv) < 3:
    sys.exit(__doc__ or "Uso: embeber-foto.py <imagen> \"<nombre>\" [\"crédito\"]")
ruta, nombre = sys.argv[1], sys.argv[2]
credito = sys.argv[3] if len(sys.argv) > 3 else ""

im = Image.open(ruta)
im = im.convert("RGBA" if "A" in im.getbands() or im.mode == "P" else "RGB")
if im.height > ALTO_MAX:
    im = im.resize((round(im.width * ALTO_MAX / im.height), ALTO_MAX), Image.LANCZOS)
buf = io.BytesIO()
im.save(buf, "WEBP", quality=CALIDAD, method=6)
src = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
print(f"comprimida: {im.size} · {len(buf.getvalue()) // 1024} KB")

with open(JS, encoding="utf-8") as f:
    txt = f.read()
head, _, arr = txt.partition("window.BANCO=")
banco = json.loads(arr.rstrip().rstrip(";"))
banco = [b for b in banco if b.get("name") != nombre]
banco.append({"name": nombre, "credito": credito, "w": im.width, "h": im.height, "src": src})
with open(JS, "w", encoding="utf-8") as f:
    f.write(head + "window.BANCO=" + json.dumps(banco, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(f"✓ «{nombre}» embebida · BANCO: {len(banco)} entradas")
