import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Minus, Home, Move, MousePointer2, Lightbulb, ScanSearch, ChevronsDownUp, Maximize2, X,
  Hand, Wand2, Check, Search,
} from 'lucide-react'
import { Rama } from './OrgNodos'
import { buscarCargos } from '../../data/organigramaData'
import { usePliegue, useDesglose } from './vistaArbol'
import LeyendaColores from './LeyendaColores'
import { useLienzo, ZOOM_MIN, ZOOM_MAX } from './useLienzo'
import { useLocalStorage } from '../../hooks/useLocalStorage'

/* El organigrama: el árbol se mira, se navega y se acomoda; la estructura se cambia en el
   formulario que abre el doble clic.

   ACOMODAR NO ES ESTRUCTURA. El árbol propone una posición para cada cuadro y cualquiera se
   puede correr de ahí arrastrándolo, pero eso no toca ningún dato: es un corrimiento respecto
   del lugar que le dio el árbol (`desplazamientos[clave]`, puro dibujo). La regla que sí manda
   —cada cuadro cuelga de quien depende— la sigue diciendo la línea, que se dibuja calculada y
   por eso sigue al cuadro movido en vez de quedarse donde estaba. De quién depende se cambia
   en el formulario; dónde se dibuja, con la mano.

   El arrastre NO usa el drag-and-drop de HTML: el escenario vive dentro de un `transform:
   scale()` y ahí el arrastre nativo es impredecible —el navegador calcula las coordenadas sin
   escalar—. Con eventos de puntero el gesto es nuestro de punta a punta y funciona igual con
   zoom, con mouse y con dedo. */

/* Cuánto hay que mover el puntero para que sea un arrastre y no un clic con pulso. */
const UMBRAL = 5

/* Cuántos resultados de búsqueda se listan antes de pedir que se afine el texto. */
const TOPE_BUSQUEDA = 7

/* QUÉ DIBUJA EL ÁRBOL. Vivían como pestañas de página, arriba, en negrita y con subrayado: se
   veían más importantes que el selector Gráfico/Cards/Tabla del que dependen —solo existen en
   Gráfico—, y al cambiar de vista la fila desaparecía y todo el contenido saltaba 46 px.

   Son opciones del DIBUJO, así que viven con el dibujo: flotando sobre el lienzo, como el zoom
   y la ayuda. Los tres nombres se rehicieron en paralelo —antes eran un sustantivo y dos
   verbos— para que se comparen de un vistazo. */
const MODOS = [
  { key: 'completo', label: 'Áreas y cargos', title: 'Las áreas con sus cargos adentro' },
  { key: 'cargos', label: 'Solo cargos', title: 'Solo la línea de mando, sin áreas' },
  { key: 'unidades', label: 'Solo áreas', title: 'Solo la estructura de áreas, sin cargos' },
]

/* El codo de la línea de mando: baja del padre, dobla a media altura y entra por arriba del
   hijo. Es el mismo trazo que dibujaría el CSS, pero calculado: así sigue al cuadro que se
   corrió de su lugar. */
function codo(padre, hijo) {
  const x1 = padre.x + padre.w / 2
  const y1 = padre.y + padre.h
  const x2 = hijo.x + hijo.w / 2
  const y2 = hijo.y
  if (Math.abs(x1 - x2) < 1) return `M ${x1} ${y1} L ${x2} ${y2}`
  const medio = y1 + Math.max(12, (y2 - y1) / 2)
  const r = Math.min(8, Math.abs(x2 - x1) / 2, Math.max(0, y2 - medio))
  const hacia = x2 > x1 ? 1 : -1
  return `M ${x1} ${y1} L ${x1} ${medio - r} Q ${x1} ${medio} ${x1 + r * hacia} ${medio} `
    + `L ${x2 - r * hacia} ${medio} Q ${x2} ${medio} ${x2} ${medio + r} L ${x2} ${y2}`
}

/* El lateral no baja: sale del costado del cuadro, a la altura del cuerpo de la tarjeta. */
function alCostado(padre, lateral, aLaIzquierda) {
  const y = lateral.y + 26
  const x1 = aLaIzquierda ? padre.x : padre.x + padre.w
  const x2 = aLaIzquierda ? lateral.x + lateral.w : lateral.x
  return `M ${x1} ${padre.y + Math.min(26, padre.h / 2)} L ${x1} ${y} L ${x2} ${y}`
}

export default function OrgGrafico({
  tree, org, onAbrirCargo, onAbrirUnidad, desplazamientos, onMover, onAcomodar,
  modo, onModo, funcionales,
}) {
  const { canvasRef, stageRef, zoom, setZoom, arrastrando, empezarArrastre, ajustar, centrar, estiloStage } =
    useLienzo({ tree, ignorarPan: '[data-no-pan]' })
  const pliegue = usePliegue()
  const desglose = useDesglose()

  /* El recuadro de ayuda se cierra y queda como burbuja. Se recuerda entre sesiones porque a
     la tercera vez que uno lo lee ya no lo necesita, y volver a cerrarlo cada vez que entra a
     la pantalla lo convierte en un estorbo con instrucciones. */
  const [ayudaAbierta, setAyudaAbierta] = useLocalStorage('organigramaAyuda', true)

  /* La búsqueda del lienzo. `hallado` es el cargo al que se acaba de saltar: se destaca un
     momento y se apaga solo, porque una marca permanente en un dibujo que se mira mucho tiempo
     deja de leerse como "es este" y pasa a leerse como "este tiene algo raro". */
  const [busca, setBusca] = useState('')
  const [listaAbierta, setListaAbierta] = useState(false)
  const [hallado, setHallado] = useState(null)
  const cajaBusca = useRef(null)
  const hallazgos = useMemo(() => buscarCargos(busca, org), [busca, org])

  /* Se cierra al tocar afuera, como cualquier desplegable; el texto se queda, para poder
     saltar a otro resultado sin volver a escribirlo. */
  useEffect(() => {
    if (!listaAbierta) return
    const fuera = e => { if (cajaBusca.current && !cajaBusca.current.contains(e.target)) setListaAbierta(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [listaAbierta])

  useEffect(() => {
    if (!hallado) return
    const t = setTimeout(() => setHallado(null), 2600)
    return () => clearTimeout(t)
  }, [hallado])

  const irA = cargoId => {
    setListaAbierta(false)
    /* El cuadro propio y no el de apoyo: un cargo que apoya a otra área está dibujado dos veces
       y el suyo es el que lo define. */
    const el = stageRef.current?.querySelector(`[data-cargo="${cargoId}"]:not(.og-card-func)`)
      || stageRef.current?.querySelector(`[data-cargo="${cargoId}"]`)
    if (!el) return
    centrar(el)
    setHallado(cargoId)
  }

  /* Lo que se lleva movido el cuadro que está en la mano AHORA, aparte del corrimiento ya
     guardado: mientras no se suelte, todavía no pasó nada. */
  const [vivo, setVivo] = useState(null)
  const [trazos, setTrazos] = useState([])
  /* Las aristas como pares de ELEMENTOS: con ellas se rehace una línea suelta sin volver a
     recorrer el DOM entero en cada movimiento del puntero. */
  const aristas = useRef([])
  const gesto = useRef(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  const corrimiento = useCallback(clave => {
    const guardado = desplazamientos?.[clave]
    if (vivo?.clave !== clave) return guardado
    return { dx: (guardado?.dx || 0) + vivo.dx, dy: (guardado?.dy || 0) + vivo.dy }
  }, [desplazamientos, vivo])

  const medidor = useCallback(() => {
    const base = stageRef.current.getBoundingClientRect()
    return el => {
      const r = el.getBoundingClientRect()
      return {
        x: (r.left - base.left) / zoom,
        y: (r.top - base.top) / zoom,
        w: r.width / zoom,
        h: r.height / zoom,
      }
    }
  }, [zoom, stageRef])

  const trazoDe = (arista, caja) => (arista.lateral
    ? alCostado(caja(arista.padre), caja(arista.hijo), arista.aLaIzquierda)
    : codo(caja(arista.padre), caja(arista.hijo)))

  /* Las líneas salen del DOM y no de los ids del árbol: una misma unidad puede abrir píldora en
     dos lugares distintos, así que los ids se repiten y los elementos no. Cada `li` sabe quién
     es su padre —el `li` que lo contiene— y eso es todo el árbol. */
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const caja = medidor()

    const propio = li => li.querySelector(':scope > .og-nodo > .og-card-col > .og-card, :scope > .og-nodo > .og-unidad, :scope > .og-nodo > .og-empresa')
    /* DÓNDE se dibuja el cuadro y CÓMO se dibuja su línea son dos preguntas distintas desde que
       el outsourcing baja en la línea como cualquier reporte: la forma del trazo la decide
       `lateral` y el punteado lo decide de quién es el vínculo. */
    const externo = el => el.classList.contains('og-card-ext') || el.classList.contains('og-card-func')
    const lista = []
    for (const li of stage.querySelectorAll('.og-tree li')) {
      const hijo = propio(li)
      if (!hijo) continue
      const padreLi = li.parentElement?.closest('li')
      const padre = padreLi && propio(padreLi)
      if (padre) lista.push({ id: `m${lista.length}`, padre, hijo, lateral: false, punteada: externo(hijo) })

      for (const bloque of li.querySelectorAll(':scope > .og-nodo > .og-staff')) {
        const aLaIzquierda = bloque.classList.contains('og-staff-izq')
        for (const tarjeta of bloque.querySelectorAll(':scope > .og-card-col > .og-card')) {
          lista.push({ id: `l${lista.length}`, padre: hijo, hijo: tarjeta, lateral: true, punteada: true, aLaIzquierda })
        }
      }
    }
    aristas.current = lista
    setTrazos(lista.map(a => ({ id: a.id, d: trazoDe(a, caja), punteada: a.punteada })))
  }, [tree, zoom, desplazamientos, stageRef, pliegue.plegados, desglose.abiertos, medidor])

  /* Mientras algo va en la mano solo se rehacen sus líneas. Con una unidad no alcanza: se mueve
     la rama entera y todas las de adentro cambian de sitio. */
  useLayoutEffect(() => {
    if (!vivo || !stageRef.current) return
    const caja = medidor()
    if (vivo.grupo) {
      setTrazos(aristas.current.map(a => ({ id: a.id, d: trazoDe(a, caja), punteada: a.punteada })))
      return
    }
    const el = stageRef.current.querySelector(`[data-clave="${vivo.clave}"]`)
    if (!el) return
    setTrazos(previos => previos.map((t, i) => {
      const a = aristas.current[i]
      if (!a || (a.padre !== el && a.hijo !== el)) return t
      return { id: t.id, d: trazoDe(a, caja), punteada: a.punteada }
    }))
  }, [vivo, medidor, stageRef])

  const tomar = (clave, grupo, e) => {
    if (e.button !== undefined && e.button !== 0) return
    gesto.current = { clave, grupo, x0: e.clientX, y0: e.clientY, activo: false }
  }

  useEffect(() => {
    const mover = e => {
      const g = gesto.current
      if (!g) return
      if (!g.activo && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < UMBRAL) return
      g.activo = true
      g.x = e.clientX
      g.y = e.clientY
      setVivo({
        clave: g.clave,
        grupo: g.grupo,
        dx: (e.clientX - g.x0) / zoomRef.current,
        dy: (e.clientY - g.y0) / zoomRef.current,
      })
    }
    const soltar = () => {
      const g = gesto.current
      /* Acomodar se acepta siempre: no crea ni cambia nada, así que descartarlo por soltar
         encima de un panel se sentiría como que la pieza "no se puede mover". */
      if (g?.activo) {
        onMover?.(g.clave, {
          dx: (g.x - g.x0) / zoomRef.current,
          dy: (g.y - g.y0) / zoomRef.current,
        })
      }
      gesto.current = null
      setVivo(null)
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [onMover])

  const acomodo = onMover ? { corrimiento, tomar, enMano: vivo?.clave ?? null } : null
  const movidos = Object.keys(desplazamientos || {}).length
  const lienzoDim = stageRef.current
    ? { w: stageRef.current.offsetWidth, h: stageRef.current.offsetHeight }
    : { w: 0, h: 0 }

  return (
    <div
      ref={canvasRef}
      className={`og-canvas${arrastrando ? ' og-canvas-drag' : ''}`}
      onMouseDown={empezarArrastre}
    >
      <div ref={stageRef} className="og-stage" style={estiloStage}>
        {/* La línea de mando, dibujada. Va debajo de los cuadros y no recibe clics: es el
            dibujo de una relación que se cambia en el formulario, no tocando la línea. */}
        <svg className="og-mando" width={lienzoDim.w} height={lienzoDim.h}>
          {/* Llena la línea de mando común; punteada la que no lo es, que es lo que el punteado
              significa en cualquier organigrama: relación indirecta. Son tres casos y ninguno
              se resume en "no es de la empresa" —el staff sí lo es—: el staff asiste al costado
              sin bajar en la línea, el tercerizado cuelga de su jefe sin ser de la casa, y el
              apoyo funcional viene prestado de otra área. */}
          {trazos.map(t => (
            <path key={t.id} d={t.d} className={`og-mando-linea${t.punteada ? ' og-mando-lateral' : ''}`} />
          ))}
        </svg>

        <ul className="og-tree og-tree-libre">
          <Rama nodo={tree} onAbrir={onAbrirCargo} onAbrirUnidad={onAbrirUnidad} pliegue={pliegue} acomodo={acomodo} desglose={desglose} hallado={hallado} />
        </ul>
      </div>

      {/* Qué significa lo que se ve y qué se puede hacer, en el mismo recuadro: son las dos
          mitades de la misma pregunta y separarlas apilaba dos paneles sobre el dibujo. */}
      {ayudaAbierta ? (
        <div className="og-atajos">
          <button className="og-atajos-x" onClick={() => setAyudaAbierta(false)} title="Esconder la ayuda">
            <X size={12} />
          </button>

          <LeyendaColores />
          <div className="og-atajos-sep" />
          <div className="og-atajos-hd"><Lightbulb size={11} /> Atajos</div>
          <div className="og-atajo"><Hand size={10} /> Arrastra un cuadro → Acomodarlo</div>
          <div className="og-atajo"><Move size={10} /> Arrastra el fondo → Mover la vista</div>
          <div className="og-atajo"><ScanSearch size={10} /> Rueda → Zoom</div>
          <div className="og-atajo"><MousePointer2 size={10} /> Doble clic → Abrir el detalle</div>
          <div className="og-atajo"><ChevronsDownUp size={10} /> Flecha del cuadro → Plegar rama</div>

          {/* Los dos botones aparecen solo cuando hay algo que deshacer: uno para revertir lo
              que nadie hizo enseña a ignorar la fila donde vive. */}
          {pliegue.plegados.size > 0 && (
            <button className="og-atajo og-atajo-btn" onClick={pliegue.abrirTodo}>
              <Maximize2 size={10} /> Abrir las {pliegue.plegados.size} ramas plegadas
            </button>
          )}
          {movidos > 0 && (
            <button className="og-atajo og-atajo-btn" onClick={onAcomodar}>
              <Wand2 size={10} /> Reacomodar solo ({movidos} a mano)
            </button>
          )}
        </div>
      ) : (
        /* Cerrada, la ayuda no desaparece: se encoge a una burbuja en el mismo lugar. Si se
           fuera del todo, el que la cerró sin querer se queda sin la leyenda y sin forma de
           saber que existía. */
        <button
          className="og-ayuda-burbuja"
          onClick={() => setAyudaAbierta(true)}
          title="Cómo se lee el organigrama y atajos"
        >
          <Lightbulb size={17} />
        </button>
      )}

      {/* BUSCAR EN EL DIBUJO. En la tabla y en las cards alcanza con filtrar la lista; acá el
          árbol mide miles de píxeles, así que encontrar el nombre no sirve si después hay que
          cazar el cuadro a mano. Elegir un resultado LLEVA la vista hasta él y lo destaca un
          momento. No filtra el árbol: esconder los cuadros que no coinciden rompería la
          jerarquía, que es justo lo que uno vino a mirar. */}
      <div className="og-buscar" ref={cajaBusca}>
        <div className="og-buscar-campo">
          <Search size={14} />
          <input
            value={busca}
            onChange={e => { setBusca(e.target.value); setListaAbierta(true) }}
            onFocus={() => setListaAbierta(true)}
            placeholder="Buscar en el organigrama"
          />
          {busca && (
            <button onClick={() => { setBusca(''); setHallado(null) }} title="Limpiar">
              <X size={13} />
            </button>
          )}
        </div>

        {listaAbierta && busca.trim() && (
          <div className="og-buscar-lista">
            {hallazgos.length === 0 && (
              <p className="og-buscar-vacio">Nada coincide con “{busca.trim()}”.</p>
            )}
            {hallazgos.slice(0, TOPE_BUSQUEDA).map(f => (
              <button key={f.cargo.id} onClick={() => irA(f.cargo.id)}>
                <span className="og-buscar-nom">{f.cargo.nombre}</span>
                <span className="og-buscar-sub">
                  {f.unidad?.nombre || 'Sin área'}
                  {f.ocupantes.length > 0 && ` · ${f.ocupantes.map(p => p.name).join(', ')}`}
                </span>
              </button>
            ))}
            {/* Ninguna lista sin tope, y el truncado se dice. */}
            {hallazgos.length > TOPE_BUSQUEDA && (
              <p className="og-buscar-vacio">
                y {hallazgos.length - TOPE_BUSQUEDA} más. Escribe un poco más para achicar la lista.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Qué incluye el dibujo. Arriba a la izquierda porque el árbol nace centrado y baja: es
          la esquina que casi siempre queda libre, y las de abajo ya las ocupan la ayuda y el
          zoom. */}
      <div className="og-modos">
        <div className="og-modos-seg">
          {MODOS.map(m => (
            <button
              key={m.key}
              className={modo === m.key ? 'on' : ''}
              title={m.title}
              onClick={() => onModo(m.key)}
            >
              {m.label}
            </button>
          ))}

          {/* DENTRO de la misma pastilla, detrás de una línea que lo separa. Se probaron otros
              tres lugares: al lado de la pastilla se leía como un control ajeno traído de otra
              pantalla; en el panel de la leyenda quedaba escondido; y flotando aparte era un
              objeto más sobre el dibujo, que es lo que el usuario no quiere. Acá no se suma
              ninguno —es la pastilla que ya estaba— y queda a la vista.

              Lo que evita que se lea como una cuarta opción excluyente: la casilla, y que al
              encenderse NO toma el fondo blanco de las otras tres. Se llena la casilla, no el
              botón. */}
          {modo !== 'unidades' && funcionales?.cuantos > 0 && (
            <>
              <span className="og-modos-sep" aria-hidden="true" />
              <button
                className={`og-modos-sw${funcionales.activo ? ' on' : ''}`}
                onClick={funcionales.alternar}
                title={funcionales.activo
                  ? 'Esconder los cuadros de apoyo: cada puesto aparece una sola vez, en su área'
                  : 'Mostrar en cada área los puestos de otras áreas que trabajan ahí'}
              >
                <span className="og-modos-caja">{funcionales.activo && <Check size={10} />}</span>
                Funcionales
              </button>
            </>
          )}
        </div>
      </div>

      <div className="og-zoom">
        <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - 0.1))} title="Alejar"><Minus size={13} /></button>
        <span className="og-zoom-val">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + 0.1))} title="Acercar"><Plus size={13} /></button>
        <button onClick={() => ajustar()} title="Ver todo el organigrama"><Home size={13} /></button>
      </div>
    </div>
  )
}
