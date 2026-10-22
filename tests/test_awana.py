"""tests/test_awana.py — el editor de piezas (proyecto Awana, editores E4a; fase 10.2b, 2026-10-20) sobre la base común
de los editores: sus páginas y su API bajo /api/piezas/editor/, sus imágenes (subirlas, listarlas) y, con una Mediateca
falsa, el selector con ella y lo subido que también entra.
"""
import base64
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient
from tiqsi import puertos

from awana import api as piezas
from ruray import mediateca as estudio_mediateca
from ruray.pruebas import PNG, MediatecaFalsa, entorno  # noqa: F401 — el entorno temporal común de los editores (Ruray)

BASE = "/api/piezas/editor"
DATO = "data:image/png;base64," + base64.b64encode(PNG).decode()


def _cliente():
    app = FastAPI()
    app.include_router(piezas.router_editor)
    app.dependency_overrides[puertos.usuario_actual] = lambda: SimpleNamespace(id=7, rol="asesor")
    c = TestClient(app)
    assert c.post(f"{BASE}/sesion").status_code == 200
    return c


def test_sus_paginas_y_nada_mas(entorno):
    c = _cliente()
    for pagina in ("editor.html", "editor-avanzado.js", "editor-avanzado.css", "empaquetar.js", "qr.js", "imgbank.js"):
        assert c.get(f"{BASE}/{pagina}").status_code == 200, pagina
    assert c.get(f"{BASE}/").headers["content-type"].startswith("text/html")
    assert c.get(f"{BASE}/servidor/servidor.py").status_code == 404
    assert c.get(f"{BASE}/estudio-tema.css").status_code == 200                                 # lo común, de Ruray
    for ruta in ("preprensa.py", "embeber-foto.py", "README.md"):                              # ni sus guiones ni su README
        assert c.get(f"{BASE}/{ruta}").status_code in (403, 404), ruta
    assert c.get(f"{BASE}/api/video-config").json()["error"] == "Esto lo hace el editor de videos."
    assert c.post(f"{BASE}/api/exportar-foto", json={}).status_code == 404      # es del editor de fotos


def test_sus_imagenes(entorno):
    c = _cliente()
    r = c.post(f"{BASE}/api/imagenes", json={"filename": "logo nuevo.png", "dataURL": DATO}).json()
    assert r == {"ok": True, "name": "subidas-editor / logo nuevo.png", "url": f"{BASE}/banco/subidas-editor/logo%20nuevo.png"}
    urls = [i["url"] for i in c.get(f"{BASE}/api/imagenes").json()]
    assert f"{BASE}/banco/actividad/plaza.png" in urls and r["url"] in urls
    assert c.get(r["url"]).content == PNG


def test_con_la_mediateca(entorno, monkeypatch):
    tmp, _ = entorno
    falsa = MediatecaFalsa(tmp / "mediateca")
    monkeypatch.setattr(estudio_mediateca, "ft", falsa)
    monkeypatch.setattr(estudio_mediateca, "con_mediateca", lambda: True)
    c = _cliente()
    assert c.get(f"{BASE}/api/health").json()["fototeca"] is True
    assert c.get(f"{BASE}/api/imagenes").json()[0]["url"] == f"{BASE}/banco/fototeca/ft-5-0.jpg"
    r = c.post(f"{BASE}/api/imagenes", json={"filename": "logo.png", "dataURL": DATO}).json()
    assert r["fototeca"]["id"] == 41 and falsa.ingresos[-1]["etiquetas"] == ["Prensa"]
    g = c.post(f"{BASE}/api/fototeca-pieza", json={"dataURL": DATO, "titulo": "Afiche", "origenes": [f"{BASE}/banco/fototeca/ft-5-0.jpg"]}).json()
    assert g["ok"] and falsa.ingresos[-1]["origen"] == 5 and falsa.ingresos[-1]["metadatos"]["ambito"] == "prensa"
