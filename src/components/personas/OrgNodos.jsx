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

export function TarjetaCargo({ nodo, onAbrir, plegable, acomodo, desglose, hallado, crear, atenuado, condenado, escalon = 0 }) {
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
  /* CONDENADO: los cuadros que se lleva la rama que se está por borrar, pintados mientras la
     confirmación está abierta. El diálogo es más chico que el lienzo, así que la rama roja se ve
     alrededor: se ve QUÉ se va antes de escribir la palabra, en vez de tener que confiar en un
     número. */
  if (condenado?.(cargo)) clases.push('og-card-condenada')
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

function Nodo({ nodo, onAbrir, onAbrirUnidad, plegable, acomodo, desglose, hallado, crear, atenuado, condenado, escalon = 0 }) {
  /* EL RÓTULO VA SOLO ACÁ. Un nombre propio no dice de qué clase es lo que nombra: "SoulyHR"
     podía leerse igual como un área llamada así, porque esta caja y la píldora de un área son
     las dos un rectángulo redondeado, oscuro, con texto blanco centrado —de hecho comparten
     color: la píldora es este mismo tono aclarado un 24 %—. Al zoom con el que se mira un
     organigrama entero, eso no alcanza para distinguirlos.

     Repetirlo en cada píldora sería ruido: lo que se repite en todos los hermanos no distingue
     a ninguno. Acá no hay hermanos: la caja de la organización es una sola en todo el dibujo,
     así que el rótulo se paga una vez y desambigua las dos cosas a la vez. */
  if (nodo.tipo === 'empresa') {
    return (
      <div className="og-empresa">
        <span className="og-empresa-rot">Organización</span>
        {nodo.empresa.nombre}
        {plegable}
      </div>
    )
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
  return <TarjetaCargo nodo={nodo} onAbrir={onAbrir} plegable={plegable} acomodo={acomodo} desglose={desglose} hallado={hallado} crear={crear} atenuado={atenuado} condenado={condenado} escalon={escalon} />
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

   UN CUADRO, NO MEDIO. Empezó en 32 px —medio cuadro— por miedo a que separados del todo se
   leyeran como dos niveles: sin tocarse de costado, el ojo completa la línea que falta y parece
   que el de abajo le reporta al de arriba. Puesto en pantalla, el miedo pesaba menos que el
   problema real: a 32 px la diferencia no se ve, y un escalón que no se nota no dice nada.

   Y lo que despeja el miedo es la línea, que no está: los dos bajan de la MISMA barra del mismo
   jefe, solo que el de menor rango baja con un tramo más largo. Entre ellos no hay ni un trazo,
   y eso es lo que dice que son hermanos y no uno el jefe del otro. */
const PASO_ESCALON = 72

/* El nivel más ALTO de una fila de hermanos. Ya solo lo usan las cabezas sin jefe, que se miden
   entre ellas porque no tienen contra quién más medirse. */
const techoDe = hermanos => {
  const ordenes = hermanos.map(n => n.grado?.orden).filter(Boolean)
  return ordenes.length ? Math.min(...ordenes) : 0
}

export function Rama({ nodo, onAbrir, onAbrirUnidad, pliegue, acomodo, desglose, hallado, crear, atenuado, condenado, nivelJefe = 0, techo = 0 }) {
  const hijos = nodo.hijos || []
  const laterales = nodo.staff || []
  /* EL ESCALÓN MIDE CONTRA EL JEFE, no contra los hermanos de la fila. La pregunta que contesta
     es "¿cuántos rangos hay entre mi jefe y yo?": un reporte directo un nivel por debajo queda a
     ras, dos niveles por debajo baja un escalón, y así.

     Antes se medía contra el hermano más alto de la misma fila, y eso se caía justo cuando la
     fila tiene un solo cuadro: el más alto de la fila era uno mismo, la resta daba cero y no
     bajaba nada. Con un ejecutivo de mando bajo colgando de un líder y un pasante de nivel
     asistente colgando de otro líder del mismo rango, los dos se dibujaban a la misma altura
     aunque uno pese un rango menos que el otro. Medir contra el jefe funciona con un hijo o con
     seis, y no acumula huecos hacia abajo como lo haría medir contra el catálogo entero.

     CON RESPALDO EN LOS HERMANOS, y hace falta: si el jefe no declaró su nivel no hay contra qué
     medir, y medir contra nada dejaba a TODOS sus hijos a ras —un líder de mando bajo y un
     pasante de nivel asistente colgando del mismo jefe sin nivel se dibujaban idénticos, como
     pares—. Cuando el jefe no dice nada, se vuelve a comparar contra el hermano más alto de la
     fila, que es lo que hacía la regla anterior y sigue siendo cierto ahí.

     Así que la referencia es una sola cosa con dos orígenes: el peldaño inmediatamente por
     debajo del jefe si el jefe tiene nivel, y si no, el peldaño más alto que haya en la fila.

     Sin nivel declarado el cuadro no se mueve de su sitio: lo que no se dijo no es "el más
     alto", es que todavía no se dijo. */
  const referencia = nivelJefe ? nivelJefe + 1 : techo
  const escalon = referencia && nodo.grado
    ? Math.max(0, nodo.grado.orden - referencia) * PASO_ESCALON
    : 0
  /* Lo que heredan los hijos. Las píldoras de área y la caja de la empresa no son mando: pasan
     de largo el nivel que recibieron, porque entre un jefe y su reporte de otra área hay
     píldoras en el medio y ninguna cambia quién manda a quién. */
  const nivelParaHijos = nodo.tipo === 'cargo' ? (nodo.grado?.orden ?? 0) : nivelJefe

  /* UNA FILA, UNA CLASE. Un jefe puede tener colgando dos cosas que no se comparan: puestos de
     su propia área y áreas enteras. Puestas en el mismo renglón se leen como iguales —crear
     "Recursos Humanos" bajo el Gerente General la dibujaba de par del CTO—, así que los cargos
     se quedan en su fila y las áreas bajan a una propia.

     Se decide acá y no al armar el árbol a propósito: es dónde se dibuja cada cuadro, no de
     quién depende. El dato no cambia, y por eso el mismo reparto arregla los dos caminos por
     los que un área llega a esta fila —la que ya tiene puestos y la que todavía no—.

     Solo se reparte cuando hay de las dos: un jefe que solo manda áreas —el caso corriente— se
     dibuja exactamente como antes. */
  const cargosHijos = hijos.filter(h => h.tipo !== 'unidad')
  const areasHijas = hijos.filter(h => h.tipo === 'unidad')
  const partido = cargosHijos.length > 0 && areasHijas.length > 0
  /* El techo de cada renglón, que es el respaldo cuando el jefe no declaró nivel. Se mide por
     renglón y no entre los dos: partida la fila, cada uno tiene sus propios hermanos. */
  const techoCargos = partido ? techoDe(cargosHijos) : techoDe(hijos)
  /* EL CANAL. La fila de cargos se abre al medio y por ahí sigue bajando la línea del jefe hacia
     las áreas: dos cuadros quedan uno a cada lado, cuatro quedan dos y dos, tres quedan dos y
     uno. Se probó la alternativa —dejar la fila entera centrada y hacer que la línea rodeara por
     un carril lateral— y se ve peor: la línea queda por fuera del dibujo, lejos de todo, en vez
     de seguir bajando por donde uno la busca. */
  const corte = Math.ceil(cargosHijos.length / 2)

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
      atenuado={atenuado} condenado={condenado}
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
  /* CADA LATERAL ES UNA RAMA, no una tarjeta suelta. Antes era `TarjetaCargo` a secas y por eso
     lo que colgaba de un staff no se dibujaba en ninguna parte. Ahora el carril lleva un árbol
     como cualquier otro, así que un asistente con su propio auxiliar se ve completo. */
  const bloque = (lista, lado) => (
    <div className={`og-staff og-staff-${lado}`}>
      {lista.map(s => <ul className="og-lat-rama" key={s.id}>{sub(s)}</ul>)}
    </div>
  )

  /* Una rama hija, con el nivel de mando de quien la manda: es contra ese nivel que va a medir
     su escalón, esté sola en la fila o acompañada. */
  const sub = (h, techoFila = 0) => (
    <Rama
      key={h.id}
      nodo={h}
      onAbrir={onAbrir}
      onAbrirUnidad={onAbrirUnidad}
      pliegue={pliegue}
      acomodo={acomodo}
      desglose={desglose}
      hallado={hallado}
      crear={crear}
      atenuado={atenuado} condenado={condenado}
      nivelJefe={nivelParaHijos}
      techo={techoFila}
    />
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
            atenuado={atenuado} condenado={condenado}
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
      {hijos.length > 0 && !plegado && (partido
        ? (
          <>
            {/* Dos listas y no una partida por dentro: cada mitad sigue siendo un `ul` con sus
                `li`, que es lo que el trazado de líneas recorre para saber quién cuelga de quién
                —desde un `li` de adentro, el `li` padre sigue siendo el de siempre—. */}
            <div className="og-fila-cargos">
              <ul className="og-lado og-lado-izq">{cargosHijos.slice(0, corte).map(h => sub(h, techoCargos))}</ul>
              <ul className="og-lado og-lado-der">{cargosHijos.slice(corte).map(h => sub(h, techoCargos))}</ul>
            </div>
            {/* Las áreas no llevan escalón: el nivel de mando es del puesto, no del área. */}
            <ul className="og-fila-areas">{areasHijas.map(h => sub(h))}</ul>
          </>
        )
        : <ul>{hijos.map(h => sub(h, techoCargos))}</ul>
      )}
    </li>
  )
}
