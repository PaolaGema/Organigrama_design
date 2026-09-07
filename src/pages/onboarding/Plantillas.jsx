import { useState, useEffect, useRef } from 'react'
import { useUser } from '../../context/UserContext'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import {
  Search, Plus, Copy, Pencil, Trash2, X, AlertTriangle,
  LayoutGrid, List, MoreHorizontal, ChevronDown, ChevronUp, Check, UserPlus, Users, Route,
  Lock, ChevronLeft, ChevronRight, Info, ShieldCheck, Eye, History, ToggleLeft, ArrowLeftRight
} from 'lucide-react'
import JourneyBuilder from './JourneyBuilder'
import RutaFullPreviewModal from '../../components/onboarding/RutaFullPreviewModal'
import AsignarRutaModal from '../../components/onboarding/AsignarRutaModal'
import ActivarRutaModal from '../../components/onboarding/ActivarRutaModal'
import CambiarEstadoRutaModal from '../../components/onboarding/CambiarEstadoRutaModal'
import EmptyState from '../../components/layout/EmptyState'
import ConfirmarAccionModal from '../../components/layout/ConfirmarAccionModal'
import OnboardingCard from '../../components/onboarding/OnboardingCard'
import RutaMetaFields, { areas, cargosPorArea, tiposRuta, faltaAlgo } from '../../components/onboarding/RutaMetaFields'
import { colaboradoresData } from '../personas/colaboradoresData'
import { getGlobalEtapas } from '../../utils/globalEtapas'
import { duracionEnDias } from '../../utils/duracionRuta'
import { estadoRuta, normalizarStatus, rutasEnConflicto, describirPuesto, marcarDesplazada, limpiarDesplazada, motivoDesplazo, cargosDe, nombrarCargos, ESTADOS_EN_CURSO, SUCURSAL_TODAS } from '../../utils/rutaEstados'

const colores = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#ec4899', '#0d9488', '#d946ef', '#ef4444']


/* Piezas del aviso de "este lugar ya está ocupado". El rótulo del momento va en versaditas y
   angosto para que las dos filas queden alineadas y se lean como una tabla de dos tiempos. */
const Momento = ({ children }) => (
  <span style={{
    fontSize: 9, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
    color: '#b45309', whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
)

const Detalle = ({ children }) => (
  <span style={{ fontSize: 10.5, color: '#92400e', lineHeight: 1.55 }}>{children}</span>
)

/* La píldora de la lista usa fondo de color, y sobre el ámbar del aviso el amarillo de
   "Borrador" desaparece. Acá va en blanco con el color del estado en el texto y el borde:
   se despega del fondo y se sigue reconociendo. */
const PildoraAviso = ({ estado }) => {
  const e = estadoRuta(estado)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
      fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
      background: '#fff', color: e.color, border: `1px solid ${e.color}40`,
    }}>
      {e.label}
    </span>
  )
}

/* Ítem del menú de acciones de una ruta. Lo comparten la cuadrícula y la tabla:
   escrito dos veces, el estado apagado de "Activar" existía solo en una. */
function AccionItem({ accion }) {
  const Icono = accion.icon
  return (
    <button
      onClick={accion.fn}
      disabled={accion.disabled}
      title={accion.title}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', border: 'none', borderRadius: 7,
        background: 'transparent', fontSize: 12,
        cursor: accion.disabled ? 'default' : 'pointer',
        opacity: accion.disabled ? 0.45 : 1,
        fontWeight: 500, color: accion.color, fontFamily: 'inherit', textAlign: 'left',
        transition: 'background .1s',
      }}
      onMouseEnter={e => { if (!accion.disabled) e.currentTarget.style.background = accion.color === '#ef4444' ? '#fef2f2' : '#f8fafc' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <Icono size={13} /> {accion.label}
    </button>
  )
}


export default function Plantillas() {
  const { currentUser } = useUser()
  const isManager = currentUser.role === 'manager'
  const isAuxiliar = currentUser.role === 'auxiliar'
  const isAreaRole = isManager || isAuxiliar
  // El área sale del usuario: los roles de alcance acotado (líder, auxiliar) la traen consigo.
  const managerArea = currentUser.area

  const { plantillas: allPlantillas, setPlantillas: setAllPlantillas, asignaciones, setAsignaciones, addFeedEntry } = useOnboardingData()
  const isAdmin = !isAreaRole
  /* "La" ruta general es la que está en uso. Ahora puede haber más de una marcada —la vigente
     y el borrador que la va a suceder— y quien pregunta por ella quiere saber cuál se está
     anteponiendo hoy, no cuál se está escribiendo. Si ninguna está activa, se muestra igual la
     que haya, porque el KPI necesita distinguir "no hay" de "hay pero todavía no propaga". */
  const rutaGeneral = allPlantillas.find(p => p.esGlobal && normalizarStatus(p.status) === 'activa')
    || allPlantillas.find(p => p.esGlobal)
    || null
  // Alcance de la ruta general: como se antepone a todas las rutas, aplica a todos los
  // colaboradores en onboarding. Total real = suma de asignados de las rutas activas (no generales).
  const alcanceGeneral = allPlantillas
    .filter(p => !p.esGlobal && normalizarStatus(p.status) === 'activa')
    .reduce((s, p) => s + (p.asignados || 0), 0)
  const plantillas = isAreaRole ? allPlantillas.filter(p => p.area === managerArea) : allPlantillas
  function setPlantillas(next) {
    if (!isAreaRole) { setAllPlantillas(next); return }
    const others = allPlantillas.filter(p => p.area !== managerArea)
    setAllPlantillas([...others, ...next])
  }
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todas')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterArea, setFilterArea] = useState('todas')
  const [filterCargo, setFilterCargo] = useState('todos')
  const [rfDropStatus, setRfDropStatus] = useState(false)
  const [rfDropTipo, setRfDropTipo] = useState(false)
  const [statusHeaderPos, setStatusHeaderPos] = useState(null)
  const [tipoHeaderPos, setTipoHeaderPos] = useState(null)
  const [mfDropArea, setMfDropArea] = useState(false)
  const [mfDropCargo, setMfDropCargo] = useState(false)
  const filterBarRef = useRef(null)

  useEffect(() => {
    function closeDrops(e) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) {
        setMfDropArea(false); setMfDropCargo(false)
      }
      if (!e.target.closest('[data-th-filter]')) {
        setRfDropStatus(false); setRfDropTipo(false)
      }
    }
    document.addEventListener('mousedown', closeDrops)
    return () => document.removeEventListener('mousedown', closeDrops)
  }, [])
  const [viewMode, setViewMode] = useState('list')
  const [cardMenu, setCardMenu] = useState(null)
  const [rowMenuPos, setRowMenuPos] = useState(null)
  const [asignarModal, setAsignarModal] = useState(null)

  const [activeJourney, setActiveJourney] = useState(null)
  const [previewRuta, setPreviewRuta] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [asignadosModal, setAsignadosModal] = useState(null)
  // Ruta que se está activando cuando el puesto ya está ocupado (RN-M60).
  const [activarModal, setActivarModal] = useState(null)
  // Ruta cuyo estado se está cambiando desde el selector. null = cerrado.
  const [estadoModal, setEstadoModal] = useState(null)
  const [asignadosSearch, setAsignadosSearch] = useState('')
  const [etapasModal, setEtapasModal] = useState(null)
  const [tareasModal, setTareasModal] = useState(null)

  const [form, setForm] = useState({ name: '', descripcion: '', tipo: 'Onboarding', sucursal: 'Todas las sucursales', area: isManager ? managerArea : 'Ventas', cargo: '', status: 'borrador' })
  const [originalForm, setOriginalForm] = useState(null)
  const [rutaGeneralConfirm, setRutaGeneralConfirm] = useState(null)
  const [historialRuta, setHistorialRuta] = useState(null)
  const [showResponsables, setShowResponsables] = useState(null)
  const [responsables, setResponsables] = useState({
    9: [{ name: 'Ana Martínez Ruiz', initials: 'AM', color: '#c026d3', role: 'Líder de área' }],
  })

  // Candidatos a responsable de una ruta: el equipo del área de quien la administra.
  const equipoArea = colaboradoresData.filter(c => c.depto === managerArea && c.name !== currentUser.name)

  function addResponsable(rutaId, persona) {
    setResponsables(prev => {
      const list = prev[rutaId] || []
      if (list.find(r => r.name === persona.name)) return prev
      return { ...prev, [rutaId]: [...list, { ...persona, role: persona.cargo }] }
    })
  }

  function removeResponsable(rutaId, name) {
    setResponsables(prev => ({
      ...prev,
      [rutaId]: (prev[rutaId] || []).filter(r => r.name !== name),
    }))
  }

  function canEditRuta(p) {
    if (isAdmin || isManager) return true
    if (isAuxiliar) return (responsables[p.id] || []).some(r => r.name === currentUser.name)
    return false
  }

  function openRuta(p) {
    setPreviewRuta(p)
  }


  const hasRutaFilters = filterStatus !== 'todas' || filterTipo !== 'todos' || filterArea !== 'todas' || filterCargo !== 'todos'
  const fuenteRutas = plantillas
  const cargosDeArea = [...new Set(fuenteRutas.filter(p => filterArea === 'todas' || p.area === filterArea).flatMap(cargosDe))]
  const filtered = fuenteRutas.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.area.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todas' || normalizarStatus(p.status) === filterStatus
    const matchTipo = filterTipo === 'todos' || (p.tipo || 'Onboarding') === filterTipo
    const matchArea = filterArea === 'todas' || p.area === filterArea
    const matchCargo = filterCargo === 'todos' || cargosDe(p).includes(filterCargo)
    return matchSearch && matchStatus && matchTipo && matchArea && matchCargo
  }).sort((a, b) => (b.esGlobal ? 1 : 0) - (a.esGlobal ? 1 : 0))
  function clearRutaFilters() { setFilterStatus('todas'); setFilterTipo('todos'); setFilterArea('todas'); setFilterCargo('todos'); setPage(1) }

  const [page, setPage] = useState(1)
  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  /* El choque de puesto se detecta ya en el formulario y no solo al activar: si
     el aviso llega recién al final, la persona se entera después de haber armado
     la ruta entera. Acá informa, no bloquea — el cambio se confirma al activar. */
  const conflictoForm = modal
    ? rutasEnConflicto(allPlantillas, { id: form.id, cargos: form.cargos, sucursal: form.sucursal, esGlobal: form.esGlobal })
    : []

  // `normalizarStatus` para que una ruta guardada como "archivada" antes de que ese estado
  // desapareciera cuente donde corresponde y no quede fuera de los tres contadores.
  const cuantas = estado => plantillas.filter(p => normalizarStatus(p.status) === estado).length
  const totalActivas = cuantas('activa')
  const totalInactivas = cuantas('inactiva')
  const totalBorrador = cuantas('borrador')

  /* Crear va directo al formulario y la ruta nace vacía. Antes lo primero era un modal que
     preguntaba "¿desde cero o desde plantilla?" —a ciegas, antes de nombrarla y sin ver qué
     trae cada plantilla— y la respuesta no se podía cambiar después. Esa elección ahora vive
     dentro del constructor, frente al lienzo vacío que viene a llenar. */
  function openCreate() {
    setForm({
      name: '',
      descripcion: '',
      tipo: 'Onboarding',
      sucursal: 'Todas las sucursales',
      area: isManager ? managerArea : 'Ventas',
      cargos: [],
      /* Qué se está creando. La general no se apunta a nadie —va para todos— así que no
         tiene sucursal, área ni cargo; declararlo aquí evita crear una ruta común y tener
         que acordarse después de marcarla desde el menú de acciones. */
      esGlobal: false,
    })
    setModal('crear')
  }

  function openEdit(p) {
    // Arrastra `esGlobal` para que a la ruta general tampoco se le pidan aquí sucursal, área
    // ni cargo: son datos que no usa. Cambiar la marca sigue siendo cosa del menú de acciones.
    const initial = { name: p.name, descripcion: p.descripcion || '', tipo: p.tipo || 'Onboarding', sucursal: p.sucursal || 'Todas las sucursales', area: p.area, cargos: cargosDe(p), esGlobal: !!p.esGlobal, id: p.id }
    setForm(initial)
    setOriginalForm(initial)
    setModal('editar')
  }

  function handleSave() {
    if (!form.name.trim()) return

    if (modal === 'crear') {
      const newId = Math.max(...plantillas.map(p => p.id), 0) + 1
      const color = colores[newId % colores.length]
      // La ruta nace vacía: el contenido se trae después, desde el constructor.
      const etapasData = undefined
      const newPlantilla = {
        id: newId,
        name: form.name.trim(),
        descripcion: form.descripcion?.trim() || '',
        tipo: form.tipo,
        /* La general va para todos: se guarda con el alcance más amplio en vez de dejar los
           campos vacíos, así el resto de la pantalla (filtros, listados, "Se incluye en todas
           las rutas") la lee sin tener que preguntar aparte si es la general. */
        sucursal: form.esGlobal ? SUCURSAL_TODAS : (form.sucursal || SUCURSAL_TODAS),
        area: form.esGlobal ? 'Todas las áreas' : form.area,
        cargos: form.esGlobal ? [] : (form.cargos || []),
        etapas: etapasData?.length || 0,
        tareas: etapasData ? etapasData.reduce((s, e) => s + e.actividades.reduce((ss, a) => ss + a.tareas.length, 0), 0) : 0,
        asignados: 0,
        status: 'borrador',
        updated: 'Ahora',
        updatedFecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        color,
        esGlobal: !!form.esGlobal,
        ordenGlobal: form.esGlobal ? 0 : null,
        creador: currentUser.name,
        creadorRole: currentUser.roleLabel,
        creadoEl: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        versionActual: 1,
        versiones: [{
          v: 1,
          etapasData: etapasData || [],
          etapas: etapasData?.length || 0,
          tareas: etapasData ? etapasData.reduce((s, e) => s + e.actividades.reduce((ss, a) => ss + a.tareas.length, 0), 0) : 0,
          fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          autor: currentUser.name,
        }],
        ...(etapasData ? { etapasData } : {}),
      }
      setPlantillas([...plantillas, newPlantilla])
      addFeedEntry(`Nueva ruta "${newPlantilla.name}" creada`)
      setModal(null)
      setActiveJourney({ ...newPlantilla, isNew: !etapasData })
    } else {
      setPlantillas(plantillas.map(p => {
        if (p.id !== form.id) return p
        return {
          /* `cargos` se guarda aquí también: el formulario deja editarlo y la comparación de
             abajo lo cuenta como cambio, pero el guardado lo dejaba afuera y volvía sin efecto. */
          ...p, name: form.name.trim(), descripcion: form.descripcion?.trim() || '', tipo: form.tipo, sucursal: form.sucursal, area: form.area, cargos: form.cargos || [], updated: 'Ahora',
          updatedFecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        }
      }))
      setModal(null)
    }
  }

  // Desde el modal de editar: guarda los metadatos (si son válidos) y abre el diseñador de etapas/tareas
  function handleEditDesign() {
    const target = plantillas.find(pl => pl.id === form.id)
    if (!target) return
    const updated = {
      ...target,
      name: form.name.trim() || target.name,
      descripcion: form.descripcion?.trim() || '',
      tipo: form.tipo,
      sucursal: form.sucursal,
      area: form.area,
      cargos: form.cargos || [],
    }
    setPlantillas(plantillas.map(pl => pl.id === form.id ? updated : pl))
    setModal(null)
    setActiveJourney({ ...updated, isEditingExisting: true })
  }

  function toggleGlobal(p) {
    const willBeGlobal = !p.esGlobal
    setPlantillas(prev => prev.map(x => x.id === p.id
      ? { ...x, esGlobal: willBeGlobal, ordenGlobal: willBeGlobal ? 0 : null }
      : x))
    setCardMenu(null)
    setRutaGeneralConfirm(null)
  }

  function handleDuplicate(p) {
    const newId = Math.max(...plantillas.map(x => x.id)) + 1
    const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    setPlantillas([...plantillas, {
      ...p,
      id: newId,
      name: `${p.name} (copia)`,
      asignados: 0,
      status: 'borrador',
      updated: 'Ahora',
      updatedFecha: hoy,
      creador: currentUser.name,
      creadoEl: hoy,
    }])
  }

  function confirmDelete(p) {
    setDeleteTarget(p)
  }

  function handleAsignarRuta(colabs, ruta, fecha) {
    if (!colabs.length || !ruta) return
    const baseId = Math.max(0, ...asignaciones.map(a => a.id))
    const newItems = colabs.map((c, i) => ({
      id: baseId + i + 1,
      nombre: c.name,
      area: c.depto || 'Sin asignar',
      ruta: ruta.name,
      rutaId: ruta.id,
      // Se fija la versión actual de la ruta; el contenido se resuelve desde
      // ruta.versiones[version]. El snapshot queda como respaldo.
      version: ruta.versionActual || 1,
      etapasData: JSON.parse(JSON.stringify(ruta.etapasData || [])),
      dia: 0,
      // Lo que dura la ruta de verdad; 30 solo si la ruta todavía no tiene etapas.
      totalDias: duracionEnDias(ruta.etapasData) || 30,
      pct: 0,
      status: 'pendiente',
      fechaInicio: fecha || 'Por definir',
      color: c.color || '#3b82f6',
    }))
    setAsignaciones([...asignaciones, ...newItems])
    colabs.forEach(c => addFeedEntry(`${c.name} fue asignado/a a ${ruta.name}`))
    setAsignarModal(null)
  }

  function handleDelete() {
    setPlantillas(plantillas.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // Cuánta gente sigue recorriendo una ruta. Al salir de Activo nadie se
  // interrumpe: solo se cortan las asignaciones nuevas (RN-M65).
  function enCursoDe(p) {
    return asignaciones.filter(a =>
      (a.rutaId === p.id || a.ruta === p.name) && ESTADOS_EN_CURSO.includes(a.status)).length
  }

  /* Cuántas veces se asignó esta ruta alguna vez, terminadas incluidas. Decide si se puede
     eliminar: lo que bloquea el borrado no es que haya gente adentro hoy, es que exista
     historial apuntando a ella. */
  function vecesAsignada(p) {
    return asignaciones.filter(a => a.rutaId === p.id || a.ruta === p.name).length
  }

  /* Los cambios de estado escriben sobre la lista completa y no sobre la vista
     filtrada por área: la unicidad es una regla del sistema, y un líder que
     activa una ruta puede estar desplazando a otra que su filtro no le muestra. */
  /* Todo cambio de estado hecho a mano borra el motivo del desplazamiento: si la
     ruta llegó a Inactivo porque otra le ganó el puesto pero después se la mueve
     por cualquier otro camino, el motivo dejaría de ser cierto y seguiría escrito. */
  function cambiarStatus(id, status) {
    setAllPlantillas(allPlantillas.map(x => x.id === id ? limpiarDesplazada({ ...x, status }) : x))
  }

  /* Único camino para mover el estado: el menú abre el selector y de ahí sale el destino.
     Antes había tres verbos sueltos que aparecían o no según el estado, así que el menú
     cambiaba de forma entre una ruta y otra y nunca se veía el cuadro completo. */
  function aplicarEstado(destino) {
    const p = estadoModal
    setEstadoModal(null)
    if (destino === 'activa') { pedirActivacion(p); return }
    cambiarStatus(p.id, destino)
    addFeedEntry(`Ruta "${p.name}" pasó a ${estadoRuta(destino).label}`)
  }

  /* Activar. Lo que decide el flujo no es desde qué estado se venga sino si el
     puesto (cargo + sucursal) ya tiene una ruta vigente: libre → se activa
     directo; ocupado → es un reemplazo y hay que confirmarlo (RN-M60). */
  function pedirActivacion(p) {
    const anteriores = rutasEnConflicto(allPlantillas, p)
    if (!anteriores.length) { activarRuta(p, []); return }
    setActivarModal({ ruta: p, anteriores: anteriores.map(a => ({ ...a, enCurso: enCursoDe(a) })) })
  }

  function activarRuta(p, anteriores) {
    const desplazadas = new Set(anteriores.map(a => a.id))
    const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    setAllPlantillas(allPlantillas.map(x => {
      if (x.id === p.id) return limpiarDesplazada({ ...x, status: 'activa' })
      return desplazadas.has(x.id) ? marcarDesplazada(x, p, hoy) : x
    }))
    addFeedEntry(`Ruta "${p.name}" ${anteriores.length ? 'quedó vigente en reemplazo de la anterior' : 'pasó a Activo'}`)
    anteriores.forEach(a => addFeedEntry(`Ruta "${a.name}" pasó a Inactivo — reemplazada por "${p.name}"`))
    setActivarModal(null)
  }

  /* Menú de acciones de una ruta. Vive en una sola función porque se dibuja en dos vistas
     —cuadrícula y tabla— y el alto del menú de la tabla se calcula a partir de su largo:
     tres copias del mismo criterio que se desincronizan.

     El estado se mueve por un solo ítem, "Cambiar estado", y las transiciones permitidas las
     resuelve el selector (RN-M62). Antes había tres verbos sueltos que entraban y salían del
     menú según el estado, así que el menú cambiaba de forma entre una ruta y otra. */
  function accionesRuta(p) {
    const estado = normalizarStatus(p.status)
    const esActiva = estado === 'activa'
    const cerrar = fn => () => { fn(p); setCardMenu(null) }
    /* Borrado físico, según la tabla de estados: se permite en Borrador y en Activo mientras
       no haya historial —una asignación deja claves y métricas apuntando a la ruta—, y nunca
       en Inactivo, que es el soft-delete del sistema y existe justamente para conservarlo. */
    const usada = vecesAsignada(p) > 0
    const esInactiva = estado === 'inactiva'
    const noEliminable = usada || esInactiva
    const motivoNoEliminar = esInactiva
      ? 'Inactivo es el archivo del sistema: conserva el registro de la ruta, así que no se borra.'
      : 'Esta ruta ya se asignó a alguien. Para sacarla de circulación, ponla en Inactivo desde "Cambiar estado".'
    return [
      ...(esActiva && !p.esGlobal ? [{ icon: UserPlus, label: 'Asignar ruta a colaboradores', color: 'var(--green)', fn: cerrar(setAsignarModal) }] : []),
      { icon: Eye, label: 'Ver detalles', color: 'var(--text-muted)', fn: cerrar(setPreviewRuta) },
      ...(canEditRuta(p) ? [{ icon: Pencil, label: 'Editar', color: 'var(--text-muted)', fn: cerrar(openEdit) }] : []),
      { icon: Copy, label: 'Duplicar', color: 'var(--text-muted)', fn: cerrar(handleDuplicate) },
      { icon: History, label: 'Historial de versiones', color: 'var(--text-muted)', fn: cerrar(setHistorialRuta) },
      ...(isAdmin ? [{ icon: p.esGlobal ? Lock : ShieldCheck, label: p.esGlobal ? 'Quitar como ruta general' : 'Establecer como ruta general', color: 'var(--text-muted)', fn: cerrar(setRutaGeneralConfirm) }] : []),
      { icon: ToggleLeft, label: 'Cambiar estado', color: 'var(--text-muted)', fn: cerrar(setEstadoModal) },
      {
        icon: Trash2,
        label: 'Eliminar',
        color: '#ef4444',
        disabled: noEliminable,
        title: noEliminable ? motivoNoEliminar : undefined,
        fn: cerrar(confirmDelete),
      },
    ]
  }

  /* Responsables de una ruta: solo lo ve el líder de área. Sale del cuerpo de la tarjeta
     porque ahí competía por espacio con los números de la ruta, que son lo que se mira
     primero, y porque este bloque se despliega y la haría saltar de alto. */
  function Responsables({ p }) {
    const asignados = responsables[p.id] || []
    const disponibles = equipoArea.filter(e => !asignados.find(r => r.name === e.name))
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Responsables</span>
          <button
            onClick={e => { e.stopPropagation(); setShowResponsables(showResponsables === p.id ? null : p.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 10, fontWeight: 600, color: 'var(--blue)',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <UserPlus size={11} /> Agregar
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {asignados.map(r => (
            <div key={r.name} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px 3px 3px', borderRadius: 20,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: r.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>{r.initials}</span>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)' }}>{r.name.split(' ')[0]}</span>
              {r.role !== 'Líder de área' && (
                <button onClick={e => { e.stopPropagation(); removeResponsable(p.id, r.name) }} style={{
                  width: 12, height: 12, borderRadius: '50%', border: 'none',
                  background: 'var(--surface-hover)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, marginLeft: -2,
                }}>
                  <X size={7} style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>
          ))}
          {asignados.length === 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin responsables asignados</span>
          )}
        </div>

        {showResponsables === p.id && (
          <div style={{
            marginTop: 6, padding: 6, borderRadius: 8,
            background: 'var(--surface-card)', border: '1px solid var(--border-soft)',
            boxShadow: '0 4px 12px rgba(0,0,0,.08)',
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, padding: '0 4px' }}>Equipo de {managerArea}</div>
            {disponibles.map(e => (
              <button
                key={e.name}
                onClick={ev => { ev.stopPropagation(); addResponsable(p.id, e) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: 6, border: 'none', borderRadius: 6,
                  background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', transition: 'background .1s',
                }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: e.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>{e.initials}</span>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-heading)' }}>{e.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{e.cargo}</div>
                </div>
              </button>
            ))}
            {disponibles.length === 0 && (
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', padding: '6px 4px', textAlign: 'center' }}>Todos asignados</div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (activeJourney) {
    return (
      <JourneyBuilder
        plantilla={activeJourney}
        onBack={() => setActiveJourney(null)}
        empty={activeJourney.isNew}
        backLabel="Rutas"
        editing={activeJourney.isEditingExisting}
      />
    )
  }

  return (
    <div className="content-scroll" onClick={() => setCardMenu(null)}>

      <div className="pl-header">
        <div>
          <h1 className="pl-title">{isAreaRole ? `Rutas — ${managerArea}` : 'Rutas de Onboarding'}</h1>
          <p className="pl-subtitle">{isAreaRole ? 'Rutas de onboarding de tu área' : 'Administra y organiza tus rutas de onboarding'}</p>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="kpi-strip">
        {/* Un contador por estado oficial (RN-M55). El total salió de la tira: es la
            suma de estos tres y no dice nada que no digan ellos. */}
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>Activo</div>
          <div className="kpi-val">{totalActivas}</div>
          <div className="kpi-lbl">Vigentes para su cargo</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--navy)' }}>
          <div className="kpi-title" style={{ color: 'var(--navy-txt)' }}>Inactivo</div>
          <div className="kpi-val">{totalInactivas}</div>
          <div className="kpi-lbl">Dejaron de asignarse</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)' }}>
          <div className="kpi-title" style={{ color: 'var(--yellow)' }}>Borrador</div>
          <div className="kpi-val">{totalBorrador}</div>
          <div className="kpi-lbl">En construcción</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': rutaGeneral ? '#475569' : 'var(--yellow)' }}>
          <div className="kpi-title" style={{ color: rutaGeneral ? '#475569' : 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={12} style={{ flexShrink: 0 }} /> Ruta general
          </div>
          <div className="kpi-val" style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rutaGeneral ? rutaGeneral.name : undefined}>
            {rutaGeneral ? rutaGeneral.name : 'Sin definir'}
          </div>
          <div className="kpi-lbl">
            {!rutaGeneral ? 'Ninguna ruta se aplica a todas' : rutaGeneral.status === 'activa' ? 'Se antepone a todas las rutas' : `No propaga (${estadoRuta(rutaGeneral.status).label})`}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="pl-toolbar">
        <div className="pl-search-wrap">
          <Search size={13} className="pl-search-ico" />
          <input
            type="text"
            className="pl-search"
            placeholder="Buscar ruta por nombre o área…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div ref={filterBarRef} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* ÁREA */}
          <div className="pl-dropdown-wrap" style={{ width: 'auto' }}>
            <button type="button" className={`pl-dropdown-trigger${mfDropArea ? ' open' : ''}${filterArea === 'todas' ? ' placeholder' : ''}`} style={{ width: 'auto', height: 34, fontSize: 11, padding: '0 10px', justifyContent: 'flex-start', gap: 6 }} onClick={e => { e.stopPropagation(); setMfDropArea(!mfDropArea); setMfDropCargo(false) }}>
              <span style={{ whiteSpace: 'nowrap' }}>{filterArea === 'todas' ? 'Todas las áreas' : filterArea}</span>
              <ChevronDown size={12} className="pl-dropdown-chevron" style={{ flexShrink: 0 }} />
            </button>
            {mfDropArea && (
              <div className="pl-dropdown-menu" style={{ minWidth: 160, maxHeight: 220, overflowY: 'auto' }}>
                {['todas', ...new Set(fuenteRutas.map(p => p.area).filter(a => a !== 'Todas las áreas'))].map(a => (
                  <button key={a} type="button" className={`pl-dropdown-item${filterArea === a ? ' selected' : ''}`} style={{ fontSize: 11.5, padding: '6px 9px' }} onClick={() => { setFilterArea(a); setFilterCargo('todos'); setMfDropArea(false); setPage(1) }}>
                    <span>{a === 'todas' ? 'Todas las áreas' : a}</span>
                    {filterArea === a && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CARGO */}
          <div className="pl-dropdown-wrap" style={{ width: 'auto' }}>
            <button type="button" className={`pl-dropdown-trigger${mfDropCargo ? ' open' : ''}${filterCargo === 'todos' ? ' placeholder' : ''}`} style={{ width: 'auto', height: 34, fontSize: 11, padding: '0 10px', justifyContent: 'flex-start', gap: 6 }} onClick={e => { e.stopPropagation(); setMfDropCargo(!mfDropCargo); setMfDropArea(false) }}>
              <span style={{ whiteSpace: 'nowrap' }}>{filterCargo === 'todos' ? 'Todos los cargos' : filterCargo}</span>
              <ChevronDown size={12} className="pl-dropdown-chevron" style={{ flexShrink: 0 }} />
            </button>
            {mfDropCargo && (
              <div className="pl-dropdown-menu" style={{ minWidth: 160, maxHeight: 220, overflowY: 'auto' }}>
                {['todos', ...cargosDeArea].map(c => (
                  <button key={c} type="button" className={`pl-dropdown-item${filterCargo === c ? ' selected' : ''}`} style={{ fontSize: 11.5, padding: '6px 9px' }} onClick={() => { setFilterCargo(c); setMfDropCargo(false); setPage(1) }}>
                    <span>{c === 'todos' ? 'Todos los cargos' : c}</span>
                    {filterCargo === c && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasRutaFilters && (
            <button onClick={clearRutaFilters} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Limpiar</button>
          )}
        </div>
        {!isAreaRole && (
          <button className="pl-btn-new" onClick={openCreate} style={{ padding: '0 14px', height: 34, fontSize: 11.5, marginLeft: 'auto' }}>
            <Plus size={14} /> Nueva ruta
          </button>
        )}
        <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: 8, padding: 3, marginLeft: isAreaRole ? 'auto' : 0 }}>
          {[{ key: 'list', icon: List }, { key: 'grid', icon: LayoutGrid }].map(v => {
            const VIcon = v.icon
            return (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                style={{
                  width: 32, height: 28, borderRadius: 6, border: 'none',
                  background: viewMode === v.key ? '#fff' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: viewMode === v.key ? '#0C2D40' : '#94a3b8',
                  transition: 'all .15s',
                }}
              >
                <VIcon size={14} />
              </button>
            )
          })}
        </div>
      </div>

      {/* VISTA GRID */}
      {viewMode === 'grid' && (
      <div className="pl-grid">
        {paginated.map((p) => (
          <OnboardingCard
            key={p.id}
            nombre={p.name}
            cargo={nombrarCargos(p)}
            area={p.area}
            destacado={p.esGlobal}
            avatar={
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: p.esGlobal ? 'rgba(12,45,64,.1)' : 'var(--green-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Route size={17} style={{ color: p.esGlobal ? 'var(--navy)' : 'var(--green)' }} />
              </div>
            }
            badge={<>
              <span className={`pl-status ${estadoRuta(p.status).clase}`}>{estadoRuta(p.status).label}</span>
              {p.esGlobal && (
                <span title="Ruta general — se antepone a todas las rutas" style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#475569', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={9} /> General
                </span>
              )}
              {p.versiones?.length > 1 && (
                <span title={`Versión actual ${p.versionActual} · ${p.versiones.length} versiones`} style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                  v{p.versionActual}
                </span>
              )}
            </>}
            acciones={
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setCardMenu(cardMenu === p.id ? null : p.id) }}
                  style={{
                    width: 26, height: 26, borderRadius: 7, border: 'none',
                    background: cardMenu === p.id ? 'var(--surface-hover)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontFamily: 'inherit',
                  }}
                >
                  <MoreHorizontal size={15} />
                </button>
                {cardMenu === p.id && (
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                    background: 'var(--surface-card)', borderRadius: 10, padding: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,.2)', border: '1px solid var(--border-soft)',
                    zIndex: 20, minWidth: 150, animation: 'plSlideUp .12s',
                  }}>
                    {accionesRuta(p).map(a => <AccionItem key={a.label} accion={a} />)}
                  </div>
                )}
              </div>
            }
            /* Donde la tarjeta de una persona lleva su barra de avance, la de una ruta lleva
               de qué está hecha. Los tres números se abren: son la puerta a las etapas, las
               tareas y la gente que la está recorriendo. */
            cuerpo={
              <div style={{ display: 'flex', border: '1px solid var(--border-soft)', borderRadius: 10, overflow: 'hidden' }}>
                {[
                  { n: p.etapas, t: 'Etapas', fn: () => setEtapasModal(p) },
                  { n: p.tareas, t: 'Tareas', fn: () => setTareasModal(p) },
                  p.esGlobal
                    ? { n: alcanceGeneral, t: 'Alcance', title: 'Se incluye en todas las rutas de onboarding' }
                    : { n: p.asignados, t: 'Asignados', fn: p.asignados > 0 ? () => setAsignadosModal(p) : undefined, apagado: !p.asignados },
                ].map((m, i) => (
                  <div
                    key={m.t}
                    onClick={m.fn}
                    title={m.title}
                    style={{
                      flex: 1, textAlign: 'center', padding: '8px 2px',
                      borderLeft: i > 0 ? '1px solid var(--border-soft)' : 'none',
                      cursor: m.fn ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1, color: m.apagado ? 'var(--text-muted)' : 'var(--text-heading)' }}>{m.n}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{m.t}</div>
                  </div>
                ))}
              </div>
            }
            extra={<>
              {/* Por qué está apagada. "Inactivo" describe la situación pero no cómo se
                  llegó, y a la semana nadie recuerda si la desactivaron a propósito o si
                  otra ruta le ganó el puesto. */}
              {motivoDesplazo(p) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={motivoDesplazo(p)}>
                  <ArrowLeftRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Reemplazada por {p.desplazadaPor.name}
                  </span>
                </div>
              )}
              {isManager && <Responsables p={p} />}
              {isAuxiliar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12} style={{ color: '#14b8a6', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Acceso delegado por <strong style={{ color: 'var(--text-heading)' }}>{currentUser.delegadoPor}</strong>
                  </span>
                </div>
              )}
            </>}
            meta={
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.esGlobal ? 'Se incluye en todas las rutas' : p.sucursal || SUCURSAL_TODAS} · {p.updated}
              </span>
            }
            onVerDetalles={() => setPreviewRuta(p)}
          />
        ))}
      </div>
      )}

      {/* VISTA LISTA */}
      {viewMode === 'list' && (
        <div className="as-table-wrap">
          <table className="as-table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Nombre de la ruta</th>
                <th style={{ width: '17%' }}>Área / Cargo</th>
                <th style={{ width: '11%' }} data-th-filter>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      if (rfDropTipo) { setRfDropTipo(false); return }
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTipoHeaderPos({ top: rect.bottom + 6, left: rect.left })
                      setRfDropStatus(false)
                      setRfDropTipo(true)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3, border: 'none', background: 'none',
                      padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
                      color: filterTipo !== 'todos' ? 'var(--navy)' : 'var(--text-muted)',
                    }}
                  >
                    Tipo
                    <ChevronDown size={11} style={{ transform: rfDropTipo ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                  </button>
                  {rfDropTipo && tipoHeaderPos && (
                    <div className="pl-dropdown-menu" style={{ position: 'fixed', top: tipoHeaderPos.top, left: tipoHeaderPos.left, right: 'auto', minWidth: 160, textTransform: 'none', letterSpacing: 'normal' }} onClick={e => e.stopPropagation()}>
                      {['todos', ...tiposRuta].map(t => (
                        <button key={t} type="button" className={`pl-dropdown-item${filterTipo === t ? ' selected' : ''}`} style={{ fontSize: 11.5, padding: '6px 9px' }} onClick={() => { setFilterTipo(t); setRfDropTipo(false); setPage(1) }}>
                          <span>{t === 'todos' ? 'Todos los tipos' : t}</span>
                          {filterTipo === t && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>
                <th style={{ width: '7%' }}>Etapas</th>
                <th style={{ width: '12%' }}>Colaboradores</th>
                <th style={{ width: '15%' }} data-th-filter>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      if (rfDropStatus) { setRfDropStatus(false); return }
                      const rect = e.currentTarget.getBoundingClientRect()
                      setStatusHeaderPos({ top: rect.bottom + 6, left: rect.left })
                      setRfDropTipo(false)
                      setRfDropStatus(true)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3, border: 'none', background: 'none',
                      padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
                      color: filterStatus !== 'todas' ? 'var(--navy)' : 'var(--text-muted)',
                    }}
                  >
                    Estado
                    <ChevronDown size={11} style={{ transform: rfDropStatus ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                  </button>
                  {rfDropStatus && statusHeaderPos && (
                    <div className="pl-dropdown-menu" style={{ position: 'fixed', top: statusHeaderPos.top, left: statusHeaderPos.left, right: 'auto', minWidth: 160, textTransform: 'none', letterSpacing: 'normal' }} onClick={e => e.stopPropagation()}>
                      {[{ key: 'todas', label: 'Todos los estados' }, { key: 'activa', label: 'Activo' }, { key: 'inactiva', label: 'Inactivo' }, { key: 'borrador', label: 'Borrador' }].map(f => (
                        <button key={f.key} type="button" className={`pl-dropdown-item${filterStatus === f.key ? ' selected' : ''}`} style={{ fontSize: 11.5, padding: '6px 9px' }} onClick={() => { setFilterStatus(f.key); setRfDropStatus(false); setPage(1) }}>
                          <span>{f.label}</span>
                          {filterStatus === f.key && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>
                <th style={{ width: '8%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer', ...(p.esGlobal ? { background: '#EEF1F5' } : {}) }} onClick={() => openRuta(p)}>
                  <td>
                    <div className="as-name" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                      {p.name}
                      {p.esGlobal && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#475569', color: '#fff', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }} title="Ruta general — se antepone a todas las rutas">
                          <ShieldCheck size={9} /> General
                        </span>
                      )}
                      {p.versiones?.length > 1 && (
                        <span title={`Versión actual ${p.versionActual} · ${p.versiones.length} versiones`} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-muted)', flexShrink: 0 }}>v{p.versionActual}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0C2D40' }}>{p.area}</span>
                      {/* Con varios cargos se nombran dos y el resto se cuenta: la celda tiene
                          ancho fijo y la lista entera la desbordaba. El título los trae todos. */}
                      {cargosDe(p).length > 0 && (
                        <span title={cargosDe(p).join(', ')} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{nombrarCargos(p)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.tipo || 'Onboarding'}
                    </span>
                  </td>
                  <td><span className="as-dia">{p.etapas}</span></td>
                  <td>
                    {p.esGlobal ? (
                      <span className="as-dia" title="Alcance: se incluye en todas las rutas de onboarding" style={{ color: '#0C2D40' }}>{alcanceGeneral}</span>
                    ) : (
                      <span className="as-dia">{p.asignados}</span>
                    )}
                  </td>
                  <td>
                    {/* En la tabla el motivo no entra como línea aparte sin apretar la
                        fila, así que va al tooltip de la píldora, que es justo donde
                        se lo busca: sobre el estado que no se entiende. */}
                    <span
                      title={motivoDesplazo(p) || undefined}
                      style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: estadoRuta(p.status).bg,
                        color: estadoRuta(p.status).color,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        cursor: motivoDesplazo(p) ? 'help' : undefined,
                      }}
                    >
                      {estadoRuta(p.status).label}
                      {motivoDesplazo(p) && <ArrowLeftRight size={9} style={{ opacity: 0.7 }} />}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          if (cardMenu === p.id) { setCardMenu(null); return }
                          const rect = e.currentTarget.getBoundingClientRect()
                          const menuH = accionesRuta(p).length * 34 + 8
                          const margin = 10
                          const top = (rect.bottom + 4 + menuH > window.innerHeight - margin)
                            ? Math.max(margin, rect.top - menuH - 4)
                            : rect.bottom + 4
                          setRowMenuPos({ top, right: window.innerWidth - rect.right })
                          setCardMenu(p.id)
                        }}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: 'none',
                          background: cardMenu === p.id ? 'var(--surface-hover)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)', fontFamily: 'inherit',
                        }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {cardMenu === p.id && rowMenuPos && (
                        <div style={{
                          position: 'fixed', top: rowMenuPos.top, right: rowMenuPos.right,
                          background: '#fff', borderRadius: 10, padding: 4,
                          boxShadow: '0 8px 30px rgba(0,0,0,.2)', border: '1px solid #e2e8f0',
                          zIndex: 20, minWidth: 180, maxHeight: 'calc(100vh - 20px)', overflowY: 'auto',
                          animation: 'plSlideUp .12s',
                        }}>
                          {accionesRuta(p).map(a => <AccionItem key={a.label} accion={a} />)}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderTop: '1px solid var(--border-soft)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length} rutas
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-soft)',
                    background: 'var(--surface-card)', cursor: page === 1 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: page === 1 ? 'var(--border-dark)' : 'var(--text-muted)',
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
                      border: p === page ? 'none' : '1px solid var(--border-soft)',
                      background: p === page ? '#0C2D40' : 'var(--surface-card)',
                      color: p === page ? '#fff' : 'var(--text-muted)',
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
                    width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-soft)',
                    background: 'var(--surface-card)', cursor: page === totalPages ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: page === totalPages ? 'var(--border-dark)' : 'var(--text-muted)',
                    opacity: page === totalPages ? 0.5 : 1,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ padding: '12px 16px 16px' }}>
              <EmptyState
                icon={Route}
                title={plantillas.length === 0 ? 'Aún no hay rutas de onboarding creadas' : 'No se encontraron rutas'}
                description={plantillas.length === 0 ? 'Para crear una ruta, haz clic en "Nueva ruta".' : 'Intenta con otro término de búsqueda o ajusta los filtros.'}
                actionLabel={plantillas.length === 0 && !isAreaRole ? 'Nueva ruta' : undefined}
                actionIcon={Plus}
                onAction={openCreate}
              />
            </div>
          )}
        </div>
      )}

      {viewMode === 'grid' && totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length} rutas
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-soft)',
                background: 'var(--surface-card)', cursor: page === 1 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: page === 1 ? 'var(--border-dark)' : 'var(--text-muted)',
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
                  border: p === page ? 'none' : '1px solid var(--border-soft)',
                  background: p === page ? '#0C2D40' : 'var(--surface-card)',
                  color: p === page ? '#fff' : 'var(--text-muted)',
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
                width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-soft)',
                background: 'var(--surface-card)', cursor: page === totalPages ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: page === totalPages ? 'var(--border-dark)' : 'var(--text-muted)',
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' && filtered.length === 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <EmptyState
            icon={Route}
            title={plantillas.length === 0 ? 'Aún no hay rutas de onboarding creadas' : 'No se encontraron rutas'}
            description={plantillas.length === 0 ? 'Para crear una ruta, haz clic en "Nueva ruta".' : 'Intenta con otro término de búsqueda o ajusta los filtros.'}
            actionLabel={plantillas.length === 0 && !isAreaRole ? 'Nueva ruta' : undefined}
            actionIcon={Plus}
            onAction={openCreate}
          />
        </div>
      )}

      <div style={{ height: '8px' }} />

      {/* MODAL CREAR / EDITAR */}
      {(modal === 'crear' || modal === 'editar') && (
        <div className="pl-overlay" onClick={() => setModal(null)}>
          <div className="pl-modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2>{modal === 'editar' ? 'Editar ruta' : form.esGlobal ? 'Nueva ruta general' : 'Nueva ruta'}</h2>
              </div>
              <button className="pl-modal-close" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="pl-modal-body">
              {/* Solo al crear: en una ruta que ya existe, pasarla a general es otra cosa
                  —arrastra las etapas que ya tiene— y para eso está el menú de acciones. */}
              {modal === 'crear' && isAdmin && (
                <div className="pl-tipo-tabs">
                  {[
                    { general: false, icon: Route, label: 'Ruta por cargo' },
                    { general: true, icon: ShieldCheck, label: 'Ruta general' },
                  ].map(t => {
                    const TIcon = t.icon
                    return (
                      <button
                        key={t.label}
                        type="button"
                        className={`pl-tipo-tab${!!form.esGlobal === t.general ? ' on' : ''}`}
                        onClick={() => setForm({ ...form, esGlobal: t.general })}
                      >
                        <TIcon size={13} /> {t.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <RutaMetaFields form={form} setForm={setForm} autoFocus />

              {/* La general se aplica a todos: no hay a quién apuntarla. */}
              {form.esGlobal && (
                <div className="pl-aviso-general">
                  <ShieldCheck size={14} style={{ color: '#475569', flexShrink: 0, marginTop: 1 }} />
                  {/* Dos frases y no cuatro. "Es lo común a toda la empresa" repetía lo que
                      "se anteponen a las de todas las rutas" ya dice. Y que aparezcan en gris y
                      solo se editen desde aquí se cuenta en la vista previa de la ruta y en el
                      panel del constructor —los dos lugares donde el gris está en pantalla—:
                      aquí es un dato de algo que todavía no existe, dicho antes de tiempo. */}
                  <span>
                    Sus etapas se anteponen a las de <strong>todas</strong> las rutas, sin importar
                    cargo, área ni sucursal. Por eso aquí no se elige a quién apuntarla.
                  </span>
                </div>
              )}

              {/* El mismo aviso para el choque de cargo y para el de la general: en los dos
                  casos el lugar ya está ocupado y la salida es idéntica —nace en Borrador y se
                  resuelve al activar—. Antes la general se bloqueaba en seco y este aviso solo
                  existía para las rutas por cargo. */}
              {/* El aviso separa los dos momentos en vez de encadenarlos en un párrafo. Todo
                  esto ya se decía, pero seguido: primero que el lugar está ocupado, después que
                  igual se puede crear, después qué pasa al activar. Son dos tiempos distintos
                  —lo que pasa ahora y lo que pasa después— y en prosa corrida quien lee tiene
                  que separarlos solo, justo cuando lo que quiere saber es si puede seguir.

                  Los estados van con la misma píldora de la lista de rutas: quien las vio ahí
                  reconoce "Borrador" e "Inactivo" sin leer la frase entera. */}
              {conflictoForm.length > 0 && (() => {
                const varias = conflictoForm.length > 1
                return (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4,
                    padding: '10px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a',
                  }}>
                    <AlertTriangle size={13} style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, color: '#92400e', lineHeight: 1.5 }}>
                        <strong>{describirPuesto({ cargos: form.cargos, sucursal: form.sucursal, esGlobal: form.esGlobal })}</strong> ya
                        {varias ? ` tiene ${conflictoForm.length} rutas vigentes` : ' tiene una ruta vigente'}:{' '}
                        <strong>{conflictoForm.map(c => c.name).join(', ')}</strong>.
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 9px', marginTop: 8, alignItems: 'baseline' }}>
                        <Momento>Ahora</Momento>
                        <Detalle>
                          Esta se crea en <PildoraAviso estado="borrador" /> y no cambia nada.
                        </Detalle>
                        {/* "Cuando quieras" prometía de más: reactivarla no es libre, es volver a
                            disputar el mismo lugar. Si para entonces hay otra ocupándolo, vuelve
                            a pasar esto mismo. Se dice la condición en vez de la promesa. */}
                        <Momento>Al activarla</Momento>
                        <Detalle>
                          {varias ? 'Esas rutas pasan' : 'Esa ruta pasa'} a <PildoraAviso estado="inactiva" />.{' '}
                          {varias ? 'Podrás volver a activarlas' : 'Podrás volver a activarla'}{' '}
                          {form.esGlobal
                            ? 'cuando ninguna otra sea la ruta general.'
                            : 'cuando el puesto no tenga otra vigente.'}
                        </Detalle>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="pl-modal-footer" style={modal === 'editar' ? { justifyContent: 'space-between' } : undefined}>
              {modal === 'editar' && (
                <button
                  type="button"
                  onClick={handleEditDesign}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                    border: '1.5px solid var(--green)', background: 'var(--green-tint)',
                    color: '#0C2D40', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-tint)'; e.currentTarget.style.color = '#0C2D40' }}
                >
                  <Route size={15} style={{ color: 'currentColor' }} />
                  Editar etapas y tareas
                </button>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
              <button className="pl-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className="pl-btn-save"
                onClick={handleSave}
                disabled={
                  /* Qué es obligatorio lo decide `faltaAlgo`, junto a los campos: a la general
                     solo se le pide el nombre. Acá se suma lo único que es de esta pantalla: que
                     editar sin cambios no haga nada. Una segunda ruta general ya no se bloquea
                     —nace en Borrador, como cualquier ruta cuyo lugar está ocupado. */
                  faltaAlgo(form) ||
                  (modal === 'editar' && originalForm &&
                    form.name === originalForm.name &&
                    form.descripcion === originalForm.descripcion &&
                    form.tipo === originalForm.tipo &&
                    form.sucursal === originalForm.sucursal &&
                    form.area === originalForm.area &&
                    (form.cargos || []).join('|') === (originalForm.cargos || []).join('|'))
                }
              >
                {modal === 'crear' ? 'Crear y diseñar ruta' : 'Guardar cambios'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA DE RUTA */}
      {previewRuta && (
        <RutaFullPreviewModal
          plantilla={(() => {
            // Igual que en el constructor: la ruta general se antepone salvo que esta ruta la haya sacado.
            const globales = (previewRuta.esGlobal || previewRuta._versionPreview || previewRuta.config?.incluirGeneral === false)
              ? [] : getGlobalEtapas(allPlantillas, previewRuta.id)
            return globales.length ? { ...previewRuta, etapasData: [...globales, ...(previewRuta.etapasData || [])] } : previewRuta
          })()}
          responsables={responsables[previewRuta.id] || []}
          canManage={isAdmin || isManager}
          onAddPersona={(persona) => addResponsable(previewRuta.id, persona)}
          onRemovePersona={(name) => removeResponsable(previewRuta.id, name)}
          onClose={() => setPreviewRuta(null)}
          canEdit={previewRuta._versionPreview ? false : canEditRuta(previewRuta)}
          onEdit={previewRuta._versionPreview ? undefined : () => { setActiveJourney({ ...previewRuta, isEditingExisting: true }); setPreviewRuta(null) }}
          /* Los datos se guardan sin cerrar el detalle: se corrige el nombre y se sigue
             mirando el camino, que es para lo que se abrió. Una versión vieja no se toca.

             `desplazadas` llega solo cuando el cambio mueve la ruta a un puesto que ya tenía
             una vigente y eso se confirmó (RN-M60). Escribe sobre la lista completa y no
             sobre la vista filtrada por área, por lo mismo que `cambiarStatus`: la unicidad
             es del sistema, y la ruta que se apaga puede ser de un área que quien edita ni
             siquiera ve. */
          onGuardarDatos={previewRuta._versionPreview ? undefined : (datos, desplazadas = []) => {
            const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const ruta = {
              ...previewRuta,
              ...datos,
              name: datos.name.trim(),
              descripcion: datos.descripcion?.trim() || '',
              updated: 'Ahora',
              updatedFecha: hoy,
            }
            const apagadas = new Set(desplazadas.map(d => d.id))
            setAllPlantillas(allPlantillas.map(p => {
              if (p.id === previewRuta.id) return { ...p, ...ruta }
              return apagadas.has(p.id) ? marcarDesplazada(p, ruta, hoy) : p
            }))
            setPreviewRuta(ruta)
            desplazadas.forEach(d => addFeedEntry(`Ruta "${d.name}" pasó a Inactivo — reemplazada por "${ruta.name}"`))
          }}
        />
      )}

      {/* MODAL HISTORIAL DE VERSIONES */}
      {historialRuta && (() => {
        const versiones = [...(historialRuta.versiones || [])].sort((a, b) => b.v - a.v)
        const countFor = (v) => asignaciones.filter(a => (a.rutaId === historialRuta.id || a.ruta === historialRuta.name) && a.version === v).length
        return (
          <div className="pl-overlay" onClick={() => setHistorialRuta(null)}>
            <div className="pl-modal" style={{ maxWidth: 520, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <History size={15} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15 }}>Historial de versiones</h2>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{historialRuta.name}</div>
                  </div>
                </div>
                <button className="pl-modal-close" onClick={() => setHistorialRuta(null)}><X size={18} /></button>
              </div>
              <div className="pl-modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {versiones.map(ver => {
                  const actual = ver.v === historialRuta.versionActual
                  const n = countFor(ver.v)
                  return (
                    <div key={ver.v} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: actual ? '1.5px solid #0C2D40' : '1px solid var(--border-soft)', background: actual ? '#f8fafc' : '#fff' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0C2D40' }}>v{ver.v}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0C2D40' }}>Versión {ver.v}</span>
                          {actual && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#0C2D40', color: '#fff' }}>Actual</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ver.fecha} · {ver.autor} · {ver.etapas} etapas · {ver.tareas} tareas</div>
                        <div style={{ fontSize: 10.5, color: n > 0 ? '#0C2D40' : 'var(--text-muted)', fontWeight: n > 0 ? 600 : 400, marginTop: 2 }}>{n} {n === 1 ? 'colaborador' : 'colaboradores'} en esta versión</div>
                      </div>
                      <button onClick={() => setPreviewRuta({ ...historialRuta, name: `${historialRuta.name} — v${ver.v}`, etapasData: ver.etapasData, _versionPreview: true })} style={{ height: 30, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-soft)', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0C2D40', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}><Eye size={12} /> Ver</button>
                    </div>
                  )
                })}
                {versiones.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 20 }}>Sin versiones registradas.</div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL ASIGNAR RUTA */}
      {asignarModal && (
        <AsignarRutaModal
          onClose={() => setAsignarModal(null)}
          onConfirm={handleAsignarRuta}
          preselectedRutaId={asignarModal.id}
        />
      )}

      {/* MODAL DE UNICIDAD — el puesto ya tiene ruta vigente (RN-M60) */}
      {activarModal && (
        <ActivarRutaModal
          ruta={activarModal.ruta}
          anteriores={activarModal.anteriores}
          onConfirmar={() => activarRuta(activarModal.ruta, activarModal.anteriores)}
          onCancelar={() => setActivarModal(null)}
        />
      )}

      {/* MODAL CAMBIAR ESTADO */}
      {estadoModal && (
        <CambiarEstadoRutaModal
          ruta={estadoModal}
          plantillas={allPlantillas}
          enCurso={enCursoDe(estadoModal)}
          onConfirmar={aplicarEstado}
          /* Salida del callejón: al borrador vacío le falta una tarea para poder activarse,
             y el constructor es donde se agrega. Va directo, sin pasar por el formulario de
             datos, porque lo que falta no es el nombre ni el cargo. */
          onEditarRuta={() => { setActiveJourney({ ...estadoModal, isEditingExisting: true }); setEstadoModal(null) }}
          onCancelar={() => setEstadoModal(null)}
        />
      )}

      {/* MODAL CONFIRMAR RUTA GENERAL */}
      {rutaGeneralConfirm && (() => {
        const willBeGlobal = !rutaGeneralConfirm.esGlobal
        const anteriorGeneral = willBeGlobal && rutaGeneral && rutaGeneral.id !== rutaGeneralConfirm.id ? rutaGeneral : null
        return (
          <div className="pl-overlay" onClick={() => setRutaGeneralConfirm(null)}>
            <div className="pl-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={15} color="#fff" />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 15 }}>{anteriorGeneral ? 'Ya hay una ruta general' : willBeGlobal ? 'Establecer como ruta general' : 'Quitar como ruta general'}</h2>
                </div>
                <button className="pl-modal-close" onClick={() => setRutaGeneralConfirm(null)}><X size={18} /></button>
              </div>
              {anteriorGeneral ? (
                <>
                  <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                      Solo puede haber <strong>una</strong> ruta general a la vez, y actualmente lo es <strong>"{anteriorGeneral.name}"</strong>.
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 14px', borderRadius: 10,
                      background: '#fffbeb', border: '1px solid #fde68a',
                    }}>
                      <Info size={15} style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11.5, color: '#b45309', lineHeight: 1.6 }}>
                        Para establecer <strong>"{rutaGeneralConfirm.name}"</strong> como ruta general, primero ve a la fila de <strong>"{anteriorGeneral.name}"</strong> y quítala como ruta general desde su menú de acciones.
                      </p>
                    </div>
                  </div>
                  <div className="pl-modal-footer">
                    <button className="pl-btn-save" onClick={() => setRutaGeneralConfirm(null)}>Entendido</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                      {willBeGlobal
                        ? <>Estás por convertir <strong>"{rutaGeneralConfirm.name}"</strong> en la ruta general.</>
                        : <><strong>"{rutaGeneralConfirm.name}"</strong> dejará de ser la ruta general.</>}
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 14px', borderRadius: 10,
                      background: willBeGlobal ? '#f0f9ff' : 'var(--bg-secondary)',
                      border: willBeGlobal ? '1px solid #dbeafe' : '1px solid var(--border-soft)',
                    }}>
                      <Info size={15} style={{ color: willBeGlobal ? '#1e40af' : 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11.5, color: willBeGlobal ? '#1e40af' : 'var(--text-muted)', lineHeight: 1.6 }}>
                        {willBeGlobal
                          ? <><strong>¿Qué es la ruta general?</strong> Sus etapas se insertan, protegidas, al inicio de <strong>todas</strong> las demás rutas activas. Todo colaborador que reciba cualquier ruta también recibirá primero estas etapas — ideal para contenido obligatorio para toda la empresa, como cultura, bienvenida o políticas generales.</>
                          : <>Sus etapas dejarán de insertarse automáticamente en las demás rutas. Las rutas que ya las incluían mantendrán su contenido actual hasta que las edites.</>}
                      </p>
                    </div>
                  </div>
                  <div className="pl-modal-footer">
                    <button className="pl-btn-cancel" onClick={() => setRutaGeneralConfirm(null)}>Cancelar</button>
                    <button className="pl-btn-save" onClick={() => toggleGlobal(rutaGeneralConfirm)}>
                      {willBeGlobal ? 'Establecer como ruta general' : 'Quitar como ruta general'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* MODAL ELIMINAR */}
      {deleteTarget && (() => {
        const asignadosCount = vecesAsignada(deleteTarget)
        const bloqueada = asignadosCount > 0
        /* Cuando la ruta ya se asignó no hay borrado que confirmar: el diálogo explica por qué
           no se puede y ofrece Inactivo, que es reversible. Por eso no usa el modal destructivo. */
        if (!bloqueada) {
          return (
            <ConfirmarAccionModal
              titulo="Eliminar ruta"
              descripcion={<>¿Estás seguro de eliminar <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.</>}
              palabra="eliminar"
              textoConfirmar="Eliminar"
              onConfirmar={handleDelete}
              onCancelar={() => setDeleteTarget(null)}
              icono={AlertTriangle}
            />
          )
        }
        return (
          <div className="pl-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="pl-modal pl-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="pl-modal-body" style={{ textAlign: 'center', padding: '32px 28px 20px' }}>
                <div className="pl-del-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                  <ToggleLeft size={26} />
                </div>
                <h2 className="pl-del-title">No se puede eliminar</h2>
                <p className="pl-del-desc">
                  Ya se asignó a <strong>{asignadosCount}</strong> {asignadosCount === 1 ? 'colaborador' : 'colaboradores'}, así que forma parte de su historial: borrarla dejaría esos procesos apuntando a una ruta que no existe. Ponla en <strong>Inactivo</strong> y deja de asignarse, sin perder el registro.
                </p>
              </div>
              <div className="pl-modal-footer" style={{ justifyContent: 'center' }}>
                <button className="pl-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button
                  className="pl-btn-save"
                  onClick={() => {
                    cambiarStatus(deleteTarget.id, 'inactiva')
                    addFeedEntry(`Ruta "${deleteTarget.name}" pasó a Inactivo`)
                    setDeleteTarget(null)
                  }}
                >
                  Poner en Inactivo
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL ETAPAS */}
      {etapasModal && (() => {
        const etapasData = {
          1: ['Mi primera semana', 'Conoce Ventas', 'Primer mes'],
          2: ['Inducción comercial', 'Producto y clientes', 'Autonomía'],
          3: ['Liderazgo corporativo', 'Gestión de equipos', 'Plan estratégico'],
          5: ['Setup técnico', 'Arquitectura', 'Código y deploy', 'Certificación'],
        }
        const list = etapasData[etapasModal.id] || Array.from({ length: etapasModal.etapas }, (_, i) => `Etapa ${i + 1}`)
        return (
          <div className="pl-overlay" onClick={() => setEtapasModal(null)}>
            <div className="pl-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 15 }}>Etapas</h2>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{etapasModal.name}</span>
                </div>
                <button className="pl-modal-close" onClick={() => setEtapasModal(null)}><X size={18} /></button>
              </div>
              <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {list.map((etapa, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                    borderBottom: i < list.length - 1 ? '1px solid var(--surface-hover)' : 'none',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0C2D40' }}>{etapa}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Día {i * 7 + 1} — Día {(i + 1) * 7}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL TAREAS */}
      {tareasModal && (() => {
        const tareasData = {
          1: [
            { name: 'Recorrido presencial', tipo: 'Recorrido', obligatoria: true },
            { name: 'Video "Así trabajamos"', tipo: 'Video', obligatoria: false },
            { name: 'Evaluación — Conoce tu área', tipo: 'Prueba', obligatoria: true },
            { name: 'Manual de funciones', tipo: 'Documento', obligatoria: false },
            { name: 'Demo del producto', tipo: 'Video', obligatoria: true },
            { name: 'Tutorial CRM', tipo: 'Video', obligatoria: true },
            { name: 'Práctica en CRM', tipo: 'Formulario', obligatoria: true },
            { name: 'Prueba de producto', tipo: 'Prueba', obligatoria: true },
          ],
          5: [
            { name: 'Setup de entorno', tipo: 'Documento', obligatoria: true },
            { name: 'Arquitectura del sistema', tipo: 'Video', obligatoria: true },
            { name: 'Primer PR', tipo: 'Tarea', obligatoria: true },
            { name: 'Code review', tipo: 'Tarea', obligatoria: true },
            { name: 'Deploy a staging', tipo: 'Tarea', obligatoria: true },
            { name: 'Evaluación técnica', tipo: 'Prueba', obligatoria: true },
          ],
        }
        const list = tareasData[tareasModal.id] || Array.from({ length: Math.min(tareasModal.tareas, 8) }, (_, i) => ({ name: `Tarea ${i + 1}`, tipo: 'Tarea', obligatoria: i % 2 === 0 }))
        const tipoColor = { Video: '#3b82f6', Prueba: '#f59e0b', Documento: '#f97316', Recorrido: '#d946ef', Formulario: '#10b981', Tarea: '#64748b' }
        return (
          <div className="pl-overlay" onClick={() => setTareasModal(null)}>
            <div className="pl-modal" style={{ maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 15 }}>Tareas</h2>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{tareasModal.name} · {tareasModal.tareas} tareas</span>
                </div>
                <button className="pl-modal-close" onClick={() => setTareasModal(null)}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 16px' }}>
                {list.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    borderBottom: i < list.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: tipoColor[t.tipo] || '#94a3b8', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0C2D40' }}>{t.name}</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                      background: `${tipoColor[t.tipo] || '#94a3b8'}12`, color: tipoColor[t.tipo] || '#94a3b8',
                    }}>{t.tipo}</span>
                    {t.obligatoria && (
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '2px 5px', borderRadius: 4 }}>Req.</span>
                    )}
                  </div>
                ))}
                {tareasModal.tareas > list.length && (
                  <div style={{ padding: '10px 0', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    +{tareasModal.tareas - list.length} tareas más
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL ASIGNADOS */}
      {asignadosModal && (() => {
        const asignadosData = {
          1: [
            { name: 'Camila Herrera', cargo: 'Pasante Comercial', area: 'Ventas', pct: 42, initials: 'CH', color: '#f97316' },
            { name: 'Sofía Ramírez', cargo: 'Pasante Comercial', area: 'Ventas', pct: 0, initials: 'SR', color: '#f59e0b' },
            { name: 'Nicolás Paredes', cargo: 'Pasante Comercial', area: 'Ventas', pct: 73, initials: 'NP', color: '#0d9488' },
            { name: 'Andrea Ríos', cargo: 'Pasante Comercial', area: 'Ventas', pct: 35, initials: 'AR', color: '#06b6d4' },
            { name: 'Pablo Guzmán', cargo: 'Pasante Comercial', area: 'Ventas', pct: 88, initials: 'PG', color: '#8b5cf6' },
            { name: 'Laura Mendoza', cargo: 'Pasante Comercial', area: 'Ventas', pct: 15, initials: 'LM', color: '#ec4899' },
            { name: 'Martín Castro', cargo: 'Pasante Comercial', area: 'Ventas', pct: 60, initials: 'MC', color: '#10b981' },
            { name: 'Valentina Rojas', cargo: 'Pasante Comercial', area: 'Ventas', pct: 100, initials: 'VR', color: '#d946ef' },
          ],
          2: [
            { name: 'Isabella Vargas', cargo: 'Ejecutivo Comercial', area: 'Comercial', pct: 55, initials: 'IV', color: '#8b5cf6' },
            { name: 'Emilio Castañeda', cargo: 'Ejecutivo Comercial', area: 'Comercial', pct: 20, initials: 'EC', color: '#3b82f6' },
          ],
          5: [
            { name: 'Diego Morales', cargo: 'Desarrollador Backend', area: 'Tecnología', pct: 68, initials: 'DM', color: '#3b82f6' },
            { name: 'Facundo Medina', cargo: 'Desarrollador Backend', area: 'Tecnología', pct: 15, initials: 'FM', color: '#ef4444' },
            { name: 'Renata Soria', cargo: 'Frontend Developer', area: 'Tecnología', pct: 30, initials: 'RS', color: '#8b5cf6' },
            { name: 'Andrés Villanueva', cargo: 'Backend Developer', area: 'Tecnología', pct: 10, initials: 'AV', color: '#06b6d4' },
          ],
        }
        const list = asignadosData[asignadosModal.id] || [{ name: 'Colaborador asignado', cargo: asignadosModal.cargo || '', area: asignadosModal.area, pct: 50, initials: 'CA', color: 'var(--text-muted)' }]
        const filtered = list.filter(u => u.name.toLowerCase().includes(asignadosSearch.toLowerCase()) || u.cargo.toLowerCase().includes(asignadosSearch.toLowerCase()))

        return (
          <div className="pl-overlay" onClick={() => { setAsignadosModal(null); setAsignadosSearch('') }}>
            <div className="pl-modal" style={{ maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="pl-modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 15 }}>Colaboradores asignados</h2>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{asignadosModal.name} · {list.length} persona{list.length !== 1 ? 's' : ''}</span>
                </div>
                <button className="pl-modal-close" onClick={() => { setAsignadosModal(null); setAsignadosSearch('') }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '12px 24px 0' }}>
                <div className="pl-search-wrap" style={{ flex: 'none' }}>
                  <Search size={13} className="pl-search-ico" />
                  <input type="text" className="pl-search" placeholder="Buscar colaborador..." value={asignadosSearch} onChange={e => setAsignadosSearch(e.target.value)} />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtered.map((u, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, background: '#fff',
                    borderBottom: '1px solid #f8fafc',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: u.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{u.initials}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0C2D40' }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.cargo}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: u.pct === 100 ? '#00E091' : '#0C2D40' }}>{u.pct}%</div>
                      <div style={{
                        width: 50, height: 4, borderRadius: 99, background: 'var(--surface-hover)', marginTop: 3,
                      }}>
                        <div style={{
                          height: '100%', width: `${u.pct}%`, borderRadius: 99,
                          background: u.pct === 100 ? '#00E091' : u.pct > 50 ? '#3b82f6' : '#f59e0b',
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>No se encontraron colaboradores</div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
