#!/usr/bin/env python3
"""paginas/preprensa.py — preprensa de una pieza: exporta a PDF/PNG con sangrado y perfil de color para imprenta."""
# ============================================================
# PREPRENSA — deja un PNG del editor (modo Imprenta) listo para el taller.
#
# El navegador exporta en RGB; la imprenta trabaja en CMYK. Este script
# convierte con PERFIL ICC real (no la conversión "naive" de PIL) y entrega
# un TIFF CMYK 300 dpi y un PDF CMYK, con el sangrado y las marcas ya incluidos.
#
# Uso:
#   python3 preprensa.py <png-del-editor> [--papel couche|mate] [--dpi 300]
#
# Ejemplo (tras exportar en el editor: Imprenta → PNG 300 dpi):
#   python3 preprensa.py ~/Downloads/pieza-2026-08-20-imprenta-90mm.png
#   python3 preprensa.py tarjeta.png --papel mate      # papel no estucado
#
# Salida:  prensa/impresos/<nombre>-CMYK.tif  y  <nombre>-CMYK.pdf   (o --salida <dir>)
# Requiere: Pillow con littleCMS (ya instalado).
# ============================================================
import argparse
import os
import sys

from PIL import Image, ImageCms

# El estudio de Ruray (su lib/nucleo), hermano de este repositorio o en ESTUDIO_DIR (2026-10-21, al salir a Awana).
sys.path.insert(0, os.environ.get("ESTUDIO_DIR") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ruray", "estudio"))
from lib import nucleo  # noqa: E402  raíz y logger de core/ (RQ-COD-06)

log = nucleo.registro("identidad-visual.preprensa")

# Perfiles ICC del sistema (verificados en /usr/share/color/icc)
PERFILES = {
    "couche": "/usr/share/color/icc/ISOcoated_v2_300_bas.ICC",   # estucado / brillante / couché
    "mate":   "/usr/share/color/icc/PSO_Uncoated_ISO12647_bas.ICC",  # no estucado / mate / offset
}

AQUI = os.path.dirname(os.path.abspath(__file__))          # paginas/
RAIZ = str(nucleo.RAIZ)                                     # identidad-visual/
DEST_DEFAULT = os.path.join(RAIZ, "prensa", "impresos")    # salida de imprenta (resultado final)

ap = argparse.ArgumentParser(description="PNG del editor → CMYK (TIFF + PDF) para imprenta.")
ap.add_argument("png", help="PNG exportado desde el editor (modo Imprenta)")
ap.add_argument("--papel", choices=PERFILES, default="couche",
                help="couche = estucado/brillante (def.) · mate = papel offset no estucado")
ap.add_argument("--dpi", type=int, default=300, help="resolución de salida (def. 300)")
ap.add_argument("--salida", default=DEST_DEFAULT,
                help="carpeta de salida (def. prensa/impresos/)")
args = ap.parse_args()

perfil_cmyk = PERFILES[args.papel]
if not os.path.exists(args.png):
    nucleo.abortar(log, f"No existe: {args.png}")
if not os.path.exists(perfil_cmyk):
    nucleo.abortar(log, f"Falta el perfil ICC: {perfil_cmyk}")

nombre = os.path.basename(os.path.splitext(args.png)[0])
os.makedirs(args.salida, exist_ok=True)
tif = os.path.join(args.salida, f"{nombre}-CMYK.tif")
pdf = os.path.join(args.salida, f"{nombre}-CMYK.pdf")

im = Image.open(args.png)
im = im.convert("RGB")  # descarta alpha; el sangrado ya está pintado

# sRGB (entrada) → perfil CMYK del papel, con intención perceptual (fotos)
srgb = ImageCms.createProfile("sRGB")
cmyk = ImageCms.getOpenProfile(perfil_cmyk)
im_cmyk = ImageCms.profileToProfile(
    im, srgb, cmyk, renderingIntent=ImageCms.Intent.PERCEPTUAL, outputMode="CMYK"
)

w_mm = im.width / args.dpi * 25.4
h_mm = im.height / args.dpi * 25.4
print(f"  entrada : {im.width}×{im.height}px  ({w_mm:.1f}×{h_mm:.1f} mm @ {args.dpi} dpi)")
print(f"  perfil  : {args.papel} → {os.path.basename(perfil_cmyk)}")

icc_bytes = open(perfil_cmyk, "rb").read()
im_cmyk.save(tif, "TIFF", dpi=(args.dpi, args.dpi), compression="tiff_lzw", icc_profile=icc_bytes)
im_cmyk.save(pdf, "PDF", dpi=(args.dpi, args.dpi), icc_profile=icc_bytes)
print(f"✓ CMYK listo para el taller:\n    {tif}\n    {pdf}")
print("  (incluye sangrado y marcas si exportaste con ellos)")
