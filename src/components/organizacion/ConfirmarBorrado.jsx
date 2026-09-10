import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/* BORRAR PIDE ESCRIBIRLO.
   Un botón rojo detrás de un clic es una barrera de un solo movimiento, y el movimiento es el
   mismo que se venía haciendo para todo lo demás: pulsar. Quien está recorriendo la tabla a
   golpe de ratón lo pulsa igual, y un nodo borrado no vuelve.

   Escribir la palabra rompe esa inercia porque obliga a cambiar de herramienta —del ratón al
   teclado— y a leer qué se está por borrar. Es la misma barrera que ponen GitHub o Stripe antes
   de destruir algo, y por el mismo motivo: no es que sea difícil, es que es DISTINTO.

   NO SE PIDE ESCRIBIR EL NOMBRE DEL NODO sino la palabra "eliminar". El nombre se copia y se
   pega sin leerlo —y "Sucursal" lo pueden tener tres sucursales—; la palabra hay que teclearla, y de paso
   dice en voz alta lo que se está haciendo.

   LO QUE TIENE ALGO COLGANDO NO LLEGA A ESTA PREGUNTA: no hay confirmación que arregle dejar
   cinco nodos apuntando a un padre que ya no existe. Ahí se explica y se pide moverlos primero. */

const PALABRA = 'eliminar'

/* `bloqueoTexto` REEMPLAZA LA EXPLICACIÓN, NO EL AVISO. Lo que impide borrar no siempre son
   hijos: a una unidad de negocio la retienen los nodos que la declararon, que no cuelgan de ella.
   El titular —«No se puede eliminar todavía»— vale igual en los dos casos; lo que cambia es la
   frase que dice qué hay que hacer antes. */
export default function ConfirmarBorrado({ nombre, tipo, hijos = 0, nota, bloqueoTexto, onCerrar, onEliminar }) {
  const [escrito, setEscrito] = useState('')
  const bloqueado = hijos > 0
  const puede = !bloqueado && escrito.trim().toLowerCase() === PALABRA

  return (
    <div className="pl-overlay" onClick={onCerrar}>
      <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="pl-modal-header">
          <h2>Eliminar {tipo?.toLowerCase() || 'elemento'}</h2>
          <button className="pl-modal-close" onClick={onCerrar}><X size={18} /></button>
        </div>

        <div className="pl-modal-body">
          {bloqueado ? (
            <>
              <div className="est-alerta">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>No se puede eliminar todavía</span>
              </div>
              <p className="cb-texto">
                {bloqueoTexto || <>
                <strong>{nombre}</strong> tiene {hijos} {hijos === 1 ? 'nodo colgando' : 'nodos colgando'}.
                Muévelos a otro padre y vuelve a intentarlo: borrarlo los dejaría apuntando a algo
                que ya no existe.
                </>}
              </p>
            </>
          ) : (
            <>
              <p className="cb-texto">
                Se eliminará <strong>{nombre}</strong> y no se puede deshacer.
                {nota && <> {nota}</>}
              </p>

              <label className="cb-label" htmlFor="cb-palabra">
                Escribe <b>{PALABRA}</b> para confirmar
              </label>
              <input
                id="cb-palabra"
                className="pl-input"
                autoFocus
                autoComplete="off"
                value={escrito}
                placeholder={PALABRA}
                onChange={e => setEscrito(e.target.value)}
                /* Enter borra solo cuando la palabra ya está bien escrita: si no, el modal se
                   cerraría sin hacer nada y parecería que falló. */
                onKeyDown={e => { if (e.key === 'Enter' && puede) onEliminar() }}
              />
            </>
          )}
        </div>

        <div className="pl-modal-footer">
          <button className="pl-btn-cancel" onClick={onCerrar}>
            {bloqueado ? 'Entendido' : 'Cancelar'}
          </button>
          {!bloqueado && (
            <button className="est-btn-borrar" disabled={!puede} onClick={onEliminar}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
