/**
 * El módulo web del editor de piezas (proyecto Awana, editores E4a; fase 10.2b del contrato de Tiqsi, 2026-10-20): su
 * pantalla y su ruta. En Qillqa no tiene entrada propia en el menú: Prensa (Estudio) carga su pantalla con `AWANA.cargar`
 * y la pinta en su propio marco, sin importar nada más del módulo. Solo (src/awana_sola.tsx), la cáscara mínima la monta en
 * su ruta.
 *
 * `editor.html` (publicaciones con las plantillas de la marca), servido por la API del módulo bajo /api/piezas/editor/
 * con su cookie; y el registro de las PIEZAS DE PRENSA (E4b), su otra pantalla (`/piezas/registro`), que Prensa pinta en
 * «Piezas».
 */
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined'
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined'
import { definirModuloWeb } from '@qillqa/tiqsi'

/** La pantalla del registro de las piezas de prensa. */
export const REGISTRO = '/piezas/registro'

export const AWANA = definirModuloWeb({
  id: 'piezas',
  nombre: 'Editor de piezas',
  corto: 'Piezas',
  ruta: '/piezas',
  icono: DashboardCustomizeOutlinedIcon,
  descripcion: 'Publicaciones con las plantillas de la marca, para redes y prensa.',
  opciones: [
    { etiqueta: 'Editor', ruta: '/piezas', icono: DashboardCustomizeOutlinedIcon, ayuda: 'Plantillas, texto, fotos y formatos de cada red' },
    { etiqueta: 'Piezas de prensa', ruta: '/piezas/registro', icono: NewspaperOutlinedIcon, ayuda: 'Noticias, notas y comunicados con su estado y responsable' },
  ],
  cargar: () => import('../../paginas/EditorPiezas'),
  pantallas: [{ ruta: REGISTRO, cargar: () => import('./Piezas') }],
})
