"""awana/piezas.py — las piezas de prensa del editor de piezas (proyecto Awana, editores E4b; fase 10.2b,
2026-10-20; antes en api/prensa.py, fase 9.4): sus clases y estados, su ficha y su alta, que cuenta a las reglas de Qillqa
«prensa.pieza_registrada» por su bandeja (en la misma transacción).
"""
from __future__ import annotations

from fastapi import HTTPException
from pydantic import BaseModel, Field

from awana.modelos import PiezaPrensa, SalidaAwana

CLASES = ("noticia_local", "noticia_nacional", "noticia_internacional", "nota_de_prensa", "comunicado", "entrevista", "agenda_de_medios")
ESTADOS = ("registrada", "en_trabajo", "publicada", "archivada")
ETIQUETA_CLASE = {"noticia_local": "Noticia local", "noticia_nacional": "Noticia nacional", "noticia_internacional": "Noticia internacional",
                  "nota_de_prensa": "Nota de prensa", "comunicado": "Comunicado", "entrevista": "Entrevista", "agenda_de_medios": "Agenda de medios"}
# El origen de lo que cuenta (el de siempre: las reglas de fábrica escuchan «prensa.pieza_registrada»).
ORIGEN = "prensa"


class PiezaEntrada(BaseModel):
    clase: str = "noticia_local"
    titular: str = Field(min_length=1, max_length=300)
    bajada: str = ""
    cuerpo: str = ""
    fuente: str = Field("", max_length=300)
    enlace: str = ""
    fecha: str = Field("", max_length=10)
    ambito: str = Field("", max_length=200)
    temas: list[str] = []
    relevancia: str = ""
    accion_sugerida: str = Field("", max_length=30)
    cita: str = ""
    estado: str = "registrada"
    responsable_id: int | None = None
    # La pieza vino de un pegado (la constancia la deja la web con el servicio «pegado.registrar» del anfitrión).
    pegado: dict | bool | None = None


def ficha(p: PiezaPrensa, nombres: dict[int, str] | None = None) -> dict:
    nombres = nombres or {}
    return {"id": p.id, "clase": p.clase, "clase_texto": ETIQUETA_CLASE.get(p.clase, p.clase), "titular": p.titular, "bajada": p.bajada, "cuerpo": p.cuerpo,
            "fuente": p.fuente, "enlace": p.enlace, "fecha": p.fecha, "ambito": p.ambito, "temas": p.temas or [], "relevancia": p.relevancia,
            "accion_sugerida": p.accion_sugerida, "cita": p.cita, "estado": p.estado, "responsable_id": p.responsable_id,
            "responsable": nombres.get(p.responsable_id or 0, ""), "publicado_en": p.publicado_en or [], "origen": p.origen,
            "creado_en": p.creado_en.isoformat() if p.creado_en else None}


def validar(d: PiezaEntrada) -> None:
    if d.clase not in CLASES:
        raise HTTPException(422, f"Clase desconocida; use una de: {', '.join(CLASES)}.")
    if d.estado not in ESTADOS:
        raise HTTPException(422, f"Estado desconocido; use uno de: {', '.join(ESTADOS)}.")


def contar(sesion, p: PiezaPrensa, usuario_id: int | None) -> None:
    """«prensa.pieza_registrada» a las reglas de Qillqa (los canales Prensa y Noticias), por su bandeja: sin commit."""
    sesion.add(SalidaAwana(tipo="prensa.pieza_registrada", origen=ORIGEN, intentos=0, error="", datos={
        "entidad": f"pieza:{p.id}", "clave": None, "usuario_id": usuario_id, "emitido_por": usuario_id,
        "datos": {"titular": p.titular, "clase": p.clase, "fuente": p.fuente, "accion_sugerida": p.accion_sugerida,
                  "responsable_id": p.responsable_id}}))


async def crear(sesion, d: PiezaEntrada, usuario_id: int | None, origen: str = "persona", pegado_id: int | None = None) -> PiezaPrensa:
    """Da de alta la pieza y la cuenta a las reglas. Sin commit."""
    validar(d)
    p = PiezaPrensa(**d.model_dump(exclude={"pegado"}), origen=origen, pegado_id=pegado_id, creado_por=usuario_id)
    sesion.add(p)
    await sesion.flush()
    contar(sesion, p, usuario_id)
    return p
