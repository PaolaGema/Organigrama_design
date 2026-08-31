import { X, Check, Network, Users, Building2 } from 'lucide-react'
import SelectorLista from './SelectorLista'
import {
  sucursales, getUnidad, TODAS_SUCURSALES, TODAS_UNIDADES, TIPOS_CARGO, nivelesDe,
} from '../../data/organigramaData'

/* EL PANEL DE FILTROS. Se eligió entre tres formas —todo en una barra, fichas de lo activo, y
   este panel— y ganó porque es la única donde caben los filtros que faltaban: con seis controles
   en fila, el de tipo de puesto entraba a presión y el de vacantes no tenía dónde.

   Agrupa por PREGUNTA y no por origen del dato: qué clase de puesto, en qué estado, dónde, y qué
   se dibuja. Los tres primeros recortan; el último es cómo se ve, y por eso va al final y no
   cuenta para el número del botón.

   SEDE Y ÁREA VAN EN DESPLEGABLE, no en lista abierta. Se probaron abiertas y el panel se
   convertía en un muro de casillas —seis sedes más siete áreas— con la última cortada contra el
   pie. Y son desplegables del producto, no unos nuevos: `SelectorLista` ya trae su buscador y
   dibuja las áreas como árbol sangrado.

   Los cambios se aplican al instante, sin botón de "Aplicar": sobre un dibujo que está a la
   vista, aplicar a mano obliga a dos gestos para ver una consecuencia que puede verse sola. */

/* El color de cada tipo, el mismo de la leyenda del dibujo. Sin la muestra son tres palabras y
   hay que acordarse de cuál era el violeta. */
const COLOR_TIPO = {
  colaborador: 'var(--navy)',
  staff: 'var(--og-staff)',
  outsourcing: 'var(--og-ext)',
}

/* LAS FICHAS DE LO ACTIVO. El panel sirve para elegir; esto, para VER qué está recortando sin
   volver a abrirlo, y para quitarlo de a uno.

   Sin recortes no se dibuja nada: una fila que dice "sin filtros" es una fila gastada en decir
   que no pasa nada. */
export function FichasFiltro({ filtros, org, sede, unidad, onCambio, onLimpiar }) {
  const fichas = []
  if (sede) fichas.push({ id: 'sede', txt: sede.ciudad, quitar: () => onCambio({ sedeId: TODAS_SUCURSALES }) })
  if (unidad) fichas.push({ id: 'area', txt: unidad.nombre, quitar: () => onCambio({ unidadId: TODAS_UNIDADES }) })
  for (const key of filtros.tipos) {
    const t = TIPOS_CARGO.find(x => x.key === key)
    fichas.push({
      id: `tipo-${key}`, txt: t?.label ?? key, clase: ` og-ficha-f-${key}`,
      quitar: () => onCambio({ tipos: filtros.tipos.filter(x => x !== key) }),
    })
  }
  for (const id of filtros.grados) {
    const n = nivelesDe(org).find(x => x.id === id)
    if (!n) continue
    fichas.push({
      id: 'grado-' + id, txt: n.nombre,
      quitar: () => onCambio({ grados: filtros.grados.filter(g => g !== id) }),
    })
  }
  if (filtros.estado !== 'todos') {
    fichas.push({
      id: 'estado',
      txt: filtros.estado === 'vacantes' ? 'Solo vacantes' : 'Solo cubiertos',
      clase: filtros.estado === 'vacantes' ? ' og-ficha-f-vacante' : '',
      quitar: () => onCambio({ estado: 'todos' }),
    })
  }
  if (!fichas.length) return null

  return (
    <div className="og-fichas">
      <span className="og-fichas-rot">Viendo</span>
      {fichas.map(f => (
        <span key={f.id} className={`og-ficha-f${f.clase || ''}`}>
          {f.txt}
          <button onClick={f.quitar} title={`Quitar ${f.txt}`}><X size={11} /></button>
        </span>
      ))}
      {fichas.length > 1 && (
        <button className="og-fichas-limpiar" onClick={onLimpiar}>Limpiar todo</button>
      )}
    </div>
  )
}

function Casilla({ marcada, children, onClick, muestra }) {
  return (
    <button type="button" className="og-fp-op" onClick={onClick} aria-pressed={marcada}>
      <span className={`og-fp-box${marcada ? ' on' : ''}`}>{marcada && <Check size={10} />}</span>
      {muestra && <span className="og-fp-muestra" style={{ background: muestra }} />}
      <span className="og-fp-txt">{children}</span>
    </button>
  )
}

function Grupo({ rotulo, children }) {
  return (
    <div className="og-fp-grupo">
      <span className="og-fp-rot">{rotulo}</span>
      {children}
    </div>
  )
}

const MODOS = [
  { key: 'completo', label: 'Áreas y cargos', Icon: Network },
  { key: 'cargos', label: 'Solo cargos', Icon: Users },
  { key: 'unidades', label: 'Solo áreas', Icon: Building2 },
]

export default function PanelFiltros({ org, filtros, onCambio, vista, cuantos, onLimpiar, onCerrar }) {
  /* Marcar y desmarcar sobre la misma lista: sin ninguno marcado se ven todos, que es la
     ausencia de recorte y no un recorte que no deja pasar nada. */
  const alternarTipo = key => onCambio({
    tipos: filtros.tipos.includes(key)
      ? filtros.tipos.filter(t => t !== key)
      : [...filtros.tipos, key],
  })

  const alternarGrado = id => onCambio({
    grados: filtros.grados.includes(id)
      ? filtros.grados.filter(g => g !== id)
      : [...filtros.grados, id],
  })

  /* Los dos estados se excluyen, pero van como casillas y no como radios porque hace falta poder
     VOLVER a "todos", y un grupo de radios no se apaga tocándolo otra vez. */
  const alternarEstado = cual => onCambio({ estado: filtros.estado === cual ? 'todos' : cual })

  /* `SelectorLista` usa `null` para su opción vacía; aquí "todo" se guarda con su constante. La
     traducción vive en este punto y no en el estado, para que el resto del sistema siga leyendo
     el mismo valor de siempre. */
  const sedeValor = filtros.sedeId === TODAS_SUCURSALES ? null : filtros.sedeId
  const areaValor = filtros.unidadId === TODAS_UNIDADES ? null : filtros.unidadId

  return (
    <aside className="og-fp" aria-label="Filtros del organigrama">
      <div className="og-fp-hd">
        <strong>Filtros</strong>
        <button className="og-fp-x" onClick={onCerrar} title="Cerrar los filtros"><X size={15} /></button>
      </div>

      <div className="og-fp-cuerpo">
        <Grupo rotulo="Tipo de puesto">
          {TIPOS_CARGO.map(t => (
            <Casilla
              key={t.key}
              marcada={filtros.tipos.includes(t.key)}
              muestra={COLOR_TIPO[t.key]}
              onClick={() => alternarTipo(t.key)}
            >
              {t.label}
            </Casilla>
          ))}
        </Grupo>

        {/* NIVEL DE MANDO, sin muestra de color: el nivel no tiñe el cuadro —lo que dice en el
            dibujo es la altura, no el color— y una muestra acá prometería una leyenda que el
            organigrama no usa. Sale del catálogo del `org` y no de una lista fija, así que un
            peldaño agregado aparece solo. */}
        <Grupo rotulo="Nivel de mando">
          {nivelesDe(org).map((n, i) => (
            <Casilla
              key={n.id}
              marcada={filtros.grados.includes(n.id)}
              onClick={() => alternarGrado(n.id)}
            >
              {i + 1} · {n.nombre}
            </Casilla>
          ))}
        </Grupo>

        <Grupo rotulo="Estado">
          <Casilla
            marcada={filtros.estado === 'vacantes'}
            muestra="var(--og-vacante)"
            onClick={() => alternarEstado('vacantes')}
          >
            Solo vacantes
          </Casilla>
          <Casilla
            marcada={filtros.estado === 'cubiertos'}
            onClick={() => alternarEstado('cubiertos')}
          >
            Solo cubiertos
          </Casilla>
        </Grupo>

        <Grupo rotulo="Dónde">
          <SelectorLista
            valor={sedeValor}
            onCambio={v => onCambio({ sedeId: v ?? TODAS_SUCURSALES })}
            vacia="Todas las sucursales"
            opciones={sucursales.map(s => ({ id: s.id, nombre: s.ciudad, detalle: s.nombre }))}
          />
          <SelectorLista
            valor={areaValor}
            onCambio={v => onCambio({ unidadId: v ?? TODAS_UNIDADES })}
            vacia="Toda la empresa"
            arbol
            opciones={org.unidades.map(u => ({
              id: u.id,
              nombre: u.nombre,
              padreId: u.padreId,
              detalle: getUnidad(u.padreId, org)?.nombre,
            }))}
          />
        </Grupo>

        {/* Esto NO recorta: cambia el dibujo. Va al final y no suma al número del botón, o
            "Filtrar (3)" contaría como recorte algo que no deja nada fuera. */}
        <Grupo rotulo="Qué se dibuja">
          <div className="og-fp-seg">
            {MODOS.map(m => (
              <button
                key={m.key}
                type="button"
                className={vista.pestana === m.key ? 'on' : ''}
                onClick={() => vista.setPestana(m.key)}
              >
                <m.Icon size={12} /> {m.label}
              </button>
            ))}
          </div>
          {vista.pestana !== 'unidades' && vista.cuantosFuncionales > 0 && (
            <Casilla
              marcada={vista.verFuncionales}
              onClick={() => vista.setVerFuncionales(v => !v)}
            >
              Apoyos funcionales <em>{vista.cuantosFuncionales}</em>
            </Casilla>
          )}
        </Grupo>
      </div>

      {/* El pie cuenta lo que queda a la vista, no lo que se va a aplicar: los cambios ya
          ocurrieron mientras se elegía. */}
      <div className="og-fp-pie">
        <span className="og-fp-cuenta">
          <strong>{cuantos}</strong> {cuantos === 1 ? 'cargo a la vista' : 'cargos a la vista'}
        </span>
        <button className="og-fp-limpiar" onClick={onLimpiar}>Limpiar</button>
      </div>
    </aside>
  )
}
