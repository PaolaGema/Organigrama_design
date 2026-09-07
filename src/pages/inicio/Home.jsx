import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import viaSaludando from '../../assets/imagenes/via_saludando.png'
import {
  Target, Award, ClipboardList, Megaphone, CalendarDays, CalendarClock, ChevronLeft, ChevronRight, Mail,
  Heart, Eye, Trophy, UserRound, CheckCircle2, Cake, AlertTriangle, Activity, ShieldAlert,
  BarChart3, Timer, MessageCircle, ClipboardCheck,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts'
import { chartTooltipStyle } from '../../utils/chartTooltip'
import {
  HOY, MESES, DIAS_SEMANA, parseFechaDMY, buildCalendarCells, buildEventosDelMes, CALENDAR_LEGEND, avatarUrl,
} from '../../utils/calendarEvents'
import ColaboradoresEstadoModal from '../../components/inicio/ColaboradoresEstadoModal'
import {
  AREAS, colaboradores, invitaciones, publicaciones, totalPublicaciones,
  reconocimientos, evalTotales, procesosEvaluacion, pdi,
} from './homeData'

/* Este dashboard está pensado para organizaciones con miles de colaboradores y miles de
   procesos. Ninguna lista se renderiza entera: cada card muestra como mucho MAX_LISTA
   filas, ordenadas por urgencia, y declara cuántas quedaron fuera. Nunca se recorta en
   silencio. */
const MAX_LISTA = 5

// Ventana de "recién ingresado": pasada esa marca, la falta de onboarding deja de ser
// una alerta de asignación y pasa a ser un problema de proceso.
const DIAS_INGRESO_RECIENTE = 30
const DIAS_VENTANA_ROTACION = 365
const DIAS_RECONOCIMIENTO_RECIENTE = 30

/* Una evaluación "en riesgo" todavía no venció, pero va camino de vencer sin datos:
   cierra dentro de una semana y la mitad de la gente no ha respondido. Avisar aquí es lo
   único que la salva; una vez vencida, ya solo queda extender el plazo. */
const DIAS_RIESGO_VENCIMIENTO = 7
const PCT_RIESGO_PARTICIPACION = 50

/* ── CONSTANTES DE PRESENTACIÓN ──────────────── */

const ESTADO_COLABORADOR_COLORS = {
  activo: '#00E091',
  licencia: '#8b5cf6',
  suspendido: '#ef4444',
  inactivo: '#94a3b8',
}
const ESTADO_COLABORADOR_LABELS = {
  activo: 'Activos',
  licencia: 'En licencia',
  suspendido: 'Suspendidos',
  inactivo: 'Inactivos',
}
// Solo estos dos estados de onboarding exigen que alguien intervenga hoy.
const ONBOARDING_RIESGO = {
  atrasado: { color: '#ef4444', label: 'Atrasado' },
  'en-riesgo': { color: '#f59e0b', label: 'En riesgo' },
}
// Mismos colores que CALENDAR_LEGEND, para que el mes y el día hablen el mismo idioma visual.
const CELEBRACION_TABS = [
  { key: 'cumpleanios', label: 'Cumpleaños', color: '#ec4899' },
  { key: 'aniversarios', label: 'Aniversarios', color: '#00C27E' },
]

const ESTADO_PROCESO_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'en-curso', label: 'En curso' },
  { key: 'finalizado', label: 'Finalizados' },
  { key: 'programado', label: 'Programados' },
  { key: 'borrador', label: 'Borrador' },
]
const SALUD_INFO = {
  'en-alerta': { color: 'var(--red)', label: 'En alerta', prioridad: 0 },
  'buen-avance': { color: 'var(--green)', label: 'Buen avance', prioridad: 1 },
  'programado': { color: 'var(--purple)', label: 'Programado', prioridad: 2 },
  'completado': { color: 'var(--blue)', label: 'Completado', prioridad: 3 },
}

/* Familias de proceso. Es una taxonomía cerrada: da igual que la empresa tenga 4 procesos
   o 4.000, el eje siempre tiene estas cuatro casillas. Por eso escala donde un desglose
   por área no lo hace. */
const FAMILIAS_PROCESO = ['Desempeño', 'Objetivos', 'Encuesta', 'Test psicométrico']
const familiaDe = tipo => FAMILIAS_PROCESO.find(f => tipo.startsWith(f)) ?? 'Otros'

// Color semántico, no decorativo: por debajo de un cuarto de respuestas el proceso no da
// resultados representativos, y a partir de la mitad ya se sostiene.
const COLOR_PARTICIPACION = pct => (pct < 25 ? '#ef4444' : pct < PCT_RIESGO_PARTICIPACION ? '#f59e0b' : '#00C27E')

// El alcance de una publicación se lee por color antes que por texto.
const COLOR_AUDIENCIA = audiencia => (
  audiencia === 'Toda la empresa' ? 'var(--purple)'
    : audiencia.startsWith('1 ') ? 'var(--green)'
      : 'var(--blue)'
)

const fmt = n => n.toLocaleString('es-ES')

const PILL_TAB = active => ({
  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  background: active ? 'var(--navy)' : 'var(--input-bg)',
  color: active ? '#fff' : 'var(--text-muted)',
})

/* ── SUBCOMPONENTES ──────────────────────────── */

function ZonaHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div className="zone-hd">
      <Icon size={16} style={{ color }} />
      <span className="zone-hd-title">{title}</span>
      {subtitle && <span className="zone-hd-sub">{subtitle}</span>}
      <span className="zone-hd-line" />
    </div>
  )
}

// Chip de cabecera: manda a la pantalla del módulo, que sí sabe paginar miles de filas.
function VerTodos({ total, onClick }) {
  if (total <= MAX_LISTA) return null
  return (
    <a href="#" className="chip-link" onClick={e => { e.preventDefault(); onClick() }}>
      Ver los {fmt(total)} →
    </a>
  )
}

// Para los módulos que todavía no tienen pantalla propia: no se puede navegar, pero al
// menos se dice en voz alta qué quedó fuera. Un recorte silencioso se lee como "esto es todo".
function Truncado({ total }) {
  if (total <= MAX_LISTA) return null
  return (
    <div style={{ paddingTop: 10, marginTop: 2, borderTop: '1px solid var(--border-soft)', fontSize: 10.5, color: 'var(--text-muted)' }}>
      Mostrando {MAX_LISTA} de {fmt(total)} · el resto vive en su módulo
    </div>
  )
}

// Vencidas y en riesgo cuentan la misma historia — cuánta gente respondió y cuánto queda —
// y solo cambian de color y de plazo.
function FilaEvaluacion({ proceso, color, plazo, ultima }) {
  return (
    <div style={{ padding: '11px 0', borderBottom: ultima ? 'none' : '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-heading)' }}>{proceso.nombre}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            {fmt(proceso.completadas)}/{fmt(proceso.total)} respuestas · {proceso.pct}%
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{plazo}</span>
      </div>
      <div className="pr-bar"><div className="pr-fill" style={{ width: `${proceso.pct}%`, background: color }} /></div>
    </div>
  )
}

function EstadoVacio({ mensaje }) {
  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <CheckCircle2 size={24} style={{ color: 'var(--green)', margin: '0 auto 8px' }} />
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{mensaje}</div>
    </div>
  )
}

// La urgencia se lee del color antes que del texto: rojo exige acción esta semana.
function urgenciaVencimiento(dias) {
  if (dias < 0) return { color: 'var(--red)', label: `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}` }
  if (dias === 0) return { color: 'var(--red)', label: 'Vence hoy' }
  if (dias <= 7) return { color: 'var(--red)', label: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}` }
  if (dias <= 30) return { color: 'var(--yellow)', label: `Vence en ${dias} días` }
  return { color: 'var(--text-muted)', label: `Vence en ${dias} días` }
}

/* ── COMPONENT ───────────────────────────────── */

export default function Home() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const { asignaciones: ctxAsignaciones } = useOnboardingData()
  const [areaFiltro, setAreaFiltro] = useState('todas')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [celebracionTab, setCelebracionTab] = useState('cumpleanios')
  const [estadoModal, setEstadoModal] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  const firstName = currentUser.name.split(' ')[0]
  const hoy = HOY
  const activeDay = selectedDay ?? hoy.getDate()
  const mesActual = hoy.getMonth() + 1
  const mesCorto = MESES[hoy.getMonth()].slice(0, 3)

  // Días que faltan para `fecha`; negativo si ya pasó.
  const diasHasta = fecha => {
    const { d, m, y } = parseFechaDMY(fecha)
    return Math.round((new Date(y, m - 1, d) - hoy) / 86400000)
  }
  // Quien causó baja ya no celebra, ni necesita onboarding, ni cuenta como plantilla.
  const enPlantilla = colaboradores.filter(c => !c.fechaBaja)
  const plantillaVigente = enPlantilla.length

  /* ── ACCIONES DE HOY ───────────────────────── */

  const normalizar = n => n.trim().toLowerCase()
  const nombresConOnboarding = new Set(ctxAsignaciones.map(a => normalizar(a.nombre)))
  const sinOnboarding = enPlantilla
    .map(c => ({ ...c, dias: -diasHasta(c.fechaIngreso) }))
    .filter(c => c.dias >= 0 && c.dias <= DIAS_INGRESO_RECIENTE && !nombresConOnboarding.has(normalizar(c.nombre)))
    .sort((a, b) => b.dias - a.dias) // el que lleva más tiempo esperando, primero

  const onboardingEnRiesgo = ctxAsignaciones
    .filter(a => ONBOARDING_RIESGO[a.status])
    .sort((a, b) => a.pct - b.pct)

  const enCursoConPlazo = procesosEvaluacion
    .filter(p => p.estado === 'en-curso')
    .map(p => ({ ...p, dias: diasHasta(p.fin), pct: p.total > 0 ? Math.round((p.completadas / p.total) * 100) : 0 }))

  const evaluacionesVencidas = enCursoConPlazo
    .filter(p => p.dias < 0)
    .sort((a, b) => a.dias - b.dias) // la más atrasada primero

  const evaluacionesEnRiesgo = enCursoConPlazo
    .filter(p => p.dias >= 0 && p.dias <= DIAS_RIESGO_VENCIMIENTO && p.pct < PCT_RIESGO_PARTICIPACION)
    .sort((a, b) => a.dias - b.dias) // la que cierra antes, primero

  const totalAcciones = sinOnboarding.length + onboardingEnRiesgo.length + evaluacionesVencidas.length + evaluacionesEnRiesgo.length

  /* ── SALUD DE LA ORGANIZACIÓN ──────────────── */

  const onboardingsEnCurso = ctxAsignaciones.filter(a => a.status === 'en-curso').length
  const activosCount = colaboradores.filter(c => c.estado === 'activo').length

  const colaboradoresFiltrados = areaFiltro === 'todas' ? colaboradores : colaboradores.filter(c => c.area === areaFiltro)
  const estadoData = ['activo', 'licencia', 'suspendido', 'inactivo']
    .map(estado => ({
      estado,
      label: ESTADO_COLABORADOR_LABELS[estado],
      value: colaboradoresFiltrados.filter(c => c.estado === estado).length,
      color: ESTADO_COLABORADOR_COLORS[estado],
    }))
    .filter(d => d.value > 0)
  const totalColabFiltrados = colaboradoresFiltrados.length

  const bajasRecientes = colaboradores.filter(c => c.fechaBaja && -diasHasta(c.fechaBaja) <= DIAS_VENTANA_ROTACION)
  const rotacionPct = Math.round((bajasRecientes.length / (plantillaVigente + bajasRecientes.length)) * 100)

  const procesosActivos = procesosEvaluacion.filter(p => p.estado === 'en-curso')
  const respuestasRecibidas = procesosActivos.reduce((s, p) => s + p.completadas, 0)
  const respuestasEsperadas = procesosActivos.reduce((s, p) => s + p.total, 0)
  const participacionPct = respuestasEsperadas > 0 ? Math.round((respuestasRecibidas / respuestasEsperadas) * 100) : 0

  // Cuánta gente responde cada tipo de proceso. Un 60% en tests y un 11% en objetivos
  // significan cosas muy distintas, y el promedio global las esconde.
  const participacionPorTipo = FAMILIAS_PROCESO
    .map(familia => {
      const procesos = procesosActivos.filter(p => familiaDe(p.tipo) === familia)
      const recibidas = procesos.reduce((s, p) => s + p.completadas, 0)
      const esperadas = procesos.reduce((s, p) => s + p.total, 0)
      return {
        tipo: familia,
        procesos: procesos.length,
        recibidas,
        esperadas,
        pct: esperadas > 0 ? Math.round((recibidas / esperadas) * 100) : 0,
      }
    })
    .filter(d => d.procesos > 0)

  const totalProcesos = Object.values(evalTotales).reduce((s, v) => s + v, 0)
  // Lo que está en alerta primero, y dentro de cada grupo lo que vence antes.
  const procesosFiltrados = (estadoFiltro === 'todos' ? procesosEvaluacion : procesosEvaluacion.filter(p => p.estado === estadoFiltro))
    .slice()
    .sort((a, b) => (SALUD_INFO[a.salud].prioridad - SALUD_INFO[b.salud].prioridad) || (diasHasta(a.fin) - diasHasta(b.fin)))

  const kpis = [
    { title: 'Colaboradores activos', value: fmt(activosCount), label: `De ${fmt(plantillaVigente)} en la plantilla`, accent: 'var(--blue)' },
    { title: 'Onboardings en curso', value: fmt(onboardingsEnCurso), label: 'Nuevos ingresos activos', accent: 'var(--green)' },
    { title: 'Procesos en curso', value: fmt(evalTotales['en-curso']), label: 'Evaluaciones, test psicométricos y encuestas', accent: 'var(--yellow)' },
    { title: 'Rotación (12 meses)', value: `${rotacionPct}%`, label: `${fmt(bajasRecientes.length)} bajas en el último año`, accent: 'var(--red)' },
  ]

  /* ── VIDA DE LA EMPRESA ────────────────────── */

  const cumpleaniosDelMes = enPlantilla
    .map(c => ({ ...c, dia: parseFechaDMY(c.fechaNacimiento).d, mes: parseFechaDMY(c.fechaNacimiento).m }))
    .filter(c => c.mes === mesActual)
    .sort((a, b) => a.dia - b.dia)

  const aniversariosDelMes = enPlantilla
    .map(c => {
      const { d, m, y } = parseFechaDMY(c.fechaIngreso)
      return { ...c, dia: d, mes: m, anios: hoy.getFullYear() - y }
    })
    .filter(c => c.mes === mesActual && c.anios >= 1)
    .sort((a, b) => a.dia - b.dia)

  const celebraciones = celebracionTab === 'cumpleanios' ? cumpleaniosDelMes : aniversariosDelMes
  const celebracionColor = CELEBRACION_TABS.find(t => t.key === celebracionTab).color

  const reconocimientosRecientes = reconocimientos.filter(r => -diasHasta(r.fecha) <= DIAS_RECONOCIMIENTO_RECIENTE)

  /* ── CALENDARIO ────────────────────────────── */

  const calendarCells = buildCalendarCells(hoy.getFullYear(), hoy.getMonth())
  const eventosPorDia = buildEventosDelMes(hoy.getFullYear(), hoy.getMonth())
  const eventosDelDia = eventosPorDia[activeDay] || []

  return (
    <div className="content-scroll">

      {/* El calendario vive en el rail derecho desde la primera pantalla: es lo que
          más se consulta y no debe quedar por debajo del pliegue. */}
      <div className="two-col" style={{ alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="welcome-banner">
            <div className="welcome-left">
              <img src={viaSaludando} alt="" className="welcome-mascot" />
              <div className="welcome-content">
                <div className="welcome-title">Hola, {firstName}</div>
                <div className="welcome-sub">
                  {totalAcciones > 0
                    ? `Tienes ${fmt(totalAcciones)} ${totalAcciones === 1 ? 'asunto' : 'asuntos'} que requieren tu atención hoy.`
                    : 'No hay asuntos pendientes hoy. Todo al día.'}
                </div>
              </div>
            </div>
          </div>

          <ZonaHeader icon={Activity} color="var(--green)" title="Salud de la organización" />

          <div className="kpi-strip">
            {kpis.map(k => (
              <div key={k.title} className="kpi-card" style={{ '--kpi-accent': k.accent }}>
                <div className="kpi-title">{k.title}</div>
                <div className="kpi-val">{k.value}</div>
                <div className="kpi-lbl">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="analytics-row">

            <div className="sec-card">
              <div className="sc-hd">
                <h3>Colaboradores</h3>
                <select
                  className="pl-input"
                  value={areaFiltro}
                  onChange={e => setAreaFiltro(e.target.value)}
                  style={{ width: 'auto', padding: '6px 30px 6px 10px', fontSize: 11, borderRadius: 8 }}
                >
                  <option value="todas">Todas las áreas</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="sc-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div className="donut-wrap" style={{ width: 150, height: 150, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoData} dataKey="value" nameKey="label"
                        innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}
                        cursor="pointer"
                        onClick={d => setEstadoModal(d.estado)}
                      >
                        {estadoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip {...chartTooltipStyle} formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <div className="donut-center-val">{fmt(totalColabFiltrados)}</div>
                    <div className="donut-center-lbl">total</div>
                  </div>
                </div>
                <div className="donut-legend" style={{ flex: 1 }}>
                  {estadoData.length > 0 ? estadoData.map(d => (
                    <button
                      key={d.estado}
                      className="donut-legend-item donut-legend-item--clickable"
                      onClick={() => setEstadoModal(d.estado)}
                      title={`Ver ${d.label.toLowerCase()}`}
                    >
                      <span className="donut-legend-dot" style={{ background: d.color }} />
                      <span className="donut-legend-label">{d.label}</span>
                      <span className="donut-legend-val">{fmt(d.value)}</span>
                    </button>
                  )) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin colaboradores en esta área</div>
                  )}
                </div>
              </div>
            </div>

            <div className="sec-card">
              <div className="sc-hd">
                <ClipboardCheck size={15} style={{ color: 'var(--blue)' }} />
                <h3>Participación por tipo de proceso</h3>
              </div>
              <div className="sc-body">
                {participacionPorTipo.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={152}>
                      <BarChart data={participacionPorTipo} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="tipo" width={112} tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          {...chartTooltipStyle}
                          cursor={{ fill: 'var(--input-bg)' }}
                          formatter={(v, n, item) => [`${v}% · ${fmt(item.payload.recibidas)} de ${fmt(item.payload.esperadas)}`, 'Respondido']}
                        />
                        <Bar dataKey="pct" name="Participación" radius={[0, 6, 6, 0]} barSize={16}>
                          {participacionPorTipo.map(d => <Cell key={d.tipo} fill={COLOR_PARTICIPACION(d.pct)} />)}
                          <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fontSize: 10.5, fontWeight: 700, fill: 'var(--text-muted)' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)', fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-heading)', fontWeight: 700 }}>{participacionPct}% global</strong>
                      {' '}· {fmt(respuestasRecibidas)} de {fmt(respuestasEsperadas)} respuestas en {fmt(procesosActivos.length)} procesos en curso.
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    Sin procesos en curso
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ══ REQUIEREN TU ACCIÓN HOY ═══════════════════════ */}

          <ZonaHeader
            icon={AlertTriangle}
            color="var(--red)"
            title="Requieren tu acción hoy"
            subtitle={totalAcciones > 0 ? `${fmt(totalAcciones)} pendientes` : null}
          />

          <div className="alert-row">

        <div className="sec-card">
          <div className="sc-hd">
            <UserRound size={15} style={{ color: 'var(--red)' }} />
            <h3>Ingresos sin onboarding <span className="sc-hd-count">{fmt(sinOnboarding.length)}</span></h3>
            {sinOnboarding.length > MAX_LISTA
              ? <VerTodos total={sinOnboarding.length} onClick={() => navigate('/personas/colaboradores')} />
              : sinOnboarding.length > 0 && (
                <a href="#" className="chip-link" onClick={e => { e.preventDefault(); navigate('/personas/colaboradores') }}>
                  Asignar →
                </a>
              )}
          </div>
          <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
            {sinOnboarding.length > 0 ? sinOnboarding.slice(0, MAX_LISTA).map(c => (
              <div key={c.id} className="alert-item">
                <div className="ai-av"><img src={avatarUrl(c.nombre)} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} /></div>
                <div className="ai-info">
                  <div className="ai-name">{c.nombre}</div>
                  <div className="ai-sub">
                    {c.cargo} · Ingresó {c.dias === 0 ? 'hoy' : c.dias === 1 ? 'ayer' : `hace ${c.dias} días`}
                  </div>
                </div>
                <span className="badge" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>Sin ruta</span>
              </div>
            )) : (
              <EstadoVacio mensaje="Todos los ingresos recientes tienen onboarding asignado" />
            )}
          </div>
        </div>

        <div className="sec-card">
          <div className="sc-hd">
            <ShieldAlert size={15} style={{ color: '#f59e0b' }} />
            <h3>Onboarding en riesgo <span className="sc-hd-count">{fmt(onboardingEnRiesgo.length)}</span></h3>
            {onboardingEnRiesgo.length > MAX_LISTA
              ? <VerTodos total={onboardingEnRiesgo.length} onClick={() => navigate('/onboarding/asignaciones')} />
              : onboardingEnRiesgo.length > 0 && (
                <a href="#" className="chip-link" onClick={e => { e.preventDefault(); navigate('/onboarding/asignaciones') }}>
                  Revisar →
                </a>
              )}
          </div>
          <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
            {onboardingEnRiesgo.length > 0 ? onboardingEnRiesgo.slice(0, MAX_LISTA).map(a => {
              const info = ONBOARDING_RIESGO[a.status]
              return (
                <div key={a.id} className="alert-item">
                  <div className="ai-av"><img src={avatarUrl(a.nombre)} alt={a.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} /></div>
                  <div className="ai-info">
                    <div className="ai-name">{a.nombre}</div>
                    <div className="ai-sub">{a.ruta} · Día {a.dia} de {a.totalDias} · {a.pct}% completado</div>
                  </div>
                  <span className="badge" style={{ background: `${info.color}18`, color: info.color }}>{info.label}</span>
                </div>
              )
            }) : (
              <EstadoVacio mensaje="Ningún onboarding atrasado ni en riesgo" />
            )}
          </div>
        </div>

        <div className="sec-card">
          <div className="sc-hd">
            <CalendarClock size={15} style={{ color: 'var(--red)' }} />
            <h3>Evaluaciones vencidas <span className="sc-hd-count">{fmt(evaluacionesVencidas.length)}</span></h3>
          </div>
          <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
            {evaluacionesVencidas.length > 0 ? evaluacionesVencidas.slice(0, MAX_LISTA).map((p, i, visibles) => (
              <FilaEvaluacion
                key={p.id}
                proceso={p}
                color="var(--red)"
                plazo={`Venció hace ${-p.dias} ${p.dias === -1 ? 'día' : 'días'}`}
                ultima={i === visibles.length - 1}
              />
            )) : (
              <EstadoVacio mensaje="Ninguna evaluación pasada de fecha" />
            )}
            <Truncado total={evaluacionesVencidas.length} />
          </div>
        </div>

        <div className="sec-card">
          <div className="sc-hd">
            <Timer size={15} style={{ color: 'var(--yellow)' }} />
            <h3>Evaluaciones en riesgo <span className="sc-hd-count">{fmt(evaluacionesEnRiesgo.length)}</span></h3>
          </div>
          <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
            {evaluacionesEnRiesgo.length > 0 ? evaluacionesEnRiesgo.slice(0, MAX_LISTA).map((p, i, visibles) => (
              <FilaEvaluacion
                key={p.id}
                proceso={p}
                color="var(--yellow)"
                plazo={p.dias === 0 ? 'Cierra hoy' : `Cierra en ${p.dias} ${p.dias === 1 ? 'día' : 'días'}`}
                ultima={i === visibles.length - 1}
              />
            )) : (
              <EstadoVacio mensaje="Ninguna evaluación cierra esta semana con baja participación" />
            )}
            <Truncado total={evaluacionesEnRiesgo.length} />
          </div>
        </div>

          </div>

          <ZonaHeader icon={BarChart3} color="var(--blue)" title="Tendencias y procesos" />

          {/* PROCESOS DE EVALUACIÓN — solo los que más atención necesitan */}
          <div className="sec-card">
            <div className="sc-hd">
              <Target size={15} style={{ color: 'var(--blue)' }} />
              <h3>Procesos de evaluación <span className="sc-hd-count">{fmt(totalProcesos)}</span></h3>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '10px 22px 0', flexWrap: 'wrap' }}>
              {ESTADO_PROCESO_TABS.map(tab => {
                const count = tab.key === 'todos' ? totalProcesos : evalTotales[tab.key]
                return (
                  <button key={tab.key} onClick={() => setEstadoFiltro(tab.key)} style={PILL_TAB(estadoFiltro === tab.key)}>
                    {tab.label} <span style={{ opacity: .7 }}>{fmt(count)}</span>
                  </button>
                )
              })}
            </div>
            <div className="sc-body" style={{ padding: '10px 22px 18px' }}>
              {procesosFiltrados.length > 0 ? procesosFiltrados.slice(0, MAX_LISTA).map((p, i, visibles) => {
                const pct = p.total > 0 ? Math.round((p.completadas / p.total) * 100) : 0
                const salud = SALUD_INFO[p.salud]
                const plazo = p.estado === 'programado'
                  ? { color: 'var(--purple)', label: `Inicia en ${diasHasta(p.inicio)} días` }
                  : p.estado === 'en-curso' ? urgenciaVencimiento(diasHasta(p.fin)) : null
                return (
                  <div key={p.id} style={{ padding: '10px 0', borderBottom: i < visibles.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-heading)' }}>{p.nombre}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{p.tipo}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: salud.color, whiteSpace: 'nowrap' }}>{salud.label}</div>
                        {plazo && <div style={{ fontSize: 9.5, color: plazo.color, whiteSpace: 'nowrap', marginTop: 1 }}>{plazo.label}</div>}
                      </div>
                    </div>
                    <div className="pr-bar"><div className="pr-fill" style={{ width: `${pct}%`, background: salud.color }} /></div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{fmt(p.completadas)}/{fmt(p.total)} completadas ({pct}%)</div>
                  </div>
                )
              }) : (
                <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  Sin procesos en este estado
                </div>
              )}
              <Truncado total={procesosFiltrados.length} />
            </div>
          </div>

        </div>

        {/* ── RAIL DERECHO · AGENDA Y VIDA DE LA EMPRESA ── */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="sec-card">
            <div className="sc-hd">
              <CalendarDays size={15} style={{ color: 'var(--blue)' }} />
              <h3>{MESES[hoy.getMonth()]} {hoy.getFullYear()}</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => navigate('/calendario?mes=-1')} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-soft)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <ChevronLeft size={13} />
                </button>
                <button onClick={() => navigate('/calendario?mes=1')} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-soft)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <div className="sc-body" style={{ padding: '14px 18px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {DIAS_SEMANA.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '0 0 8px' }}>{d}</div>
                ))}
                {calendarCells.map((cell, i) => {
                  const isToday = cell.inMonth && cell.day === hoy.getDate()
                  const isSelected = cell.inMonth && cell.day === activeDay
                  const eventos = cell.inMonth ? eventosPorDia[cell.day] : null
                  return (
                    <button
                      key={i}
                      onClick={() => cell.inMonth && setSelectedDay(cell.day)}
                      disabled={!cell.inMonth}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 0',
                        background: 'none', border: 'none', fontFamily: 'inherit', cursor: cell.inMonth ? 'pointer' : 'default',
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: isSelected || isToday ? 700 : 500,
                        background: isSelected ? 'var(--navy)' : 'transparent',
                        border: !isSelected && isToday ? '1.5px solid var(--navy)' : 'none',
                        color: !cell.inMonth ? 'var(--border-dark)' : isSelected ? '#fff' : isToday ? 'var(--navy)' : 'var(--text-heading)',
                      }}>{cell.day}</span>
                      <span style={{ display: 'flex', gap: 2, height: 4 }}>
                        {eventos && eventos.slice(0, 3).map((e, j) => (
                          <span key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: e.color }} />
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
                {CALENDAR_LEGEND.map(l => (
                  <span key={l.label} style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'inline-block' }} /> {l.label}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', flex: 1 }}>
                    {activeDay} de {MESES[hoy.getMonth()]}{activeDay === hoy.getDate() ? ' · Hoy' : ''}
                    {eventosDelDia.length > 0 && <span className="sc-hd-count">{eventosDelDia.length}</span>}
                  </div>
                  {eventosDelDia.length > MAX_LISTA && (
                    <a
                      href="#"
                      className="chip-link"
                      onClick={e => { e.preventDefault(); navigate(`/calendario?dia=${activeDay}`) }}
                    >
                      Ver todo →
                    </a>
                  )}
                </div>
                {eventosDelDia.length > 0 ? eventosDelDia.slice(0, MAX_LISTA).map((e, i) => (
                  <div key={i} className="upcoming-item">
                    <div className="ui-date">
                      <div className="ui-day">{String(activeDay).padStart(2, '0')}</div>
                      <div className="ui-month">{mesCorto.toUpperCase()}</div>
                    </div>
                    <div className="ui-info">
                      <div className="ui-name">{e.titulo}</div>
                      <div className="ui-sub">{e.subtitulo}</div>
                      <div className="ui-sub">{e.tipo}</div>
                    </div>
                    {e.kind === 'persona' ? (
                      <div className="ui-av"><img src={avatarUrl(e.titulo)} alt={e.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={ev => { ev.currentTarget.style.display = 'none' }} /></div>
                    ) : (
                      <div className="ui-av" style={{ background: `${e.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <e.Icon size={14} style={{ color: e.color }} />
                      </div>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '10px 0', fontSize: 11.5, color: 'var(--text-muted)' }}>Sin actividades este día</div>
                )}
              </div>
            </div>
          </div>

          {/* CELEBRACIONES DEL MES */}
          <div className="sec-card">
            <div className="sc-hd">
              <Cake size={15} style={{ color: '#ec4899' }} />
              <h3>Celebraciones <span className="sc-hd-count">{fmt(celebraciones.length)}</span></h3>
              <VerTodos total={celebraciones.length} onClick={() => navigate('/inicio/calendario')} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '10px 22px 0' }}>
              {CELEBRACION_TABS.map(tab => {
                const count = tab.key === 'cumpleanios' ? cumpleaniosDelMes.length : aniversariosDelMes.length
                return (
                  <button key={tab.key} onClick={() => setCelebracionTab(tab.key)} style={PILL_TAB(celebracionTab === tab.key)}>
                    {tab.label} <span style={{ opacity: .7 }}>{fmt(count)}</span>
                  </button>
                )
              })}
            </div>
            <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
              {celebraciones.length > 0 ? celebraciones.slice(0, MAX_LISTA).map(c => {
                const esHoy = c.dia === hoy.getDate()
                return (
                  <div key={c.id} className="alert-item">
                    <div className="ai-av"><img src={avatarUrl(c.nombre)} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} /></div>
                    <div className="ai-info">
                      <div className="ai-name">{c.nombre}</div>
                      <div className="ai-sub">
                        {c.cargo}
                        {celebracionTab === 'aniversarios' && ` · ${c.anios} ${c.anios === 1 ? 'año' : 'años'}`}
                      </div>
                    </div>
                    <span className="badge" style={{ background: `${celebracionColor}18`, color: celebracionColor }}>
                      {esHoy ? 'Hoy' : `${c.dia} ${mesCorto}`}
                    </span>
                  </div>
                )
              }) : (
                <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  Sin {celebracionTab === 'cumpleanios' ? 'cumpleaños' : 'aniversarios'} este mes
                </div>
              )}
            </div>
          </div>

          {/* INVITACIONES */}
          <div className="sec-card">
            <div className="sc-hd">
              <Mail size={15} style={{ color: 'var(--blue)' }} />
              <h3>Invitaciones de colaboradores</h3>
            </div>
            <div className="sc-body" style={{ display: 'flex', gap: 8, padding: '14px 22px' }}>
              {[
                { label: 'Pendientes', value: invitaciones.pendientes, color: 'var(--yellow)' },
                { label: 'Aceptadas', value: invitaciones.aceptadas, color: 'var(--green)' },
                { label: 'Expiradas', value: invitaciones.expiradas, color: 'var(--text-muted)' },
                { label: 'Canceladas', value: invitaciones.canceladas, color: 'var(--red)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{fmt(s.value)}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ÚLTIMOS RECONOCIMIENTOS */}
          <div className="sec-card">
            <div className="sc-hd">
              <Trophy size={15} style={{ color: '#f59e0b' }} />
              <h3>Últimos reconocimientos <span className="sc-hd-count">{fmt(reconocimientosRecientes.length)}</span></h3>
            </div>
            <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
              {reconocimientosRecientes.length > 0 ? reconocimientosRecientes.slice(0, MAX_LISTA).map(r => (
                <div key={r.id} className="alert-item">
                  <div className="ai-av"><img src={avatarUrl(r.persona)} alt={r.persona} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} /></div>
                  <div className="ai-info">
                    <div className="ai-name">{r.persona}</div>
                    <div className="ai-sub">{r.tipo}: {r.motivo}</div>
                  </div>
                  <Award size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                </div>
              )) : (
                <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  Sin reconocimientos en los últimos {DIAS_RECONOCIMIENTO_RECIENTE} días
                </div>
              )}
              <Truncado total={reconocimientosRecientes.length} />
            </div>
          </div>

          {/* PUBLICACIONES RECIENTES — sin cuadro de icono: en 340px el ancho es para el título. */}
          <div className="sec-card">
            <div className="sc-hd">
              <Megaphone size={15} style={{ color: 'var(--purple)' }} />
              <h3>Publicaciones recientes <span className="sc-hd-count">{fmt(totalPublicaciones)}</span></h3>
            </div>
            <div className="sc-body" style={{ padding: '8px 22px 18px' }}>
              {publicaciones.slice(0, MAX_LISTA).map(p => {
                const color = COLOR_AUDIENCIA(p.audiencia)
                const tinte = `color-mix(in srgb, ${color} 12%, transparent)`
                return (
                  <div key={p.id} className="pub-item">
                    <div className="pub-titulo">{p.titulo}</div>
                    <div className="pub-meta">
                      <span className="badge pub-audiencia" style={{ background: tinte, color }}>{p.audiencia}</span>
                      <span className="pub-fecha">{p.fecha.split(' ')[0]}</span>
                    </div>
                    <div className="pub-stats">
                      {[
                        { Icon: Eye, valor: p.vistas, etiqueta: 'vistas' },
                        { Icon: Heart, valor: p.likes, etiqueta: 'me gusta' },
                        { Icon: MessageCircle, valor: p.comentarios, etiqueta: 'comentarios' },
                      ].map(({ Icon, valor, etiqueta }) => (
                        <span key={etiqueta} className="pub-stat" title={`${fmt(valor)} ${etiqueta}`}>
                          <Icon size={11} aria-hidden="true" /> {fmt(valor)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
              <Truncado total={totalPublicaciones} />
            </div>
          </div>

          <div className="hito-card">
            <div className="hito-ico">
              <ClipboardList size={20} color="#fff" />
            </div>
            <div className="hito-text">
              <strong>{fmt(pdi.activos)} de {fmt(pdi.total)}</strong> colaboradores tienen un Plan de Desarrollo Individual activo, con un avance promedio del <strong>{pdi.avancePromedioPct}%</strong>.
            </div>
            <button className="hito-btn">
              <Target size={14} />
              Ver PDIs activos
            </button>
          </div>

        </div>
      </div>

      <div style={{ height: '8px' }} />

      {estadoModal && (
        <ColaboradoresEstadoModal
          estado={estadoModal}
          label={ESTADO_COLABORADOR_LABELS[estadoModal]}
          color={ESTADO_COLABORADOR_COLORS[estadoModal]}
          area={areaFiltro}
          colaboradores={colaboradoresFiltrados.filter(c => c.estado === estadoModal)}
          onClose={() => setEstadoModal(null)}
        />
      )}

    </div>
  )
}
