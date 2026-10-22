"""awana/manifiesto.py — el manifiesto del editor de piezas (proyecto Awana, editores E4; fase 10.2b de
docs/plataforma/propuesta-repositorios.md, 2026-10-20).

E4a (hecha): el editor de piezas del estudio (`editor.html`) como módulo, con su API (api/piezas.py) sobre la base común de
los editores (ruray.comun, en su repositorio); el kit común, de Unancha (UNANCHA_DIR); aprovecha la Mediateca («medios.v2»).

E4b (hecha): las PIEZAS DE PRENSA son suyas (awana/modelos.py, sin claves foráneas hacia Qillqa): su API en /api/piezas; la cuenta y los nombres por «identidad.v1»; la lectura de lo
pegado por «pegado.v1»; lo que cuenta a las reglas, por su bandeja (`awana_bandeja`); el chat las registra por
«piezas.v1» y los editores saben para qué pieza se abren por la referencia «piezas:pieza:N». Su web:
frontend/src/componentes/piezas/modulo.ts.

E4c (hecha): su base propia con AWANA_DATABASE_URL (awana/db.py: nace al arrancar; `separar` copia y verifica sus
tablas desde la documental; el seguro SinSeparar no la deja arrancar vacía si la documental aún tiene las piezas).
"""
from __future__ import annotations

from tiqsi import Manifiesto
from tiqsi.bandeja_sql import BandejaSQL

from awana import api as piezas
from awana.modelos import BANDEJA
from awana import contrato as awana_contrato, db as awana_db
from awana.db import SesionAwana

VERSION = "0.1.0"



async def _preparar_base(_anfitrion) -> None:
    """Su base (si falta) y sus tablas (E4b)."""
    await awana_db.preparar()


MANIFIESTO = Manifiesto(
    id="piezas", nombre="Editor de piezas", version=VERSION, contrato="^0.1",
    routers=[piezas.router_piezas, piezas.router_editor],
    # Los prefijos con que se apaga (los del registro de módulos encendibles de Qillqa).
    prefijos=("/api/piezas",),
    necesita=("identidad.v1",),
    aprovecha=("medios.v2", "pegado.v1"),
    al_arrancar=[_preparar_base],
    # «prensa.pieza_registrada» a las reglas de Qillqa, tras su commit.
    bandeja=BandejaSQL(SesionAwana, BANDEJA),
    ofrece={"piezas.v1": awana_contrato.PIEZAS_V1},
    resolutores={"pieza": awana_contrato.resolver_pieza},
)
