"""awana/modelos.py — los modelos del editor de piezas (proyecto Awana, editores E4b; fase 10.2b, 2026-10-20).

Las PIEZAS DE PRENSA (2026-10-12, fase 9.4; auditoría PR-01), que salieron de `modelos.py`: una noticia local, nacional o
internacional procesada con el prompt de prensa, una nota de prensa o un comunicado de la entidad, una entrevista o una
cobertura. Llega pegada (chat o módulo) o se escribe a mano; `estado` sigue su vida (`registrada` → `en_trabajo` →
`publicada` | `archivada`). Lo publicado en redes se anota en `publicado_en` (JSONB: [{medio, enlace, fecha}]).

Con su propia Base (`BaseAwana`) y sin claves foráneas hacia Qillqa: la cuenta (responsable, quien la creó) y la
constancia del pegado se guardan como número. Las crea awana/db.py. Su bandeja de salida (`awana_bandeja`) lleva
a las reglas de Qillqa lo que cuenta («prensa.pieza_registrada»), en la misma transacción que el cambio.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from tiqsi.bandeja_sql import tabla_bandeja


class BaseAwana(DeclarativeBase):
    """Las tablas del editor de piezas (proyecto Awana): su `create_all` es el del módulo (awana/db.py)."""


class PiezaPrensa(BaseAwana):
    __tablename__ = "prensa_piezas"

    id: Mapped[int] = mapped_column(primary_key=True)
    despacho_id: Mapped[int] = mapped_column(Integer, default=1)
    clase: Mapped[str] = mapped_column(String(30), default="noticia_local", index=True)
    titular: Mapped[str] = mapped_column(String(300))
    bajada: Mapped[str] = mapped_column(Text, default="")
    cuerpo: Mapped[str] = mapped_column(Text, default="")
    fuente: Mapped[str] = mapped_column(String(300), default="")
    enlace: Mapped[str] = mapped_column(Text, default="")
    fecha: Mapped[str] = mapped_column(String(10), default="")
    ambito: Mapped[str] = mapped_column(String(200), default="")
    temas: Mapped[list] = mapped_column(JSONB, default=list)
    relevancia: Mapped[str] = mapped_column(Text, default="")
    accion_sugerida: Mapped[str] = mapped_column(String(30), default="")
    cita: Mapped[str] = mapped_column(Text, default="")
    estado: Mapped[str] = mapped_column(String(20), default="registrada", index=True)
    responsable_id: Mapped[int | None] = mapped_column(Integer, nullable=True)        # cuenta («identidad.v1»)
    publicado_en: Mapped[list] = mapped_column(JSONB, default=list)
    origen: Mapped[str] = mapped_column(String(20), default="persona")   # persona | pegado | chat
    pegado_id: Mapped[int | None] = mapped_column(Integer, nullable=True)             # la constancia del pegado (Qillqa)
    creado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)            # cuenta («identidad.v1»)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


BANDEJA = tabla_bandeja(BaseAwana.metadata, "awana_bandeja")


class SalidaAwana(BaseAwana):
    """Una fila de la bandeja (para anotarla con `sesion.add`)."""

    __table__ = BANDEJA
