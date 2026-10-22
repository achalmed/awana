"""awana/api.py — el editor de piezas (Awana; nació en Qillqa el 2026-10-20, editores E4a, y salió a su
repositorio el 2026-10-21; sus páginas, en `paginas/`).

`editor.html` (publicaciones con las plantillas de la marca, tipo Canva) y sus scripts, que vinieron de Unancha con el
estudio (E0). Los sirve la base común de los editores (ruray.comun, en su repositorio) bajo `/api/piezas/editor/`, con su
cookie: las rutas comunes (kit, banco, almacén, salidas) y las suyas (sus imágenes, la mejora de una foto y «Guardar en
la Fototeca»). Con la Mediateca, su selector la incluye y lo que se sube o se guarda entra a ella.

Y, desde E4b, el registro de las PIEZAS DE PRENSA (antes `/api/prensa/piezas` de Qillqa, fase 9.4): noticias procesadas
con el prompt de prensa, notas y comunicados, con estado y responsable; llegan pegadas (`POST /api/piezas/pegar`, vista
previa con «pegado.v1») o a mano, y se listan y cambian aquí. La cuenta, por «identidad.v1»; lo que cuentan a las reglas,
por su bandeja (awana/piezas.py); el chat las registra por «piezas.v1» (awana/contrato.py).
"""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from tiqsi.modulo import capacidad, opcional
from tiqsi.puertos import Usuario, usuario_actual

from awana.modelos import PiezaPrensa
from awana import piezas as svc
from awana.db import obtener_sesion_awana
from ruray.comun import COMUNES, Editor, crear_router

PAGINAS = Path(__file__).resolve().parents[1] / "paginas"

EDITOR = Editor(
    id="piezas", nombre="Editor de piezas", prefijo="/api/piezas/editor", inicio="editor.html",
    paginas=("editor.html", "editor-avanzado.css", "editor-avanzado.js", "empaquetar.js", "qr.js", "imgbank.js",
             "estudio-tema.css", "estudio-iconos.js", "estudio-movil.js"),
    rutas=COMUNES | {"GET api/imagenes", "POST api/imagenes", "POST api/mejorar-foto", "POST api/fototeca-pieza"},
    carpeta=PAGINAS,
)

router_editor = crear_router(EDITOR)


# --- las piezas de prensa (E4b) -------------------------------------------------------------------------------------

router_piezas = APIRouter(prefix="/api/piezas", tags=["piezas"])


def _sin_invitado(u: Usuario) -> None:
    if u.rol == "invitado":
        raise HTTPException(403, "La cuenta de invitado solo puede consultar.")


async def _nombres(ids: set[int]) -> dict[int, str]:
    """El nombre de cada cuenta («identidad.v1»)."""
    if not ids:
        return {}
    return {c["id"]: c["nombre_completo"] for c in await capacidad("identidad.v1").cuentas() if c["id"] in ids}


@router_piezas.get("")
async def listar_piezas(estado: str = "", clase: str = "", q: str = "", limite: int = 100,
                        _: Usuario = Depends(usuario_actual), sesion: AsyncSession = Depends(obtener_sesion_awana)) -> dict:
    qs = select(PiezaPrensa).order_by(PiezaPrensa.id.desc()).limit(min(limite, 500))
    if estado:
        qs = qs.where(PiezaPrensa.estado == estado)
    if clase:
        qs = qs.where(PiezaPrensa.clase == clase)
    if q.strip():
        qs = qs.where(PiezaPrensa.titular.ilike(f"%{q.strip()}%") | PiezaPrensa.cuerpo.ilike(f"%{q.strip()}%"))
    filas = (await sesion.execute(qs)).scalars().all()
    nombres = await _nombres({p.responsable_id for p in filas if p.responsable_id})
    return {"piezas": [svc.ficha(p, nombres) for p in filas], "clases": [{"v": c, "t": svc.ETIQUETA_CLASE[c]} for c in svc.CLASES],
            "estados": list(svc.ESTADOS)}


@router_piezas.get("/equipo")
async def equipo(_: Usuario = Depends(usuario_actual)) -> list[dict]:
    """Las cuentas activas, para elegir responsable (solo nombre, rol y cargo)."""
    return [{"id": c["id"], "nombre_completo": c["nombre_completo"], "rol": c["rol"], "cargo": c.get("cargo", "")}
            for c in sorted(await capacidad("identidad.v1").cuentas(), key=lambda c: c["nombre_completo"]) if c.get("activo", True)]


@router_piezas.post("")
async def crear_pieza(datos: svc.PiezaEntrada, usuario: Usuario = Depends(usuario_actual),
                      sesion: AsyncSession = Depends(obtener_sesion_awana)) -> dict:
    """Una pieza a mano o desde un pegado (`pegado`: la constancia la deja la web con el servicio del anfitrión)."""
    _sin_invitado(usuario)
    p = await svc.crear(sesion, datos, usuario.id, origen="pegado" if datos.pegado else "persona")
    await sesion.commit()
    return svc.ficha(p, {usuario.id: usuario.nombre_completo})


class PiezaCambio(BaseModel):
    clase: str | None = None
    titular: str | None = Field(None, max_length=300)
    bajada: str | None = None
    cuerpo: str | None = None
    fuente: str | None = None
    enlace: str | None = None
    fecha: str | None = None
    ambito: str | None = None
    temas: list[str] | None = None
    relevancia: str | None = None
    accion_sugerida: str | None = None
    cita: str | None = None
    estado: str | None = None
    responsable_id: int | None = None
    publicado_en: list[dict] | None = None


@router_piezas.patch("/{pid}")
async def cambiar_pieza(pid: int, datos: PiezaCambio, usuario: Usuario = Depends(usuario_actual),
                        sesion: AsyncSession = Depends(obtener_sesion_awana)) -> dict:
    _sin_invitado(usuario)
    p = await sesion.get(PiezaPrensa, pid)
    if p is None:
        raise HTTPException(404, "La pieza no existe.")
    cambios = datos.model_dump(exclude_unset=True)
    if "clase" in cambios and cambios["clase"] not in svc.CLASES:
        raise HTTPException(422, "Clase desconocida.")
    if "estado" in cambios and cambios["estado"] not in svc.ESTADOS:
        raise HTTPException(422, "Estado desconocido.")
    for k, v in cambios.items():
        setattr(p, k, v)
    await sesion.commit()
    return svc.ficha(p)


class PegarPieza(BaseModel):
    texto: str = Field(min_length=1, max_length=60000)
    actual: dict = {}


@router_piezas.post("/pegar")
async def pegar_pieza(datos: PegarPieza, usuario: Usuario = Depends(usuario_actual),
                      sesion: AsyncSession = Depends(obtener_sesion_awana)) -> dict:
    """Vista previa del bloque `pieza-de-prensa` (sin escribir) con «pegado.v1»; el guardado es `POST /api/piezas`."""
    _sin_invitado(usuario)
    pegado = opcional("pegado.v1")
    if pegado is None:
        raise HTTPException(503, "La lectura de lo pegado no está disponible.")
    le = pegado.interpretar(datos.texto, ("pieza-de-prensa",))
    if not le.valido:
        raise HTTPException(422, {"codigo": "pegado_invalido", "errores": le.errores, "avisos": le.avisos,
                                  "formatos": [f for f in pegado.formatos() if f["tipo"] == "pieza-de-prensa"]})
    r = pegado.respuesta(le, datos.actual)
    parecidas = (await sesion.execute(select(PiezaPrensa).where(
        PiezaPrensa.titular.ilike(f"%{(le.valores.get('titular') or '')[:60]}%")).limit(3))).scalars().all()
    r["propuestas"] = {"parecidas": [{"id": x.id, "titular": x.titular, "estado": x.estado} for x in parecidas]}
    return r
