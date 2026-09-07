import { Fragment, useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { EJES, vistasDeEje, tipoDe } from '../../data/estructuraData'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { ChevronRight, LayoutDashboard, Users, Route, Rocket, BookOpen, Settings, ShieldCheck, UserRound, Building2, Folder, MessageCircleMore, ClipboardCheck, Info, ChevronsLeft, ChevronsRight, Sun, Calendar, HeartHandshake, MapPin, Network, FolderTree, LayoutGrid, MessagesSquare, Megaphone, Award, CalendarClock, Send, Workflow } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'

const sectionInfo = {
  'Administración': 'Las pantallas con las que se administra este módulo.',
  'Mi espacio': 'Tu espacio personal como colaborador.',
  'Empresa': 'Quién es la empresa, dónde está y cómo se organiza por dentro. Se define una vez y casi no se toca.',
  'Puestos y personas': 'Los cargos, las plazas y el dibujo. De aquí sacan Onboarding y Evaluación el área y el cargo de cada persona.',
  'Sistema': 'Cómo se comporta Souly para toda la empresa. Se decide una vez y afecta a todos los módulos.',
}
const sectionInfoTitle = {
  'Administración': 'Administración',
  'Mi espacio': 'Mi espacio',
  'Empresa': 'Empresa',
  'Puestos y personas': 'Puestos y personas',
  'Sistema': 'Sistema',
}

/* El calendario de la empresa entra aquí y no en «Mi espacio»: lo que muestra son cumpleaños,
   aniversarios, evaluaciones y campañas de TODA la plantilla —agenda administrativa, no agenda
   propia—, y el Dashboard de Inicio ya enlazaba a él. Por eso tampoco se llama «Mi calendario»:
   el «mi» del colaborador vivirá dentro de Zona HR. */
const inicioNav = [
  { section: 'Administración', items: [
    { label: 'Dashboard', path: '/inicio', icon: LayoutDashboard, end: true },
    { label: 'Calendario', path: '/inicio/calendario', icon: Calendar },
  ]},
]

/* Todo lo propio de la persona, junto y fuera de los módulos de administración: antes había
   que entrar a Inicio para ver el día, a Onboarding para ver el onboarding propio y a otro
   módulo del riel para el calendario —tres puertas administrativas para tres cosas que no
   tienen nada de administrativo. */
const miEspacioPropio = [
  { label: 'Mi día', path: '/mi-espacio/mi-dia', icon: Sun },
  { label: 'Mi Onboarding', path: '/mi-espacio/mi-onboarding', icon: Rocket },
]

/* Las tres últimas son las pestañas que el colaborador ya tiene en la barra de abajo del móvil
   —Chat, Zona HR y Perfil— y que en escritorio no aparecían por ningún lado. Van al final y en
   ese mismo orden para que las dos vistas se lean igual. */
const miEspacioApp = [
  { label: 'Chats', path: '/mi-espacio/chats', icon: MessageCircleMore },
  { label: 'Zona HR', path: '/mi-espacio/zona-hr', icon: LayoutGrid },
  { label: 'Mi perfil', path: '/mi-espacio/perfil', icon: UserRound },
]

const miEspacioNav = [
  { section: 'Mi espacio', items: [...miEspacioPropio, ...miEspacioApp] },
]

// El buddy suma a los suyos las personas que acompaña: acompaña, no supervisa. Va junto a lo
// suyo y antes de las pestañas de la app, que son las mismas para todos.
const miEspacioBuddyNav = [
  { section: 'Mi espacio', items: [
    ...miEspacioPropio,
    { label: 'Mis acompañados', path: '/mi-espacio/acompanados', icon: HeartHandshake },
    ...miEspacioApp,
  ]},
]

const onboardingAdminNav = [
  { section: 'Administración', items: [
    { label: 'Dashboard', path: '/onboarding', icon: LayoutDashboard, end: true },
    { label: 'Seguimiento', path: '/onboarding/asignaciones', icon: Users },
    { label: 'Rutas', path: '/onboarding/plantillas', icon: Route },
    { label: 'Recursos corporativos', path: '/onboarding/conocimiento', icon: BookOpen },
    { label: 'Configuración avanzada', path: '/onboarding/configuracion', icon: Settings },
  ]},
]

const onboardingManagerNav = [
  { section: 'Administración', items: [
    { label: 'Dashboard', path: '/onboarding', icon: LayoutDashboard, end: true },
    { label: 'Seguimiento', path: '/onboarding/asignaciones', icon: Users },
    { label: 'Rutas', path: '/onboarding/plantillas', icon: Route },
  ]},
]

/* ORGANIZACIÓN: el dato maestro de la empresa, fuera de "Gestión de personas".
   Va partido en dos porque son dos ritmos distintos: "Empresa" se llena el primer día y
   después se mira una vez al año; "Estructura" se toca cada vez que alguien crea un área o
   abre una plaza.

   Dentro de Estructura el orden es el del modelo, de lo general a lo concreto: el ÁREA agrupa,
   el CARGO es la definición del rol —"Ejecutiva Comercial"— y el PUESTO es la silla, con su
   código y su sede. El organigrama va último porque no es un editor más: es la vista de todo
   lo anterior junto. */
/* La segunda entrada cambia de nombre según dónde estés parado. Con el ámbito en «todas» es la
   LISTA de las ocho sedes; parado en Cochabamba es la FICHA de Cochabamba, porque la lista de las
   otras siete no contesta ninguna pregunta que tengas ahí.

   «Datos de la empresa» NO se va al estar en una sede: la razón social y el NIT siguen siendo
   verdad en Cochabamba y quien administra ahí los necesita. Es la regla del ámbito —recorta lo que
   ocurre, no lo que se define—; lo que sobra es la lista, no la identidad de la empresa. */
/* Las opciones de cada eje salen de los niveles que la empresa encendió en Configuración: el
   menú es una CONSECUENCIA del modelo y no una lista escrita a mano que se desincroniza.

   LO APAGADO NO SE MUESTRA. Salía en gris para que nadie diera por roto el programa al no
   encontrar algo que vio ayer, y eso tenía sentido cuando los niveles NACÍAN apagados: nadie
   había elegido ese estado. Ahora nacen todos encendidos, así que apagar es un acto deliberado
   —y una decisión del usuario se respeta escondiéndolo, no discutiéndosela cada día en gris—.
   Quien lo apagó sabe dónde está el interruptor: acaba de usarlo. */
function opcionesDeEje(ejeKey, niveles, busqueda, enRuta, tipoFicha) {
  const eje = EJES[ejeKey]
  const encendidas = vistasDeEje(ejeKey, niveles)

  /* NADA SE MARCA SI NO SE ESTÁ EN ESE EJE.
     Sin `?ver` en la dirección la pantalla abre en la primera opción, así que el menú tiene que
     marcar esa misma —si no, entrar por la entrada del eje dejaba las tres apagadas mientras la
     tabla mostraba una—. Pero ese respaldo se aplicaba SIEMPRE, incluso estando en otra
     pantalla: parado en «Datos de la empresa», con el grupo desplegado, «Regionales» salía
     marcada como si estuvieras dentro. Ahora el respaldo solo vale si la ruta es la del eje. */
  const puesta = new URLSearchParams(busqueda).get('ver')
  /* En la ficha de un nodo se marca la vista que LISTA ese tipo: editando una sucursal, sigue
     iluminada «Sucursales», que es de donde saliste y a donde vuelves. */
  const porFicha = tipoFicha ? encendidas.find(v => v.tipos.includes(tipoFicha))?.key : null
  const activa = porFicha || (!enRuta ? null
    : encendidas.some(v => v.key === puesta) ? puesta
      : encendidas[0]?.key)

  /* LOS CATÁLOGOS DEL EJE, AL FINAL Y EN EL MISMO SUBMENÚ.
     Los niveles de mando y los tipos de cargo no son nodos del árbol —no cuelgan de nada— pero
     pertenecen a este eje: son la otra mitad de «cómo se organiza el trabajo», y sin ellos un
     cargo no se puede terminar de definir. Vivían declarados en `EJES` y no los dibujaba nadie,
     así que la única forma de llegar era saber que estaban en Configuración.

     Se llegan desde acá porque es acá donde alguien los va a buscar, y siguen viviendo allá
     porque son una decisión que se toma una vez, no un dato de todos los días. */
  const catalogos = (eje.catalogos || []).map(c => ({
    label: c.label,
    path: c.path,
    // Nunca marcados: llevan a Configuración, que tiene su propia entrada en el menú.
    activa: false,
  }))

  return [
    ...encendidas.map(v => ({
      label: v.label,
      path: `${eje.ruta}?ver=${v.key}`,
      activa: v.key === activa,
    })),
    ...catalogos,
  ]
}

/* SE ACABÓ EL ANEXO. Las pantallas del árbol dejaron de ser una prueba al costado y ocupan
   el sitio de lo que reemplazan: «Sucursales» y «Áreas» se fueron porque una sucursal y un área
   ahora son NIVELES —dentro de Distribución física y de Estructura organizacional— y tenerlas en
   los dos lados obligaba a adivinar cuál mandaba.

   ÁREA ERA EL NOMBRE DE LA PANTALLA, NO DEL CONCEPTO. Se llama «Unidades organizacionales»
   porque un área y una sub-área son la misma cosa con distinta profundidad, y porque la empresa
   que le dice «Departamento» a lo suyo renombra ese peldaño y la entrada del menú la sigue: era
   justamente lo que una entrada fija llamada «Áreas» no podía hacer.

   Las dos siguen teniendo su ruta y se llegan escribiéndola, para poder comparar. Lo que se
   quita es la puerta del menú, que es lo que obligaba a elegir.

   La segunda sección se llamaba «Estructura» y ya no puede: ahora hay una PANTALLA que se llama
   Estructura organizacional, y una sección y una pantalla con el mismo nombre no se leen. Se
   llama por lo que de verdad hay dentro. */
const organizacionNav = () => [
  { section: 'Empresa', items: [
    { label: 'Datos de la empresa', path: '/organizacion/datos', icon: Building2 },
    { label: 'Estructura física', path: '/organizacion/distribucion', icon: MapPin, eje: 'fisica' },
    { label: 'Estructura organizacional', path: '/organizacion/estructura', icon: Workflow, eje: 'organizacional' },
  ]},
  /* «Cargos» y «Puestos» también salieron de acá: ahora es una vista de Estructura organizacional, junto a las
     unidades. Es el mismo caso que Sucursales y Áreas —la ruta vieja sigue montada— y con un
     motivo extra: la pantalla vieja no podía CREAR un cargo. Deducía el catálogo agrupando los
     puestos por nombre, así que un cargo sin puesto no existía en ningún sitio. */
  { section: 'Puestos y personas', items: [
    { label: 'Organigrama', path: '/organizacion/organigrama', icon: Network },
    { label: 'Configuración', path: '/organizacion/configuracion', icon: Settings },
  ]},
]

/* COMUNICACIÓN: el lado administrativo del muro. Aquí se REDACTA lo que en Mi día se lee, y por
   eso «Mis chats» abre la lista: es lo único de este módulo que se usa todos los días. */
const comunicacionNav = [
  { section: 'Administración', items: [
    { label: 'Mis chats', path: '/comunicacion/chats', icon: MessagesSquare },
    { label: 'Gestión de anuncios', path: '/comunicacion/anuncios', icon: Megaphone },
    { label: 'Reconocimientos', path: '/comunicacion/reconocimientos', icon: Award },
    { label: 'Gestión de eventos', path: '/comunicacion/eventos', icon: CalendarClock },
    { label: 'Mensajes programados', path: '/comunicacion/programados', icon: Send },
  ]},
]

const personasNav = [
  { section: 'Administración', items: [
    { label: 'Colaboradores', path: '/personas/colaboradores', icon: UserRound, end: true },
  ]},
]

const archivosNav = [
  { section: 'Carpetas', items: [
    { label: 'Todas las carpetas', path: '/archivos', icon: Folder, end: true },
    { label: 'Onboarding', path: '/archivos/onboarding', icon: Rocket },
    { label: 'Gestión de personas', path: '/archivos/personas', icon: UserRound },
    { label: 'Comunicación', path: '/archivos/comunicacion', icon: MessageCircleMore },
    { label: 'Evaluación', path: '/archivos/evaluacion', icon: ClipboardCheck },
  ]},
]

/* Configuración nace con una sola entrada. Se lista igual que si tuviera diez: el menú del
   módulo dice dónde estás parado, y una pantalla suelta sin menú se siente como un callejón. */
const configuracionNav = [
  { section: 'Sistema', items: [
    { label: 'Roles y permisos', path: '/configuracion/roles', icon: ShieldCheck },
  ]},
]

const onboardingAuxiliarNav = [
  { section: 'Administración', items: [
    { label: 'Rutas', path: '/onboarding/plantillas', icon: Route },
    { label: 'Seguimiento', path: '/onboarding/asignaciones', icon: Users },
  ]},
]

/* El colaborador y el buddy no tienen panel de administración, así que tampoco entran al
   módulo de Onboarding: lo suyo vive todo en Mi espacio personal. */
const onboardingNavByRole = {
  admin: onboardingAdminNav,
  manager: onboardingManagerNav,
  auxiliar: onboardingAuxiliarNav,
}

const moduleConfig = {
  inicio: { title: 'Inicio' },
  miEspacio: { title: 'Mi espacio personal' },
  onboarding: { title: 'Módulo de Onboarding' },
  organizacion: { title: 'Organización' },
  personas: { title: 'Gestión de Personas' },
  comunicacion: { title: 'Comunicación' },
  archivos: { title: 'Mis archivos' },
  configuracion: { title: 'Configuración' },
}

export default function ModuleNav() {
  const [expanded, setExpanded] = useState(true)
  const { currentUser } = useUser()
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { guardNavigate } = useUnsavedChanges()

  const isPersonas = location.pathname.startsWith('/personas')
  const isOrganizacion = location.pathname.startsWith('/organizacion')

  /* QUÉ EJES ESTÁN DESPLEGADOS.
     Estaba atado a la ruta —abierto si estabas dentro, cerrado si no— y eso dejaba la flecha
     mintiendo: giraba, prometía que se podía plegar, y al pulsar el padre navegabas a la misma
     ruta y se quedaba abierto igual. Una flecha que no pliega es peor que no tener flecha.

     Ahora es estado propio: se abre solo al entrar al eje —que es lo que uno quiere— y a partir
     de ahí manda quien pulse. Plegado sigue plegado hasta que se vuelva a pulsar o se entre de
     nuevo al eje desde otro sitio. */
  const [ejesAbiertos, setEjesAbiertos] = useState(() => new Set())

  useEffect(() => {
    const dentro = Object.values(EJES).find(e => e.ruta === location.pathname)
    if (dentro) setEjesAbiertos(prev => (prev.has(dentro.key) ? prev : new Set(prev).add(dentro.key)))
  }, [location.pathname])

  const alternarEje = key => setEjesAbiertos(prev => {
    const n = new Set(prev)
    if (n.has(key)) n.delete(key); else n.add(key)
    return n
  })

  /* Los niveles encendidos, para que las opciones del menú sean las que la empresa configuró. */

  /* EN QUÉ EJE ESTÁS, aunque la ruta no lo diga.
     Estando en la ficha de un nodo —crear o editar— la dirección es «/organizacion/nodo/…», que
     no es de ningún eje. Pero el nodo sí tiene eje: el de su tipo. Se saca del `?tipo=` al crear
     y del árbol al editar, y con eso el menú marca la entrada correcta y la opción correcta.

     Es la diferencia entre «dónde está la URL» y «qué estás haciendo». Lo segundo es lo que la
     persona quiere ver reflejado. */
  /* Del contexto, como todo lo demás de la demo. Leerlo con un `useLocalStorage` propio daba
     una copia que no se enteraba de los cambios de las pantallas: creabas una sucursal y el
     menú seguía con la lista de antes hasta recargar. */
  const { nodos: nodosNav, nivelesEstructura: nivelesNav } = useOnboardingData()

  const enFicha = location.pathname.startsWith('/organizacion/nodo')
  const tipoEnFicha = (() => {
    if (!enFicha) return null
    const q = new URLSearchParams(location.search).get('tipo')
    if (q) return q
    const id = location.pathname.split('/organizacion/nodo/')[1]
    return nodosNav.find(n => n.id === id)?.tipo || null
  })()
  /* A QUÉ EJE PERTENECE EL NODO QUE SE ESTÁ EDITANDO. Lo buscaba recorriendo los ejes y
     preguntándole a cada uno si su lista de tipos contenía este; esa lista dejó de existir
     cuando el eje pasó a ser una marca en el PELDAÑO —que es lo que permite que un nivel propio
     diga dónde vive—. Ahora se le pregunta al peldaño directamente, que además es una búsqueda
     menos. */
  const ejeDeFicha = tipoEnFicha
    ? EJES[tipoDe(tipoEnFicha, nivelesNav)?.eje] || null
    : null

  const isConfiguracion = location.pathname.startsWith('/configuracion')
  const isArchivos = location.pathname.startsWith('/archivos')
  const isComunicacion = location.pathname.startsWith('/comunicacion')
  const isInicio = location.pathname.startsWith('/inicio')
  const isMiEspacio = location.pathname.startsWith('/mi-espacio')
  const moduleKey = isConfiguracion ? 'configuracion' : isArchivos ? 'archivos' : isComunicacion ? 'comunicacion' : isOrganizacion ? 'organizacion' : isPersonas ? 'personas' : isMiEspacio ? 'miEspacio' : isInicio ? 'inicio' : 'onboarding'
  const config = moduleConfig[moduleKey]

  const sections = isConfiguracion
    ? configuracionNav
    : isArchivos
    ? archivosNav
    : isComunicacion
      ? comunicacionNav
      : isOrganizacion
      ? organizacionNav()
      : isPersonas
        ? personasNav
        : isMiEspacio
          ? (currentUser.role === 'buddy' ? miEspacioBuddyNav : miEspacioNav)
          : isInicio
            ? inicioNav
            : (onboardingNavByRole[currentUser.role] || onboardingAdminNav)


  return (
    <div
      className={`overflow-y-auto bg-[var(--bg-nav)] border-r border-gray-200 dark:border-white/[0.06] flex flex-col shrink-0
        transition-all duration-300 ease-in-out
        ${expanded ? 'w-60' : 'w-16 items-center'}`}
      style={{ height: '100%' }}
    >
      {/* LA MISMA BANDA DE 56 PX QUE EL RIEL, y con su misma línea: las dos columnas empiezan por
          lo mismo —el riel con el logo, esta con el nombre del módulo— así que arrancan a la misma
          altura y la línea cruza las dos de lado a lado.

          SOLO EL TÍTULO. Tuvo un ícono y una descripción debajo; los dos se fueron. El ícono
          repetía el del módulo activo del riel, que está a 60 px y a esta misma altura. Y la
          descripción se leía una vez y después era mobiliario: ocupaba 113 px en todas las
          pantallas para explicar algo que el propio menú ya enseña con sus entradas. */}
      <header
        className={`flex items-center shrink-0 h-14 ${expanded ? 'justify-between' : 'justify-center w-full'}`}
        style={{
          paddingLeft: expanded ? '1.75rem' : 0,
          paddingRight: expanded ? '0.75rem' : 0,
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        {expanded && (
          <h2 className="text-sm font-bold text-[#0C2D40] dark:text-white truncate">
            {config.title.replace('Módulo de ', '')}
          </h2>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Minimizar menú' : 'Expandir menú'}
          title={expanded ? 'Minimizar menú' : 'Expandir menú'}
          className="p-1.5 shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100
            dark:text-slate-500 dark:hover:text-white dark:hover:bg-[#24586F]
            rounded-lg transition-all duration-150 cursor-pointer"
        >
          {expanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </header>


      {/* El menú ya no arranca pegado a la línea del encabezado: mientras la descripción del
          módulo vivía aquí, ella hacía de aire; al irse, el rótulo de sección quedó lamiendo el
          borde. Este respiro es el mismo que el riel se da bajo el logo. */}
      <nav className="flex flex-col" style={expanded ? { paddingTop: '1rem', paddingLeft: '1.25rem', paddingRight: '1rem' } : { paddingTop: '1rem', width: '100%', alignItems: 'center' }}>
        {sections.map((group, gi) => (
          <div key={group.section} style={{ marginBottom: gi < sections.length - 1 ? '1rem' : 0, paddingTop: gi > 0 ? '0.75rem' : 0, borderTop: gi > 0 && expanded ? '1px solid var(--border-soft)' : 'none', width: expanded ? undefined : '100%', display: expanded ? undefined : 'flex', flexDirection: expanded ? undefined : 'column', alignItems: expanded ? undefined : 'center' }}>
            {expanded && (
              <div style={{
                fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#A9B7C6' : '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '0 0.85rem', marginBottom: '0.4rem',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {group.section}
                {sectionInfo[group.section] && (
                  <div style={{ display: 'inline-flex' }}
                    onMouseEnter={e => {
                      const tip = e.currentTarget.querySelector('[data-tip]')
                      const rect = e.currentTarget.getBoundingClientRect()
                      tip.style.left = (rect.right + 8) + 'px'
                      tip.style.top = rect.top + 'px'
                      tip.style.opacity = '1'
                    }}
                    onMouseLeave={e => e.currentTarget.querySelector('[data-tip]').style.opacity = '0'}
                  >
                    <Info size={10} style={{ color: '#94a3b8', cursor: 'help' }} />
                    <div data-tip style={{
                      position: 'fixed',
                      background: '#0C2D40', color: '#fff', borderRadius: 8, padding: '8px 12px',
                      fontSize: 12, lineHeight: 1.5, width: 200, zIndex: 9999, textTransform: 'none', letterSpacing: 'normal',
                      boxShadow: '0 4px 16px rgba(0,0,0,.15)', opacity: 0,
                      transition: 'opacity .15s', pointerEvents: 'none',
                    }}>
                      <strong style={{ color: '#00E091', display: 'block', marginBottom: 3 }}>{sectionInfoTitle[group.section]}</strong>
                      {sectionInfo[group.section]}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col" style={{ gap: '0.3rem', alignItems: expanded ? undefined : 'center' }}>
              {group.items.map(({ label, path, icon: Icon, end, eje }) => {
                /* DOS VERDES NO PUEDEN DECIR «ESTÁS AQUÍ» A LA VEZ. Estando dentro, el padre deja
                   de ser un destino y pasa a ser el nombre del sitio: se vuelve rótulo y le cede
                   el verde al hijo, que es donde uno está de verdad. */
                const abierto = !!eje && expanded && ejesAbiertos.has(eje)
    /* La entrada se marca también cuando estás en la ficha de un nodo de su eje. */
                const ejeActivo = !!eje && ejeDeFicha?.key === eje
                return (
                <Fragment key={path}>
                <NavLink
                  to={path}
                  end={end}
                  /* El título va SIEMPRE y no solo con el menú plegado: "Estructura
                     organizacional" no entra en el ancho de la barra y se recorta. */
                  title={label}
                  aria-expanded={eje && expanded ? abierto : undefined}
                  /* CON HIJOS, EL PADRE PLIEGA; sin ellos, navega. Estando desplegado los
                     destinos son los de abajo, así que llevar además a una ruta propia daba dos
                     formas de hacer lo mismo —y ninguna de plegar—. Plegado del todo, el primer
                     toque abre; los siguientes eligen. */
                  onClick={e => {
                    e.preventDefault()
                    if (eje && expanded) { alternarEje(eje); return }
                    guardNavigate(() => navigate(path))
                  }}
                  className={({ isActive }) =>
                    `font-medium rounded-md flex items-center cursor-pointer transition-all duration-150 text-xs
                    ${isActive || ejeActivo
                      ? 'bg-[#00E091] text-[#0C2D40] dark:bg-[#00E091] dark:text-[#06231B]'
                      : 'text-[#0C2D40] hover:bg-[#0C2D40]/10 hover:text-[#0C2D40] dark:text-[#C6D6DE] dark:hover:bg-[#24586F] dark:hover:text-white'
                    }`
                  }
                  style={expanded ? { padding: '0.6rem 0.85rem' } : { width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                >
                  {/* El ícono ya no lleva color propio: hereda el del ítem. Activo eso es azul
                      sobre el relleno menta —verde sobre verde se perdería— e inactivo, el azul
                      de la marca como el resto del menú. */}
                  <>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} style={{ marginRight: expanded ? '0.65rem' : 0 }} />
                    {expanded && <span className="truncate">{label}</span>}
                    {/* LA FLECHA ES LO QUE HACE QUE ALGUIEN PULSE LA PRIMERA VEZ. El efecto de
                        despliegue solo se ve DESPUÉS de abrir; cerrado —que es como está el 90 %
                        del tiempo— lo único que promete que ahí abajo hay algo es esto. */}
                    {eje && expanded && (
                      <ChevronRight className={`mn-chev${abierto ? ' abierto' : ''}`} strokeWidth={2.5} />
                    )}
                  </>
                </NavLink>

                {/* LA SANGRÍA Y LA GUÍA SON LA JERARQUÍA, y alcanzan. Por eso los hijos NO se
                    achican: el submenú se dibujó como nota al pie del padre y acumuló tres
                    rebajas —cuerpo, tinta y opacidad— hasta dejar de leerse. Mientras el eje está
                    abierto, estos renglones son los únicos destinos que hay.

                    EL GRUPO SE QUEDA EN EL DOM aunque esté cerrado, y lo que cambia es una clase.
                    Montándolo y desmontándolo no hay nada que animar al cerrar: los tres
                    renglones desaparecerían de golpe, que es justo lo que la animación viene a
                    evitar. Cerrado no ocupa nada —el alto es cero— y no recibe el foco. */}
                {eje && expanded && (
                  <div className={`mn-caja${abierto ? ' abierto' : ''}`} aria-hidden={!abierto}>
                   <div className="mn-caja-dentro">
                    <div className="mn-sub">
                    {opcionesDeEje(eje, nivelesNav, location.search, location.pathname === path, ejeActivo ? tipoEnFicha : null).map(op => (
                      <button
                        key={op.path}
                        className={`mn-sub-item${op.activa ? ' on' : ''}`}
                        aria-current={op.activa ? 'page' : undefined}
                        onClick={() => guardNavigate(() => navigate(op.path))}
                        tabIndex={abierto ? 0 : -1}
                      >
                        {/* El punto va DENTRO del botón, no en el contenedor: así viaja con su
                            opción en la cascada, y el conjunto se lee como una parada que llega
                            entera en vez de un texto que se acerca a una marca ya puesta. */}
                        <span className="mn-punto" aria-hidden="true" />
                        {op.label}
                      </button>
                    ))}
                    </div>
                   </div>
                  </div>
                )}
                </Fragment>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
