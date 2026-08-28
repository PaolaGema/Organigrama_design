import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'

/* EL MENÚ DE "AGREGAR". Uno solo, usado desde dos sitios: el botón flotante de la esquina
   —que agrega al organigrama en general— y el "+" de cada cuadro, que agrega AHÍ.

   Vive aparte porque son el mismo objeto con distinto contenido. Duplicar el marcado
   terminaba en dos menús que se ven igual hasta que alguien toca uno de los dos.

   Cada opción es `{ id, Icon, titulo, detalle, bloqueo, accion }`. `bloqueo`, cuando existe,
   apaga el botón y su texto reemplaza al detalle: el motivo se lee donde estaba la promesa. */
export function ListaCrear({ titulo, opciones, onElegir }) {
  return (
    <div className="og-crear-menu">
      <div className="og-crear-hd">{titulo}</div>
      {opciones.map(o => (
        <button
          key={o.id}
          className="og-crear-op"
          disabled={!!o.bloqueo}
          onClick={() => onElegir(o)}
        >
          <span className="og-crear-ico"><o.Icon size={15} /></span>
          <div>
            <strong>{o.titulo}</strong>
            <small>{o.bloqueo || o.detalle}</small>
          </div>
        </button>
      ))}
    </div>
  )
}

/* EL "+" DE UN CUADRO. Crear desde el cuadro ahorra los dos campos que el gesto ya contestó
   —en qué área y bajo qué jefe— y que, abriendo el formulario desde la esquina, hay que
   volver a buscar en dos desplegables.

   EL MENÚ SE DIBUJA FUERA DEL LIENZO, contra la pantalla. El escenario del organigrama vive
   dentro de un `transform: scale()` que arranca en 0.55 y baja hasta 0.15: un menú dibujado
   como hijo del cuadro se encogería con él y quedaría ilegible justo cuando más lejos se está
   mirando. Por eso el portal y la posición fija, calculada del rectángulo real del botón.

   `opciones` es una FUNCIÓN y no un arreglo: hay un "+" por cuadro y armar la lista de todos
   en cada repintado es trabajo tirado. Se llama al abrir, que es cuando importa. */
export function MasEnNodo({ titulo, rotulo, opciones }) {
  const [lista, setLista] = useState(null)   // null = cerrado
  const [ancla, setAncla] = useState(null)   // rectángulo del botón en pantalla
  const [pos, setPos] = useState(null)       // dónde cae el menú, ya acomodado
  const boton = useRef(null)
  const menu = useRef(null)

  const abrir = () => {
    if (lista) { setLista(null); return }
    setAncla(boton.current.getBoundingClientRect())
    setPos(null)
    setLista(opciones())
  }
  const cerrar = () => { setLista(null); setPos(null) }

  /* Se acomoda DESPUÉS de medirlo: un menú de 264 px abierto desde un cuadro pegado al borde
     derecho se saldría de la pantalla, y hacia abajo se cortaría contra el pie. Se prueba
     abajo a la derecha —que es de donde nace— y se voltea solo si no entra. */
  useLayoutEffect(() => {
    if (!lista || !menu.current || !ancla) return
    const m = menu.current.getBoundingClientRect()
    const margen = 12
    let x = ancla.left
    let y = ancla.bottom + 6
    if (x + m.width > window.innerWidth - margen) x = window.innerWidth - margen - m.width
    if (x < margen) x = margen
    if (y + m.height > window.innerHeight - margen) y = Math.max(margen, ancla.top - 6 - m.height)
    setPos({ x, y })
  }, [lista, ancla])

  /* La rueda hace zoom y el fondo se arrastra: las dos cosas mueven el cuadro y dejarían al
     menú apuntando a un lugar vacío. Más barato cerrarlo que perseguirlo. */
  useEffect(() => {
    if (!lista) return
    const fuera = e => {
      if (menu.current?.contains(e.target) || boton.current?.contains(e.target)) return
      cerrar()
    }
    const tecla = e => { if (e.key === 'Escape') cerrar() }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    window.addEventListener('wheel', cerrar, { passive: true })
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
      window.removeEventListener('wheel', cerrar)
      window.removeEventListener('resize', cerrar)
    }
  }, [lista])

  return (
    <>
      <button
        ref={boton}
        className={`og-mas${lista ? ' on' : ''}`}
        title={rotulo}
        aria-label={rotulo}
        aria-expanded={!!lista}
        /* El cuadro se arrastra y se abre con doble clic. Los dos gestos empiezan acá arriba,
           así que el botón corta los tres: el arrastre, el doble clic y el paneo del fondo. */
        data-no-pan=""
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); abrir() }}
      >
        <Plus size={12} />
      </button>

      {lista && createPortal(
        <div
          ref={menu}
          className="og-mas-menu"
          /* Invisible hasta estar medido: un fotograma en la esquina equivocada se ve como un
             salto y no como un menú que abre. */
          style={{ left: pos?.x ?? 0, top: pos?.y ?? 0, opacity: pos ? 1 : 0 }}
        >
          <ListaCrear
            titulo={titulo}
            opciones={lista}
            onElegir={o => { cerrar(); o.accion() }}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
