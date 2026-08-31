import { User, Star, Briefcase, ChevronUp, ChevronDown } from 'lucide-react'
import Avatar from './Avatar'
import { MasEnNodo } from './MenuCrear'

/* El dibujo del árbol: la tarjeta de un cargo, la píldora de una unidad y la rama que las
   cuelga. Se mira y se abre con doble clic; la estructura se cambia en el formulario.

   `acomodo` es lo único interactivo que queda: mueve el cuadro de LUGAR sin tocar ningún dato.
   Sin él —la vista de solo lectura— las piezas son puro dibujo. */

/* Cuántas caras entran en una tarjeta de 200 px antes de convertirse en una fila de puntos.
   El resto se cuenta; la lista completa está en la ficha. */
const CARAS = 3

/* CUÁNDO EL CUADRO SE PUEDE DESPLEGAR. Vive fuera del componente porque la usan dos: el chip,
   para saber si es un botón, y la tarjeta, para saber si dibuja la cajita de abajo.

   Se abre cuando hay alguien: abajo aparece su cajita. Un puesto vacante no se abre —la cajita
   repetiría palabra por palabra lo que el chip ya dice—.

   OJO CON LA FLECHITA. Se probó cortar el despliegue cuando había una sola persona, porque la
   flecha al lado del nombre hacía parecer que había gente escondida; el usuario avisó que así
   se perdía la cajita de esa persona. La flecha no era el problema: era que estuviera visible
   EN REPOSO. Ahora aparece al pasar el mouse —y se queda mientras está abierto—, así que el
   cuadro quieto se lee limpio y sigue pudiéndose abrir. */
export const hayQueDesplegar = ({ ocupantes }) => ocupantes.length > 0

function Ocupante({ nodo, externo, desglose }) {
  const { ocupantes, cargo } = nodo
  const hayMas = hayQueDesplegar(nodo)
  const abierto = desglose?.abiertos.has(cargo.id)

  if (!ocupantes.length) {
    return (
      <div className="og-chip og-chip-vacio">
        {externo ? 'Sin prestador asignado' : 'Sin colaborador asignado'}
      </div>
    )
  }

  /* El chip ES el control: ya está donde está la gente y no compite con el botón de plegar la
     rama, que vive en la esquina del cuadro y habla de otra cosa. */
  const propsBoton = desglose && hayMas && {
    onClick: e => { e.stopPropagation(); desglose.alternar(cargo.id) },
    onDoubleClick: e => e.stopPropagation(),
    title: abierto ? 'Ocultar quién lo ocupa' : 'Ver quién lo ocupa',
  }
  const p = ocupantes[0]
  return (
    <div className={`og-chip${desglose && hayMas ? ' og-chip-btn' : ''}${abierto ? ' og-chip-abierto' : ''}`} {...propsBoton}>
      <Avatar persona={p} size={16} clase="og-chip-av" />
      <span className="og-chip-name">{p.name}</span>
      {desglose && hayMas && (
        <span className="og-chip-flecha">{abierto ? <ChevronUp size={9} /> : <ChevronDown size={9} />}</span>
      )}
    </div>
  )
}

/* LA CAJITA DE QUIEN OCUPA EL PUESTO, colgando del cuadro. No es un nodo del organigrama —no
   tiene tipo, ni sede, ni lugar en la línea de mando; el nodo es el cargo— así que se dibuja más
   chica, sin etiqueta y sin color de tipo, para que nadie la confunda con otro puesto.

   Se mantuvo aunque el chip de arriba ya diga el nombre: el usuario la pidió y la defendió
   cuando se probó sacarla. */
export function Desglosadas({ ocupantes, cargo }) {
  if (!ocupantes.length) return null
  return (
    <div className="og-personas">
      {ocupantes.map(p => (
        <div key={p.id} className="og-persona" title={`${p.name} · ${cargo}`}>
          <Avatar persona={p} size={18} clase="og-chip-av" />
          {/* El cargo sale del CUADRO que la contiene y no del campo del directorio —es lo que
              hace `cargoDe`—: son el mismo texto mientras nadie mueva a nadie, pero en cuanto
              alguien cambia el ocupante de un puesto, el directorio se queda con el cargo viejo
              y el renglón contradiría al cuadro que lo tiene adentro. */}
          <span className="og-persona-txt">
            <strong>{p.name}</strong>
            <em>{cargo}</em>
          </span>
        </div>
      ))}
    </div>
  )
}

export function TarjetaCargo({ nodo, onAbrir, plegable, acomodo, desglose, hallado, crear, atenuado, escalon = 0 }) {
  const { cargo, vacante, funcional } = nodo
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
  /* FILTRADO POR TIPO O ESTADO: el cuadro se apaga, no se va. Sacarlo dejaría a sus
     subordinados colgando de la nada y partiría la línea de mando, que es lo que uno vino a
     mirar. Apagado sigue estando —se ve dónde encaja lo que sí coincide— y sigue abriéndose. */
  if (atenuado?.(cargo)) clases.push('og-card-apagada')
  /* La misma condición que abre el chip: un estado abierto que quedó guardado de antes no
     tiene que dibujar una cajita de nadie. */
  const abierto = desglose?.abiertos.has(cargo.id) && hayQueDesplegar(nodo)

  /* El corrimiento se aplica a la COLUMNA y no al cuadro: al acomodarlo a mano, las personas
     colgadas tienen que irse con él o quedarían flotando sobre el lugar que dejó. */
  return (
    <div className="og-card-col" style={(corrido || escalon) ? {
      ...(corrido ? { transform: `translate(${corrido.dx}px, ${corrido.dy}px)` } : null),
      /* El escalón de la fila de cabeza va en la COLUMNA del cuadro y no en el `li`: acá lo
         que baja es solo esta tarjeta, porque su rama —si la tiene— cuelga del nodo entero. */
      ...(escalon ? { marginTop: escalon } : null),
    } : undefined}>
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
      {vacante && <span className="og-card-tag">Vacante</span>}
      {/* SIN INSIGNIA DE NIVEL EN EL CUADRO. Se dibujó y se sacó: en el dibujo el nivel ya lo
          dice el ESCALÓN —el que pesa menos está medio cuadro más abajo— y un rótulo repetido en
          los treinta cuadros agrega un renglón a una tarjeta de 176 px para contar lo que la
          posición ya contó. El nombre del nivel vive donde se compara y se filtra, que es la
          tabla, y donde se declara, que es el formulario. */}
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
      {/* El cuadro de apoyo no lleva "+": es el MISMO puesto dibujado prestado en otra área,
          así que colgarle algo desde aquí dejaría al hijo en un área donde el padre solo está
          de visita. Se crea desde su cuadro propio, el del área a la que pertenece. */}
      {crear && !funcional && (
        <MasEnNodo
          titulo="Agregar bajo este cargo"
          rotulo={`Agregar algo bajo ${cargo.nombre}`}
          opciones={() => crear.deCargo(cargo)}
        />
      )}
      {plegable}
    </div>
    {abierto && <Desglosadas ocupantes={nodo.ocupantes} cargo={cargo.nombre} />}
    </div>
  )
}

function Nodo({ nodo, onAbrir, onAbrirUnidad, plegable, acomodo, desglose, hallado, crear, atenuado, escalon = 0 }) {
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
        {crear && (
          <MasEnNodo
            titulo="Agregar en esta área"
            rotulo={`Agregar algo en ${nodo.unidad.nombre}`}
            opciones={() => crear.deUnidad(nodo.unidad)}
          />
        )}
        {plegable}
      </div>
    )
  }
  return <TarjetaCargo nodo={nodo} onAbrir={onAbrir} plegable={plegable} acomodo={acomodo} desglose={desglose} hallado={hallado} crear={crear} atenuado={atenuado} escalon={escalon} />
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

/* EL ESCALÓN: medio cuadro, 32 px. Es lo que dice que dos puestos de la misma fila no pesan
   igual, y es la ÚNICA forma de decirlo cuando entre ellos no hay línea —tres cabezas sin jefe
   se dibujan idénticas, porque no hay reporte del cual colgar la diferencia—.

   Medio cuadro y no una fila entera: a 96 px los cuadros dejan de tocarse de costado y el ojo
   completa la línea que falta, o sea que se lee "el de abajo le reporta al de arriba", que es
   justo lo contrario de lo que pasa. A 32 se siguen solapando y se leen como una fila. */
const PASO_ESCALON = 32

/* El nivel más ALTO de una fila de hermanos, que es la referencia contra la cual bajan los
   demás. Se mide por fila y no contra el catálogo entero: una fila de puros mandos bajos se
   dibuja pareja, sin quedar hundida contra un techo que en ese lugar del dibujo no está. */
const techoDe = hermanos => {
  const ordenes = hermanos.map(n => n.grado?.orden).filter(Boolean)
  return ordenes.length ? Math.min(...ordenes) : 0
}

export function Rama({ nodo, onAbrir, onAbrirUnidad, pliegue, acomodo, desglose, hallado, crear, atenuado, techo = 0 }) {
  const hijos = nodo.hijos || []
  const laterales = nodo.staff || []
  /* Sin nivel declarado no se mueve de su sitio. Declarar el de UNO no puede correr a los otros
     seis: lo que no se dijo no es "el más alto", es que todavía no se dijo. */
  const escalon = techo && nodo.grado ? (nodo.grado.orden - techo) * PASO_ESCALON : 0
  const techoHijos = techoDe(hijos)

  /* Las otras cabezas van a los dos costados por la misma razón que los laterales: apiladas de
     un solo lado corren el cuadro y lo despegan del conector que baja hacia sus hijos. */
  const pares = nodo.pares || []
  const cabeza = pares.length > 0
  const paresIzq = pares.filter((_, i) => i % 2 === 1)
  const paresDer = pares.filter((_, i) => i % 2 === 0)
  /* El techo de la fila de cabeza se mide entre las cabezas y nada más: son la fila. */
  const techoCabeza = cabeza ? techoDe([nodo, ...pares]) : 0
  const escalonCabeza = n => (techoCabeza && n.grado ? (n.grado.orden - techoCabeza) * PASO_ESCALON : 0)
  const cardPar = par => (
    <TarjetaCargo
      key={par.id}
      nodo={par}
      onAbrir={onAbrir}
      acomodo={acomodo}
      desglose={desglose}
      hallado={hallado}
      atenuado={atenuado}
      crear={crear}
      escalon={escalonCabeza(par)}
    />
  )

  /* Los laterales se reparten a los dos costados en vez de apilarse en una columna. Apilados,
     un jefe con dos puestos de apoyo estiraba su fila hacia abajo y empujaba a todos sus
     reportes con ella. A los costados no crece nada —la izquierda ya estaba reservada como
     hueco espejo— y la altura se parte por dos. El primero se queda a la derecha, que es donde
     estuvo siempre: quien tiene un solo staff no ve moverse nada. */
  const derecha = laterales.filter((_, i) => i % 2 === 0)
  const izquierda = laterales.filter((_, i) => i % 2 === 1)

  /* SIN "+" EN LOS LATERALES. De un puesto de staff no cuelga nada: `nodoCargo` los arma con
     `nodoSuelto`, que no trae `hijos`, así que un cargo que le reportara se guardaría bien y
     no aparecería en el dibujo nunca. Un botón que ofrece eso miente. */
  const bloque = (lista, lado) => (
    <div className={`og-staff og-staff-${lado}`}>
      {lista.map(s => <TarjetaCargo key={s.id} nodo={s} onAbrir={onAbrir} acomodo={acomodo} desglose={desglose} hallado={hallado} atenuado={atenuado} />)}
    </div>
  )

  const ocultos = pliegue ? contarCargos(hijos) : 0
  const plegado = pliegue?.plegados.has(nodo.id)

  /* El corrimiento de una unidad se aplica al `li` entero y no a la píldora: lo que se acomoda
     es el bloque —el rótulo con los cargos que encabeza—. Los cargos de adentro conservan
     además su corrimiento propio, que pasa a ser relativo al del grupo. */
  const rama = nodo.tipo === 'unidad' ? acomodo?.corrimiento(`u:${nodo.unidad.id}`) : null

  /* El escalón va en el `li` y no en la tarjeta: baja el cuadro CON su rama, que si no el jefe
     se separaría de sus reportes. Y va como margen y no como `transform` —al revés que el
     acomodo a mano— porque este sí tiene que ocupar lugar: es parte del acomodo automático. */
  const estilo = (rama || escalon)
    ? {
      ...(rama ? { transform: `translate(${rama.dx}px, ${rama.dy}px)` } : null),
      ...(escalon ? { marginTop: escalon } : null),
    }
    : undefined

  return (
    <li style={estilo}>
      <div className="og-nodo">
        <div className="og-nodo-fila">
          {/* LAS OTRAS CABEZAS, flanqueando a esta. No son sus reportes —de hecho no le reportan
              a nadie— y por eso no se les dibuja ni una línea desde este cuadro: cuelgan de la
              misma píldora que él. Están acá adentro solo para quedar cerca, que es lo único que
              hace legible el escalón. Se reparten a los dos lados como los laterales, y el lado
              vacío se rellena para que este cuadro siga cayendo en el centro de su rama. */}
          {cabeza && (paresIzq.length > 0
            ? <div className="og-pares og-pares-izq">{paresIzq.map(cardPar)}</div>
            : <div className="og-lateral-hueco" aria-hidden="true" />)}
          <Nodo
            nodo={nodo}
            onAbrir={onAbrir}
            onAbrirUnidad={onAbrirUnidad}
            acomodo={acomodo}
            desglose={desglose}
            hallado={hallado}
            crear={crear}
            atenuado={atenuado}
            escalon={cabeza ? escalonCabeza(nodo) : 0}
            plegable={ocultos > 0 && <BotonPlegar nodo={nodo} ocultos={ocultos} pliegue={pliegue} />}
          />
          {cabeza && (paresDer.length > 0
            ? <div className="og-pares og-pares-der">{paresDer.map(cardPar)}</div>
            : <div className="og-lateral-hueco" aria-hidden="true" />)}
        </div>
        {/* LOS LATERALES VAN DEBAJO DEL CUADRO, no a su costado. Antes salían de la pared de la
            tarjeta del jefe y a su misma altura; ahora cuelgan del tramo que baja del jefe hacia
            sus reportes, que es de donde de verdad dependen. Es también lo que la previa del
            modal viene dibujando desde siempre, así que los dos dibujos por fin coinciden.

            Los dos lados se dibujan aunque uno esté vacío: el centro de esta fila es lo que
            marca por dónde baja la línea, y con un solo bloque se correría a un costado. */}
        {laterales.length > 0 && (
          <div className="og-nodo-lat">
            {izquierda.length > 0 ? bloque(izquierda, 'izq') : <div className="og-lateral-hueco" aria-hidden="true" />}
            {derecha.length > 0 ? bloque(derecha, 'der') : <div className="og-lateral-hueco" aria-hidden="true" />}
          </div>
        )}
      </div>
      {hijos.length > 0 && !plegado && (
        <ul>
          {hijos.map(h => <Rama key={h.id} nodo={h} onAbrir={onAbrir} onAbrirUnidad={onAbrirUnidad} pliegue={pliegue} acomodo={acomodo} desglose={desglose} hallado={hallado} crear={crear} atenuado={atenuado} techo={techoHijos} />)}
        </ul>
      )}
    </li>
  )
}
