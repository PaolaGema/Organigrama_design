import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Plus, Pencil, Trash2, MoreVertical, Search, Eye, ToggleLeft, X, ChevronRight,
  Building2, Briefcase, MapPin, Building, Layers, FolderTree,
} from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import {
  tipoDe, estaEncendido, tiposDeVista, vistasDeEje, gruposDe, padresPosibles, ordenDe, estadosDe, verboApagar,
  descendientes, filasEje, ancestroDe, hexDeColor, nuevoDe, primerDe,
} from '../../data/estructuraData'
import ConfirmarBorrado from '../../components/organizacion/ConfirmarBorrado'
import PastillaEstado from '../../components/organizacion/PastillaEstado'
import { ModalApoyoFuncional } from '../../components/organizacion/ApoyoFuncional'
import Paginacion from '../../components/layout/Paginacion'
import Desplegable from '../../components/layout/Desplegable'
import { normalizar } from '../../data/organigramaData'

/* LA ESTRUCTURA, EN UNA SOLA PANTALLA. Prueba de concepto, al lado de Sucursales.
   Hoy la organización se carga en dos pantallas que no se conocen —Sucursales y Áreas— y no hay
   dónde poner una unidad de negocio, una región ni un centro de trabajo. Esta es la propuesta
   funcionando para poder mirarla antes de decidir si reemplaza a las otras dos.

   NO TOCA NADA. Guarda en sus propias llaves de `localStorage` y arranca copiando los datos de
   verdad, así que se puede romper entera sin consecuencias: Sucursales, Áreas y el organigrama
   siguen leyendo lo suyo. El botón de reiniciar vuelve a copiarlos.

   LAS DOS COSAS QUE HAY QUE JUZGAR AL PROBARLA, y por eso están las dos acá arriba en vez de
   repartidas: ENCENDER un nivel —una decisión, se toma una vez— y CREAR un nodo —un dato, se
   hace todos los días—. En el producto de verdad los interruptores viven en Configuración; acá
   están plegados al tope para poder evaluar las dos mitades sin cambiar de pantalla. */

const ICONO = {
  negocio: Briefcase, region: MapPin, sucursal: Building2,
  centro: Building, unidad: Layers, cargo: Briefcase,
}

export default function Estructura({ eje }) {
  /* `organigrama` vuelve al destructurado: el editor de apoyos necesita la lista de unidades y
     la de cargos para saber qué ofrecer. Se había ido con el filtro de sucursal. */
  const { nodos, setNodos, organigrama: org, nivelesEstructura: niveles } = useOnboardingData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()



  const [agregandoEn, setAgregandoEn] = useState(null)   // id del nodo, o '__raiz__'
  /* Qué fila tiene su menú de acciones abierto, y cuál se está por borrar. Son dos estados y no
     uno porque el modal de confirmación sobrevive al cierre del menú. */
  /* EL MENÚ DE ACCIONES SE DIBUJA EN COORDENADAS DE VENTANA.
     Iba posicionado en absoluto dentro de su celda, y la tabla vive en un contenedor con
     `overflow-x: auto` —el que permite desplazarla cuando no cabe—. Cualquier `overflow` que no
     sea `visible` recorta lo que se sale, así que en las últimas filas el menú aparecía cortado
     por el borde de la tarjeta, o directamente no aparecía.

     Con `fixed` sale del recuadro y se ve entero. A cambio hay que medir dónde está el botón al
     abrirlo, y cerrarlo si la página se desplaza: quedaría flotando lejos de su fila. */
  const [accionesEn, setAccionesEn] = useState(null)
  const [posAcciones, setPosAcciones] = useState(null)

  const abrirAcciones = (e, id) => {
    e.stopPropagation()
    if (accionesEn === id) { setAccionesEn(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    /* Hacia arriba si abajo no cabe: el menú mide unos 90 px y las últimas filas de una tabla
       larga están pegadas al borde inferior de la ventana. */
    const haciaArriba = r.bottom + 100 > window.innerHeight
    setPosAcciones({
      top: haciaArriba ? undefined : r.bottom + 4,
      bottom: haciaArriba ? window.innerHeight - r.top + 4 : undefined,
      right: window.innerWidth - r.right,
    })
    setAccionesEn(id)
  }
  /* YA NO HAY NADA QUE TRAER, y por eso acá no queda ningún botón.
     Hubo uno —«Traer lo que ya tengo en el organigrama»— que copiaba las unidades y las plazas del
     modelo viejo al árbol, una vez y en un solo sentido. Existía porque eran dos almacenes
     distintos: coincidían justo después de apretarlo y se separaban con el primer cambio.

     Desde que el organigrama y estas tablas leen y escriben los MISMOS nodos, copiar no significa
     nada: lo que se carga de un lado ya está del otro. Un botón que promete traer algo que ya
     está es peor que no tenerlo, porque hace dudar de si hizo falta apretarlo. */

  /* QUÉ CARGOS ESTÁN DESPLEGADOS. Un cargo no es una fila y ya: es una fila con sus sillas
     debajo, y quién las ve y quién no es una decisión de quien mira, no del dato. */
  const [abiertos, setAbiertos] = useState(() => new Set())
  const alternar = id => setAbiertos(prev => {
    const sig = new Set(prev)
    if (sig.has(id)) sig.delete(id); else sig.add(id)
    return sig
  })

  /* LAS SILLAS DE UN CARGO, QUE SON MÁS QUE SUS PUESTOS GUARDADOS.
     El cargo declara un cupo —«hasta 4 personas»— y eso ya dice cuántas sillas tiene. Las que
     alguien abrió existen como nodo, con su código y su gente; las demás existen igual, vacías, y
     son las VACANTES del cargo. Enseñar solo las guardadas dejaba el cupo como un número que no se
     ve en ninguna parte, y las vacantes como algo que hay que deducir restando.

     Si no hay cupo declarado, las sillas son las que haya: sin techo no hay vacantes que contar,
     porque no se sabe cuántas faltan. */
  const sillasDe = cargo => {
    const propias = nodos.filter(n => n.tipo === 'puesto' && n.padreId === cargo.id)
    const cupo = Number(cargo.maxPersonas) || 0
    const total = Math.max(propias.length, cupo)
    return Array.from({ length: total }, (_, i) => propias[i] || null)
  }

  /* ABRIR UNA SILLA es crear su puesto y llevar a su ficha: lo que sigue después —el código, la
     sede, quién la ocupa— es justo lo que esa ficha pregunta. Crearla y dejar a alguien mirando la
     tabla obligaría a buscarla para completarla. */
  const abrirSilla = (cargo, i) => {
    const nid = `${cargo.id}-p${i + 1}`
    const libre = nodos.some(n => n.id === nid) ? `${nid}-${Date.now().toString(36)}` : nid
    setNodos(prev => [...prev, {
      id: libre, tipo: 'puesto', nombre: cargo.nombre, padreId: cargo.id,
      codigo: '', ubicacion: '', ocupanteId: null, ocupante: '', reportaA: null,
      funcionales: [], estado: 'activa',
    }])
    navigate(`/organizacion/nodo/${libre}?editar=1`)
  }

  /* QUÉ SILLA TIENE ABIERTO SU «DÓNDE MÁS TRABAJA». Es un modal y no una fila que se despliega:
     el editor son dos desplegables y un botón por unidad apoyada, y eso no entra en el ancho de
     una celda sin romper la reja de la tabla —que es lo único que hace comparables a las sillas
     entre sí—. */
  const [funcionalDe, setFuncionalDe] = useState(null)

  const [borrando, setBorrando] = useState(null)
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)

  /* LA VISTA VIVE EN LA URL y no en un estado. Las entradas del menú —"Sucursales",
     "Unidades organizacionales"— son enlaces de verdad a esta misma pantalla con `?ver=`
     puesto: misma pantalla, otra puerta. Guardada en estado, volver desde el menú la perdería. */
  /* Cuántos nodos hay de cada tipo. Se calcula acá arriba porque de esto depende en qué pestaña
     abre la pantalla. */
  const porTipo = useMemo(() => {
    const c = {}
    nodos.forEach(n => { c[n.tipo] = (c[n.tipo] || 0) + 1 })
    return c
  }, [nodos])

  const disponibles = vistasDeEje(eje.key, niveles)
  /* Sin vista en la URL se abre la primera QUE TENGA ALGO. No hay un "todo": cada pestaña lista
     un nivel, que es lo que uno viene a ver cuando entra por ella; abrir en la primera de la
     lista dejaba la pantalla en "Regionales 0" con un vacío, teniendo ocho sucursales al lado. */
  const conNodos = disponibles.find(v => v.tipos.some(k => porTipo[k]))
  const vista = disponibles.some(v => v.key === params.get('ver'))
    ? params.get('ver')
    : (conNodos || disponibles[0])?.key
  const setVista = v => setParams({ ver: v }, { replace: true })
  const tiposVisibles = tiposDeVista(eje, vista, niveles)
  const vistaActual = disponibles.find(v => v.key === vista)

  const todas = useMemo(
    () => filasEje(nodos, tiposVisibles), [nodos, tiposVisibles.join()])

  /* BUSCA POR NOMBRE, CIUDAD Y CÓDIGO, y sin tildes: nadie escribe «Potosí» con acento en un
     buscador. Con la búsqueda puesta la sangría no significa nada —los resultados no son
     hermanos— así que se aplana y la columna «Depende de» pasa a ser lo único que los ubica. */
  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim())
    if (!q) return todas
    return todas
      .filter(f => [f.nodo.nombre, f.nodo.ciudad, f.nodo.codigo]
        .some(v => normalizar(v || '').includes(q)))
      .map(f => ({ ...f, nivel: 0 }))
  }, [todas, busca])

  /* La página vuelve a la primera cuando cambia lo que se está mirando. Sin esto, buscando algo
     que da dos resultados desde la página cuatro, la tabla sale vacía y parece que no encontró
     nada. */
  useEffect(() => { setPagina(1) }, [vista, busca, nodos.length])

  /* EL VALOR DE CADA COLUMNA, calculado aparte de la fila para poder preguntarle a la vista
     entera si alguna columna está vacía de arriba abajo. */
  const celdaDe = nodo => {
    const padre = nodo.padreId ? nodos.find(n => n.id === nodo.padreId) : null
    const suc = ancestroDe(nodo.id, 'sucursal', nodos)
    return {
      padre: padre ? padre.nombre : null,
      sucursal: suc && suc.id !== nodo.id ? suc.nombre : null,
      ciudad: nodo.ciudad || nodo.localidad,
      codigo: nodo.codigo,
      responsable: nodo.responsable || nodo.ocupante,
    }
  }

  /* QUÉ COLUMNA SE DIBUJA: LA QUE PUEDE TENER DATO, NO LA QUE YA LO TIENE.
     El primer intento escondía toda columna que estuviera vacía de arriba abajo, y eso rompía
     justo el caso que más importa: la empresa recién creada. Con una regional apenas dada de
     alta —solo el nombre— desaparecían Ciudad, Código y Responsable, y la tabla se quedaba en
     «Nombre · Estado». Ahí es donde uno MÁS necesita ver las columnas: son la lista de lo que
     todavía falta por llenar. Un «—» dice «esto va acá y está vacío»; una columna que no está
     no dice nada.

     La regla buena distingue dos cosas que se parecen:

       · VACÍO POR AHORA  → la columna se queda. Ciudad, Código y Responsable son campos del
         formulario de la regional: pueden tener dato cualquier día.
       · VACÍO PARA SIEMPRE → la columna se va. «Depende de» en Regionales, porque no hay ningún
         nivel encima del que puedan colgar más que la empresa; «Sucursal» en Unidades de
         negocio, porque una unidad de negocio está POR ENCIMA de las sucursales y jamás va a
         tener una de ancestro. Ahí el «—» no es un pendiente: es ruido.

     Y la fuente es la misma que dibuja el formulario, así que no hay dos verdades: si el campo
     se pregunta, la columna existe. Lo estructural —padre y sucursal, que no son campos sino
     deducciones del árbol— se decide con la regla del orden, igual que el menú de «Agregar». */
  /* EL DISTINTIVO DEL TIPO Y SU ICONO SOLO CUANDO LA TABLA MEZCLA TIPOS.
     En «Regionales» todas las filas son regionales: el distintivo repetía «REGIÓN» tantas veces
     como filas hubiera, debajo de una pestaña que ya se llama «Regionales» y de un título que
     dice lo mismo. Es el mismo defecto que el «La empresa» de la columna «Depende de» —algo que
     no cambia de fila a fila no distingue nada— pero encima con color, así que llamaba más la
     atención que el nombre, que es lo único que uno viene a leer.

     En «Unidades organizacionales», donde conviven áreas y subáreas, sí gana su sitio: ahí el
     distintivo es lo que te dice cuál es cuál, y el icono lleva el color de la rama. */
  const mezclaTipos = tiposVisibles.length > 1

  const columnas = useMemo(() => {
    const preguntados = new Set()
    tiposVisibles.forEach(k => gruposDe(k, { personas: [], padres: [], ciudades: [], nivel: tipoDe(k, niveles), niveles })
      .forEach(g => g.campos.forEach(c => preguntados.add(c.key))))

    /* EL CARGO TRAE LAS COLUMNAS DE SUS PUESTOS. La cuenta mira qué campos declara el formulario de
       cada tipo visible, y el del cargo no pregunta ni sede ni ocupante —son de la silla, no del
       rol—, así que «Responsable» se caía de la tabla. Pero las sillas se dibujan DENTRO de esta
       tabla, en las filas desplegadas, y ahí sí hay a quién enseñar: la columna existía y la fila
       que la necesitaba no tenía dónde ponerla. */
    if (tiposVisibles.includes('cargo')) {
      gruposDe('puesto', { personas: [], padres: [], ciudades: [], nivel: tipoDe('puesto', niveles), niveles })
        .forEach(g => g.campos.forEach(c => preguntados.add(c.key === 'ocupante' ? 'responsable' : c.key)))
    }

    /* Un padre de verdad, no «Ninguna»: es el mismo umbral que usa el formulario para
       enseñar u ocultar el campo «Depende de». Aparece sola en cuanto creas la primera
       regional, que es cuando las sucursales tienen de dónde colgar. */
    const hayPadres = tiposVisibles.some(k =>
      padresPosibles({ tipo: k }, nodos, niveles).length > 0)

    const hayAncestroSucursal = tiposVisibles.some(k =>
      ordenDe('sucursal', niveles) < ordenDe(k, niveles) && estaEncendido('sucursal', niveles))

    return eje.columnas.filter(c => {
      if (c.key === 'padre') return hayPadres
      if (c.key === 'sucursal') return hayAncestroSucursal
      return (c.claves || [c.key]).some(k => preguntados.has(k))
    })
  }, [eje, tiposVisibles.join(), nodos, niveles])

  const POR_PAGINA = 10
  const filas = useMemo(
    () => filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    [filtradas, pagina])

  /* Volver al punto de partida: las sucursales y las áreas de verdad, convertidas otra vez. Los
     interruptores se ajustan a lo que trae, para que nunca quede un nivel apagado con nodos de
     ese nivel dentro. */
  /* SE FUERON «TRAER MIS DATOS» Y «VACIAR». Eran andamios de la prueba: uno importaba las ocho
     sucursales de la demo y el otro dejaba el árbol en cero. Con la casa matriz creándose sola, el
     primero ya no tiene qué traer que valga la pena y el segundo dejaba a la empresa sin ningún
     sitio, que es un estado que no debería poder existir. Se crea y se borra nodo por nodo, como
     todo lo demás. */

  /* Un menú abierto se cierra al tocar cualquier otra cosa. Sin esto quedan dos abiertos a la
     vez en cuanto se pulsan dos filas seguidas. */
  useEffect(() => {
    if (!accionesEn) return
    const fuera = e => { if (!e.target.closest('.est-acciones-menu, .est-acciones')) setAccionesEn(null) }
    /* Al desplazar la página el botón se mueve y el menú no: se cierra en vez de quedar
       flotando sobre otra fila, que sería peor que cerrarse. */
    const cerrar = () => setAccionesEn(null)
    document.addEventListener('mousedown', fuera)
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', fuera)
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [accionesEn])

  /* LA VISTA ELEGIDA SE ESCRIBE EN LA URL, siempre. La pantalla y el menú calculaban cada uno
     su vista por defecto —la primera con algo, la primera de la lista— y podían discrepar: el
     menú marcaba «Regionales» mientras la tabla mostraba sucursales. Poniéndola en la dirección
     hay una sola fuente y el menú se limita a leerla. */
  useEffect(() => {
    if (!params.get('ver') && vista) setParams({ ver: vista }, { replace: true })
  }, [vista, params, setParams])

  /* CAMBIAR EL ESTADO PASA POR UN PASO INTERMEDIO, no por un botón que alterna.
     Un menú que dice «Cerrar» hace el cambio en el mismo clic con el que se abrió el menú, y con
     el ratón encima de una lista de cuatro opciones eso es fácil de disparar sin querer. El
     modal cuesta un clic más y a cambio enseña en qué estado está, cuáles hay, y qué implica el
     que se elija —que es lo que nadie sabe de memoria—.

     Y aguanta el día que los estados sean tres: «en obra», «en traspaso». Un botón que alterna
     entre dos deja de servir en cuanto aparece el tercero. */
  const [cambiandoEstado, setCambiandoEstado] = useState(null)
  const [estadoNuevo, setEstadoNuevo] = useState('activa')

  const abrirEstado = nodo => {
    setEstadoNuevo(nodo.estado || 'activa')
    setCambiandoEstado(nodo)
    setAccionesEn(null)
  }

  const guardarEstado = () => {
    setNodos(prev => prev.map(n => (n.id === cambiandoEstado.id ? { ...n, estado: estadoNuevo } : n)))
    setCambiandoEstado(null)
  }

  const irANuevo = (tipo, padreId) => {
    setAgregandoEn(null)
    navigate(`/organizacion/nodo/nuevo?tipo=${tipo}&padre=${padreId || ''}`)
  }

  /* CADA PANTALLA OFRECE LO SUYO. `tiposBajo` contesta qué permite la regla del orden, que en
     la raíz es TODO: negocio, región, sucursal, oficina, área y subárea. Correcto en el modelo y
     desconcertante en la pantalla —estando en Distribución física, "Agregar" ofrecía crear un
     área—. Se cruza con los tipos del eje: acá se crean lugares, en la otra se crean áreas.

     El cruce entre los dos ejes sigue existiendo y tiene su sitio: la ficha de un nodo, donde a
     una sucursal SÍ se le puede colgar un área, porque ahí uno ya eligió de qué está hablando. */
  /* AGREGAR CREA LO QUE ESTÁS MIRANDO. Ofrecía los tres tipos del eje siempre, así que estando
     en «Regionales» —donde no hay otra cosa que crear— había que elegir «Región» de una lista de
     tres para hacer lo único que se podía hacer.

     Ahora se ofrece lo que esta vista lista, que casi siempre es UNO: entonces el botón crea
     directo y dice qué. El menú queda solo para «Unidades organizacionales», que sí abarca dos
     —área y subárea— y ahí la pregunta es legítima. */
  const tiposAgregar = tiposVisibles.map(k => tipoDe(k, niveles)).filter(Boolean)
  const unicoTipo = tiposAgregar.length === 1 ? tiposAgregar[0] : null

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          {/* EL NIVEL ES EL TÍTULO, y el eje no se repite: lo dice la columna de al lado, a
              dos centímetros. Estaba en los dos sitios y "DISTRIBUCIÓN FÍSICA" aparecía dos veces
              en la misma línea de visión. */}
          <h1 className="pl-title">{vistaActual?.label || eje.label}</h1>
          <p className="pl-subtitle">{vistaActual?.desc || eje.desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          <div className="pl-dropdown-wrap">
            <button
              className="pl-btn-new"
              onClick={() => (unicoTipo
                ? irANuevo(unicoTipo.key, null)
                : setAgregandoEn(a => (a === '__raiz__' ? null : '__raiz__')))}
            >
              <Plus size={14} color="#00E091" />
              {/* «Nueva región» y no «Agregar región»: el botón nombra lo que va a existir, no
                  la operación. Es como se llaman los botones de crear en el resto de la app
                  —«Nueva sucursal», «Nueva plantilla»— y se lee antes. */}
              {unicoTipo ? `${nuevoDe(unicoTipo.key)} ${unicoTipo.label.toLowerCase()}` : 'Agregar'}
            </button>
            {agregandoEn === '__raiz__' && !unicoTipo && (
              <MenuAgregar
                titulo="¿Qué quieres crear?"
                tipos={tiposAgregar}
                onElegir={t => irANuevo(t.key, null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* EL BUSCADOR APARECE CUANDO HACE FALTA. Con cuatro sucursales es un campo que estorba; a
          partir de una docena es lo primero que se busca. El umbral está en ocho, que es cuando
          la lista deja de caber de un vistazo. */}
      {todas.length > 8 && (
        <div className="pl-toolbar" style={{ maxWidth: 1180 }}>
          <div className="pl-search-wrap">
            <Search size={15} className="pl-search-ico" />
            <input
              className="pl-search"
              placeholder={`Buscar entre ${todas.length} ${(vistaActual?.label || '').toLowerCase()}…`}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* LA TABLA SE ENSEÑA AUNQUE ESTÉ VACÍA, con sus cabeceras puestas. Antes desaparecía
          entera y en su lugar quedaba una tarjeta con dos frases, así que la pantalla dejaba de
          contestar «¿qué es una regional?» —con qué se la nombra, con qué columnas se la va a
          comparar— justo cuando quien mira todavía no ha visto ninguna, que es cuando más falta
          hace. Las cabeceras son la mitad de la respuesta y no cuestan nada: ya estaban escritas.

          Y la pantalla cambiaba de forma al crear la primera —desaparecía una tarjeta, aparecía
          una tabla con cabeceras nuevas— y había que releerla entera. Con la tabla siempre
          puesta, crear la primera regional agrega un renglón donde el aviso decía que iba a
          aparecer. */}
      <div className="as-table-wrap" style={{ overflowX: 'auto', maxWidth: 1180 }}>
        <table className="as-table est-tabla" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Nombre</th>
              {columnas.map(c => <th key={c.key} className={c.num ? 'est-col-num' : undefined}>{c.label}</th>)}
              <th>Estado</th>
              <th style={{ width: 60, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              /* SIN ÍCONO. Era una carpeta de 26 px que no decía nada que el texto no dijera
                 —ni qué falta, ni qué hacer— y encima repetía el ícono que hasta hace poco tenía
                 la entrada del menú. Un adorno en un estado vacío es lo único que hay en pantalla
                 compitiendo con la frase que sí importa.

                 Y el texto nombra el botón por su rótulo REAL: decía «pulsa Agregar» cuando el
                 botón dice «Nueva región», y mandar a alguien a un botón que no existe con ese
                 nombre es peor que no mencionarlo. */
              <tr className="est-fila-vacia">
                <td colSpan={columnas.length + 3}>
                  <div className="est-vacio">
                    <p className="est-vacio-tit">
                      {busca.trim()
                        ? `Nada coincide con «${busca.trim()}»`
                        : disponibles.length
                          ? `Todavía no hay ${(disponibles.find(v => v.key === vista)?.label || '').toLowerCase()}`
                          : `Todavía no hay nada en ${eje.label.toLowerCase()}`}
                    </p>
                    <p className="est-vacio-nota">
                      {busca.trim()
                        ? 'Prueba con otro nombre, otra ciudad o el código.'
                        : unicoTipo
                          ? `Pulsa «${nuevoDe(unicoTipo.key)} ${unicoTipo.label.toLowerCase()}» para crear ${primerDe(unicoTipo.key)}.`
                          : 'Pulsa Agregar para crear la primera, o enciende otro nivel en Configuración.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filas.map(({ nodo, nivel }) => {
              const t = tipoDe(nodo.tipo, niveles)
              const Icono = ICONO[nodo.tipo] || FolderTree
              const color = hexDeColor(nodo.color)
              const celda = celdaDe(nodo)

              const tieneSillas = nodo.tipo === 'cargo' && sillasDe(nodo).length > 0
              const sillas = tieneSillas && abiertos.has(nodo.id) ? sillasDe(nodo) : []

              return (
                <Fragment key={nodo.id}>
                {/* PULSAR LA FILA YA NO ABRE LA FICHA. Lo hacía —«la fila mira, el menú hace»— y la
                    idea era buena mientras la fila no tuviera nada más que ofrecer. Ahora el cargo
                    despliega sus puestos, y una fila que a veces navega y a veces despliega es una
                    fila que hay que probar para saber qué hace.

                    Así que se reparte por lo que cada cosa ES: el cargo tiene algo adentro y lo
                    abre; los demás no tienen nada que desplegar y no responden al clic. Ver y
                    editar viven en el menú de los tres puntos, que es donde ya estaban y donde se
                    va a buscar «qué puedo hacer con esto». */}
                <tr
                  onClick={tieneSillas ? () => alternar(nodo.id) : undefined}
                  style={tieneSillas ? { cursor: 'pointer' } : undefined}
                  className={nodo.estado === 'cerrada' ? 'est-fila-cerrada' : undefined}
                >
                  {/* LA JERARQUÍA VIVE EN LA PRIMERA COLUMNA y no en la fila entera: sangrando
                      solo el nombre, las demás columnas siguen alineadas y se pueden comparar
                      de un vistazo, que es para lo que sirve una tabla. */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: nivel * 22 }}>
                      {/* EL CODO ES LO QUE HACE VISIBLE LA JERARQUÍA. La sangría sola no alcanza:
                          en las vistas de un solo peldaño no hay ícono ni pastilla al lado del
                          nombre, así que tres unidades anidadas se leían como tres filas sueltas
                          apenas corridas —y a 18 px, «corridas» es algo que se nota comparando
                          dos renglones, no de un vistazo—.

                          Dibujado con dos bordes y una esquina redonda: sube hacia la fila de
                          arriba y gira hacia el nombre, que es exactamente lo que dice «este
                          cuelga de aquel». Va solo en las filas anidadas; una de primer nivel no
                          cuelga de nada y no tiene de dónde salir. */}
                      {nivel > 0 && <span className="est-rama" aria-hidden="true" />}
                      {/* SOLO EL CARGO SE DESPLIEGA, porque es el único que tiene algo debajo que no
                          es una fila de esta tabla. La flecha va antes del nombre y no en una
                          columna propia: es parte de la primera celda, como la sangría y el codo. */}
                      {tieneSillas && (
                        <button
                          className="est-desplegar"
                          aria-label={`${abiertos.has(nodo.id) ? 'Ocultar' : 'Ver'} las sillas de ${nodo.nombre}`}
                          aria-expanded={abiertos.has(nodo.id)}
                          onClick={e => { e.stopPropagation(); alternar(nodo.id) }}
                        >
                          <ChevronRight size={14} className={abiertos.has(nodo.id) ? 'girado' : undefined} />
                        </button>
                      )}
                      {mezclaTipos && (
                        <>
                          <span className="est-tabla-ico" style={color ? { color } : undefined}>
                            <Icono size={14} />
                          </span>
                          <span className={`est-tipo t-${nodo.tipo}`}>{t?.label || nodo.tipo}</span>
                        </>
                      )}
                      <span className="est-tabla-nombre">{nodo.nombre}</span>
                    </div>
                  </td>

                  {columnas.map(c => (
                    <td key={c.key} className={c.num ? 'est-col-num' : undefined}>
                      {celda[c.key]
                        ? <span>{celda[c.key]}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  ))}

                  <td><PastillaEstado tipo={nodo.tipo} estado={nodo.estado} /></td>

                  {/* LA FILA MIRA, EL MENÚ HACE. Pulsar la fila abre la ficha en lectura, que
                      es lo que uno quiere nueve de cada diez veces; lo que modifica —editar,
                      eliminar— vive detrás de los tres puntos, que es donde no se pulsa por
                      error mientras se recorre la tabla. Y editar abre YA en edición: un botón
                      que dice editar no puede pedir que se pulse "Editar" otra vez. */}
                  <td className="est-acciones">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="est-editar"
                        aria-label={`Acciones de ${nodo.nombre}`}
                        aria-haspopup="menu"
                        aria-expanded={accionesEn === nodo.id}
                        onClick={e => abrirAcciones(e, nodo.id)}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>

                    {accionesEn === nodo.id && (
                      <div className="est-acciones-menu" role="menu" style={posAcciones}>
                        {/* VER DETALLE, AUNQUE LA FILA YA LLEVE AHÍ. Pulsar la fila entera es
                            un gesto que hay que descubrir —y que no existe con teclado—; el
                            menú es donde se busca «qué puedo hacer con esto», y leerlo es una
                            de las cosas que se pueden hacer. */}
                        <button
                          className="est-accion"
                          onClick={e => { e.stopPropagation(); navigate(`/organizacion/nodo/${nodo.id}`) }}
                        >
                          <Eye size={13} /> Ver detalle
                        </button>
                        <button
                          className="est-accion"
                          onClick={e => { e.stopPropagation(); navigate(`/organizacion/nodo/${nodo.id}?editar=1`) }}
                        >
                          <Pencil size={13} /> Editar
                        </button>
                        <button
                          className="est-accion"
                          onClick={e => { e.stopPropagation(); abrirEstado(nodo) }}
                        >
                          <ToggleLeft size={13} /> Cambiar estado
                        </button>
                        <button
                          className="est-accion est-accion-riesgo"
                          onClick={e => { e.stopPropagation(); setAccionesEn(null); setBorrando(nodo) }}
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* LAS SILLAS, DEBAJO DE SU CARGO Y DENTRO DE LA MISMA TABLA.
                    No son una tabla aparte ni un panel: son las filas del cargo, corridas un
                    escalón, con las mismas columnas. Así «Sucursal» y «Responsable» de una silla se
                    comparan con las del cargo de arriba sin mover los ojos, que es para lo que
                    sirve que estén en la misma reja.

                    LA VACANTE SE DIBUJA IGUAL QUE LA OCUPADA, en gris y con su número. Es media
                    razón de que el cupo exista: un cargo «hasta 4» con dos cubiertas tiene que
                    enseñar las dos que faltan, no un hueco que hay que calcular restando. */}
                {sillas.map((silla, i) => {
                  const cel = silla ? celdaDe(silla) : null
                  return (
                    <tr
                      key={`${nodo.id}-silla-${i}`}
                      className={`est-silla${silla ? '' : ' est-silla-vacante'}`}
                      onClick={silla ? () => navigate(`/organizacion/nodo/${silla.id}`) : undefined}
                      style={silla ? { cursor: 'pointer' } : undefined}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: (nivel + 1) * 22 }}>
                          <span className="est-rama" aria-hidden="true" />
                          {/* NI «SILLA» NI «VACANTE» EN EL NOMBRE. Decía «Silla 2» a la que estaba
                              abierta y «Vacante 3» a la que no, y esa es una distinción NUESTRA —si
                              el puesto existe ya como registro— que a quien mira no le sirve para
                              nada: las dos están igual de vacías hasta que alguien las ocupe.

                              El nombre es lo que DISTINGUE a una de otra, que es su código; sin
                              código, su número. Vacante pasó a la columna de quién la ocupa, que es
                              la pregunta que contesta. */}
                          <span className="est-silla-n">{i + 1}</span>
                          <span className="est-tabla-nombre">
                            {silla?.codigo || `Puesto ${i + 1}`}
                          </span>
                          {/* De qué otras unidades trabaja esta silla. Se declara en el organigrama
                              y acá se lee: sin esto, un puesto prestado a Contenidos se veía igual
                              que uno que solo trabaja en lo suyo. */}
                          {/* LA PÍLDORA ES EL BOTÓN. Decía cuántas unidades apoya esta silla y no
                              se podía tocar, así que había que salir a buscar dónde cambiarlo. Es
                              el mismo dato: pulsarlo abre el editor, y sin apoyos declarados
                              aparece igual —en gris— porque «a nadie» también es una respuesta que
                              alguien puede querer cambiar. */}
                          {silla && (
                            <button
                              type="button"
                              className={`est-silla-func${silla.funcionales?.length ? '' : ' vacio'}`}
                              title={`Dónde más trabaja ${silla.codigo || `la silla ${i + 1}`}`}
                              onClick={e => { e.stopPropagation(); setFuncionalDe({ silla, cargo: nodo }) }}
                            >
                              {silla.funcionales?.length
                                ? `+${silla.funcionales.length} ${silla.funcionales.length === 1 ? 'unidad' : 'unidades'}`
                                : 'Solo su unidad'}
                            </button>
                          )}
                        </div>
                      </td>

                      {columnas.map(c => (
                        <td key={c.key} className={c.num ? 'est-col-num' : undefined}>
                          {cel && cel[c.key]
                            ? <span>{cel[c.key]}</span>
                            /* «VACANTE» Y NO UN GUION en la columna de quién la ocupa. Un guion dice
                               «este dato falta»; acá no falta nada, la plaza está abierta y sin
                               cubrir, que es una respuesta y además la que se viene a buscar. */
                            : c.key === 'responsable'
                              ? <span className="est-silla-vac">Vacante</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      ))}

                      <td>
                        {silla
                          ? <PastillaEstado tipo="puesto" estado={silla.estado} />
                          : <span className="est-silla-sin">Sin abrir</span>}
                      </td>

                      <td className="est-acciones">
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {/* UN SOLO BOTÓN Y DICE LO QUE HACE. La silla abierta se edita; la que no
                              existe todavía se abre, y abrirla es crearla y llevar a su ficha. */}
                          <button
                            className="est-accion"
                            onClick={e => {
                              e.stopPropagation()
                              if (silla) navigate(`/organizacion/nodo/${silla.id}?editar=1`)
                              else abrirSilla(nodo, i)
                            }}
                          >
                            {silla ? <><Pencil size={13} /> Editar</> : <><Plus size={13} /> Abrir</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                </Fragment>
              )
            })}
          </tbody>
        </table>

        {/* UN PAGINADOR DEBAJO DE UNA TABLA VACÍA CUENTA CERO DE CERO: es una barra que no hace
            nada, puesta justo donde el aviso tiene que decir qué falta. */}
        {filtradas.length > 0 && (
          <Paginacion
            page={pagina}
            setPage={setPagina}
            total={filtradas.length}
            perPage={POR_PAGINA}
            nombre={(vistaActual?.label || 'nodos').toLowerCase()}
            /* El singular sale del tipo cuando la vista lista uno solo; con dos —área y
               subárea— no hay una palabra que valga para las dos y se queda el plural. */
            nombreUno={unicoTipo ? unicoTipo.label.toLowerCase() : undefined}
          />
        )}
      </div>

      {/* EL MODAL DEL ESTADO. Enseña de dónde sale y a dónde va, y explica qué significa cada
          opción: «cerrada» no es un adjetivo obvio —hay que decir que conserva la historia y que
          deja de ofrecerse—, y ese es justamente el sitio donde alguien lo va a leer. */}
      {cambiandoEstado && (
        <div className="pl-overlay" onClick={() => setCambiandoEstado(null)}>
          <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="pl-modal-header">
              <h2>Cambiar estado</h2>
              <button className="pl-modal-close" onClick={() => setCambiandoEstado(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="pl-modal-body">
              {/* QUIÉN ES, ANTES DE QUÉ SE LE HACE. Decía «La Paz está activa» en una línea gris de
                  12 px, y en una lista donde conviven regionales, sucursales y centros de trabajo,
                  «La Paz» a secas no dice cuál de las tres estás por desactivar. El distintivo del
                  nivel es el mismo que lleva en la tabla, así que se reconoce sin leerlo. */}
              <div className="cb-quien">
                <span className={`est-tipo t-${cambiandoEstado.tipo}`}>
                  {tipoDe(cambiandoEstado.tipo, niveles)?.label || cambiandoEstado.tipo}
                </span>
                <span className="cb-nombre">{cambiandoEstado.nombre}</span>
              </div>

              {/* DE DÓNDE SALE Y A DÓNDE VA, DIBUJADO. Es lo que este modal decía que hacía y solo
                  contaba en una frase. Ahora es el estado de ahora, la flecha, y el que va a
                  quedar, con las mismas dos pastillas de la tabla. Mientras no cambies nada hay
                  una sola —no hay flecha que dibujar hacia el mismo sitio— y la segunda aparece al
                  elegir otro, que es justo cuando uno quiere ver qué va a pasar antes de guardar. */}
              <div className="cb-paso">
                <PastillaEstado tipo={cambiandoEstado.tipo} estado={cambiandoEstado.estado} />
                {estadoNuevo !== (cambiandoEstado.estado || 'activa') && (
                  <>
                    <ArrowRight size={15} className="cb-flecha" aria-hidden="true" />
                    <PastillaEstado tipo={cambiandoEstado.tipo} estado={estadoNuevo} />
                  </>
                )}
              </div>

              <label className="cb-label" htmlFor="est-nuevo-estado">Nuevo estado</label>
              <Desplegable
                id="est-nuevo-estado"
                valor={estadoNuevo}
                onCambio={setEstadoNuevo}
                ariaLabel="Nuevo estado"
                opciones={Object.entries(estadosDe(cambiandoEstado.tipo)).map(([valor, e]) => ({ valor, etiqueta: e.label }))}
              />
              <p className="cb-nota">
                {estadoNuevo === 'cerrada'
                  ? `${verboApagar(cambiandoEstado.tipo)} no es borrar: deja de ofrecerse para nodos nuevos y para el ámbito del riel, pero conserva su historia y su gente.`
                  : 'Vuelve a ofrecerse en los formularios y en el selector de sucursal.'}
              </p>
            </div>
            <div className="pl-modal-footer">
              <button className="pl-btn-cancel" onClick={() => setCambiandoEstado(null)}>Cancelar</button>
              <button
                className="pl-btn-save"
                disabled={estadoNuevo === (cambiandoEstado.estado || 'activa')}
                title={estadoNuevo === (cambiandoEstado.estado || 'activa') ? 'Ya está en ese estado' : undefined}
                onClick={guardarEstado}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DÓNDE MÁS TRABAJA UNA SILLA. El mismo editor que el formulario del organigrama —el
          archivo es uno solo— abierto desde la fila donde se lee el dato. Guarda al vuelo: no hay
          nada que confirmar en un formulario de dos desplegables, y un «Guardar» acá obligaría a
          decidir qué pasa al cerrar sin pulsarlo. */}
      {/* EL MARCO TAMBIÉN SE FUE AL COMPONENTE. Estaba escrito acá y la ficha del puesto necesitaba
          el mismo; era el segundo formulario duplicado del mismo dato en dos semanas. */}
      {funcionalDe && (
        <ModalApoyoFuncional
          titulo={`${funcionalDe.cargo.nombre}${funcionalDe.silla.codigo ? ` · ${funcionalDe.silla.codigo}` : ''}`}
          apoyos={funcionalDe.silla.funcionales || []}
          org={org}
          unidadPropia={funcionalDe.cargo.padreId}
          cargoId={funcionalDe.silla.id}
          onCerrar={() => setFuncionalDe(null)}
          onCambio={funcionales => {
            setNodos(prev => prev.map(n => (n.id === funcionalDe.silla.id ? { ...n, funcionales } : n)))
            setFuncionalDe(f => ({ ...f, silla: { ...f.silla, funcionales } }))
          }}
        />
      )}

      {borrando && (
        <ConfirmarBorrado
          nombre={borrando.nombre}
          tipo={tipoDe(borrando.tipo, niveles)?.label}
          hijos={descendientes(borrando.id, nodos).length}
          onCerrar={() => setBorrando(null)}
          onEliminar={() => { setNodos(prev => prev.filter(n => n.id !== borrando.id)); setBorrando(null) }}
        />
      )}
    </div>
  )
}


/* El menú de agregar no se escribe: se calcula. Lo que llega en `tipos` ya pasó por la regla del
   orden y por los niveles encendidos, así que aquí solo se dibuja. */
function MenuAgregar({ titulo, tipos, onElegir }) {
  return (
    <div className="est-menu">
      <p className="est-menu-cab">{titulo}</p>
      {tipos.map(t => (
        <button key={t.key} className="est-menu-op" onClick={() => onElegir(t)}>
          <span className="est-menu-nombre">{t.label}</span>
          <span className="est-menu-desc">{t.desc}</span>
        </button>
      ))}
    </div>
  )
}
