import { useState } from 'react'
import { ChevronLeft, ChevronRight, Building2, Star, User, Briefcase } from 'lucide-react'
import Avatar from '../personas/Avatar'
import {
  unidadesRaiz, subunidadesDe, tarjetaUnidad, cargosDeUnidad, getUnidad, TIPOS_CARGO,
} from '../../data/organigramaData'
import { useOnboardingData } from '../../context/OnboardingDataContext'

// Las etiquetas salen del modelo para que el celular no se quede atrás cuando se agrega un tipo.
const TIPO = Object.fromEntries(TIPOS_CARGO.map(t => [t.key, t.label]))

function Titulo({ texto, conteo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 7px', paddingLeft: 6, borderLeft: '2px solid #0C2D40' }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: '#0C2D40' }}>{texto}</span>
      <span style={{ fontSize: 6, color: '#94a3b8' }}>{conteo}</span>
    </div>
  )
}

function FilaUnidad({ datos, onEntrar }) {
  const { unidad, cabeza, totalCargos, totalSub } = datos
  return (
    <div
      onClick={() => onEntrar(unidad.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        background: '#0C2D40', borderRadius: 10, padding: '9px 10px', marginBottom: 6,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Building2 size={11} style={{ color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{unidad.nombre}</div>
        {cabeza && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Star size={7} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 6, color: 'rgba(255,255,255,.7)' }}>{cabeza.nombre}</span>
          </div>
        )}
        <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
          {totalCargos} {totalCargos === 1 ? 'cargo' : 'cargos'} · {totalSub} {totalSub === 1 ? 'sub-unidad' : 'sub-unidades'}
        </div>
      </div>
      <ChevronRight size={11} style={{ color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
    </div>
  )
}

function TarjetaCargo({ fila }) {
  const { cargo, tipo, ocupantes, vacante, jefeNombre } = fila
  const staff = tipo === 'staff'
  // El color dice el tipo de puesto y la etiqueta dice si falta cubrirlo: un servicio
  // tercerizado sin prestador sigue siendo violeta, y además va marcado como vacante.
  const externo = tipo === 'outsourcing'
  const porCubrir = vacante && !staff && !externo
  return (
    <div style={{
      position: 'relative',
      background: porCubrir ? '#fef3c7' : staff ? '#ccfbf1' : externo ? '#ede9fe' : '#fff',
      border: porCubrir ? '1.5px dashed #d97706' : staff ? '1.5px dashed #0d9488'
        : externo ? '1.5px dashed #7c3aed' : '1px solid #e2e8f0',
      borderRadius: 10, padding: '9px 10px', marginBottom: 6,
    }}>
      {vacante && (
        <span style={{
          position: 'absolute', top: -5, right: 8,
          background: '#d97706', color: '#fff',
          fontSize: 5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase',
          padding: '1px 5px', borderRadius: 4,
        }}>Vacante</span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        {/* La estrella era del tipo 'jefe', que dejó de existir: quién manda se lee en el
            dibujo, no en un ícono. Queda para el cargo DESTACADO, que sí es una marca puesta a
            mano. */}
        {cargo.destacado
          ? <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          : externo
            ? <Briefcase size={12} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
            : <User size={12} style={{ color: '#7C93A6', flexShrink: 0, marginTop: 1 }} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.25, color: porCubrir ? '#92400e' : staff ? '#115e59' : externo ? '#5b21b6' : '#0C2D40' }}>{cargo.nombre}</div>
          <div style={{ fontSize: 6, fontWeight: 600, color: '#94a3b8', marginTop: 1 }}>{TIPO[tipo]}</div>
        </div>
      </div>

      {jefeNombre && (
        <div style={{ fontSize: 5.5, color: '#94a3b8', marginTop: 6 }}>
          ↑ Reporta a <span style={{ color: '#0C2D40', fontWeight: 700 }}>{jefeNombre}</span>
        </div>
      )}

      <div style={{ height: 1, background: '#f1f5f9', margin: '7px 0 6px' }} />

      {ocupantes.length ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 7, padding: '5px 7px' }}>
          {ocupantes.slice(0, 3).map(p => (
            <Avatar key={p.id} persona={p} size={15} clase="og-chip-av" style={{ fontSize: 5.5 }} />
          ))}
          <span style={{ fontSize: 7, fontWeight: 600, color: '#0C2D40' }}>
            {ocupantes.length === 1 ? ocupantes[0].name : `${ocupantes.length} personas`}
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,.7)', border: '1px dashed #d97706', borderRadius: 7,
          padding: '5px 7px', fontSize: 6.5, fontWeight: 700, color: '#92400e',
        }}>{externo ? 'Sin prestador asignado' : 'Sin colaborador asignado'}</div>
      )}
    </div>
  )
}

export default function OrganigramaPhone({ onSalir }) {
  const { organigrama: org } = useOnboardingData()
  const [ruta, setRuta] = useState([])
  const actual = ruta.length ? ruta[ruta.length - 1] : null

  // Volver sube un nivel; desde la raíz, sale del módulo de vuelta a Zona HR.
  const volver = () => (ruta.length ? setRuta(r => r.slice(0, -1)) : onSalir())

  /* La misma estructura que la web. Sin el `org` estas funciones caen en la sembrada por
     defecto, así que el celular seguía mostrando el organigrama viejo después de resetear
     la demo o de construir uno nuevo. */
  const raices = unidadesRaiz(org).map(u => tarjetaUnidad(u.id, org))
  const cargos = actual ? cargosDeUnidad(actual, org) : []
  const subs = actual ? subunidadesDe(actual, org).map(u => tarjetaUnidad(u.id, org)) : []
  const nombre = actual ? getUnidad(actual, org)?.nombre : null

  return (
    <div style={{ padding: '2px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <button
          onClick={volver}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: 7, border: '1px solid #e2e8f0',
            background: '#fff', color: '#0C2D40', cursor: 'pointer', padding: 0, flexShrink: 0,
          }}
        >
          <ChevronLeft size={11} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0C2D40' }}>Organigrama</div>
          <div style={{ fontSize: 6, color: '#94a3b8' }}>{nombre || 'Estructura de la empresa'}</div>
        </div>
      </div>

      {!actual ? (
        <>
          <Titulo texto="Unidades organizacionales" conteo={`${raices.length} ${raices.length === 1 ? 'área' : 'áreas'}`} />
          {/* El colaborador no arma el organigrama, solo lo consulta: si todavía no hay
              ninguno, lo único honesto es decirlo y no ofrecerle un botón de crear. */}
          {raices.length === 0
            ? <div style={{ fontSize: 6.5, color: '#94a3b8', marginBottom: 8 }}>La empresa todavía no cargó su organigrama.</div>
            : raices.map(d => <FilaUnidad key={d.unidad.id} datos={d} onEntrar={id => setRuta(r => [...r, id])} />)}
        </>
      ) : (
        <>
          <Titulo texto="Cargos" conteo={`${cargos.length} ${cargos.length === 1 ? 'cargo' : 'cargos'}`} />
          {cargos.length === 0
            ? <div style={{ fontSize: 6.5, color: '#94a3b8', marginBottom: 8 }}>Esta unidad todavía no tiene cargos definidos.</div>
            : cargos.map(f => <TarjetaCargo key={f.cargo.id} fila={f} />)}

          {subs.length > 0 && (
            <>
              <Titulo texto="Sub-unidades" conteo={`${subs.length} ${subs.length === 1 ? 'área' : 'áreas'}`} />
              {subs.map(d => <FilaUnidad key={d.unidad.id} datos={d} onEntrar={id => setRuta(r => [...r, id])} />)}
            </>
          )}
        </>
      )}
    </div>
  )
}
