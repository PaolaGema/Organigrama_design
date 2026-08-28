import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

/* El desplegable de los formularios del organigrama.

   Reemplaza al `<select>` nativo, que lo dibuja el sistema operativo: no acepta dos renglones
   por opción —"Camila Herrera · Ejecutiva Comercial"—, no se puede buscar dentro, y al lado
   del selector de sedes, que sí es nuestro, parecía de otra aplicación.

   El buscador está SIEMPRE, no a partir de cierta cantidad de opciones. Aparecer recién pasada
   la docena hacía que el mismo campo se comportara distinto según cuántos cargos hubiera, y
   quien ya sabe el nombre de lo que busca tenía que averiguar antes si esta vez le tocaba
   escribirlo o recorrer la lista. Con pocas opciones el campo sobra, pero no estorba: la lista
   entera sigue debajo, a la vista.

   Con `arbol`, las opciones traen `padreId` y la lista sale en orden de árbol, sangrada y con
   las líneas de rama: todo a la vista, sin plegar. Se probaron el plegado y la navegación por
   niveles pensando en las empresas de cincuenta áreas, y las dos piden un clic antes de poder
   mirar; la lista abierta se recorre con la rueda del mouse y el buscador se encarga del
   volumen. Para eso está, y buscando muestra la ruta de cada resultado. */

/* Cuánto espacio hace falta debajo para que la lista quepa entera. Si no lo hay se abre hacia
   arriba: un desplegable que se abre siempre hacia abajo deja al último campo del formulario
   eligiendo a ciegas. */
const ALTO_LISTA = 320
/* Nunca menos que esto: una lista de dos renglones no se puede usar, así que si ni arriba ni
   abajo hay lugar, se tapa un poco del formulario antes que dejarla inservible. */
const ALTO_MINIMO = 180
/* Aire contra el borde de la ventana. */
const MARGEN = 12
/* Cuánto sangra cada escalón. */
const SANGRIA = 20

export default function SelectorLista({
  valor, valores, onCambio, opciones, vacia, placeholder = 'Elegir…', multiple = false,
  arbol = false,
}) {
  const [abierto, setAbierto] = useState(false)
  /* Dónde dibujar la lista, en coordenadas de ventana. Iba pegada al campo con `absolute`, y
     el modal la recortaba: `.pl-modal` tiene `overflow: hidden`, así que en el formulario de
     unidad —que es corto— del desplegable de áreas se veía una fila y media. Con `fixed` la
     lista sale del modal y se ve entera; a cambio hay que seguir al campo cuando algo scrollea,
     o quedaría flotando lejos de él. */
  const [pos, setPos] = useState(null)
  const [busca, setBusca] = useState('')
  const caja = useRef(null)

  /* Se recalcula, no se cierra. Cerrar al primer scroll dejaba el campo imposible de abrir: el
     buscador de la lista toma el foco solo, el navegador scrollea lo justo para mostrarlo y esa
     migaja de scroll cerraba la lista en el mismo instante en que se abría. */
  const ubicar = () => {
    const r = caja.current?.getBoundingClientRect()
    if (!r) return
    /* Se elige el lado que más espacio tiene y la lista se achica a lo que ahí entra. Antes se
       abría hacia abajo con su alto entero: en una ventana baja eso la dejaba dibujada por
       debajo del borde, invisible, y el campo parecía no abrirse. */
    const abajo = window.innerHeight - r.bottom - MARGEN
    const encima = r.top - MARGEN
    const arriba = abajo < Math.min(ALTO_LISTA, encima)
    /* Los DOS bordes, siempre, con el que no manda en `auto`. Mandando solo uno, el otro
       quedaba con el valor del cálculo anterior —arriba y abajo a la vez— y entre dos bordes
       que se cruzan el navegador resuelve la altura en cero: la lista existía, medía 16 px y
       estaba fuera de la pantalla. Se veía como un campo que no abre. */
    setPos({
      left: Math.max(MARGEN, Math.min(r.left, window.innerWidth - r.width - MARGEN)),
      width: r.width,
      maxHeight: Math.max(ALTO_MINIMO, Math.min(ALTO_LISTA, arriba ? encima : abajo)),
      top: arriba ? 'auto' : r.bottom + 6,
      bottom: arriba ? window.innerHeight - r.top + 6 : 'auto',
    })
  }

  useEffect(() => {
    if (!abierto) { setBusca(''); setPos(null); return }
    const fuera = e => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    /* En captura: lo que scrollea es la columna del modal, no la ventana. */
    window.addEventListener('scroll', ubicar, true)
    window.addEventListener('resize', ubicar)
    return () => {
      document.removeEventListener('mousedown', fuera)
      window.removeEventListener('scroll', ubicar, true)
      window.removeEventListener('resize', ubicar)
    }
  }, [abierto])

  /* La opción vacía es una opción más —"sin jefe", "vacante"— y entra primera, que es donde
     la busca quien quiere dejar el campo en blanco. */
  const todas = vacia ? [{ id: null, nombre: vacia, vacia: true }, ...opciones] : opciones
  const marcadas = multiple ? (valores || []) : []
  const estaMarcada = o => (multiple
    /* Con nada elegido, la que queda marcada es la fila vacía: "nadie asignado" también es
       una respuesta y tiene que verse contestada. */
    ? (o.vacia ? marcadas.length === 0 : marcadas.includes(o.id))
    : String(o.id ?? '') === String(valor ?? ''))
  const elegidas = multiple ? opciones.filter(o => marcadas.includes(o.id)) : []
  const elegida = multiple
    ? (elegidas.length ? { nombre: elegidas.map(o => o.nombre).join(', ') } : null)
    : todas.find(o => String(o.id ?? '') === String(valor ?? ''))
  const texto = busca.trim().toLowerCase()

  /* El árbol de opciones. `padreId` puede apuntar a una que no está en la lista —al mover un
     área, ella y las suyas no se ofrecen— y esa opción se dibuja entonces en el primer nivel. */
  const porId = new Map(opciones.map(o => [o.id, o]))
  const padreDe = o => (o?.padreId != null && porId.has(o.padreId) ? o.padreId : null)
  const hijas = new Map()
  if (arbol) {
    for (const o of opciones) {
      const p = padreDe(o)
      if (!hijas.has(p)) hijas.set(p, [])
      hijas.get(p).push(o)
    }
  }
  /* El camino hasta la raíz. En la lista abierta la jerarquía la cuentan la sangría y las
     líneas; buscando no hay sangría que valga —los padres quedan fuera del filtro— y el camino
     pasa al renglón de abajo: "Marketing Digital · Dirección General › Marketing". */
  const caminoDe = o => {
    const partes = []
    for (let p = padreDe(o); p != null; p = padreDe(porId.get(p))) partes.unshift(porId.get(p).nombre)
    return partes.join(' › ')
  }
  /* En orden de árbol: cada área seguida de las suyas, sangradas un escalón más. */
  const enOrden = (padre = null, nivel = 0) => (hijas.get(padre) || [])
    .flatMap(o => [{ o, nivel }, ...enOrden(o.id, nivel + 1)])

  const alElegir = o => {
    if (!multiple) { onCambio(o.id); setAbierto(false); return }
    /* La fila vacía limpia todo; el resto suma o saca. La lista NO se cierra: marcar cinco
       personas cerrando el panel cinco veces es el gesto que hace que nadie use el campo. */
    if (o.vacia) { onCambio([]); setAbierto(false); return }
    onCambio(marcadas.includes(o.id) ? marcadas.filter(x => x !== o.id) : [...marcadas, o.id])
  }

  const fila = (o, { nivel = 0, camino = '' } = {}) => {
    const marcada = estaMarcada(o)
    const detalle = camino || o.detalle
    return (
      <button
        key={o.id ?? '__vacia'}
        type="button"
        className={`og-sede-check${marcada ? ' on' : ''}${o.vacia ? ' og-sede-todas' : ''}${nivel ? ' og-op-hija' : ''}`}
        /* El anidamiento se dibuja con sangría en la LISTA, no metiéndolo dentro del nombre: en
           el resumen de arriba ese prefijo se leía como parte del texto.

           Quince píxeles de sangría a secas se leían como un renglón mal alineado y no como
           "está adentro de la de arriba". Ahora la sangría es mayor y la acompañan las líneas
           del árbol —una por escalón, con el codo en el último—, que es como el organigrama
           dibuja lo mismo dos campos más allá. */
        style={nivel ? { paddingLeft: 11 + nivel * SANGRIA } : undefined}
        onClick={() => alElegir(o)}
      >
        {Array.from({ length: nivel }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`og-op-guia${i === nivel - 1 ? ' og-op-codo' : ''}`}
            style={{ left: 16 + i * SANGRIA }}
          />
        ))}
        <span className="og-sede-tick">{marcada && <Check size={11} />}</span>
        <span className="og-sede-txt">
          <span className="og-sede-nom">{o.nombre}</span>
          {detalle && <em>{detalle}</em>}
        </span>
      </button>
    )
  }

  const filtradas = todas.filter(o => !texto
    || `${o.nombre} ${o.detalle || ''} ${arbol ? caminoDe(o) : ''}`.toLowerCase().includes(texto))
  const filas = arbol && !texto
    ? [...(vacia ? [fila(todas[0])] : []), ...enOrden().map(({ o, nivel }) => fila(o, { nivel }))]
    : filtradas.map(o => fila(o, { camino: arbol && !o.vacia ? caminoDe(o) : '' }))

  return (
    <div className="pl-dropdown-wrap" ref={caja}>
      <button
        type="button"
        className={`pl-dropdown-trigger og-sedes-trigger${abierto ? ' open' : ''}`}
        onClick={() => {
          ubicar()
          setAbierto(a => !a)
        }}
        aria-expanded={abierto}
      >
        <span className={`og-sedes-resumen${elegida?.vacia || !elegida ? ' og-selector-vacio' : ''}`}>
          {elegida ? elegida.nombre : placeholder}
        </span>
        <ChevronDown size={14} className="pl-dropdown-chevron" />
      </button>

      {abierto && pos && (
        <div className="pl-dropdown-menu og-sedes-menu og-lista-fija" style={pos}>
          <div className="pl-search-wrap og-lista-buscar">
            <Search size={13} className="pl-search-ico" />
            <input
              className="pl-search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar"
              autoFocus
            />
          </div>

          {/* Elegir UNO y elegir VARIOS se ven distinto a propósito: la casilla es lo que
              dice "puedo marcar más de una". Donde solo cabe una respuesta no hay casillas,
              solo un ✓ sobre la elegida. */}
          <div className={`og-sedes-check${multiple ? '' : ' og-lista-simple'}`}>
            {filas}
          </div>

          {filtradas.length === 0 && (
            <p className="og-sedes-vacio">Nada coincide con “{busca.trim()}”.</p>
          )}
        </div>
      )}
    </div>
  )
}
