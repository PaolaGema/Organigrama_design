import { MapPin, Building2 } from 'lucide-react'
import { sucursales, getUnidad, tipoDe, ocupantesDe, getPersona } from '../../data/organigramaData'
import { MiniCargo } from './PreviaPuesto'

/* EL DIBUJO, EN MODO LECTURA. Es el hermano de `PreviaPuesto` y dibuja otra cosa a propósito.

   `PreviaPuesto` existe para el EDITOR: muestra la fila de HERMANOS —los otros puestos que
   cuelgan del mismo jefe— porque eso es lo que se está eligiendo con el campo "Orden entre sus
   pares". Ahí los hermanos son la respuesta.

   Abriendo la ficha para mirar, la pregunta es otra: qué es este puesto y quién cuelga de él.
   Los hermanos no la contestan —son los puestos de al lado— y los hijos, que sí, no se
   dibujaban: solo se contaban al pie. Así que en lectura el árbol baja: el jefe arriba, el
   puesto en el medio y sus reportes debajo.

   Se reusa `MiniCargo` en vez de escribir otro cuadro: las dos previas tienen que dibujar la
   misma pieza o la ficha y el editor se ven como dos productos. */

/* Cuántos reportes se dibujan antes de resumir. Un gerente con treinta convertiría la previa en
   una columna de treinta cuadros; el resto se declara, nunca se recorta en silencio. */
const MAX_HIJOS = 5

const genteDe = cargo => ocupantesDe(cargo).map(getPersona).filter(Boolean)

export default function PreviaLugar({ cargo, org }) {
  const jefe = cargo.reportaA ? org.cargos.find(c => c.id === cargo.reportaA) : null
  const area = getUnidad(cargo.unidadId, org)?.nombre
  const areaJefe = jefe ? getUnidad(jefe.unidadId, org)?.nombre : null

  /* En el orden del organigrama, no reordenados por vacante: el dibujo tiene que enumerar igual
     que el dibujo grande o son dos verdades sobre la misma fila. */
  const hijos = org.cargos.filter(c => c.reportaA === cargo.id)
  const visibles = hijos.slice(0, MAX_HIJOS)
  const resto = hijos.length - visibles.length

  const sede = sucursales.find(s => s.id === (cargo.sucursalIds || [])[0]) || null
  const externo = tipoDe(cargo) === 'outsourcing'

  return (
    <aside className="og-pv">
      <div className="og-pv-hd">Su lugar en el organigrama</div>

      <div className="og-pv-area og-pv-area-uni">
        <span className="og-pv-area-rot">Unidad organizacional</span>
        <span className="og-pv-area-nom"><Building2 size={13} /> {area || 'Sin unidad'}</span>
      </div>

      {jefe && <div className="og-pv-rot">Depende de</div>}

      <div className="og-pv-tree">
        {jefe && (
          <MiniCargo nombre={jefe.nombre} tipo={tipoDe(jefe)} area={areaJefe} gente={genteDe(jefe)} />
        )}

        <div className={`og-pv-rama${jefe ? '' : ' og-pv-rama-raiz'}`}>
          <div className="og-pv-hijo">
            <MiniCargo
              foco
              marca="Este puesto"
              nombre={cargo.nombre}
              tipo={tipoDe(cargo)}
              gente={genteDe(cargo)}
              estado={externo ? 'Vacante · sin prestador' : 'Vacante'}
            />

            {/* Sus reportes, colgando de él. La cajita repetida con el nombre de quien lo ocupa
                —la que dibuja el editor debajo del cuadro— aquí no va: el propio cuadro ya trae
                la cara y el nombre, y repetirlos era la mitad del ruido del panel. */}
            {hijos.length > 0 && (
              <div className="og-pv-rama">
                {visibles.map(h => (
                  <div key={h.id} className="og-pv-hijo">
                    <MiniCargo
                      nombre={h.nombre}
                      tipo={tipoDe(h)}
                      gente={genteDe(h)}
                      estado={tipoDe(h) === 'outsourcing' ? 'Vacante · sin prestador' : 'Vacante'}
                    />
                  </div>
                ))}
                {resto > 0 && (
                  <div className="og-pv-hijo">
                    <span className="og-pv-mas">
                      +{resto} {resto === 1 ? 'puesto más' : 'puestos más'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* La cuenta de reportes ya no va al pie: los reportes están dibujados. Queda la sede,
          que el dibujo no dice. */}
      <p className="og-pv-pie">
        <MapPin size={11} />
        {sede ? `Pertenece a ${sede.ciudad}` : 'Toda la empresa'}
      </p>
    </aside>
  )
}
