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
   entera sigue debajo, a la vista. */

/* Cuánto espacio hace falta debajo para que la lista quepa sin quedar cortada por el pie del
   modal. Si no lo hay, se abre hacia arriba: un desplegable que se abre siempre hacia abajo
   deja al último campo del formulario eligiendo a ciegas. */
const ALTO_LISTA = 290

export default function SelectorLista({
  valor, valores, onCambio, opciones, vacia, placeholder = 'Elegir…', multiple = false,
}) {
  const [abierto, setAbierto] = useState(false)
  const [haciaArriba, setHaciaArriba] = useState(false)
  const [busca, setBusca] = useState('')
  const caja = useRef(null)

  useEffect(() => {
    if (!abierto) { setBusca(''); return }
    const fuera = e => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
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
  const filtradas = texto
    ? todas.filter(o => `${o.nombre} ${o.detalle || ''}`.toLowerCase().includes(texto))
    : todas

  return (
    <div className="pl-dropdown-wrap" ref={caja}>
      <button
        type="button"
        className={`pl-dropdown-trigger og-sedes-trigger${abierto ? ' open' : ''}`}
        onClick={() => {
          const r = caja.current.getBoundingClientRect()
          setHaciaArriba(window.innerHeight - r.bottom < ALTO_LISTA && r.top > ALTO_LISTA)
          setAbierto(a => !a)
        }}
        aria-expanded={abierto}
      >
        <span className={`og-sedes-resumen${elegida?.vacia || !elegida ? ' og-selector-vacio' : ''}`}>
          {elegida ? elegida.nombre : placeholder}
        </span>
        <ChevronDown size={14} className="pl-dropdown-chevron" />
      </button>

      {abierto && (
        <div className={`pl-dropdown-menu og-sedes-menu${haciaArriba ? ' og-lista-arriba' : ''}`}>
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
            {filtradas.map(o => {
              const marcada = estaMarcada(o)
              return (
                <button
                  key={o.id ?? '__vacia'}
                  type="button"
                  className={`og-sede-check${marcada ? ' on' : ''}${o.vacia ? ' og-sede-todas' : ''}`}
                  /* El anidamiento se dibuja con sangría en la LISTA, no metiéndolo dentro del
                     nombre: en el resumen de arriba ese prefijo se leía como parte del texto. */
                  style={o.nivel ? { paddingLeft: 11 + o.nivel * 15 } : undefined}
                  onClick={() => {
                    if (!multiple) { onCambio(o.id); setAbierto(false); return }
                    /* La fila vacía limpia todo; el resto suma o saca. La lista NO se cierra:
                       marcar cinco personas cerrando el panel cinco veces es el gesto que hace
                       que nadie use el campo. */
                    if (o.vacia) { onCambio([]); setAbierto(false); return }
                    onCambio(marcadas.includes(o.id)
                      ? marcadas.filter(x => x !== o.id)
                      : [...marcadas, o.id])
                  }}
                >
                  <span className="og-sede-tick">{marcada && <Check size={11} />}</span>
                  <span className="og-sede-txt">
                    <span className="og-sede-nom">{o.nombre}</span>
                    {o.detalle && <em>{o.detalle}</em>}
                  </span>
                </button>
              )
            })}
          </div>

          {filtradas.length === 0 && (
            <p className="og-sedes-vacio">Nada coincide con “{busca.trim()}”.</p>
          )}
        </div>
      )}
    </div>
  )
}
