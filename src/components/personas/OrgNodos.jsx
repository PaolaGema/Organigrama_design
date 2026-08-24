import { User, Star, Briefcase, ChevronUp, ChevronDown, UserPlus } from 'lucide-react'
import Avatar from './Avatar'
import { rotuloVacantes } from '../../data/organigramaData'

/* El dibujo del árbol: la tarjeta de un cargo, la píldora de una unidad y la rama que las
   cuelga. Se mira y se abre con doble clic; la estructura se cambia en el formulario.

   `acomodo` es lo único interactivo que queda: mueve el cuadro de LUGAR sin tocar ningún dato.
   Sin él —la vista de solo lectura— las piezas son puro dibujo. */

/* Cuántas caras entran en una tarjeta de 200 px antes de convertirse en una fila de puntos.
   El resto se cuenta; la lista completa está en la ficha. */
const CARAS = 3

/* Cuántas personas se dibujan al desglosar antes de resumir el resto. Un cargo con cuarenta
   vendedores no puede empujar cuarenta renglones entre el cuadro y sus reportes: la lista
   entera está en la ficha, que es la pantalla a la que uno va a verla. */
const DESGLOSE = 6

/* CUÁNDO EL CUADRO SE PUEDE DESPLEGAR. Vive fuera del componente porque la usan dos: el chip,
   para saber si es un botón, y la tarjeta, para saber si dibuja el desglose.

   Se abre siempre que haya algo que dibujar abajo: una persona sola en su cajita, varias, o las
   plazas todavía por cubrir. Lo único que no se abre es el puesto vacante de una sola plaza,
   donde la casilla libre repetiría palabra por palabra lo que el chip ya dice.

   OJO CON LA FLECHITA. Se probó cortar el despliegue cuando había una sola persona, porque la
   flecha al lado del nombre hacía parecer que había gente escondida; el usuario avisó que así
   se perdía la cajita de esa persona. La flecha no era el problema: era que estuviera visible
   EN REPOSO. Ahora aparece al pasar el mouse —y se queda mientras está abierto—, así que el
   cuadro quieto se lee limpio y sigue pudiéndose abrir. */
export const hayQueDesplegar = ({ ocupantes, plazas }) => ocupantes.length > 0 || plazas > 1

function Ocupante({ nodo, externo, desglose }) {
  const { ocupantes, cargo, plazas } = nodo
  const hayMas = hayQueDesplegar(nodo)
  const abierto = desglose?.abiertos.has(cargo.id)

  if (!ocupantes.length) {
    /* El puesto vacante TAMBIÉN se despliega cuando tiene varias plazas: abajo aparece una
       casilla por cada una, aunque no haya nadie todavía. Antes este chip era texto muerto —el
       único cuadro del dibujo que no se podía abrir— así que un puesto recién creado con cuatro
       plazas decía "4 plazas por cubrir" y no había forma de verlas. */
    const propsVacio = desglose && hayMas && {
      onClick: e => { e.stopPropagation(); desglose.alternar(cargo.id) },
      onDoubleClick: e => e.stopPropagation(),
      title: abierto ? 'Ocultar las plazas' : 'Ver las plazas por cubrir',
    }
    return (
      <div className={`og-chip og-chip-vacio${desglose && hayMas ? ' og-chip-btn' : ''}${abierto ? ' og-chip-abierto' : ''}`} {...propsVacio}>
        {/* Con una sola plaza el chip dice quién falta; con varias, cuántas faltan: "sin
            colaborador asignado" en un puesto de cinco esconde que hay cinco por contratar. */}
        {plazas > 1
          ? `${plazas} plazas por cubrir`
          : externo ? 'Sin prestador asignado' : 'Sin colaborador asignado'}
        {desglose && hayMas && (
          <span className="og-chip-flecha">
            {abierto ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </span>
        )}
      </div>
    )
  }
  /* El chip ES el control: ya está donde está la gente y no compite con el botón de plegar la
     rama, que vive en la esquina del cuadro y habla de otra cosa. */
  const propsBoton = desglose && hayMas && {
    onClick: e => { e.stopPropagation(); desglose.alternar(cargo.id) },
    onDoubleClick: e => e.stopPropagation(),
    title: abierto ? 'Ocultar quiénes lo ocupan' : 'Ver quiénes lo ocupan',
  }
  const flecha = desglose && hayMas && (
    <span className="og-chip-flecha">{abierto ? <ChevronUp size={9} /> : <ChevronDown size={9} />}</span>
  )

  /* ABIERTO, EL CHIP RESUME Y NO REPITE. Con el desglose desplegado la gente ya está dibujada
     abajo, con su cara y su nombre: dejar el chip igual mostraba a la misma persona dos veces,
     una encima de la otra. Cerrado dice quién es —que es lo que hace falta de un vistazo—;
     abierto dice cuántos son, y el detalle lo ponen las cajitas. */
  if (abierto) {
    return (
      <div className={`og-chip og-chip-resumen og-chip-btn og-chip-abierto`} {...propsBoton}>
        <span className="og-chip-plazas">
          {plazas > ocupantes.length
            ? `${ocupantes.length} de ${plazas} plazas`
            : `${ocupantes.length} ${ocupantes.length === 1 ? 'colaborador' : 'colaboradores'}`}
          {flecha}
        </span>
      </div>
    )
  }

  /* Una sola persona se lee con su nombre, que es el caso normal. Varias van como caras en
     fila: cinco nombres apilados harían crecer el cuadro justo donde hay más gente, que es
     donde menos espacio sobra. */
  if (ocupantes.length === 1) {
    const p = ocupantes[0]
    return (
      <div className={`og-chip${desglose && hayMas ? ' og-chip-btn' : ''}`} {...propsBoton}>
        <Avatar persona={p} size={16} clase="og-chip-av" />
        <span className="og-chip-name">{p.name}</span>
        {flecha}
      </div>
    )
  }

  return (
    <div
      className={`og-chip og-chip-varios${desglose && hayMas ? ' og-chip-btn' : ''}`}
      title={ocupantes.map(p => p.name).join(' · ')}
      {...propsBoton}
    >
      <span className="og-caras">
        {ocupantes.slice(0, CARAS).map(p => (
          <Avatar key={p.id} persona={p} size={16} clase="og-chip-av" />
        ))}
        {ocupantes.length > CARAS && (
          <span className="og-chip-av og-cara-mas">+{ocupantes.length - CARAS}</span>
        )}
      </span>
      {/* Con plazas declaradas la cuenta se lee contra el cupo —"3 de 5"—, que es lo que dice
          de un vistazo si el puesto está completo o falta contratar. */}
      <span className="og-chip-plazas">
        {plazas > ocupantes.length ? `${ocupantes.length} de ${plazas}` : `${ocupantes.length} personas`}
        {flecha}
      </span>
    </div>
  )
}

/* Cuántas plazas vacías se dibujan antes de resumirlas en un renglón. Menos que las personas
   a propósito: una casilla libre es un hueco, y ocho huecos apilados pesan más en el dibujo
   que lo que informan. */
const HUECOS = 4

/* LAS PLAZAS DEL CUADRO, una cajita cada una. Las llenas dicen quién está y las vacías cuántas
   faltan, así que el mismo desglose contesta "quiénes lo ocupan" y "cuánto falta cubrir".

   Ninguna es un nodo del organigrama: no tienen tipo, ni sede, ni lugar en la línea de mando
   —el nodo sigue siendo el cargo— así que se dibujan más chicas, sin etiqueta y sin color de
   tipo, para que nadie las confunda con otro puesto. */
export function Desglosadas({ ocupantes, cargo, libres = 0 }) {
  const sobran = ocupantes.length - DESGLOSE
  /* Una cajita por PLAZA y no solo por persona: las llenas dicen quién está y las vacías,
     cuántas faltan. Es la misma pregunta que contesta la etiqueta del cuadro ("2 vacantes"),
     pero contada en casillas, que es como se mira un puesto que hay que cubrir. */
  const huecos = Math.min(libres, HUECOS)
  const huecosSobran = libres - huecos
  return (
    <div className="og-personas">
      {ocupantes.slice(0, DESGLOSE).map(p => (
        <div key={p.id} className="og-persona" title={`${p.name} · ${cargo}`}>
          <Avatar persona={p} size={18} clase="og-chip-av" />
          {/* El cargo sale del CUADRO que la contiene y no del campo del directorio —es lo que
              hace `cargoDe`—: son el mismo texto mientras nadie mueva a nadie, pero en cuanto
              alguien cambia el ocupante de un puesto, el directorio se queda con el cargo viejo
              y el renglón contradiría al cuadro que lo tiene adentro.
              La sede NO va: es del PUESTO y no de la persona, así que con un cargo en tres
              sedes y cuatro ocupantes diría algo que el dato no sabe. */}
          <span className="og-persona-txt">
            <strong>{p.name}</strong>
            <em>{cargo}</em>
          </span>
        </div>
      ))}
      {sobran > 0 && (
        <div className="og-persona og-persona-mas" title="Doble clic en el cuadro para verlas a todas">
          +{sobran} {sobran === 1 ? 'persona más' : 'personas más'}
        </div>
      )}

      {Array.from({ length: huecos }, (_, i) => (
        <div key={`libre-${i}`} className="og-persona og-persona-libre" title={`Plaza sin cubrir · ${cargo}`}>
          <span className="og-persona-hueco"><UserPlus size={11} /></span>
          <span className="og-persona-txt">
            <strong>Plaza libre</strong>
            <em>{cargo}</em>
          </span>
        </div>
      ))}
      {huecosSobran > 0 && (
        <div className="og-persona og-persona-mas">
          +{huecosSobran} {huecosSobran === 1 ? 'plaza libre' : 'plazas libres'}
        </div>
      )}
    </div>
  )
}

export function TarjetaCargo({ nodo, onAbrir, plegable, acomodo, desglose, hallado }) {
  const { cargo, vacante, libres, funcional } = nodo
  /* El MISMO cargo puede tener dos cuadros: el suyo, en su área, y el de apoyo en el área donde
     ayuda. La clave del acomodo la trae el nodo para que arrastrar uno no arrastre al otro. */
  const clave = nodo.clave || cargo.id
  /* El color de la tarjeta dice el TIPO de puesto y la etiqueta dice si está VACANTE: son dos
     preguntas distintas y hasta un servicio tercerizado sin prestador es algo por cubrir, así
     que el violeta del outsourcing convive con la marca amarilla en vez de reemplazarla. */
  const externo = cargo.tipo === 'outsourcing'
  /* Tiene color propio, que NO es lo mismo que ir al costado: el outsourcing se dibuja en la
     línea como cualquier reporte y sigue siendo violeta. */
  const conColorPropio = cargo.tipo === 'staff' || externo
  const clases = ['og-card']
  /* El amarillo solo pinta lo que no tiene color propio: staff y outsourcing ya vienen
     teñidos por su tipo, y ahí lo que avisa de la vacante es la etiqueta. */
  if (vacante && !conColorPropio) clases.push('og-card-vacante')
  if (cargo.tipo === 'staff') clases.push('og-card-staff')
  if (externo) clases.push('og-card-ext')
  /* El cuadro de apoyo: mismo tamaño y misma forma que cualquier otro —se abre igual, es el
     mismo puesto— pero con su propio color, porque no pertenece al área donde está dibujado.
     Gana sobre los demás colores: lo que importa saber ahí es que viene prestado. */
  if (funcional) clases.push('og-card-func')

  /* Lo que uno movió a mano gana sobre lo que propuso el árbol. Va como transformación y no
     como posición absoluta: el cuadro conserva su lugar en la fila —nadie se recorre por
     haberlo movido— y volver al acomodo automático es borrar el corrimiento. */
  const corrido = acomodo?.corrimiento(clave)
  if (corrido) clases.push('og-card-corrido')
  if (acomodo?.enMano === clave) clases.push('og-card-arrastrando')
  if (hallado === cargo.id) clases.push('og-card-hallado')
  /* La misma condición que abre el chip: si no hay nada más que ver, un estado abierto que
     quedó guardado de antes no tiene que dibujar una cajita repetida. Ya no exige que haya
     gente: un puesto vacante de cuatro plazas despliega sus cuatro casillas. */
  const abierto = desglose?.abiertos.has(cargo.id) && hayQueDesplegar(nodo)

  /* El corrimiento se aplica a la COLUMNA y no al cuadro: al acomodarlo a mano, las personas
     colgadas tienen que irse con él o quedarían flotando sobre el lugar que dejó. */
  return (
    <div className="og-card-col" style={corrido ? { transform: `translate(${corrido.dx}px, ${corrido.dy}px)` } : undefined}>
    <div
      className={clases.join(' ')}
      title={acomodo ? 'Doble clic para ver el detalle · arrastra para acomodarlo' : 'Doble clic para ver el detalle'}
      data-no-pan={acomodo ? '' : undefined}
      data-clave={acomodo ? clave : undefined}
      /* Para que el buscador lo encuentre. Va siempre, aunque no haya acomodo: 
         solo existe cuando el cuadro se puede arrastrar. */
      data-cargo={cargo.id}
      onPointerDown={acomodo ? e => acomodo.tomar(clave, false, e) : undefined}
      onDoubleClick={() => onAbrir?.(nodo)}
    >
      {cargo.destacado && <Star size={11} className="og-card-star" />}
      {/* La etiqueta cuenta las plazas por cubrir, no si el puesto está vacío: un cuadro con
          tres de cinco ocupadas tiene dos vacantes que hoy no se veían en ninguna parte. */}
      {libres > 0 && <span className="og-card-tag">{rotuloVacantes(libres)}</span>}
      <div className="og-card-title">
        {externo
          ? <Briefcase size={11} className="og-card-ico" />
          : <User size={11} className="og-card-ico" />}
        <span>{cargo.nombre}</span>
      </div>
      {/* De dónde viene. Sin esto el cuadro de apoyo se lee como un puesto del área: el color
          avisa que es distinto, pero no dice de qué área es. */}
      {funcional && nodo.deArea && (
        <div className="og-card-de">Funcional · de {nodo.deArea}</div>
      )}
      <Ocupante nodo={nodo} externo={externo} desglose={desglose} />
      {plegable}
    </div>
    {abierto && <Desglosadas ocupantes={nodo.ocupantes} cargo={cargo.nombre} libres={nodo.libres} />}
    </div>
  )
}

function Nodo({ nodo, onAbrir, onAbrirUnidad, plegable, acomodo, desglose, hallado }) {
  if (nodo.tipo === 'empresa') {
    return <div className="og-empresa">{nodo.empresa.nombre}{plegable}</div>
  }
  if (nodo.tipo === 'unidad') {
    /* La píldora se agarra igual que un cuadro, pero lo que se mueve es su RAMA entera: un
       rótulo movido solo se despega de los cargos que encabeza. Por eso el corrimiento se
       aplica al `li` (ver `Rama`) y acá solo se toma el gesto. */
    const clave = `u:${nodo.unidad.id}`
    return (
      <div
        className={`og-unidad${acomodo?.enMano === clave ? ' og-unidad-arrastrando' : ''}${onAbrirUnidad ? ' og-unidad-abrible' : ''}`}
        data-no-pan={acomodo ? '' : undefined}
        title={onAbrirUnidad
          ? (acomodo ? 'Doble clic para editar el área · arrastra para acomodarla' : 'Doble clic para editar el área')
          : undefined}
        onPointerDown={acomodo ? e => acomodo.tomar(clave, true, e) : undefined}
        onDoubleClick={() => onAbrirUnidad?.(nodo.unidad)}
      >
        <span className="og-unidad-nom">{nodo.unidad.nombre}</span>
        {plegable}
      </div>
    )
  }
  return <TarjetaCargo nodo={nodo} onAbrir={onAbrir} plegable={plegable} acomodo={acomodo} desglose={desglose} hallado={hallado} />
}

/* Cuántos cargos se esconden al plegar. Se cuenta lo que hay ABAJO —la rama entera, con los
   laterales de cada escalón— porque es lo que deja de verse; los laterales del propio nodo
   siguen a la vista, que están a su costado y no debajo. */
function contarCargos(nodos) {
  /* Los apoyos funcionales NO se cuentan: son el mismo puesto dibujado dos veces, así que
     sumarlos diría que se esconden más cargos de los que existen. */
  return nodos.reduce((total, n) => total
    + (n.tipo === 'cargo' ? 1 : 0)
    + (n.staff?.filter(s => !s.funcional).length || 0)
    + contarCargos(n.hijos || []), 0)
}

function BotonPlegar({ nodo, ocultos, pliegue }) {
  const plegado = pliegue.plegados.has(nodo.id)
  return (
    <button
      className={`og-plegar${plegado ? ' on' : ''}`}
      onClick={e => { e.stopPropagation(); pliegue.alternar(nodo.id) }}
      onDoubleClick={e => e.stopPropagation()}
      title={plegado
        ? `Mostrar los ${ocultos} cargos que cuelgan de aquí`
        : `Plegar: esconde ${ocultos} ${ocultos === 1 ? 'cargo' : 'cargos'}`}
    >
      {/* El número solo cuando está plegado. Con la rama a la vista los cargos se cuentan
          mirando; escondida, es lo único que dice qué se dejó de ver. */}
      {plegado && ocultos}
      {plegado ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
    </button>
  )
}

export function Rama({ nodo, onAbrir, onAbrirUnidad, pliegue, acomodo, desglose, hallado }) {
  const hijos = nodo.hijos || []
  const laterales = nodo.staff || []

  /* Los laterales se reparten a los dos costados en vez de apilarse en una columna. Apilados,
     un jefe con dos puestos de apoyo estiraba su fila hacia abajo y empujaba a todos sus
     reportes con ella. A los costados no crece nada —la izquierda ya estaba reservada como
     hueco espejo— y la altura se parte por dos. El primero se queda a la derecha, que es donde
     estuvo siempre: quien tiene un solo staff no ve moverse nada. */
  const derecha = laterales.filter((_, i) => i % 2 === 0)
  const izquierda = laterales.filter((_, i) => i % 2 === 1)

  const bloque = (lista, lado) => (
    <div className={`og-staff og-staff-${lado}`}>
      {lista.map(s => <TarjetaCargo key={s.id} nodo={s} onAbrir={onAbrir} acomodo={acomodo} desglose={desglose} hallado={hallado} />)}
    </div>
  )

  const ocultos = pliegue ? contarCargos(hijos) : 0
  const plegado = pliegue?.plegados.has(nodo.id)

  /* El corrimiento de una unidad se aplica al `li` entero y no a la píldora: lo que se acomoda
     es el bloque —el rótulo con los cargos que encabeza—. Los cargos de adentro conservan
     además su corrimiento propio, que pasa a ser relativo al del grupo. */
  const rama = nodo.tipo === 'unidad' ? acomodo?.corrimiento(`u:${nodo.unidad.id}`) : null

  return (
    <li style={rama ? { transform: `translate(${rama.dx}px, ${rama.dy}px)` } : undefined}>
      <div className="og-nodo">
        {/* Con un solo lateral la izquierda queda vacía, pero el hueco se dibuja igual: sin él
            la tarjeta se corre y deja de caer sobre el conector que baja hacia sus hijos. */}
        {izquierda.length > 0
          ? bloque(izquierda, 'izq')
          : laterales.length > 0 && <div className="og-lateral-hueco" aria-hidden="true" />}
        <Nodo
          nodo={nodo}
          onAbrir={onAbrir}
          onAbrirUnidad={onAbrirUnidad}
          acomodo={acomodo}
          desglose={desglose}
          hallado={hallado}
          plegable={ocultos > 0 && <BotonPlegar nodo={nodo} ocultos={ocultos} pliegue={pliegue} />}
        />
        {derecha.length > 0 && bloque(derecha, 'der')}
      </div>
      {hijos.length > 0 && !plegado && (
        <ul>
          {hijos.map(h => <Rama key={h.id} nodo={h} onAbrir={onAbrir} onAbrirUnidad={onAbrirUnidad} pliegue={pliegue} acomodo={acomodo} desglose={desglose} hallado={hallado} />)}
        </ul>
      )}
    </li>
  )
}
