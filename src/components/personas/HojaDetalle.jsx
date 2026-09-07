import { ChevronRight } from 'lucide-react'
import Avatar from './Avatar'
import {
  getUnidad, TIPOS_CARGO, filaDeCargo, funcionalesDe, coordinacionesDe, nivelesDe,
  cabezaDe, subunidadesDe, cargosDeUnidad, apoyosDeUnidad,
} from '../../data/organigramaData'

/* LA HOJA DE DATOS: lo que se ve al abrir un cuadro sin pedir editarlo.

   Antes esto era el formulario con los campos apagados, y ahí estaba el problema: enseñaba lo
   que se puede CAMBIAR y no lo que uno quiere SABER. Abierto desde el gráfico casi no agregaba
   nada —el área ya se ve, porque el cuadro está dentro de su píldora, y el jefe también, porque
   cuelga de él— mientras que lo que el dibujo no contesta (cuánta gente cuelga, cuánto de eso
   está sin cubrir, con quién coordina) vivía escondido detrás de pestañas.

   Se compararon tres composiciones sobre datos reales y se eligió esta: la misma silueta de
   siempre —el dibujo a la izquierda, los datos a la derecha— pero sin pestañas, sin andamiaje
   de formulario y con lo vacío fuera. */

/* UN RENGLÓN, Y SOLO SI HAY ALGO QUE DECIR. En un formulario un campo vacío es un hueco por
   llenar; en una hoja de datos es una línea que no aporta y que le quita peso a la de al lado.
   El código de un puesto que nadie cargó no se dibuja: no existe esa información.

   Lo que sí importa cuando falta —que el puesto no lo ocupe nadie— no es un vacío: es un
   estado, y se dice con palabras. */
function Fila({ rotulo, valor, detalle, children }) {
  if (!children && (valor == null || valor === '')) return null
  return (
    <div className="og-ficha-fila">
      <span className="og-ficha-rot">{rotulo}</span>
      <div className="og-ficha-val">
        {children || <><strong>{valor}</strong>{detalle && <em>{detalle}</em>}</>}
      </div>
    </div>
  )
}

/* CUÁNTOS FALTAN POR CUBRIR, EN PALABRAS. "1 sin cubrir" obliga a mirar el total y restar para
   entender qué parte del equipo falta; "uno de ellos" lo dice de corrido. Se probó nombrar los
   puestos uno por uno y era demasiado para una ficha: el número contesta la pregunta y el
   dibujo de al lado tiene los nombres. */
const sinCubrirDicho = (total, faltan) => {
  if (faltan === 0) return 'todos cubiertos'
  if (total === 1) return 'sin cubrir'
  if (faltan === 1) return 'uno de ellos sin cubrir'
  if (faltan === total) return 'ninguno cubierto todavía'
  return `${faltan} de ellos sin cubrir`
}

/* Cómo se lee cada coordinación. Son las mismas tres palabras que ya usa el formulario: la
   relación se cuenta desde este puesto, no desde el otro. */
const ROL = { par: 'Par', supervisor: 'Supervisa', supervisado: 'Lo supervisa' }

export function HojaCargo({ cargo, org }) {
  const { unidad, tipo, sedes, ocupantes, jefeNombre, grado } = filaDeCargo(cargo, org)
  const madre = getUnidad(unidad?.padreId, org)
  const jefe = cargo.reportaA ? org.cargos.find(c => c.id === cargo.reportaA) : null
  const quienManda = jefe ? filaDeCargo(jefe, org).ocupantes[0] : null

  /* Cuánta gente cuelga y cuánta de esa está por cubrir. Es la pregunta que el cuadro del
     organigrama no contesta —hay que contar los hijos a ojo— y la razón de abrir la ficha. */
  const reportes = org.cargos.filter(c => c.reportaA === cargo.id).map(c => filaDeCargo(c, org))
  const sinCubrir = reportes.filter(f => f.vacante).length

  const t = TIPOS_CARGO.find(x => x.key === tipo)
  const apoyos = funcionalesDe(cargo)
  const coordinaciones = coordinacionesDe(cargo.id, org)
  const sede = sedes[0]

  return (
    <div className="pl-modal-body og-ficha">
      <Fila rotulo="Quién lo ocupa">
        {ocupantes.length ? (
          <span className="og-ficha-gente">
            <Avatar persona={ocupantes[0]} size={26} clase="og-chip-av" />
            <strong>{ocupantes[0].name}</strong>
          </span>
        ) : (
          <em className="og-ficha-falta">
            {tipo === 'outsourcing' ? 'Sin prestador asignado' : 'Sin colaborador asignado'}
          </em>
        )}
      </Fila>

      <Fila
        rotulo="Unidad"
        valor={unidad?.nombre}
        detalle={madre && `dentro de ${madre.nombre}`}
      />

      <Fila
        rotulo="Depende de"
        valor={jefeNombre || 'Nadie: es raíz del organigrama'}
        detalle={quienManda?.name}
      />

      {reportes.length > 0 && (
        <Fila
          rotulo="Le reportan"
          valor={`${reportes.length} ${reportes.length === 1 ? 'puesto' : 'puestos'}`}
          detalle={sinCubrirDicho(reportes.length, sinCubrir)}
        />
      )}

      {/* EL NIVEL DE MANDO FALTABA, y es de las pocas cosas de la ficha que explican el dibujo:
          es lo que decide cuánto baja el cuadro respecto de su jefe. Sin él había que abrir el
          formulario para saber por qué un puesto estaba escalonado.

          Se dice también en qué lugar de la escala cae, porque el nombre solo no ubica: "Asistente"
          no dice si es el tercero o el sexto, y el catálogo lo arma cada empresa.

          Sin nivel declarado no se dibuja el renglón, como con el código: no es un estado, es una
          información que todavía no existe. */}
      <Fila
        rotulo="Nivel de mando"
        valor={grado?.nombre}
        detalle={grado && `${grado.orden}.º de ${nivelesDe(org).length} niveles`}
      />

      <Fila rotulo="Tipo" valor={t?.label} detalle={t?.desc} />

      {/* La lista vacía de sedes quiere decir "toda la empresa", igual que en el dato: no es
          una sede que falta. */}
      <Fila
        rotulo="Sucursal"
        valor={sede ? sede.ciudad : 'Toda la empresa'}
        detalle={sede ? sede.nombre : 'no pertenece a una sucursal en particular'}
      />

      {apoyos.length > 0 && (
        <Fila rotulo="También trabaja en">
          {apoyos.map(f => (
            <span key={f.unidadId} className="og-ficha-linea">
              <strong>{getUnidad(f.unidadId, org)?.nombre}</strong>
              <em>{f.reportaA
                ? `responde a ${org.cargos.find(c => c.id === f.reportaA)?.nombre}`
                : 'cuelga de la unidad'}</em>
            </span>
          ))}
        </Fila>
      )}

      {coordinaciones.length > 0 && (
        <Fila rotulo="Coordina con">
          {coordinaciones.map(c => (
            <span key={c.id} className="og-ficha-linea">
              <strong>{c.contraparte.nombre}</strong>
              <em>{ROL[c.rol]}</em>
            </span>
          ))}
        </Fila>
      )}

      <Fila rotulo="Código" valor={cargo.codigo} />
    </div>
  )
}

export function HojaUnidad({ unidad, org, empresa, onAbrirCargo }) {
  const madre = getUnidad(unidad.padreId, org)
  const cabeza = cabezaDe(unidad.id, org)
  const mando = cabeza?.reportaA ? org.cargos.find(c => c.id === cabeza.reportaA) : null
  const cargos = cargosDeUnidad(unidad.id, org)
  const subs = subunidadesDe(unidad.id, org)
  const apoyos = apoyosDeUnidad(unidad.id, org)
  /* `cargosDeUnidad` ya devuelve filas calculadas, no cargos sueltos: volver a pasarlas por
     `filaDeCargo` leía la lista de personas como si fueran ids y daba vacante siempre. */
  const porCubrir = cargos.filter(f => f.vacante).length

  return (
    <div className="pl-modal-body og-ficha">
      {/* QUÉ CLASE DE UNIDAD ES, ARRIBA DE TODO. El formulario lo pide como obligatorio y esta
          hoja no lo enseñaba: un campo que hay que contestar para poder guardar y que después no
          se ve en ninguna parte enseña que era un trámite. Y es lo primero que contesta la hoja
          —si esto es una dirección o un equipo de tres— antes que de quién depende. */}
      {unidad.tipoUnidad && <Fila rotulo="Tipo" valor={unidad.tipoUnidad} />}

      {/* El estado solo cuando dice algo. «Activa» es el caso de casi todas y ocupa un renglón
          para no informar nada; inactiva sí hay que verlo sin buscarlo. */}
      {unidad.estado && unidad.estado !== 'activa' && (
        <Fila
          rotulo="Estado"
          valor="Inactiva"
          detalle="No se ofrece para cosas nuevas; conserva su historia y su gente."
        />
      )}

      <Fila
        rotulo="Dentro de"
        valor={madre?.nombre || empresa.nombre}
        detalle={madre ? undefined : 'cuelga directamente de la empresa'}
      />

      {/* El mando del área es el "Reporta a" de su cabeza: una sola verdad, contada desde el
          lado en que se está parado. Sin cabeza todavía, el dato vive en la unidad. */}
      <Fila
        rotulo="Bajo el mando de"
        valor={mando?.nombre || getUnidad(unidad.mandoId, org)?.nombre || 'Nadie: cuelga de la unidad'}
      />

      {cabeza && (
        <Fila
          rotulo="Su cabeza"
          valor={cabeza.nombre}
          detalle={filaDeCargo(cabeza, org).ocupantes[0]?.name || 'vacante'}
        />
      )}

      <Fila
        rotulo="Cargos"
        valor={cargos.length === 0
          ? 'Ninguno todavía'
          : `${cargos.length} ${cargos.length === 1 ? 'puesto' : 'puestos'}`}
        detalle={cargos.length > 0 ? sinCubrirDicho(cargos.length, porCubrir) : undefined}
      />

      {subs.length > 0 && (
        <Fila
          rotulo="Sub-unidades"
          valor={`${subs.length} ${subs.length === 1 ? 'unidad' : 'unidades'}`}
          detalle={subs.map(u => u.nombre).join(' · ')}
        />
      )}

      {/* Quién trabaja acá sin ser de acá. Se puede abrir: el dato es del cargo y se cambia en
          su formulario, así que desde aquí solo se ofrece el camino a esa puerta. */}
      {apoyos.length > 0 && (
        <Fila rotulo="Apoyo funcional">
          {apoyos.map(({ cargo: c, reportaA }) => (
            <button
              key={c.id}
              type="button"
              className="og-ficha-abrir"
              title={`Abrir ${c.nombre}`}
              onClick={() => onAbrirCargo?.(c)}
            >
              <span className="og-ficha-linea">
                <strong>{c.nombre}</strong>
                <em>
                  de {getUnidad(c.unidadId, org)?.nombre || 'sin unidad'}
                  {reportaA && ` · responde a ${org.cargos.find(x => x.id === reportaA)?.nombre}`}
                </em>
              </span>
              <ChevronRight size={13} />
            </button>
          ))}
        </Fila>
      )}

      <Fila
        rotulo="Nombre corto"
        valor={unidad.corto && unidad.corto !== unidad.nombre ? unidad.corto : null}
      />
      <Fila rotulo="Código" valor={unidad.codigo} />
    </div>
  )
}
