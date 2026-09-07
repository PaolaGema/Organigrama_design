import { useMemo, useState } from 'react'
import { Layers, Plus, Pencil, Trash2, X, Search, AlertTriangle, CornerDownRight } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { nuevoId, bloqueoUnidad, eliminarUnidad, unidadesPadrePosibles } from '../../data/organigramaData'
import Desplegable from '../../components/layout/Desplegable'

/* LAS ÁREAS, en lista y no en dibujo.
   El organigrama ya deja crearlas, pero para responder "¿cuántas áreas tenemos y cuál está
   vacía?" hay que recorrer el lienzo a ojo. Esta pantalla contesta eso de un vistazo, sobre el
   MISMO dato: lo que se cambia aquí se ve allá, porque las dos leen `organigrama` del contexto.

   LAS REGLAS DE BORRADO NO SE REESCRIBEN AQUÍ. `bloqueoUnidad` ya sabe que un área no se lleva
   por delante sus cargos ni sus sub-áreas, y que la empresa necesita al menos una; se le
   pregunta a ella y se muestra su motivo. Dos copias de esa regla se desincronizan el día que
   alguien cambie una sola.

   EL ORDEN ES EL DEL ÁRBOL, no alfabético: un área se entiende por dónde cuelga. Al buscar sí
   se aplana la lista, porque ahí lo que importa es encontrarla. */

const vacio = v => !v || !String(v).trim()

/* Recorre el árbol en profundidad y devuelve filas con su nivel de sangría. Padres antes que
   hijos y hermanos por nombre: es el mismo orden en que se lee el organigrama. */
function filasArbol(org) {
  const hijos = new Map()
  for (const u of org.unidades) {
    const k = u.padreId ?? '__raiz__'
    if (!hijos.has(k)) hijos.set(k, [])
    hijos.get(k).push(u)
  }
  for (const lista of hijos.values()) lista.sort((a, b) => a.nombre.localeCompare(b.nombre))

  const filas = []
  const bajar = (clave, nivel) => {
    for (const u of hijos.get(clave) || []) {
      filas.push({ unidad: u, nivel })
      bajar(u.id, nivel + 1)
    }
  }
  bajar('__raiz__', 0)

  /* Un área cuyo padre fue borrado quedaría fuera del recorrido y desaparecería de la lista
     sin haber sido eliminada. Se recogen al final para que se vean y se puedan reubicar. */
  const vistas = new Set(filas.map(f => f.unidad.id))
  for (const u of org.unidades) {
    if (!vistas.has(u.id)) filas.push({ unidad: u, nivel: 0, huerfana: true })
  }
  return filas
}

function AreaModal({ unidad, org, onGuardar, onCerrar }) {
  const nueva = !unidad
  const [form, setForm] = useState(unidad || { nombre: '', corto: '', padreId: null })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const posibles = useMemo(
    () => unidadesPadrePosibles(unidad?.id, org).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [unidad, org])

  const repetida = org.unidades.some(u =>
    u.id !== unidad?.id && u.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase())

  const problema = vacio(form.nombre) ? 'Ponle un nombre'
    : repetida ? 'Ya hay un área con ese nombre'
      : null

  return (
    <div className="pl-overlay" onClick={onCerrar}>
      <div className="pl-modal pl-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pl-modal-header">
          <h2>{nueva ? 'Nueva área' : 'Editar área'}</h2>
          <button className="pl-modal-close" onClick={onCerrar}><X size={18} /></button>
        </div>

        <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="pl-label" htmlFor="area-nombre">
              <span>Nombre<span className="pl-req" aria-hidden="true">*</span></span>
            </label>
            <input
              id="area-nombre" className="pl-input" autoFocus required
              value={form.nombre} placeholder="Marketing Digital"
              onChange={e => set('nombre', e.target.value)}
            />
          </div>

          <div>
            {/* Sin etiqueta "opcional": lo que se marca es lo obligatorio, y esto no lo es. */}
            <label className="pl-label" htmlFor="area-corto">Etiqueta corta</label>
            <input
              id="area-corto" className="pl-input"
              value={form.corto || ''} placeholder="Mkt. Digital"
              onChange={e => set('corto', e.target.value)}
            />
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: '5px 0 0', lineHeight: 1.5 }}>
              Para la píldora «Pertenece a» de la tabla, donde el nombre largo no entra.
            </p>
          </div>

          <div>
            <label className="pl-label" htmlFor="area-padre">Dentro de</label>
            {/* "Ninguna" es una RESPUESTA, no un hueco —un área de primer nivel cuelga de la
                empresa a propósito—, así que va como primera opción de la lista y no como
                marcador de posición: el campo nunca se ve vacío porque nunca lo está. */}
            <Desplegable
              id="area-padre"
              valor={form.padreId || '__raiz__'}
              onCambio={v => set('padreId', v === '__raiz__' ? null : v)}
              opciones={[
                { valor: '__raiz__', etiqueta: 'Ninguna: es un área de primer nivel' },
                ...posibles.map(u => ({ valor: u.id, etiqueta: u.nombre })),
              ]}
            />
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: '5px 0 0', lineHeight: 1.5 }}>
              Las áreas se anidan, pero no reportan: quien reporta es el cargo.
            </p>
          </div>

          {/* La leyenda vive dentro del modal porque el asterisco vive dentro del modal. */}
          <p className="pl-leyenda" style={{ marginTop: 2 }}><b>*</b> Campo obligatorio</p>
        </div>

        <div className="pl-modal-footer">
          <button className="pl-btn-cancel" onClick={onCerrar}>Cancelar</button>
          <button
            className="pl-btn-save"
            disabled={!!problema}
            title={problema || undefined}
            onClick={() => onGuardar({
              ...form,
              nombre: form.nombre.trim(),
              corto: (form.corto || '').trim(),
            })}
          >
            {nueva ? 'Crear área' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Areas() {
  const { organigrama: org, setOrganigrama: setOrg } = useOnboardingData()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const [borrando, setBorrando] = useState(null)

  const filas = useMemo(() => {
    const base = filasArbol(org).map(f => ({
      ...f,
      puestos: org.cargos.filter(c => c.unidadId === f.unidad.id).length,
      subareas: org.unidades.filter(u => u.padreId === f.unidad.id).length,
    }))
    const q = busca.trim().toLowerCase()
    if (!q) return base
    // Buscando se aplana: la sangría estorba cuando lo que importa es encontrarla.
    return base
      .filter(f => f.unidad.nombre.toLowerCase().includes(q) || (f.unidad.corto || '').toLowerCase().includes(q))
      .map(f => ({ ...f, nivel: 0 }))
  }, [org, busca])

  const vacias = filas.filter(f => f.puestos === 0 && f.subareas === 0).length
  const motivoBloqueo = borrando ? bloqueoUnidad(borrando.id, org) : null

  function guardar(datos) {
    if (editando === 'nueva') {
      setOrg(prev => ({ ...prev, unidades: [...prev.unidades, { ...datos, id: nuevoId('area', prev.unidades) }] }))
    } else {
      setOrg(prev => ({
        ...prev,
        unidades: prev.unidades.map(u => (u.id === editando.id ? { ...u, ...datos } : u)),
      }))
    }
    setEditando(null)
  }

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Áreas</h1>
          <p className="pl-subtitle">Las unidades de la organización. Se anidan entre sí y agrupan puestos.</p>
        </div>
        <button className="pl-btn-new" style={{ marginLeft: 'auto' }} onClick={() => setEditando('nueva')}>
          <Plus size={14} color="#00E091" /> Nueva área
        </button>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--blue)' }}>
          <div className="kpi-title" style={{ color: 'var(--blue)' }}>Áreas</div>
          <div className="kpi-val">{org.unidades.length}</div>
          <div className="kpi-lbl">Unidades registradas</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)' }}>
          <div className="kpi-title" style={{ color: 'var(--green)' }}>De primer nivel</div>
          <div className="kpi-val">{org.unidades.filter(u => !u.padreId).length}</div>
          <div className="kpi-lbl">Cuelgan de la empresa</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)' }}>
          <div className="kpi-title" style={{ color: 'var(--yellow)' }}>Vacías</div>
          <div className="kpi-val">{vacias}</div>
          <div className="kpi-lbl">Sin puestos ni sub-áreas</div>
        </div>
      </div>

      <div className="pl-toolbar">
        <div className="pl-search-wrap">
          <Search size={15} className="pl-search-ico" />
          <input
            className="pl-search"
            placeholder="Buscar área…"
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
          <Layers size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', margin: 0 }}>
            {busca ? 'Ninguna área coincide' : 'Todavía no hay áreas'}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '5px 0 0' }}>
            {busca ? 'Prueba con otro nombre.' : 'Crea la primera para poder colgar puestos de ella.'}
          </p>
        </div>
      ) : (
        <div className="as-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="as-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Área</th>
                <th>Etiqueta corta</th>
                <th style={{ textAlign: 'right' }}>Puestos</th>
                <th style={{ textAlign: 'right' }}>Sub-áreas</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ unidad, nivel, puestos, subareas, huerfana }) => (
                <tr key={unidad.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: nivel * 20 }}>
                      {nivel > 0 && <CornerDownRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                      <span style={{ fontWeight: nivel === 0 ? 600 : 500, color: 'var(--text-heading)' }}>
                        {unidad.nombre}
                      </span>
                      {huerfana && (
                        <span
                          title="Su área madre ya no existe. Edítala para reubicarla."
                          style={{
                            fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            background: '#fffbeb', color: '#92400e', whiteSpace: 'nowrap',
                          }}
                        >
                          SIN MADRE
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: unidad.corto ? undefined : 'var(--text-muted)' }}>{unidad.corto || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: puestos ? undefined : 'var(--text-muted)' }}>
                    {puestos}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: subareas ? undefined : 'var(--text-muted)' }}>
                    {subareas}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button aria-label={`Editar ${unidad.nombre}`} onClick={() => setEditando(unidad)} style={btnIcono}>
                        <Pencil size={14} />
                      </button>
                      <button aria-label={`Eliminar ${unidad.nombre}`} onClick={() => setBorrando(unidad)} style={btnIcono}>
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

      {editando && (
        <AreaModal
          unidad={editando === 'nueva' ? null : editando}
          org={org}
          onGuardar={guardar}
          onCerrar={() => setEditando(null)}
        />
      )}

      {borrando && (
        <div className="pl-overlay" onClick={() => setBorrando(null)}>
          <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="pl-modal-header">
              <h2>Eliminar área</h2>
              <button className="pl-modal-close" onClick={() => setBorrando(null)}><X size={18} /></button>
            </div>
            <div className="pl-modal-body">
              {motivoBloqueo ? (
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
                    <strong style={{ color: 'var(--text-heading)' }}>{borrando.nombre}</strong>: {motivoBloqueo}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Se eliminará <strong style={{ color: 'var(--text-heading)' }}>{borrando.nombre}</strong>.
                  No tiene puestos ni sub-áreas, así que el organigrama no cambia de forma.
                </p>
              )}
            </div>
            <div className="pl-modal-footer">
              <button className="pl-btn-cancel" onClick={() => setBorrando(null)}>
                {motivoBloqueo ? 'Entendido' : 'Cancelar'}
              </button>
              {!motivoBloqueo && (
                <button
                  onClick={() => {
                    setOrg(prev => eliminarUnidad(borrando.id, prev))
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
