"""awana/sola.py — el editor de piezas SOLO: sin Qillqa, con el anfitrión mínimo de Tiqsi (proyecto Awana, editores E4a–E4b; fase 10.2b de
docs/plataforma/propuesta-repositorios.md, 2026-10-20). Sin
Mediateca: sus piezas de prensa, en su base (AWANA_DATABASE_URL, nace al arrancar); su banco, su almacén, sus proyectos
y su salida, en su carpeta; el kit común (colores, fuentes, logos, marcos), en Unancha.

    AWANA_DATABASE_URL=postgresql+asyncpg://…/awana  AWANA_DIR=…  UNANCHA_DIR=…  JWT_SECRET=<32 o más caracteres> \\
      .venv/bin/uvicorn awana.sola:app --port 8039

Las cuentas viven en AWANA_CUENTAS (por omisión <AWANA_DIR>/cuentas.json). Sin IDENTIDAD_PERFIL, el perfil del editor
se escribe la primera vez en <AWANA_DIR>/perfil.json, con sus carpetas dentro de AWANA_DIR.
"""
from __future__ import annotations

import os
from pathlib import Path

from tiqsi.minimo import crear_app

from ruray.comun import perfil_propio
from awana.manifiesto import MANIFIESTO

carpeta = os.environ.get("AWANA_DIR", "")
if not carpeta:
    raise SystemExit("El editor de piezas solo necesita su carpeta (su banco, sus proyectos, su salida y sus cuentas): AWANA_DIR.")
if not os.environ.get("AWANA_DATABASE_URL"):
    raise SystemExit("El editor de piezas solo necesita su base (sus piezas de prensa): AWANA_DATABASE_URL.")
secreto = os.environ.get("JWT_SECRET", "")
if len(secreto) < 32:
    raise SystemExit("El editor de piezas solo necesita su secreto: JWT_SECRET (32 caracteres o más; firma las sesiones).")
# El servidor del estudio lee el perfil al cargarse (la primera petición): va antes.
os.environ.setdefault("IDENTIDAD_PERFIL", str(perfil_propio(Path(carpeta), "editor de piezas")))

app = crear_app([MANIFIESTO], nombre="Editor de piezas", secreto=secreto,
                cuentas=os.environ.get("AWANA_CUENTAS") or Path(carpeta) / "cuentas.json",
                web=os.environ.get("AWANA_WEB") or None)
