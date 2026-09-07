import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useRutaActiva } from '../../context/RutaActivaContext'
import { useConfig } from '../../context/ConfigContext'
import {
  CheckCircle2, Lock, Star, Trophy, Clock, Calendar,
  Video, Headphones, FileText, HelpCircle, Upload,
  ClipboardList, UserCheck, MapPin, ShieldCheck,
  ExternalLink, X, Route, Info, Rocket,
  Play, Download, ChevronRight,
  Send, Award, PackageOpen, ArrowLeft, Bot, Smile, Network, IdCard, History
} from 'lucide-react'
import { toEmbedUrl } from '../../utils/tareaTipos'
import { useArchivoLocal } from '../../hooks/useArchivoLocal'
import HistorialOnboardingModal from '../../components/onboarding/HistorialOnboardingModal'
import { historialDe } from '../../data/historialIncorporaciones'
import viaBebe from '../../assets/imagenes/via_bebe.webp'
import viaAntiguo from '../../assets/imagenes/via_colaborador_antiguo.webp'
import manualPdf from '../../assets/documentos/manual_funciones.pdf'
import viaContinuar from '../../assets/imagenes/continuar_via.webp'
import viaTrofeo from '../../assets/imagenes/via_trofeo.webp'
import trofeoImg from '../../assets/imagenes/trofeo_onboarding.webp'

const viaHuevo = viaBebe

const iconMap = {
  video: Video, audio: Headphones, documento: FileText,
  quiz: HelpCircle, 'completar-perfil': ClipboardList,
  subida: Upload, 'tarea-otro': UserCheck,
  recorrido: MapPin, lectura: FileText,
  enlace: ExternalLink, 'form-custom': ClipboardList, confirmacion: Trophy,
  pulso: Smile, perfil: IdCard,
}

const colorMap = {
  video: '#3b82f6', audio: '#06b6d4', documento: '#f97316',
  quiz: '#f59e0b', 'completar-perfil': '#10b981', subida: '#ec4899',
  'tarea-otro': '#ef4444', recorrido: '#d946ef',
  lectura: '#f97316', enlace: '#6366f1',
  'form-custom': '#10b981', confirmacion: '#f59e0b',
  pulso: '#f472b6', perfil: '#8b5cf6',
}

const PERFIL_TABS = [
  { key: 'personales', label: 'Datos personales' },
  { key: 'laboral', label: 'Información laboral' },
  { key: 'preferencias', label: 'Preferencias personales' },
  { key: 'documentacion', label: 'Documentación' },
]
const PERFIL_SECCIONES = {
  personales: ['Datos de acceso', 'Datos de documento de identidad', 'Datos personales', 'Datos de residencia', 'Contactos de emergencia', 'Datos personales de salud'],
  laboral: ['Datos laborales básicos', 'Datos de contrato', 'Datos de pago'],
  preferencias: ['Uniforme', 'Lista de deseos para cumpleaños', 'Habilidades'],
  documentacion: ['Foto del empleado', 'Contrato', 'Documento de identidad'],
}
const PERFIL_TOTAL_SECCIONES = Object.values(PERFIL_SECCIONES).reduce((s, arr) => s + arr.length, 0)

function flatTareas(etapa) {
  return etapa.actividades.flatMap(a => a.tareas)
}

const chatResponses = {
  '¿Qué tareas me faltan?': 'Según tu ruta actual, te faltan las tareas de la etapa "Conoce Ventas" y "Primer mes". La siguiente tarea pendiente es "Demo del producto". ¡Ánimo, vas bien!',
  '¿Qué dice el manual de funciones?': 'El Manual de funciones describe las responsabilidades, procesos y lineamientos de tu cargo. Incluye tus funciones principales, a quién reportas y los indicadores de desempeño. Lo encuentras en tu actividad "Tu equipo clave".',
  '¿Cuándo termina mi onboarding?': 'Tu onboarding tiene una duración de 30 días. Según tu fecha de inicio, terminarías aproximadamente el 20 de julio de 2026. Recuerda completar todas las tareas obligatorias para graduarte.',
  '¿Quién es mi líder de área?': 'Tu líder de área es quien te acompaña durante el onboarding y valida ciertas tareas como el recorrido presencial y la primera llamada real. Si tienes dudas, puedes consultarle directamente.',
  '¿Qué pasa si no completo una tarea a tiempo?': 'No te preocupes, las tareas no tienen fecha límite estricta. Sin embargo, si pasas más de 3 días sin actividad, tu estado cambiará a "en riesgo" y tu líder recibirá una notificación.',
}
const chatSuggestions = Object.keys(chatResponses)

/* Los dos accesos del rail superior. Se escriben una vez porque aparecen en cuatro lugares
   —bienvenida y barra, en escritorio y en teléfono— y ahí es donde se desincronizan. */
function AccionesCabecera({ compact = false, onHistorial, onOrganigrama }) {
  const s = compact
    ? { gap: 4, pad: '5px 9px', font: 7.5, icono: 9, radio: 14, sep: 4 }
    : { gap: 6, pad: '7px 14px', font: 12, icono: 14, radio: 20, sep: 8 }

  const base = {
    display: 'flex', alignItems: 'center', gap: s.gap, whiteSpace: 'nowrap',
    background: '#fff', color: '#0C2D40', border: '1px solid #e2e8f0',
    borderRadius: s.radio, padding: s.pad,
    fontSize: s.font, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 6px rgba(12,45,64,.08)', transition: 'all .15s',
  }
  const entrar = e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }
  const salir = e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.sep }}>
      <button style={base} onClick={onHistorial} onMouseEnter={entrar} onMouseLeave={salir}>
        <History size={s.icono} />
        {compact ? 'Historial' : 'Ver historial'}
      </button>
      <button style={base} onClick={onOrganigrama} onMouseEnter={entrar} onMouseLeave={salir}>
        <Network size={s.icono} />
        {compact ? 'Organigrama' : 'Ver organigrama'}
      </button>
    </div>
  )
}

export default function MiOnboarding({ forcePhone = false }) {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const { rutaActiva, rutaGraduado, rutaAdmin, actualizarEtapas } = useRutaActiva()
  const { asistenteIA } = useConfig()
  const isMobile = forcePhone || currentUser.mobile === true

  // El buddy es un colaborador que ya se graduó: en "Mi Onboarding" ve su ruta completada,
  // no la vista de administrador. En el celular vale la misma regla — el hub le anuncia la
  // tarjeta como "Completado", así que adentro no puede aparecerle una ruta a medio hacer.
  const esColaboradorOBuddy = currentUser.role === 'colaborador' || currentUser.role === 'buddy'
  const ruta = (forcePhone || esColaboradorOBuddy)
    ? (currentUser.onbGraduado ? rutaGraduado : rutaActiva)
    : rutaAdmin
  const isGraduado = ruta?.graduado === true
  const readOnly = isGraduado

  const [etapas, setEtapas] = useState([])
  const [started, setStarted] = useState(false)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [loadedRuta, setLoadedRuta] = useState(null)
  const [selTarea, setSelTarea] = useState(null)
  /* Copia local del archivo que subió RH, si la hay. Va al tope porque el contenido de la tarea
     se arma dentro de un switch y ahí un hook cambiaría de orden entre renders. */
  const archivoTareaUrl = useArchivoLocal(selTarea?._kbItem?.archivo)
  const [recorridoStops, setRecorridoStops] = useState({})
  const [showAlert, setShowAlert] = useState(false)
  const [quizStarted, setQuizStarted] = useState({})
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState({})
  const [videoEnded, setVideoEnded] = useState({})
  const [pulsoRespuestas, setPulsoRespuestas] = useState({})
  const [pulsoComentario, setPulsoComentario] = useState({})
  const [pulsoSubmitted, setPulsoSubmitted] = useState({})
  const [formRespuestas, setFormRespuestas] = useState({})
  const [formSubmitted, setFormSubmitted] = useState({})
  const [perfilTab, setPerfilTab] = useState({})
  const [perfilProgress, setPerfilProgress] = useState({})
  const [perfilSubmitted, setPerfilSubmitted] = useState({})
  const [selContext, setSelContext] = useState(null)
  const [etapasOpen, setEtapasOpen] = useState(true)
  const [infoOpen, setInfoOpen] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: '¡Hola! Soy tu asistente de onboarding. Puedo ayudarte con dudas sobre tus tareas, documentos y procesos. ¿En qué te puedo ayudar?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatTyping, setChatTyping] = useState(false)
  const chatEndRef = useRef(null)

  if (ruta && ruta !== loadedRuta) {
    const mapped = ruta.etapas.map((e, i) => ({
      ...e,
      status: i === 0 ? 'current' : 'locked',
      actividades: e.actividades.map(a => ({
        ...a,
        tareas: a.tareas.map(t => ({ ...t, done: t.done || false })),
      })),
    }))
    setEtapas(mapped)
    setLoadedRuta(ruta)
    setStarted(false)
    setSelTarea(null)
    setSelContext(null)
    setQuizStarted({})
    setQuizAnswers({})
    setQuizSubmitted({})
    setRecorridoStops({})
    setVideoEnded({})
    setPulsoRespuestas({})
    setPulsoComentario({})
    setPulsoSubmitted({})
    setFormRespuestas({})
    setFormSubmitted({})
    setPerfilTab({})
    setPerfilProgress({})
    setPerfilSubmitted({})
  }

  function sendChat(text) {
    const msg = text || chatInput.trim()
    if (!msg) return
    setChatMessages(prev => [...prev, { from: 'user', text: msg }])
    setChatInput('')
    setChatTyping(true)
    setTimeout(() => {
      const response = chatResponses[msg] || 'Busqué en la biblioteca de recursos pero no encontré información específica sobre eso. Te recomiendo consultar con tu líder de área o revisar los documentos en tu ruta de onboarding.'
      setChatMessages(prev => [...prev, { from: 'bot', text: response }])
      setChatTyping(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, 1200)
  }

  const etapaRefs = useRef({})
  const setEtapaRef = useCallback((ei, el) => { etapaRefs.current[ei] = el }, [])

  const totalPuntos = etapas.flatMap(e => flatTareas(e)).filter(t => t.done).reduce((s, t) => s + t.puntos, 0)
  const totalDone = etapas.flatMap(e => flatTareas(e)).filter(t => t.done).length
  const totalAll = etapas.flatMap(e => flatTareas(e)).length
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  function scrollToEtapa(ei) {
    const el = etapaRefs.current[ei]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function launchConfetti() {
    const colors = ['#00E091', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#0C2D40']
    const pieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 1.5,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      type: Math.random() > 0.5 ? 'rect' : 'circle',
    }))
    setConfettiPieces(pieces)
    setTimeout(() => setConfettiPieces([]), 4000)
  }

  function toggleDone(tareaId) {
    if (readOnly) return
    const next = etapas.map(et => ({
      ...et,
      actividades: et.actividades.map(a => ({
        ...a,
        tareas: a.tareas.map(t => t.id === tareaId ? { ...t, done: !t.done } : t),
      })),
    }))
    setEtapas(next)
    const allTareas = next.flatMap(e => flatTareas(e))
    const allDone = allTareas.length > 0 && allTareas.every(t => t.done)
    if (allDone) {
      setTimeout(() => { setShowCelebration(true); launchConfetti() }, 300)
    }
    if (currentUser.role === 'colaborador') actualizarEtapas(next)
  }

  // Carga la API de YouTube y detecta cuándo el colaborador termina de ver un video
  useEffect(() => {
    if (!selTarea || selTarea.tipo !== 'video' || selTarea.done || readOnly) return
    const tid = selTarea.id
    let player = null
    let cancelled = false

    function createPlayer() {
      if (cancelled) return
      const el = document.getElementById(`yt-player-${tid}`)
      if (!el || !window.YT || !window.YT.Player) return
      player = new window.YT.Player(el, {
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setVideoEnded(prev => ({ ...prev, [tid]: true }))
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      createPlayer()
    } else {
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script')
        tag.id = 'youtube-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prevReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prevReady?.(); createPlayer() }
    }

    return () => {
      cancelled = true
      player?.destroy?.()
    }
  }, [selTarea?.id, selTarea?.tipo, selTarea?.done, readOnly])

  // Completa automáticamente la tarea de video cuando terminó de reproducirse y (si corresponde) ya se envió la evaluación
  useEffect(() => {
    if (!selTarea || selTarea.tipo !== 'video' || selTarea.done || readOnly) return
    const tid = selTarea.id
    if (!videoEnded[tid]) return
    const hasQuiz = selTarea.verificarQuiz !== false
    if (hasQuiz && !quizSubmitted[tid]) return
    toggleDone(tid)
    setSelTarea(prev => (prev ? { ...prev, done: true } : prev))
  }, [videoEnded, quizSubmitted, selTarea?.id, selTarea?.done, readOnly])

  const positions = [0, 60, 90, 60, 0, -60, -90, -60]
  const firstName = currentUser.name.split(' ')[0]

  const procesos = historialDe(currentUser.id)
  const abrirHistorial = () => setHistorialAbierto(true)
  const irAlOrganigrama = () => navigate('/personas/organigrama')

  /* En el teléfono el historial no puede ser un modal `fixed`: taparía el escritorio entero
     en vez del marco. Se muestra como pantalla propia dentro del celular. */
  if (historialAbierto && isMobile) {
    return (
      <HistorialOnboardingModal
        procesos={procesos}
        nombre={currentUser.name}
        compact
        onCerrar={() => setHistorialAbierto(false)}
      />
    )
  }

  const modalHistorial = historialAbierto ? (
    <HistorialOnboardingModal
      procesos={procesos}
      nombre={currentUser.name}
      onCerrar={() => setHistorialAbierto(false)}
    />
  ) : null

  if (currentUser.onbNA) {
    // En el teléfono la pantalla de escritorio no entra: la mascota sola mide 200px.
    if (isMobile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px 10px', minHeight: '100%' }}>
          <img src={viaAntiguo} alt="Mascota" style={{ width: 66, marginBottom: 10 }} />
          <h1 style={{ fontSize: 12, fontWeight: 800, color: '#0C2D40', margin: '0 0 5px' }}>¡Hola, {firstName}!</h1>
          <p style={{ fontSize: 7, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5, maxWidth: 190 }}>
            Este módulo es para nuevos colaboradores en proceso de incorporación. Como ya eres parte del equipo, no tienes tareas pendientes aquí.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 9,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
          }}>
            <CheckCircle2 size={11} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 7.5, color: '#166534', fontWeight: 700 }}>Sin tareas pendientes</span>
          </div>
        </div>
      )
    }
    return (
      <div className="jb">
        <div className="jb-panels">
          <div className="jb-canvas">
            <div className="jb-canvas-body jb-pizarra" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
              <div className="jb-welcome-screen">
                <div className="jb-welcome-hero">
                  <div className="jb-welcome-text">
                    <h1 className="jb-welcome-title">¡Hola, {firstName}!</h1>
                    <p className="jb-welcome-desc" style={{ maxWidth: 420 }}>
                      Este módulo es para nuevos colaboradores que están en proceso de incorporación. Como ya eres parte del equipo, no tienes tareas pendientes aquí.
                    </p>
                    {/* Del tema y no escrito a mano: en oscuro, un verde clarito de tema claro
                        se convierte en una pastilla blanca flotando sobre la pizarra. */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 18px', borderRadius: 12,
                      background: 'var(--green-bg)', border: '1px solid var(--green)',
                      marginTop: 8,
                    }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 600 }}>Sin tareas pendientes</span>
                    </div>
                  </div>
                  <img src={viaAntiguo} alt="Mascota" className="jb-welcome-mascot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!ruta) {
    return (
      <div className="jb">
        <div className="jb-panels">
          <div className="jb-canvas">
            <div className="jb-canvas-body jb-pizarra" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
              <div className="jb-welcome-screen">
                <div className="jb-welcome-hero">
                  <div className="jb-welcome-text">
                    <h1 className="jb-welcome-title">¡Hola, {firstName}!</h1>
                    <p className="jb-welcome-desc" style={{ maxWidth: 400 }}>
                      Tu ruta de onboarding aún no ha sido configurada por el equipo de Recursos Humanos. Pronto recibirás tu recorrido personalizado.
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 18px', borderRadius: 12,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      marginTop: 8,
                    }}>
                      <PackageOpen size={20} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>Esperando asignación de ruta...</span>
                    </div>
                  </div>
                  <img src={viaHuevo} alt="Via en su huevo" className="jb-welcome-mascot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if ((isGraduado || (totalAll > 0 && totalDone === totalAll)) && !started) {
    /* La versión de celular es la misma de "¡Hola!" con el trofeo: la portada de escritorio
       se apoya en un hero de dos columnas que a 280 px se sale del marco. Antes no se veía
       porque en teléfono nadie llegaba graduado — el buddy es el primero. */
    if (isMobile) {
      return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', textAlign: 'center', minHeight: '100%' }}>
          {modalHistorial}
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <AccionesCabecera compact onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
          </div>
          <img src={viaTrofeo} alt="Mascota graduada" style={{ width: 60, marginBottom: 10 }} />
          <h1 style={{ fontSize: 14, fontWeight: 800, color: '#0C2D40', margin: '0 0 4px' }}>¡Felicidades, {firstName}!</h1>
          <p style={{ fontSize: 8, color: '#64748b', margin: '0 0 12px', lineHeight: 1.4 }}>
            Completaste todas las etapas de tu ruta. Aquí puedes revisar tu recorrido cuando quieras.
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { val: `${totalAll}/${totalAll}`, label: 'tareas', bg: '#00E091' },
              { val: totalPuntos, label: 'Pts', bg: '#f59e0b' },
              { val: '100%', label: 'completado', bg: '#0C2D40' },
            ].map(p => (
              <div key={p.label} style={{
                background: p.bg, borderRadius: 8, padding: '6px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.val}</span>
                <span style={{ fontSize: 6, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStarted(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#0C2D40', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 9, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Trophy size={10} />
            Ver mi ruta completada
          </button>
        </div>
      )
    }
    return (
      <div className="jb">
        <div className="jb-panels">
          <div className="jb-canvas">
            <div className="jb-canvas-body jb-pizarra" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
              {modalHistorial}
              <div style={{ position: 'absolute', top: isMobile ? 8 : 20, right: isMobile ? 8 : 24, zIndex: 2 }}>
                <AccionesCabecera compact={isMobile} onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
              </div>
              <div className="jb-welcome-screen">
                <div className="jb-welcome-hero">
                  <div className="jb-welcome-text">
                    <h1 className="jb-welcome-title">¡Felicidades, {firstName}!</h1>
                    <p className="jb-welcome-desc" style={{ maxWidth: 400 }}>
                      Has completado todas las etapas de tu ruta de onboarding. Aquí puedes revisar tu recorrido cuando quieras.
                    </p>
                    <div className="jb-welcome-stats">
                      <div className="jb-welcome-pill" style={{ background: '#00E091' }}>
                        <span className="jb-welcome-pill-num">{totalAll}/{totalAll}</span>
                        <span className="jb-welcome-pill-label">tareas</span>
                      </div>
                      <div className="jb-welcome-pill" style={{ background: '#f59e0b' }}>
                        <span className="jb-welcome-pill-num">{totalPuntos}</span>
                        <span className="jb-welcome-pill-label">Pts</span>
                      </div>
                      <div className="jb-welcome-pill" style={{ background: '#0C2D40' }}>
                        <span className="jb-welcome-pill-num">100%</span>
                        <span className="jb-welcome-pill-label">completado</span>
                      </div>
                    </div>
                    <button className="jb-welcome-btn" onClick={() => setStarted(true)}>
                      <Trophy size={16} />
                      Ver mi ruta completada
                    </button>
                  </div>
                  <img src={viaTrofeo} alt="Via graduado" className="jb-welcome-mascot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!started && totalDone === 0) {
    if (isMobile) {
      return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', textAlign: 'center', minHeight: '100%' }}>
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <AccionesCabecera compact onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
          </div>
          <img src={viaBebe} alt="Mascota" style={{ width: 60, marginBottom: 10 }} />
          <h1 style={{ fontSize: 14, fontWeight: 800, color: '#0C2D40', margin: '0 0 4px' }}>¡Hola, {firstName}!</h1>
          <p style={{ fontSize: 8, color: '#64748b', margin: '0 0 12px', lineHeight: 1.4 }}>
            Tu aventura comienza aquí. Recorrido paso a paso para integrarte.
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { val: etapas.length, label: 'etapas', bg: '#0C2D40' },
              { val: totalAll, label: 'tareas', bg: '#00E091' },
              { val: etapas.flatMap(e => flatTareas(e)).reduce((s, t) => s + t.puntos, 0), label: 'Puntos', bg: '#f59e0b' },
            ].map(p => (
              <div key={p.label} style={{
                background: p.bg, borderRadius: 8, padding: '6px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.val}</span>
                <span style={{ fontSize: 6, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setStarted(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#0C2D40', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 9, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Rocket size={10} />
              Empezar mi onboarding
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="jb">
        <div className="jb-panels">
          <div className="jb-canvas">
            <div className="jb-canvas-body jb-pizarra" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
              {modalHistorial}
              <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 2 }}>
                <AccionesCabecera onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
              </div>
              <div className="jb-welcome-screen">
                <div className="jb-welcome-hero">
                  <div className="jb-welcome-text">
                    <h1 className="jb-welcome-title">¡Hola, {firstName}!</h1>
                    <p className="jb-welcome-desc">
                      Tu aventura en el equipo comienza aquí.
                      Hemos preparado un recorrido paso a paso para que te integres rápidamente.
                    </p>
                    <div className="jb-welcome-stats">
                      <div className="jb-welcome-pill" style={{ background: '#0C2D40' }}>
                        <span className="jb-welcome-pill-num">{etapas.length}</span>
                        <span className="jb-welcome-pill-label">etapas</span>
                      </div>
                      <div className="jb-welcome-pill" style={{ background: '#00E091' }}>
                        <span className="jb-welcome-pill-num">{totalAll}</span>
                        <span className="jb-welcome-pill-label">tareas</span>
                      </div>
                      <div className="jb-welcome-pill" style={{ background: '#f59e0b' }}>
                        <span className="jb-welcome-pill-num">{etapas.flatMap(e => flatTareas(e)).reduce((s, t) => s + t.puntos, 0)}</span>
                        <span className="jb-welcome-pill-label">Pts</span>
                      </div>
                    </div>
                    <button className="jb-welcome-btn" onClick={() => setStarted(true)}>
                      <Rocket size={16} />
                      Empezar mi onboarding
                    </button>
                  </div>
                  <img src={viaBebe} alt="Mascota" className="jb-welcome-mascot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!started && totalDone > 0) {
    const nextTarea = etapas.flatMap(e => flatTareas(e)).find(t => !t.done)
    const NextIcon = nextTarea ? (iconMap[nextTarea.tipo] || FileText) : null
    const nextColor = nextTarea ? (colorMap[nextTarea.tipo] || '#94a3b8') : null
    return (
      <div className="jb">
        <div className="jb-panels">
          <div className="jb-canvas">
            <div className="jb-canvas-body jb-pizarra" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
              {modalHistorial}
              <div style={{ position: 'absolute', top: isMobile ? 8 : 20, right: isMobile ? 8 : 24, zIndex: 2 }}>
                <AccionesCabecera compact={isMobile} onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
              </div>
              <div style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <img src={viaContinuar} alt="Mascota" style={{ width: 90, height: 'auto' }} />
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0C2D40', margin: '0 0 6px' }}>¡Bienvenida de vuelta, {firstName}!</h1>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>Aquí tienes un resumen de tu progreso</p>
                </div>

                {/* Barra de progreso */}
                <div style={{
                  width: '100%', padding: '16px 20px', borderRadius: 12,
                  background: '#fff', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0C2D40' }}>{totalDone} de {totalAll} tareas</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#00E091' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#00E091', borderRadius: 99, transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{totalPuntos} Puntos ganados</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{totalAll - totalDone} pendientes</span>
                  </div>
                </div>

                {/* Siguiente tarea */}
                {nextTarea && (
                  <div style={{
                    width: '100%', padding: '14px 18px', borderRadius: 12,
                    background: '#fff', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${nextColor}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <NextIcon size={16} style={{ color: nextColor }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Siguiente tarea</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0C2D40', marginTop: 2 }}>{nextTarea.name}</div>
                    </div>
                    {nextTarea.puntos > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>+{nextTarea.puntos} Pts</span>
                    )}
                  </div>
                )}

                <button className="jb-welcome-btn" onClick={() => setStarted(true)}>
                  <Rocket size={16} />
                  Continuar mi onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selTarea && isMobile) {
    const Icon = iconMap[selTarea.tipo] || FileText
    const color = colorMap[selTarea.tipo] || '#94a3b8'

    const renderMobileContent = () => {
      switch (selTarea.tipo) {
        case 'video': {
          /* Tres casos distintos, y antes se atendía uno solo:
             1. La tarea tiene contenido con URL (enlace pegado o recurso enlazado) → se muestra ESE
                video. Antes se ignoraba: quien pegaba un link de YouTube en la ruta veía igual el
                video de ejemplo.
             2. La tarea apunta a un archivo subido (sin URL, porque el prototipo no lo aloja) → se
                dice que no se puede reproducir todavía. Mostrar el de ejemplo sería peor que no
                mostrar nada: el colaborador vería un video ajeno creyendo que es el de su empresa.
             3. La tarea no tiene contenido configurado (las rutas sembradas de la demo) → se
                mantiene el video de ejemplo, que es lo que hace demostrable la pantalla. */
          const contenidoUrl = selTarea.enlace || selTarea._kbItem?.url || selTarea.videoUrl
          const archivoSubido = !contenidoUrl && !!selTarea._kbItem
          const embedUrl = contenidoUrl || 'https://www.youtube.com/embed/WnD2H9rHNec'
          const videoId = toEmbedUrl(embedUrl).match(/embed\/([a-zA-Z0-9_-]+)/)?.[1] || 'WnD2H9rHNec'
          const hasQuiz = selTarea.verificarQuiz !== false
          const quizQuestions = [
            { id: 1, texto: '¿Cuál es el objetivo principal del video?', opciones: ['Aumentar las ventas', 'Dar la bienvenida al equipo', 'Presentar el producto', 'Explicar las políticas'], correcta: 1 },
            { id: 2, texto: '¿Qué valor se destaca como fundamental?', opciones: ['Competitividad', 'Innovación', 'Trabajo en equipo', 'Velocidad'], correcta: 2 },
            { id: 3, texto: '¿Qué se espera del colaborador?', opciones: ['Trabajar horas extra', 'Compromiso y proactividad', 'Solo cumplir tareas', 'Reportar diariamente'], correcta: 1 },
          ]
          const tid = selTarea.id
          const isQuizStarted = !!quizStarted[tid]
          const isQuizDone = readOnly || !!quizSubmitted[tid]
          const answers = quizAnswers[tid] || {}
          const allAnswered = quizQuestions.every((_, i) => answers[i] !== undefined)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {archivoSubido && archivoTareaUrl ? (
                <div style={{ borderRadius: 8, overflow: 'hidden', background: '#0f172a' }}>
                  <video controls src={archivoTareaUrl} style={{ width: '100%', display: 'block' }} />
                </div>
              ) : archivoSubido ? (
                <div style={{ borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '18px 14px', textAlign: 'center' }}>
                  <Video size={22} style={{ color: '#94a3b8', margin: '0 auto 7px', display: 'block' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0C2D40' }}>{selTarea._kbItem.name}</div>
                  {/* Describe el estado y da una salida; no promete cuándo ni explica por qué.
                      El "por qué" es de la plataforma y al colaborador no le sirve de nada. */}
                  <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                    Este video aún no está disponible. Avisa a Recursos Humanos si necesitas verlo.
                  </div>
                </div>
              ) : (
              <div style={{ borderRadius: 8, overflow: 'hidden', background: '#0f172a' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                  <iframe
                    id={`yt-player-${tid}`}
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
                    title={selTarea.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
              )}

              {hasQuiz && !isQuizStarted && !isQuizDone && (
                <div style={{ border: '1px solid #fde68a', borderRadius: 8, padding: 10, background: '#fffbeb', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <HelpCircle size={16} style={{ color: '#d97706' }} />
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e' }}>Prueba de verificación</div>
                  <p style={{ fontSize: 7, color: '#b45309', margin: 0, lineHeight: 1.4 }}>Responde para verificar que comprendiste el video.</p>
                  <div style={{ fontSize: 6.5, color: '#94a3b8' }}>{quizQuestions.length} preguntas · 70% para aprobar</div>
                  <button onClick={() => setQuizStarted(prev => ({ ...prev, [tid]: true }))} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 5,
                    background: '#d97706', color: '#fff', border: 'none', fontSize: 7.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <HelpCircle size={9} /> Empezar prueba
                  </button>
                </div>
              )}

              {hasQuiz && isQuizStarted && !isQuizDone && (
                <div style={{ border: '1px solid #fde68a', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '5px 8px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HelpCircle size={9} style={{ color: '#d97706' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#92400e' }}>Cuest.</span>
                    </div>
                    <span style={{ fontSize: 7, color: '#b45309' }}>{Object.keys(answers).length}/{quizQuestions.length}</span>
                  </div>
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quizQuestions.map((q, qIdx) => (
                      <div key={q.id}>
                        <p style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>{qIdx + 1}. {q.texto}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {q.opciones.map((opt, oIdx) => {
                            const selected = answers[qIdx] === oIdx
                            return (
                              <button key={oIdx} onClick={() => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: oIdx } }))} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 5,
                                border: selected ? '1.5px solid #d97706' : '1px solid #f1f5f9',
                                background: selected ? '#fef3c7' : '#fff',
                                cursor: 'pointer', fontSize: 8, color: '#475569', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                              }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, border: selected ? '3px solid #d97706' : '1.5px solid #cbd5e1', background: '#fff' }} />
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const correct = quizQuestions.filter((q, i) => answers[i] === q.correcta).length
                      setQuizSubmitted(prev => ({ ...prev, [tid]: { correct, total: quizQuestions.length } }))
                    }} disabled={!allAnswered} style={{
                      padding: '5px 12px', borderRadius: 6, background: allAnswered ? '#d97706' : '#e2e8f0',
                      color: allAnswered ? '#fff' : '#94a3b8', border: 'none', fontSize: 8, fontWeight: 700,
                      cursor: allAnswered ? 'pointer' : 'default', fontFamily: 'inherit',
                    }}>Enviar respuestas</button>
                  </div>
                </div>
              )}

              {hasQuiz && isQuizDone && (() => {
                const result = quizSubmitted[tid] || { correct: quizQuestions.length, total: quizQuestions.length }
                const passed = (result.correct / result.total) >= 0.7
                return (
                  <div style={{
                    border: `1px solid ${passed ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: 10, textAlign: 'center',
                    background: passed ? '#f0fdf4' : '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}>
                    <CheckCircle2 size={14} style={{ color: passed ? '#16a34a' : '#ef4444' }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: passed ? '#166534' : '#991b1b' }}>
                      {passed ? '¡Prueba aprobada!' : 'Prueba no aprobada'}
                    </div>
                    <div style={{ fontSize: 7.5, color: passed ? '#166534' : '#991b1b' }}>
                      {result.correct}/{result.total} correctas ({Math.round((result.correct / result.total) * 100)}%)
                    </div>
                    {!passed && (
                      <button onClick={() => { setQuizStarted(prev => ({ ...prev, [tid]: false })); setQuizSubmitted(prev => ({ ...prev, [tid]: null })); setQuizAnswers(prev => ({ ...prev, [tid]: {} })) }} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2, padding: '4px 10px', borderRadius: 5,
                        background: '#ef4444', color: '#fff', border: 'none', fontSize: 7.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>Reintentar</button>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        }
        case 'audio':
          return (
            <div style={{ padding: 10, borderRadius: 8, background: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={12} style={{ color: '#fff', marginLeft: 1 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{selTarea.name}</div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>Audio · 5:20 min</div>
              </div>
            </div>
          )
        case 'documento': {
          const isManual = selTarea.name.toLowerCase().includes('manual')
          const pdfUrl = isManual ? manualPdf : null
          const hasDocQuiz = selTarea.verificarQuiz !== false
          const docQuizQs = [
            { id: 1, texto: '¿Cuál es el horario de trabajo del manual?', opciones: ['6:00 a 14:00', '8:00 a 17:00 con almuerzo', '9:00 a 18:00', 'Horario libre'], correcta: 1 },
            { id: 2, texto: '¿A quién reportar una ausencia?', opciones: ['A cualquier compañero', 'A tu líder y RRHH', 'No es necesario', 'Solo a RRHH'], correcta: 1 },
          ]
          const tid = selTarea.id
          const isDocQuizStarted = !!quizStarted[tid]
          const isDocQuizDone = readOnly || !!quizSubmitted[tid]
          const docAns = quizAnswers[tid] || {}
          const allDocAns = docQuizQs.every((_, i) => docAns[i] !== undefined)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ border: '1px solid #fed7aa', borderRadius: 8, overflow: 'hidden', background: '#fffbf5' }}>
                <div style={{ padding: '6px 10px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={10} style={{ color: '#ea580c' }} />
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#9a3412' }}>{selTarea.name}.pdf</span>
                  </div>
                  {pdfUrl ? (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 7, fontWeight: 700, color: '#ea580c', background: '#fff', border: '1px solid #fed7aa', borderRadius: 4, padding: '2px 6px', textDecoration: 'none' }}>
                      <Download size={8} /> PDF
                    </a>
                  ) : (
                    <button style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 7, fontWeight: 700, color: '#ea580c', background: '#fff', border: '1px solid #fed7aa', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>
                      <Download size={8} /> PDF
                    </button>
                  )}
                </div>
                {pdfUrl ? (
                  <iframe src={pdfUrl} title={selTarea.name} style={{ width: '100%', height: 200, border: 'none' }} />
                ) : (
                  <div style={{ padding: 10 }}>
                    {[100, 90, 95, 70, 85].map((w, i) => (
                      <div key={i} style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 4, width: `${w}%` }} />
                    ))}
                  </div>
                )}
              </div>

              {hasDocQuiz && !isDocQuizStarted && !isDocQuizDone && (
                <div style={{ border: '1px solid #fde68a', borderRadius: 8, padding: 10, background: '#fffbeb', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <HelpCircle size={16} style={{ color: '#d97706' }} />
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e' }}>Prueba de verificación</div>
                  <p style={{ fontSize: 7, color: '#b45309', margin: 0, lineHeight: 1.4 }}>Verifica que comprendiste el documento.</p>
                  <div style={{ fontSize: 6.5, color: '#94a3b8' }}>{docQuizQs.length} preguntas</div>
                  <button onClick={() => setQuizStarted(prev => ({ ...prev, [tid]: true }))} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 5,
                    background: '#d97706', color: '#fff', border: 'none', fontSize: 7.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <HelpCircle size={9} /> Empezar prueba
                  </button>
                </div>
              )}

              {hasDocQuiz && isDocQuizStarted && !isDocQuizDone && (
                <div style={{ border: '1px solid #fde68a', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '5px 8px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HelpCircle size={9} style={{ color: '#d97706' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#92400e' }}>Cuest.</span>
                    </div>
                    <span style={{ fontSize: 7, color: '#b45309' }}>{Object.keys(docAns).length}/{docQuizQs.length}</span>
                  </div>
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {docQuizQs.map((q, qIdx) => (
                      <div key={q.id}>
                        <p style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>{qIdx + 1}. {q.texto}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {q.opciones.map((opt, oIdx) => {
                            const selected = docAns[qIdx] === oIdx
                            return (
                              <button key={oIdx} onClick={() => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: oIdx } }))} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 5,
                                border: selected ? '1.5px solid #d97706' : '1px solid #f1f5f9',
                                background: selected ? '#fef3c7' : '#fff',
                                cursor: 'pointer', fontSize: 8, color: '#475569', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                              }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, border: selected ? '3px solid #d97706' : '1.5px solid #cbd5e1', background: '#fff' }} />
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const correct = docQuizQs.filter((q, i) => docAns[i] === q.correcta).length
                      setQuizSubmitted(prev => ({ ...prev, [tid]: { correct, total: docQuizQs.length } }))
                    }} disabled={!allDocAns} style={{
                      padding: '5px 12px', borderRadius: 6, background: allDocAns ? '#d97706' : '#e2e8f0',
                      color: allDocAns ? '#fff' : '#94a3b8', border: 'none', fontSize: 8, fontWeight: 700,
                      cursor: allDocAns ? 'pointer' : 'default', fontFamily: 'inherit',
                    }}>Enviar respuestas</button>
                  </div>
                </div>
              )}

              {hasDocQuiz && isDocQuizDone && (() => {
                const result = quizSubmitted[tid] || { correct: docQuizQs.length, total: docQuizQs.length }
                return (
                  <div style={{ border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, textAlign: 'center', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#166534' }}>Prueba completada</div>
                    <div style={{ fontSize: 7.5, color: '#166534' }}>{result.correct}/{result.total} correctas ({Math.round((result.correct / result.total) * 100)}%)</div>
                  </div>
                )
              })()}
            </div>
          )
        }
        case 'pulso': {
          const preguntas = selTarea.pulsoPreguntas?.length ? selTarea.pulsoPreguntas : ['¿Cómo te sientes con tu proceso de onboarding hasta ahora?']
          const tid = selTarea.id
          const isPulsoDone = readOnly || !!pulsoSubmitted[tid]
          const respuestas = pulsoRespuestas[tid] || {}
          const allAns = preguntas.every((_, i) => respuestas[i] !== undefined)
          if (isPulsoDone) {
            return (
              <div style={{ border: '1px solid #fbcfe8', borderRadius: 8, padding: 10, textAlign: 'center', background: '#fdf2f8' }}>
                <CheckCircle2 size={16} style={{ color: '#db2777' }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9d174d', marginTop: 2 }}>¡Gracias por contarnos!</div>
              </div>
            )
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {preguntas.map((p, qi) => (
                <div key={qi} style={{ border: '1px solid #fbcfe8', borderRadius: 8, padding: 8, background: '#fdf2f8' }}>
                  <p style={{ fontSize: 8, fontWeight: 600, color: '#831843', margin: '0 0 5px' }}>{p}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['😞', '😕', '😐', '🙂', '😄'].map((emoji, vi) => (
                      <button key={vi} onClick={() => setPulsoRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qi]: vi } }))} style={{
                        width: 26, height: 26, borderRadius: '50%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: respuestas[qi] === vi ? '2px solid #db2777' : '1px solid #f5d0e0',
                        background: respuestas[qi] === vi ? '#fce7f3' : '#fff', cursor: 'pointer',
                      }}>{emoji}</button>
                    ))}
                  </div>
                </div>
              ))}
              <textarea
                placeholder="¿Algo que quieras contarnos? (opcional)"
                value={pulsoComentario[tid] || ''}
                onChange={e => setPulsoComentario(prev => ({ ...prev, [tid]: e.target.value }))}
                style={{ fontSize: 8, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontFamily: 'inherit', resize: 'none', minHeight: 36 }}
              />
              <button
                disabled={!allAns}
                onClick={() => { setPulsoSubmitted(prev => ({ ...prev, [tid]: true })); toggleDone(tid); setSelTarea(prev => ({ ...prev, done: true })) }}
                style={{ padding: '6px 12px', borderRadius: 6, background: allAns ? '#db2777' : '#e2e8f0', color: allAns ? '#fff' : '#94a3b8', border: 'none', fontSize: 8, fontWeight: 700, cursor: allAns ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >Enviar</button>
            </div>
          )
        }
        case 'recorrido': {
          const stops = [
            { name: 'Recepción y entrada principal', guia: 'Carlos Méndez', rol: 'Seguridad' },
            { name: 'Tu área de trabajo', guia: 'Nicolás Zapata', rol: 'Líder de área' },
            { name: 'Sala de reuniones', guia: 'Nicolás Zapata', rol: 'Líder de área' },
            { name: 'Comedor y áreas comunes', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Área de impresoras', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Estacionamiento', guia: 'Carlos Méndez', rol: 'Seguridad' },
            { name: 'Sala de capacitación', guia: 'Alejandro Ríos', rol: 'TI' },
            { name: 'Enfermería', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Terraza y áreas verdes', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Salida de emergencia', guia: 'Carlos Méndez', rol: 'Seguridad' },
          ]
          const doneSet = selTarea.done ? Object.fromEntries(stops.map((_, i) => [i, true])) : (recorridoStops[selTarea.id] || {})
          const doneCount = typeof doneSet === 'object' ? Object.keys(doneSet).filter(k => doneSet[k]).length : 0
          const allStopsDone = doneCount >= stops.length
          const toggleStop = (i) => {
            setRecorridoStops(prev => {
              const current = typeof prev[selTarea.id] === 'object' ? prev[selTarea.id] : {}
              return { ...prev, [selTarea.id]: { ...current, [i]: !current[i] } }
            })
          }
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 5px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>Recorrido libre</span>
                <span style={{ fontSize: 7, color: '#94a3b8' }}>{doneCount}/{stops.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stops.map((stop, i) => {
                  const isDone = !!doneSet[i]
                  return (
                    <div key={i} onClick={() => !selTarea.done && toggleStop(i)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 6,
                      background: isDone ? '#faf5ff' : '#f8fafc', border: '1px solid #f1f5f9',
                      cursor: selTarea.done ? 'default' : 'pointer',
                    }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                        background: isDone ? '#7c3aed' : '#fff',
                        border: isDone ? 'none' : '1.5px solid #d1d5db',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isDone && <CheckCircle2 size={7} style={{ color: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 8, fontWeight: isDone ? 600 : 400, color: isDone ? '#7c3aed' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stop.name}</div>
                        <div style={{ fontSize: 6.5, color: '#94a3b8' }}>{stop.guia} · {stop.rol}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 7, color: allStopsDone ? '#16a34a' : '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                {allStopsDone ? <><CheckCircle2 size={8} /> Recorrido completado</> : <><MapPin size={8} /> Marca cada lugar cuando lo visites</>}
              </div>
            </>
          )
        }
        case 'subida': {
          const docs = (selTarea.documentos || []).filter(d => d.nombre?.trim())
          if (docs.length === 0) {
            return (
              <div style={{ border: '2px dashed #f9a8d4', borderRadius: 8, padding: 14, textAlign: 'center', background: '#fdf2f8' }}>
                <Upload size={18} style={{ color: '#ec4899', marginBottom: 4 }} />
                <p style={{ fontSize: 9, fontWeight: 700, color: '#9d174d', margin: '0 0 2px' }}>Arrastra tu archivo aquí</p>
                <p style={{ fontSize: 7, color: '#be185d', margin: 0 }}>o haz clic para seleccionar</p>
              </div>
            )
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docs.map((doc, i) => (
                <div key={doc.id ?? i} style={{ border: '2px dashed #f9a8d4', borderRadius: 8, padding: 10, textAlign: 'center', background: '#fdf2f8' }}>
                  <Upload size={14} style={{ color: '#ec4899', marginBottom: 3 }} />
                  <p style={{ fontSize: 8, fontWeight: 700, color: '#9d174d', margin: '0 0 1px' }}>{doc.nombre}</p>
                  <p style={{ fontSize: 6.5, color: '#be185d', margin: 0 }}>{doc.formato ? doc.formato : 'Clic para seleccionar'}</p>
                </div>
              ))}
            </div>
          )
        }
        case 'completar-perfil': {
          const campos = selTarea.formCampos?.length ? selTarea.formCampos : []
          const tid = selTarea.id
          const isFormDone = readOnly || !!formSubmitted[tid]
          const frs = formRespuestas[tid] || {}
          const allReq = campos.every(c => !c.obligatorio || (Array.isArray(frs[c.id]) ? frs[c.id].length > 0 : (frs[c.id] || '').toString().trim()))

          if (campos.length === 0) {
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#f8fafc', textAlign: 'center' }}>
                <ClipboardList size={14} style={{ color: '#94a3b8' }} />
                <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 3 }}>Este formulario aún no tiene campos configurados</div>
              </div>
            )
          }
          if (isFormDone) {
            return (
              <div style={{ border: '1px solid #a7f3d0', borderRadius: 8, padding: 10, textAlign: 'center', background: '#ecfdf5' }}>
                <CheckCircle2 size={14} style={{ color: '#059669' }} />
                <div style={{ fontSize: 8, fontWeight: 700, color: '#065f46', marginTop: 2 }}>Formulario enviado</div>
              </div>
            )
          }
          return (
            <div style={{ border: '1px solid #a7f3d0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClipboardList size={10} style={{ color: '#059669' }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: '#065f46' }}>Formulario</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campos.map(campo => (
                  <div key={campo.id}>
                    <label style={{ fontSize: 7, fontWeight: 600, color: '#64748b', marginBottom: 2, display: 'block' }}>
                      {campo.etiqueta}{campo.obligatorio && <span style={{ color: '#ef4444' }}> *</span>}
                    </label>
                    {campo.tipo === 'parrafo' && (
                      <textarea value={frs[campo.id] || ''} onChange={e => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: e.target.value } }))} style={{ width: '100%', fontSize: 7, padding: 5, borderRadius: 5, border: '1px solid #e2e8f0', fontFamily: 'inherit', resize: 'none', minHeight: 30 }} />
                    )}
                    {campo.tipo === 'texto-corto' && (
                      <input type="text" value={frs[campo.id] || ''} onChange={e => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: e.target.value } }))} style={{ width: '100%', fontSize: 7, padding: 5, borderRadius: 5, border: '1px solid #e2e8f0', fontFamily: 'inherit' }} />
                    )}
                    {campo.tipo === 'opcion-multiple' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {campo.opciones.map(opt => (
                          <button key={opt.id} onClick={() => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: opt.texto } }))} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 5px', borderRadius: 4, border: frs[campo.id] === opt.texto ? '1.5px solid #059669' : '1px solid #f1f5f9', background: frs[campo.id] === opt.texto ? '#ecfdf5' : '#fff', cursor: 'pointer', fontSize: 7, color: '#475569', fontFamily: 'inherit', textAlign: 'left' }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, border: frs[campo.id] === opt.texto ? '3px solid #059669' : '1.5px solid #cbd5e1' }} />
                            {opt.texto}
                          </button>
                        ))}
                      </div>
                    )}
                    {campo.tipo === 'casillas' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {campo.opciones.map(opt => {
                          const sel = (frs[campo.id] || []).includes(opt.texto)
                          return (
                            <button key={opt.id} onClick={() => setFormRespuestas(prev => { const cur = prev[tid]?.[campo.id] || []; const next = sel ? cur.filter(v => v !== opt.texto) : [...cur, opt.texto]; return { ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: next } } })} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 5px', borderRadius: 4, border: sel ? '1.5px solid #059669' : '1px solid #f1f5f9', background: sel ? '#ecfdf5' : '#fff', cursor: 'pointer', fontSize: 7, color: '#475569', fontFamily: 'inherit', textAlign: 'left' }}>
                              <div style={{ width: 9, height: 9, borderRadius: 2, flexShrink: 0, border: sel ? 'none' : '1.5px solid #cbd5e1', background: sel ? '#059669' : '#fff' }} />
                              {opt.texto}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {campo.tipo === 'desplegable' && (
                      <select value={frs[campo.id] || ''} onChange={e => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: e.target.value } }))} style={{ width: '100%', fontSize: 7, padding: 5, borderRadius: 5, border: '1px solid #e2e8f0', fontFamily: 'inherit', background: '#fff' }}>
                        <option value="">Selecciona...</option>
                        {campo.opciones.map(opt => <option key={opt.id} value={opt.texto}>{opt.texto}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                <button
                  disabled={!allReq}
                  onClick={() => { setFormSubmitted(prev => ({ ...prev, [tid]: true })); toggleDone(tid); setSelTarea(prev => ({ ...prev, done: true })) }}
                  style={{ padding: '5px 12px', borderRadius: 6, background: allReq ? '#059669' : '#e2e8f0', color: allReq ? '#fff' : '#94a3b8', border: 'none', fontSize: 8, fontWeight: 700, cursor: allReq ? 'pointer' : 'default', fontFamily: 'inherit' }}
                >Enviar formulario</button>
              </div>
            </div>
          )
        }
        case 'perfil': {
          const tid = selTarea.id
          const isPerfilDone = readOnly || !!perfilSubmitted[tid]
          const tab = perfilTab[tid] || 'personales'
          const progress = perfilProgress[tid] || {}
          const doneCount = Object.values(progress).filter(Boolean).length
          const allDone = doneCount >= PERFIL_TOTAL_SECCIONES
          const toggleSeccion = (key) => {
            setPerfilProgress(prev => {
              const current = prev[tid] || {}
              return { ...prev, [tid]: { ...current, [key]: !current[key] } }
            })
          }
          if (isPerfilDone) {
            return (
              <div style={{ border: '1px solid #ddd6fe', borderRadius: 8, padding: 10, textAlign: 'center', background: '#f5f3ff' }}>
                <CheckCircle2 size={14} style={{ color: '#7c3aed' }} />
                <div style={{ fontSize: 8, fontWeight: 700, color: '#5b21b6', marginTop: 2 }}>Perfil completado</div>
              </div>
            )
          }
          return (
            <div style={{ border: '1px solid #ddd6fe', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 8px', background: '#f5f3ff', borderBottom: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#5b21b6' }}>Completar perfil</span>
                <span style={{ fontSize: 7, color: '#7c3aed' }}>{doneCount}/{PERFIL_TOTAL_SECCIONES}</span>
              </div>
              <div style={{ display: 'flex', overflowX: 'auto' }}>
                {PERFIL_TABS.map(t => (
                  <button key={t.key} onClick={() => setPerfilTab(prev => ({ ...prev, [tid]: t.key }))} style={{
                    flex: '1 0 auto', padding: '5px 4px', fontSize: 6.5, fontWeight: 700,
                    border: 'none', borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
                    background: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    color: tab === t.key ? '#5b21b6' : '#94a3b8',
                  }}>{t.label}</button>
                ))}
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PERFIL_SECCIONES[tab].map(s => {
                  const key = `${tab}:${s}`
                  const done = !!progress[key]
                  return (
                    <div key={key} onClick={() => toggleSeccion(key)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 6,
                      background: done ? '#f5f3ff' : '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                        background: done ? '#7c3aed' : '#fff',
                        border: done ? 'none' : '1.5px solid #d1d5db',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done && <CheckCircle2 size={8} style={{ color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 7, color: '#475569' }}>{s}</span>
                    </div>
                  )
                })}
                <button
                  disabled={!allDone}
                  onClick={() => { setPerfilSubmitted(prev => ({ ...prev, [tid]: true })); toggleDone(tid); setSelTarea(prev => ({ ...prev, done: true })) }}
                  style={{ marginTop: 4, padding: '5px 12px', borderRadius: 6, background: allDone ? '#7c3aed' : '#e2e8f0', color: allDone ? '#fff' : '#94a3b8', border: 'none', fontSize: 8, fontWeight: 700, cursor: allDone ? 'pointer' : 'default', fontFamily: 'inherit', alignSelf: 'flex-start' }}
                >Enviar perfil</button>
              </div>
            </div>
          )
        }
        case 'tarea-otro':
          return (
            <div style={{ border: '1px solid #fecaca', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserCheck size={10} style={{ color: '#dc2626' }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: '#991b1b' }}>Tarea supervisada</span>
              </div>
              <div style={{ padding: 8, fontSize: 8, color: '#475569', lineHeight: 1.5 }}>Requiere validación del supervisor</div>
            </div>
          )
        case 'enlace':
          return (
            <div style={{ border: '1px solid #c7d2fe', borderRadius: 8, padding: 12, textAlign: 'center', background: '#eef2ff' }}>
              <ExternalLink size={16} style={{ color: '#6366f1', marginBottom: 4 }} />
              <p style={{ fontSize: 9, fontWeight: 700, color: '#3730a3', margin: '0 0 6px' }}>Recurso externo</p>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}>
                <ExternalLink size={9} /> Abrir enlace
              </button>
            </div>
          )
        case 'quiz': {
          const quizQs = selTarea.quizPreguntas?.length ? selTarea.quizPreguntas : []
          const tid = selTarea.id
          const isStarted = !!quizStarted[tid]
          const isDone = readOnly || !!quizSubmitted[tid]
          const ans = quizAnswers[tid] || {}
          const allAns = quizQs.every((q, i) => q.tipo === 'abierta' ? (ans[i] || '').trim() : ans[i] !== undefined)
          if (quizQs.length === 0) {
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#f8fafc', textAlign: 'center' }}>
                <HelpCircle size={16} style={{ color: '#94a3b8', marginBottom: 4 }} />
                <div style={{ fontSize: 8, color: '#94a3b8' }}>Esta prueba aún no tiene preguntas configuradas</div>
              </div>
            )
          }
          if (!isStarted && !isDone) {
            return (
              <div style={{ border: '1px solid #fde68a', borderRadius: 8, padding: 12, background: '#fffbeb', textAlign: 'center' }}>
                <HelpCircle size={16} style={{ color: '#d97706', marginBottom: 4 }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Evaluación</div>
                <button onClick={() => setQuizStarted(prev => ({ ...prev, [tid]: true }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 6, background: '#d97706', color: '#fff', border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <HelpCircle size={9} /> Empezar
                </button>
              </div>
            )
          }
          if (isStarted && !isDone) {
            return (
              <div style={{ border: '1px solid #fde68a', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '5px 8px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#92400e' }}>Evaluación</span>
                  <span style={{ fontSize: 7, color: '#b45309' }}>{Object.keys(ans).length}/{quizQs.length}</span>
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quizQs.map((q, qIdx) => (
                    <div key={q.id}>
                      <p style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>{qIdx + 1}. {q.texto}</p>
                      {q.tipo === 'abierta' ? (
                        <textarea
                          value={ans[qIdx] || ''}
                          onChange={e => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: e.target.value } }))}
                          placeholder="Escribe tu respuesta"
                          style={{ width: '100%', fontSize: 8, padding: 6, borderRadius: 5, border: '1px solid #e2e8f0', fontFamily: 'inherit', resize: 'none', minHeight: 32 }}
                        />
                      ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {q.opciones.map((opt, oIdx) => {
                          const selected = ans[qIdx] === oIdx
                          return (
                            <button key={opt.id ?? oIdx} onClick={() => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: oIdx } }))} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 5,
                              border: selected ? '1.5px solid #d97706' : '1px solid #f1f5f9',
                              background: selected ? '#fef3c7' : '#fff',
                              cursor: 'pointer', fontSize: 8, color: '#475569', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                            }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, border: selected ? '3px solid #d97706' : '1.5px solid #cbd5e1', background: '#fff' }} />
                              {opt.texto}
                            </button>
                          )
                        })}
                      </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => {
                    const mcQs = quizQs.filter(q => q.tipo !== 'abierta')
                    const correct = mcQs.filter(q => { const qi = quizQs.indexOf(q); return q.opciones[ans[qi]]?.correcta }).length
                    setQuizSubmitted(prev => ({ ...prev, [tid]: { correct, total: mcQs.length } }))
                  }} disabled={!allAns} style={{
                    padding: '5px 12px', borderRadius: 6, background: allAns ? '#d97706' : '#e2e8f0', color: allAns ? '#fff' : '#94a3b8',
                    border: 'none', fontSize: 8, fontWeight: 700, cursor: allAns ? 'pointer' : 'default', fontFamily: 'inherit',
                  }}>Enviar</button>
                </div>
              </div>
            )
          }
          if (isDone) {
            const mcCount = quizQs.filter(q => q.tipo !== 'abierta').length
            const result = quizSubmitted[tid] || { correct: mcCount, total: mcCount }
            return (
              <div style={{ border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, textAlign: 'center', background: '#f0fdf4' }}>
                <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: '#166534', marginTop: 2 }}>
                  {result.total > 0 ? `${result.correct}/${result.total} correctas` : 'Respuestas enviadas'}
                </div>
              </div>
            )
          }
          return null
        }
        case 'confirmacion':
          return (
            <div style={{ borderRadius: 8, padding: 14, textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', border: '1px solid #fde68a' }}>
              <Award size={22} style={{ color: '#d97706', marginBottom: 4 }} />
              <p style={{ fontSize: 10, fontWeight: 800, color: '#92400e', margin: '0 0 3px' }}>Certificado de graduación</p>
              <div style={{ fontSize: 7, fontWeight: 700, color: '#d97706' }}>+{selTarea.puntos} Pts al completar</div>
            </div>
          )
        case 'form-custom':
          return (
            <div style={{ border: '1px solid #a7f3d0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClipboardList size={10} style={{ color: '#059669' }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: '#065f46' }}>Formulario</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Campo 1', 'Campo 2'].map((field, i) => (
                  <div key={i}>
                    <label style={{ fontSize: 7, fontWeight: 600, color: '#64748b', marginBottom: 2, display: 'block' }}>{field}</label>
                    <div style={{ height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                  </div>
                ))}
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}>
                  <Send size={9} /> Enviar
                </button>
              </div>
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0 2px' }}>
        {/* Mobile topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 2px', marginBottom: 4,
        }}>
          <button onClick={() => { setSelTarea(null); setSelContext(null) }} style={{
            width: 22, height: 22, borderRadius: 6, border: '1px solid #e2e8f0',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <ArrowLeft size={10} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#0C2D40', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selTarea.name}</div>
            {selContext && (
              <div style={{ fontSize: 6.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selContext.etapa} › {selContext.actividad}
              </div>
            )}
          </div>
          {selTarea.done ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', flexShrink: 0 }}>
              <CheckCircle2 size={8} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: 7, fontWeight: 600, color: '#166534' }}>Hecha</span>
            </div>
          ) : selTarea.tipo === 'video' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 5, background: '#eff6ff', border: '1px solid #dbeafe', flexShrink: 0 }}>
              <Info size={8} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: 6.5, fontWeight: 600, color: '#1e40af' }}>Se completa sola</span>
            </div>
          ) : selTarea.tipo === 'pulso' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 5, background: '#fdf2f8', border: '1px solid #fbcfe8', flexShrink: 0 }}>
              <Info size={8} style={{ color: '#db2777' }} />
              <span style={{ fontSize: 6.5, fontWeight: 600, color: '#9d174d' }}>Envía tus respuestas</span>
            </div>
          ) : selTarea.tipo === 'completar-perfil' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 5, background: '#ecfdf5', border: '1px solid #a7f3d0', flexShrink: 0 }}>
              <Info size={8} style={{ color: '#059669' }} />
              <span style={{ fontSize: 6.5, fontWeight: 600, color: '#065f46' }}>Envía el formulario</span>
            </div>
          ) : (
            <button onClick={() => {
              if (selTarea.tipo === 'recorrido') {
                const doneSet = recorridoStops[selTarea.id] || {}
                const doneCount = typeof doneSet === 'object' ? Object.keys(doneSet).filter(k => doneSet[k]).length : 0
                if (doneCount < 10) { setShowAlert('Completa todas las paradas'); setTimeout(() => setShowAlert(false), 2500); return }
              }
              if (selTarea.tipo === 'documento' && selTarea.verificarQuiz !== false) {
                if (!quizSubmitted[selTarea.id]) { setShowAlert('Completa la prueba primero'); setTimeout(() => setShowAlert(false), 2500); return }
              }
              toggleDone(selTarea.id); setSelTarea(prev => ({ ...prev, done: !prev.done }))
            }} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: '#0C2D40', color: '#fff', border: 'none',
              borderRadius: 6, padding: '4px 8px',
              fontSize: 7, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>
              <CheckCircle2 size={8} />
              Completar
            </button>
          )}
        </div>

        {/* Alert */}
        {showAlert && (
          <div style={{
            position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: '#0C2D40', color: '#fff', padding: '5px 12px',
            borderRadius: 6, fontSize: 8, fontWeight: 600, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)',
          }}>
            <MapPin size={9} style={{ color: '#f59e0b' }} />
            {showAlert}
          </div>
        )}

        {/* Task header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: `${color}12`, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={13} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#0C2D40' }}>{selTarea.name}</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap' }}>
              {selTarea.obligatoria && (
                <span style={{ fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: '#fef3c7', color: '#92400e', textTransform: 'uppercase' }}>Obligatoria</span>
              )}
              <span style={{ fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: `${color}12`, color }}>{selTarea.tipo.replace('-', ' ')}</span>
              {selTarea.puntos > 0 && (
                <span style={{ fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: '#fef3c7', color: '#d97706' }}>+{selTarea.puntos} Pts</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {selTarea.desc && (
          <div style={{ padding: '6px 8px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: 8 }}>
            <p style={{ fontSize: 7.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>{selTarea.desc}</p>
          </div>
        )}

        {/* Content */}
        {renderMobileContent()}
      </div>
    )
  }

  if (selTarea) {
    const Icon = iconMap[selTarea.tipo] || FileText
    const color = colorMap[selTarea.tipo] || '#94a3b8'

    const renderContent = () => {
      switch (selTarea.tipo) {
        case 'video': {
          // Mismas tres ramas que en la vista compacta: video real, archivo subido, o el de
          // ejemplo cuando la tarea no tiene contenido configurado.
          const contenidoUrl = selTarea.enlace || selTarea._kbItem?.url || selTarea.videoUrl
          const archivoSubido = !contenidoUrl && !!selTarea._kbItem
          const embedUrl = contenidoUrl || 'https://www.youtube.com/embed/WnD2H9rHNec'
          const videoId = toEmbedUrl(embedUrl).match(/embed\/([a-zA-Z0-9_-]+)/)?.[1] || 'WnD2H9rHNec'
          const hasQuiz = selTarea.verificarQuiz !== false
          const quizQuestions = [
            { id: 1, texto: '¿Cuál es el objetivo principal presentado en el video?', opciones: ['Aumentar las ventas', 'Dar la bienvenida al equipo', 'Presentar el producto', 'Explicar las políticas'], correcta: 1 },
            { id: 2, texto: '¿Qué valor se destaca como fundamental en la organización?', opciones: ['Competitividad', 'Innovación', 'Trabajo en equipo', 'Velocidad'], correcta: 2 },
            { id: 3, texto: '¿Qué se espera del colaborador según el video?', opciones: ['Trabajar horas extra', 'Compromiso y proactividad', 'Solo cumplir tareas', 'Reportar diariamente'], correcta: 1 },
          ]
          const tid = selTarea.id
          const isQuizStarted = !!quizStarted[tid]
          const isQuizDone = readOnly || !!quizSubmitted[tid]
          const answers = quizAnswers[tid] || {}
          const allAnswered = quizQuestions.every((_, i) => answers[i] !== undefined)

          function selectAnswer(qIdx, oIdx) {
            setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: oIdx } }))
          }

          function submitQuiz() {
            const correct = quizQuestions.filter((q, i) => answers[i] === q.correcta).length
            setQuizSubmitted(prev => ({ ...prev, [tid]: { correct, total: quizQuestions.length } }))
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {archivoSubido && archivoTareaUrl ? (
                <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}>
                  <video controls src={archivoTareaUrl} style={{ width: '100%', display: 'block' }} />
                </div>
              ) : archivoSubido ? (
                <div style={{ borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '32px 24px', textAlign: 'center' }}>
                  <Video size={30} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0C2D40' }}>{selTarea._kbItem.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5, maxWidth: 380, margin: '6px auto 0' }}>
                    Este video aún no está disponible. Avisa a Recursos Humanos si necesitas verlo.
                  </div>
                </div>
              ) : (
              <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                  <iframe
                    id={`yt-player-${tid}`}
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
                    title={selTarea.name}
                    frameBorder="0"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
              )}

              {hasQuiz && !isQuizStarted && !isQuizDone && (
                <div style={{
                  border: '1px solid #fde68a', borderRadius: 12, padding: '20px 24px',
                  background: '#fffbeb', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                }}>
                  <HelpCircle size={28} style={{ color: '#d97706' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Prueba de verificación</div>
                    <p style={{ fontSize: 12, color: '#b45309', margin: '4px 0 0', lineHeight: 1.5 }}>
                      Responde una breve evaluación para verificar que comprendiste el contenido del video.
                    </p>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{quizQuestions.length} preguntas · Necesitas 70% para aprobar</div>
                  <button
                    onClick={() => setQuizStarted(prev => ({ ...prev, [tid]: true }))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 20px', borderRadius: 8,
                      background: '#d97706', color: '#fff', border: 'none',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <HelpCircle size={14} />
                    Empezar prueba
                  </button>
                </div>
              )}

              {hasQuiz && isQuizStarted && !isQuizDone && (
                <div style={{ border: '1px solid #fde68a', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 16px', background: '#fffbeb', borderBottom: '1px solid #fde68a',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HelpCircle size={15} style={{ color: '#d97706' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Prueba de verificación</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#b45309' }}>{Object.keys(answers).length}/{quizQuestions.length} respondidas</span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {quizQuestions.map((q, qIdx) => (
                      <div key={q.id}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
                          {qIdx + 1}. {q.texto}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {q.opciones.map((opt, oIdx) => {
                            const selected = answers[qIdx] === oIdx
                            return (
                              <button
                                key={oIdx}
                                onClick={() => selectAnswer(qIdx, oIdx)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '8px 12px', borderRadius: 8,
                                  border: selected ? '1.5px solid #d97706' : '1px solid #f1f5f9',
                                  background: selected ? '#fef3c7' : '#fff',
                                  cursor: 'pointer', fontSize: 12, color: '#475569',
                                  fontFamily: 'inherit', textAlign: 'left', width: '100%',
                                  transition: 'all .12s',
                                }}
                              >
                                <div style={{
                                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                  border: selected ? '5px solid #d97706' : '2px solid #cbd5e1',
                                  background: '#fff',
                                }} />
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={submitQuiz}
                      disabled={!allAnswered}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 8,
                        background: allAnswered ? '#d97706' : '#e2e8f0',
                        color: allAnswered ? '#fff' : '#94a3b8',
                        border: 'none', fontSize: 12, fontWeight: 700,
                        cursor: allAnswered ? 'pointer' : 'default', fontFamily: 'inherit',
                      }}
                    >
                      Enviar respuestas
                    </button>
                  </div>
                </div>
              )}

              {hasQuiz && isQuizDone && (() => {
                const result = quizSubmitted[tid] || { correct: quizQuestions.length, total: quizQuestions.length }
                const passed = (result.correct / result.total) >= 0.7
                return (
                  <div style={{
                    border: `1px solid ${passed ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12,
                    padding: '16px 20px', textAlign: 'center',
                    background: passed ? '#f0fdf4' : '#fef2f2',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle2 size={24} style={{ color: passed ? '#16a34a' : '#ef4444' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: passed ? '#166534' : '#991b1b' }}>
                      {passed ? '¡Prueba aprobada!' : 'Prueba no aprobada'}
                    </div>
                    <div style={{ fontSize: 12, color: passed ? '#166534' : '#991b1b' }}>
                      {result.correct} de {result.total} respuestas correctas ({Math.round((result.correct / result.total) * 100)}%)
                    </div>
                    {!passed && (
                      <button
                        onClick={() => { setQuizStarted(prev => ({ ...prev, [tid]: false })); setQuizSubmitted(prev => ({ ...prev, [tid]: null })); setQuizAnswers(prev => ({ ...prev, [tid]: {} })) }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
                          padding: '8px 16px', borderRadius: 8,
                          background: '#ef4444', color: '#fff', border: 'none',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Reintentar prueba
                      </button>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        }

        case 'audio':
          return (
            <div style={{ padding: 20, borderRadius: 12, background: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Play size={22} style={{ color: '#fff', marginLeft: 2 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selTarea.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Audio · 5:20 min</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>0:00</span>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99 }}><div style={{ width: '0%', height: '100%', background: '#fff', borderRadius: 99 }} /></div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>5:20</span>
              </div>
            </div>
          )

        case 'documento': {
          const isManual = selTarea.name.toLowerCase().includes('manual')
          const pdfUrl = isManual ? manualPdf : null
          const hasDocQuiz = selTarea.verificarQuiz !== false
          const docQuizQs = [
            { id: 1, texto: '¿Cuál es el horario de trabajo establecido en el manual?', opciones: ['6:00 a 14:00', '8:00 a 17:00 con 1 hora de almuerzo', '9:00 a 18:00', 'Horario libre'], correcta: 1 },
            { id: 2, texto: '¿A quién debes reportar una ausencia según el manual?', opciones: ['A cualquier compañero', 'A tu líder directo y RRHH', 'No es necesario reportar', 'Solo a RRHH'], correcta: 1 },
          ]
          const tid = selTarea.id
          const isDocQuizStarted = !!quizStarted[tid]
          const isDocQuizDone = readOnly || !!quizSubmitted[tid]
          const docAns = quizAnswers[tid] || {}
          const allDocAns = docQuizQs.every((_, i) => docAns[i] !== undefined)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ border: '1px solid #fed7aa', borderRadius: 12, overflow: 'hidden', background: '#fffbf5' }}>
                <div style={{ padding: '12px 16px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={16} style={{ color: '#ea580c' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#9a3412' }}>{selTarea.name}.pdf</span>
                  </div>
                  {pdfUrl ? (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#ea580c', background: '#fff', border: '1px solid #fed7aa', borderRadius: 6, padding: '4px 10px', textDecoration: 'none' }}>
                      <Download size={12} /> Descargar PDF
                    </a>
                  ) : (
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#ea580c', background: '#fff', border: '1px solid #fed7aa', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                      <Download size={12} /> Descargar PDF
                    </button>
                  )}
                </div>
                <div style={{ padding: 0 }}>
                  {pdfUrl ? (
                    <iframe src={pdfUrl} title={selTarea.name} style={{ width: '100%', height: 500, border: 'none' }} />
                  ) : (
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>{selTarea.name}</div>
                      {[100, 90, 95, 70, 85, 100, 80, 60].map((w, i) => (
                        <div key={i} style={{ height: 10, background: '#f1f5f9', borderRadius: 4, marginBottom: 6, width: `${w}%` }} />
                      ))}
                      <div style={{ marginTop: 14, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>Página 1 de 4</div>
                    </div>
                  )}
                </div>
              </div>

              {hasDocQuiz && !isDocQuizStarted && !isDocQuizDone && (
                <div style={{
                  border: '1px solid #fde68a', borderRadius: 12, padding: '20px 24px',
                  background: '#fffbeb', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                }}>
                  <HelpCircle size={28} style={{ color: '#d97706' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Prueba de verificación</div>
                    <p style={{ fontSize: 12, color: '#b45309', margin: '4px 0 0', lineHeight: 1.5 }}>
                      Responde una breve evaluación para verificar que comprendiste el documento.
                    </p>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{docQuizQs.length} preguntas</div>
                  <button
                    onClick={() => setQuizStarted(prev => ({ ...prev, [tid]: true }))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 20px', borderRadius: 8,
                      background: '#d97706', color: '#fff', border: 'none',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <HelpCircle size={14} /> Empezar prueba
                  </button>
                </div>
              )}

              {hasDocQuiz && isDocQuizStarted && !isDocQuizDone && (
                <div style={{ border: '1px solid #fde68a', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HelpCircle size={15} style={{ color: '#d97706' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Prueba de verificación</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#b45309' }}>{Object.keys(docAns).length}/{docQuizQs.length} respondidas</span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {docQuizQs.map((q, qIdx) => (
                      <div key={q.id}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>{qIdx + 1}. {q.texto}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {q.opciones.map((opt, oIdx) => {
                            const selected = docAns[qIdx] === oIdx
                            return (
                              <button key={oIdx} onClick={() => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: oIdx } }))}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                                  border: selected ? '1.5px solid #d97706' : '1px solid #f1f5f9',
                                  background: selected ? '#fef3c7' : '#fff',
                                  cursor: 'pointer', fontSize: 12, color: '#475569',
                                  fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'all .12s',
                                }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: selected ? '5px solid #d97706' : '2px solid #cbd5e1', background: '#fff' }} />
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const correct = docQuizQs.filter((q, i) => docAns[i] === q.correcta).length
                        setQuizSubmitted(prev => ({ ...prev, [tid]: { correct, total: docQuizQs.length } }))
                      }}
                      disabled={!allDocAns}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 8,
                        background: allDocAns ? '#d97706' : '#e2e8f0',
                        color: allDocAns ? '#fff' : '#94a3b8',
                        border: 'none', fontSize: 12, fontWeight: 700,
                        cursor: allDocAns ? 'pointer' : 'default', fontFamily: 'inherit',
                      }}
                    >Enviar respuestas</button>
                  </div>
                </div>
              )}

              {hasDocQuiz && isDocQuizDone && (() => {
                const result = quizSubmitted[tid] || { correct: docQuizQs.length, total: docQuizQs.length }
                return (
                  <div style={{
                    border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px',
                    textAlign: 'center', background: '#f0fdf4',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Prueba completada</div>
                    <div style={{ fontSize: 12, color: '#166534' }}>{result.correct} de {result.total} respuestas correctas ({Math.round((result.correct / result.total) * 100)}%)</div>
                  </div>
                )
              })()}
            </div>
          )
        }

        case 'quiz': {
          const quizQs = selTarea.quizPreguntas?.length ? selTarea.quizPreguntas : []
          const tid = selTarea.id
          const isStarted = !!quizStarted[tid]
          const isDone = readOnly || !!quizSubmitted[tid]
          const ans = quizAnswers[tid] || {}
          const allAns = quizQs.every((q, i) => q.tipo === 'abierta' ? (ans[i] || '').trim() : ans[i] !== undefined)

          if (quizQs.length === 0) {
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', background: '#f8fafc', textAlign: 'center' }}>
                <HelpCircle size={24} style={{ color: '#94a3b8', marginBottom: 6 }} />
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Esta prueba aún no tiene preguntas configuradas</div>
              </div>
            )
          }

          if (!isStarted && !isDone) {
            return (
              <div style={{
                border: '1px solid #fde68a', borderRadius: 12, padding: '20px 24px',
                background: '#fffbeb', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}>
                <HelpCircle size={28} style={{ color: '#d97706' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Evaluación de la actividad</div>
                  <p style={{ fontSize: 12, color: '#b45309', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Responde esta evaluación sobre todo lo aprendido en esta actividad.
                  </p>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{quizQs.length} preguntas</div>
                <button
                  onClick={() => setQuizStarted(prev => ({ ...prev, [tid]: true }))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 20px', borderRadius: 8,
                    background: '#d97706', color: '#fff', border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <HelpCircle size={14} />
                  Empezar evaluación
                </button>
              </div>
            )
          }

          if (isStarted && !isDone) {
            return (
              <div style={{ border: '1px solid #fde68a', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 16px', background: '#fffbeb', borderBottom: '1px solid #fde68a',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HelpCircle size={15} style={{ color: '#d97706' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Evaluación</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#b45309' }}>{Object.keys(ans).length}/{quizQs.length} respondidas</span>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {quizQs.map((q, qIdx) => (
                    <div key={q.id}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
                        {qIdx + 1}. {q.texto}
                      </p>
                      {q.tipo === 'abierta' ? (
                        <textarea
                          value={ans[qIdx] || ''}
                          onChange={e => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: e.target.value } }))}
                          placeholder="Escribe tu respuesta"
                          className="pl-input"
                          style={{ width: '100%', minHeight: 70, resize: 'none' }}
                        />
                      ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {q.opciones.map((opt, oIdx) => {
                          const selected = ans[qIdx] === oIdx
                          return (
                            <button
                              key={opt.id ?? oIdx}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qIdx]: oIdx } }))}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', borderRadius: 8,
                                border: selected ? '1.5px solid #d97706' : '1px solid #f1f5f9',
                                background: selected ? '#fef3c7' : '#fff',
                                cursor: 'pointer', fontSize: 12, color: '#475569',
                                fontFamily: 'inherit', textAlign: 'left', width: '100%',
                                transition: 'all .12s',
                              }}
                            >
                              <div style={{
                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                border: selected ? '5px solid #d97706' : '2px solid #cbd5e1',
                                background: '#fff',
                              }} />
                              {opt.texto}
                            </button>
                          )
                        })}
                      </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const mcQs = quizQs.filter(q => q.tipo !== 'abierta')
                      const correct = mcQs.filter(q => { const qi = quizQs.indexOf(q); return q.opciones[ans[qi]]?.correcta }).length
                      setQuizSubmitted(prev => ({ ...prev, [tid]: { correct, total: mcQs.length } }))
                    }}
                    disabled={!allAns}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 20px', borderRadius: 8,
                      background: allAns ? '#d97706' : '#e2e8f0',
                      color: allAns ? '#fff' : '#94a3b8',
                      border: 'none', fontSize: 12, fontWeight: 700,
                      cursor: allAns ? 'pointer' : 'default', fontFamily: 'inherit',
                    }}
                  >
                    Enviar respuestas
                  </button>
                </div>
              </div>
            )
          }

          if (isDone) {
            const mcCount = quizQs.filter(q => q.tipo !== 'abierta').length
            const result = quizSubmitted[tid] || { correct: mcCount, total: mcCount }
            const pctResult = result.total > 0 ? Math.round((result.correct / result.total) * 100) : null
            return (
              <div style={{
                border: '1px solid #bbf7d0', borderRadius: 12,
                padding: '16px 20px', textAlign: 'center',
                background: '#f0fdf4',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Evaluación completada</div>
                <div style={{ fontSize: 12, color: '#166534' }}>
                  {result.total > 0 ? `${result.correct} de ${result.total} respuestas correctas (${pctResult}%)` : 'Tus respuestas fueron enviadas'}
                </div>
              </div>
            )
          }

          return null
        }

        case 'subida': {
          const docs = (selTarea.documentos || []).filter(d => d.nombre?.trim())
          if (docs.length === 0) {
            return (
              <div style={{ border: '2px dashed #f9a8d4', borderRadius: 12, padding: 28, textAlign: 'center', background: '#fdf2f8' }}>
                <Upload size={32} style={{ color: '#ec4899', marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#9d174d', margin: '0 0 4px' }}>Arrastra tu archivo aquí</p>
                <p style={{ fontSize: 11, color: '#be185d', margin: 0 }}>o haz clic para seleccionar</p>
              </div>
            )
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map((doc, i) => (
                <div key={doc.id ?? i} style={{ border: '2px dashed #f9a8d4', borderRadius: 12, padding: 18, textAlign: 'center', background: '#fdf2f8' }}>
                  <Upload size={22} style={{ color: '#ec4899', marginBottom: 6 }} />
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9d174d', margin: '0 0 3px' }}>{doc.nombre}</p>
                  <p style={{ fontSize: 10, color: '#be185d', margin: 0 }}>
                    o haz clic para seleccionar{doc.formato ? ` · ${doc.formato}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )
        }

        case 'completar-perfil': {
          const campos = selTarea.formCampos?.length ? selTarea.formCampos : []
          const tid = selTarea.id
          const isFormDone = readOnly || !!formSubmitted[tid]
          const frs = formRespuestas[tid] || {}
          const allReq = campos.every(c => !c.obligatorio || (Array.isArray(frs[c.id]) ? frs[c.id].length > 0 : (frs[c.id] || '').toString().trim()))

          if (campos.length === 0) {
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', background: '#f8fafc', textAlign: 'center' }}>
                <ClipboardList size={24} style={{ color: '#94a3b8', marginBottom: 6 }} />
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Este formulario aún no tiene campos configurados</div>
              </div>
            )
          }
          if (isFormDone) {
            return (
              <div style={{ border: '1px solid #a7f3d0', borderRadius: 12, padding: '20px 24px', textAlign: 'center', background: '#ecfdf5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={24} style={{ color: '#059669' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>Formulario enviado</div>
              </div>
            )
          }
          return (
            <div style={{ border: '1px solid #a7f3d0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={15} style={{ color: '#059669' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>Formulario</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {campos.map(campo => (
                  <div key={campo.id}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>
                      {campo.etiqueta}{campo.obligatorio && <span style={{ color: '#ef4444' }}> *</span>}
                    </label>
                    {campo.tipo === 'parrafo' && (
                      <textarea value={frs[campo.id] || ''} onChange={e => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: e.target.value } }))} className="pl-input" style={{ width: '100%', minHeight: 70, resize: 'none' }} />
                    )}
                    {campo.tipo === 'texto-corto' && (
                      <input type="text" value={frs[campo.id] || ''} onChange={e => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: e.target.value } }))} className="pl-input" style={{ width: '100%' }} />
                    )}
                    {campo.tipo === 'opcion-multiple' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {campo.opciones.map(opt => (
                          <button key={opt.id} onClick={() => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: opt.texto } }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: frs[campo.id] === opt.texto ? '1.5px solid #059669' : '1px solid #f1f5f9', background: frs[campo.id] === opt.texto ? '#ecfdf5' : '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: frs[campo.id] === opt.texto ? '5px solid #059669' : '2px solid #cbd5e1' }} />
                            {opt.texto}
                          </button>
                        ))}
                      </div>
                    )}
                    {campo.tipo === 'casillas' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {campo.opciones.map(opt => {
                          const sel = (frs[campo.id] || []).includes(opt.texto)
                          return (
                            <button key={opt.id} onClick={() => setFormRespuestas(prev => { const cur = prev[tid]?.[campo.id] || []; const next = sel ? cur.filter(v => v !== opt.texto) : [...cur, opt.texto]; return { ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: next } } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: sel ? '1.5px solid #059669' : '1px solid #f1f5f9', background: sel ? '#ecfdf5' : '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: sel ? 'none' : '2px solid #cbd5e1', background: sel ? '#059669' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel && <CheckCircle2 size={11} style={{ color: '#fff' }} />}</div>
                              {opt.texto}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {campo.tipo === 'desplegable' && (
                      <select value={frs[campo.id] || ''} onChange={e => setFormRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [campo.id]: e.target.value } }))} className="pl-input" style={{ width: '100%' }}>
                        <option value="">Selecciona...</option>
                        {campo.opciones.map(opt => <option key={opt.id} value={opt.texto}>{opt.texto}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                <button
                  disabled={!allReq}
                  onClick={() => { setFormSubmitted(prev => ({ ...prev, [tid]: true })); toggleDone(tid); setSelTarea(prev => ({ ...prev, done: true })) }}
                  style={{
                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
                    background: allReq ? '#059669' : '#e2e8f0', color: allReq ? '#fff' : '#94a3b8', border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: allReq ? 'pointer' : 'default', fontFamily: 'inherit',
                  }}
                >
                  <ClipboardList size={14} />
                  Enviar formulario
                </button>
              </div>
            </div>
          )
        }
        case 'perfil': {
          const tid = selTarea.id
          const isPerfilDone = readOnly || !!perfilSubmitted[tid]
          const tab = perfilTab[tid] || 'personales'
          const progress = perfilProgress[tid] || {}
          const doneCount = Object.values(progress).filter(Boolean).length
          const allDone = doneCount >= PERFIL_TOTAL_SECCIONES
          const toggleSeccion = (key) => {
            setPerfilProgress(prev => {
              const current = prev[tid] || {}
              return { ...prev, [tid]: { ...current, [key]: !current[key] } }
            })
          }
          if (isPerfilDone) {
            return (
              <div style={{ border: '1px solid #ddd6fe', borderRadius: 12, padding: '20px 24px', textAlign: 'center', background: '#f5f3ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={24} style={{ color: '#7c3aed' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6' }}>Perfil completado</div>
              </div>
            )
          }
          return (
            <div style={{ border: '1px solid #ddd6fe', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f5f3ff', borderBottom: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IdCard size={15} style={{ color: '#7c3aed' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6' }}>Completar perfil</span>
                </div>
                <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>{doneCount}/{PERFIL_TOTAL_SECCIONES}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                {PERFIL_TABS.map(t => (
                  <button key={t.key} onClick={() => setPerfilTab(prev => ({ ...prev, [tid]: t.key }))} style={{
                    flex: 1, padding: '10px 8px', fontSize: 11.5, fontWeight: 700,
                    border: 'none', borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
                    background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    color: tab === t.key ? '#5b21b6' : '#94a3b8',
                  }}>{t.label}</button>
                ))}
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PERFIL_SECCIONES[tab].map(s => {
                  const key = `${tab}:${s}`
                  const done = !!progress[key]
                  return (
                    <button key={key} onClick={() => toggleSeccion(key)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                      background: done ? '#f5f3ff' : '#fff', border: done ? '1.5px solid #7c3aed' : '1px solid #f1f5f9',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        background: done ? '#7c3aed' : '#fff',
                        border: done ? 'none' : '2px solid #cbd5e1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done && <CheckCircle2 size={11} style={{ color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 12, color: '#475569' }}>{s}</span>
                    </button>
                  )
                })}
                <button
                  disabled={!allDone}
                  onClick={() => { setPerfilSubmitted(prev => ({ ...prev, [tid]: true })); toggleDone(tid); setSelTarea(prev => ({ ...prev, done: true })) }}
                  style={{
                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
                    background: allDone ? '#7c3aed' : '#e2e8f0', color: allDone ? '#fff' : '#94a3b8', border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: allDone ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 4,
                  }}
                >
                  <IdCard size={14} />
                  Enviar perfil
                </button>
              </div>
            </div>
          )
        }


        case 'pulso': {
          const preguntas = selTarea.pulsoPreguntas?.length ? selTarea.pulsoPreguntas : ['¿Cómo te sientes con tu proceso de onboarding hasta ahora?']
          const tid = selTarea.id
          const isPulsoDone = readOnly || !!pulsoSubmitted[tid]
          const respuestas = pulsoRespuestas[tid] || {}
          const allAns = preguntas.every((_, i) => respuestas[i] !== undefined)
          if (isPulsoDone) {
            return (
              <div style={{ border: '1px solid #fbcfe8', borderRadius: 12, padding: '20px 24px', textAlign: 'center', background: '#fdf2f8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={24} style={{ color: '#db2777' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#9d174d' }}>¡Gracias por contarnos cómo te sientes!</div>
                <p style={{ fontSize: 12, color: '#be185d', margin: 0 }}>Tu líder podrá ver tus respuestas para acompañarte mejor.</p>
              </div>
            )
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {preguntas.map((p, qi) => (
                <div key={qi} style={{ border: '1px solid #fbcfe8', borderRadius: 12, padding: '14px 18px', background: '#fdf2f8' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#831843', margin: '0 0 10px' }}>{p}</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['😞', '😕', '😐', '🙂', '😄'].map((emoji, vi) => (
                      <button key={vi} onClick={() => setPulsoRespuestas(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [qi]: vi } }))} style={{
                        width: 40, height: 40, borderRadius: '50%', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: respuestas[qi] === vi ? '2px solid #db2777' : '1px solid #f5d0e0',
                        background: respuestas[qi] === vi ? '#fce7f3' : '#fff', cursor: 'pointer', transition: 'all .12s',
                      }}>{emoji}</button>
                    ))}
                  </div>
                </div>
              ))}
              <label className="pl-label" style={{ fontSize: 11, color: '#475569' }}>
                ¿Algo que quieras contarnos? (opcional)
                <textarea
                  value={pulsoComentario[tid] || ''}
                  onChange={e => setPulsoComentario(prev => ({ ...prev, [tid]: e.target.value }))}
                  className="pl-input"
                  style={{ minHeight: 70, resize: 'none' }}
                  placeholder="Escribe aquí si hay algo que quieras compartir con tu líder"
                />
              </label>
              <button
                disabled={!allAns}
                onClick={() => { setPulsoSubmitted(prev => ({ ...prev, [tid]: true })); toggleDone(tid); setSelTarea(prev => ({ ...prev, done: true })) }}
                style={{
                  alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
                  background: allAns ? '#db2777' : '#e2e8f0', color: allAns ? '#fff' : '#94a3b8', border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: allAns ? 'pointer' : 'default', fontFamily: 'inherit',
                }}
              >
                <Smile size={14} />
                Enviar respuestas
              </button>
            </div>
          )
        }

        case 'recorrido': {
          const stops = [
            { name: 'Recepción y entrada principal', guia: 'Carlos Méndez', rol: 'Seguridad' },
            { name: 'Tu área de trabajo', guia: 'Nicolás Zapata', rol: 'Líder de área' },
            { name: 'Sala de reuniones', guia: 'Nicolás Zapata', rol: 'Líder de área' },
            { name: 'Comedor y áreas comunes', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Área de impresoras', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Estacionamiento', guia: 'Carlos Méndez', rol: 'Seguridad' },
            { name: 'Sala de capacitación', guia: 'Alejandro Ríos', rol: 'TI' },
            { name: 'Enfermería', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Terraza y áreas verdes', guia: 'Paola Arce', rol: 'RRHH' },
            { name: 'Salida de emergencia', guia: 'Carlos Méndez', rol: 'Seguridad' },
          ]
          const doneSet = selTarea.done ? Object.fromEntries(stops.map((_, i) => [i, true])) : (recorridoStops[selTarea.id] || {})
          const doneCount = typeof doneSet === 'object' ? Object.keys(doneSet).filter(k => doneSet[k]).length : 0
          const allStopsDone = doneCount >= stops.length
          const toggleStop = (i) => {
            setRecorridoStops(prev => {
              const current = typeof prev[selTarea.id] === 'object' ? prev[selTarea.id] : {}
              return { ...prev, [selTarea.id]: { ...current, [i]: !current[i] } }
            })
          }
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: '#eff6ff', color: '#2563eb' }}>Recorrido libre</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{doneCount}/{stops.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stops.map((stop, i) => {
                  const isDone = !!doneSet[i]
                  return (
                    <div key={i} onClick={() => !selTarea.done && toggleStop(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: isDone ? '#faf5ff' : '#f8fafc', border: '1px solid #f1f5f9', cursor: selTarea.done ? 'default' : 'pointer', opacity: selTarea.done ? 0.7 : 1, transition: 'all .15s' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: isDone ? '#7c3aed' : '#fff', border: isDone ? 'none' : '1.5px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isDone && <CheckCircle2 size={10} style={{ color: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: isDone ? 600 : 400, color: isDone ? '#7c3aed' : '#334155' }}>{stop.name}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{stop.guia} · {stop.rol}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: allStopsDone ? '#16a34a' : '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                {allStopsDone ? <><CheckCircle2 size={11} /> Recorrido completado</> : <><MapPin size={11} /> Marca cada lugar cuando lo visites</>}
              </div>
            </>
          )
        }

        case 'tarea-otro':
          return (
            <div style={{ border: '1px solid #fecaca', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={15} style={{ color: '#dc2626' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Tarea supervisada</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>Esta tarea será supervisada por tu líder o un compañero designado.</p>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={13} style={{ color: '#dc2626' }} /><span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>Requiere validación del supervisor</span>
                </div>
              </div>
            </div>
          )

        case 'enlace':
          return (
            <div style={{ border: '1px solid #c7d2fe', borderRadius: 12, padding: 20, textAlign: 'center', background: '#eef2ff' }}>
              <ExternalLink size={28} style={{ color: '#6366f1', marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#3730a3', margin: '0 0 4px' }}>Recurso externo</p>
              <p style={{ fontSize: 11, color: '#6366f1', margin: '0 0 14px' }}>Se abrirá en una nueva pestaña</p>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <ExternalLink size={13} /> Abrir enlace
              </button>
            </div>
          )

        case 'form-custom':
          return (
            <div style={{ border: '1px solid #a7f3d0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={15} style={{ color: '#059669' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>Formulario práctico</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>Completa el ejercicio práctico siguiendo las instrucciones.</p>
                {['Campo 1', 'Campo 2'].map((field, i) => (
                  <div key={i}><label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 3, display: 'block' }}>{field}</label><div style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }} /></div>
                ))}
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#059669', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Send size={13} /> Enviar respuesta</button>
              </div>
            </div>
          )

        case 'confirmacion':
          return (
            <div style={{ borderRadius: 12, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', border: '1px solid #fde68a' }}>
              <Award size={40} style={{ color: '#d97706', marginBottom: 10 }} />
              <p style={{ fontSize: 15, fontWeight: 800, color: '#92400e', margin: '0 0 6px' }}>Certificado de graduación</p>
              <p style={{ fontSize: 12, color: '#b45309', margin: '0 0 14px', lineHeight: 1.5 }}>Al completar todas las tareas obligatorias recibirás tu certificado de onboarding.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(217,119,6,0.1)', fontSize: 11, fontWeight: 700, color: '#d97706' }}><Trophy size={13} /> +{selTarea.puntos} Pts al completar</div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div className="jb">
        <div className="jb-topbar">
          <div className="jb-breadcrumb">
            <button className="jb-back" onClick={() => { setSelTarea(null); setSelContext(null) }}>
              <ArrowLeft size={16} />
            </button>
            {selContext && (
              <>
                <span className="jb-bc-text">{selContext.etapa}</span>
                <ChevronRight size={14} className="jb-bc-sep" />
                <span className="jb-bc-text">{selContext.actividad}</span>
                <ChevronRight size={14} className="jb-bc-sep" />
              </>
            )}
            <span className="jb-bc-current">{selTarea.name}</span>
          </div>
          <div className="jb-topbar-actions" style={{ gap: 8 }}>
            {selTarea.done ? (
              <>
                {!readOnly && (
                  <button
                    className="jb-btn-outline"
                    onClick={() => { toggleDone(selTarea.id); setSelTarea(prev => ({ ...prev, done: !prev.done })); setShowAlert(false) }}
                  >Desmarcar</button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>Completada</span>
                </div>
              </>
            ) : selTarea.tipo === 'video' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #dbeafe' }}>
                <Info size={14} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1e40af' }}>Se completa automáticamente al terminar el video{selTarea.verificarQuiz !== false ? ' y la evaluación' : ''}</span>
              </div>
            ) : selTarea.tipo === 'pulso' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                <Info size={14} style={{ color: '#db2777' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9d174d' }}>Se completa al enviar tus respuestas</span>
              </div>
            ) : selTarea.tipo === 'completar-perfil' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <Info size={14} style={{ color: '#059669' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>Se completa al enviar el formulario</span>
              </div>
            ) : (
              <button
                className="jb-btn-primary"
                onClick={() => {
                  if (selTarea.tipo === 'recorrido') {
                    const doneSet = recorridoStops[selTarea.id] || {}
                    const doneCount = typeof doneSet === 'object' ? Object.keys(doneSet).filter(k => doneSet[k]).length : 0
                    if (doneCount < 10) {
                      setShowAlert('Debes completar todas las paradas del recorrido antes de marcar como completada')
                      setTimeout(() => setShowAlert(false), 3000)
                      return
                    }
                  }
                  if (selTarea.tipo === 'documento' && selTarea.verificarQuiz !== false) {
                    if (!quizSubmitted[selTarea.id]) {
                      setShowAlert('Debes completar la prueba de verificación antes de marcar como completada')
                      setTimeout(() => setShowAlert(false), 3000)
                      return
                    }
                  }
                  toggleDone(selTarea.id); setSelTarea(prev => ({ ...prev, done: !prev.done }))
                }}
              >
                <CheckCircle2 size={14} />
                Marcar como completada
              </button>
            )}
          </div>
        </div>

        {/* ALERTA */}
        {showAlert && (
          <div style={{
            position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
            background: '#0C2D40', color: '#fff', padding: '10px 20px',
            borderRadius: 10, fontSize: 12, fontWeight: 600, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 30px rgba(0,0,0,.2)',
            animation: 'plSlideUp .2s',
          }}>
            <MapPin size={14} style={{ color: '#f59e0b' }} />
            {showAlert}
            <button onClick={() => setShowAlert(false)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.5)', cursor: 'pointer', marginLeft: 4 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="jb-panels">
          <div className="jb-canvas">
            <div className="jb-canvas-body" style={{ padding: '24px 0' }}>
              <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}12`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0C2D40' }}>{selTarea.name}</h1>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {selTarea.obligatoria && (<span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#fef3c7', color: '#92400e', textTransform: 'uppercase' }}>Obligatoria</span>)}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${color}12`, color }}>{selTarea.tipo.replace('-', ' ')}</span>
                      {selTarea.puntos > 0 && (<span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#fef3c7', color: '#d97706' }}>+{selTarea.puntos} Pts</span>)}
                    </div>
                  </div>
                </div>

                {selTarea.desc && (
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{selTarea.desc}</p>
                  </div>
                )}

                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isMobile ? 'jb-mobile' : 'jb'}>
      {modalHistorial}
      {/* BARRA SUPERIOR */}
      {isMobile ? (
        <div style={{ marginBottom: 8 }}>
          {/* Fila 1: título + organigrama */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button
                onClick={() => setStarted(false)}
                title="Volver al resumen de mi ruta"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 17, height: 17, borderRadius: 6, padding: 0, flexShrink: 0,
                  background: '#fff', border: '1px solid #e2e8f0', color: '#0C2D40', cursor: 'pointer',
                }}
              >
                <ArrowLeft size={9} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0C2D40' }}>Mi Onboarding</span>
            </div>
            <AccionesCabecera compact onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
          </div>
          {/* Fila 2: tarjeta de progreso */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 11px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: '#0C2D40' }}>{totalDone} de {totalAll} tareas</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#00E091' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#00E091', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '3px 8px', borderRadius: 12 }}>
                <Star size={8} style={{ color: '#d97706' }} />
                <span style={{ fontSize: 7.5, fontWeight: 800, color: '#92400e' }}>{totalPuntos} pts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0fdf4', padding: '3px 8px', borderRadius: 12 }}>
                <Trophy size={8} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: 7.5, fontWeight: 800, color: '#166534' }}>{totalDone}/{totalAll} listas</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="jb-topbar">
          <div className="jb-breadcrumb">
            {/* El resumen de la ruta —etapas, tareas, puntos— solo vivía en la pantalla de
                bienvenida, que sin esto era un camino de ida. */}
            <button className="jb-back" onClick={() => setStarted(false)} title="Volver al resumen de mi ruta">
              <ArrowLeft size={16} />
            </button>
            <span className="jb-bc-current" style={{ fontSize: 14, fontWeight: 700 }}>Mi Onboarding</span>
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>
              Ruta: {ruta?.nombre || 'Sin asignar'}{ruta?.area ? ` — ${ruta.area}` : ''}
            </span>
          </div>
          <div className="jb-topbar-actions" style={{ gap: 10 }}>
            <AccionesCabecera onHistorial={abrirHistorial} onOrganigrama={irAlOrganigrama} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fef3c7', padding: '6px 12px', borderRadius: 8,
            }}>
              <Star size={13} style={{ color: '#d97706' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e' }}>{totalPuntos} Pts</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f0fdf4', padding: '6px 12px', borderRadius: 8,
            }}>
              <Trophy size={13} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#166534' }}>{totalDone}/{totalAll}</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f1f5f9', padding: '6px 12px', borderRadius: 8,
            }}>
              <Clock size={13} style={{ color: '#64748b' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{pct}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="jb-panels">
        <div className="jb-canvas">
          <div className="jb-canvas-body jb-pizarra">

            {/* CARD ETAPAS — izquierda */}
            {!isMobile && etapasOpen ? (
              <div className="jb-float-card jb-float-left">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="jb-sb-title">Etapas <span className="jb-sb-count">{etapas.length}</span></div>
                  <button className="jb-colab-collapse-btn" onClick={() => setEtapasOpen(false)} title="Cerrar">
                    <X size={13} />
                  </button>
                </div>
                <p className="jb-sb-hint">Tu recorrido de onboarding</p>

                <div style={{ padding: '0 0 12px' }}>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: '#00E091', borderRadius: 99,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                </div>

                <div className="jb-sb-list">
                  {etapas.map((e, i) => {
                    const tareas = flatTareas(e)
                    const done = tareas.every(t => t.done)
                    const progress = tareas.some(t => t.done)
                    const etapaDone = tareas.filter(t => t.done).length
                    return (
                      <button
                        key={i}
                        className={`jb-sb-item ${done ? 'done' : ''}`}
                        onClick={() => scrollToEtapa(i)}
                      >
                        <div className={`jb-sb-dot ${done ? 'dot-done' : progress ? 'dot-progress' : ''}`}>
                          {i === 0 ? <Lock size={9} /> : <span className="jb-sb-dot-num">{i + 1}</span>}
                        </div>
                        <div className="jb-sb-info">
                          <div className="jb-sb-name">{e.name}</div>
                          <div className="jb-sb-days">{e.days} · {etapaDone}/{tareas.length} completadas</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : !isMobile ? (
              <div className="jb-float-left">
                <button className="jb-colab-fab" onClick={() => setEtapasOpen(true)} title="Ver etapas">
                  <Route size={18} />
                </button>
              </div>
            ) : null}

            {/* CARD INFO — derecha */}
            {!isMobile && infoOpen ? (
              <div className="jb-float-card jb-float-right">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="jb-sb-title">Información</div>
                  <button className="jb-colab-collapse-btn" onClick={() => setInfoOpen(false)} title="Cerrar">
                    <X size={13} />
                  </button>
                </div>
                <p className="jb-sb-hint">Haz clic en un nodo para ver el detalle</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E091' }} />
                    <span style={{ fontSize: 11, color: '#475569' }}>Completada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0C2D40', boxShadow: '0 0 0 3px rgba(12,45,64,0.2)' }} />
                    <span style={{ fontSize: 11, color: '#475569' }}>Pendiente</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0' }} />
                    <span style={{ fontSize: 11, color: '#475569' }}>Bloqueada</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 14, paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>Tip</div>
                  <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, margin: 0 }}>
                    Completa las tareas obligatorias para desbloquear la siguiente etapa.
                  </p>
                </div>
              </div>
            ) : !isMobile ? (
              <div className="jb-float-right" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="jb-colab-fab" onClick={() => setInfoOpen(true)} title="Ver información">
                  <Info size={18} />
                </button>
              </div>
            ) : null}

            {/* TODAS LAS ETAPAS */}
            {etapas.map((etapa, ei) => {
              const etapaTareas = flatTareas(etapa)
              const etapaDone = etapaTareas.filter(t => t.done).length

              return (
                <div key={ei} ref={el => setEtapaRef(ei, el)}>
                  {/* HEADER ETAPA */}
                  <div className="jb-etapa-header" style={isMobile ? { padding: '6px 8px', gap: 6, borderRadius: 8, marginBottom: 8, alignItems: 'stretch' } : { alignItems: 'stretch' }}>
                    <div className="jb-etapa-num" style={isMobile ? { width: 20, height: 20, fontSize: 8 } : undefined}>
                      {ei === 0 ? <Lock size={isMobile ? 9 : 14} /> : ei + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="jb-etapa-name" style={isMobile ? { fontSize: 8.5, fontWeight: 700 } : undefined}>{etapa.name}</div>
                      <div className="jb-etapa-duration" style={isMobile ? { gap: 3 } : undefined}>
                        <Calendar size={isMobile ? 8 : 13} className="jb-dur-ico" />
                        <span className="jb-dur-label" style={isMobile ? { fontSize: 7 } : undefined}>{etapa.days}</span>
                        <span className="jb-dur-sep">·</span>
                        <span className="jb-dur-unit" style={isMobile ? { fontSize: 7 } : undefined}>
                          {etapaDone}/{etapaTareas.length}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: isMobile ? '2px 8px' : '4px 16px',
                      borderLeft: '1px solid #e2e8f0', marginLeft: isMobile ? 4 : 8,
                    }}>
                      <span style={{ fontSize: isMobile ? 14 : 28, fontWeight: 800, color: '#0C2D40', lineHeight: 1 }}>
                        {etapa.duracion || 7}
                      </span>
                      <span style={{ fontSize: isMobile ? 6 : 10, fontWeight: 600, color: '#94a3b8', marginTop: 1 }}>
                        días
                      </span>
                    </div>
                  </div>

                  {ei === 0 && (
                    <div className="jb-colab-mascot">
                      <img src={viaBebe} alt="Mascota" className="jb-colab-mascot-img" />
                    </div>
                  )}

                  {/* CAMINO DE NODOS */}
                  <div className="jb-duo-path">
                    {(() => {
                      const items = []
                      let flatIdx = 0

                      etapa.actividades.forEach((actividad, ai) => {
                        items.push(
                          <div key={`act-${ei}-${ai}`} className="jb-actividad-divider">
                            <span className="jb-actividad-pill">{actividad.name}</span>
                          </div>
                        )

                        actividad.tareas.forEach((tarea) => {
                          const i = flatIdx
                          const Icon = iconMap[tarea.tipo] || FileText
                          const isSelected = selTarea?.id === tarea.id
                          const status = tarea.done ? 'done' : 'active'
                          const xOff = positions[i % positions.length]

                          items.push(
                            <div
                              key={tarea.id}
                              className="jb-duo-node-wrap"
                              style={{ '--x-off': `${xOff}px`, cursor: 'default' }}
                            >
                              {ei === 0 && i === 0 && !tarea.done && (
                                <div className="jb-start-bubble">¡Empezar!</div>
                              )}
                              <button
                                className={`jb-duo-node ${status} ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  if (selTarea?.id === tarea.id) {
                                    setSelTarea(null)
                                    setSelContext(null)
                                  } else {
                                    setSelTarea(tarea)
                                    setSelContext({ etapa: etapa.name, actividad: actividad.name, days: etapa.days })
                                  }
                                }}
                                title={tarea.name}
                              >
                                <div className="jb-duo-circle">
                                  {tarea.done ? <CheckCircle2 size={22} /> : <Icon size={18} />}
                                </div>
                                {tarea.puntos > 0 && <span className="jb-duo-puntos">+{tarea.puntos}</span>}
                              </button>
                              <span className={`jb-duo-label ${status}`}>{tarea.name}</span>
                              {tarea.obligatoria && (
                                <span style={{
                                  fontSize: 8, fontWeight: 700, color: '#b45309',
                                  background: '#fef3c7', padding: '1px 5px', borderRadius: 4,
                                  marginTop: 3, textTransform: 'uppercase',
                                }}>
                                  Obligatoria
                                </span>
                              )}
                            </div>
                          )

                          flatIdx++
                        })
                      })

                      return items
                    })()}
                  </div>
                </div>
              )
            })}

            {/* FIN DEL CAMINO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 40px', gap: 8 }}>
              <img src={trofeoImg} alt="Trofeo" style={{ width: 80, height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.1))' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0C2D40' }}>Fin del onboarding</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Completa todas las tareas para graduarte</span>
            </div>

          </div>
        </div>
      </div>

      {/* CONFETTI */}
      {confettiPieces.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {confettiPieces.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: -20,
                width: p.type === 'circle' ? p.size : p.size * 0.6,
                height: p.size,
                borderRadius: p.type === 'circle' ? '50%' : 2,
                background: p.color,
                transform: `rotate(${p.rotation}deg)`,
                animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* MODAL CELEBRACIÓN */}
      {showCelebration && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'plFadeIn .3s',
        }} onClick={() => setShowCelebration(false)}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '36px 40px',
            maxWidth: 400, width: '90%', textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,.15)',
            animation: 'plSlideUp .3s',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <img src={viaTrofeo} alt="Trofeo" style={{ width: 80, margin: '0 auto 12px', display: 'block' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0C2D40', margin: '0 0 6px' }}>
              ¡Felicidades, {firstName}!
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Has completado todas las tareas de tu ruta de onboarding. ¡Excelente trabajo!
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ background: '#00E091', borderRadius: 10, padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{totalAll}/{totalAll}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>tareas</span>
              </div>
              <div style={{ background: '#f59e0b', borderRadius: 10, padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{totalPuntos}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Pts</span>
              </div>
              <div style={{ background: '#0C2D40', borderRadius: 10, padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>100%</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>completado</span>
              </div>
            </div>
            <button onClick={() => setShowCelebration(false)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#0C2D40', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 24px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Trophy size={14} />
              ¡Genial!
            </button>
          </div>
        </div>
      )}

      {/* CHATBOT ASISTENTE IA */}
      {asistenteIA && (
        <>
          {/* BURBUJA FLOTANTE */}
          {!chatOpen && (
            <button onClick={() => setChatOpen(true)} style={{
              position: isMobile ? 'absolute' : 'fixed', bottom: isMobile ? 54 : 24, right: isMobile ? 12 : 24,
              width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: '50%',
              background: '#0C2D40', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(12,45,64,0.3)', zIndex: 40,
              transition: 'transform .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Bot size={isMobile ? 22 : 26} style={{ color: '#00E091' }} />
            </button>
          )}

          {/* VENTANA DE CHAT */}
          {chatOpen && (
            <div style={{
              position: isMobile ? 'absolute' : 'fixed', bottom: isMobile ? 0 : 24, right: isMobile ? 0 : 24,
              width: isMobile ? '100%' : 370, height: isMobile ? '100%' : 480,
              background: '#fff', borderRadius: isMobile ? 0 : 16,
              boxShadow: '0 8px 40px rgba(0,0,0,.18)', zIndex: 50,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              border: isMobile ? 'none' : '1px solid #e2e8f0',
            }}>
              {/* HEADER */}
              <div style={{
                background: '#0C2D40', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,224,145,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Bot size={17} style={{ color: '#00E091' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Asistente de onboarding</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Responde sobre tus tareas y documentos</div>
                </div>
                <button onClick={() => setChatOpen(false)} style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                </button>
              </div>

              {/* MENSAJES */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
                      background: msg.from === 'user' ? '#0C2D40' : '#f1f5f9',
                      color: msg.from === 'user' ? '#fff' : '#334155',
                      fontSize: 12, lineHeight: 1.5,
                      borderBottomRightRadius: msg.from === 'user' ? 4 : 12,
                      borderBottomLeftRadius: msg.from === 'bot' ? 4 : 12,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      padding: '10px 18px', borderRadius: 12, borderBottomLeftRadius: 4,
                      background: '#f1f5f9', display: 'flex', gap: 4, alignItems: 'center',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'plPulse 1s infinite' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'plPulse 1s infinite 0.2s' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'plPulse 1s infinite 0.4s' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* SUGERENCIAS */}
              {chatMessages.length <= 2 && (
                <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Preguntas sugeridas</div>
                  {chatSuggestions.map(s => (
                    <button key={s} onClick={() => sendChat(s)} style={{
                      padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                      background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 11, color: '#475569', textAlign: 'left',
                      transition: 'all .12s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#0C2D40' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT */}
              <div style={{
                padding: '10px 14px', borderTop: '1px solid #f1f5f9',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendChat() }}
                  placeholder="Escribe tu pregunta..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    border: '1px solid #e2e8f0', fontSize: 12,
                    fontFamily: 'inherit', outline: 'none', color: '#334155',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0C2D40'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button onClick={() => sendChat()} disabled={!chatInput.trim()} style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: chatInput.trim() ? '#0C2D40' : '#f1f5f9',
                  cursor: chatInput.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  <Send size={14} style={{ color: chatInput.trim() ? '#00E091' : '#cbd5e1' }} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
