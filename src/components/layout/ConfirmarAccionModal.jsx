import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

/* Confirmación de una acción destructiva. Antes cada pantalla escribía este diálogo a mano,
   con el resultado de que unas exigían escribir la palabra y otras igual de irreversibles no.

   `palabra` es el verbo de la acción ("eliminar", "desasignar"), no el nombre de la entidad:
   escribir el nombre de una persona para desasignarla se lee como si el castigo fuera contra
   ella, y con tildes o nombres largos solo añade fricción sin añadir seguridad.
   Si se omite, el diálogo confirma con un solo clic — para lo reversible. */
/* `zIndex` para cuando la confirmación se abre desde otro modal: los dos overlays comparten
   z-index y sin esto el diálogo quedaría por debajo de lo que viene a confirmar. */
export default function ConfirmarAccionModal({
  titulo,
  descripcion,
  palabra,
  textoConfirmar,
  onConfirmar,
  onCancelar,
  icono: Icono = Trash2,
  zIndex,
}) {
  const [texto, setTexto] = useState('')
  const puedeConfirmar = !palabra || texto.trim().toLowerCase() === palabra.toLowerCase()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancelar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancelar])

  return (
    <div className="pl-overlay" style={zIndex ? { zIndex } : undefined} onClick={onCancelar}>
      <div className="pl-modal pl-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pl-modal-body" style={{ textAlign: 'center', padding: '28px 24px 16px' }}>
          <div className="pl-del-icon">
            <Icono size={24} />
          </div>
          <h2 className="pl-del-title">{titulo}</h2>
          <p className="pl-del-desc">{descripcion}</p>
          {palabra && (
            <div className="pl-del-confirmar">
              <span className="pl-del-pedido">
                Escribe <strong>{palabra}</strong> para confirmar
              </span>
              <input
                type="text"
                className="pl-input"
                placeholder={palabra}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                /* Enter solo dispara con la palabra completa: si no, el atajo se convierte
                   en la forma rápida de saltarse justo la fricción que estamos añadiendo. */
                onKeyDown={e => { if (e.key === 'Enter' && puedeConfirmar) onConfirmar() }}
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="pl-modal-footer" style={{ justifyContent: 'center' }}>
          <button className="pl-btn-cancel" onClick={onCancelar}>Cancelar</button>
          <button className="pl-btn-delete" disabled={!puedeConfirmar} onClick={onConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
