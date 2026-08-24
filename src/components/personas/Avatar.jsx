import { useState } from 'react'
import { fotoDe } from '../../pages/personas/colaboradoresData'

/* La cara de una persona. La inicial no se reemplaza: se queda debajo y la foto se apoya
   encima, así que si la imagen no carga —sin conexión, en una demo— vuelve sola a lo de antes
   en vez de dejar el hueco roto del navegador.

   `clase` existe porque el mismo dibujo aparece en tres tamaños con estilos ya escritos (la
   ficha del modal, el chip del cuadro, la lista del celular) y no valía la pena unificarlos
   para esto. */
export default function Avatar({ persona, size = 22, clase = 'og-av', style }) {
  const [roto, setRoto] = useState(false)
  const foto = fotoDe(persona)
  return (
    <span
      className={clase}
      style={{ background: persona.color, width: size, height: size, fontSize: size * 0.4, ...style }}
    >
      {persona.initials}
      {foto && !roto && <img src={foto} alt="" onError={() => setRoto(true)} />}
    </span>
  )
}
