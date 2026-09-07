import { Target, Megaphone, Award } from 'lucide-react'
import { colaboradores, procesosEvaluacion, publicaciones, reconocimientos } from '../pages/inicio/homeData'

// "hoy" ficticio del demo, igual que el Dashboard de Onboarding
export const HOY = new Date(2026, 5, 17)

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function parseFechaDMY(str) {
  const [d, m, y] = str.split('/').map(Number)
  return { d, m, y }
}

export function buildCalendarCells(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, inMonth: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true })
  let next = 1
  while (cells.length % 7 !== 0) cells.push({ day: next++, inMonth: false })
  return cells
}

// Eventos reales del mes: cumpleaños y aniversarios de colaboradores, evaluaciones
// programadas, publicaciones y reconocimientos — todos backed por módulos existentes.
export function buildEventosDelMes(year, month) {
  const eventosPorDia = {}
  const addEvento = (dia, evento) => {
    if (!eventosPorDia[dia]) eventosPorDia[dia] = []
    eventosPorDia[dia].push(evento)
  }

  // Quien ya causó baja no celebra cumpleaños ni aniversario en la agenda de la empresa.
  colaboradores.filter(c => !c.fechaBaja).forEach(c => {
    const cumple = parseFechaDMY(c.fechaNacimiento)
    if (cumple.m === month + 1) {
      addEvento(cumple.d, { kind: 'persona', titulo: c.nombre, subtitulo: `${c.area} · ${c.cargo}`, tipo: 'Cumpleaños', color: '#ec4899' })
    }
    const ingreso = parseFechaDMY(c.fechaIngreso)
    const anios = year - ingreso.y
    // Un ingreso del año en curso todavía no cumple un aniversario.
    if (ingreso.m === month + 1 && anios >= 1) {
      addEvento(ingreso.d, { kind: 'persona', titulo: c.nombre, subtitulo: `${c.area} · ${c.cargo}`, tipo: `Aniversario · ${anios} ${anios === 1 ? 'año' : 'años'}`, color: 'var(--green)' })
    }
  })

  procesosEvaluacion.forEach(p => {
    if (p.estado !== 'en-curso' && p.estado !== 'programado') return
    const inicio = parseFechaDMY(p.inicio)
    if (inicio.m === month + 1) {
      addEvento(inicio.d, { kind: 'evaluacion', titulo: p.nombre, subtitulo: p.tipo, tipo: 'Comienza evaluación', color: 'var(--yellow)', Icon: Target })
    }
    const fin = parseFechaDMY(p.fin)
    if (fin.m === month + 1) {
      addEvento(fin.d, { kind: 'evaluacion', titulo: p.nombre, subtitulo: p.tipo, tipo: 'Vence evaluación', color: 'var(--yellow)', Icon: Target })
    }
  })

  publicaciones.forEach(pub => {
    const f = parseFechaDMY(pub.fecha.split(' ')[0])
    if (f.m === month + 1) {
      addEvento(f.d, { kind: 'publicacion', titulo: pub.titulo, subtitulo: pub.audiencia, tipo: 'Publicación', color: 'var(--purple)', Icon: Megaphone })
    }
  })

  reconocimientos.forEach(r => {
    const f = parseFechaDMY(r.fecha)
    if (f.m === month + 1) {
      addEvento(f.d, { kind: 'reconocimiento', titulo: r.persona, subtitulo: `${r.tipo}: ${r.motivo}`, tipo: 'Reconocimiento', color: 'var(--blue)', Icon: Award })
    }
  })

  return eventosPorDia
}

export const CALENDAR_LEGEND = [
  { label: 'Cumpleaños', color: '#ec4899' },
  { label: 'Aniversario', color: 'var(--green)' },
  { label: 'Evaluación', color: 'var(--yellow)' },
  { label: 'Publicación', color: 'var(--purple)' },
  { label: 'Reconocimiento', color: 'var(--blue)' },
]

// `size` para las fichas que muestran la foto más grande: pedir 40 px y estirarlos se ve borroso.
/* LAS FOTOS DE LA DEMO salen de pravatar, que devuelve una cara al azar a partir del nombre.
   Casi siempre sale bien, pero a veces toca una que no sirve para enseñar el producto —cortada,
   a contraluz, o sencillamente fea— y no hay forma de pedirle otra sin cambiarle el nombre a la
   persona. Para esos casos se fija la foto por su número.

   Vive aquí y no en la ficha de nadie porque es un dato de PRESENTACIÓN de la demo, no del
   modelo: en producción la foto la sube cada quien. Cambiar una cara es cambiar un número. */
const FOTO_FIJA = {
  'Juan Pérez Gómez': 68,
}

export const avatarUrl = (name, size = 40) => (
  FOTO_FIJA[name]
    ? `https://i.pravatar.cc/${size}?img=${FOTO_FIJA[name]}`
    : `https://i.pravatar.cc/${size}?u=${encodeURIComponent(name)}`
)
