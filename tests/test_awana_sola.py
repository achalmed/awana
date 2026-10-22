"""tests/test_awana_sola.py — el editor de piezas arranca SOLO, con el anfitrión mínimo de Tiqsi, sin Qillqa y sin
Mediateca (awana/sola.py; nació en Qillqa el 2026-10-20, editores E4a): no carga nada de Qillqa
y no arranca sin su carpeta ni su secreto (el recorrido de la API es el mismo de Tullpu: tests/test_awana.py).

Corre en un subproceso: el servidor del estudio se carga una vez por proceso, con el perfil de su entorno.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
UNANCHA = Path(os.environ.get("UNANCHA_DIR") or RAIZ.parent / "unancha")
SECRETO = "k" * 40


def _entorno(tmp_path) -> dict:
    return {"HOME": os.environ.get("HOME", "/tmp"), "PATH": os.environ.get("PATH", ""), "UNANCHA_DIR": str(UNANCHA),
            "AWANA_DIR": str(tmp_path / "awana"), "JWT_SECRET": SECRETO,
            # Su base (no se abre: la aplicación se importa, no arranca).
            "AWANA_DATABASE_URL": "postgresql+asyncpg://nadie:nada@127.0.0.1:1/awana"}


def _correr(tmp_path, codigo: str, entorno: dict | None = None) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-c", codigo], cwd=RAIZ, env=entorno or _entorno(tmp_path),
                          capture_output=True, text=True, timeout=180)


def test_solo_no_carga_nada_de_qillqa(tmp_path):
    r = _correr(tmp_path, "import sys, json; import awana.sola as m; "
                          "print(json.dumps({'ajenos': sorted(x for x in sys.modules if x == 'app' or x.startswith('app.')), "
                          "'informe': m.app.state.anfitrion.informe()}))")
    assert r.returncode == 0, r.stderr[-2000:]
    datos = json.loads(r.stdout.strip().splitlines()[-1])
    assert datos["ajenos"] == []                                    # nada de Qillqa
    assert datos["informe"] == [{"id": "piezas", "nombre": "Editor de piezas", "version": "0.1.0"}]


def test_solo_sin_su_carpeta_o_sin_secreto_no_arranca(tmp_path):
    for falta in ("AWANA_DIR", "JWT_SECRET", "AWANA_DATABASE_URL"):
        entorno = {k: v for k, v in _entorno(tmp_path).items() if k != falta}
        r = _correr(tmp_path, "import awana.sola", entorno)
        assert r.returncode != 0 and falta in r.stderr, falta
