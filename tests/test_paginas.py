"""tests/test_paginas.py — las páginas del editor de piezas (`paginas/`): sus textos neutros son los del servidor del
estudio y sus bloques de colores, los del kit común. Venían de las pruebas del estudio (Ruray, estudio/tests/test_servidor.py
y test_kit.py) y salieron con las páginas el 2026-10-21.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest
from ruray.pruebas import UNANCHA, entorno  # noqa: F401 — `entorno` es un fixture

PAGINAS = Path(__file__).resolve().parents[1] / "paginas"


def test_textos_neutros_del_editor_son_los_del_servidor(entorno):
    """Los neutros de los marcadores {{…}} de editor.html son los del servidor del estudio (y los del kit, que vigila
    Ruray); y la página no nombra una región ni un cargo concretos."""
    _, srv = entorno
    texto = (PAGINAS / "editor.html").read_text(encoding="utf-8")
    for k, v in srv.TEXTOS_NEUTROS.items():
        assert re.search(r'\b%s\s*:\s*"%s"' % (k, re.escape(v)), texto), k


@pytest.fixture(scope="module")
def web():
    """Las marcas y los bloques que HOY da el generador de Unancha (adaptadores/lib/web.py), en su propio proceso."""
    if not (UNANCHA / "tokens").is_dir():
        pytest.skip("sin el kit común: UNANCHA_DIR")
    codigo = ("import json, sys; sys.path.insert(0, '.'); from adaptadores.lib import web as w; "
              "print(json.dumps({'MARCAS_JS': w.MARCAS_JS, 'MARCAS_CSS': w.MARCAS_CSS, "
              "'bloque_editor': w.bloque_editor(), 'bloque_css': w.bloque_css()}))")
    r = subprocess.run([sys.executable, "-c", codigo], cwd=UNANCHA, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[-1500:]
    return json.loads(r.stdout)


@pytest.mark.parametrize("marcas,cuerpo", [("MARCAS_JS", "bloque_editor"), ("MARCAS_CSS", "bloque_css")])
def test_los_bloques_de_colores_del_editor_son_los_del_kit(web, marcas, cuerpo):
    """Los bloques GENERADOS de colores de editor.html son los que hoy da Unancha: si cambia un token, esta prueba lo
    avisa y los bloques se copian de Unancha."""
    texto = (PAGINAS / "editor.html").read_text(encoding="utf-8")
    inicio, fin = web[marcas]
    a, b = texto.find(inicio), texto.find(fin)
    assert a >= 0 and b > a, f"editor.html no tiene las marcas {inicio} … {fin}"
    assert texto[a:b + len(fin)] == web[cuerpo], "editor.html: el bloque de tokens no es el que hoy da Unancha"
