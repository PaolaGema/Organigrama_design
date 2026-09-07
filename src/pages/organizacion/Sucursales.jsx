import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Pencil, Trash2, X, Search, AlertTriangle, Building2, Phone, Mail, Clock, CalendarDays, UserRound } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { ocupantesDe, ESTADOS_SUCURSAL } from '../../data/organigramaData'

/* LAS SUCURSALES.
   Estaban escritas en el modelo del organigrama —ocho, con sus ciudades— y no había pantalla
   para tocarlas: se podía elegir la sucursal de un puesto, pero no crear la sucursal. Era el hueco más
   grande de la estructura y por eso es la primera pantalla nueva del módulo.

   NO SE BORRA UNA SUCURSAL CON PUESTOS DENTRO. Borrarla dejaría cada uno de esos puestos apuntando
   a un id que ya no existe, y el filtro por sucursal del organigrama los perdería sin decir nada.
   Se avisa cuántos son y se pide moverlos primero, igual que hace el área con sus cargos.

   OJO CON EL CONTEO: un puesto sin sucursal vale "toda la empresa", no "ninguna sucursal". Por eso se
   cuenta por pertenencia declarada —`sucursalIds` lo incluye— y no con `estaEnSucursal`, que
   contesta a otra pregunta: la del filtro, donde los de toda la empresa aparecen en todas. */

/* Los puestos que declaran esta sucursal. Los de "toda la empresa" quedan fuera a propósito:
   no se mudan al borrarla porque nunca estuvieron en ella. */
const puestosDe = (sucursalId, org) => org.cargos.filter(c => (c.sucursalIds || []).includes(sucursalId))

/* CREAR Y EDITAR SE FUERON A SU PROPIA PANTALLA.
   Vivían en un modal de 560 px con doce campos y scroll propio, encima de la tabla que uno
   acababa de dejar de ver. Ahora son `/organizacion/sucursales/nueva` y
   `/organizacion/sucursales/<id>`, con la misma ficha de doble estado que "Datos de la empresa"
   —ver `SucursalDetalle`—. Aquí se queda lo que sí es una decisión corta: confirmar un borrado.

   La tabla pasó a ser un índice: cada fila lleva a su ficha, y por eso la fila entera se puede
   pulsar y no solo el lapicito. */

/* LA FICHA DE UNA SOLA SEDE, que es lo que se ve cuando el ámbito no es «todas».
   Parado en Cochabamba, una lista de ocho sucursales no contesta ninguna pregunta: la única sede
   que te toca es la tuya, y llegar a ella obligaba a recorrer una tabla para buscarte.

   LOS DATOS DE LA EMPRESA NO DESAPARECEN por estar en una sede: la razón social y el NIT siguen
   siendo verdad en Cochabamba y quien administra ahí los necesita. Es la regla de siempre —el
   ámbito recorta lo que ocurre, no lo que se define—; lo que sobra estando en una sede es la
   LISTA de las otras siete, no la identidad de la empresa. */
function DatoFicha({ icon: Icon, label, valor }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <Icon size={15} style={{ color: 'var(--icon-muted)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div style={{ fontSize: 13.5, color: valor ? 'var(--text-heading)' : 'var(--text-muted)', marginTop: 2, wordBreak: 'break-word' }}>
          {valor || 'Sin registrar'}
        </div>
      </div>
    </div>
  )
}

function FichaSucursal({ sucursal, puestos, personasEnSede, onEditar }) {
  const estado = ESTADOS_SUCURSAL[sucursal.estado || 'activa']
  const apertura = sucursal.apertura
    ? new Date(`${sucursal.apertura}T00:00:00`).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Datos de la sucursal</h1>
          <p className="pl-subtitle">Estás parado en {sucursal.ciudad}. Esta es su ficha.</p>
        </div>
        <button className="pl-btn-new" style={{ marginLeft: 'auto' }} onClick={onEditar}>
          <Pencil size={14} color="#00E091" /> Editar sucursal
        </button>
      </div>

      <div className="sec-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', borderBottom: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--green-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Building2 size={22} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-.01em' }}>
              {sucursal.ciudad}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {sucursal.nombre}{sucursal.codigo ? ` · Código ${sucursal.codigo}` : ''}
            </div>
          </div>
          <span style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
            background: estado.bg, color: estado.color, flexShrink: 0,
          }}>{estado.label}</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 20, padding: '20px 22px',
        }}>
          <DatoFicha icon={MapPin} label="Dirección" valor={sucursal.direccion} />
          <DatoFicha icon={Phone} label="Teléfono" valor={sucursal.telefono} />
          <DatoFicha icon={Mail} label="Correo" valor={sucursal.correo} />
          <DatoFicha icon={UserRound} label="Responsable" valor={sucursal.responsable} />
          <DatoFicha icon={Clock} label="Horario de atención" valor={sucursal.horario} />
          <DatoFicha icon={CalendarDays} label="Abierta desde" valor={apertura} />
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--blue)' }}>
          <div className="kpi-title" style={{ color: 'var(--blue)' }}>Puestos</div>
          <div className="kpi-val">{puestos}</div>
          <div className="kpi-lbl">Plazas declaradas en esta sede</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>Personas</div>
          <div className="kpi-val">{personasEnSede}</div>
          <div className="kpi-lbl">Ocupando una de esas plazas</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
        La razón social, el NIT y el logo son de la empresa entera y no cambian por sucursal:
        están en <strong style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Datos de la empresa</strong>.
        Para ver o crear otras sedes, cambia la sucursal a «todas» en el riel.
      </p>
    </>
  )
}

export default function Sucursales() {
  const { sucursales, setSucursales, organigrama: org } = useOnboardingData()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [borrando, setBorrando] = useState(null)

  const irA = id => navigate(`/organizacion/sucursales/${id}`)

  /* SIN ÁMBITO NO HAY «LA SEDE EN LA QUE ESTOY». La pantalla abría directamente en la ficha de
     la sucursal activa cuando había una elegida; sacado el filtro global, siempre abre en la
     lista, que es lo que una lista tiene que hacer. */
  const sedeActiva = null

  const filas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return sucursales
      .map(s => ({ ...s, puestos: puestosDe(s.id, org).length }))
      .filter(s => !q
        || s.nombre.toLowerCase().includes(q)
        || (s.ciudad || '').toLowerCase().includes(q)
        || (s.direccion || '').toLowerCase().includes(q))
  }, [sucursales, org, busca])

  const totalPuestos = filas.reduce((s, f) => s + f.puestos, 0)
  /* Los que no declaran sucursal. No es un error: es "toda la empresa", y verlo evita
     preguntarse por qué las sucursales no suman el total de puestos. */
  const sinSucursal = org.cargos.filter(c => !(c.sucursalIds || []).length).length

  const bloqueo = borrando && borrando.puestos > 0

  /* DOS PANTALLAS EN UNA RUTA, según dónde estés parado: la lista con las ocho cuando el ámbito
     es «todas», y la ficha de la tuya cuando no. Es la misma ruta a propósito —los enlaces y los
     marcadores siguen funcionando— y el menú del módulo cambia el rótulo para avisar cuál toca. */
  if (sedeActiva) {
    const puestosSede = puestosDe(sedeActiva.id, org)
    const personasEnSede = puestosSede.filter(c => ocupantesDe(c).length > 0).length
    return (
      <div className="content-scroll">
        <FichaSucursal
          sucursal={sedeActiva}
          puestos={puestosSede.length}
          personasEnSede={personasEnSede}
          onEditar={() => irA(sedeActiva.id)}
        />
      </div>
    )
  }

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Sucursales</h1>
          <p className="pl-subtitle">Dónde está la empresa. Cada puesto pertenece a una sucursal, o a toda la empresa.</p>
        </div>
        <button className="pl-btn-new" style={{ marginLeft: 'auto' }} onClick={() => navigate('/organizacion/sucursales/nueva')}>
          <Plus size={14} color="#00E091" /> Nueva sucursal
        </button>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--blue)' }}>
          <div className="kpi-title" style={{ color: 'var(--blue)' }}>Sucursales</div>
          <div className="kpi-val">{sucursales.length}</div>
          <div className="kpi-lbl">Ubicaciones registradas</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>Puestos ubicados</div>
          <div className="kpi-val">{totalPuestos}</div>
          <div className="kpi-lbl">Asignados a una sucursal concreta</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)' }}>
          <div className="kpi-title" style={{ color: 'var(--yellow)' }}>Sin sucursal</div>
          <div className="kpi-val">{sinSucursal}</div>
          <div className="kpi-lbl">Valen para toda la empresa</div>
        </div>
      </div>

      <div className="pl-toolbar">
        <div className="pl-search-wrap">
          <Search size={15} className="pl-search-ico" />
          <input
            className="pl-search"
            placeholder="Buscar por nombre, ciudad o dirección…"
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
          <MapPin size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', margin: 0 }}>
            {busca ? 'Ninguna sucursal coincide' : 'Todavía no hay sucursales'}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '5px 0 0' }}>
            {busca ? 'Prueba con otro nombre o ciudad.' : 'Crea la primera para poder ubicar los puestos.'}
          </p>
        </div>
      ) : (
        <div className="as-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="as-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ciudad</th>
                {/* El código va junto a la ciudad porque es lo que identifica a la sede ante el
                    SIN, y en una tabla de ocho «Sucursal» es la otra mitad del nombre. */}
                <th>Código</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Puestos</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(sucursal => (
                /* `stopPropagation` en los botones de la derecha: sin eso, pulsar la papelera
                   abriría además la ficha por detrás del modal de confirmación. */
                <tr
                  key={sucursal.id}
                  onClick={() => irA(sucursal.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: 'var(--surface-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{sucursal.nombre}</span>
                    </div>
                  </td>
                  <td>{sucursal.ciudad}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: sucursal.codigo ? undefined : 'var(--text-muted)' }}>
                    {sucursal.codigo || '—'}
                  </td>
                  <td style={{ color: sucursal.direccion ? undefined : 'var(--text-muted)' }}>
                    {sucursal.direccion || '—'}
                  </td>
                  <td>
                    {(() => {
                      const e = ESTADOS_SUCURSAL[sucursal.estado || 'activa']
                      return (
                        <span style={{
                          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: e.bg, color: e.color, whiteSpace: 'nowrap',
                        }}>{e.label}</span>
                      )
                    })()}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {sucursal.puestos > 0
                      ? sucursal.puestos
                      : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        aria-label={`Editar ${sucursal.nombre}`}
                        onClick={e => { e.stopPropagation(); irA(sucursal.id) }}
                        style={btnIcono}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        aria-label={`Eliminar ${sucursal.nombre}`}
                        onClick={e => { e.stopPropagation(); setBorrando(sucursal) }}
                        style={btnIcono}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {borrando && (
        <div className="pl-overlay" onClick={() => setBorrando(null)}>
          <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="pl-modal-header">
              <h2>Eliminar sucursal</h2>
              <button className="pl-modal-close" onClick={() => setBorrando(null)}><X size={18} /></button>
            </div>
            <div className="pl-modal-body">
              {bloqueo ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                    padding: '12px 14px', borderRadius: 10,
                    background: '#fffbeb', border: '1px solid #fde68a',
                  }}>
                    <AlertTriangle size={16} style={{ color: '#92400e', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>
                      No se puede eliminar todavía
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    <strong style={{ color: 'var(--text-heading)' }}>{borrando.nombre}</strong> tiene{' '}
                    {borrando.puestos} {borrando.puestos === 1 ? 'puesto asignado' : 'puestos asignados'}.
                    Muévelos a otra sucursal —o déjalos para toda la empresa— y vuelve a intentarlo.
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Se eliminará <strong style={{ color: 'var(--text-heading)' }}>{borrando.nombre}</strong>
                  {borrando.ciudad ? ` (${borrando.ciudad})` : ''}. No tiene puestos asignados, así que
                  no cambia nada del organigrama.
                </p>
              )}
            </div>
            <div className="pl-modal-footer">
              <button className="pl-btn-cancel" onClick={() => setBorrando(null)}>
                {bloqueo ? 'Entendido' : 'Cancelar'}
              </button>
              {!bloqueo && (
                <button
                  onClick={() => {
                    setSucursales(prev => prev.filter(s => s.id !== borrando.id))
                    setBorrando(null)
                  }}
                  style={{
                    padding: '9px 20px', borderRadius: 10, border: 'none', background: '#ef4444',
                    color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const btnIcono = {
  width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-soft)',
  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
}
