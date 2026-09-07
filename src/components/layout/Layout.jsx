import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import ModuleNav from './ModuleNav'
import MiOnboarding from '../../pages/colaborador/MiOnboarding'
import { useUser } from '../../context/UserContext'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'
import { Home, MessageCircle, Bell, User, Users, LayoutGrid, Route, Calendar, MapPin, Sun, Gift, Info, HeartHandshake } from 'lucide-react'
import { colaboradoresData } from '../../pages/personas/colaboradoresData'
import EncabezadoPropuesta from './EncabezadoPropuesta'
import ZonaHRPhone from './ZonaHRPhone'
import OrganigramaPhone from './OrganigramaPhone'
import SeguimientoPhone from './SeguimientoPhone'
import AcompanadosPhone from './AcompanadosPhone'
import OnboardingHubPhone from './OnboardingHubPhone'
import BarraVolver from './BarraVolver'

// Destinos que cuelgan de la pestaña Onboarding.
const SUB_ONBOARDING = ['mi-onboarding', 'seguimiento', 'acompanados']

export default function Layout() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const { exitConfirmOpen, confirmDiscard, confirmSave, cancelExit } = useUnsavedChanges()

  const isMobile = currentUser.mobile === true
  const esLider = currentUser.role === 'manager'
  const esBuddy = currentUser.role === 'buddy'

  /* La pestaña "Onboarding" es un atajo, no un lugar: existe solo mientras la persona
     tiene una incorporación en curso, para que pueda ir a sus tareas de un toque. Quien ya
     se graduó — o nunca pasó por el módulo, como un líder de siempre — entra por Zona HR.
     Por eso la condición mira el dato del usuario y no su rol. */
  const enOnboarding = !currentUser.onbNA && !currentUser.onbGraduado

  /* El buddy tampoco la tiene: acompañar no es una ruta propia en curso, así que entra por
     Zona HR como cualquier otro módulo. La regla de la pestaña sigue siendo una sola —
     tienes incorporación en curso o no — y no se le abre una excepción por rol. */

  /* El hub aparece cuando hay más de un destino adentro. El buddy graduado igual lo ve: su
     ruta terminada sigue siendo consultable y la tarjeta lo dice. */
  const conHub = esLider || esBuddy

  // Quien está cursando entra por su ruta; el buddy graduado, por Inicio: acompañar es parte
  // de su día, no lo único que hace.
  const tabInicial = enOnboarding ? 'onboarding' : 'inicio'
  const [mobileTab, setMobileTab] = useState(tabInicial)

  /* Un módulo abierto desde Zona HR ocupa la pantalla completa: el lanzador te saca del
     árbol de pestañas, así que dejar la barra abajo sugiere que sigues dentro de ella.
     Y la pestaña "Onboarding" es transitoria — cuando la persona se gradúa desaparece y
     Zona HR queda como única puerta, así que ese camino tiene que verse bien sin barra. */
  const [origenHR, setOrigenHR] = useState(false)
  const abrirDesdeHR = key => { setOrigenHR(true); setMobileTab(key) }
  const volverAHR = () => { setOrigenHR(false); setMobileTab('hr') }
  const irAPestana = key => { setOrigenHR(false); setMobileTab(key) }

  /* El banner de Inicio es el atajo al onboarding desde el muro, y cada perfil llega con un
     trabajo distinto: el colaborador sigue su ruta, el líder mira a su área y el buddy mira a
     su gente. Escrito como un objeto y no con ternarios repetidos en el ícono, el título y
     el pie: así el día que se agregue un cuarto perfil se toca un solo lugar.

     Quien no tiene pestaña propia entra por `abrirDesdeHR`, aunque venga del muro: el atajo
     adelanta pasos, pero deja a la persona parada en el mismo lugar del árbol al que habría
     llegado por Zona HR. Si entrara por `irAPestana` quedaría en una pantalla sin pestaña
     encendida y sin salida hacia atrás. */
  const acompanados = esBuddy ? colaboradoresData.filter(c => c.buddy?.name === currentUser.name) : []
  const buddyEnRiesgo = acompanados.filter(c => c.onb === 'en-riesgo').length

  const banner = esBuddy
    ? {
        icon: HeartHandshake,
        titulo: 'Acompañar a mi gente',
        detalle: `${acompanados.length} ${acompanados.length === 1 ? 'persona' : 'personas'}`
          + (buddyEnRiesgo > 0 ? ` · ${buddyEnRiesgo} en riesgo →` : ' →'),
        ir: () => abrirDesdeHR('acompanados'),
      }
    : esLider
      ? {
          icon: Users,
          titulo: 'Ver el onboarding de mi equipo',
          detalle: `Tu área: ${currentUser.area} →`,
          ir: () => abrirDesdeHR('seguimiento'),
        }
      : {
          icon: Route,
          titulo: 'Continuar mi Onboarding',
          detalle: 'Tienes tareas pendientes →',
          ir: () => irAPestana('onboarding'),
        }

  // Al cambiar de usuario en el simulador se vuelve a la raíz de la pestaña: si no, un
  // colaborador puede quedar parado en Seguimiento, que no le corresponde.
  useEffect(() => { setOrigenHR(false); setMobileTab(tabInicial) }, [currentUser.id, tabInicial])

  useEffect(() => {
    /* `/personas/organigrama` ya no se excluye: esa ruta hoy solo redirige a
       `/organizacion/organigrama`, así que la excepción no protegía nada. */
    const isPersonas = location.pathname.startsWith('/personas')
    /* Organización entra al rebote como el resto de lo administrativo. Se le escapó al crear el
       módulo: el riel ya no se lo muestra a un colaborador, pero el riel solo esconde —quien
       escriba la URL a mano entra igual, y este guardia es justamente el que lo impide. */
    const isOrganizacion = location.pathname.startsWith('/organizacion')
    const isArchivos = location.pathname.startsWith('/archivos')
    const isComunicacion = location.pathname.startsWith('/comunicacion')
    /* Configuración entra al rebote con el resto de lo administrativo, y con más razón: es
       donde se decide quién puede hacer qué. El riel no se la enseña a nadie más que a RRHH,
       pero el riel solo esconde —quien escriba la dirección a mano entra igual—. */
    const isConfiguracion = location.pathname.startsWith('/configuracion')
    // La ficha de una asignación cuelga de Seguimiento (/onboarding/asignaciones/:id): entra
    // por prefijo, si no un colaborador podría quedarse ahí escribiendo la URL a mano.
    const isAdminRoute = ['/onboarding', '/onboarding/asignaciones', '/onboarding/plantillas', '/onboarding/conocimiento', '/onboarding/configuracion'].includes(location.pathname)
      || location.pathname.startsWith('/onboarding/asignaciones/')

    // El buddy tiene los mismos permisos que un colaborador: acompañar no da acceso a
    // administración. Su única pantalla extra es /mi-espacio/acompanados.
    const sinAccesoAdmin = currentUser.role === 'colaborador' || currentUser.role === 'buddy'

    // Lo suyo vive en Mi espacio personal; los módulos administrativos ni les aparecen en el
    // riel, así que llegar aquí es haber escrito la URL a mano o venir de un enlace viejo.
    if (sinAccesoAdmin && location.pathname.startsWith('/inicio')) {
      navigate('/mi-espacio/mi-dia', { replace: true })
    } else if (sinAccesoAdmin && (isAdminRoute || isPersonas || isOrganizacion || isArchivos || isComunicacion || isConfiguracion)) {
      navigate('/mi-espacio/mi-onboarding', { replace: true })
    }
  }, [currentUser.id, location.pathname])

  if (isMobile) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: '#1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Selector de usuario flotante */}
        <div style={{ position: 'absolute', top: 20, right: 24 }}>
          <Header floating />
        </div>

        {/* Etiqueta */}
        <div style={{
          position: 'absolute', top: 24, left: 28,
          color: '#94a3b8', fontSize: 11, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#00E091',
          }} />
          Vista Mobile — Prototipo UX
        </div>

        {/* Phone frame */}
        <div style={{
          width: 280, height: 560,
          borderRadius: 36,
          border: '5px solid #334155',
          background: '#fff',
          overflow: 'hidden',
          boxShadow: '0 0 0 2px #1e293b, 0 25px 60px rgba(0,0,0,.4)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* Status bar */}
          <div style={{
            height: 40, background: '#0C2D40',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 6, flexShrink: 0,
            position: 'relative',
          }}>
            <div style={{
              width: 90, height: 22, borderRadius: 11,
              background: '#1e293b', position: 'absolute', top: 6,
              left: '50%', transform: 'translateX(-50%)',
            }} />
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
              SoulyHR
            </span>
          </div>

          {/* Content */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '10px 10px 10px',
            background: '#f8fafc',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          className="phone-scroll"
          >
            {mobileTab === 'inicio' ? (
              <div style={{ padding: '2px 2px' }}>

                {/* ── Header: Saludo + iconos ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 7, color: '#94a3b8' }}>Hola 👋</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#0C2D40' }}>{currentUser.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={9} style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={9} style={{ color: '#64748b' }} />
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: currentUser.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: '#fff', fontSize: 6, fontWeight: 700 }}>{currentUser.initials}</span>
                    </div>
                  </div>
                </div>

                {/* ── Fecha card ── */}
                <div style={{
                  background: '#fff', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid #e2e8f0', marginBottom: 8, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 6, color: '#94a3b8', marginBottom: 1 }}>Hoy es</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Calendar size={10} style={{ color: '#0C2D40' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0C2D40' }}>Junio 22, 2026</span>
                  </div>
                  <div style={{ fontSize: 5.5, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                    <MapPin size={5} /> La Paz, Bolivia
                  </div>
                </div>

                {/* ── Turno + Reunión row ── */}
                <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                  <div style={{
                    flex: 1, background: '#fff', borderRadius: 8, padding: '6px 8px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />
                      <span style={{ fontSize: 5.5, color: '#3b82f6', fontWeight: 600 }}>Turno</span>
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#0C2D40' }}>08:00-16:00</div>
                  </div>
                  <div style={{
                    flex: 1, background: '#fff', borderRadius: 8, padding: '6px 8px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: 5.5, color: '#10b981', fontWeight: 600 }}>Actividad</span>
                    </div>
                    <div style={{ fontSize: 7, fontWeight: 600, color: '#0C2D40' }}>Reunión con RRHH</div>
                  </div>
                  <div style={{
                    flex: 1, background: '#fff', borderRadius: 8, padding: '6px 8px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ fontSize: 5.5, color: '#f59e0b', fontWeight: 600 }}>Pendientes</span>
                    </div>
                    <div style={{ fontSize: 7, fontWeight: 600, color: '#0C2D40' }}>2 solicitudes</div>
                  </div>
                </div>

                {/* ── Próximos eventos y cumpleaños ── */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 6, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>Próximos eventos y cumpleaños</span>
                    <span style={{ fontSize: 5.5, color: '#3b82f6', fontWeight: 600 }}>Ver más →</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
                    {[
                      { name: 'María', date: '12 Abr', type: 'CUMPLEAÑOS', color: '#ec4899', border: '#fecdd3' },
                      { name: 'Jorge', date: '16 Abr', type: 'CUMPLEAÑOS', color: '#f59e0b', border: '#fde68a' },
                      { name: 'Ana', date: '20 Abr', type: 'CUMPLEAÑOS', color: '#8b5cf6', border: '#ddd6fe' },
                      { name: 'Carlos', date: '28 Abr', type: 'CUMPLEAÑOS', color: '#0d9488', border: '#99f6e4' },
                      { name: 'ADN', date: '28 Abr', type: 'EVENTO', color: '#0C2D40', border: '#cbd5e1', isEvent: true },
                    ].map(e => (
                      <div key={e.name + e.date} style={{ minWidth: 42, textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 4.5, fontWeight: 700, color: e.isEvent ? '#0C2D40' : '#ec4899', textTransform: 'uppercase', marginBottom: 2, letterSpacing: '.02em' }}>
                          {e.type}
                        </div>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', margin: '0 auto 2px',
                          background: e.isEvent ? '#0C2D40' : e.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `2px solid ${e.border}`,
                        }}>
                          {e.isEvent ? (
                            <span style={{ fontSize: 5, fontWeight: 700, color: '#00E091' }}>🏢</span>
                          ) : (
                            <span style={{ fontSize: 7, fontWeight: 700, color: '#fff' }}>{e.name[0]}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 5.5, fontWeight: 600, color: '#0C2D40' }}>{e.name}</div>
                        <div style={{ fontSize: 4.5, color: '#94a3b8' }}>{e.date}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Acciones rápidas ── */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 6, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>Acciones rápidas</span>
                  <div style={{ display: 'flex', gap: 5, marginTop: 4, overflowX: 'auto' }}>
                    {[
                      { icon: Calendar, label: 'Solicitar\nVacación' },
                      { icon: Sun, label: 'Solicitar\nPermiso' },
                      { icon: Gift, label: 'Ver\nBeneficios' },
                    ].map(a => (
                      <div key={a.label} style={{
                        background: '#fff', borderRadius: 8, padding: '8px 10px',
                        border: '1px solid #e2e8f0', textAlign: 'center',
                        minWidth: 58, flexShrink: 0,
                      }}>
                        <a.icon size={11} style={{ color: '#64748b', display: 'block', margin: '0 auto 3px' }} />
                        <div style={{ fontSize: 6, fontWeight: 600, color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{a.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Tabs: Noticias / Muro / Menciones ── */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 8, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
                  {['Noticias', 'Muro', 'Menciones'].map((t, i) => (
                    <span key={t} style={{
                      flex: 1, textAlign: 'center',
                      fontSize: 6.5, fontWeight: 600, padding: '5px 0', borderRadius: 6,
                      background: i === 2 ? '#0C2D40' : 'transparent',
                      color: i === 2 ? '#fff' : '#64748b',
                      cursor: 'pointer',
                    }}>{t}</span>
                  ))}
                </div>

                {/* ── Post de mención ── */}
                <div style={{
                  background: '#fff', borderRadius: 10, padding: '10px',
                  border: '1px solid #e2e8f0', marginBottom: 8,
                }}>
                  {/* Post header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C2D40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 6, fontWeight: 700, color: '#fff' }}>JP</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 7.5, fontWeight: 700, color: '#0C2D40' }}>Juan Pérez Gómez</div>
                      <div style={{ fontSize: 5.5, color: '#94a3b8' }}>Hace un momento · Hoy</div>
                    </div>
                  </div>

                  {/* Post body */}
                  <p style={{ fontSize: 7, color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                    ¡Hoy celebramos a Carlos Mendoza por cumplir su primer día con nosotros! Gracias por el compromiso y todo lo que aportas al equipo. <span style={{ color: '#3b82f6' }}>#BienvenidaFarmaVida</span>
                  </p>

                  {/* Post card celebración */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fce7f3, #fdf2f8, #ede9fe)',
                    borderRadius: 8, padding: '10px', textAlign: 'center', marginBottom: 6,
                  }}>
                    <div style={{ fontSize: 5, fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                      🎉 Bienvenida al equipo 🎉
                    </div>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
                      background: currentUser.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.1)',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{currentUser.initials}</span>
                    </div>
                    <div style={{ fontSize: 7.5, fontWeight: 700, color: '#0C2D40' }}>Carlos Mendoza Ríos</div>
                    <div style={{ fontSize: 5.5, color: '#64748b' }}>Tecnología · Backend</div>
                  </div>

                  {/* Post interactions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 5.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}>❤️ 24 personas</span>
                      <span style={{ fontSize: 5.5, color: '#64748b' }}>3 comentarios</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 0, marginTop: 5, background: '#f8fafc', borderRadius: 6, padding: 2 }}>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 6, color: '#64748b', padding: '4px 0', fontWeight: 500 }}>♡ Recomendar</span>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 6, color: '#64748b', padding: '4px 0', fontWeight: 500 }}>💬 Comentar</span>
                  </div>
                </div>

                {/* ── Banner Onboarding ── */}
                {/* Ni el líder ni el buddy tienen una ruta propia que continuar: su atajo es
                    su gente, y el pie dice si alguno necesita atención. */}
                <div
                  onClick={banner.ir}
                  style={{
                    background: '#0C2D40', borderRadius: 10, padding: '10px 12px',
                    marginBottom: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: 'rgba(0,224,145,.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <banner.icon size={11} style={{ color: '#00E091' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 7.5, fontWeight: 700, color: '#fff' }}>
                      {banner.titulo}
                    </div>
                    <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>
                      {banner.detalle}
                    </div>
                  </div>
                </div>

              </div>
            ) : mobileTab === 'hr' ? (
              <ZonaHRPhone currentUser={currentUser} onNavegar={abrirDesdeHR} />
            ) : mobileTab === 'organigrama' ? (
              <OrganigramaPhone onSalir={volverAHR} />
            ) : mobileTab === 'seguimiento' ? (
              <SeguimientoPhone currentUser={currentUser} onVolver={() => setMobileTab('onboarding')} />
            ) : mobileTab === 'acompanados' ? (
              <AcompanadosPhone currentUser={currentUser} onVolver={() => setMobileTab('onboarding')} />
            ) : (
              <>
                {/* Abierto desde Zona HR se sale al lanzador; abierto desde la pestaña, al hub. */}
                {mobileTab === 'onboarding' && origenHR && (
                  <BarraVolver texto="Zona HR" onVolver={volverAHR} />
                )}
                {mobileTab === 'mi-onboarding' && (
                  <BarraVolver texto="Onboarding" onVolver={() => setMobileTab('onboarding')} />
                )}
                {mobileTab === 'onboarding' && conHub
                  ? <OnboardingHubPhone currentUser={currentUser} onIr={setMobileTab} />
                  : <MiOnboarding forcePhone />}
              </>
            )}
          </div>

          {/* Bottom nav — estilo SoulyHR. Los módulos abiertos desde Zona HR van a pantalla
              completa: dejar las pestañas ahí sugiere que son hermanas de Inicio y te deja
              sin salida al tocar otra. */}
          <div style={{
            flexShrink: 0,
            padding: '4px 10px 0',
            display: origenHR ? 'none' : 'block',
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 -2px 16px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '6px 4px',
            }}>
              {[
                { icon: Home, label: 'Inicio', key: 'inicio' },
                ...(enOnboarding ? [{ icon: Route, label: 'Onboarding', key: 'onboarding' }] : []),
                { icon: MessageCircle, label: 'Chat', key: 'chat' },
                { icon: LayoutGrid, label: 'Zona HR', key: 'hr' },
                { icon: User, label: 'Perfil', key: 'perfil' },
              ].map(tab => {
                // Mi Onboarding y Seguimiento viven dentro de la pestaña Onboarding, así que
                // la mantienen encendida mientras estás adentro.
                const active = mobileTab === tab.key
                  || (tab.key === 'onboarding' && SUB_ONBOARDING.includes(mobileTab))
                const navegable = ['inicio', 'onboarding', 'hr'].includes(tab.key)
                return (
                <div key={tab.label}
                  onClick={() => navegable && irAPestana(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 3, cursor: navegable ? 'pointer' : 'default',
                    ...(active ? {
                      background: '#0C2D40', borderRadius: 10,
                      padding: '5px 10px',
                    } : {
                      padding: '5px 6px',
                    }),
                  }}>
                  <tab.icon size={12} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? '#fff' : '#64748b' }} />
                  {active && (
                    <span style={{ fontSize: 7, fontWeight: 700, color: '#fff' }}>{tab.label}</span>
                  )}
                </div>
                )
              })}
            </div>
          </div>

          {/* Franja de gestos del sistema. Va siempre, con o sin barra de pestañas: es el
              espacio del teléfono, no de la app, y ahí abajo vive la barra de volver/inicio.
              Dibujarla evita que la navegación de SoulyHR se apoye sobre ella. */}
          <div style={{
            flexShrink: 0, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 92, height: 3.5, borderRadius: 99, background: '#cbd5e1' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* SIN CABECERA. Los 56 px de la barra superior decían tres cosas: el título de la
          pantalla —que ya está dos filas más abajo, y por duplicado hacían que hubiera dos
          <h1> en cada página—, un aviso y quién eres. Las dos últimas se mudaron al riel,
          bajo el logo; la primera sobraba. El `Header` sigue vivo para la vista móvil, que lo
          monta como selector flotante. */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ARRIBA DEL MENÚ Y NO SOLO DEL CONTENIDO: la barra cruza de lado a lado a partir del
            riel, que es como se dibujaba antes. Metida dentro de la columna del contenido
            arrancaría a 300 px del borde y parecería la cabecera de la página, no de la app. */}
        <EncabezadoPropuesta />
        <div className="flex flex-1 overflow-hidden">
          <ModuleNav />
          <main className="flex-1 overflow-y-auto" style={{ padding: '1.25rem 1rem', background: 'var(--bg-app)' }}>
            <Outlet />
          </main>
        </div>
      </div>

      {exitConfirmOpen && (
        <div className="pl-overlay" style={{ zIndex: 200 }} onClick={cancelExit}>
          <div className="pl-modal pl-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-body" style={{ textAlign: 'center', padding: '28px 24px 4px' }}>
              <div className="jb-del-ico" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Info size={24} />
              </div>
              <h2 className="pl-del-title">Cambios sin guardar</h2>
              <p className="pl-del-desc">
                Hiciste cambios en esta ruta que todavía no guardaste. ¿Qué quieres hacer?
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 24px 22px' }}>
              <button
                onClick={confirmSave}
                style={{ width: '100%', padding: '11px 20px', border: 'none', borderRadius: 10, background: '#0C2D40', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Guardar y salir
              </button>
              <button
                onClick={confirmDiscard}
                style={{ width: '100%', padding: '10px 20px', border: '1px solid #fecaca', borderRadius: 10, background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Salir sin guardar
              </button>
              <button
                onClick={cancelExit}
                style={{ width: '100%', padding: '9px 20px', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
