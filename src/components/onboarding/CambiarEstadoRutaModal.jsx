import { useEffect, useState } from 'react'
import { Check, Lock, Users, ToggleLeft, Pencil } from 'lucide-react'
import { transicionesDe, describirPuesto, rutasEnConflicto, cargosDe } from '../../utils/rutaEstados'

/* Un solo lugar para mover el estado de una ruta.

   Antes había tres verbos sueltos en el menú —"Activar", "Desactivar", "Archivar"— y cada
   uno aparecía o no según el estado, así que el menú cambiaba de forma entre una ruta y otra
   y nunca se veía el cuadro completo. Acá los tres estados están siempre a la vista: el
   actual marcado, los que se pueden elegir, y los que no con el motivo escrito. Un selector
   que esconde lo imposible no enseña la regla, hace creer que uno se equivocó de menú.

   Cada opción dice qué hace el sistema en ese estado y no solo cómo se llama: la única
   pregunta real al cambiarlo es "¿le entra gente nueva o no?".

   Si el destino es Activo y el puesto ya tiene otra ruta vigente, este modal no resuelve el
   choque: avisa y deja que lo confirme `ActivarRutaModal`, que es el que muestra el
   intercambio ruta por ruta. */
export default function CambiarEstadoRutaModal({ ruta, plantillas, enCurso = 0, onConfirmar, onEditarRuta, onCancelar }) {
  const opciones = transicionesDe(ruta)
  const actual = opciones.find(o => o.actual)
  const disponibles = opciones.filter(o => !o.motivo)
  const primeraDisponible = disponibles[0]?.key
  const [elegido, setElegido] = useState(primeraDisponible || null)
  /* Callejón sin salida: ningún destino disponible. Pasa con un borrador vacío, que no puede
     ir a Activo hasta tener una tarea. Decir qué falta no alcanza si desde aquí no se puede
     hacer nada al respecto, así que el pie deja de ofrecer "Cambiar estado" —que no tendría
     a qué cambiar— y ofrece ir a resolverlo. */
  const sinSalida = !primeraDisponible
  const faltanTareas = !ruta?.tareas

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancelar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancelar])

  const conflictos = elegido === 'activa' ? rutasEnConflicto(plantillas, ruta) : []

  return (
    <div className="pl-overlay" onClick={onCancelar}>
      <div className="pl-modal pl-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pl-modal-body" style={{ padding: '26px 24px 18px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(12,45,64,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ToggleLeft size={17} style={{ color: 'var(--navy-txt)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.35, margin: 0 }}>
                Cambiar estado
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '4px 0 0' }}>
                <strong style={{ color: 'var(--text-heading)' }}>{ruta.name}</strong>
                {cargosDe(ruta).length > 0 && <> — {describirPuesto(ruta)}</>}
              </p>
              {/* El estado de ahora, como dato de la cabecera y no como una opción más de la
                  lista: no es algo a lo que se pueda "cambiar". */}
              {actual && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Ahora está en</span>
                  <span className={`pl-status ${actual.clase}`}>{actual.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Solo los destinos posibles. Los que la matriz no permite ni se muestran: una
              opción que no se puede marcar es una pregunta sin respuesta, y obliga a leer un
              motivo para descartarla. La regla de que nadie vuelve a Borrador se explica
              donde se explica el modelo, no en cada intento de usarlo. */}
          {disponibles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {disponibles.map(o => {
                const sel = elegido === o.key
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setElegido(o.key)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                      padding: '11px 12px', borderRadius: 10, textAlign: 'left', fontFamily: 'inherit',
                      border: `1px solid ${sel ? 'var(--navy)' : 'var(--border-soft)'}`,
                      boxShadow: sel ? '0 0 0 2px rgba(12,45,64,.1)' : 'none',
                      background: 'var(--surface-card)', cursor: 'pointer',
                      transition: 'border-color .12s, box-shadow .12s',
                    }}
                  >
                    {/* La píldora del estado y no un radio con su nombre al lado: es la misma
                        que se ve en la lista, así que se reconoce sin leer. */}
                    <span className={`pl-status ${o.clase}`} style={{ flexShrink: 0, marginTop: 1 }}>{o.label}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {o.regla}
                    </span>
                    {sel && <Check size={15} style={{ color: 'var(--navy-txt)', flexShrink: 0, marginTop: 2 }} />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Sin destinos: hoy solo pasa con un borrador sin tareas, que no puede activarse
              todavía. Se dice qué falta y el pie lleva a hacerlo. */}
          {sinSalida && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              padding: '12px 13px', borderRadius: 10,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)',
            }}>
              <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11.5, color: 'var(--text-heading)', lineHeight: 1.55 }}>
                Esta ruta todavía no puede cambiar de estado: <strong>le falta al menos una
                tarea</strong> para poder ponerse en uso.
              </span>
            </div>
          )}

          {/* Lo que va a pasarle a la gente: en párrafo se lo salta todo el mundo, así que va
              como número y solo cuando hay alguien adentro. */}
          {elegido === 'inactiva' && enCurso > 0 && (
            <Nota>
              <strong>{enCurso} {enCurso === 1 ? 'colaborador sigue' : 'colaboradores siguen'}</strong>{' '}
              con esta ruta hasta terminar. Dejar de asignarla no saca a nadie de la suya.
            </Nota>
          )}

          {conflictos.length > 0 && (
            <Nota>
              <strong>{describirPuesto(ruta)}</strong> ya tiene{' '}
              {conflictos.length === 1 ? 'una ruta vigente' : `${conflictos.length} rutas vigentes`}. Al continuar
              vas a confirmar el reemplazo.
            </Nota>
          )}
        </div>

        <div className="pl-modal-footer">
          <button className="pl-btn-cancel" onClick={onCancelar}>Cancelar</button>
          {sinSalida && faltanTareas && onEditarRuta ? (
            <button
              className="pl-btn-save"
              onClick={onEditarRuta}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Pencil size={13} />
              Agregar tareas
            </button>
          ) : (
            <button
              className="pl-btn-save"
              disabled={!elegido}
              onClick={() => onConfirmar(elegido)}
            >
              {conflictos.length > 0 ? 'Continuar' : 'Cambiar estado'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Nota = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12,
    padding: '10px 12px', borderRadius: 10, background: 'var(--bg-secondary)',
  }}>
    <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
    <span style={{ fontSize: 11.5, color: 'var(--text-heading)', lineHeight: 1.55 }}>{children}</span>
  </div>
)
