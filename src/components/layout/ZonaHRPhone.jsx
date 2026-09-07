import {
  Users, Network, Route, ClipboardCheck, ClipboardList, TrendingUp,
  DollarSign, Bot, Folder, Calendar, Gift, Globe, Moon, Bell,
} from 'lucide-react'

/* Lanzador de módulos del colaborador. Solo Onboarding tiene destino dentro del prototipo;
   el resto son accesos de los módulos que SoulyHR todavía no tiene construidos. */
const MODULOS = [
  { icon: Users, label: 'Personas' },
  { icon: Network, label: 'Organigrama', destino: 'organigrama' },
  { icon: Route, label: 'Onboarding', destino: 'onboarding' },
  { icon: ClipboardCheck, label: 'Evaluaciones' },
  { icon: ClipboardList, label: 'Encuestas' },
  { icon: TrendingUp, label: 'PDI' },
  { icon: DollarSign, label: 'Mis remuneraciones' },
  { icon: Bot, label: 'Agente de IA' },
  { icon: Folder, label: 'Archivos' },
  { icon: Calendar, label: 'Calendario' },
  { icon: Gift, label: 'Mis beneficios' },
  { icon: Globe, label: 'Página oficial' },
]

function IconoRedondo({ children }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      {children}
    </div>
  )
}

export default function ZonaHRPhone({ currentUser, onNavegar }) {
  return (
    <div style={{ padding: '2px 2px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0C2D40' }}>Zona HR</div>
          <div style={{ fontSize: 6.5, color: '#94a3b8', lineHeight: 1.45, marginTop: 2 }}>
            Gestiona todos tus recursos desde un solo lugar.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <IconoRedondo><Moon size={9} style={{ color: '#64748b' }} /></IconoRedondo>
          <IconoRedondo>
            <Bell size={9} style={{ color: '#64748b' }} />
            <span style={{
              position: 'absolute', top: -2, right: -2,
              minWidth: 9, height: 9, borderRadius: 5, padding: '0 2px',
              background: '#00E091', color: '#0C2D40',
              fontSize: 5, fontWeight: 800, lineHeight: '9px', textAlign: 'center',
              border: '1.5px solid #f8fafc',
            }}>3</span>
          </IconoRedondo>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: currentUser.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 6, fontWeight: 700 }}>{currentUser.initials}</span>
            </div>
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 6, height: 6, borderRadius: '50%',
              background: '#00E091', border: '1.5px solid #f8fafc',
            }} />
          </div>
        </div>
      </div>

      {/* ── Grilla de módulos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
        {MODULOS.map(m => (
          <div
            key={m.label}
            onClick={() => m.destino && onNavegar(m.destino)}
            style={{
              background: '#fff', borderRadius: 12, padding: '11px 4px 9px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              boxShadow: '0 1px 4px rgba(12,45,64,.07)',
              cursor: m.destino ? 'pointer' : 'default',
            }}
          >
            {/* Aro verde y no disco azul: doce discos llenos en una pantalla de teléfono pesan
                como doce botones de emergencia. El aro deja respirar la tarjeta y es lo mismo
                que se dibuja en la versión de escritorio, que se mira al lado de esta. */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%', border: '1.2px solid #00E091',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <m.icon size={14} style={{ color: '#00B876' }} strokeWidth={1.8} />
            </div>
            <span style={{
              fontSize: 6.5, fontWeight: 700, color: '#0C2D40',
              textAlign: 'center', lineHeight: 1.25,
            }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
