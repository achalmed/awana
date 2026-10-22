# Awana — un editor de piezas con la marca

Awana («tejer» en quechua) es un editor de piezas gráficas para el navegador, al estilo de Canva: publicaciones con las
plantillas de una marca, paletas por roles, marcos, exportación a redes, SVG editable e imprenta; y un registro de las
piezas de prensa publicadas. Es un módulo de [Tiqsi](https://github.com/achalmed/tiqsi) sobre
[Ruray](https://github.com/achalmed/ruray), la base común de los editores: funciona solo, con el anfitrión mínimo de
Tiqsi, o dentro de una plataforma que lo monte por su manifiesto (como Qillqa).

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -e '.[pruebas,sola]'   # requiere tiqsi y ruray
.venv/bin/python -m pytest -q tests
npm install && npm run web:construir
AWANA_DATABASE_URL=postgresql+asyncpg://…/awana AWANA_DIR=/ruta/awana JWT_SECRET=<32 o más caracteres> \
  AWANA_WEB=web/dist .venv/bin/uvicorn awana.sola:app --port 8039
```

Los colores, la letra, los logos y los marcos salen de un kit de identidad (`UNANCHA_DIR`). Esta es una **versión de
demostración**. Licencia: AGPL-3.0 (`LICENSE`).
