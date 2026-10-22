"""awana/db.py — la base del editor de piezas: su motor, su sesión y sus tablas (proyecto Awana, editores
E4b–E4c; fase 10.2b, 2026-10-20). Con AWANA_DATABASE_URL, su base propia (nace al arrancar si falta); sin ella, la
documental, donde estaba `prensa_piezas`.

Separar sus datos de la base documental es una orden del módulo (simula por omisión; tiqsi.sql.separar copia y verifica
cada tabla). Lee el origen de DATABASE_URL y el destino de AWANA_DATABASE_URL:

    python -m awana.db separar             # qué copiaría (filas y huella por tabla)
    python -m awana.db separar --aplicar   # copia y verifica

Un seguro le impide arrancar sobre su base propia VACÍA si la documental aún tiene las piezas de prensa: empezaría un
registro nuevo y lo de antes quedaría a la vista de nadie (lo aprendido con el chat, Rimay R3, y la Mesa de Partes).
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from awana.config import url_base

motor = create_async_engine(url_base(), pool_pre_ping=True)
SesionAwana = async_sessionmaker(motor, expire_on_commit=False)


async def obtener_sesion_awana() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia de FastAPI: una sesión de la base del editor de piezas, siempre cerrada."""
    async with SesionAwana() as sesion:
        yield sesion


class SinSeparar(SystemExit):
    """Su base propia está vacía y la documental aún tiene las piezas de prensa: arrancar así empezaría un registro nuevo."""


async def _cuenta(conexion, tabla: str) -> int:
    if not (await conexion.execute(text(f"SELECT to_regclass('{tabla}')"))).scalar():
        return 0
    return (await conexion.execute(text(f"SELECT count(*) FROM {tabla}"))).scalar() or 0


async def _sin_separar() -> bool:
    """¿Su base es otra, está vacía y la documental aún tiene piezas? Solo si DATABASE_URL está definida (sola, no)."""
    import os

    from awana.config import config

    if not config.awana_database_url or "DATABASE_URL" not in os.environ or config.awana_database_url == config.database_url:
        return False
    try:
        async with motor.connect() as c:
            if await _cuenta(c, "prensa_piezas"):
                return False
        documental = create_async_engine(config.database_url)
        try:
            async with documental.connect() as c:
                return bool(await _cuenta(c, "prensa_piezas"))
        finally:
            await documental.dispose()
    except Exception:  # noqa: BLE001 — sin la documental a la vista no hay nada que proteger
        return False


async def preparar() -> None:
    """Su base (si falta) y sus tablas (las que ya están no se tocan). Se NIEGA a arrancar sobre su base propia vacía si
    la documental aún tiene las piezas (separe primero)."""
    from tiqsi.sql import crear_base_si_falta

    from awana.modelos import BaseAwana

    await crear_base_si_falta(motor.url)
    if await _sin_separar():
        raise SinSeparar("La base del editor de piezas está vacía y la documental aún tiene las piezas de prensa: "
                         "sepárela primero (python -m awana.db separar --aplicar).")
    async with motor.begin() as conexion:
        await conexion.run_sync(BaseAwana.metadata.create_all)


async def separar(aplicar: bool = False) -> dict:
    """Sus tablas, de la base documental (DATABASE_URL) a la suya (AWANA_DATABASE_URL)."""
    from tiqsi.sql import crear_base_si_falta, separar as separar_tablas

    from awana.modelos import BaseAwana
    from awana.config import config

    if not config.awana_database_url:
        raise SystemExit("Falta AWANA_DATABASE_URL (la base propia del editor de piezas).")
    if aplicar:
        await crear_base_si_falta(motor.url)
    return await separar_tablas(config.database_url, config.awana_database_url, BaseAwana.metadata, aplicar=aplicar)


def _principal(argv: list[str]) -> int:
    import argparse
    import asyncio

    from tiqsi.sql import ErrorDeSeparacion

    p = argparse.ArgumentParser(prog="python -m awana.db", description="La base propia del editor de piezas.")
    sub = p.add_subparsers(dest="orden", required=True)
    s = sub.add_parser("separar", help="sus tablas a su base (simula sin --aplicar)")
    s.add_argument("--aplicar", action="store_true")
    a = p.parse_args(argv)
    try:
        plan = asyncio.run(separar(a.aplicar))
    except ErrorDeSeparacion as e:
        print(f"[error] {e}")
        return 1
    for tabla, d in plan.items():
        print(f"  {tabla:<30} {d['filas']:>6} filas  {d['huella'][:12]}")
    print("Copiado y verificado." if a.aplicar else "Simulación: nada se copió (--aplicar para hacerlo).")
    return 0


if __name__ == "__main__":
    import sys

    raise SystemExit(_principal(sys.argv[1:]))
