import { Fragment } from 'react'
import { User, Users, Briefcase, MapPin, CornerDownRight, Building2 } from 'lucide-react'
import { sucursales, getUnidad, tipoDe, ocupantesDe, getPersona } from '../../data/organigramaData'
import Avatar from './Avatar'
import { Desglosadas } from './OrgNodos'

/* Dónde va a quedar el puesto, dibujado. Antes era una lista de tres renglones con flechitas
   —"Recursos Humanos › Gerente General › este puesto"— y contestaba la pregunta con texto,
   que es justo lo que el organigrama existe para no hacer.

   Va en el costado derecho del modal, igual que el detalle de una ruta de onboarding: los
   campos a la izquierda y lo que resulta de llenarlos a la derecha, sin que uno tape al otro.
   Y como la columna es angosta, el árbol se dibuja hacia abajo —codos y bajada punteada— en
   vez de a lo ancho: la misma información que el gráfico grande, en el ancho que hay.

   Los hermanos se muestran para que el puesto tenga con quién compararse: "queda junto a
   Reclutadora y Analista de Nóminas" ubica mejor que cualquier ruta escrita. Van con tope y
   el resto se declara en un `+N`, que es la regla del resto del producto: ninguna lista sin
   tope, y el truncado se dice. */

const ICONO = { colaborador: User, staff: Users, outsourcing: Briefcase }

/* Cuántos hermanos se dibujan antes de resumir. Una dirección con doce reportes convertiría
   la previa en la lista de otro puesto. */
const MAX_HERMANOS = 4

const genteDe = cargo => ocupantesDe(cargo).map(getPersona).filter(Boolean)

/* Se exporta porque la previa de lectura (`PreviaLugar`) dibuja los mismos cuadros: dos
   versiones de esta pieza harían que la ficha y el editor se vean como dos productos. */
export function MiniCargo({ nombre, tipo = 'colaborador', area, estado, foco, marca, gente }) {
  const Icon = ICONO[tipo] || User
  const clases = ['og-pv-card']
  if (tipo === 'staff') clases.push('og-pv-staff')
  if (tipo === 'outsourcing') clases.push('og-pv-ext')
  if (foco) clases.push('og-pv-foco')

  return (
    <div className={clases.join(' ')}>
      {marca && <span className="og-pv-tag">{marca}</span>}
      <span className="og-pv-nom"><Icon size={11} /> {nombre}</span>
      {area && <span className="og-pv-sub">{area}</span>}
      {/* Quién lo ocupa, dibujado igual que en el árbol: una persona con su cara y su nombre,
          varias como caras superpuestas más la cuenta. Antes esto salía como texto gris en el
          mismo renglón donde dice "Vacante", así que haber elegido a alguien se veía igual que
          no haber elegido a nadie. */}
      {gente?.length ? (
        <span className="og-pv-gente">
          <Avatar persona={gente[0]} size={15} clase="og-chip-av" />
          <span className="og-pv-gente-nom">{gente[0].name}</span>
        </span>
      ) : estado && <span className="og-pv-estado">{estado}</span>}
    </div>
  )
}

export default function PreviaPuesto({ form, org, cargoId, ocupantes, nuevo }) {
  const jefe = form.reportaA ? org.cargos.find(c => c.id === form.reportaA) : null
  /* Solo el staff va al costado. El outsourcing baja en la línea como cualquier reporte, así
     que acá también: la previa tiene que dibujar lo mismo que el árbol o promete un lugar que
     el organigrama no le va a dar. */
  const lateral = form.tipo === 'staff'
  /* Al costado solo se puede colgar de alguien: un staff sin jefe es una raíz, y no hay de qué
     colgarlo al costado. */
  const alCostado = lateral && !!jefe

  /* Cuántas caben. Con el cupo en la mano la previa cuenta las vacantes igual que el cuadro
     de verdad, así que subir una plaza se ve en el dibujo sin salir de la pestaña Básico. */

  /* Los hermanos son la línea de mando: los laterales del mismo jefe no van en esa fila,
     porque en el árbol tampoco van ahí. */
  const hermanos = (jefe
    ? org.cargos.filter(c => c.reportaA === jefe.id)
    : org.cargos.filter(c => !c.reportaA)
  ).filter(c => c.id !== cargoId && c.tipo !== 'staff')

  /* Dónde cae este puesto dentro de la fila. Sin posición declarada —un cargo nuevo— va al
     final, que es donde lo va a poner la lista. */
  const lugar = form.posicion >= 0 ? form.posicion : hermanos.length
  const visibles = hermanos.slice(0, MAX_HERMANOS)
  const resto = hermanos.length - visibles.length
  const aCargo = cargoId ? org.cargos.filter(c => c.reportaA === cargoId).length : 0

  const area = getUnidad(form.unidadId, org)?.nombre
  const areaJefe = jefe ? getUnidad(jefe.unidadId, org)?.nombre : null
  /* Un puesto pertenece a UNA sede; sin ninguna, no está atado a ninguna sucursal. Es la misma
     regla que dice el formulario, y el pie tiene que decir lo mismo que el campo. */
  const sede = sucursales.find(s => s.id === form.sucursalIds[0]) || null

  const foco = (
    <>
    <MiniCargo
      foco
      marca={nuevo ? 'Nuevo' : 'Este puesto'}
      nombre={form.nombre.trim() || 'Sin nombre todavía'}
      tipo={form.tipo}
      gente={ocupantes}
      /* El estado solo habla cuando no hay nadie: con alguien elegido, lo que se muestra es su
         cara y su nombre. */
      estado={form.tipo === 'outsourcing' ? 'Vacante · sin prestador' : 'Vacante'}
    />
    {/* Y colgando, la cajita de quien lo ocupa: el mismo componente que usa el organigrama al
        desplegar un cuadro, no una copia —la previa tiene que verse como el dibujo, no
        parecerse—. Vacante no dibuja nada: el cuadro ya lo dice. */}
    <Desglosadas
      ocupantes={ocupantes}
      cargo={form.nombre.trim() || 'Sin nombre todavía'}
    />
    </>
  )

  return (
    <aside className="og-pv">
      {/* En futuro solo cuando de verdad es futuro: sobre un puesto que existe hace años,
          "cómo va a quedar" se lee como si estuviera por pasar algo. */}
      <div className="og-pv-hd">
        {nuevo ? 'Cómo va a quedar en el organigrama' : 'Su lugar en el organigrama'}
      </div>

      {/* La unidad encabeza el panel porque es la primera respuesta a "¿dónde queda?": el
          organigrama dibuja los cargos dentro de la píldora de su área. Antes iba de renglón
          adentro del cuadro y lo que quedaba arriba era el nombre de la empresa, que se leía
          como si fuera el área equivocada. */}
      <div className="og-pv-area og-pv-area-uni">
        <span className="og-pv-area-rot">Unidad organizacional</span>
        <span className="og-pv-area-nom"><Building2 size={13} /> {area || 'Sin área'}</span>
      </div>

      {/* Sin jefe no se dibuja ningún cuadro de empresa: el hilo baja del área y ya. El bloque
         de SoulyHR contestaba una pregunta que nadie hizo —de qué cuelga la raíz— y metía un
         nivel de más justo arriba del que importa. */}
      {/* Sin jefe no hay rótulo: la bajada sale del bloque del área, y meterle "Dentro del
          área" en el medio partía la línea en dos y hacía parecer que nacía del texto. Con
          jefe sí, porque ahí el rótulo encabeza al cuadro del que se cuelga. */}
      {jefe && <div className="og-pv-rot">Depende de</div>}

      <div className="og-pv-tree">
        {jefe && <MiniCargo nombre={jefe.nombre} tipo={tipoDe(jefe)} area={areaJefe} gente={genteDe(jefe)} />}

        <div className={`og-pv-rama${jefe ? '' : ' og-pv-rama-raiz'}`}>
          {/* El lateral va antes que la línea de mando, como en el dibujo grande: primero lo
              que cuelga al costado del jefe, después sus reportes. */}
          {alCostado && (
            <div className="og-pv-hijo og-pv-hijo-rot">
              {/* El rótulo hace explícito lo que en el dibujo grande se ve solo: hacia abajo
                  todos los hijos se ven iguales, y este no cuelga de la línea de mando. */}
              <span className="og-pv-rotulo">Al costado de la línea</span>
              {foco}
            </div>
          )}
          {/* El puesto entra en la fila en el lugar que dice el campo "Orden entre sus pares",
              no siempre al final: si el dibujo no se mueve al tocar las flechas, el campo
              parece no hacer nada hasta después de guardar. */}
          {visibles.map((c, i) => (
            <Fragment key={c.id}>
              {!alCostado && i === lugar && <div className="og-pv-hijo">{foco}</div>}
              <div className="og-pv-hijo">
                <MiniCargo nombre={c.nombre} tipo={tipoDe(c)} />
              </div>
            </Fragment>
          ))}
          {!alCostado && lugar >= visibles.length && <div className="og-pv-hijo">{foco}</div>}
          {resto > 0 && (
            <div className="og-pv-hijo"><span className="og-pv-mas">+{resto} más en la misma línea</span></div>
          )}
        </div>
      </div>

      {alCostado && (
        <p className="og-pv-nota">
          No entra en la fila de reportes de <strong>{jefe.nombre}</strong>: en el organigrama
          se engancha con línea punteada al trazo que baja de su cuadro, por debajo y al costado.
        </p>
      )}

      <p className="og-pv-pie">
        <MapPin size={11} />
        {sede ? `Pertenece a ${sede.ciudad}` : 'Toda la empresa'}
      </p>
      {aCargo > 0 && (
        <p className="og-pv-pie">
          <CornerDownRight size={11} />
          {aCargo === 1 ? '1 puesto depende de él' : `${aCargo} puestos dependen de él`}
        </p>
      )}
    </aside>
  )
}

