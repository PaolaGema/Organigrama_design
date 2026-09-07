import { CuentaBloque } from './Sidebar'
import { useOnboardingData } from '../../context/OnboardingDataContext'

/* LA PROPUESTA CON ENCABEZADO — la otra mitad de la comparación.
   No es una barra nueva con controles nuevos: son EXACTAMENTE los mismos tres bloques que hoy
   viven en el riel —la sucursal desde la que miras, los avisos y el tema, y tu cuenta— sacados de
   la columna izquierda y puestos arriba. Se reutilizan los mismos componentes a propósito: si
   fueran copias, cualquier arreglo en uno dejaría al otro atrás y la comparación dejaría de ser
   entre dos sitios para el mismo control y pasaría a ser entre dos controles distintos.

   A la izquierda va el nombre de la empresa. Una barra superior con todo pegado a la derecha se
   ve coja, y además es donde uno espera leer de quién es el sistema que está mirando. */
export default function EncabezadoPropuesta() {
  const { empresa } = useOnboardingData()

  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 20px 0 22px',
        /* EL COLOR DEL ARMAZÓN, NO EL DE UNA TARJETA. Leía `--surface-card` porque en su día la
           barra, la columna de módulos y las tarjetas eran el mismo azul, y con un solo token
           parecía que daba igual cuál. No daba igual: al subir el color de las tarjetas, la barra
           se fue con ellas y dejó de coincidir con el submenú que tiene justo debajo, que es de
           lo único de lo que esta barra tiene que ser inseparable. */
        background: 'var(--bg-nav)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{
        fontSize: 14, fontWeight: 700, letterSpacing: '-.01em',
        color: 'var(--text-heading)', minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {empresa?.nombre || 'Sin nombre'}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <CuentaBloque expanded barra />
      </div>
    </header>
  )
}
