import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { HOY, MESES, parseFechaDMY, avatarUrl } from '../../utils/calendarEvents'
import { colaboradores } from './homeData'
import viaTrofeo from '../../assets/imagenes/via_trofeo.webp'
import imagenIdea from '../../assets/imagenes/imagen_idea.png'
import {
  Calendar, MapPin, Clock, Users2, Inbox, ChevronRight,
  Plane, FileText, Gift, FolderOpen, ThumbsUp, MessageCircle,
} from 'lucide-react'

/* MI DÍA — LA MISMA PANTALLA QUE EL COLABORADOR TIENE EN EL TELÉFONO.
   No es un tablero de administración: es el muro de la empresa visto por una persona. Por eso
   va en UNA COLUMNA ESTRECHA y centrada, y no ocupando los 1.400 px de la pantalla. Un saludo,
   una publicación y una fila de cumpleaños estirados a lo ancho del monitor dejan de leerse
   como el inicio de una app y pasan a leerse como un reporte.

   El orden es el del móvil, y ese orden dice algo: primero quién eres y qué día es, después lo
   que la empresa celebra, después lo que puedes pedir, y al final lo que se está diciendo. De
   lo tuyo a lo de todos. */

/* Ancho de lectura, no ancho de pantalla. Se subió de 760 a 880 porque a 760 quedaba demasiado
   fondo vacío a los lados en un monitor; de 880 para arriba las publicaciones empiezan a leerse
   como filas de una tabla y la columna deja de parecer un muro. */
const MAX_ANCHO = 880

const miDia = {
  turno: '08:00 – 16:00',
  actividad: 'Reunión con RRHH',
  pendientes: '2 pendientes',
}

const accionesRapidas = [
  { icon: Plane, label: 'Solicitar\nvacación' },
  { icon: FileText, label: 'Solicitar\npermiso' },
  { icon: Gift, label: 'Ver mis\nbeneficios' },
  { icon: FolderOpen, label: 'Mis\ndocumentos' },
]

const TABS = [
  { key: 'noticias', label: 'Noticias' },
  { key: 'muro', label: 'Muro' },
  { key: 'menciones', label: 'Menciones' },
]

const postsSeed = [
  {
    id: 1, categoria: 'noticias', autor: 'Ana Martínez Ruiz', cargo: 'Líder de Área — Marketing', time: 'Hace un momento',
    titulo: 'Lanzamiento de proyecto: Innovación Verde',
    texto: '¡Llegó el momento de innovar juntos en Trabajito! Queremos presentarles oficialmente nuestro nuevo proyecto interno: Innovación Verde, una iniciativa que nace de las propuestas que ustedes mismos dejaron en la encuesta de clima. Durante las próximas semanas vamos a abrir mesas de trabajo por área para recoger ideas concretas, y las tres mejores se llevan presupuesto propio para ejecutarse este año.',
    imagen: imagenIdea,
    reacciones: 24, comentarios: 3,
  },
  {
    id: 2, categoria: 'noticias', autor: 'Comunicación interna', cargo: 'Cuenta oficial', time: 'Ayer',
    titulo: 'Town Hall trimestral: el lunes a las 10:00',
    texto: 'Recuerden que el próximo lunes es el Town Hall del trimestre, a las 10:00 en el auditorio y por transmisión para las sucursales. Se revisan los resultados del Q2 y se presenta el plan del Q3.',
    reacciones: 12, comentarios: 2,
  },
  {
    id: 3, categoria: 'muro', autor: 'Recursos Humanos', cargo: 'Cuenta oficial', time: 'Hace 2 días',
    titulo: '¡Meta comercial del trimestre cumplida!',
    texto: 'Felicidades al equipo de Ventas por cerrar el trimestre por encima de la meta. Gracias por el esfuerzo y el compromiso de estos tres meses.',
    logro: 'Meta comercial cumplida',
    reacciones: 41, comentarios: 8,
  },
  {
    id: 4, categoria: 'muro', autor: 'Carolina Vega', cargo: 'Analista de Marketing', time: 'Hace 3 días',
    titulo: 'Terminé mi onboarding 🎉',
    texto: 'Gracias a todo el equipo por el acompañamiento de estas semanas, y en especial a Diego por ser mi buddy. ¡Listos para lo que viene!',
    reacciones: 33, comentarios: 11,
  },
  {
    id: 5, categoria: 'menciones', autor: 'Nicolás Zapata', cargo: 'Líder de Área — Ventas', time: 'Hace 4 días',
    titulo: 'Te mencionó en una publicación',
    texto: 'Gracias al equipo de RRHH por lo rápido que salió la plaza de SDR para Santa Cruz. En una semana ya teníamos candidatos en proceso.',
    reacciones: 7, comentarios: 1,
  },
]

/* Los cumpleaños salen del directorio, no de una lista escrita a mano: son los mismos que ve el
   calendario de la empresa. Si se inventaran aquí, Mi día celebraría gente que en el calendario
   no cumple años ese día. */
function proximasCelebraciones(cantidad = 5) {
  const hoyMs = HOY.getTime()
  const cumples = colaboradores
    .filter(c => !c.fechaBaja)
    .map(c => {
      const { d, m } = parseFechaDMY(c.fechaNacimiento)
      let fecha = new Date(HOY.getFullYear(), m - 1, d)
      if (fecha.getTime() < hoyMs) fecha = new Date(HOY.getFullYear() + 1, m - 1, d)
      return { nombre: c.nombre, fecha, tipo: 'Cumpleaños' }
    })
    .sort((a, b) => a.fecha - b.fecha)
    .slice(0, cantidad - 1)

  return [
    ...cumples,
    { nombre: 'Aniversario Trabajito', fecha: new Date(2026, 6, 9), tipo: 'Evento', esEvento: true },
  ]
}

function EtiquetaSeccion({ children, alVerMas }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 -6px' }}>
      <h2 style={{
        margin: 0, flex: 1, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
      }}>{children}</h2>
      {alVerMas && (
        <button onClick={alVerMas} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2, border: 'none', background: 'none',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer',
        }}>
          Ver más <ChevronRight size={13} />
        </button>
      )}
    </div>
  )
}

export default function MiDia() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const [tab, setTab] = useState('noticias')
  const [posts, setPosts] = useState(postsSeed)
  const [expandidos, setExpandidos] = useState([])
  const [reaccionados, setReaccionados] = useState([])

  const celebraciones = proximasCelebraciones()
  const postsFiltrados = posts.filter(p => p.categoria === tab)

  const fechaLarga = `${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][HOY.getDay()]} ${HOY.getDate()} de ${MESES[HOY.getMonth()].toLowerCase()}, ${HOY.getFullYear()}`

  function reaccionar(id) {
    const puesta = reaccionados.includes(id)
    setReaccionados(prev => (puesta ? prev.filter(x => x !== id) : [...prev, id]))
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, reacciones: p.reacciones + (puesta ? -1 : 1) } : p)))
  }

  return (
    <div className="content-scroll" style={{ maxWidth: MAX_ANCHO, margin: '0 auto', width: '100%' }}>

      {/* SALUDO. Sin campana ni avatar al lado: en el teléfono van aquí porque no hay otro
          sitio, pero en escritorio ya viven en el riel, y repetirlos sería tener dos veces
          la misma cuenta en la misma pantalla. */}
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hola 👋</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-.01em' }}>
          {currentUser.name}
        </div>
      </div>

      {/* HOY ES + LAS TRES COSAS DEL DÍA, EN UNA SOLA TARJETA.
          Van juntas porque son la misma pregunta —«¿qué tengo hoy?»— y separarlas en dos
          tarjetas obligaba a leer dos veces para contestarla. */}
      <div className="sec-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
        {/* Los dos círculos tenues del fondo son los de la app: el único adorno de la pantalla. */}
        <div aria-hidden="true" style={{ position: 'absolute', top: -54, right: -34, width: 150, height: 150, borderRadius: '50%', background: 'var(--green-tint)', opacity: .75 }} />
        <div aria-hidden="true" style={{ position: 'absolute', top: 22, right: -76, width: 120, height: 120, borderRadius: '50%', background: 'var(--input-bg)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, background: 'var(--input-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Calendar size={21} style={{ color: 'var(--navy-txt)' }} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Hoy es</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-.01em' }}>{fechaLarga}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <MapPin size={11} /> La Paz, Bolivia
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-soft)', margin: '16px 0 14px', position: 'relative' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, position: 'relative' }}>
          {[
            { icon: Clock, label: 'Turno', value: miDia.turno, tinte: 'var(--green-bg)', color: 'var(--green)' },
            { icon: Users2, label: 'Actividad', value: miDia.actividad, tinte: 'var(--green-bg)', color: 'var(--green)' },
            { icon: Inbox, label: 'Solicitudes', value: miDia.pendientes, tinte: 'var(--blue-bg)', color: 'var(--blue)' },
          ].map(t => (
            <div key={t.label} style={{ background: t.tinte, borderRadius: 12, padding: '11px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.35 }}>{t.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: 11, color: t.color, fontWeight: 600 }}>
                <t.icon size={11} /> {t.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRÓXIMOS EVENTOS Y CUMPLEAÑOS. Fuera de tarjeta, como en la app: son caras, y una
          caja alrededor las convierte en un widget más. */}
      <EtiquetaSeccion alVerMas={() => navigate('/inicio/calendario')}>
        Próximos eventos y cumpleaños
      </EtiquetaSeccion>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {celebraciones.map(c => (
          <div key={c.nombre} style={{ textAlign: 'center', flexShrink: 0, width: 88 }}>
            {c.esEvento ? (
              <div style={{
                width: 62, height: 62, borderRadius: '50%', margin: '0 auto 8px', background: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '-.01em',
              }}>trabajito</div>
            ) : (
              <img
                src={avatarUrl(c.nombre, 120)}
                alt={c.nombre}
                style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block' }}
              />
            )}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {c.tipo}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2, lineHeight: 1.3 }}>
              {c.nombre.split(' ').slice(0, 2).join(' ')}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              {c.fecha.getDate()} {MESES[c.fecha.getMonth()]}
            </div>
          </div>
        ))}
      </div>

      {/* ACCIONES RÁPIDAS */}
      <EtiquetaSeccion>Acciones rápidas</EtiquetaSeccion>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {accionesRapidas.map(a => (
          <button key={a.label} style={{
            display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left',
            background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
            borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-dark)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
          >
            <span style={{
              width: 36, height: 36, borderRadius: 11, background: 'var(--surface-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: '1px solid var(--border-soft)',
            }}>
              <a.icon size={16} style={{ color: 'var(--navy-txt)' }} />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.35, whiteSpace: 'pre-line' }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>

      {/* EL MURO. La pestaña puesta es la única con relleno: las otras dos son texto, no
          botones grises. Tres pastillas grises compitiendo entre sí no dicen cuál está activa. */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {TABS.map(t => {
          const puesta = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 13, fontWeight: 600, padding: '9px 22px', borderRadius: 22,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: puesta ? 'var(--navy)' : 'transparent',
                color: puesta ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {postsFiltrados.length === 0 && (
          <div className="sec-card" style={{ padding: '34px 20px', textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
            No tienes nada en esta pestaña por ahora.
          </div>
        )}

        {postsFiltrados.map(p => {
          const largo = p.texto.length > 190
          const abierto = expandidos.includes(p.id)
          const reaccionado = reaccionados.includes(p.id)
          return (
            <article key={p.id} className="sec-card" style={{ padding: 0, overflow: 'hidden' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 18px 12px' }}>
                <img src={avatarUrl(p.autor, 80)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)' }}>{p.autor}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.cargo} · {p.time}</div>
                </div>
              </div>

              <div style={{ padding: '0 18px' }}>
                <h3 style={{ margin: '0 0 5px', fontSize: 14.5, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.4 }}>
                  {p.titulo}
                </h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.62, color: 'var(--text-muted)' }}>
                  {largo && !abierto ? `${p.texto.slice(0, 190).trimEnd()}… ` : `${p.texto} `}
                  {largo && (
                    <button
                      onClick={() => setExpandidos(prev => abierto ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                      style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', cursor: 'pointer' }}
                    >
                      {abierto ? 'ver menos' : 'ver más'}
                    </button>
                  )}
                </p>
              </div>

              {p.imagen && (
                <div style={{ padding: '12px 18px 0' }}>
                  <img src={p.imagen} alt="" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 14, display: 'block', background: 'var(--input-bg)' }} />
                </div>
              )}

              {p.logro && (
                <div style={{ padding: '12px 18px 0' }}>
                  <div style={{
                    borderRadius: 14, background: 'linear-gradient(135deg, #0C2D40 0%, #1a4a63 100%)',
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  }}>
                    <img src={viaTrofeo} alt="" style={{ height: 58, width: 'auto', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Logro</div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{p.logro}</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px 11px', fontSize: 11.5, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex' }}>
                  {['#00E091', '#3b82f6', '#f59e0b'].map((c, i) => (
                    <span key={c} style={{
                      width: 17, height: 17, borderRadius: '50%', background: c,
                      border: '2px solid var(--surface-card)', marginLeft: i ? -6 : 0,
                    }} />
                  ))}
                </span>
                {p.reacciones} personas
                <span style={{ marginLeft: 'auto' }}>{p.comentarios} comentarios</span>
              </div>

              <div style={{ display: 'flex', borderTop: '1px solid var(--border-soft)' }}>
                <button
                  onClick={() => reaccionar(p.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '11px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                    color: reaccionado ? 'var(--green)' : 'var(--text-muted)',
                  }}
                >
                  <ThumbsUp size={14} fill={reaccionado ? 'currentColor' : 'none'} /> Reaccionar
                </button>
                <div style={{ width: 1, background: 'var(--border-soft)' }} />
                <button style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)',
                }}>
                  <MessageCircle size={14} /> Comentar
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
