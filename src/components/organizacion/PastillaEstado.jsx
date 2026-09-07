import { estadosDe } from '../../data/estructuraData'

/* LA PASTILLA DEL ESTADO, ESCRITA UNA VEZ. Estaba tres veces con sus mismos catorce píxeles de
   radio y su mismo peso —en la fila de la tabla, en el modal de cambiar estado y en el título de
   la ficha— y tres copias de lo mismo son las que hacen que dentro de tres meses una tenga el
   color nuevo y las otras no. Sale del componente en cuanto la pidió un cuarto sitio, el detalle
   en modal, que es la señal de que ya no era de nadie en particular.

   La palabra sale del peldaño (`estadosDe`), así que una regional dice «Inactiva» y una sucursal
   «Cerrada» sin que este componente tenga que saber nada de eso. */
export default function PastillaEstado({ tipo, estado }) {
  /* UN ESTADO QUE NO ESTÁ EN LA TABLA NO PUEDE TUMBAR LA PANTALLA. Cada peldaño tiene sus dos
     palabras —una sucursal CIERRA, una regional se DESACTIVA— así que un nodo guardado con el
     estado del otro peldaño, o con uno de una versión anterior, no encuentra su entrada y este
     componente se quedaba leyendo `.bg` de `undefined`. Se cae a «activa», que es lo que el resto
     del sistema ya asume cuando no hay estado. */
  const tabla = estadosDe(tipo)
  const e = tabla[estado || 'activa'] || tabla.activa
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: e.bg, color: e.color, whiteSpace: 'nowrap',
    }}>{e.label}</span>
  )
}
