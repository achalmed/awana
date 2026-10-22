/**
 * El editor de piezas SOLO en el navegador (Awana): la cáscara mínima de Tiqsi con el módulo web del editor, contra el
 * anfitrión mínimo del backend (awana/sola.py). No importa nada de Qillqa. Se construye desde la raíz con
 * `npm run web:construir`.
 */
import { createRoot } from 'react-dom/client'
import { CascaronMinimo } from '@qillqa/tiqsi/minimo'
import { AWANA } from './componentes/piezas/modulo'

createRoot(document.getElementById('root')!).render(<CascaronMinimo modulo={AWANA} />)
