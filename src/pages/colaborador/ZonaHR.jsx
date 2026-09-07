import { useNavigate } from 'react-router-dom'
import {
  Users, Network, Route, ClipboardCheck, ClipboardList, TrendingUp,
  CircleDollarSign, Bot, Folder, Calendar, Gift, Globe,
} from 'lucide-react'
import { useUser } from '../../context/UserContext'

/* ZONA HR — EL LANZADOR DE MÓDULOS.
   Es la misma pantalla que el colaborador tiene en el teléfono, y la razón de que exista es que
   el riel no le sirve: al colaborador el riel le muestra una sola entrada —Mi espacio personal—
   porque los módulos de administración no le tocan. Pero SÍ le tocan las puertas de cada módulo:
   sus evaluaciones, sus recibos, sus beneficios. Zona HR es esa lista de puertas.

   TODAS LAS DOCE SE DIBUJAN, TENGAN DESTINO O NO. Esconder las que faltan haría que la pantalla
   creciera de tres en tres a lo largo del proyecto y que nadie —ni el cliente ni quien programe—
   pudiera ver de un vistazo cuánto falta. Las que no existen no se apagan en gris hasta
   desaparecer: se dibujan enteras y avisan al pasar el mouse. Son el mapa del producto.

   QUÉ ES NAVEGABLE DEPENDE DEL ROL, y no por cortesía: Personas y Organigrama viven detrás del
   guardia de rutas del `Layout`, así que ofrecerle esas tarjetas a un colaborador sería mandarlo
   a un rebote. Se ofrece lo que esa persona puede abrir de verdad. */

const ADMINISTRA = ['admin', 'manager', 'auxiliar']

function modulos(rol) {
  const admin = ADMINISTRA.includes(rol)
  const gestiona = rol === 'admin' || rol === 'manager'
  return [
    { icon: Users, label: 'Personas', destino: gestiona && '/personas/colaboradores' },
    { icon: Network, label: 'Organigrama', destino: gestiona && '/organizacion/organigrama' },
    /* Para quien administra, el módulo; para el resto, su propia ruta. Es la misma puerta con
       dos lados: nadie entra a "Onboarding" a ver el de otro si no le corresponde. */
    { icon: Route, label: 'Onboarding', destino: admin ? '/onboarding' : '/mi-espacio/mi-onboarding' },
    { icon: ClipboardCheck, label: 'Evaluaciones' },
    { icon: ClipboardList, label: 'Encuestas' },
    { icon: TrendingUp, label: 'PDI' },
    { icon: CircleDollarSign, label: 'Mis remuneraciones' },
    { icon: Bot, label: 'Agente de IA' },
    { icon: Folder, label: 'Archivos', destino: rol === 'admin' && '/archivos' },
    { icon: Calendar, label: 'Calendario', destino: admin && '/inicio/calendario' },
    { icon: Gift, label: 'Mis beneficios' },
    { icon: Globe, label: 'Página oficial' },
  ]
}

export default function ZonaHR() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const lista = modulos(currentUser.role)

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Zona HR</h1>
          <p className="pl-subtitle">Gestiona todos tus recursos desde un solo lugar.</p>
        </div>
      </div>

      {/* La reja se llena sola: doce tarjetas del mismo tamaño, tres por fila en el teléfono y
          las que entren en el monitor. Sin huecos y sin una tarjeta sola en la última fila. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
        gap: 14,
      }}>
        {lista.map(({ icon: Icon, label, destino }) => {
          const abre = Boolean(destino)
          return (
            <button
              key={label}
              onClick={() => abre && navigate(destino)}
              title={abre ? `Ir a ${label}` : `${label} — todavía no está construido en el prototipo`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: '26px 14px',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-soft)',
                borderRadius: 18,
                cursor: abre ? 'pointer' : 'default',
                fontFamily: 'inherit',
                boxShadow: 'var(--sh-sm)',
                transition: 'border-color .15s, transform .15s',
              }}
              onMouseEnter={e => {
                if (!abre) return
                e.currentTarget.style.borderColor = 'var(--green)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-soft)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {/* El aro verde y el ícono verde: es todo el color que lleva la pantalla. Con doce
                  tarjetas, un color por módulo la convertiría en una caja de crayones. */}
              <span style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${abre ? 'var(--green)' : 'var(--border-dark)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={23} strokeWidth={1.7} style={{ color: abre ? 'var(--green)' : 'var(--icon-muted)' }} />
              </span>
              <span style={{
                fontSize: 13, fontWeight: 700, lineHeight: 1.3, textAlign: 'center',
                color: abre ? 'var(--text-heading)' : 'var(--text-muted)',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
