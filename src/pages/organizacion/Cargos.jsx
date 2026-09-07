import { useMemo, useState } from 'react'
import { Briefcase, Search, Info, AlertTriangle } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { getUnidad, tipoDe, esVacante, TIPOS_CARGO } from '../../data/organigramaData'

/* EL CATÁLOGO DE CARGOS, y una advertencia honesta encima.

   EL CARGO NO EXISTE COMO DATO. Un cargo es la DEFINICIÓN del rol —"Ejecutiva Comercial", su
   descripción, su perfil, su banda salarial— y el puesto es la silla concreta que lo instancia.
   El modelo tiene puestos; el cargo es hoy nada más que el nombre repetido en cada uno de ellos.

   Lo que hace esta pantalla es AGRUPAR por ese nombre y mostrar el catálogo que resulta. Sirve,
   y además hace visible el problema: el organigrama apila los puestos repetidos comparando
   textos, así que renombrar uno de cinco lo separa del grupo sin avisar. Aquí se ve en el acto,
   porque el catálogo pasa a tener un cargo de más.

   SE AGRUPA POR NOMBRE Y NO POR NOMBRE + ÁREA, que es como lo hace el dibujo. Son preguntas
   distintas: el dibujo agrupa lo que puede apilar en la misma rama; un catálogo de cargos es de
   la empresa entera, y "Ejecutiva Comercial" es el mismo cargo exista en Ventas o en Comercial.
   Que aparezca en dos áreas es justamente lo que interesa ver. */

const clave = nombre => nombre.trim().toLowerCase()

export default function Cargos() {
  const { organigrama: org } = useOnboardingData()
  const [busca, setBusca] = useState('')

  const catalogo = useMemo(() => {
    const grupos = new Map()
    for (const cargo of org.cargos) {
      const k = clave(cargo.nombre)
      if (!k) continue
      if (!grupos.has(k)) {
        grupos.set(k, { nombre: cargo.nombre.trim(), plazas: [], areas: new Set(), tipos: new Set() })
      }
      const g = grupos.get(k)
      g.plazas.push(cargo)
      if (cargo.unidadId) g.areas.add(cargo.unidadId)
      g.tipos.add(tipoDe(cargo))
    }

    return [...grupos.values()]
      .map(g => {
        const vacantes = g.plazas.filter(esVacante).length
        return {
          nombre: g.nombre,
          plazas: g.plazas.length,
          vacantes,
          ocupadas: g.plazas.length - vacantes,
          areas: [...g.areas].map(id => getUnidad(id, org)).filter(Boolean),
          tipos: [...g.tipos],
        }
      })
      .sort((a, b) => b.plazas - a.plazas || a.nombre.localeCompare(b.nombre))
  }, [org])

  const filas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return catalogo
    return catalogo.filter(c => c.nombre.toLowerCase().includes(q)
      || c.areas.some(a => a.nombre.toLowerCase().includes(q)))
  }, [catalogo, busca])

  /* Los dos síntomas que solo se ven agrupando: un cargo repartido en varias áreas —puede ser
     correcto, o puede ser que alguien lo escribió distinto— y un cargo cuyas plazas no coinciden
     en tipo, que casi siempre es un descuido. */
  const enVariasAreas = catalogo.filter(c => c.areas.length > 1).length
  const tipoMixto = catalogo.filter(c => c.tipos.length > 1).length

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Cargos</h1>
          <p className="pl-subtitle">Los roles de la empresa, y cuántas plazas tiene cada uno.</p>
        </div>
      </div>

      {/* El aviso va arriba y no en una nota al pie: quien entra esperando un catálogo editable
          tiene que saber en el primer segundo que esto todavía se deduce de los puestos. */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 11,
        padding: '14px 16px', borderRadius: 12, marginBottom: 18,
        background: 'var(--surface-hover)', border: '1px solid var(--border-soft)',
      }}>
        <Info size={16} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--text-heading)' }}>Este catálogo se deduce de los puestos.</strong>{' '}
          El cargo todavía no es un dato propio: se agrupan los puestos que comparten nombre. Por eso
          aquí no se crea ni se edita, y por eso renombrar un puesto lo separa de su grupo. Cuando el
          cargo exista como entidad podrá llevar su descripción, su perfil y su banda salarial.
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--blue)' }}>
          <div className="kpi-title" style={{ color: 'var(--blue)' }}>Cargos</div>
          <div className="kpi-val">{catalogo.length}</div>
          <div className="kpi-lbl">Nombres distintos en la estructura</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>En varias áreas</div>
          <div className="kpi-val">{enVariasAreas}</div>
          <div className="kpi-lbl">El mismo cargo en más de un área</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': tipoMixto ? 'var(--yellow)' : 'var(--green)' }}>
          <div className="kpi-title" style={{ color: tipoMixto ? 'var(--yellow)' : 'var(--green)' }}>Tipo mixto</div>
          <div className="kpi-val">{tipoMixto}</div>
          <div className="kpi-lbl">Sus plazas no coinciden en tipo</div>
        </div>
      </div>

      <div className="pl-toolbar">
        <div className="pl-search-wrap">
          <Search size={15} className="pl-search-ico" />
          <input
            className="pl-search"
            placeholder="Buscar cargo o área…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {filas.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 14,
        }}>
          <Briefcase size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', margin: 0 }}>
            {catalogo.length ? 'Ningún cargo coincide' : 'Todavía no hay cargos'}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '5px 0 0' }}>
            {catalogo.length
              ? 'Prueba con otro nombre.'
              : 'El catálogo aparece solo, en cuanto existan puestos en la estructura.'}
          </p>
        </div>
      ) : (
        <div className="as-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="as-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Áreas donde existe</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Plazas</th>
                <th style={{ textAlign: 'right' }}>Ocupadas</th>
                <th style={{ textAlign: 'right' }}>Vacantes</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(fila => (
                <tr key={fila.nombre}>
                  <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{fila.nombre}</td>
                  <td>
                    {fila.areas.length === 0
                      ? <span style={{ color: 'var(--text-muted)' }}>Sin área</span>
                      : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {fila.areas.map(a => (
                            <span key={a.id} style={pildora}>{a.corto || a.nombre}</span>
                          ))}
                        </span>
                      )}
                  </td>
                  <td>
                    {fila.tipos.length > 1 ? (
                      <span
                        title="Las plazas de este cargo no coinciden en tipo. Suele ser un descuido al crearlas."
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--yellow)', fontWeight: 600 }}
                      >
                        <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                        Mixto
                      </span>
                    ) : (
                      TIPOS_CARGO.find(t => t.key === fila.tipos[0])?.label || 'Colaborador'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fila.plazas}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fila.ocupadas}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fila.vacantes > 0
                      ? <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{fila.vacantes}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const pildora = {
  fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
  background: 'var(--surface-hover)', color: 'var(--text-muted)', whiteSpace: 'nowrap',
}
