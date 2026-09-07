import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

/* EL CALENDARIO DE LA CASA.
   Un `<input type="date">` lo dibuja el sistema operativo: su cajita de flechas, su calendario y
   sus colores son los de Windows —y otros distintos en macOS—, así que el mismo formulario se
   veía de dos maneras y ninguna era la nuestra. Es el mismo motivo por el que existe
   `Desplegable`, y la misma respuesta: se dibuja uno propio.

   TRES NIVELES Y NO SOLO MESES. Una fecha de apertura suele ser de hace años, y llegar a 2018
   a golpe de flecha son noventa clics. Pulsando el rótulo se pasa a los meses del año, y desde
   ahí a una parrilla de doce años: cualquier fecha queda a tres clics.

   LOS DÍAS DEL MES VECINO SE VEN Y SE PUEDEN PULSAR. Dejarlos en blanco ahorra tinta y obliga a
   cambiar de mes para elegir el 30 del anterior, que es justo lo que uno estaba mirando.

   LA SEMANA EMPIEZA EN LUNES, que es como se lee un calendario aquí. Y los rótulos son
   'lu ma mi ju vi sá do' y no iniciales sueltas: con una letra, martes y miércoles son los dos
   'M' y hay que contar para saber cuál es cuál. */

const DIAS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/* Lo que se guarda es 'AAAA-MM-DD': ordena solo, no depende del huso y es lo que ya había en los
   datos. Se parte a mano en vez de con `new Date(cadena)`, que interpreta esa forma como UTC y
   en Bolivia devuelve el día anterior. */
const aPartes = v => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '')
  return m ? { a: +m[1], m: +m[2] - 1, d: +m[3] } : null
}
const aCadena = (a, m, d) => `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const mismoDia = (x, y) => x && y && x.a === y.a && x.m === y.m && x.d === y.d

/* En el disparador va la forma corta —"15 feb 2018"—: el campo comparte fila con otros y la
   forma larga no entra sin recortarse. La larga se usa al leer la ficha, donde sí hay sitio. */
const corta = p => `${p.d} ${MESES_CORTOS[p.m]} ${p.a}`

export default function SelectorFecha({ id, valor, onCambio, placeholder = 'Elegir fecha', ariaLabel }) {
  const elegida = aPartes(valor)
  const hoyD = new Date()
  const hoy = { a: hoyD.getFullYear(), m: hoyD.getMonth(), d: hoyD.getDate() }

  const [abierto, setAbierto] = useState(false)
  const [vista, setVista] = useState('dias')       // 'dias' | 'meses' | 'anios'
  const [cursor, setCursor] = useState({ a: (elegida || hoy).a, m: (elegida || hoy).m })
  /* DÓNDE CABE EL CALENDARIO SE MIDE, NO SE ADIVINA.
     Estaba escrito "si abajo no hay 330 px, ábrelo hacia arriba", y esa cifra era una estimación
     a ojo del alto del panel. Con 300 px libres —que le sobraban— se abría igual hacia arriba y
     tapaba las tres tarjetas del formulario para nada. Ahora se dibuja primero invisible, se
     mide de verdad y recién entonces se decide el lado; pasa en el mismo fotograma, así que no
     se ve ningún salto.

     Y también hay que mirar a los lados: el panel tiene ancho propio —siete columnas de días no
     entran en el ancho de un campo estrecho—, así que en el último campo de una fila se saldría
     de la ventana si se alineara siempre a la izquierda. */
  const [sitio, setSitio] = useState({ arriba: false, der: false, listo: false })
  const cajaRef = useRef(null)
  const botonRef = useRef(null)
  const popRef = useRef(null)

  useLayoutEffect(() => {
    if (!abierto) return
    const t = botonRef.current?.getBoundingClientRect()
    const c = popRef.current?.getBoundingClientRect()
    if (!t || !c) return
    const abajo = window.innerHeight - t.bottom - 10
    const encima = t.top - 10
    setSitio({
      // Hacia arriba solo si abajo no cabe Y arriba se está mejor: si no cabe en ningún lado,
      // abajo, que es donde uno lo busca.
      arriba: c.height > abajo && encima > abajo,
      der: t.left + c.width > window.innerWidth - 12,
      listo: true,
    })
    /* Solo al abrir: la vista de meses es más baja que la de días y recalcular al cambiar de
       nivel haría saltar el panel de lado bajo el cursor. La de días es la más alta, así que
       midiendo esa se acierta para las tres. */
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const fuera = e => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  function abrir() {
    setCursor({ a: (elegida || hoy).a, m: (elegida || hoy).m })
    setVista('dias')
    setSitio({ arriba: false, der: false, listo: false })
    setAbierto(true)
  }

  function elegir(a, m, d) {
    onCambio(aCadena(a, m, d))
    setAbierto(false)
    botonRef.current?.focus()
  }

  function limpiar(e) {
    e.stopPropagation()
    onCambio('')
    setAbierto(false)
  }

  const mover = paso => setCursor(c => {
    const t = c.m + paso
    return { a: c.a + Math.floor(t / 12), m: ((t % 12) + 12) % 12 }
  })

  /* Las seis semanas de la parrilla, arrancando en el lunes anterior o igual al día 1. Siempre
     seis y no las que hagan falta: con cinco en un mes y seis en el siguiente, el calendario
     cambia de alto al pasar de mes y los botones de abajo saltan bajo el cursor. */
  const celdas = []
  const primero = new Date(cursor.a, cursor.m, 1)
  const desplaz = (primero.getDay() + 6) % 7
  const inicio = new Date(cursor.a, cursor.m, 1 - desplaz)
  for (let i = 0; i < 42; i += 1) {
    const f = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
    celdas.push({ a: f.getFullYear(), m: f.getMonth(), d: f.getDate(), fuera: f.getMonth() !== cursor.m })
  }

  const decada = Math.floor(cursor.a / 12) * 12

  return (
    <div className="pl-dropdown-wrap" ref={cajaRef}>
      <button
        id={id}
        ref={botonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        className={`pl-dropdown-trigger cal-trigger${abierto ? ' open' : ''}${elegida ? '' : ' placeholder'}`}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={e => { if (e.key === 'Escape' && abierto) { e.preventDefault(); setAbierto(false) } }}
      >
        <span className="cal-cara">
          <CalendarDays size={14} className="cal-ico" />
          {elegida ? corta(elegida) : placeholder}
        </span>
        {/* La cruz solo cuando hay algo que quitar. Una fecha puesta por error, sin esto, no se
            podía borrar: cualquier clic en el calendario pone otra, ninguno lo deja vacío. */}
        {elegida && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Quitar la fecha"
            className="cal-quitar"
            onClick={limpiar}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') limpiar(e) }}
          >
            <X size={13} />
          </span>
        )}
      </button>

      {abierto && (
        <div
          ref={popRef}
          className={`cal-pop${sitio.arriba ? ' up' : ''}${sitio.der ? ' der' : ''}`}
          role="dialog"
          // Invisible mientras se mide: un fotograma en el lado equivocado se ve como un salto.
          style={sitio.listo ? undefined : { visibility: 'hidden' }}
        >
          <div className="cal-cabecera">
            <button type="button" className="cal-flecha" aria-label="Anterior"
              onClick={() => (vista === 'dias' ? mover(-1)
                : setCursor(c => ({ ...c, a: c.a - (vista === 'meses' ? 1 : 12) })))}>
              <ChevronLeft size={15} />
            </button>

            {/* El rótulo es el ascensor entre niveles: día → mes → año, y de vuelta al elegir. */}
            <button type="button" className="cal-titulo"
              onClick={() => setVista(v => (v === 'dias' ? 'meses' : v === 'meses' ? 'anios' : 'dias'))}>
              {vista === 'dias' && `${MESES[cursor.m]} ${cursor.a}`}
              {vista === 'meses' && cursor.a}
              {vista === 'anios' && `${decada} – ${decada + 11}`}
            </button>

            <button type="button" className="cal-flecha" aria-label="Siguiente"
              onClick={() => (vista === 'dias' ? mover(1)
                : setCursor(c => ({ ...c, a: c.a + (vista === 'meses' ? 1 : 12) })))}>
              <ChevronRight size={15} />
            </button>
          </div>

          {vista === 'dias' && (
            <>
              <div className="cal-semana">
                {DIAS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="cal-rejilla">
                {celdas.map(c => {
                  const puesta = mismoDia(c, elegida)
                  return (
                    <button
                      key={`${c.a}-${c.m}-${c.d}`}
                      type="button"
                      className={`cal-dia${c.fuera ? ' fuera' : ''}${puesta ? ' puesta' : ''}${mismoDia(c, hoy) ? ' hoy' : ''}`}
                      aria-label={`${c.d} de ${MESES[c.m]} de ${c.a}`}
                      aria-pressed={puesta}
                      onClick={() => elegir(c.a, c.m, c.d)}
                    >
                      {c.d}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {vista === 'meses' && (
            <div className="cal-rejilla-4">
              {MESES_CORTOS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  className={`cal-celda${elegida && elegida.a === cursor.a && elegida.m === i ? ' puesta' : ''}`}
                  onClick={() => { setCursor(c => ({ ...c, m: i })); setVista('dias') }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {vista === 'anios' && (
            <div className="cal-rejilla-4">
              {Array.from({ length: 12 }, (_, i) => decada + i).map(a => (
                <button
                  key={a}
                  type="button"
                  className={`cal-celda${elegida?.a === a ? ' puesta' : ''}`}
                  onClick={() => { setCursor(c => ({ ...c, a })); setVista('meses') }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          <div className="cal-pie">
            <button type="button" className="cal-pie-btn"
              onClick={() => elegir(hoy.a, hoy.m, hoy.d)}>
              Hoy
            </button>
            {elegida && (
              <button type="button" className="cal-pie-btn cal-pie-quitar"
                onClick={() => { onCambio(''); setAbierto(false) }}>
                Quitar fecha
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
