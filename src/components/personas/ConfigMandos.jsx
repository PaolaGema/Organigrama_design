import { useState } from 'react'
import { Layers, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import CabeceraModal from './CabeceraModal'
import ConfirmarAccionModal from '../layout/ConfirmarAccionModal'
import { nivelesDe, nuevoId } from '../../data/organigramaData'

/* LOS NIVELES DE MANDO DE LA EMPRESA.
   Nosotros sembramos tres —Mando superior, medio y bajo— y ahí termina nuestra opinión: cada
   empresa los renombra y agrega los que le falten. Por eso son un DATO (`org.niveles`) y no un
   enum del código.

   EL NÚMERO NO SE ESCRIBE, sale del orden de la lista. Es lo que hace que intercalar un peldaño
   entre el primero y el segundo renumere todo solo sin tocar un solo cargo: lo que el cargo
   guarda es el id del peldaño, nunca su número.

   Y ese número es lo que el dibujo convierte en altura: cada peldaño de diferencia baja el
   cuadro 32 px —medio cuadro— respecto del más alto de su fila. Con cuatro niveles, el cuarto
   queda 96 px por debajo del primero. */

/* Cuánto baja cada peldaño en el dibujo. Vive acá solo para poder decirlo en pantalla; el
   dibujo lo aplica en `OrgNodos`. */
const PASO_PX = 32

/* El nombre no puede quedar vacío ni repetido: dos peldaños llamados igual son dos filas que
   dicen lo mismo y ninguna insignia sabría a cuál se refiere. */
const problemaDe = (lista, i) => {
  const nombre = lista[i].nombre.trim()
  if (!nombre) return 'Ponle un nombre'
  if (lista.some((n, j) => j !== i && n.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
    return 'Ya hay otro nivel con ese nombre'
  }
  return null
}

export default function ConfigMandos({ org, onGuardar, onCerrar }) {
  const [lista, setLista] = useState(() => nivelesDe(org).map(n => ({ ...n })))
  /* Qué peldaño se está por borrar, y a cuántos cargos deja sin nivel. Se pregunta SOLO cuando
     arrastra algo: borrar uno que nadie usa no merece un modal encima de otro modal. */
  const [borrando, setBorrando] = useState(null)

  const cuantosUsan = id => org.cargos.filter(c => c.grado === id).length
  const problemas = lista.map((_, i) => problemaDe(lista, i))
  const hayProblema = problemas.some(Boolean)

  const renombrar = (i, nombre) => setLista(l => l.map((n, j) => (j === i ? { ...n, nombre } : n)))

  /* Subir y bajar en vez de arrastrar: el orden ES el número, así que moverse de a un peldaño
     es exactamente el gesto que hace falta, y es el mismo control que ya usa "Orden entre sus
     pares" en el formulario del puesto. */
  const mover = (i, paso) => setLista(l => {
    const j = i + paso
    if (j < 0 || j >= l.length) return l
    const copia = [...l]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    return copia
  })

  /* El id se genera y no se deriva del nombre: renombrar un peldaño no puede desenganchar a los
     cargos que ya lo eligieron. */
  const agregar = () => setLista(l => [...l, { id: nuevoId('nivel', l), nombre: '' }])

  const pedirBorrar = i => {
    const usan = cuantosUsan(lista[i].id)
    if (!usan) { setLista(l => l.filter((_, j) => j !== i)); return }
    setBorrando({ i, usan })
  }
  const confirmarBorrado = () => {
    setLista(l => l.filter((_, j) => j !== borrando.i))
    setBorrando(null)
  }

  const guardar = () => {
    if (hayProblema) return
    onGuardar(lista.map(n => ({ id: n.id, nombre: n.nombre.trim() })))
  }

  return (
    <>
      <div className="pl-overlay" onClick={onCerrar}>
        <div className="pl-modal og-modal-mandos" onClick={e => e.stopPropagation()}>
          <CabeceraModal Icon={Layers} titulo="Configurar niveles de mando" onCerrar={onCerrar} />

          <div className="pl-modal-body">
            <p className="og-mandos-intro">
              El nivel dice <strong>cuánto pesa</strong> un puesto, y es lo único que distingue a
              dos cargos entre los que no hay línea. Estos tres vienen sugeridos: cámbiales el
              nombre, agrega los que te falten y ordénalos de mayor a menor mando.
            </p>

            <div className="og-mandos-lista">
              {lista.map((n, i) => {
                const usan = cuantosUsan(n.id)
                return (
                  <div key={n.id} className={`og-mando-fila${problemas[i] ? ' con-error' : ''}`}>
                    {/* El número sale del lugar en la lista, no se escribe. */}
                    <span className="og-mando-n">{i + 1}</span>

                    <div className="og-mando-campo">
                      <input
                        className="pl-input"
                        value={n.nombre}
                        maxLength={40}
                        placeholder="Nombre del nivel"
                        onChange={e => renombrar(i, e.target.value)}
                        aria-label={`Nombre del nivel ${i + 1}`}
                      />
                      {problemas[i]
                        ? <small className="og-mando-error">{problemas[i]}</small>
                        : (
                          <small className="og-mando-pie">
                            {/* Las dos cosas que hacen falta saber de un peldaño: a cuántos les
                                toca, y cuánto los baja en el dibujo. */}
                            {usan === 0 ? 'Todavía sin cargos' : usan === 1 ? '1 cargo' : `${usan} cargos`}
                            {i > 0 && <> · baja {i * PASO_PX} px en el dibujo</>}
                          </small>
                        )}
                    </div>

                    <div className="og-mando-acc">
                      <button
                        type="button"
                        onClick={() => mover(i, -1)}
                        disabled={i === 0}
                        title="Subir un nivel"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, 1)}
                        disabled={i === lista.length - 1}
                        title="Bajar un nivel"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="og-mando-x"
                        onClick={() => pedirBorrar(i)}
                        title="Eliminar este nivel"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button type="button" className="og-mandos-add" onClick={agregar}>
              <Plus size={14} /> Agregar un nivel
            </button>

            {/* Sin niveles el campo del puesto queda sin opciones. No se prohíbe —una empresa
                puede no querer manejar niveles— pero se dice antes de guardar y no después. */}
            {lista.length === 0 && (
              <p className="og-mandos-vacio">
                <AlertTriangle size={13} />
                Sin ningún nivel, el campo «Nivel de mando» del puesto queda sin opciones y todos
                los cuadros se dibujan a la misma altura.
              </p>
            )}
          </div>

          <div className="pl-modal-footer">
            <button className="pl-btn-cancel" onClick={onCerrar}>Cancelar</button>
            <button className="pl-btn-save" onClick={guardar} disabled={hayProblema}>
              Guardar niveles
            </button>
          </div>
        </div>
      </div>

      {/* Va por encima del modal que lo abrió, no en su lugar: lo que se está confirmando es un
          cambio dentro de esa lista y hay que poder cancelarlo y seguir editando. */}
      {borrando && (
        <ConfirmarAccionModal
          zIndex={1200}
          titulo={`Eliminar «${lista[borrando.i].nombre.trim() || 'este nivel'}»`}
          descripcion={
            borrando.usan === 1
              ? 'Hay 1 cargo con este nivel y va a quedar sin nivel. El cuadro vuelve a la altura de su fila y la tabla lo va a listar como «Sin nivel».'
              : `Hay ${borrando.usan} cargos con este nivel y van a quedar sin nivel. Sus cuadros vuelven a la altura de su fila y la tabla los va a listar como «Sin nivel».`
          }
          textoConfirmar="Eliminar el nivel"
          onConfirmar={confirmarBorrado}
          onCancelar={() => setBorrando(null)}
        />
      )}
    </>
  )
}
