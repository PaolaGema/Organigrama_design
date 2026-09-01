import { useRef, useState } from 'react'
import { Layers, Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react'
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

   Y ese número es lo que el dibujo convierte en altura, pero medido contra el JEFE y no contra
   la fila: un reporte directo un peldaño por debajo del suyo queda a ras, dos peldaños por
   debajo baja una caja, tres baja dos.

   EL MODAL VA PARTIDO EN DOS, como el formulario del cargo: a la izquierda lo que se edita, a la
   derecha lo que resulta. Es la única forma de contestar acá la pregunta que hace difícil esta
   pantalla —"y esto qué efecto tiene"— sin obligar a cerrar, mirar el organigrama y volver. */

/* Cuánto baja cada peldaño de diferencia en el dibujo. Vive acá solo para poder decirlo en
   pantalla; el dibujo lo aplica en `OrgNodos`, y los dos números tienen que decir lo mismo. */
const PASO_PX = 72

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

/* El disco se apaga peldaño a peldaño: el primero lleno, el último a media tinta. Dice "pesa
   menos" sin gastar una palabra, y no baja de la mitad porque debajo de ahí el número blanco
   deja de leerse. */
const pesoDe = (i, total) => 1 - (i / Math.max(1, total - 1)) * 0.5

/* LA ESCALA, DIBUJADA. Un peldaño por cuadro, bajando en escalera.

   SIN LÍNEAS ENTRE LOS CUADROS, y es a propósito: en este producto una línea significa "depende
   de", y unirlos afirmaría que cada nivel le reporta al de arriba. No es cierto —un mando bajo
   puede colgar directo de un superior—. Sin líneas se leen como los peldaños que son.

   Tampoco dibuja un caso concreto. Se probó con un ejemplo de dos ramas y enseñaba mal: la gente
   lo tomaba como la forma que iba a tener su organigrama, y esa forma depende de quién cuelga de
   quién, no de los niveles. */
function EscalaPrevia({ lista }) {
  const alto = 26
  const salto = 34
  const paso = 13
  const ancho = 168 + paso * Math.max(0, lista.length - 1)
  return (
    <svg
      className="og-escala"
      viewBox={`0 0 ${ancho} ${lista.length * salto + 6}`}
      role="img"
      aria-label={`Los ${lista.length} niveles, del que más manda al que menos`}
    >
      {lista.map((n, i) => {
        const x = i * paso
        const y = i * salto + 3
        return (
          <g key={n.id}>
            <circle cx={x + 11} cy={y + alto / 2} r={9} fill={`color-mix(in srgb, var(--navy) ${pesoDe(i, lista.length) * 100}%, var(--surface-card))`} />
            <text className="og-escala-n" x={x + 11} y={y + alto / 2 + 3.4}>{i + 1}</text>
            <rect className="og-escala-caja" x={x + 26} y={y} width={142} height={alto} rx={8} />
            <text className="og-escala-txt" x={x + 97} y={y + alto / 2 + 3.6}>
              {n.nombre.trim() || 'Sin nombre'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ConfigMandos({ org, onGuardar, onCerrar }) {
  const [lista, setLista] = useState(() => nivelesDe(org).map(n => ({ ...n })))
  /* Qué peldaño se está por borrar, y a cuántos cargos deja sin nivel. Se pregunta SOLO cuando
     arrastra algo: borrar uno que nadie usa no merece un modal encima de otro modal. */
  const [borrando, setBorrando] = useState(null)
  /* Cuál está en la mano ahora mismo. Es estado y no una clase suelta porque el renglón cambia
     de sitio mientras se arrastra y tiene que seguir marcado dondequiera que caiga. */
  const [enMano, setEnMano] = useState(null)
  const arrastre = useRef(null)
  const listaRef = useRef(null)

  const cuantosUsan = id => org.cargos.filter(c => c.grado === id).length
  const problemas = lista.map((_, i) => problemaDe(lista, i))
  const hayProblema = problemas.some(Boolean)

  const renombrar = (i, nombre) => setLista(l => l.map((n, j) => (j === i ? { ...n, nombre } : n)))

  /* Sacar de un lugar y meter en otro, no intercambiar: arrastrando de la quinta a la primera
     posición, intercambiar mandaría la primera al fondo y nadie pidió eso. */
  const moverA = (desde, hasta) => setLista(l => {
    if (hasta < 0 || hasta >= l.length || desde === hasta) return l
    const copia = [...l]
    const [x] = copia.splice(desde, 1)
    copia.splice(hasta, 0, x)
    return copia
  })

  /* ARRASTRAR, CON EL DISCO COMO ASA. Antes eran dos flechas por renglón —diez botones para
     cinco niveles— y mover un peldaño tres puestos costaba tres clics. El disco ya dice en qué
     posición estás: que sea también con lo que la cambias. Al pasar el mouse el número se vuelve
     un asa, así que no aparece ningún control nuevo; desaparecen dos.

     Con eventos de puntero y no con el arrastre de HTML: es el mismo criterio que el lienzo del
     organigrama, funciona igual con mouse y con dedo, y el gesto es nuestro de punta a punta.

     LAS FLECHAS NO SE FUERON DEL TODO: viven en el teclado. Arrastrar no existe para quien
     navega con Tab, así que el asa es un botón y responde a las flechas cuando tiene el foco. Sin
     eso, reordenar sería imposible para parte de la gente. */
  const tomar = (i, e) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastre.current = i
    setEnMano(i)
  }
  const arrastrar = e => {
    if (arrastre.current == null || !listaRef.current) return
    const filas = [...listaRef.current.children]
    const y = e.clientY
    let destino = filas.findIndex(f => {
      const r = f.getBoundingClientRect()
      return y < r.top + r.height / 2
    })
    if (destino < 0) destino = filas.length - 1
    if (destino !== arrastre.current) {
      moverA(arrastre.current, destino)
      arrastre.current = destino
      setEnMano(destino)
    }
  }
  const soltar = () => {
    arrastre.current = null
    setEnMano(null)
  }
  const porTeclado = (i, e) => {
    const paso = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
    if (!paso) return
    e.preventDefault()
    moverA(i, i + paso)
  }

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

          <div className="og-mandos-cuerpo">
            <div className="og-mandos-editar">
              <p className="og-mandos-intro">
                El nivel dice <strong>cuánto pesa</strong> un puesto, y es lo único que distingue a
                dos cargos entre los que no hay línea. Cámbiales el nombre, agrega los que te falten
                y ordénalos de mayor a menor mando.
              </p>

              {/* LOS DOS EXTREMOS, DICHOS. La lista ES una escalera —el orden es todo el
                  significado— y sin nombrar las puntas, cinco renglones iguales no dicen para qué
                  lado crece. */}
              <p className="og-mandos-punta">Más mando</p>

              <div className="og-mandos-lista" ref={listaRef}>
                {lista.map((n, i) => {
                  const usan = cuantosUsan(n.id)
                  return (
                    <div
                      key={n.id}
                      className={`og-mando-fila${problemas[i] ? ' con-error' : ''}${enMano === i ? ' en-mano' : ''}`}
                      style={{ '--peso': pesoDe(i, lista.length) }}
                    >
                      {/* El número sale del lugar en la lista, no se escribe. */}
                      <button
                        type="button"
                        className="og-mando-n"
                        onPointerDown={e => tomar(i, e)}
                        onPointerMove={arrastrar}
                        onPointerUp={soltar}
                        onPointerCancel={soltar}
                        onKeyDown={e => porTeclado(i, e)}
                        aria-label={`Mover «${n.nombre.trim() || 'este nivel'}», ahora ${i + 1}.º de ${lista.length}. Arrastra, o usa las flechas del teclado.`}
                        title="Arrástralo para cambiarlo de lugar"
                      >
                        <span className="og-mando-num">{i + 1}</span>
                        <GripVertical size={14} className="og-mando-asa" />
                      </button>

                      <div className="og-mando-campo">
                        <div className="og-mando-linea">
                          <input
                            className="pl-input"
                            value={n.nombre}
                            maxLength={40}
                            placeholder="Nombre del nivel"
                            onChange={e => renombrar(i, e.target.value)}
                            aria-label={`Nombre del nivel ${i + 1}`}
                          />
                          {/* A cuántos les toca, y NADA MÁS. Antes decía además "baja N px en el
                              dibujo" contando desde el primer peldaño, y dejó de ser cierto cuando
                              el escalón pasó a medirse contra el jefe: cuánto baja un cuadro
                              depende de la distancia con el peldaño de SU jefe, así que el mismo
                              nivel queda a ras o dos cajas abajo según de quién cuelgue. Prometer
                              un número acá era prometer algo que el dibujo no cumple. */}
                          {!problemas[i] && (
                            <span className={`og-mando-usan${usan === 0 ? ' vacio' : ''}`}>
                              {usan === 0 ? 'sin cargos' : usan === 1 ? '1 cargo' : `${usan} cargos`}
                            </span>
                          )}
                        </div>
                        {problemas[i] && <small className="og-mando-error">{problemas[i]}</small>}
                      </div>

                      <button
                        type="button"
                        className="og-mando-x"
                        onClick={() => pedirBorrar(i)}
                        title="Eliminar este nivel"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>

              <p className="og-mandos-punta og-mandos-punta-fin">Menos mando</p>

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

            {/* LO QUE RESULTA, al lado de lo que se edita. Todo lo que habla del dibujo vive de
                este lado: la escala y la regla del escalón. */}
            {lista.length > 0 && (
              <div className="og-mandos-previa">
                <p className="og-mandos-rot">Tu escala, de arriba abajo</p>
                <EscalaPrevia lista={lista} />

                {lista.length > 1 && (
                  <div className="og-mandos-regla">
                    <svg viewBox="0 0 210 78" aria-hidden="true">
                      <rect className="rg-caja" x="70" y="4" width="70" height="20" rx="6" />
                      <path className="rg-linea" d="M105 24 V 34 M40 34 H 170 M40 34 V 44 M170 34 V 54" />
                      <rect className="rg-caja" x="5" y="44" width="70" height="20" rx="6" />
                      <rect className="rg-caja rg-baja" x="135" y="54" width="70" height="20" rx="6" />
                    </svg>
                    <p>
                      Un puesto baja <strong>una caja por cada peldaño de más</strong> que lo separe
                      de su jefe. El que está justo un peldaño debajo del suyo se dibuja a su misma
                      altura; el que se salta uno, baja {PASO_PX} px.
                    </p>
                  </div>
                )}
              </div>
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
