import { useCallback, useEffect, useRef, useState } from 'react'

/* Con 0.4 —el valor con el que esto se escribió— una empresa de treinta y pico cargos no
   entraba en pantalla, y "Ajustar" dejaba el árbol cortado a los dos lados en vez de
   ajustarlo. El piso baja para que ajustar realmente ajuste. */
export const ZOOM_MIN = 0.15

/* Pero entrar a la pantalla y encontrarse el organigrama entero a 19% es encontrarse cuadros
   de 35 px: no se leen ni se pueden agarrar. Así que abrir y ajustar dejan de ser lo mismo.
   Al abrir se llega a una escala legible con la raíz arriba —de ahí se navega—, y ver todo de
   una es lo que hace el botón, a propósito y cuando se lo pide. */
export const ZOOM_LEGIBLE = 0.55
export const ZOOM_MAX = 1.6

/* Zoom, desplazamiento y "ajustar a la pantalla" del organigrama. Vive aparte de la pantalla
   porque no tiene nada que ver con la estructura: es solo cómo se la mira.

   `ignorarPan` es el selector de lo que NO debe mover el fondo al presionarse. Sin esto,
   agarrar un cuadro para acomodarlo empuja además el lienzo, y el cuadro se va al doble de
   distancia que el puntero. */
export function useLienzo({ tree, ignorarPan } = {}) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [arrastrando, setArrastrando] = useState(false)
  const origen = useRef({ x: 0, y: 0 })

  /* Un organigrama real no entra a escala 1:1 en una pantalla, así que la vista arranca
     ajustada al ancho. `offsetWidth` mide sin transformar, o sea el tamaño natural. */
  const ajustar = useCallback((piso = ZOOM_MIN) => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage || !stage.offsetWidth) return
    const escala = (canvas.clientWidth - 56) / stage.offsetWidth
    setZoom(Math.max(piso, Math.min(1, escala)))
    setPan({ x: 0, y: 0 })
  }, [])

  useEffect(() => { ajustar(ZOOM_LEGIBLE) }, [tree, ajustar])

  /* LLEVAR LA VISTA A UN CUADRO. Buscar en un árbol de cinco mil píxeles no sirve de nada si
     después hay que encontrarlo a mano.

     El corrimiento se suma en píxeles de pantalla y no en coordenadas del árbol: `translate` va
     ANTES que `scale` en la transformación, así que mover el panel un píxel mueve lo dibujado un
     píxel, sea cual sea el zoom. Por eso alcanza con restar los dos centros.

     Si el zoom está por debajo de lo legible se sube primero: llegar al cuadro correcto y
     encontrarlo de 30 px es la mitad del trabajo. El centrado se hace después de pintar, cuando
     la nueva escala ya movió al elemento de lugar. */
  const centrar = useCallback((el, { zoomMin = ZOOM_LEGIBLE } = {}) => {
    if (!el || !canvasRef.current) return
    setZoom(z => Math.max(z, zoomMin))
    requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const c = canvas.getBoundingClientRect()
      const e = el.getBoundingClientRect()
      const dx = (c.left + c.width / 2) - (e.left + e.width / 2)
      const dy = (c.top + c.height / 2) - (e.top + e.height / 2)
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    })
  }, [])

  // La rueda hace zoom en vez de scrollear, así que el listener va nativo: React
  // registra onWheel como pasivo y ahí preventDefault() no tiene efecto.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = e => {
      e.preventDefault()
      setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - e.deltaY * 0.0012)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (!arrastrando) return
    const mover = e => setPan({ x: e.clientX - origen.current.x, y: e.clientY - origen.current.y })
    const soltar = () => setArrastrando(false)
    window.addEventListener('mousemove', mover)
    window.addEventListener('mouseup', soltar)
    return () => {
      window.removeEventListener('mousemove', mover)
      window.removeEventListener('mouseup', soltar)
    }
  }, [arrastrando])

  const empezarArrastre = e => {
    if (e.button !== 0) return
    if (ignorarPan && e.target.closest(ignorarPan)) return
    origen.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    setArrastrando(true)
  }

  return {
    canvasRef, stageRef, zoom, setZoom, pan, arrastrando, empezarArrastre, ajustar, centrar,
    estiloStage: { transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${zoom})` },
  }
}
