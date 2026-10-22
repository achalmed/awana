"""awana/contrato.py — «piezas.v1»: lo que el editor de piezas (proyecto Awana, editores E4b; fase 10.2b,
2026-10-20) ofrece a los demás, y su resolutor de referencias.

- `registrar(campos, usuario_id, origen, pegado_id)`: una pieza de prensa desde los campos de un pegado (el chat la
  reconoce y la registra: servicios/registro_chat.py de Qillqa). Con su sesión y su commit; cuenta a las reglas
  «prensa.pieza_registrada» por su bandeja. → {id, titular, clase}.
- `resolver_pieza(id)`: «piezas:pieza:N» → {titulo (el titular), estado}; con eso un editor sabe para qué pieza se abrió.
"""
from __future__ import annotations

from awana.modelos import PiezaPrensa
from awana import piezas as svc
from awana.db import SesionAwana


async def registrar(campos: dict, usuario_id: int | None, origen: str = "chat", pegado_id: int | None = None) -> dict:
    datos = {k: v for k, v in (campos or {}).items() if k in svc.PiezaEntrada.model_fields and k != "pegado"}
    d = svc.PiezaEntrada(**{**datos, "titular": str(datos.get("titular") or "")[:300] or "(sin titular)"})
    async with SesionAwana() as sesion:
        p = await svc.crear(sesion, d, usuario_id, origen=origen, pegado_id=pegado_id)
        await sesion.commit()
        return {"id": p.id, "titular": p.titular, "clase": p.clase}


async def resolver_pieza(ident: str) -> dict | None:
    if not ident.isdigit():
        return None
    async with SesionAwana() as sesion:
        p = await sesion.get(PiezaPrensa, int(ident))
    return {"titulo": p.titular, "estado": p.estado} if p is not None else None


class _Superficie:
    """Resuelve cada nombre al usarlo y rechaza lo que no está en la lista (el contrato se cumple)."""

    def __init__(self, nombre: str, funciones: tuple[str, ...]) -> None:
        self._nombre, self._funciones = nombre, funciones

    def __getattr__(self, nombre: str):
        if nombre in self._funciones:
            return globals()[nombre]
        raise AttributeError(f"«{nombre}» no es parte de «{self._nombre}» (awana/contrato.py)")

    def __dir__(self):
        return sorted(self._funciones)


PIEZAS_V1 = _Superficie("piezas.v1", ("registrar",))
