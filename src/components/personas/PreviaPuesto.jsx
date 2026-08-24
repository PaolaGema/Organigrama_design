import { Fragment } from 'react'
import { User, Star, Users, Briefcase, MapPin, CornerDownRight, Building2 } from 'lucide-react'
import { sucursales, getUnidad, tipoDe, ocupantesDe, getPersona, rotuloVacantes } from '../../data/organigramaData'
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

const ICONO = { colaborador: User, jefe: Star, staff: Users, outsourcing: Briefcase }

/* Cuántos hermanos se dibujan antes de resumir. Una dirección con doce reportes convertiría
   la previa en la lista de otro puesto. */
const MAX_HERMANOS = 4

/* Cuántas caras entran en el cuadro antes de contarse. Es el mismo tope que usa la tarjeta del
   árbol: la previa tiene que verse como el organigrama, no parecerse. */
const MAX_CARAS = 3

const genteDe = cargo => ocupantesDe(cargo).map(getPersona).filter(Boolean)

function MiniCargo({ nombre, tipo = 'colaborador', area, estado, foco, marca, gente, plazas }) {
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
          {gente.length === 1 ? (
            <>
              <Avatar persona={gente[0]} size={15} clase="og-chip-av" />
              <span className="og-pv-gente-nom">{gente[0].name}</span>
            </>
          ) : (
            <>
              <span className="og-caras">
                {gente.slice(0, MAX_CARAS).map(p => (
                  <Avatar key={p.id} persona={p} size={15} clase="og-chip-av" />
                ))}
                {gente.length > MAX_CARAS && (
                  <span className="og-chip-av og-cara-mas">+{gente.length - MAX_CARAS}</span>
                )}
              </span>
              {/* Contra el cupo, igual que el cuadro del árbol: con cuatro plazas y dos
                  cubiertas dice "2 de 4" y no "2 personas", que escondía lo que falta. */}
              <span className="og-pv-gente-nom">
                {plazas > gente.length ? `${gente.length} de ${plazas}` : `${gente.length} personas`}
              </span>
            </>
          )}
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
  const plazas = Math.max(1, form.plazas || 1, ocupantes.length)

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
  const marcadas = sucursales.filter(s => form.sucursalIds.includes(s.id))
  /* Sin ninguna marcada el puesto existe en todas: es la misma regla que dice el formulario,
     y el pie tiene que decir lo mismo que el campo. */
  const sedes = marcadas.length ? marcadas : sucursales
  const todas = sedes.length === sucursales.length

  const foco = (
    <>
    <MiniCargo
      foco
      marca={nuevo ? 'Nuevo' : 'Este puesto'}
      nombre={form.nombre.trim() || 'Sin nombre todavía'}
      tipo={form.tipo}
      gente={ocupantes}
      plazas={plazas}
      /* El estado solo habla cuando no hay nadie: con gente elegida, lo que se muestra son las
         caras. Y cuenta las plazas, igual que la etiqueta del dibujo: con cuatro plazas vacías
         la previa decía "Vacante" en singular mientras el cuadro de al lado iba a decir
         "4 vacantes". */
      estado={form.tipo === 'outsourcing'
        ? `${rotuloVacantes(plazas)} · sin prestador`
        : rotuloVacantes(plazas)}
    />
    {/* Y colgando, UNA CAJITA POR PLAZA: las cubiertas con su persona y las libres como huecos
        punteados. Subir el cupo a cuatro dibuja cuatro casillas y se van llenando a medida que
        se marca gente, así que "cuántos puestos me quedan libres" se cuenta mirando en vez de
        leyendo un número. Es el mismo componente que usa el organigrama al desplegar un cuadro,
        no una copia: la previa tiene que verse como el dibujo, no parecerse.

        SIEMPRE, también con una sola plaza. Se probó dibujándolas recién a partir de dos —con
        una, el cuadro ya dice "Vacante" y la casilla parecía repetirlo— y el resultado fue peor:
        la primera plaza no se veía y la segunda hacía aparecer dos de golpe, así que la regla
        "una cajita por plaza" dejaba de leerse como una regla. */}
    <Desglosadas
      ocupantes={ocupantes}
      cargo={form.nombre.trim() || 'Sin nombre todavía'}
      libres={plazas - ocupantes.length}
    />
    </>
  )

  return (
    <aside className="og-pv">
      <div className="og-pv-hd">Cómo va a quedar en el organigrama</div>

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
        {jefe && <MiniCargo nombre={jefe.nombre} tipo={tipoDe(jefe, org)} area={areaJefe} gente={genteDe(jefe)} />}

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
                <MiniCargo nombre={c.nombre} tipo={tipoDe(c, org)} />
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
          cuelga a su costado, con línea punteada.
        </p>
      )}

      {/* Con tres sucursales la lista cabe; con cincuenta, no. Arriba de tres se cuenta en
          vez de enumerar: un renglón con veinte ciudades no lo lee nadie. */}
      <p className="og-pv-pie">
        <MapPin size={11} />
        {todas ? 'Existe en todas las sedes'
          : sedes.length <= 3 ? `Existe en ${sedes.map(s => s.ciudad).join(', ')}`
          : `Existe en ${sedes.length} de las ${sucursales.length} sedes`}
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

