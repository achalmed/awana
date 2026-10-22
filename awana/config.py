"""awana/config.py — la configuración PROPIA del editor de piezas (proyecto Awana, editores E4b; fase
10.2b, 2026-10-20). Lee DATABASE_URL como Qillqa y las suyas: AWANA_DATABASE_URL (vacía: la base documental, como hasta
hoy) y AWANA_DIR (solo: su carpeta). No depende de `app.config`: viaja con el módulo.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings


class ConfigAwana(BaseSettings):
    database_url: str = "postgresql+asyncpg://qillqa:qillqa@db:5432/qillqa"
    awana_database_url: str = ""
    awana_dir: str = ""


config = ConfigAwana()


def url_base() -> str:
    """La URL de su base: AWANA_DATABASE_URL o, mientras no se separe, la documental."""
    return config.awana_database_url or config.database_url
