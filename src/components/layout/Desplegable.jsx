import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

/* EL DESPLEGABLE DE LA CASA.
   Un `<select>` nativo lo dibuja el sistema operativo: su flecha, su lista y su resaltado son
   los de Windows o los de macOS, no los de SoulyHR, y puesto al lado de un `.pl-input` se ve
   como una pieza de otra aplicación. No hay CSS que lo arregle —el desplegable abierto vive
   fuera de la página—, así que se dibuja uno propio.

   LO QUE SE GANA A CAMBIO DE ESCRIBIRLO: el disparador es idéntico a un campo de texto —incluido
   el hueco hundido cuando no hay nada elegido—, la opción activa se marca con el verde de la
   marca, y la lista se abre hacia arriba cuando no cabe abajo.

   LO QUE HAY QUE DEVOLVER A CAMBIO es lo que el nativo daba gratis, y por eso está aquí y no
   improvisado en cada pantalla: cerrar al hacer clic fuera, cerrar con Escape devolviendo el
   foco, recorrer con las flechas, elegir con Enter, y anunciarse como listbox a un lector de
   pantalla. Escrito una vez, correcto en todas. */

const ALTO_MENU = 240

/* A PARTIR DE CUÁNTAS OPCIONES APARECE EL BUSCADOR.
   Con dos —activa y cerrada— un campo de búsqueda es una burla; con doscientas ciudades, recorrer
   la lista con la rueda es peor que teclear. Ocho es donde la lista deja de caber de un vistazo,
   el mismo umbral que usa la tabla de la estructura.

   No es «siempre» a propósito: el mismo control se usa para listas de dos y de doscientas, y un
   buscador fijo obligaría a mirar si esta vez hace falta. */
const CON_BUSCADOR = 8

const sinTildes = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Desplegable({
  id,
  valor,
  opciones,
  placeholder = 'Elige una opción',
  onCambio,
  ariaLabel,
}) {
  const [abierto, setAbierto] = useState(false)
  const [busca, setBusca] = useState('')
  const [activo, setActivo] = useState(-1)
  const cajaRef = useRef(null)
  const botonRef = useRef(null)
  const menuRef = useRef(null)
  /* LA LISTA SE DIBUJA EN COORDENADAS DE VENTANA, no dentro de su campo.
     Iba en absoluto colgando del disparador, y eso la deja a merced del primer antepasado que
     recorte: dentro de un modal —`.pl-modal-body` scrollea, `.pl-modal` esconde lo que se sale—
     las opciones de los últimos campos aparecían cortadas por el borde de la ventana, o
     directamente no aparecían. Lo mismo pasaba en cualquier tabla con desplazamiento lateral.

     Con `fixed` sale del recuadro y se ve entera. A cambio hay que medir dónde está el campo al
     abrirla y volver a medir mientras la página se mueve, que es lo que hace `seguir`. */
  const [pos, setPos] = useState(null)

  // Se admiten cadenas sueltas o pares {valor, etiqueta}: la mayoría de las listas son lo primero.
  const items = opciones.map(o => (typeof o === 'string' ? { valor: o, etiqueta: o } : o))
  const elegida = items.find(o => o.valor === valor) || null

  /* Busca sin tildes: nadie escribe «Potosí» ni «Bogotá» con acento en un buscador, y una lista
     que no encuentra lo que se le pide bien escrito enseña a no usarla. */
  const hayBuscador = items.length > CON_BUSCADOR
  const escrito = busca.trim()
  const visibles = escrito
    ? items.filter(o => sinTildes(o.etiqueta).includes(sinTildes(escrito)))
    : items
  /* DÓNDE VA LA LISTA, medido contra la ventana. Se calcula al abrir y no al montar porque la
     página se desplaza: el mismo campo cabe o no cabe según dónde esté el scroll. El ancho sale
     del campo para que la lista siga siendo suya y no un rectángulo suelto encima de la pantalla.

     `arriba` viaja con la posición y no en su propio estado: son el mismo dato —de qué lado del
     campo se abre— y separados podían discrepar por un dibujo. */
  const medir = () => {
    const c = botonRef.current?.getBoundingClientRect()
    if (!c) return null
    const arriba = c.bottom + ALTO_MENU > window.innerHeight && c.top > ALTO_MENU
    return {
      arriba,
      left: c.left,
      width: c.width,
      ...(arriba ? { bottom: window.innerHeight - c.top + 6 } : { top: c.bottom + 6 }),
    }
  }

  useEffect(() => {
    if (!abierto) return
    /* La lista sigue siendo hija de `cajaRef` —cambia dónde se dibuja, no de quién cuelga— así
       que "clic fuera" se pregunta igual que siempre. */
    const fuera = e => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false) }
    /* AL DESPLAZAR, LA LISTA SIGUE AL CAMPO. Fija en la ventana, un scroll del modal la dejaría
       flotando sobre otra cosa. Se vuelve a medir en vez de cerrar —cerrar en cada rueda dentro
       de un formulario largo es insufrible— y solo se cierra cuando el campo se fue de la
       pantalla, que es cuando ya no hay a qué quedarse pegada.

       El scroll de la propia lista no cuenta: mover la rueda entre doscientas ciudades no tiene
       por qué recolocar nada. */
    const seguir = e => {
      if (e.type === 'scroll' && menuRef.current?.contains(e.target)) return
      const p = medir()
      const c = botonRef.current?.getBoundingClientRect()
      if (!p || !c || c.bottom < 0 || c.top > window.innerHeight) { setAbierto(false); return }
      setPos(p)
    }
    document.addEventListener('mousedown', fuera)
    window.addEventListener('scroll', seguir, true)
    window.addEventListener('resize', seguir)
    return () => {
      document.removeEventListener('mousedown', fuera)
      window.removeEventListener('scroll', seguir, true)
      window.removeEventListener('resize', seguir)
    }
  }, [abierto])

  function abrir() {
    setBusca('')
    setPos(medir())
    setActivo(items.findIndex(o => o.valor === valor))
    setAbierto(true)
  }

  function elegir(v) {
    onCambio(v)
    setAbierto(false)
    setBusca('')
    botonRef.current?.focus()
  }

  /* EL ESPACIO ELIGE EN EL BOTÓN Y ESCRIBE EN EL BUSCADOR. Con el mismo manejador en los dos, la
     barra espaciadora dentro del campo de búsqueda seleccionaba la opción activa en vez de
     escribir un espacio, y «Cadena de frío» era imposible de teclear. */
  const teclasBusqueda = e => { if (e.key !== ' ') teclas(e) }

  function teclas(e) {
    if (e.key === 'Escape') {
      if (abierto) { e.preventDefault(); setAbierto(false); botonRef.current?.focus() }
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!abierto) return abrir()
      if (activo >= 0 && visibles[activo]) elegir(visibles[activo].valor)
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!abierto) return abrir()
      const paso = e.key === 'ArrowDown' ? 1 : -1
      setActivo(i => {
        const n = visibles.length
        return n === 0 ? -1 : (i < 0 ? (paso > 0 ? 0 : n - 1) : (i + paso + n) % n)
      })
    }
  }

  return (
    <div className="pl-dropdown-wrap" ref={cajaRef}>
      <button
        id={id}
        ref={botonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        /* El CSS recorta con puntos suspensivos lo que no cabe en una columna estrecha, así que
           el valor entero se guarda aquí: pasando el ratón se lee completo. Solo cuando hay algo
           elegido —un `title` con el placeholder repetiría lo que ya se ve. */
        title={elegida ? elegida.etiqueta : undefined}
        className={`pl-dropdown-trigger${abierto ? ' open' : ''}${elegida ? '' : ' placeholder'}`}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={teclas}
      >
        <span>{elegida ? elegida.etiqueta : placeholder}</span>
        <ChevronDown size={15} className="pl-dropdown-chevron" />
      </button>

      {abierto && pos && (
        <div
          ref={menuRef}
          className={`pl-dropdown-menu pl-dd-fija${pos.arriba ? ' up' : ''}`}
          role="listbox"
          tabIndex={-1}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          {hayBuscador && (
            <div className="pl-dd-buscar">
              <Search size={13} className="pl-search-ico" />
              <input
                className="pl-search"
                value={busca}
                onChange={e => { setBusca(e.target.value); setActivo(0) }}
                onKeyDown={teclasBusqueda}
                placeholder="Buscar…"
                autoFocus
              />
            </div>
          )}

          {visibles.map((o, i) => {
            const puesta = o.valor === valor
            return (
              <button
                key={o.valor}
                type="button"
                role="option"
                aria-selected={puesta}
                className={`pl-dropdown-item${puesta ? ' selected' : ''}`}
                /* El resaltado del teclado se pinta a mano: `:hover` no sabe nada de las
                   flechas, y sin esto no se ve por dónde va uno al bajar con el teclado.

                   Y UNA OPCIÓN PUEDE TRAER SU PROFUNDIDAD. Una lista de unidades organizacionales
                   es un árbol aplastado: «Recursos Humanos», «Análisis» y «ghjb» se leen como tres
                   opciones hermanas cuando en realidad una cuelga de la otra. Con `nivel` puesto,
                   cada opción se sangra como en la tabla y la lista vuelve a tener forma. Quien no
                   lo manda —los países, los estados— no cambia en nada. */
                style={{
                  /* BUSCANDO NO HAY SANGRÍA. Los resultados de una búsqueda no son hermanos
                     —salen de ramas distintas— así que sangrarlos dibuja una jerarquía falsa. Se
                     aplana, y lo que ubica a cada uno pasa a ser su camino, escrito al lado. Es
                     lo mismo que hace la tabla al filtrar: aplana y deja la columna «Depende de». */
                  ...(o.nivel && !escrito ? { paddingLeft: 12 + (o.nivel - 1) * 15 } : null),
                  ...(i === activo && !puesta ? { background: 'var(--surface-hover)' } : null),
                }}
                onMouseEnter={() => setActivo(i)}
                onClick={() => elegir(o.valor)}
              >
                {/* EL CODO VA DENTRO DE LA OPCIÓN, no de fondo: la sangría ya le reservó el hueco
                    a la izquierda del texto, así que el codo lo ocupa y no hace falta medir nada.
                    Buscando no se dibuja, por lo mismo que no se sangra: los resultados salen de
                    ramas distintas y una jerarquía dibujada entre ellos sería falsa. */}
                {!!o.nivel && !escrito && <span className="pl-dd-rama" aria-hidden="true" />}
                <span>
                  {o.etiqueta}
                  {escrito && o.pista && <span className="pl-dd-pista">en {o.pista}</span>}
                </span>
                {puesta && <Check size={14} />}
              </button>
            )
          })}

          {hayBuscador && visibles.length === 0 && (
            <p className="pl-dd-nada">Nada coincide con “{escrito}”.</p>
          )}
        </div>
      )}
    </div>
  )
}
