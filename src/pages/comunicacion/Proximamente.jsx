import { Megaphone, Award, CalendarClock, Send } from 'lucide-react'
import EmptyState from '../../components/layout/EmptyState'

/* LAS CUATRO PANTALLAS DEL MÓDULO DE COMUNICACIÓN QUE TODAVÍA NO ESTÁN CONSTRUIDAS.
   Van con su ruta y su cascarón, no como entradas muertas: una entrada del menú que no navega se
   lee como error del prototipo, y teniendo URL propia se puede construir cada una sin volver a
   tocar el menú.

   Lo que dice cada texto NO es relleno: es el encargo de esa pantalla. Cuando llegue el diseño
   de cualquiera de ellas, esto es contra lo que se compara. */
function Proximamente({ icon, titulo, subtitulo, mensaje }) {
  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">{titulo}</h1>
          <p className="pl-subtitle">{subtitulo}</p>
        </div>
      </div>
      <div className="sec-card">
        <EmptyState icon={icon} title="Próximamente" description={mensaje} />
      </div>
    </div>
  )
}

export function Anuncios() {
  return (
    <Proximamente
      icon={Megaphone}
      titulo="Gestión de anuncios"
      subtitulo="Lo que la empresa publica en el muro"
      mensaje="Redactar un anuncio, elegir a quién le llega —toda la empresa, un área, una sucursal— y ver cuánta gente lo leyó. Es el otro lado del muro que el colaborador ve en Mi día."
    />
  )
}

export function Reconocimientos() {
  return (
    <Proximamente
      icon={Award}
      titulo="Reconocimientos"
      subtitulo="Celebraciones y logros del equipo"
      mensaje="Cumpleaños, aniversarios, proyectos terminados y reconocimientos a una persona o a un equipo. Sale de aquí lo que después aparece en el calendario de la empresa y en el muro."
    />
  )
}

export function Eventos() {
  return (
    <Proximamente
      icon={CalendarClock}
      titulo="Gestión de eventos"
      subtitulo="Los eventos de la empresa, de la convocatoria a la asistencia"
      mensaje="Crear un evento, invitar, confirmar quién va y dejarlo publicado en el calendario. Hoy el calendario los muestra; falta el lugar donde se arman."
    />
  )
}

export function MensajesProgramados() {
  return (
    <Proximamente
      icon={Send}
      titulo="Mensajes programados"
      subtitulo="Lo que se envía solo, en su momento"
      mensaje="Mensajes con fecha y hora de salida, y los que se disparan por un hecho: la bienvenida del primer día, el saludo de cumpleaños, el recordatorio de una tarea de onboarding que vence."
    />
  )
}
