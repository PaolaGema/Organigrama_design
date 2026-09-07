import { Info, ShieldCheck } from 'lucide-react'

/* ROLES Y PERMISOS — la primera pantalla de Configuración.

   LO QUE AQUÍ SE VE ES EL MODELO, y el modelo está escrito en el documento de reglas de negocio,
   sección 02 «Quién ve qué». Si una de las dos cambia, cambian las dos: esta pantalla es la cara
   visible de esas reglas, no una segunda opinión sobre ellas.

   DOS PREGUNTAS Y NO UNA. El rol dice QUÉ puede hacer una cuenta; el alcance —el área y las
   sucursales de la persona— dice SOBRE QUIÉN. Dos líderes con el mismo rol no ven a la misma
   gente, y por eso el alcance encabeza cada tarjeta en vez de esconderse en una nota.

   TODAVÍA NO SE EDITA, y se dice arriba en vez de disimularlo con interruptores que no guardan
   nada. Los cuatro roles son del sistema: se cambian escribiendo la regla, no marcando una
   casilla. Cuando existan permisos por empresa, esta misma pantalla es donde vivirán. */

const ROLES = [
  {
    nombre: 'Administrador HR',
    para: 'Recursos Humanos',
    alcance: 'Toda la empresa',
    resumen: 'Administra el sistema entero: la estructura, la gente, las rutas de onboarding y la comunicación. Es el único que toca los datos sensibles de una ficha —sueldo, contrato, documentos— y el único que edita la organización.',
  },
  {
    nombre: 'Líder de área',
    para: 'Quien responde por un equipo',
    alcance: 'Su área y su gente',
    resumen: 'Trabaja con los suyos: su ficha operativa, su onboarding, sus anuncios. La estructura la mira y no la edita, porque de ella dependen los demás módulos.',
  },
  {
    nombre: 'Auxiliar',
    para: 'Alguien en quien un líder delega',
    alcance: 'Lo que su líder le delegue',
    resumen: 'Existe para descargar al líder de lo repetitivo: preparar rutas, hacer seguimiento del onboarding de su área. No hereda todo lo del líder, solo lo que se le pasa.',
  },
  {
    nombre: 'Colaborador',
    para: 'Todo el mundo, incluidos los tres de arriba',
    alcance: 'Lo suyo',
    resumen: 'Su espacio personal: su onboarding, sus conversaciones, sus documentos, su perfil. Ser administrador no reemplaza a esto, se le suma: el jefe de RRHH también es colaborador y también tiene su espacio.',
  },
]

const MATRIZ = [
  { modulo: 'Mi espacio personal', celdas: ['Sí', 'Sí', 'Sí', 'Sí'] },
  { modulo: 'Inicio', celdas: ['Sí', 'Sí', 'Sí', '—'] },
  { modulo: 'Organización', celdas: ['Todo', 'Lectura', '—', '—'] },
  { modulo: 'Gestión de personas', celdas: ['Todo', 'Su equipo', '—', '—'] },
  { modulo: 'Onboarding', celdas: ['Todo', 'Su área', 'Lo delegado', '—'] },
  { modulo: 'Comunicación', celdas: ['Todo', 'Sí', '—', '—'] },
  { modulo: 'Evaluación', celdas: ['Todo', 'Sí', '—', '—'] },
  { modulo: 'Archivos', celdas: ['Sí', '—', '—', '—'] },
]

/* El alcance se ve antes de leerse: punto relleno cuando es completo, contorno cuando está
   acotado y nada cuando ese módulo no es parte de su trabajo. */
function Celda({ valor }) {
  if (valor === '—') {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>
  }
  const completo = valor === 'Sí' || valor === 'Todo'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: completo ? 'var(--green)' : 'transparent',
        border: completo ? 'none' : '1.5px solid var(--green)',
      }} />
      <span style={{ color: 'var(--text-heading)', fontWeight: completo ? 600 : 500 }}>{valor}</span>
    </span>
  )
}

export default function RolesPermisos() {
  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Roles y permisos</h1>
          <p className="pl-subtitle">
            Qué puede hacer cada cuenta, y sobre quién.
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 11,
        padding: '14px 16px', borderRadius: 12, marginBottom: 18,
        background: 'var(--surface-hover)', border: '1px solid var(--border-soft)',
      }}>
        <Info size={16} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--text-heading)' }}>Los cuatro roles son del sistema y todavía no se editan aquí.</strong>{' '}
          Esta pantalla enseña el modelo que rige hoy a toda la aplicación. Se cambia escribiendo la
          regla —y este es el sitio donde vivirán los permisos por empresa cuando existan—.
        </div>
      </div>

      <div style={{
        display: 'grid', gap: 12, marginBottom: 26,
        gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))',
      }}>
        {ROLES.map(r => (
          <div key={r.nombre} style={{
            background: 'var(--surface-card)', border: '1px solid var(--border-soft)',
            borderRadius: 14, padding: '16px 18px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <ShieldCheck size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{r.nombre}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12 }}>{r.para}</div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 11,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--green-bg)', color: 'var(--text-heading)',
              fontSize: 11, fontWeight: 600,
            }}>
              Alcance: {r.alcance}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              {r.resumen}
            </p>
          </div>
        ))}
      </div>

      <h2 style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text-heading)',
        margin: '0 0 4px',
      }}>
        A qué módulo entra cada rol
      </h2>
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Un guion no es un candado: es que ese módulo no forma parte de su trabajo.
      </p>

      <div className="as-table-wrap" style={{ overflowX: 'auto' }}>
        <table className="as-table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Módulo</th>
              {ROLES.map(r => <th key={r.nombre}>{r.nombre}</th>)}
            </tr>
          </thead>
          <tbody>
            {MATRIZ.map(fila => (
              <tr key={fila.modulo}>
                <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{fila.modulo}</td>
                {fila.celdas.map((c, i) => (
                  <td key={i}><Celda valor={c} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.7, margin: '14px 0 0', maxWidth: '78ch' }}>
        <strong style={{ color: 'var(--text-heading)' }}>Todo</strong> es crear, editar y dar de baja.{' '}
        <strong style={{ color: 'var(--text-heading)' }}>Su área</strong> o{' '}
        <strong style={{ color: 'var(--text-heading)' }}>su equipo</strong> es lo mismo, acotado a la
        gente de la que responde.{' '}
        <strong style={{ color: 'var(--text-heading)' }}>Lo delegado</strong> es lo que un líder le
        pasó explícitamente. Evaluación todavía no tiene pantallas: su fila dice a quién le tocará
        cuando las tenga.
      </p>
    </div>
  )
}
