import { Palette } from 'lucide-react'

/* Qué significa cada color del dibujo.

   El organigrama pinta dos cosas distintas y hasta acá no lo decía en ninguna parte: el COLOR
   dice de qué tipo es el puesto —interno, staff, tercerizado— y la ETIQUETA dice si le falta
   quien lo cubra. Sin leyenda, un cuadro violeta se lee como "algo raro pasa acá" y la duda
   que aparece sola es si ese violeta significa que el puesto está vacante.

   Nunca en un panel propio: comparte el recuadro con los atajos. Los dos contestan la misma
   pregunta —cómo se lee esto— y dos flotantes apilados tapan el dibujo que vienen a explicar.

   Las muestras usan los mismos colores que las tarjetas de verdad y no una copia: si mañana
   cambia el violeta del outsourcing, cambia en los dos lados a la vez. */

const TIPOS = [
  { key: 'interno', label: 'Interno', desc: 'en planilla' },
  { key: 'staff', label: 'Staff', desc: 'asiste sin mandar' },
  { key: 'ext', label: 'Outsourcing', desc: 'prestador de servicios' },
  /* El azul no es un tipo de puesto sino de DÓNDE viene el cuadro: el mismo puesto aparece en
     su área con su color y acá en azul. Va en la misma lista igual porque la pregunta que
     contesta es la misma —"¿por qué este cuadro es de otro color?"—. */
  { key: 'func', label: 'Funcional', desc: 'apoya desde otra área' },
]

export default function LeyendaColores() {
  return (
    <div className="og-lc">
      <div className="og-lc-hd"><Palette size={11} /> Cómo se lee</div>

      <div className="og-lc-rot">El color dice el tipo de puesto</div>
      {TIPOS.map(t => (
        <div key={t.key} className="og-lc-fila">
          <span className={`og-lc-muestra og-lc-${t.key}`} />
          <span className="og-lc-txt"><strong>{t.label}</strong> · {t.desc}</span>
        </div>
      ))}

      {/* La forma de la línea también significa algo, y hasta acá no lo decía nadie. */}
      <div className="og-lc-rot">La línea dice de quién depende</div>
      <div className="og-lc-fila">
        <span className="og-lc-linea" />
        <span className="og-lc-txt"><strong>Llena</strong> · línea de mando</span>
      </div>
      {/* NO dice "no es gente de la empresa": el staff sí lo es, y el apoyo funcional también.
          Lo único que comparten los tres casos punteados es que ninguno es un reporte común —el
          staff asiste sin bajar en la línea, el tercerizado depende sin ser de la casa, y el
          apoyo viene prestado de otra área—, que es además lo que significa el punteado en
          cualquier organigrama: relación indirecta. */}
      <div className="og-lc-fila">
        <span className="og-lc-linea og-lc-linea-pt" />
        <span className="og-lc-txt">
          <strong>Punteada</strong> · relación indirecta: staff, tercerizado o apoyo de otra área
        </span>
      </div>

      {/* La etiqueta cuenta plazas, así que dice "Vacante" con una y "3 vacantes" con más. La
          muestra usa el caso de una, que es el que se ve en casi todos los cuadros. */}
      <div className="og-lc-rot">La etiqueta cuenta lo que falta cubrir</div>
      <div className="og-lc-fila">
        <span className="og-lc-tag">Vacante</span>
        <span className="og-lc-txt">Plazas del puesto sin cubrir</span>
      </div>
    </div>
  )
}
