---
tipo: changelog
estado: activo
---
# CHANGELOG — awana

## [Unreleased]

### Añadido

- **Awana nace** (2026-10-21, fase 10.3 de Qillqa): el editor de piezas y el registro de las piezas de prensa salen de
  Qillqa (commit `b6ecc4d`) con su backend (`awana/`: API sobre Ruray, modelos, base propia, contrato «piezas.v1»), sus
  pruebas, su paquete web `@qillqa/awana` y su página sola, y se lleva de Ruray (`6ab8f57`) sus páginas
  (`paginas/editor.html` y sus scripts, `preprensa.py`, `embeber-foto.py`) con sus pruebas (`tests/test_paginas.py`);
  la receta de su demo (`demo/`, sobre `tiqsi.demo`); su prueba de fronteras exige que no importe nada de Qillqa.
