import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hash, Search, Network, MapPin, User, Users, Briefcase } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { getUnidad, tipoDe, ocupantesDe, getPersona, esVacante, estaEnSucursal, TIPOS_CARGO } from '../../data/organigramaData'

/* LOS PUESTOS, en tabla y con filtros.
   Un puesto es la silla: su código, su área, su sucursal y quién la ocupa. Cinco ejecutivas
   comerciales son cinco puestos, cada uno con su código —esa es la razón de que el puesto y el
   cargo sean cosas distintas, y de que exista la vacante: la silla está aunque no haya nadie.

   NO DUPLICA AL ORGANIGRAMA, contesta lo que el dibujo no contesta. El lienzo responde "¿de
   quién cuelga esto?"; aquí se responde "¿cuántas vacantes hay en La Paz?" y "¿qué puestos de
   Marketing son de outsourcing?". Por eso esta pantalla filtra y no dibuja.

   ES DE CONSULTA A PROPÓSITO. Editar un puesto mueve el árbol —cambia de quién cuelga y a quién
   le cambia el jefe—, y eso solo se entiende viendo el dibujo. El alta y la edición siguen
   viviendo en el organigrama, y desde aquí se va hacia allá. */

const ICONO_TIPO = { colaborador: User, staff: Users, outsourcing: Briefcase }

const TODOS = '__todos__'

export default function Puestos() {
  const { organigrama: org, sucursales } = useOnboardingData()
  /* La sede ya no se elige aquí: la manda el ámbito del riel. Antes esta pantalla tenía su
     propio recorte —uno de los cuatro sueltos que había—, y elegir Santa Cruz aquí no servía
     de nada al entrar a Colaboradores o al organigrama. */
  const [busca, setBusca] = useState('')
  const [area, setArea] = useState(TODOS)
  const [tipo, setTipo] = useState(TODOS)
  const [estado, setEstado] = useState(TODOS)

  const filas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return org.cargos
      .map(cargo => {
        const persona = ocupantesDe(cargo).map(getPersona).find(Boolean) || null
        /* `sucursalIds` vacío no es "sin sucursal", es "toda la empresa": el puesto no vive en
           ninguna oficina en particular porque vale para todas. */
        const idsSucursal = cargo.sucursalIds || []
        return {
          cargo,
          persona,
          unidad: getUnidad(cargo.unidadId, org),
          sucursalesDelPuesto: idsSucursal.map(id => sucursales.find(s => s.id === id)).filter(Boolean),
          transversal: idsSucursal.length === 0,
          vacante: esVacante(cargo),
          tipo: tipoDe(cargo),
        }
      })
      .filter(f => {
        if (area !== TODOS && f.cargo.unidadId !== area) return false
        if (tipo !== TODOS && f.tipo !== tipo) return false
        if (estado === 'vacante' && !f.vacante) return false
        if (estado === 'ocupado' && f.vacante) return false
        if (!q) return true
        return f.cargo.nombre.toLowerCase().includes(q)
          || (f.cargo.codigo || '').toLowerCase().includes(q)
          || (f.persona?.name || '').toLowerCase().includes(q)
          || (f.unidad?.nombre || '').toLowerCase().includes(q)
      })
      .sort((a, b) => (a.unidad?.nombre || '').localeCompare(b.unidad?.nombre || '')
        || a.cargo.nombre.localeCompare(b.cargo.nombre)
        || (a.cargo.codigo || '').localeCompare(b.cargo.codigo || ''))
  }, [org, sucursales, busca, area, tipo, estado])

  const areasOrdenadas = useMemo(
    () => [...org.unidades].sort((a, b) => a.nombre.localeCompare(b.nombre)), [org.unidades])

  /* LOS INDICADORES CUENTAN LA ESTRUCTURA ENTERA, y ya no un ámbito: sin filtro global de sede
     no hay «de qué empresa estamos hablando» que valga menos que toda.

     Siguen sin seguir a los filtros de la barra, que es lo que no cambió: buscar "ejecutiva" o
     mirar solo vacantes es hurgar dentro de ese total, y si el total se moviera con cada tecleo
     dejaría de ser una referencia. */
  const cargosEnAmbito = org.cargos
  const vacantes = cargosEnAmbito.filter(esVacante).length
  const filtrando = busca.trim() || area !== TODOS || tipo !== TODOS || estado !== TODOS

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Puestos</h1>
          <p className="pl-subtitle">Las plazas de la empresa: código, área, sucursal y quién las ocupa.</p>
        </div>
        <Link
          to="/organizacion/organigrama"
          className="pl-btn-new"
          style={{ marginLeft: 'auto', textDecoration: 'none' }}
        >
          <Network size={14} color="#00E091" /> Abrir el organigrama
        </Link>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--blue)' }}>
          <div className="kpi-title" style={{ color: 'var(--blue)' }}>Puestos</div>
          <div className="kpi-val">{cargosEnAmbito.length}</div>
          <div className="kpi-lbl">Plazas en la estructura</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>Ocupados</div>
          <div className="kpi-val">{cargosEnAmbito.length - vacantes}</div>
          <div className="kpi-lbl">Con alguien dentro</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)' }}>
          <div className="kpi-title" style={{ color: 'var(--yellow)' }}>Vacantes</div>
          <div className="kpi-val">{vacantes}</div>
          <div className="kpi-lbl">La plaza existe, falta quien la cubra</div>
        </div>
      </div>

      <div className="pl-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="pl-search-wrap">
          <Search size={15} className="pl-search-ico" />
          <input
            className="pl-search"
            placeholder="Buscar por puesto, código, área o persona…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <select className="pl-input" style={selEstilo} value={area} onChange={e => setArea(e.target.value)} aria-label="Filtrar por área">
          <option value={TODOS}>Todas las áreas</option>
          {areasOrdenadas.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>

        <select className="pl-input" style={selEstilo} value={tipo} onChange={e => setTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value={TODOS}>Todos los tipos</option>
          {TIPOS_CARGO.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        <select className="pl-input" style={selEstilo} value={estado} onChange={e => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value={TODOS}>Ocupados y vacantes</option>
          <option value="ocupado">Solo ocupados</option>
          <option value="vacante">Solo vacantes</option>
        </select>
      </div>

      {filtrando && (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          {filas.length} de {org.cargos.length} puestos
        </p>
      )}

      {filas.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 14,
        }}>
          <Hash size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', margin: 0 }}>
            {org.cargos.length ? 'Ningún puesto coincide' : 'Todavía no hay puestos'}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '5px 0 0' }}>
            {org.cargos.length
              ? 'Prueba a soltar alguno de los filtros.'
              : 'Los puestos se crean desde el organigrama, que es donde se ve de quién cuelgan.'}
          </p>
        </div>
      ) : (
        <div className="as-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="as-table" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th style={{ width: 96 }}>Código</th>
                <th>Puesto</th>
                <th>Área</th>
                <th>Sucursal</th>
                <th>Tipo</th>
                <th>Ocupante</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ cargo, persona, unidad, sucursalesDelPuesto, transversal, vacante, tipo: t }) => {
                const meta = TIPOS_CARGO.find(x => x.key === t) || TIPOS_CARGO[0]
                const IconoTipo = ICONO_TIPO[t] || User
                return (
                  <tr key={cargo.id}>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: cargo.codigo ? undefined : 'var(--text-muted)' }}>
                      {cargo.codigo || '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{cargo.nombre}</td>
                    <td style={{ color: unidad ? undefined : 'var(--text-muted)' }}>{unidad?.nombre || 'Sin área'}</td>
                    <td>
                      {transversal ? (
                        <span style={{ color: 'var(--text-muted)' }}>Toda la empresa</span>
                      ) : sucursalesDelPuesto.length ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          {sucursalesDelPuesto.map(s => s.ciudad || s.nombre).join(', ')}
                        </span>
                      ) : (
                        /* La sucursal fue borrada o cambió de id: el puesto sigue apuntando a algo
                           que ya no está, y decirlo es mejor que mostrar la celda vacía. */
                        <span style={{ color: 'var(--yellow)' }}>Sucursal no encontrada</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <IconoTipo size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      {vacante
                        ? <span className="pl-status pl-st-borrador">Vacante</span>
                        : <span style={{ fontWeight: 500 }}>{persona?.name || '—'}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const selEstilo = {
  width: 'auto', minWidth: 150, height: 38, padding: '0 10px',
  fontSize: 12, cursor: 'pointer',
}
