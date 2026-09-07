import { Plus, Trash2, X } from 'lucide-react'
import SelectorLista from '../personas/SelectorLista'
import { getUnidad } from '../../data/organigramaData'

/* A QUÉ OTRAS UNIDADES APOYA UN PUESTO, EN UN SOLO SITIO Y USADO EN DOS.
   Este editor vivía dentro del formulario del organigrama y nada más. Al querer editar lo mismo
   desde la lista de cargos —donde cada cargo despliega sus sillas— había dos salidas: escribirlo
   otra vez ahí, o sacarlo de donde estaba. Escribirlo dos veces es garantizar que dentro de un mes
   uno de los dos valide algo que el otro no; sacarlo cuesta este archivo.

   LO QUE SABE ES POCO Y ES LO JUSTO: recibe la lista de apoyos y devuelve la lista nueva. No sabe
   de qué puesto son, ni desde qué pantalla lo están usando, ni cómo se guarda.

   LAS DOS REGLAS QUE TRAE PUESTAS, porque son del dato y no de la pantalla:

   · NO SE OFRECE LA UNIDAD PROPIA. Un puesto no se apoya a sí mismo: pertenece a su unidad, que es
     otra cosa que trabajar en ella.
   · NI LAS QUE YA ESTÁN EN LA LISTA. Repetir un área no agrega nada y deja dos renglones diciendo
     lo mismo, con dos jefes funcionales distintos y ninguna forma de saber cuál vale. */
export default function ApoyoFuncional({ apoyos = [], org, unidadPropia, cargoId, onCambio }) {
  /* El botón de agregar solo aparece si queda alguna por elegir: uno que abre una fila sin
     opciones es una fila que después hay que borrar a mano. */
  const hayLibres = org.unidades.some(u => u.id !== unidadPropia && !apoyos.some(f => f.unidadId === u.id))

  const setApoyo = (i, cambios) => onCambio(
    apoyos.map((x, j) => (j === i ? { ...x, ...cambios } : x)),
  )

  if (!apoyos.length) {
    return (
      <>
        <p className="og-apoya-nada">
          {hayLibres
            ? 'A nadie: solo trabaja en su unidad.'
            : 'No hay otras unidades todavía. En cuanto crees una, va a poder elegirse acá.'}
        </p>
        {hayLibres && (
          <button
            type="button"
            className="og-apoya-mas"
            onClick={() => onCambio([...apoyos, { unidadId: '', reportaA: null }])}
          >
            <Plus size={13} /> Agregar una unidad
          </button>
        )}
      </>
    )
  }

  return (
    <>
      {apoyos.map((f, i) => {
        /* El jefe funcional se elige entre los cargos DE LA UNIDAD que se apoya: es quien le
           dirige el trabajo ahí. Ofrecer el organigrama entero convertiría el campo en una
           segunda línea de mando sin relación con la unidad. */
        const deEsaUnidad = org.cargos.filter(c => c.unidadId === f.unidadId && c.id !== cargoId)
        return (
          <div key={i} className="og-apoya-fila">
            <SelectorLista
              valor={f.unidadId}
              onCambio={v => setApoyo(i, { unidadId: v, reportaA: null })}
              placeholder="Elige la unidad"
              opciones={org.unidades
                .filter(u => u.id !== unidadPropia)
                .filter(u => u.id === f.unidadId || !apoyos.some(x => x.unidadId === u.id))
                .map(u => ({ id: u.id, nombre: u.nombre, detalle: getUnidad(u.padreId, org)?.nombre }))}
            />
            <span className="og-apoya-y">respondiendo a</span>
            <SelectorLista
              valor={f.reportaA}
              onCambio={v => setApoyo(i, { reportaA: v })}
              vacia="Nadie: cuelga de la unidad"
              placeholder={f.unidadId ? 'Nadie: cuelga de la unidad' : 'Elige primero la unidad'}
              opciones={deEsaUnidad.map(c => ({ id: c.id, nombre: c.nombre }))}
            />
            <button
              type="button"
              className="og-apoya-x"
              title="Quitar esta unidad"
              onClick={() => onCambio(apoyos.filter((_, j) => j !== i))}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )
      })}

      {hayLibres && (
        <button
          type="button"
          className="og-apoya-mas"
          onClick={() => onCambio([...apoyos, { unidadId: '', reportaA: null }])}
        >
          <Plus size={13} /> Otra unidad
        </button>
      )}
    </>
  )
}

/* EL MISMO EDITOR, DENTRO DE UN MODAL, para las dos pantallas que no tienen sitio donde ponerlo
   abierto: la fila de una silla en la lista de cargos y la ficha del puesto, donde el resto son
   campos de una rejilla y esto son dos desplegables por unidad apoyada.

   VIVE JUNTO AL EDITOR y no en cada pantalla porque ya pasó una vez: el editor estaba escrito solo
   en el organigrama y al necesitarlo en la tabla hubo que sacarlo de ahí. Poner el marco en dos
   sitios sería empezar de nuevo el mismo camino.

   GUARDA AL VUELO Y CIERRA CON «LISTO». En un formulario de dos desplegables no hay nada que
   confirmar, y un «Guardar» obligaría a decidir qué pasa al cerrar sin pulsarlo — que es la
   pregunta que ningún usuario quiere que le hagan. */
export function ModalApoyoFuncional({ titulo, apoyos, org, unidadPropia, cargoId, onCambio, onCerrar }) {
  return (
    <div className="pl-overlay" onClick={onCerrar}>
      {/* MÁS ANCHO QUE UN MODAL CHICO: adentro va una frase —«Marketing, respondiendo a la
          Directora»— y en 380 px se parte en tres renglones, que es justo lo que hace que deje de
          leerse como una frase. */}
      <div className="pl-modal" style={{ width: 560, maxWidth: '94vw' }} onClick={e => e.stopPropagation()}>
        <div className="pl-modal-header">
          <h2>Dónde más trabaja</h2>
          <button className="pl-modal-close" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="pl-modal-body og-apoya" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {titulo && <><strong>{titulo}</strong>{' '}</>}
            pertenece a su unidad y además puede trabajar en otras. En cada una se dibuja como un
            cuadro más, en azul, y sigue siendo el mismo puesto: no se cuenta dos veces.
          </p>
          <ApoyoFuncional
            apoyos={apoyos}
            org={org}
            unidadPropia={unidadPropia}
            cargoId={cargoId}
            onCambio={onCambio}
          />
        </div>
        <div className="pl-modal-footer">
          <button className="pl-btn-save" onClick={onCerrar}>Listo</button>
        </div>
      </div>
    </div>
  )
}
