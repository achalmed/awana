"""tests/test_awana_piezas.py — las piezas de prensa del editor de piezas (Awana; nació en Qillqa el 2026-10-20, editores
E4b), sin base de datos: su alta cuenta «prensa.pieza_registrada» a las reglas del anfitrión por su bandeja, en la misma
transacción y con el sobre que Qillqa lee; «piezas.v1» y el resolutor «piezas:pieza:N». Lo del lado de Qillqa (ya no
las tiene; su pegado acepta una pieza) se prueba en Qillqa (backend/tests/test_awana_en_qillqa.py).
"""
import asyncio

import pytest
from fastapi import HTTPException

from awana.modelos import PiezaPrensa, SalidaAwana
from awana import contrato as awana_contrato
from awana import piezas as svc


class SesionFalsa:
    """Lo que el servicio usa de una sesión: añadir, numerar al volcar y leer por id."""

    def __init__(self, piezas: dict | None = None) -> None:
        self.agregados, self.commits, self.piezas = [], 0, dict(piezas or {})

    def add(self, x) -> None:
        self.agregados.append(x)

    async def flush(self) -> None:
        for x in self.agregados:
            if isinstance(x, PiezaPrensa) and x.id is None:
                x.id = 40 + len(self.piezas)
                self.piezas[x.id] = x

    async def commit(self) -> None:
        self.commits += 1

    async def get(self, _modelo, ident):
        return self.piezas.get(ident)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False


def test_el_alta_cuenta_a_las_reglas_por_su_bandeja():
    sesion = SesionFalsa()
    d = svc.PiezaEntrada(titular="Obra en Huanta", clase="nota_de_prensa", fuente="Radio", responsable_id=3)
    p = asyncio.run(svc.crear(sesion, d, 7, origen="pegado"))
    assert p.id == 40 and p.origen == "pegado" and p.creado_por == 7 and sesion.commits == 0   # sin commit: lo hace quien llama
    salida = [x for x in sesion.agregados if isinstance(x, SalidaAwana)]
    assert len(salida) == 1 and salida[0].tipo == "prensa.pieza_registrada" and salida[0].origen == "prensa"
    # El sobre que lee Qillqa (eventos_sistema.desde_bus): {entidad, datos, clave, usuario_id}.
    sobre = salida[0].datos
    assert sobre["entidad"] == "pieza:40" and sobre["usuario_id"] == 7
    assert sobre["datos"] == {"titular": "Obra en Huanta", "clase": "nota_de_prensa", "fuente": "Radio", "accion_sugerida": "",
                              "responsable_id": 3}


def test_clase_y_estado_validos():
    for malo in ({"clase": "chisme"}, {"estado": "borrada"}):
        with pytest.raises(HTTPException) as e:
            svc.validar(svc.PiezaEntrada(titular="x", **malo))
        assert e.value.status_code == 422


def test_piezas_v1_registra_y_resuelve(monkeypatch):
    sesion = SesionFalsa()
    monkeypatch.setattr(awana_contrato, "SesionAwana", lambda: sesion)
    r = asyncio.run(awana_contrato.PIEZAS_V1.registrar({"titular": "Comunicado", "clase": "comunicado", "observaciones": "x",
                                                       "pegado": {"texto": "…"}}, 5, origen="chat", pegado_id=12))
    assert r == {"id": 40, "titular": "Comunicado", "clase": "comunicado"} and sesion.commits == 1
    assert sesion.piezas[40].pegado_id == 12 and sesion.piezas[40].origen == "chat"
    assert asyncio.run(awana_contrato.resolver_pieza("40")) == {"titulo": "Comunicado", "estado": "registrada"}
    assert asyncio.run(awana_contrato.resolver_pieza("99")) is None and asyncio.run(awana_contrato.resolver_pieza("x")) is None
    # Sin titular, no se pierde: «(sin titular)».
    assert asyncio.run(awana_contrato.PIEZAS_V1.registrar({}, 5))["titular"] == "(sin titular)"
    with pytest.raises(AttributeError):
        awana_contrato.PIEZAS_V1.crear   # noqa: B018 — solo lo que el contrato declara


# --- su base propia (E4c) ----------------------------------------------------------------------------------------


class _Conexion:
    def __init__(self, filas: int) -> None:
        self.filas = filas

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False


class _Motor:
    def __init__(self, filas: int) -> None:
        self.filas = filas

    def connect(self):
        return _Conexion(self.filas)

    async def dispose(self):
        pass


@pytest.mark.parametrize("propia, documental, se_niega", [(0, 3, True), (0, 0, False), (3, 3, False)])
def test_el_seguro_no_arranca_sobre_su_base_vacia_si_la_documental_tiene_piezas(monkeypatch, propia, documental, se_niega):
    from awana import config as awana_config, db as awana_db

    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:c@h/qillqa")
    monkeypatch.setattr(awana_config.config, "database_url", "postgresql+asyncpg://u:c@h/qillqa")
    monkeypatch.setattr(awana_config.config, "awana_database_url", "postgresql+asyncpg://u:c@h/awana")
    monkeypatch.setattr(awana_db, "motor", _Motor(propia))
    monkeypatch.setattr(awana_db, "create_async_engine", lambda _url: _Motor(documental))

    async def cuenta(conexion, tabla):
        assert tabla == "prensa_piezas"
        return conexion.filas

    monkeypatch.setattr(awana_db, "_cuenta", cuenta)
    assert asyncio.run(awana_db._sin_separar()) is se_niega


def test_sin_su_base_aparte_no_hay_seguro_ni_separacion(monkeypatch):
    from awana import config as awana_config, db as awana_db

    monkeypatch.setattr(awana_config.config, "awana_database_url", "")
    assert asyncio.run(awana_db._sin_separar()) is False
    with pytest.raises(SystemExit):
        asyncio.run(awana_db.separar())
