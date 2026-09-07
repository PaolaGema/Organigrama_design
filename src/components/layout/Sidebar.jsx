import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, CircleUserRound, UserRound, MessageCircleMore, ClipboardCheck, Settings, LogOut, Rocket, Folder, Menu, ChevronsRight, Database, RotateCcw, AlertTriangle, X, Building2, Bell, Sun, Moon, Users, ChevronDown, BookOpen } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'
import logoOscuro from '../../assets/imagenes/logo_souly_oscuro.png'
import logoClaro from '../../assets/imagenes/logo_souly_claro.png'

// El buddy ve exactamente lo mismo que un colaborador: acompañar no otorga permisos.
const TODOS = ['admin', 'manager', 'auxiliar', 'colaborador', 'buddy']

/* El riel separa lo administrativo de lo personal. "Mi espacio personal" es lo único que ve
   todo el mundo: adentro está el día, el calendario y el onboarding propios.

   Inicio y Onboarding quedaron solo para quien administra. Antes los veía también el
   colaborador, pero al entrar rebotaba a su pantalla personal: eran dos puertas del riel que
   llevaban al mismo lugar y ninguna a lo que anunciaban. */
const allNavItems = [
  { icon: House, label: 'Inicio', path: '/inicio', roles: ['admin', 'manager', 'auxiliar'] },
  { icon: CircleUserRound, label: 'Mi espacio personal', path: '/mi-espacio', roles: TODOS },
  /* LA ESTRUCTURA VA ANTES QUE LA GENTE, y el orden no es estético: primero se define el área y
     se abre la plaza, y recién después se contrata contra ella. Salió de "Gestión de personas"
     —donde era la mitad de un módulo que decía llamarse de otra cosa— porque no es dato de
     personas sino dato maestro de la empresa: Onboarding ya elige la ruta por área y cargo, y
     Evaluación va a sacar de aquí quién evalúa a quién. Un dato del que dependen tres módulos no
     puede vivir dentro del cajón de ajustes de uno. */
  { icon: Building2, label: 'Organización', path: '/organizacion', roles: ['admin', 'manager'] },
  { icon: UserRound, label: 'Gestión de personas', path: '/personas/colaboradores', roles: ['admin', 'manager'] },
  { icon: Rocket, label: 'Onboarding', path: '/onboarding', roles: ['admin', 'manager', 'auxiliar'] },
  /* COMUNICACIÓN Y EVALUACIÓN SON MÓDULOS DE ADMINISTRACIÓN, no del colaborador: aquí se
     redactan los anuncios y se arman las campañas de evaluación, no se leen. Lo que al
     colaborador le toca de esos dos módulos —sus chats, sus evaluaciones por responder— entra
     por Mi espacio personal, igual que su onboarding.

     Así el colaborador y el buddy ven UNA sola entrada en el riel. Antes veían tres, y las dos
     de abajo no llevaban a ninguna parte. */
  { icon: MessageCircleMore, label: 'Comunicación', path: '/comunicacion', roles: ['admin', 'manager'] },
  { icon: ClipboardCheck, label: 'Evaluación', path: null, roles: ['admin', 'manager'] },
  { icon: Folder, label: 'Mis archivos', path: '/archivos', roles: ['admin'] },
  /* CONFIGURACIÓN VA LA ÚLTIMA porque no es un módulo de trabajo: se entra a decidir cómo se
     comporta el sistema y se sale. Solo Recursos Humanos: quién puede hacer qué no lo decide
     quien lo padece. */
  { icon: Settings, label: 'Configuración', path: '/configuracion', roles: ['admin'] },
]


/* Un punto arriba de los 14px de ModuleNav, no igual: colapsado el ícono es lo único
   clicable del rail, así que bajarlo hasta el tamaño de adentro lo dejaba flaco. Los dos
   estados comparten la medida para que el rail no cambie de peso al expandirse. */
const TAMANO_ICONO = 17

function NavItem({ icon: Icon, label, active, expanded, variant, onClick }) {
  const isLogout = variant === 'logout'

  const base = isLogout
    ? 'text-gray-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 border-l-2 border-transparent'
    : active
      ? 'bg-[#00E091] text-[#0C2D40] border-l-2 border-transparent dark:bg-[#00E091] dark:text-[#06231B] dark:border-transparent'
      : 'text-[#0C2D40] hover:bg-white hover:text-[#0C2D40] dark:text-[#C6D6DE] dark:hover:bg-[#24586F] dark:hover:text-white border-l-2 border-transparent'


  if (!expanded) {
    return (
      <button
        title={label}
        onClick={onClick}
        className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer font-inherit
          transition-colors duration-150 ${base}`}
      >
        <Icon size={TAMANO_ICONO} strokeWidth={active ? 2.2 : 1.8} />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      style={{ paddingLeft: 26, paddingRight: 12 }}
      className={`h-10 flex items-center gap-3 rounded-lg w-full cursor-pointer font-inherit
        transition-colors duration-150 ${base}`}
    >
      <Icon size={TAMANO_ICONO} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
      {/* 12px en los dos menús, que se ven juntos al expandir el riel. Se probó a 14 y a 13 y se
          volvió aquí: lo que hacía ilegible este texto era el CONTRASTE —3.12:1— y no la medida.
          A 12px con 14.33:1 se lee sin esfuerzo, y el riel recupera su peso ligero. */}
      <span className={`text-xs whitespace-nowrap ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </button>
  )
}

/* Los dos desplegables de la zona de demo, extraídos porque se usan en los DOS estados del riel
   —abierto y plegado— y duplicarlos era garantía de que uno se quedara atrás al tocar el otro.
   Los dos se abren hacia arriba (`bottom: 0`) porque nacen del pie de la columna. */
function PanelFlotante({ children, ancho = 240 }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 'calc(100% + 10px)',
      background: 'var(--surface-card)', borderRadius: 12, padding: 6,
      boxShadow: 'var(--sh-flotante)', border: '1px solid var(--border-dark)',
      zIndex: 60, minWidth: ancho, maxHeight: 380, overflowY: 'auto',
    }}>
      {children}
    </div>
  )
}

function ListaVerComo({ users, currentUser, onElegir }) {
  return (
    <PanelFlotante>
      <div style={{ padding: '8px 12px 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em' }}>
        Ver la demo como
      </div>
      {users.map(u => (
        <button
          key={u.id}
          onClick={() => onElegir(u)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
            background: u.id === currentUser.id ? 'var(--surface-hover)' : 'transparent',
          }}
        >
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: u.color || '#0C2D40', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {u.initials}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{u.roleLabel}</span>
          </span>
        </button>
      ))}
    </PanelFlotante>
  )
}

function MenuDatosDemo({ onCargar, onResetear }) {
  const fila = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8, border: 'none',
    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'left', transition: 'background .1s',
  }
  return (
    <PanelFlotante>
      <button
        onClick={onCargar} style={fila}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Database size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>Cargar datos de ejemplo</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Llena el sistema con datos ficticios</div>
        </div>
      </button>
      <button
        onClick={onResetear} style={fila}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <RotateCcw size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Resetear demo</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Borra todo y vuelve al inicio</div>
        </div>
      </button>
    </PanelFlotante>
  )
}

/* LA CUENTA Y LO QUE LLEGA SOLO, debajo del logo.
   Estaban en una cabecera de 56 px que cruzaba la pantalla entera para decir tres cosas: el
   título de la pantalla —que ya estaba dos filas más abajo—, un aviso y quién eres. Las dos
   últimas caben aquí; la primera sobraba.

   EL NOMBRE Y EL ROL NO CABEN CERRADO. El riel mide 64 px, así que ahí solo entra el avatar y
   el texto se abre en su menú. Es lo mismo que hacen Slack, Linear y GitHub, y por eso el menú
   existe en los dos estados: para que cerrar el riel no esconda nada.

   EL CONMUTADOR DE TEMA NO ES NUEVO: `toggleTheme` vivía en el contexto desde antes y no había
   un solo botón en toda la aplicación que lo llamara. El modo oscuro estaba escrito y era
   inalcanzable salvo tocando el almacenamiento del navegador a mano. */
/* SE EXPORTA para que el encabezado use ESTE bloque y no una copia suya. La propuesta que se
   compara es «dónde va este control», así que tiene que ser el mismo control. */
export function CuentaBloque({ expanded, barra }) {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const { guardNavigate } = useUnsavedChanges()
  const { theme, toggleTheme } = useTheme()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = e => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  const oscuro = theme === 'dark'
  /* Sin alto fijo: quien lo use decide el suyo. El botón de la cuenta lleva DOS renglones —nombre
     y rol— más el avatar, y en los 36 px de la fila corta el relleno del hover quedaba a un pelo
     del texto por arriba y por abajo; se le da alto por relleno para que respire. */
  const fila = 'flex items-center rounded-lg cursor-pointer font-inherit transition-colors duration-150 text-[#0C2D40] hover:bg-white dark:text-[#C6D6DE] dark:hover:bg-[#24586F]'

  return (
    /* En la barra los dos bloques se tumban: `row-reverse` para que los iconos sueltos queden
       a la izquierda y la cuenta —lo más importante— pegada al extremo derecho, que es donde
       la busca todo el mundo. */
    <div className={barra
      ? 'flex flex-row-reverse items-center gap-2'
      : `flex flex-col gap-1 ${expanded ? 'w-full' : 'items-center'}`}
      style={expanded && !barra ? { paddingLeft: 8, paddingRight: 8 } : undefined}>

      {/* Usuario */}
      <div className="relative" ref={ref} style={expanded && !barra ? { width: '100%' } : undefined}>
        <button
          onClick={() => setAbierto(!abierto)}
          title={expanded ? undefined : `${currentUser.name} · ${currentUser.roleLabel}`}
          aria-haspopup="menu"
          aria-expanded={abierto}
          className={`${fila} ${barra ? 'gap-2.5' : expanded ? 'w-full gap-3' : 'w-10 h-9 justify-center'}`}
          style={barra
            ? { paddingLeft: 8, paddingRight: 10, paddingTop: 5, paddingBottom: 5 }
            : expanded ? { paddingLeft: 18, paddingRight: 10, paddingTop: 8, paddingBottom: 8 } : undefined}
        >
          <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: currentUser.color || '#0C2D40' }}>
            {currentUser.initials}
          </span>
          {(expanded || barra) && (
            <span className="min-w-0 text-left">
              <span className="block text-xs font-semibold truncate">{currentUser.name}</span>
              <span className="block text-[11px] text-[#5A7285] dark:text-[#8FA8B7] truncate">{currentUser.roleLabel}</span>
            </span>
          )}
        </button>

        {/* Abierto el riel el menú cae debajo del avatar; cerrado sale al costado y a su
            misma altura, porque debajo no hay sitio: son 64 px. */}
        {abierto && (
          <div role="menu" style={{
            position: 'absolute',
            top: expanded || barra ? 'calc(100% + 6px)' : 0,
            /* Desde la barra cae anclado a la DERECHA: es lo último de la fila y con `left` se
               salía de la ventana. */
            left: barra ? 'auto' : expanded ? 8 : 'calc(100% + 10px)',
            right: barra ? 0 : 'auto',
            background: 'var(--surface-card)', borderRadius: 12, padding: 6,
            boxShadow: 'var(--sh-flotante)', border: '1px solid var(--border-dark)',
            zIndex: 60, minWidth: 232, maxHeight: 340, overflowY: 'auto',
          }}>
            <div style={{ padding: '9px 12px 7px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{currentUser.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser.roleLabel}</div>
            </div>
            {/* AQUÍ SOLO VA PRODUCTO. Este menú es el que va a existir en el sistema real, así
                que enseña exactamente lo que un usuario tendrá: su perfil, sus ajustes y salir.
                El cambio de rol NO está aquí a propósito —se fue a la zona de demo del pie—
                porque es andamio del prototipo: si viviera en este menú, cualquiera que mire la
                demo pensaría que el sistema real lleva un selector de roles. */}
            <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 4, paddingTop: 6 }}>
              {[
                { Icon: UserRound, label: 'Mi perfil', path: '/mi-espacio/perfil' },
                { Icon: Settings, label: 'Configuración', path: '/configuracion/roles' },
                { Icon: LogOut, label: 'Cerrar sesión', salir: true },
              ].map(({ Icon, label, salir, path }) => (
                <button
                  key={label}
                  onClick={() => {
                    setAbierto(false)
                    if (path) guardNavigate(() => navigate(path))
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', background: 'transparent',
                    color: salir ? 'var(--red)' : 'var(--text-heading)',
                    fontSize: 13, fontWeight: 500, transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = salir ? 'var(--red-bg)' : 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AVISOS Y TEMA: SIEMPRE SOLO ÍCONO, lo que cambia es cómo se ordenan.
          Abierto van en fila, uno al lado del otro: son dos acciones sueltas y no destinos, así
          que ponerles rótulo los hacía parecer dos entradas más del menú y estiraban el bloque
          dos renglones de más. Cerrado se apilan porque a 64 px no caben de a dos.

          El rótulo no se pierde: vive en el `title`, que es donde ya estaba cuando el riel se
          pliega. */}
      <div
        className={expanded || barra ? 'flex gap-1' : 'flex flex-col gap-1 items-center'}
        style={expanded && !barra ? { paddingLeft: 14 } : undefined}
      >
        <button
          title="Notificaciones"
          aria-label="Notificaciones"
          className={`${fila} w-9 h-9 justify-center relative`}
        >
          <Bell size={TAMANO_ICONO} strokeWidth={1.8} />
          {/* El punto se ve igual abierto que cerrado: es lo único que tiene que leerse de lejos. */}
          <span className="absolute rounded-full" style={{
            top: 6, right: 7, width: 7, height: 7, background: '#00A468',
            /* El aro es del color de DETRÁS, y detrás no siempre está el riel. */
            border: '1.5px solid ' + (barra ? 'var(--surface-card)' : 'var(--bg-sidebar)'),
          }} />
        </button>

        <button
          onClick={toggleTheme}
          title={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className={`${fila} w-9 h-9 justify-center`}
        >
          {oscuro
            ? <Sun size={TAMANO_ICONO} strokeWidth={1.8} />
            : <Moon size={TAMANO_ICONO} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, setCurrentUser, users } = useUser()
  const { theme } = useTheme()
  const { resetDemo, loadSampleData } = useOnboardingData()
  const { guardNavigate } = useUnsavedChanges()
  const navItems = allNavItems.filter(item => item.roles.includes(currentUser.role))
  const isAdmin = currentUser.role === 'admin'
  function go(path) { guardNavigate(() => navigate(path)) }

  /* Se sirve como archivo y no como ruta de React: es un documento, no una pantalla, y así lo
     puede abrir cualquiera —incluido quien no levanta la app— y mandarse por su dirección. */
  function abrirReglas() { window.open('/reglas-de-negocio.html', '_blank', 'noopener') }

  const [showDemoMenu, setShowDemoMenu] = useState(false)
  const [showVerComo, setShowVerComo] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showLoadConfirm, setShowLoadConfirm] = useState(false)
  const demoRef = useRef(null)
  const verComoRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (demoRef.current && !demoRef.current.contains(e.target)) setShowDemoMenu(false)
      if (verComoRef.current && !verComoRef.current.contains(e.target)) setShowVerComo(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function isActive(path) {
    if (!path) return false
    return location.pathname.startsWith(path)
  }

  return (
    <>
    <aside className={`bg-[var(--bg-sidebar)] flex flex-col border-r border-gray-200 dark:border-white/[0.06] shrink-0 h-full
      transition-all duration-300 ease-in-out
      ${expanded ? 'w-60' : 'w-16 items-center'}`}
    >
      <div className={`flex items-center shrink-0 h-14 border-b border-[#DDE3EA] dark:border-white/[0.08]
        ${expanded ? 'justify-between w-full' : 'justify-center'}`}
      style={expanded ? { paddingLeft: 20, paddingRight: 16 } : undefined}
      >
        {expanded ? (
          <>
            <div className="flex items-center gap-3">
              <img src={theme === 'dark' ? logoClaro : logoOscuro} alt="SoulyHR" className="h-7 w-auto shrink-0 select-none" />
            </div>
            <button
              onClick={() => setExpanded(false)}
              aria-label="Minimizar menú"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100
                dark:text-slate-500 dark:hover:text-white dark:hover:bg-[#24586F]
                rounded-lg transition-all duration-150 cursor-pointer
                hover:rotate-90 active:scale-90"
            >
              <Menu size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            aria-label="Expandir menú"
            className="group relative w-10 h-10 shrink-0 bg-gradient-to-br from-[#0C2D40] to-[#1a4d6b] rounded-xl
              flex items-center justify-center cursor-pointer shadow-md
              hover:shadow-lg hover:scale-105 active:scale-95
              transition-all duration-200 ease-out"
          >
            <div className="overflow-hidden select-none group-hover:opacity-0 transition-opacity duration-150" style={{ width: 12, height: 24 }}>
              <img src={logoClaro} alt="" className="h-full w-auto" style={{ maxWidth: 'none' }} />
            </div>
            <ChevronsRight
              size={16}
              className="absolute text-white opacity-0 group-hover:opacity-100
                transition-opacity duration-150"
            />
          </button>
        )}
      </div>

      {/* La cuenta va pegada al logo y la navegación empieza después de la línea: arriba
          está quién eres y en qué tema miras; debajo, a dónde puedes ir. */}
      {/* La línea separa dos cosas distintas: arriba quién eres y cómo miras; abajo, a dónde
          vas. Va en `--border-soft` y no en el gris de antes: aquel daba 1.05:1 contra el
          blanco —invisible— y una división que no se ve no divide nada. */}
      {/* Más aire arriba que abajo —20 contra 16— porque este bloque cuelga de la línea del
          logo y con los 12 de antes el avatar quedaba pegado a ella. Es el bloque más denso del
          riel: lleva un avatar, dos renglones de texto y dos acciones. */}
      {/* LA CUENTA VIVE EN EL ENCABEZADO Y AQUÍ NO SE REPITE. Este hueco existía para dibujarla
          cuando la ventana no tenía barra superior; elegida esa, el bloque quedaba siempre vacío y
          con él la línea que separaba de la navegación, que ya no separaba nada. */}

      {/* Más aire arriba que abajo —20 contra 12— por lo mismo que el bloque de la cuenta: la
          navegación cuelga de la línea y «Inicio» la chocaba. Y va en el `style` y no en clases
          para que valga igual con el riel abierto y plegado: son los mismos 20 px que se da el
          avatar bajo la línea del logo. */}
      <nav className={`flex flex-col flex-1 gap-1
        ${expanded ? 'w-full' : 'items-center'}`}
      style={{ paddingTop: 20, paddingBottom: 12, ...(expanded ? { paddingLeft: 8, paddingRight: 8 } : null) }}
      >
        {navItems.map(({ icon, label, path }) => (
          <NavItem
            key={label}
            icon={icon}
            label={label}
            active={isActive(path)}
            expanded={expanded}
            onClick={() => path && go(path)}
          />
        ))}
      </nav>

      {/* ZONA DE DEMO — dibujada como PANEL, no como menú.
          Todo lo que existe solo para enseñar el prototipo vive aquí, separado y rotulado: el
          cambio de rol y los datos de ejemplo. Antes eran dos entradas más del riel, con la misma
          pinta que Inicio u Organización, y por eso se leían como funciones del producto.

          EL BORDE DISCONTINUO NO ES ADORNO: es la convención de «esto es provisional». Un dev que
          abra la demo tiene que ver de un vistazo qué va a construir y qué es andamio; si no, acaba
          implementando un selector de roles que nadie pidió.

          El rol se muestra como FICHA con el color de esa persona, no como texto en un renglón:
          "Ver como: Administrador HR" en un riel de 240 px quedaba largo y apretado. */}
      <div className={`shrink-0 border-t border-[#DDE3EA] dark:border-white/[0.08]
        ${expanded ? 'w-full' : 'flex flex-col items-center'}`}
        style={{ paddingTop: 12, paddingBottom: 12 }}
      >
        {expanded ? (
          <div style={{
            margin: '0 10px', padding: '10px 11px', borderRadius: 12,
            /* Sin relleno: desde que el riel lleva tinte, el gris del panel quedaba a un punto
               del fondo y no se distinguía. Lo que dibuja el panel es el borde discontinuo, y la
               ficha blanca de dentro es la que resalta. */
            background: 'transparent',
            border: '1px dashed var(--border-dark)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '.09em',
                color: 'var(--text-muted)', textTransform: 'uppercase',
              }}>
                Demo
              </span>
              {isAdmin && (
                <div className="relative" ref={demoRef}>
                  <button
                    onClick={() => { setShowDemoMenu(!showDemoMenu); setShowVerComo(false) }}
                    title="Datos de la demo"
                    aria-label="Datos de la demo"
                    style={{
                      width: 24, height: 24, borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-card)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Database size={14} />
                  </button>
                  {showDemoMenu && <MenuDatosDemo onCargar={() => { setShowDemoMenu(false); setShowLoadConfirm(true) }} onResetear={() => { setShowDemoMenu(false); setShowResetConfirm(true) }} />}
                </div>
              )}
              {/* LAS REGLAS DE NEGOCIO. Tercer botón de la misma fila porque es de la misma
                  familia: las tres cosas sirven para ENSEÑAR el prototipo —los datos con los que
                  se enseña, la forma en que se enseña y el porqué de lo que se está viendo—.

                  ABRE UN DOCUMENTO, no una pantalla de la app. Las reglas son un documento del
                  equipo y viven en su propio archivo, `public/reglas-de-negocio.html`; en pestaña
                  aparte porque se consulta MIENTRAS se trabaja —se mira una regla y se vuelve a
                  lo que estabas haciendo, que sigue ahí igual que lo dejaste—. */}
              <button
                onClick={() => abrirReglas()}
                title="Reglas de negocio"
                aria-label="Reglas de negocio"
                style={{
                  width: 24, height: 24, borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <BookOpen size={14} />
              </button>
            </div>

            <div className="relative" ref={verComoRef}>
              <button
                onClick={() => { setShowVerComo(!showVerComo); setShowDemoMenu(false) }}
                aria-haspopup="listbox"
                aria-expanded={showVerComo}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 9px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                  background: 'var(--surface-card)', border: '1px solid var(--border-soft)',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: currentUser.color || '#0C2D40', color: '#fff',
                  fontSize: 8, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {currentUser.initials}
                </span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600,
                  color: 'var(--text-heading)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {currentUser.roleLabel}
                </span>
                <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>
              {showVerComo && <ListaVerComo users={users} currentUser={currentUser} onElegir={u => { setCurrentUser(u); setShowVerComo(false) }} />}
            </div>
          </div>
        ) : (
          /* Plegado no cabe el panel: quedan los dos botones, con su título al pasar el ratón. */
          <div className="flex flex-col items-center gap-1">
            <div className="relative" ref={verComoRef}>
              <NavItem icon={Users} label={`Ver la demo como: ${currentUser.roleLabel}`} expanded={false}
                onClick={() => { setShowVerComo(!showVerComo); setShowDemoMenu(false) }} />
              {showVerComo && <ListaVerComo users={users} currentUser={currentUser} onElegir={u => { setCurrentUser(u); setShowVerComo(false) }} />}
            </div>
            {isAdmin && (
              <div className="relative" ref={demoRef}>
                <NavItem icon={Database} label="Datos de la demo" expanded={false}
                  onClick={() => { setShowDemoMenu(!showDemoMenu); setShowVerComo(false) }} />
                {showDemoMenu && <MenuDatosDemo onCargar={() => { setShowDemoMenu(false); setShowLoadConfirm(true) }} onResetear={() => { setShowDemoMenu(false); setShowResetConfirm(true) }} />}
              </div>
            )}
            <NavItem
              icon={BookOpen}
              label="Reglas de negocio"
              expanded={false}
              onClick={() => abrirReglas()}
            />
          </div>
        )}
      </div>
    </aside>


    {/* MODAL RESETEAR */}
    {showResetConfirm && (
      <div className="pl-overlay" style={{ zIndex: 60 }} onClick={() => setShowResetConfirm(false)}>
        <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="pl-modal-header">
            <h2>Resetear demo</h2>
            <button className="pl-modal-close" onClick={() => setShowResetConfirm(false)}><X size={18} /></button>
          </div>
          <div className="pl-modal-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'var(--red-bg)', border: '1px solid var(--border-soft)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>Esta acción no se puede deshacer</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Se borrarán todas las configuraciones, rutas, recursos, asignaciones y el historial de actividad. El sistema volverá al estado inicial vacío.
            </p>
          </div>
          <div className="pl-modal-footer">
            <button className="pl-btn-cancel" onClick={() => setShowResetConfirm(false)}>Cancelar</button>
            <button onClick={() => { resetDemo(); setShowResetConfirm(false) }} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
              Resetear todo
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL CARGAR DATOS */}
    {showLoadConfirm && (
      <div className="pl-overlay" style={{ zIndex: 60 }} onClick={() => setShowLoadConfirm(false)}>
        <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="pl-modal-header">
            <h2>Cargar datos de ejemplo</h2>
            <button className="pl-modal-close" onClick={() => setShowLoadConfirm(false)}><X size={18} /></button>
          </div>
          <div className="pl-modal-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid var(--border-soft)' }}>
              <Database size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)' }}>Se reemplazará cualquier dato existente</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Se cargarán 10 rutas, 14 asignaciones, 8 recursos y la configuración activa de ejemplo.
            </p>
          </div>
          <div className="pl-modal-footer">
            <button className="pl-btn-cancel" onClick={() => setShowLoadConfirm(false)}>Cancelar</button>
            <button onClick={() => { loadSampleData(); window.location.href = '/onboarding' }} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
              Cargar datos
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
