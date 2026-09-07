import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Plus, Archive, MessagesSquare, User, Users, EyeOff, Send, Paperclip, MoreVertical } from 'lucide-react'
import { conversacionesSeed } from './chatsData'

/* MIS CHATS — DOS COLUMNAS, NO UNA LISTA CON DETALLE APARTE.
   La lista de conversaciones y la conversación abierta se miran juntas: quien contesta mensajes
   salta de una a otra cada pocos segundos, y obligarlo a volver atrás cada vez convierte una
   tarea de treinta segundos en cinco clics. Es la forma que ya tiene el chat de SoulyHR y la que
   todo el mundo espera de una bandeja.

   LA MISMA PANTALLA SIRVE EN DOS SITIOS: aquí, dentro del espacio personal del colaborador, y en
   el módulo de Comunicación cuando exista. No es «el chat del colaborador» y «el chat del
   administrador» —es el mismo buzón—, así que se escribe una vez.

   Alto fijo y scroll adentro, no scroll de página: la lista y el hilo se desplazan cada uno por
   su lado. Los 40 px que se restan son el relleno vertical del `main` del Layout. */

const FILTROS = [
  { key: 'todos', label: 'Todos', icon: MessagesSquare },
  { key: 'personales', label: 'Personales', icon: User },
  { key: 'grupos', label: 'Grupos', icon: Users },
  { key: 'no-vistos', label: 'No vistos', icon: EyeOff },
]

// Los grupos van con inicial sobre color; las personas, con su foto. Es lo que distingue de un
// vistazo un hilo con alguien de un hilo con muchos, sin leer una sola etiqueta.
function Avatar({ conv, size = 42 }) {
  const [falló, setFalló] = useState(false)
  const esGrupo = conv.tipo === 'grupo'
  const iniciales = conv.nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()

  if (esGrupo || falló) {
    return (
      <div style={{
        width: size, height: size, borderRadius: esGrupo ? 12 : '50%', flexShrink: 0,
        background: conv.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.32, fontWeight: 700, letterSpacing: '.02em',
      }}>{iniciales}</div>
    )
  }
  return (
    <img
      src={`https://i.pravatar.cc/80?u=${encodeURIComponent(conv.nombre)}`}
      alt={conv.nombre}
      onError={() => setFalló(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  )
}

function ListaVacia({ texto }) {
  return (
    <div style={{ padding: '38px 24px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
      {texto}
    </div>
  )
}

/* La ilustración va dibujada y no traída de fuera: es un globo de conversación, la cosa más
   fácil de dibujar que existe, y una imagen alojada en otro sitio es una dependencia de red
   para adornar un hueco. Hereda los colores de la marca, así que también funciona en oscuro. */
function IlustracionVacia() {
  return (
    <svg width="180" height="140" viewBox="0 0 180 140" fill="none" aria-hidden="true">
      <circle cx="90" cy="70" r="62" fill="var(--green-bg)" />
      <rect x="34" y="38" width="78" height="50" rx="14" fill="var(--navy)" />
      <circle cx="58" cy="63" r="4.5" fill="var(--green)" />
      <circle cx="73" cy="63" r="4.5" fill="var(--green)" opacity=".65" />
      <circle cx="88" cy="63" r="4.5" fill="var(--green)" opacity=".35" />
      <path d="M52 86 L52 100 L68 86 Z" fill="var(--navy)" />
      <rect x="94" y="72" width="58" height="38" rx="12" fill="var(--green)" />
      <rect x="105" y="84" width="36" height="4.5" rx="2.25" fill="var(--navy)" opacity=".55" />
      <rect x="105" y="94" width="24" height="4.5" rx="2.25" fill="var(--navy)" opacity=".35" />
      <path d="M140 108 L142 121 L126 108 Z" fill="var(--green)" />
    </svg>
  )
}

export default function Chats() {
  const [conversaciones, setConversaciones] = useState(conversacionesSeed)
  const [activaId, setActivaId] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [borrador, setBorrador] = useState('')
  const finDelHilo = useRef(null)

  const activa = conversaciones.find(c => c.id === activaId) || null

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return conversaciones.filter(c => {
      if (filtro === 'personales' && c.tipo !== 'personal') return false
      if (filtro === 'grupos' && c.tipo !== 'grupo') return false
      if (filtro === 'no-vistos' && !c.noLeidos) return false
      if (!q) return true
      // Se busca también dentro de los mensajes: uno recuerda lo que le dijeron mucho antes
      // que con quién lo habló.
      return c.nombre.toLowerCase().includes(q)
        || c.mensajes.some(m => m.texto.toLowerCase().includes(q))
    })
  }, [conversaciones, filtro, busqueda])

  const totalNoLeidos = conversaciones.reduce((s, c) => s + c.noLeidos, 0)

  // Abrir una conversación la marca leída, como en cualquier bandeja.
  function abrir(id) {
    setActivaId(id)
    setBorrador('')
    setConversaciones(prev => prev.map(c => (c.id === id ? { ...c, noLeidos: 0 } : c)))
  }

  function enviar(e) {
    e.preventDefault()
    const texto = borrador.trim()
    if (!texto || !activa) return
    const hora = new Date().toLocaleTimeString('es-BO', { hour: 'numeric', minute: '2-digit' })
    setConversaciones(prev => prev.map(c => (
      c.id === activa.id
        ? { ...c, hora, mensajes: [...c.mensajes, { id: Date.now(), autor: 'yo', texto, hora, mio: true }] }
        : c
    )))
    setBorrador('')
  }

  useEffect(() => {
    finDelHilo.current?.scrollIntoView({ block: 'end' })
  }, [activaId, activa?.mensajes.length])

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 40px)', minHeight: 0 }}>

      {/* ── COLUMNA IZQUIERDA: LA BANDEJA ── */}
      <div className="sec-card" style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 12px' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', flex: 1 }}>
            Mensajes
            {totalNoLeidos > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--navy-txt)',
                background: 'var(--green)', borderRadius: 99, padding: '2px 8px',
              }}>{totalNoLeidos}</span>
            )}
          </h2>
          <button title="Conversaciones archivadas" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px',
            borderRadius: 9, border: '1px solid var(--border-dark)', background: 'var(--surface-card)',
            color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Archive size={13} /> Archivados
          </button>
          <button className="pl-btn-new" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
            <Plus size={14} /> Nuevo
          </button>
        </div>

        <div style={{ padding: '0 16px 10px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-60%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="pl-search"
            style={{ width: '100%' }}
            placeholder="Buscar..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar conversaciones"
          />
        </div>

        {/* Los cuatro recortes son el mismo control segmentado del resto del producto. */}
        <div className="pl-tipo-tabs" style={{ margin: '0 16px 12px' }}>
          {FILTROS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`pl-tipo-tab${filtro === key ? ' on' : ''}`}
              onClick={() => setFiltro(key)}
              style={{ padding: '7px 4px' }}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, borderTop: '1px solid var(--border-soft)' }}>
          <div style={{
            padding: '10px 16px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            {filtro === 'no-vistos' ? 'Sin leer' : 'Recientes'}
          </div>

          {visibles.length === 0 ? (
            <ListaVacia texto={busqueda
              ? `Ninguna conversación coincide con «${busqueda}».`
              : 'No hay conversaciones en este filtro.'} />
          ) : visibles.map(conv => {
            const ultimo = conv.mensajes[conv.mensajes.length - 1]
            const puesta = conv.id === activaId
            return (
              <button
                key={conv.id}
                onClick={() => abrir(conv.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '11px 16px', border: 'none', borderLeft: `3px solid ${puesta ? 'var(--green)' : 'transparent'}`,
                  background: puesta ? 'var(--surface-hover)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  borderBottom: '1px solid var(--border-soft)',
                }}
                onMouseEnter={e => { if (!puesta) e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { if (!puesta) e.currentTarget.style.background = 'transparent' }}
              >
                <Avatar conv={conv} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text-heading)',
                      fontWeight: conv.noLeidos ? 700 : 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{conv.nombre}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{conv.hora}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.4,
                      color: conv.noLeidos ? 'var(--text-heading)' : 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {/* En un grupo importa quién habló; en un chat de dos, ya se sabe. */}
                      {conv.tipo === 'grupo' && !ultimo.mio ? `${ultimo.autor}: ` : ultimo.mio ? 'Tú: ' : ''}
                      {ultimo.texto}
                    </span>
                    {conv.noLeidos > 0 && (
                      <span style={{
                        flexShrink: 0, minWidth: 18, height: 18, borderRadius: 99, padding: '0 5px',
                        background: 'var(--green)', color: 'var(--navy)',
                        fontSize: 10.5, fontWeight: 700, display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>{conv.noLeidos}</span>
                    )}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── COLUMNA DERECHA: LA CONVERSACIÓN ── */}
      <div className="sec-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {!activa ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32,
          }}>
            <IlustracionVacia />
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-heading)', marginTop: 18 }}>
              ¡Bienvenido a Souly Chat!
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 340 }}>
              Tu espacio de comunicación empresarial.<br />
              Selecciona una conversación para comenzar.
            </p>
            <div style={{ width: 44, height: 3, borderRadius: 99, background: 'var(--border-dark)', margin: '22px 0 14px' }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Selecciona un chat en la lista</div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px',
              borderBottom: '1px solid var(--border-soft)', flexShrink: 0,
            }}>
              <Avatar conv={activa} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)' }}>{activa.nombre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{activa.detalle}</div>
              </div>
              <button aria-label="Opciones de la conversación" style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MoreVertical size={16} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activa.mensajes.map((m, i) => {
                // En un grupo el nombre solo se repite cuando cambia quien habla: cinco mensajes
                // seguidos de la misma persona con su nombre cinco veces es ruido.
                const anterior = activa.mensajes[i - 1]
                const encabeza = activa.tipo === 'grupo' && !m.mio && anterior?.autor !== m.autor
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.mio ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '68%' }}>
                      {encabeza && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', margin: '2px 0 3px 12px' }}>
                          {m.autor}
                        </div>
                      )}
                      <div style={{
                        padding: '9px 13px',
                        borderRadius: m.mio ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: m.mio ? 'var(--navy)' : 'var(--surface-hover)',
                        color: m.mio ? '#fff' : 'var(--text-heading)',
                        fontSize: 12.5, lineHeight: 1.55, wordBreak: 'break-word',
                      }}>
                        {m.texto}
                      </div>
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)', marginTop: 3,
                        textAlign: m.mio ? 'right' : 'left', padding: '0 4px',
                      }}>{m.hora}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={finDelHilo} />
            </div>

            <form onSubmit={enviar} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
              borderTop: '1px solid var(--border-soft)', flexShrink: 0,
            }}>
              <button type="button" aria-label="Adjuntar archivo" style={{
                width: 32, height: 32, borderRadius: 9, border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Paperclip size={16} />
              </button>
              <input
                className="pl-search"
                style={{ flex: 1, padding: '0 14px' }}
                placeholder={`Escribe un mensaje para ${activa.nombre}...`}
                value={borrador}
                onChange={e => setBorrador(e.target.value)}
                aria-label="Mensaje"
              />
              <button type="submit" aria-label="Enviar mensaje" disabled={!borrador.trim()} style={{
                width: 34, height: 34, borderRadius: 10, border: 'none', flexShrink: 0,
                background: borrador.trim() ? 'var(--green)' : 'var(--surface-hover)',
                color: borrador.trim() ? 'var(--navy)' : 'var(--text-muted)',
                cursor: borrador.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s',
              }}>
                <Send size={15} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
