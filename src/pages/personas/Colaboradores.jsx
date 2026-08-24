import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, MoreHorizontal, Calendar, ChevronLeft, ChevronRight, ChevronDown, Check, Eye, Pencil, Rocket, Repeat, Shield, X, CheckCircle2, RefreshCw, Palmtree, Stethoscope, Ban, UserMinus, UserPlus, Users, Unlink, Send, Route, Filter, Info, AlertTriangle } from 'lucide-react'
import { useRutaActiva } from '../../context/RutaActivaContext'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { rutasData } from '../onboarding/JourneyBuilder'
import { getGlobalEtapas } from '../../utils/globalEtapas'
import { avatarUrl } from '../../utils/calendarEvents'
import AsignarBuddyModal from '../../components/onboarding/AsignarBuddyModal'
import ConfirmarAccionModal from '../../components/layout/ConfirmarAccionModal'
import { departamentos, colaboradoresData, ESTADOS_ONBOARDING, CON_RUTA_ACTIVA } from './colaboradoresData'
import { cargoDe } from '../../data/organigramaData'

/* Foto real del colaborador; si no carga, caen las iniciales sobre su color de siempre. */
function Avatar({ name, initials, color, size = 34 }) {
  const [sinFoto, setSinFoto] = useState(false)
  return (
    <div
      className="as-avatar"
      style={{
        background: color, width: size, height: size, overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: Math.round(size * 0.32), fontWeight: 700, letterSpacing: '.02em',
      }}
    >
      {sinFoto ? initials : (
        <img
          src={avatarUrl(name)}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setSinFoto(true)}
        />
      )}
    </div>
  )
}

const permisosPorRol = {
  'Colaborador': [
    { modulo: 'Mi espacio', permisos: ['Ver mi onboarding', 'Completar tareas'] },
    { modulo: 'Perfil', permisos: ['Ver perfil propio', 'Editar datos personales'] },
  ],
  'Líder de área': [
    { modulo: 'Mi espacio', permisos: ['Ver mi onboarding', 'Completar tareas'] },
    { modulo: 'Perfil', permisos: ['Ver perfil propio', 'Editar datos personales'] },
    { modulo: 'Onboarding', permisos: ['Ver panel', 'Ver asignaciones de su área', 'Validar tareas de su equipo'] },
    { modulo: 'Gestión de personas', permisos: ['Ver colaboradores de su área'] },
  ],
  'Supervisor': [
    { modulo: 'Mi espacio', permisos: ['Ver mi onboarding', 'Completar tareas'] },
    { modulo: 'Perfil', permisos: ['Ver perfil propio', 'Editar datos personales'] },
    { modulo: 'Onboarding', permisos: ['Ver panel', 'Ver asignaciones', 'Validar tareas'] },
    { modulo: 'Gestión de personas', permisos: ['Ver colaboradores de su área', 'Editar colaboradores de su área'] },
  ],
  'Sub-admin RRHH': [
    { modulo: 'Mi espacio', permisos: ['Ver mi onboarding', 'Completar tareas'] },
    { modulo: 'Perfil', permisos: ['Ver perfil propio', 'Editar datos personales'] },
    { modulo: 'Onboarding', permisos: ['Ver panel', 'Ver asignaciones', 'Asignar rutas', 'Crear rutas', 'Gestionar biblioteca de recursos'] },
    { modulo: 'Gestión de personas', permisos: ['Ver todos los colaboradores', 'Crear colaboradores', 'Editar colaboradores'] },
  ],
  'Gerente': [
    { modulo: 'Mi espacio', permisos: ['Ver mi onboarding', 'Completar tareas'] },
    { modulo: 'Perfil', permisos: ['Ver perfil propio', 'Editar datos personales'] },
    { modulo: 'Onboarding', permisos: ['Ver panel', 'Ver asignaciones', 'Asignar rutas'] },
    { modulo: 'Gestión de personas', permisos: ['Ver todos los colaboradores'] },
    { modulo: 'Reportes', permisos: ['Ver reportes de su área', 'Exportar reportes'] },
  ],
}

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function MiniCalendar({ value, onChange }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startDay = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  function isDisabled(day) {
    const date = new Date(viewYear, viewMonth, day)
    return date < today
  }

  function isSelected(day) {
    if (!value || !day) return false
    const sel = new Date(value + 'T00:00:00')
    return sel.getFullYear() === viewYear && sel.getMonth() === viewMonth && sel.getDate() === day
  }

  function isToday(day) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
  }

  function select(day) {
    if (isDisabled(day)) return
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
  }

  const canPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth())

  const selectedLabel = value
    ? (() => { const d = new Date(value + 'T00:00:00'); return `${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}` })()
    : null

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
      background: '#fff',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
      }}>
        <button
          onClick={prevMonth}
          disabled={!canPrev}
          style={{
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: canPrev ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: canPrev ? '#475569' : '#e2e8f0',
          }}
        >
          <ChevronLeft size={13} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0C2D40' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#475569',
          }}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      <div style={{ padding: '6px 8px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 9, fontWeight: 700,
              color: '#94a3b8', padding: '3px 0',
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {cells.map((day, i) => (
            <button
              key={i}
              disabled={!day || isDisabled(day)}
              onClick={() => day && select(day)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: 6, border: 'none',
                fontSize: 11, fontWeight: isSelected(day) ? 700 : isToday(day) ? 600 : 400,
                fontFamily: 'inherit',
                background: isSelected(day) ? '#0C2D40' : isToday(day) ? '#f1f5f9' : 'transparent',
                color: !day ? 'transparent'
                  : isSelected(day) ? '#fff'
                  : isDisabled(day) ? '#d1d5db'
                  : isToday(day) ? '#0C2D40'
                  : '#334155',
                cursor: !day || isDisabled(day) ? 'default' : 'pointer',
                transition: 'all .1s',
                position: 'relative',
              }}
            >
              {day || ''}
              {isToday(day) && !isSelected(day) && (
                <div style={{
                  position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: '#00E091',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedLabel && (
        <div style={{
          padding: '6px 10px', borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#f0fdf4',
        }}>
          <Calendar size={11} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#166534' }}>{selectedLabel}</span>
        </div>
      )}
    </div>
  )
}

export default function Colaboradores() {
  const { activarRuta } = useRutaActiva()
  /* El cargo sale del organigrama —ver `cargoDe`— así que esta pantalla necesita tenerlo. */
  const { plantillas, organigrama } = useOnboardingData()
  // Copia local: asignar, desasignar y cambiar de buddy tienen que verse en la tabla.
  const [colaboradores, setColaboradores] = useState(colaboradoresData)
  const [buddyModal, setBuddyModal] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDepto, setFilterDepto] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [page, setPage] = useState(1)
  const [menuOpen, setMenuOpen] = useState(null)
  const [rolModal, setRolModal] = useState(null)
  const [estadoModal, setEstadoModal] = useState(null)
  const [showOnbHelp, setShowOnbHelp] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showDeptoFilter, setShowDeptoFilter] = useState(false)
  const [onbModal, setOnbModal] = useState(null)
  const [onbSelected, setOnbSelected] = useState(null)
  const [onbFecha, setOnbFecha] = useState('')
  const [onbSearch, setOnbSearch] = useState('')
  const [onbArea, setOnbArea] = useState('Todas')
  const [onbFilterOpen, setOnbFilterOpen] = useState(false)
  const perPage = 8

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  const actualizar = (id, cambios) => setColaboradores(prev => prev.map(c => (c.id === id ? { ...c, ...cambios } : c)))

  function asignarRuta(colaborador, ruta) {
    // Recién asignada, la ruta todavía no arrancó: el colaborador debe abrirla.
    actualizar(colaborador.id, { onb: 'sin-iniciar', ruta: ruta.name })
  }

  function desasignarRuta(colaborador) {
    actualizar(colaborador.id, { onb: 'sin-ruta', ruta: null, buddy: null })
  }

  function asignarBuddy(candidato) {
    actualizar(buddyModal.id, { buddy: { name: candidato.name, initials: candidato.initials, color: candidato.color } })
    setBuddyModal(null)
  }

  const filtered = colaboradores.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (cargoDe(c, organigrama) || '').toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchDepto = filterDepto === 'Todos' || c.depto === filterDepto
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    return matchSearch && matchDepto && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const totalActivos = colaboradores.filter(c => c.status === 'activo').length
  const totalInactivos = colaboradores.filter(c => c.status !== 'activo').length

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Colaboradores</h1>
          <p className="pl-subtitle">Directorio de colaboradores de la organización</p>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--blue)' }}>
          <div className="kpi-title" style={{ color: 'var(--blue)' }}>Total</div>
          <div className="kpi-val">{colaboradores.length}</div>
          <div className="kpi-lbl">Colaboradores registrados</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>Activos</div>
          <div className="kpi-val">{totalActivos}</div>
          <div className="kpi-lbl">En la organización</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)' }}>
          <div className="kpi-title" style={{ color: 'var(--yellow)' }}>Ausentes</div>
          <div className="kpi-val">{totalInactivos}</div>
          <div className="kpi-lbl">Vacaciones, licencia u otro</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--purple)' }}>
          <div className="kpi-title" style={{ color: 'var(--purple)' }}>Departamentos</div>
          <div className="kpi-val">{departamentos.length - 1}</div>
          <div className="kpi-lbl">Áreas activas</div>
        </div>
      </div>

      <div className="pl-toolbar">
        <div className="pl-search-wrap">
          <Search size={13} className="pl-search-ico" />
          <input
            type="text"
            className="pl-search"
            placeholder="Buscar por nombre, cargo o email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="pl-dropdown-wrap" style={{ width: 'auto' }}>
          <button
            type="button"
            className={`pl-dropdown-trigger${showStatusFilter ? ' open' : ''}${filterStatus === 'todos' ? ' placeholder' : ''}`}
            style={{ width: 'auto', height: 34, fontSize: 11, padding: '0 10px', justifyContent: 'flex-start', gap: 6 }}
            onClick={() => { setShowStatusFilter(!showStatusFilter); setShowDeptoFilter(false) }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>
              {{ todos: 'Todos los estados', activo: 'Activos', vacaciones: 'Vacaciones', licencia: 'Licencia', suspendido: 'Suspendido', desvinculado: 'Desvinculado' }[filterStatus]}
            </span>
            <ChevronDown size={12} className="pl-dropdown-chevron" style={{ flexShrink: 0 }} />
          </button>
          {showStatusFilter && (
            <div className="pl-dropdown-menu" style={{ minWidth: 180 }}>
              {[
                { key: 'todos', label: 'Todos los estados' },
                { key: 'activo', label: 'Activos' },
                { key: 'vacaciones', label: 'Vacaciones' },
                { key: 'licencia', label: 'Licencia médica' },
                { key: 'suspendido', label: 'Suspendido' },
                { key: 'desvinculado', label: 'Desvinculado' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`pl-dropdown-item${filterStatus === f.key ? ' selected' : ''}`}
                  style={{ fontSize: 11.5, padding: '6px 9px' }}
                  onClick={() => { setFilterStatus(f.key); setPage(1); setShowStatusFilter(false) }}
                >
                  <span>{f.label}</span>
                  {filterStatus === f.key && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pl-dropdown-wrap" style={{ width: 'auto' }}>
          <button
            type="button"
            className={`pl-dropdown-trigger${showDeptoFilter ? ' open' : ''}${filterDepto === 'Todos' ? ' placeholder' : ''}`}
            style={{ width: 'auto', height: 34, fontSize: 11, padding: '0 10px', justifyContent: 'flex-start', gap: 6 }}
            onClick={() => { setShowDeptoFilter(!showDeptoFilter); setShowStatusFilter(false) }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>
              {filterDepto === 'Todos' ? 'Todas las áreas' : filterDepto}
            </span>
            <ChevronDown size={12} className="pl-dropdown-chevron" style={{ flexShrink: 0 }} />
          </button>
          {showDeptoFilter && (
            <div className="pl-dropdown-menu" style={{ minWidth: 180 }}>
              {departamentos.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`pl-dropdown-item${filterDepto === d ? ' selected' : ''}`}
                  style={{ fontSize: 11.5, padding: '6px 9px' }}
                  onClick={() => { setFilterDepto(d); setPage(1); setShowDeptoFilter(false) }}
                >
                  <span>{d === 'Todos' ? 'Todas las áreas' : d}</span>
                  {filterDepto === d && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="pl-btn-new" style={{ padding: '0 14px', height: 34, fontSize: 11.5, marginLeft: 'auto' }}>
          <Plus size={14} color="#00E091" />
          Nuevo colaborador
        </button>
      </div>

      <div className="as-table-wrap" style={{ overflowX: 'auto' }}>
        <table className="as-table" style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Departamento</th>
              <th>Cargo</th>
              <th>Rol</th>
              <th>Registro</th>
              <th style={{ position: 'relative' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Onboarding
                  <Info
                    size={12}
                    style={{ color: '#cbd5e1', cursor: 'pointer' }}
                    onMouseEnter={() => setShowOnbHelp(true)}
                    onMouseLeave={() => setShowOnbHelp(false)}
                  />
                </span>
                {showOnbHelp && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 6,
                    background: '#fff', borderRadius: 12, padding: '14px 16px',
                    boxShadow: '0 12px 40px rgba(0,0,0,.12)', border: '1px solid #e2e8f0',
                    zIndex: 20, width: 260, animation: 'plSlideUp .12s',
                    textTransform: 'none', letterSpacing: 0,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0C2D40', marginBottom: 10, textTransform: 'none', letterSpacing: 0 }}>
                      Estados de onboarding
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(ESTADOS_ONBOARDING).map(([key, s]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                            background: s.bg, color: s.color, whiteSpace: 'nowrap', minWidth: 70, textAlign: 'center',
                          }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3 }}>{s.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </th>
              <th>Buddy</th>
              <th>Ingreso</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="as-person">
                    <Avatar name={c.name} initials={c.initials} color={c.color} />
                    <div>
                      <div className="as-name">{c.name}</div>
                      <div className="as-area">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="as-ruta">{c.depto}</span></td>
                <td><span className="as-ruta">{cargoDe(c, organigrama)}</span></td>
                <td><span className="as-ruta">{c.rol}</span></td>
                <td>
                  <div className="pr-progress">
                    <div className="pr-pct">{c.registro}%</div>
                    <div className="pr-bar">
                      <div className="pr-fill" style={{
                        width: `${c.registro}%`,
                        background: c.registro === 100 ? 'var(--green)' : c.registro >= 50 ? 'var(--blue)' : 'var(--yellow)',
                      }} />
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: ESTADOS_ONBOARDING[c.onb].bg,
                    color: ESTADOS_ONBOARDING[c.onb].color,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                      background: ESTADOS_ONBOARDING[c.onb].dot,
                    }} />
                    {ESTADOS_ONBOARDING[c.onb].label}
                  </span>
                </td>
                <td>
                  {c.buddy ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Avatar name={c.buddy.name} initials={c.buddy.initials} color={c.buddy.color} size={22} />
                      <span style={{ fontSize: 11.5, color: '#334155', whiteSpace: 'nowrap' }}>{c.buddy.name}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>
                  )}
                </td>
                <td><span className="as-fecha">{c.ingreso}</span></td>
                <td>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: { activo: '#f0fdf4', vacaciones: '#fefce8', licencia: '#eff6ff', suspendido: '#fef2f2', desvinculado: '#f8fafc' }[c.status],
                    color: { activo: '#16a34a', vacaciones: '#b45309', licencia: '#2563eb', suspendido: '#dc2626', desvinculado: '#64748b' }[c.status],
                  }}>
                    {{ activo: 'Activo', vacaciones: 'Vacaciones', licencia: 'Licencia', suspendido: 'Suspendido', desvinculado: 'Desvinculado' }[c.status]}
                  </span>
                </td>
                <td style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id) }}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: 'none',
                      background: menuOpen === c.id ? '#f1f5f9' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#94a3b8', fontFamily: 'inherit',
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === c.id && (() => {
                    const idx = paginated.indexOf(c)
                    const openUp = idx >= paginated.length - 2
                    const conRuta = CON_RUTA_ACTIVA.includes(c.onb)
                    const abrirAsignarRuta = tipo => () => {
                      setOnbModal({ ...c, _tipo: tipo }); setOnbSelected(null); setOnbFecha(''); setOnbSearch(''); setOnbArea('Todas')
                    }

                    // El menú refleja en qué punto del ciclo está la persona: no se ofrece
                    // asignar una ruta a quien ya la tiene, ni un buddy a quien no la tiene.
                    const accionesRuta = c.onb === 'graduado'
                      ? [{ icon: Repeat, label: 'Asignar ruta de reboarding', color: '#8b5cf6', action: abrirAsignarRuta('Reboarding') }]
                      : conRuta
                        ? [
                          c.buddy
                            ? { icon: Users, label: 'Cambiar buddy', color: '#475569', action: () => setBuddyModal(c) }
                            : { icon: UserPlus, label: 'Asignar buddy', color: '#0C2D40', action: () => setBuddyModal(c) },
                          ...(c.buddy ? [{ icon: UserMinus, label: 'Desasignar buddy', color: '#dc2626', action: () => setConfirmar({ tipo: 'buddy', colaborador: c }) }] : []),
                          { icon: Unlink, label: 'Desasignar ruta de onboarding', color: '#dc2626', action: () => setConfirmar({ tipo: 'ruta', colaborador: c }) },
                        ]
                        : [{ icon: Rocket, label: 'Asignar ruta de onboarding', color: '#0C2D40', action: abrirAsignarRuta('Onboarding') }]

                    return (
                    <div style={{
                      position: 'absolute', right: 0,
                      ...(openUp ? { bottom: '100%' } : { top: '100%' }),
                      zIndex: 20,
                      background: '#fff', borderRadius: 10, padding: 4,
                      boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #e2e8f0',
                      minWidth: 180, animation: 'plSlideUp .12s',
                    }}>
                      {[
                        { icon: Eye, label: 'Ver perfil', color: '#475569' },
                        { icon: Pencil, label: 'Editar', color: '#475569' },
                        { icon: Shield, label: 'Roles y permisos', color: '#475569', action: () => setRolModal(c) },
                        ...accionesRuta,
                        { icon: Send, label: 'Enviar credenciales', color: '#475569' },
                        { icon: RefreshCw, label: 'Cambiar estado', color: '#475569', action: () => setEstadoModal(c) },
                      ].map(action => (
                        <button
                          key={action.label}
                          onClick={() => { setMenuOpen(null); action.action?.() }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', border: 'none', borderRadius: 7,
                            background: 'transparent', cursor: 'pointer',
                            fontSize: 12, fontWeight: 500, color: action.color,
                            fontFamily: 'inherit', textAlign: 'left',
                            transition: 'background .1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <action.icon size={14} />
                          {action.label}
                        </button>
                      ))}
                    </div>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginated.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>No se encontraron colaboradores</div>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid #f1f5f9',
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length} colaboradores
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', cursor: page === 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: page === 1 ? '#cbd5e1' : '#475569',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: p === page ? 'none' : '1px solid #e2e8f0',
                    background: p === page ? '#0C2D40' : '#fff',
                    color: p === page ? '#fff' : '#475569',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'inherit',
                  }}
                >{p}</button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', cursor: page === totalPages ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: page === totalPages ? '#cbd5e1' : '#475569',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 8 }} />

      {/* MODAL ASIGNAR ONBOARDING */}
      {onbModal && (() => {
        const rutas = plantillas.filter(p => p.status === 'activa' && (p.tipo || 'Onboarding') === onbModal._tipo)
        return (
          <div className="pl-overlay" onClick={() => setOnbModal(null)}>
            <div className="pl-modal jb-modal" style={{ width: 860, maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={onbModal.name} initials={onbModal.initials} color={onbModal.color} size={36} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15 }}>{onbModal._tipo === 'Reboarding' ? 'Asignar ruta de reboarding' : 'Asignar ruta de onboarding'}</h2>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{onbModal.name} · {onbModal.depto}</span>
                  </div>
                </div>
                <button className="pl-modal-close" onClick={() => setOnbModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: 24, padding: '20px 28px', flex: 1, minHeight: 0 }}>

                {/* IZQUIERDA: SELECCIONAR RUTA */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Seleccionar ruta
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <div className="pl-search-wrap" style={{ flex: 1 }}>
                      <Search size={13} className="pl-search-ico" />
                      <input
                        type="text"
                        className="pl-search"
                        placeholder="Buscar ruta..."
                        value={onbSearch}
                        onChange={e => setOnbSearch(e.target.value)}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOnbFilterOpen(!onbFilterOpen)}
                        style={{
                          height: '100%', padding: '0 12px', borderRadius: 8,
                          border: onbArea !== 'Todas' ? '1.5px solid #0C2D40' : '1px solid #e2e8f0',
                          background: onbArea !== 'Todas' ? '#f0f9ff' : '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
                          color: onbArea !== 'Todas' ? '#0C2D40' : '#64748b',
                        }}
                      >
                        <Filter size={13} />
                        {onbArea !== 'Todas' && <span>{onbArea}</span>}
                      </button>
                      {onbFilterOpen && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', marginTop: 4,
                          background: '#fff', borderRadius: 10, padding: 4,
                          boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #e2e8f0',
                          zIndex: 30, minWidth: 180, maxHeight: 220, overflowY: 'auto',
                          animation: 'plSlideUp .12s',
                        }}>
                          {['Todas', ...new Set(rutas.map(r => r.area))].map(a => (
                            <button
                              key={a}
                              onClick={() => { setOnbArea(a); setOnbFilterOpen(false) }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 10px', border: 'none', borderRadius: 7,
                                background: onbArea === a ? '#f8fafc' : 'transparent',
                                cursor: 'pointer', fontSize: 12, fontWeight: onbArea === a ? 700 : 500,
                                color: onbArea === a ? '#0C2D40' : '#475569',
                                fontFamily: 'inherit', textAlign: 'left',
                                transition: 'background .1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => { if (onbArea !== a) e.currentTarget.style.background = 'transparent' }}
                            >
                              {a}
                              {onbArea === a && <CheckCircle2 size={13} style={{ color: '#00E091' }} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {rutas
                      .filter(r => (onbArea === 'Todas' || r.area === onbArea) && r.name.toLowerCase().includes(onbSearch.toLowerCase()))
                      .map(r => (
                      <button
                        key={r.id}
                        onClick={() => setOnbSelected(r.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10, width: '100%',
                          border: onbSelected === r.id ? `2px solid ${r.color}` : '2px solid transparent',
                          background: onbSelected === r.id ? `${r.color}08` : '#fff',
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={e => { if (onbSelected !== r.id) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (onbSelected !== r.id) e.currentTarget.style.background = '#fff' }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${r.color}12`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Route size={14} style={{ color: r.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0C2D40' }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.area} · {r.etapas} etapas · {r.tareas} tareas</div>
                        </div>
                        {onbSelected === r.id && (
                          <CheckCircle2 size={16} style={{ color: r.color, flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                    {rutas.filter(r => (onbArea === 'Todas' || r.area === onbArea) && r.name.toLowerCase().includes(onbSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                        No se encontraron rutas
                      </div>
                    )}
                  </div>
                </div>

                {/* SEPARADOR */}
                <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0, alignSelf: 'stretch' }} />

                {/* DERECHA: FECHA DE INICIO */}
                <div style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Fecha de inicio
                  </div>
                  <MiniCalendar value={onbFecha} onChange={setOnbFecha} />
                </div>
              </div>

              <div className="pl-modal-footer">
                <button className="pl-btn-cancel" onClick={() => setOnbModal(null)}>Cancelar</button>
                <button
                  className="pl-btn-save"
                  disabled={!onbSelected || !onbFecha}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...(!onbSelected || !onbFecha ? { opacity: 0.5, cursor: 'default' } : {}) }}
                  onClick={() => {
                    const ruta = rutas.find(r => r.id === onbSelected)
                    if (ruta) {
                      const src = rutasData[1]
                      const etapas = JSON.parse(JSON.stringify(src.etapas))
                      // La ruta puede haber sacado la general de su alcance: ahí no se antepone.
                      if (ruta.config?.incluirGeneral !== false) {
                        etapas.unshift(...getGlobalEtapas(plantillas, null))
                      }
                      activarRuta(etapas, { nombre: ruta.name, area: ruta.area })
                      asignarRuta(onbModal, ruta)
                    }
                    setOnbModal(null)
                  }}
                >
                  <Rocket size={13} />
                  Asignar ruta
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL CAMBIAR ESTADO */}
      {estadoModal && (() => {
        const estados = [
          { key: 'activo', label: 'Activo', desc: 'Colaborador en funciones normales', icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4' },
          { key: 'vacaciones', label: 'Vacaciones', desc: 'Ausencia programada por descanso', icon: Palmtree, color: '#f59e0b', bg: '#fefce8' },
          { key: 'licencia', label: 'Licencia médica', desc: 'Baja temporal por motivos de salud', icon: Stethoscope, color: '#3b82f6', bg: '#eff6ff' },
          { key: 'suspendido', label: 'Suspendido', desc: 'Suspensión temporal de actividades', icon: Ban, color: '#ef4444', bg: '#fef2f2' },
          { key: 'desvinculado', label: 'Desvinculado', desc: 'Ya no forma parte de la organización', icon: UserMinus, color: '#64748b', bg: '#f8fafc' },
        ]
        return (
          <div className="pl-overlay" onClick={() => setEstadoModal(null)}>
            <div className="pl-modal jb-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={estadoModal.name} initials={estadoModal.initials} color={estadoModal.color} size={36} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15 }}>Cambiar estado</h2>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{estadoModal.name}</span>
                  </div>
                </div>
                <button className="pl-modal-close" onClick={() => setEstadoModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {estados.map(st => {
                  const isActive = estadoModal.status === st.key
                  return (
                    <button
                      key={st.key}
                      onClick={() => setEstadoModal(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 10,
                        border: isActive ? `2px solid ${st.color}` : '2px solid transparent',
                        background: isActive ? st.bg : '#fff',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all .15s', width: '100%',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? st.bg : '#fff' }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: st.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <st.icon size={16} style={{ color: st.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0C2D40' }}>{st.label}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{st.desc}</div>
                      </div>
                      {isActive && (
                        <div style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: st.color, color: '#fff', textTransform: 'uppercase',
                        }}>Actual</div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="pl-modal-footer">
                <button className="pl-btn-cancel" onClick={() => setEstadoModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL ROLES Y PERMISOS */}
      {rolModal && (() => {
        const modulos = permisosPorRol[rolModal.rol] || permisosPorRol['Colaborador']
        return (
          <div className="pl-overlay" onClick={() => setRolModal(null)}>
            <div className="pl-modal jb-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={rolModal.name} initials={rolModal.initials} color={rolModal.color} size={36} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15 }}>{rolModal.name}</h2>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{cargoDe(rolModal, organigrama)} · {rolModal.depto}</span>
                  </div>
                </div>
                <button className="pl-modal-close" onClick={() => setRolModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <Shield size={16} style={{ color: '#0C2D40' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0C2D40' }}>{rolModal.rol}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Rol asignado en la plataforma</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Permisos por módulo
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {modulos.map(m => (
                      <div key={m.modulo} style={{
                        border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden',
                      }}>
                        <div style={{
                          padding: '8px 14px', background: '#f8fafc',
                          fontSize: 12, fontWeight: 700, color: '#0C2D40',
                          borderBottom: '1px solid #f1f5f9',
                        }}>
                          {m.modulo}
                        </div>
                        <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {m.permisos.map(p => (
                            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CheckCircle2 size={12} style={{ color: '#00E091', flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: '#475569' }}>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pl-modal-footer">
                <button className="pl-btn-cancel" onClick={() => setRolModal(null)}>Cerrar</button>
                <button className="pl-btn-save">Editar permisos</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL ASIGNAR / CAMBIAR BUDDY — mismo componente que usa el módulo de Onboarding */}
      {buddyModal && (
        <AsignarBuddyModal
          colaborador={{ ...buddyModal, nombre: buddyModal.name }}
          onClose={() => setBuddyModal(null)}
          onConfirm={asignarBuddy}
        />
      )}

      {/* CONFIRMACIÓN DE DESASIGNACIÓN */}
      {confirmar && (() => {
        const esBuddy = confirmar.tipo === 'buddy'
        const c = confirmar.colaborador
        return (
          <ConfirmarAccionModal
            titulo={esBuddy ? 'Desasignar buddy' : 'Desasignar ruta de onboarding'}
            descripcion={esBuddy
              ? <>¿Quitar a <strong>{c.buddy?.name}</strong> como buddy de <strong>{c.name}</strong>?</>
              : <>Se quitará la ruta de onboarding de <strong>{c.name}</strong> y también su buddy. Volverá al estado <strong>Sin ruta</strong>.</>}
            palabra="desasignar"
            textoConfirmar="Desasignar"
            onConfirmar={() => {
              if (esBuddy) actualizar(c.id, { buddy: null })
              else desasignarRuta(c)
              setConfirmar(null)
            }}
            onCancelar={() => setConfirmar(null)}
            icono={AlertTriangle}
          />
        )
      })()}
    </div>
  )
}
