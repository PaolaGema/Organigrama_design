
import { ESTADOS_SUCURSAL, TIPOS_CARGO, getPersona, ocupanteDe, cabezaDe } from './organigramaData'
import { NOMBRES_PAISES, departamentosDe, ciudadesDeDepartamento } from './paisesData'

/* LA ESTRUCTURA COMO UN SOLO ÁRBOL. Prueba de concepto.
   Hoy la organización vive partida en dos listas que no se conocen: `sucursales` —plana, sin
   jerarquía— y `unidades` —un árbol de áreas—. Un cargo apunta a las dos por separado. Eso
   alcanza para una empresa de una ciudad y se queda corto en cuanto aparecen la unidad de
   negocio, la región o el centro de trabajo, porque no hay dónde colgarlos.

   Esto es la propuesta hecha pantalla, PARA MIRARLA, no para reemplazar nada todavía: vive en su
   propia llave de `localStorage` y no escribe una sola línea en los datos de verdad. Se puede
   romper a gusto; Sucursales, Áreas y el organigrama siguen intactos al lado.

   LA IDEA ENTERA SON DOS CAMPOS Y UNA REGLA. Cada nodo declara qué `tipo` es y de qué `padreId`
   cuelga, y la única validación es que el orden del padre sea menor que el del hijo. De esa
   regla salen gratis tres cosas: no se puede meter una región dentro de un área, saltarse
   niveles es legal —Cochabamba no tiene oficina y no pasa nada—, y el menú de "Agregar" se
   deduce en vez de escribirse a mano. */

/* EL CATÁLOGO CON EL QUE ARRANCA UNA EMPRESA, QUE NO ES LA LISTA DE PELDAÑOS DE NADIE.
   Esto era `TIPOS_NODO`: ocho escalones escritos por nosotros, iguales para todos, que cada
   empresa solo podía encender o apagar. Alcanza mientras la empresa se parezca a la que
   imaginamos, y se rompe con la primera que no: un colegio no tiene «sucursales» sino sedes, un
   banco tiene agencias, un hospital servicios, una constructora obras y una minera faenas.
   Apagar el nivel y meter las sedes dentro de «Sucursal» funciona —el árbol no se entera— pero
   deja la pantalla mintiendo en cada formulario, cada filtro y cada menú.

   Así que la lista de peldaños pasó a ser UN DATO DE LA EMPRESA, guardado junto a sus nodos: se
   renombra, se reordena y se le agregan peldaños propios. Esto de acá es solo con qué nace, y el
   sitio donde viven los que no se pueden borrar.

   NO SE GUARDA NINGÚN `orden`: el orden es la POSICIÓN en la lista de la empresa. Por eso
   insertar «Distrito» entre región y sucursal renumera todo solo y no migra ni un dato, que era
   la promesa del modelo desde el principio y ahora se puede cumplir de verdad.

   `fijo` marca los que no se apagan ni se borran —sin empresa, área y cargo no hay organigrama
   que dibujar—, pero SÍ se renombran: un colegio que le dice «Departamento» a sus áreas no está
   pidiendo un nivel nuevo, está pidiendo su palabra.

   `eje` dice por cuál de las dos puertas se administra el peldaño. Antes lo decía la lista de
   tipos escrita a mano en cada eje; puesto en el peldaño, un nivel propio también puede decir
   dónde vive, y eso es lo que hace que aparezca en su pantalla sin tocar una línea de código. */
export const TIPOS_BASE = [
  { key: 'empresa',  label: 'Empresa',            plural: 'Empresa',      fijo: true, eje: null,
    desc: 'La raíz del árbol: de ella cuelga todo lo demás. Se define en Datos de la empresa.' },
  { key: 'region',   label: 'Región',             plural: 'Regionales',   eje: 'fisica',
    desc: 'Una agrupación geográfica de sucursales. Sirve para filtrar y consolidar información —las ventas de todo el oriente— y no para mandar: nadie le reporta a una región.' },
  { key: 'sucursal', label: 'Sucursal',           plural: 'Sucursales',   eje: 'fisica',
    desc: 'Una sede desde la que opera la empresa: una dirección física con su gente. Debajo van sus centros de trabajo.' },
  /* CENTRO DE TRABAJO Y NO «OFICINA». El nombre viejo era «Oficina o centro», y un nombre con
     «o» en el medio es un nombre que no se pudo decidir. La descripción ya decía lo que este
     peldaño es de verdad —donde se marca asistencia— y eso no es una oficina: es una oficina, un
     almacén, una planta, una tienda o una obra. La prueba está en nuestros propios datos de
     ejemplo, donde los nodos de este nivel salen de una lista llamada DEPOSITOS.

     El nombre que viene de fábrica tiene que ser el que ABARCA a todos, porque de ahí cada
     empresa lo estrecha al suyo: quien tiene almacenes lo renombra «Almacén» y quien tiene
     oficinas lo renombra «Oficina». Al revés no funciona —arrancar en «Oficina» obliga a
     descubrir que se puede renombrar para dejar de leer una palabra equivocada—. */
  { key: 'centro',   label: 'Centro de trabajo', plural: 'Centros de trabajo', eje: 'fisica',
    desc: 'El sitio concreto donde se trabaja y se marca asistencia: una oficina, un almacén, una planta. Normalmente vive dentro de una sucursal, pero puede colgar de una regional o directo de la empresa.' },
  /* UN SOLO PELDAÑO PARA LA ESTRUCTURA INTERNA, Y LA PALABRA COMO DATO.
     Eran dos —«Área» y «Subárea o depto.»— y esa partición no describe ninguna empresa: nadie
     tiene áreas y subáreas, tiene una Dirección Comercial con una Gerencia de Ventas dentro y un
     equipo de Preventa dentro de esa. Son la misma clase de cosa a distinta profundidad, y la
     profundidad ya la dice de quién cuelga: no hace falta un peldaño por escalón.

     PEOR, PROMETÍA LO QUE NO PODÍA CUMPLIR. La descripción de «Subárea» decía «Puede anidarse
     dentro de otra subárea» y la regla del orden lo prohibía —dos subáreas tienen el mismo
     orden—, así que la única jerarquía posible eran DOS niveles. Un organigrama de verdad tiene
     cuatro sin despeinarse.

     `anidable` es lo que arregla las dos cosas: una unidad cuelga de otra unidad, sin límite de
     profundidad. Y la palabra —Dirección, Gerencia, Departamento, Área, Equipo— pasa a ser un
     CAMPO del nodo y no un peldaño del sistema, que es la misma lección que ya se aprendió con
     los nombres de los niveles: lo que cada empresa llama distinto es un dato, no una estructura. */
  /* VIVE EN EL EJE ORGANIZACIONAL Y ENCIMA DE LA UNIDAD, no en un eje propio.
     Tuvo el suyo —«Estructura de negocio»— con su entrada de menú y su pantalla, para UN solo
     peldaño. Un eje entero con un escalón adentro no separa nada: es un renglón de menú que
     siempre lleva a la misma lista, y encima al lado de otros dos ejes con tres y cuatro.

     Y ESTÁ MEJOR ACÁ QUE DONDE ESTABA. Colgado entre la empresa y la región, la línea de negocio
     terminaba conteniendo sucursales —«Retail tiene la sucursal de Sopocachi»— que es cierto en
     algunas empresas y raro en la mayoría. Encima de la unidad organizacional dice lo que casi
     siempre pasa: «Retail» contiene la Gerencia Comercial de Retail, y de ahí para abajo cuelgan
     sus cargos. La geografía queda en su eje y el negocio en el suyo, sin cruzarse.

     EL PLURAL ES «Unidades de negocio» Y NO «Negocios». Y NO «Negocios». Daba igual
     mientras el plural no se usaba: cada pestaña llevaba su nombre escrito aparte. Ahora que la
     pestaña y la entrada del menú SALEN del plural, un plural mal puesto se ve —el menú pasó a
     decir «Negocios», que es otra cosa: el negocio es a lo que se dedica la empresa, la unidad
     de negocio es la división que lo lleva—. Al hacer que un campo mande, los campos flojos
     dejan de ser inofensivos. */
  /* CUELGA DE LA EMPRESA Y DE NADA MÁS. `soloBajo` vacío no es un descuido: dice que ningún
     peldaño puede ser su padre. Antes colgaba de una regional, una sucursal o un centro, y eso la
     ataba a UN sitio cuando lo suyo es agrupar VARIOS —Farmacias toma Oriente y Valles, no una—.
     La pertenencia va al revés: la declara cada nodo, no la línea. */
  { key: 'negocio',  label: 'Unidad de negocio',  plural: 'Unidades de negocio', eje: 'organizacional',
    soloBajo: [],
    /* NO ES UN ESCALÓN DE AUTORIDAD, y la descripción vieja decía justo eso: «una división que
       manda, su gerente reporta a la gerencia general». La cadena de mando la arma la UNIDAD
       ORGANIZACIONAL —Dirección, Gerencia, Departamento, cada una colgando de la de arriba— y con
       dos jerarquías de autoridad compitiendo nadie sabe cuál vale.

       Una unidad de negocio agrupa para MEDIR: qué vende cada frente y cuánto cuesta. Es el mismo
       tipo de peldaño que la Región, que agrupa para consolidar y tampoco manda, y por eso su
       descripción tiene la misma forma. Y de paso deja de prometer un gerente que la ficha no
       guarda en ninguna parte. */
    desc: 'Uno de los frentes en los que la empresa separa lo que hace: Retail, Corporativo, Servicios. No manda sobre nadie: sirve para saber cuánta gente y cuánto cuesta cada frente.' },
  { key: 'unidad',   label: 'Unidad organizacional', plural: 'Unidades organizacionales',
    fijo: true, anidable: true, eje: 'organizacional',
    desc: 'Agrupa personas y cargos. Puede ser un área, una subárea, una dirección, una gerencia, un departamento, una sección o un equipo, y puede contener otras unidades sin límite de profundidad.' },
  /* EL CARGO ES PARTE DE CÓMO SE ORGANIZA EL TRABAJO, así que vive en ese eje y no fuera del
     mapa. Estaba fuera de todo eje —«se administra en su propia pantalla»— y esa pantalla no podía
     crear ninguno: el catálogo de cargos se DEDUCE agrupando los puestos por nombre, así que un
     cargo sin puesto no existe en ningún lado. Con el cargo como peldaño, crear uno es lo mismo
     que crear cualquier otra cosa del árbol y no hace falta inventar un puesto para nombrarlo.

     SOLO CUELGA DE UNA UNIDAD ORGANIZACIONAL. La regla del orden le permitiría colgar también de
     una sucursal o de una regional —están más arriba— y eso lo sacaría del organigrama: un cargo
     pertenece a un área, y dónde se trabaja lo dice el puesto, que es otra cosa. */
  { key: 'cargo',    label: 'Cargo',              plural: 'Cargos',       fijo: true,
    eje: 'organizacional', soloBajo: ['unidad'],
    desc: 'La definición de un rol, no una persona: cómo se llama, en qué unidad vive y qué nivel de mando tiene. Un mismo cargo puede tener varias personas a la vez.' },
  /* EL PUESTO ES LA SILLA, Y ES DONDE LOS TRES EJES SE TOCAN.
     El cargo dice QUÉ se hace —«Ejecutiva Comercial»— y el puesto es una de las sillas concretas
     de ese cargo: cuelga de él, se trabaja en un centro de trabajo y la ocupa una persona. Ahí
     se juntan por primera vez el eje organizacional y el físico, y por eso el puesto es el único
     nodo del árbol que apunta a los dos.

     NO TIENE NOMBRE PROPIO. Se llama como su cargo; lo que lo distingue es su código, dónde está
     y quién lo ocupa. Pedirle un nombre sería invitar a escribir «Ejecutiva Comercial 2», que es
     el código disfrazado de nombre. */
  /* SIGUE SIENDO UN PELDAÑO Y YA NO TIENE PANTALLA PROPIA. `sinVista` no lo apaga —los puestos
     existen, se dibujan y se guardan igual— le quita la pestaña y la entrada del menú.

     Las sillas se abren desde el CARGO, que es de donde cuelgan: ahí se dice cuántas se abren y
     ahí se corrigen. Una lista hermana de «Cargos» obligaba a elegir por cuál de las dos puertas
     entrar para un caso que casi siempre es uno solo —34 de los 35 cargos de la demo tienen
     exactamente una silla— y esa elección no la tiene que hacer nadie. */
  { key: 'puesto',   label: 'Puesto',             plural: 'Puestos',      fijo: true,
    eje: 'organizacional', soloBajo: ['cargo'], sinVista: true,
    desc: 'Una silla concreta de un cargo: dónde se trabaja y quién la ocupa. Si el cargo «Vendedor» tiene seis puestos, son seis sillas, ocupadas o vacantes.' },
]

/* CÓMO SE LLAMA CADA UNIDAD EN EL ORGANIGRAMA DE LA EMPRESA.
   Es la palabra que antes decidía el peldaño y ahora es un campo: la misma Gerencia de RRHH puede
   colgar de una Dirección y tener un Departamento debajo, y las tres son unidades.

   ORDENADAS DE MAYOR A MENOR ALCANCE y no alfabéticamente: al elegir en el desplegable, lo que
   uno busca es «qué tan arriba está esto», y una lista alfabética pone «Área» antes que
   «Dirección» y obliga a leerla entera. «Otro» va al final porque es la salida, no una opción.

   FIJA POR AHORA. Podría ser configurable como los peldaños —y probablemente termine siéndolo—
   pero ocho palabras cubren cualquier organigrama que hayamos visto, y una lista que nadie
   necesita editar todavía no justifica una pantalla más que mantener. El día que una empresa
   pida «Vicepresidencia», se mueve a la configuración junto a los niveles, que es donde ya vive
   lo renombrable. */
export const TIPOS_UNIDAD = [
  'Dirección', 'Gerencia', 'Departamento', 'Área', 'Unidad', 'Sección', 'Equipo', 'Otro',
]

/* QUÉ CLASE DE SITIO ES UN CENTRO DE TRABAJO.
   Lo mismo que el tipo de unidad, pero para el otro eje: el peldaño dice que es un lugar donde
   se ficha, y esta palabra dice cuál. Es lo que permite que el nivel se llame «Centro de trabajo»
   —el nombre que abarca a todos— sin que la empresa que solo tiene almacenes tenga que leer una
   palabra que no usa.

   SIN «SUCURSAL» EN LA LISTA, y es a propósito. Una sucursal es un PELDAÑO de la estructura, con
   sus propios centros dentro; ponerla también como tipo de centro es enseñar que las dos palabras
   son intercambiables, que es justo lo que hay que evitar. Quien tiene un local de cara al
   público está pensando en «Tienda», que sí es una clase de sitio. */
export const TIPOS_CENTRO = [
  'Oficina', 'Planta', 'Almacén', 'Taller', 'Obra', 'Tienda', 'Otro',
]

/* CÓMO SE LLAMAN LAS UNIDADES DE NEGOCIO EN CASI TODAS PARTES.
   No es un catálogo cerrado como los dos de arriba: es una lista de SUGERENCIAS. Una unidad de
   negocio es la división por la que la empresa reparte su plata —Corporativo, Retail, Servicios—
   y esas palabras se repiten de empresa en empresa, pero la lista no puede estar completa: una
   distribuidora de vacunas tiene «Cadena de frío» y ningún catálogo lo iba a adivinar.

   Por eso el campo las ofrece y deja escribir encima. Sin «Otro»: una opción «Otro» guarda la
   palabra «Otro» en vez de la respuesta, y después hay que ir a buscar en qué campo quedó lo que
   la persona quiso decir. */
/* La opción que abre el campo de texto. Es una palabra de la PANTALLA y nunca del dato: la ficha
   la cambia por lo que se escriba antes de guardar. */
export const OTRO = 'Otro'

export const NEGOCIOS_COMUNES = [
  'Corporativo', 'Retail', 'Mayorista', 'Distribución',
  'Servicios', 'Industrial', 'Comercial', 'Exportación',
]

/* «NINGUNA» ELEGIDA VUELVE A SER NADA. En el formulario la ausencia tiene que ser una opción de
   la lista —si no, elegir por error es irreversible— y en el dato vuelve a ser lo que es. */
export const sinRaiz = v => (v && v !== RAIZ ? v : '')

/* EL ANCLAJE DE UN CENTRO, REPARTIDO EN TRES CAMPOS Y GUARDADO EN UNO.
   El formulario pregunta por regional, sucursal y centro superior por separado —así se pidió— y
   el árbol solo entiende de `padreId`. Estas dos funciones son el puente, y viven acá porque son
   la regla del dato: la pantalla no tiene por qué saber que tres desplegables son un solo padre.

   AL LEER se reparten los ancestros en sus tres casillas. Un centro sembrado hace meses tiene
   solo `padreId`, y sin esto el formulario abriría con los tres vacíos diciendo que no cuelga de
   nada mientras el árbol dice lo contrario.

   AL GUARDAR manda el MÁS ESPECÍFICO de los tres. Es lo que evita la contradicción de tener tres
   respuestas para una sola pregunta: si hay centro superior, la regional y la sucursal salen de
   él; si no, de la sucursal; y así hasta la empresa. */
export function anclajeDeCentro(nodo, nodos) {
  const arriba = nodo ? caminoDe(nodo.id, nodos).slice(0, -1) : []
  const padre = arriba[arriba.length - 1] || null
  return {
    regionalId: arriba.find(n => n.tipo === 'region')?.id || RAIZ,
    sucursalId: arriba.find(n => n.tipo === 'sucursal')?.id || RAIZ,
    centroPadre: padre?.tipo === 'centro' ? padre.id : RAIZ,
  }
}

export const padreDeCentro = f =>
  sinRaiz(f.centroPadre) || sinRaiz(f.sucursalId) || sinRaiz(f.regionalId) || null

/* EL MISMO ESTADO, CON LA PALABRA DE CADA PELDAÑO. La pregunta es una sola —¿esto sigue en uso?—
   y el valor guardado es el mismo para todos, `activa` o `cerrada`. Lo que cambia es cómo se
   dice, y no es un detalle de redacción: una SUCURSAL cierra —es un local con una puerta, y
   «cerrada» es la palabra que usa quien trabaja ahí— pero una REGIONAL no cierra, porque no es un
   sitio: es una forma de agrupar sucursales, y una agrupación que deja de usarse se DESACTIVA.
   Leer «Regional Santa Cruz · Cerrada» hace pensar que cerraron sus sucursales, que es otra cosa
   y bastante más grave.

   EL VALOR NO CAMBIA, SOLO LA ETIQUETA. Renombrar `cerrada` a `inactiva` obligaría a migrar cada
   nodo guardado para no ganar nada: nadie lee el valor, todo el mundo lee la etiqueta.

   LA LISTA DE LOS QUE CIERRAN ES CORTA Y EXPLÍCITA. Un peldaño propio que la empresa se invente
   —«Obra», «Faena»— cae en «Inactiva», que es la palabra que sirve para cualquier cosa; «cerrada»
   es la que solo sirve para algunas. Cuando haga falta, esto pasa a ser una casilla del peldaño y
   la empresa lo decide; hoy sería una pregunta más en la configuración a cambio de nada. */
const PELDAÑOS_QUE_CIERRAN = new Set(['sucursal', 'centro'])

export const ESTADOS_INACTIVO = {
  activa: ESTADOS_SUCURSAL.activa,
  cerrada: { ...ESTADOS_SUCURSAL.cerrada, label: 'Inactiva' },
}

/* LOS PELDAÑOS QUE NO SON FEMENINOS. Las palabras del estado estaban escritas para la sucursal y
   la regional —«Activa», «Cerrada»— y se usaban tal cual en todos: un CARGO decía «Activa» y un
   CENTRO DE TRABAJO decía «Cerrada». No es un detalle de estilo; es la pantalla hablando mal el
   idioma de quien la usa, en la palabra que más se repite de toda la tabla.

   OJO CON EL LÍMITE: el peldaño se renombra, y el género viaja con la palabra. Una empresa que
   llame «Faena» a sus centros va a leer «Faena · Cerrado». La solución que aguanta es que el
   género sea un dato del peldaño, elegido al renombrarlo en Configuración; esto de acá cubre bien
   los que vienen de fábrica, que son los que casi todo el mundo usa sin tocar. */
const PELDAÑOS_MASCULINOS = new Set(['centro', 'cargo', 'puesto'])

const enMasculino = estados => Object.fromEntries(
  Object.entries(estados).map(([k, e]) => [k, { ...e, label: e.label.replace(/a$/, 'o') }]),
)

export const estadosDe = tipo => {
  const base = PELDAÑOS_QUE_CIERRAN.has(tipo) ? ESTADOS_SUCURSAL : ESTADOS_INACTIVO
  return PELDAÑOS_MASCULINOS.has(tipo) ? enMasculino(base) : base
}

/* Y EL VERBO, para las frases que lo necesitan: «cerrar» una sucursal, «desactivar» una regional.
   Sale del mismo sitio que la etiqueta para que no se puedan contradecir. */
export const verboApagar = tipo => (PELDAÑOS_QUE_CIERRAN.has(tipo) ? 'Cerrar' : 'Desactivar')

/* «NUEVO CARGO» Y NO «NUEVA CARGO». El botón de la tabla armaba su rótulo pegando «Nueva » al
   nombre del peldaño, así que decía «Nueva cargo», «Nueva puesto» y «Nueva centro de trabajo» —el
   botón más grande de la pantalla, en falta de concordancia, tres veces—.

   SALE DE LA MISMA LISTA QUE EL ESTADO. El género ya estaba resuelto para «Activo/Activa» y era
   una lista de tres palabras; usarla también acá es gratis y garantiza que las dos frases de la
   misma fila no se contradigan. Hereda su límite, que ya está anotado arriba: un peldaño que la
   empresa renombre «Faena» va a leer «Nuevo faena» hasta que el género sea un dato del peldaño. */
export const generoDe = tipo => (PELDAÑOS_MASCULINOS.has(tipo) ? 'o' : 'a')
export const nuevoDe = tipo => `Nuev${generoDe(tipo)}`
export const primerDe = tipo => (PELDAÑOS_MASCULINOS.has(tipo) ? 'el primero' : 'la primera')

/* TODO LECTOR RECIBE LA LISTA DE LA EMPRESA, y cae en el catálogo base cuando no se la pasan.
   El respaldo no es pereza: hay sitios —una ficha abierta por dirección, un nodo huérfano de un
   nivel que alguien borró— donde hace falta el nombre de un tipo antes de tener el contexto a
   mano, y ahí es mejor decir «Sucursal» que dejar el renglón en blanco. */
/* LA LISTA GUARDADA SE RECONCILIA CON EL CATÁLOGO ANTES DE USARSE.
   Los peldaños son un dato de la empresa —se renombran, se reordenan, se agregan— así que viven
   en `localStorage` y sobreviven a los cambios del código. Eso es lo que se quiere hasta que el
   catálogo cambia de forma: al fusionar «Área» y «Subárea» en «Unidad organizacional», toda lista
   ya guardada se quedó con dos peldaños que no existen y sin el que sí, que además es `fijo`.

   Y un peldaño obligatorio ausente no se nota como un error: se nota como que la pantalla de
   unidades no tiene nada que listar, que es mucho peor de encontrar.

   DOS REGLAS Y SE ARREGLA SOLO:
   · Se cae lo que el catálogo ya no tiene. Los peldaños PROPIOS de la empresa no se tocan: esos
     no están en el catálogo por definición y borrarlos sería borrar su configuración.
   · Entran los `fijo` que falten, en la posición que el catálogo les da —delante del primer
     peldaño conocido que va después de ellos—, así «Unidad organizacional» aparece donde estaban
     las áreas y no al final de todo.

   SIN TOCAR NADA SI NO HACE FALTA: se devuelve el mismo arreglo que entró cuando ya está sano.
   Es lo que evita que cada dibujo genere una lista nueva y despierte a los `useMemo` que la
   miran. El resultado se recuerda para la última entrada por lo mismo. */
/* LO QUE ES DEL USUARIO Y LO QUE ES DEL SISTEMA, DENTRO DEL MISMO PELDAÑO.
   El nombre, el plural, la descripción, el orden y el encendido los decide la empresa: se
   renombran y se reordenan, y ahí manda la copia guardada. `eje`, `fijo` y `anidable` no se tocan
   desde ninguna pantalla —son estructura— y ahí manda el catálogo.

   Sin esa distinción, mover la unidad de negocio a su propio eje no llegaba a quien ya tuviera
   niveles guardados: seguiría diciendo que vive en «Estructura organizacional». La única salida
   era cambiar otra vez el nombre de la llave y hacerle perder los renombres a todo el mundo. Con
   esto, un cambio de estructura viaja solo y los renombres se quedan. */
const DEL_SISTEMA = ['eje', 'fijo', 'anidable', 'soloBajo']

/* SE COMPARA CON CUIDADO PORQUE UNO DE ELLOS ES UNA LISTA. `soloBajo` es un arreglo, y dos
   arreglos con el mismo contenido nunca son iguales con `!==`: sin esto el peldaño se daría por
   desfasado en cada pasada y se reharía siempre. Se comparan por su contenido. */
const distinto = (a, b) => (Array.isArray(a) || Array.isArray(b)
  ? JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)
  : a !== b)

export const sanearNiveles = niveles => {
  const conocidos = new Map(TIPOS_BASE.map(t => [t.key, t]))
  const vivos = niveles
    .filter(t => conocidos.has(t.key) || t.propio)
    .map(t => {
      const base = conocidos.get(t.key)
      const desfasados = base ? DEL_SISTEMA.filter(k => distinto(t[k], base[k])) : []
      if (!desfasados.length) return t
      const sig = { ...t }
      desfasados.forEach(k => { sig[k] = base[k] })
      return sig
    })
  const faltan = TIPOS_BASE.filter(t => t.fijo && !vivos.some(x => x.key === t.key))
  /* Se compara peldaño por peldaño y no por longitud: corregir un `eje` no cambia cuántos hay, y
     devolver el arreglo de entrada dejaría la corrección sin aplicar. */
  const igual = vivos.length === niveles.length && vivos.every((t, i) => t === niveles[i])
  if (!faltan.length && igual) return niveles

  const salida = [...vivos]
  faltan.forEach(t => {
    const desde = TIPOS_BASE.findIndex(x => x.key === t.key)
    const siguiente = TIPOS_BASE.slice(desde + 1).map(x => x.key)
    const donde = salida.findIndex(x => siguiente.includes(x.key))
    salida.splice(donde === -1 ? salida.length : donde, 0, { ...t, on: true })
  })
  return salida
}

let ultimaEntrada = null
let ultimaSalida = null
const lista = niveles => {
  if (!Array.isArray(niveles) || !niveles.length) return TIPOS_BASE
  if (niveles !== ultimaEntrada) {
    ultimaEntrada = niveles
    ultimaSalida = sanearNiveles(niveles)
  }
  return ultimaSalida
}

export const tipoDe = (key, niveles) =>
  lista(niveles).find(t => t.key === key) || TIPOS_BASE.find(t => t.key === key) || null

/* EL ORDEN ES LA POSICIÓN, y por eso empieza en 1 y no en 0: es el número que la configuración
   enseña al costado de cada peldaño. Un tipo que no está en la lista —el nivel propio que
   alguien borró dejando nodos dentro— se va al fondo en vez de colarse arriba de todo. */
export const ordenDe = (key, niveles) => {
  const i = lista(niveles).findIndex(t => t.key === key)
  return i === -1 ? 99 : i + 1
}

/* ENCENDIDO Y APAGADO: AHORA UNA MARCA EN EL PELDAÑO Y NO UNA LISTA APARTE.
   `nivelesEstructura` era un arreglo de llaves encendidas —['negocio','region',…]— y eso solo
   sabe decir sí o no. Un peldaño que además tiene nombre propio, plural y posición necesita
   existir en la lista aunque esté apagado: si no, apagarlo borraría cómo se llama.

   Sigue naciendo TODO ENCENDIDO. Naciendo apagado, «apagado» quería decir «todavía no lo
   encontraste» —un estado que nadie eligió—; naciendo encendido quiere decir «lo apagaste tú»,
   una decisión deliberada, que se respeta escondiéndola. Quien lo apagó sabe dónde está el
   interruptor: acaba de usarlo. */
export const nivelesIniciales = () => TIPOS_BASE.map(t => ({ ...t, on: true }))

/* Fijo manda sobre todo lo demás, y la ausencia de `on` cuenta como encendido: así un peldaño
   guardado por una versión anterior de la pantalla no desaparece al abrir esta. */
export const estaEncendido = (key, niveles) => {
  const t = lista(niveles).find(x => x.key === key)
  return !!t && (!!t.fijo || t.on !== false)
}

export const tiposEncendidos = niveles =>
  lista(niveles).filter(t => t.key !== 'cargo' && estaEncendido(t.key, niveles))

/* LA ESCALERA QUE SE ENSEÑA EN CONFIGURACIÓN, en el orden real y sin remiendos.
   La armaba la pantalla con `tiposEncendidos(...).concat(cargo)` —el cargo pegado al final— y eso
   valía cuando el cargo ERA el último peldaño. Desde que existe el puesto, el remiendo lo dejaba
   detrás de él y la cadena mentía: «Cargo cuelga de Puesto», «Puesto puede contener Cargo», con
   las dos frases exactamente al revés de la regla que el propio modelo aplica.

   Y SE SALTA LOS QUE NO TIENEN PUERTA PROPIA. El puesto es un peldaño de verdad —los puestos se
   guardan y se dibujan— pero no se administra por su cuenta: se abre desde su cargo. Una lista de
   escalones para encender, apagar y ordenar no tiene por qué enseñar uno que no se enciende, no se
   apaga y no se ordena. */
/* LOS SITIOS QUE CUENTAN COMO «ESTA SUCURSAL»: ella y todo lo que tenga dentro.
   Un puesto no siempre declara la sucursal: declara DÓNDE SE TRABAJA, que puede ser un centro
   —«Depósito Central»— y no la sede que lo contiene. Al filtrar el organigrama por Casa Matriz,
   comparar id contra id dejaba fuera a los del depósito, que están ahí adentro.

   Es la misma deducción que la columna «Sucursal» de las tablas ya hace subiendo por los padres;
   acá se resuelve al revés —de la sucursal hacia abajo— porque el filtro pregunta una vez y compara
   muchas. */
export const lugaresDeSucursal = (nodos, sucursalId) => {
  const dentro = new Set([sucursalId])
  let creció = true
  while (creció) {
    creció = false
    for (const n of nodos) {
      if (n.padreId && dentro.has(n.padreId) && !dentro.has(n.id) && n.tipo !== 'unidad') {
        dentro.add(n.id)
        creció = true
      }
    }
  }
  return dentro
}

export const nivelesVisibles = niveles =>
  lista(niveles).filter(t => !t.sinVista && estaEncendido(t.key, niveles))

/* LA CADENA DE ESCALONES, que es otra cosa que la lista de niveles. La cadena promete que «cada
   uno cuelga del anterior», así que solo puede llevar a los que de verdad cuelgan: la línea de
   negocio no cuelga de nada y nada cuelga de ella —agrupa por fuera del árbol— y dibujarla en el
   medio prometía que la unidad organizacional depende de ella, que es falso.

   Se reconoce por lo que declara y no por su nombre: cualquier peldaño que diga que ningún padre
   le sirve queda fuera de la cadena por la misma razón. */
export const nivelesEnCadena = niveles =>
  nivelesVisibles(niveles).filter(t => !(Array.isArray(t.soloBajo) && t.soloBajo.length === 0))

/* Y la lista completa para la tabla de configuración: los apagados también se enseñan —hay que
   poder encenderlos— pero los sin puerta propia siguen fuera. */
export const nivelesDeCatalogo = niveles => lista(niveles).filter(t => !t.sinVista)

/* Si queda alguno apagado. Es lo único que necesita saber el botón de «encender todos» para
   decidir si sale: un botón que no cambiaría nada es un botón que hace dudar de si hizo algo. */
export const hayApagados = niveles => lista(niveles).some(t => !t.fijo && t.on === false)

export const encenderTodos = niveles => lista(niveles).map(t => ({ ...t, on: true }))

/* ══════════════ LOS TRES VERBOS QUE LE FALTABAN AL MODELO ══════════════
   Encender y apagar era todo lo que una empresa podía hacerle a sus peldaños, y eso solo alcanza
   si la empresa se llama como nosotros creímos. Renombrar, agregar y mover son lo que convierte
   la lista en SUYA. Los tres viven acá y no en la pantalla porque los tres tienen una regla, y
   una regla escrita en el manejador de un botón no la puede comprobar nadie más. */

/* RENOMBRAR VALE PARA TODOS, INCLUSO LOS FIJOS. `fijo` protege la EXISTENCIA del peldaño —sin
   empresa, área y cargo no hay árbol— y no su nombre: un colegio que le dice «Departamento» a
   sus áreas sigue teniendo el mismo escalón, con otra palabra encima.

   El plural viaja junto al singular porque no es decorativo: es el nombre de la pestaña, el de
   la entrada del menú y el del título de la tabla. Renombrar solo el singular dejaría la pantalla
   diciendo «Agencia» en el formulario y «Sucursales» en el menú. */
export const renombrarNivel = (niveles, key, { label, plural, desc }) =>
  lista(niveles).map(t => (t.key === key
    ? {
        ...t,
        label: label.trim() || t.label,
        plural: (plural || '').trim() || label.trim() || t.plural,
        /* LA DESCRIPCIÓN VIAJA CON EL NOMBRE porque si no, renombrar deja la pantalla a medias:
           «Agencia — la sede desde la que se opera en un sitio» es un renglón que se contradice
           solo, y es justo el renglón que explica para qué sirve el escalón. Se acepta vacía: una
           descripción borrada es mejor que una que habla de otra empresa. */
        desc: desc === undefined ? t.desc : desc.trim(),
      }
    : t))

/* LA LLAVE SALE DEL NOMBRE Y NO SE VUELVE A TOCAR NUNCA. Es lo que guardan los nodos en su
   campo `tipo`, así que renombrar «Obra» a «Proyecto» cambia la palabra y no la llave: si la
   llave siguiera al nombre, cada renombrado dejaría todos los nodos huérfanos de un tipo que
   dejó de existir.

   Se le quitan las tildes y lo que no sea letra o número porque termina en una dirección
   (`?ver=obra`) y en un nombre de clase CSS. Y si ya existe, se numera: dos peldaños con la
   misma llave son un peldaño que se come al otro. */
export function llaveDeNivel(label, niveles) {
  const base = (label || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '')
    .slice(0, 20) || 'nivel'
  const usadas = new Set(lista(niveles).map(t => t.key))
  if (!usadas.has(base)) return base
  let n = 2
  while (usadas.has(base + n)) n += 1
  return base + n
}

/* AGREGAR ES INSERTAR EN UNA POSICIÓN, no añadir al final: un peldaño propio casi siempre va
   ENTRE dos que ya existen —«Distrito» entre región y sucursal, «Obra» debajo de la sucursal— y
   pegarlo al final lo dejaría abajo del cargo, donde no puede contener nada.

   `posicion` es el índice donde queda, contando desde 0. La pantalla la pregunta como «va
   debajo de X», que es la misma cosa dicha en el idioma de quien la está armando. */
export function agregarNivel(niveles, { label, plural, desc, eje }, posicion) {
  const base = lista(niveles)
  const nivel = {
    key: llaveDeNivel(label, base),
    label: label.trim(),
    plural: (plural || '').trim() || label.trim(),
    desc: (desc || '').trim(),
    eje,
    on: true,
    propio: true,
  }
  const i = Math.max(1, Math.min(posicion, base.length - 1))   // nunca antes de la empresa ni después del cargo
  return [...base.slice(0, i), nivel, ...base.slice(i)]
}

/* BORRAR SOLO LOS PROPIOS, Y SOLO SI ESTÁN VACÍOS. Un peldaño base no se borra porque no es
   suyo: se apaga, y apagado no aparece en ningún lado. Y uno con nodos dentro tampoco, por lo
   mismo que no se puede apagar: dejaría a esos nodos colgando de un escalón inexistente. */
export const quitarNivel = (niveles, key) => lista(niveles).filter(t => t.key !== key)

/* MOVER UN PELDAÑO, VALIDADO CON LA ÚNICA REGLA QUE TIENE EL ÁRBOL.
   Se podría prohibir mover cualquier nivel que tenga nodos y quedarse tranquilo, pero eso
   prohíbe de más: hay empresas donde el lugar va DENTRO del área y no al revés —un banco cuelga
   sus agencias de la Gerencia Comercial— y esa inversión es legítima. Prohibirla por si acaso es
   decidir nosotros la forma de una organización que no conocemos.

   Así que en vez de una prohibición hay una comprobación: se simula la lista movida y se mira si
   algún nodo del árbol quedaría colgando de un padre que ahora va por debajo suyo. Si ninguno,
   el movimiento es legal y se hace. Si alguno, se devuelve el que sobra para poder DECIR cuál es
   —«Área Comercial está dentro de Casa Matriz»— en vez de un «no se puede» a secas. */
export function moverNivel(niveles, key, direccion) {
  const base = lista(niveles)
  const i = base.findIndex(t => t.key === key)
  const j = i + direccion
  if (i === -1 || j < 1 || j > base.length - 2) return null   // la empresa y el cargo no se mueven
  const movida = [...base]
  movida[i] = base[j]
  movida[j] = base[i]
  return movida
}

/* El primer nodo que la lista dada dejaría fuera de la regla del orden, o null si ninguno. Se
   devuelve el nodo y su padre porque el aviso necesita los dos nombres para ser un aviso. */
export function nodoQueRompe(niveles, nodos) {
  const porId = new Map(nodos.map(n => [n.id, n]))
  for (const n of nodos) {
    const padre = n.padreId ? porId.get(n.padreId) : null
    if (!padre) continue
    // Un peldaño anidable dentro de sí mismo es lo normal, no un orden roto.
    if (padre.tipo === n.tipo && tipoDe(n.tipo, niveles)?.anidable) continue
    if (ordenDe(padre.tipo, niveles) >= ordenDe(n.tipo, niveles)) return { nodo: n, padre }
  }
  return null
}

/* QUÉ SE PUEDE CREAR DENTRO DE UN NODO. Es la regla del orden, y nada más: todo tipo encendido
   que vaya más abajo. De aquí sale el menú de "Agregar", así que la validación no se escribe dos
   veces —una para prohibir y otra para ofrecer—: lo que no se puede, no aparece.

   El cargo queda fuera porque no se crea aquí: tiene cupo de plazas, ocupantes y línea de mando,
   y eso vive en la pantalla de Cargos. */
export function tiposBajo(nodo, niveles) {
  const desde = nodo ? ordenDe(nodo.tipo, niveles) : 1   // sin nodo, se está parado en la empresa
  return lista(niveles).filter((t, i) =>
    t.key !== 'cargo' && t.key !== 'empresa' && i + 1 > desde && estaEncendido(t.key, niveles))
}

/* EL PELDAÑO QUE VA JUSTO ENCIMA DE OTRO, y de ahí sale el rótulo del campo del padre. Es el
   encendido más cercano por arriba: para una sucursal, la región; para un centro de trabajo, la
   sucursal. Se calcula y no se escribe, así que una empresa que renombre su región a «Distrito»
   lee «De qué distrito depende» sin que nadie toque una línea. */
export function nivelSobre(tipo, niveles) {
  const orden = ordenDe(tipo, niveles)
  const arriba = lista(niveles).filter(t =>
    t.key !== 'empresa' && t.key !== 'cargo'
    && ordenDe(t.key, niveles) < orden && estaEncendido(t.key, niveles))
  return arriba.length ? arriba[arriba.length - 1] : null
}

/* «SIN PADRE» NECESITA UN VALOR QUE NO SEA `null`, porque un desplegable no puede tener una
   opción vacía sin confundirse con «no elegiste nada». Se traduce en los bordes —al abrir la
   ficha y al guardarla— y el dato guardado sigue siendo `padreId: null`. Vive acá y no dentro
   de una pantalla porque es una regla del modelo, no de quien lo dibuja: cualquier pantalla que
   lea o escriba un padre tiene que hacer la misma conversión en sus dos bordes. */
export const RAIZ = '__raiz__'

/* Los padres válidos para un nodo, para el campo "Depende de". Además del orden hay que excluir
   al propio nodo y a su descendencia: un área que cuelga de su propia subárea deja el árbol en
   ciclo y el recorrido en bucle infinito. */
export function padresPosibles(nodo, nodos, niveles) {
  const prohibidos = new Set(nodo ? [nodo.id, ...descendientes(nodo.id, nodos)] : [])

  /* UN PELDAÑO ANIDABLE SOLO CUELGA DE SÍ MISMO. La regla del orden le ofrecía a una unidad
     organizacional todos los peldaños de encima —unidad de negocio, regional, sucursal, centro—
     y eso mezclaba dos preguntas distintas: DE QUIÉN DEPENDE esta unidad, que se contesta con
     otra unidad, y DÓNDE OPERA, que es un lugar y tiene su propio campo. Con las dos en el mismo
     desplegable, colgar Ventas de «Sucursal Equipetrol» la sacaba del organigrama sin avisar:
     dejaba de depender de la Gerencia Comercial para depender de un edificio. */
  /* UN PELDAÑO PUEDE DECLARAR DE QUÉ CUELGA, y entonces manda sobre la regla del orden. El orden
     dice qué es imposible —un área dentro de un cargo—;  dice qué tiene sentido. Un
     cargo podría colgar de una regional sin romper el orden, y estaría fuera del organigrama. */
  const declarado = tipoDe(nodo?.tipo, niveles)?.soloBajo
  if (declarado) {
    return nodos.filter(n =>
      !prohibidos.has(n.id) && declarado.includes(n.tipo) && estaEncendido(n.tipo, niveles))
  }

  if (tipoDe(nodo?.tipo, niveles)?.anidable) {
    return nodos.filter(n =>
      !prohibidos.has(n.id) && n.tipo === nodo.tipo && estaEncendido(n.tipo, niveles))
  }

  return nodos.filter(n =>
    !prohibidos.has(n.id)
    && ordenDe(n.tipo, niveles) < ordenDe(nodo?.tipo || 'cargo', niveles)
    && estaEncendido(n.tipo, niveles))
}

/* LOS LUGARES DONDE PUEDE OPERAR ALGO: los nodos del eje físico, de cualquier profundidad.
   Una unidad puede anclarse a una regional, a una sucursal o a un centro de trabajo, y no se
   piden tres campos —uno por peldaño— porque son la misma pregunta a distinta altura, y tres
   desplegables sueltos dejan elegir una sucursal que no está en la regional elegida. Un solo
   nodo del árbol físico no puede contradecirse a sí mismo. */
/* ══ A QUÉ LÍNEA DE NEGOCIO PERTENECE ALGO ═══════════════════════════════════════════
   Los peldaños que pueden DECLARAR una línea. No están todos a propósito:

     · La declaran los que una empresa reparte entre sus frentes —regionales, sucursales, centros
       de trabajo y unidades organizacionales—. Cuál de esos usa cada empresa es cosa suya: una
       cadena reparte por sucursales, un holding por regionales, una consultora por áreas.
     · NO la declaran el cargo ni el puesto. Un vendedor no elige de qué negocio es: lo es porque
       trabaja donde trabaja. Preguntárselo abriría la puerta a que su respuesta contradiga a la
       de su área, y entonces «¿cuánta gente tiene Farmacias?» tendría dos respuestas. */
export const DECLARAN_LINEA = ['region', 'sucursal', 'centro', 'unidad']

/* Y quiénes la ENSEÑAN, que son más: el cargo y el puesto no eligen la suya —les llega por su
   unidad— pero saberla es media razón de que el peldaño exista. */
export const MUESTRAN_LINEA = [...DECLARAN_LINEA, 'cargo', 'puesto']

/* DE QUÉ LÍNEA ES UN NODO: la del primero que la declare, subiendo. Y se sube por dos caminos,
   en este orden:

     1 · POR LA CADENA ORGANIZACIONAL —de quién cuelga— que es la respuesta natural: una subárea
         es del negocio de su área.
     2 · SI ESA CADENA NO DICE NADA, por el ANCLA FÍSICA: dónde opera. Es el mismo salto de un eje
         al otro que ya hace `ancestroDe` con la sucursal, y es lo que hace que funcione la empresa
         que reparte por sucursales: su Contabilidad no declara línea, pero opera en la Sucursal A,
         que es de Farmacias.

   EL ORDEN IMPORTA Y NO ES ARBITRARIO. Si las dos cadenas dicen algo distinto, manda la
   organizacional: lo que uno hace pesa más que dónde lo hace. Sin un orden fijo, dos empresas
   idénticas darían cuentas distintas.

   SIN LÍNEA NO ES UN ERROR: es un nodo transversal. Recursos Humanos sirve a los tres frentes y
   no pertenece a ninguno, igual que una unidad sin sede vale para toda la empresa. */
export function lineaConOrigen(id, nodos) {
  const porId = new Map(nodos.map(n => [n.id, n]))
  const subir = (desde, saltar) => {
    let n = porId.get(desde)
    for (let i = 0; n && i < 30; i += 1) {
      /* SE DEVUELVE TAMBIÉN QUIÉN LA DECLARA, no solo cuál es. El que la declara es a quien hay
         que ir a cambiarla, así que la ficha necesita su nombre para poder decirlo. */
      if (n.lineaNegocio) return { linea: n.lineaNegocio, origen: n.id }
      /* El ancla se mira UNA vez y al final de su propia cadena, no en cada escalón: mirándola
         en cada uno, una subárea sin línea contestaría con la sede de su padre antes de haber
         terminado de preguntarle al abuelo. */
      if (!n.padreId) break
      n = porId.get(n.padreId)
    }
    if (saltar) {
      let m = porId.get(desde)
      for (let i = 0; m && i < 30; i += 1) {
        if (m.ubicacion) return subir(m.ubicacion, false)
        if (!m.padreId) break
        m = porId.get(m.padreId)
      }
    }
    return { linea: null, origen: null }
  }
  return subir(id, true)
}

export const lineaDe = (id, nodos) => lineaConOrigen(id, nodos).linea

export const lugaresPosibles = (nodos, niveles) =>
  nodos.filter(n => tipoDe(n.tipo, niveles)?.eje === 'fisica' && estaEncendido(n.tipo, niveles))

/* LOS LUGARES, CON LA FORMA DEL ÁRBOL Y NO EN EL ORDEN EN QUE SE CREARON.
   Plana, la lista ponía «Casa Matriz Equipetrol» y «Oriente» como hermanas cuando una está dentro
   de la otra, y encontrar las sucursales de una regional era leerlas todas. Sangradas, cada
   sucursal cuelga de su regional y cada centro de su sucursal.

   ES UN SOLO CAMPO Y NO DOS ENCADENADOS —primero la región, después la sucursal— por una razón de
   fondo: una unidad puede operar a nivel de regional, de sucursal o de centro de trabajo. Con
   campos encadenados habría que dejar los de abajo vacíos, y ahí «vacío» significaría dos cosas
   —«no lo contesté» y «opera a nivel de regional»—, que es justo la ambigüedad que este módulo se
   dedica a no tener. El encadenado sí está donde corresponde: en el centro de trabajo, que declara
   de qué regional y de qué sucursal cuelga, y ahí los tres campos son opcionales a propósito.

   La `pista` es para cuando se busca: escribiendo, la sangría se pierde —los resultados salen de
   ramas distintas— y lo que ubica a cada uno pasa a ser de qué cuelga. */
export function arbolDeLugares(lugares, niveles) {
  const nombre = n => `${tipoDe(n.tipo, niveles)?.label}: ${n.nombre}`
  const salida = []
  const bajar = (padre, nivel) => {
    lugares
      .filter(n => (n.padreId || null) === padre)
      .forEach(n => {
        const p = padre ? lugares.find(x => x.id === padre) : null
        salida.push({ valor: n.id, etiqueta: nombre(n), nivel, pista: p?.nombre })
        bajar(n.id, nivel + 1)
      })
  }
  bajar(null, 0)
  /* EL QUE CUELGA DE UN NIVEL APAGADO NO DESAPARECE. Con las regionales apagadas, las sucursales
     apuntan a un padre que no está en esta lista y el recorrido no llega a ellas: van al primer
     nivel, que es donde están de verdad para quien mira. */
  const puestos = new Set(salida.map(o => o.valor))
  lugares
    .filter(n => !puestos.has(n.id))
    .forEach(n => salida.push({ valor: n.id, etiqueta: nombre(n), nivel: 0 }))
  return salida
}

/* DÓNDE OPERA ALGO, DEDUCIDO. Se sube por las unidades hasta encontrar la primera que declare un
   lugar, y ese es el ancla de toda la rama. Por eso el lugar se pregunta UNA vez, arriba: si
   RRHH cuelga de una Gerencia Administrativa que está en Santa Cruz, RRHH está en Santa Cruz, y
   volver a preguntárselo solo abre la puerta a que alguien conteste «La Paz» y deje dos verdades.

   Sin ancla en toda la rama no es un error: es una unidad que vale para toda la empresa, que es
   el caso de una Gerencia General. */
export function anclaDe(id, nodos) {
  let n = nodos.find(x => x.id === id)
  for (let i = 0; n && i < 30; i += 1) {
    if (n.ubicacion) return nodos.find(x => x.id === n.ubicacion) || null
    if (!n.padreId) return null
    n = nodos.find(x => x.id === n.padreId)
  }
  return null
}

export function descendientes(id, nodos) {
  const dentro = []
  const bajar = padre => nodos.filter(n => n.padreId === padre).forEach(h => { dentro.push(h.id); bajar(h.id) })
  bajar(id)
  return dentro
}

export const hijosDe = (id, nodos) => nodos.filter(n => (n.padreId ?? null) === id)

/* El camino desde la raíz, que es lo que reemplaza a `cargo.sucursalIds`: en qué sucursal trabaja
   alguien deja de ser un dato que se declara y pasa a leerse subiendo por los padres. */
export function caminoDe(id, nodos) {
  const camino = []
  let actual = nodos.find(n => n.id === id)
  let vueltas = 0
  while (actual && vueltas < 20) {
    camino.unshift(actual)
    actual = actual.padreId ? nodos.find(n => n.id === actual.padreId) : null
    vueltas += 1
  }
  return camino
}

/* El ancestro de un tipo dado. `ancestroDe(cargo, 'sucursal')` contesta la pregunta que hoy
   guarda `sucursalIds` a mano. Devuelve null cuando el camino no pasa por ese tipo, que es la
   regla de siempre: sin sucursal en el camino, el nodo vale para toda la empresa. */
export function ancestroDe(id, tipo, nodos) {
  const propio = caminoDe(id, nodos).find(n => n.tipo === tipo)
  if (propio) return propio
  /* Una unidad no cuelga de ningún lugar —cuelga de otra unidad— así que su sucursal no está en
     su camino: está en el del ancla. Se salta de un árbol al otro por ahí, que es el único punto
     donde los dos ejes se tocan. */
  const ancla = anclaDe(id, nodos)
  return ancla ? (caminoDe(ancla.id, nodos).find(n => n.tipo === tipo) || null) : null
}

/* LOS DOS EJES, que son dos PUERTAS AL MISMO ÁRBOL y no dos árboles.
   Las dos preguntas que contesta la estructura son distintas —dónde trabaja alguien y de quién
   depende— y merecen entradas propias en el menú, porque quien va a dar de alta una sucursal no
   está pensando en "un nodo".

   PERO EL ÁRBOL ES UNO SOLO: en TECNOSOL el Área de RRHH cuelga de la Oficina Torre Empresarial.
   Partirlo en dos listas independientes dejaría a las áreas sin raíz —"Comercial" a secas no
   dice nada, "Comercial, en Oficina Cochabamba" sí— y mandaría a la otra pantalla cada vez que
   hay que cambiar de qué cuelga algo. Así que cada eje RECORTA la misma lista de nodos y enseña
   en gris el camino que se saltó, en vez de fingir que la otra mitad no existe.

   LAS VISTAS SON SUBCONJUNTOS DE TIPOS y no un tipo suelto, porque así "Unidades
   organizacionales" —que en el vocabulario de la empresa es un solo concepto— puede ser área y
   subárea juntas, con su jerarquía, y no dos entradas de menú que dicen lo mismo. */
export const EJES = {
  fisica: {
    key: 'fisica',
    ruta: '/organizacion/distribucion',
    label: 'Estructura física',
    desc: 'Dónde está la empresa: sus regionales, sus sucursales y sus centros de trabajo.',
    /* LAS COLUMNAS DE LA TABLA. El camino que la vista recorta se enseñaba como un renglón gris
       encima de cada fila y se repetía cuatro veces seguidas —"Santa Cruz › Casa Matriz › Torre
       Empresarial" delante de cada una de las cuatro áreas de esa oficina—. En una tabla eso es
       UNA COLUMNA: se lee alineado, una sola vez por fila y sin empujar nada. */
    columnas: [
      { key: 'padre', label: 'Depende de' },
      /* CADA NIVEL LLAMA A SU SITIO DE OTRA MANERA. La regional y la sucursal guardan «ciudad»;
         la oficina, que baja hasta el detalle, guarda «localidad» —su último nivel de división
         política—. Es la misma columna «dónde está», así que en vez de partirla en dos se dice
         de qué campos puede salir, y se usa el primero que tenga algo. */
      { key: 'ciudad', label: 'Ciudad', claves: ['ciudad', 'localidad'] },
      /* SIN ALINEAR A LA DERECHA. Iba como número, y a la derecha se alinea lo que se compara
         dígito a dígito: importes, cantidades, porcentajes —donde las unidades quedan bajo las
         unidades y una columna torcida canta—. «REG-01» no es una magnitud, es un identificador:
         se lee de izquierda a derecha como el nombre de al lado, y pegado al borde derecho
         quedaba lejísimos de su cabecera y de su fila. */
      { key: 'codigo', label: 'Código' },
      { key: 'responsable', label: 'Responsable' },
      /* LA LÍNEA DE NEGOCIO, EN LOS DOS EJES. Una empresa reparte por sucursales y otra por áreas,
         así que la columna tiene que existir en las dos tablas — la de lugares y la de unidades—.
         Solo se dibuja si la empresa declaró alguna línea. */
      { key: 'linea', label: 'Unidad de negocio' },
    ],
    vistas: [
      { key: 'region', label: 'Regionales', tipos: ['region'],
        desc: 'Agrupan sucursales por geografía. Sirven para filtrar y consolidar, no para mandar.' },
      { key: 'sucursal', label: 'Sucursales', tipos: ['sucursal'],
        desc: 'Las sedes desde las que opera la empresa. Cada una agrupa sus centros de trabajo.' },
      { key: 'centro', label: 'Centros de trabajo', tipos: ['centro'],
        desc: 'Centros de trabajo dentro de una sucursal. Es donde se marca asistencia.' },
    ],
  },
  organizacional: {
    key: 'organizacional',
    ruta: '/organizacion/estructura',
    label: 'Estructura organizacional',
    desc: 'Cómo se organiza el trabajo por dentro, y con qué se clasifica cada cargo.',
    /* La columna «Sucursal» es el dato DEDUCIDO del que venimos hablando: la sucursal no se declara
       en el área, se lee subiendo por los padres. Puesta como columna deja de ser una promesa
       del modelo y se vuelve algo que se mira todos los días. */
    columnas: [
      /* DÓNDE VIVE, y por eso «Pertenece a» y no «Depende de»: el padre de un cargo es su unidad
         organizacional, y una unidad no manda sobre nadie —manda una jefatura—. Para una unidad
         dentro de otra se lee igual de bien: la subárea pertenece a su área. */
      { key: 'padre', label: 'Pertenece a' },
      /* DE QUIÉN DEPENDE: la jefatura, que es la línea que dibuja el organigrama. Solo tiene
         sentido en Cargos —una unidad no le responde a nadie— así que la tabla la enseña ahí y
         no en las otras vistas del eje. */
      { key: 'jefe', label: 'Depende de' },
      { key: 'sucursal', label: 'Sucursal' },
      { key: 'responsable', label: 'Responsable' },
      { key: 'linea', label: 'Unidad de negocio' },
    ],
    vistas: [
      { key: 'negocios', label: 'Unidades de negocio', tipos: ['negocio'],
        desc: 'Los frentes en los que la empresa separa lo que hace.' },
      { key: 'unidades', label: 'Unidades organizacionales', tipos: ['unidad'],
        desc: 'Cómo se organiza el trabajo por dentro, con la jerarquía que tenga.' },
      { key: 'cargos', label: 'Cargos', tipos: ['cargo'],
        desc: 'La definición de cada rol: en qué unidad vive y con qué nivel de mando.' },

    ],
    /* EL NIVEL DE MANDO no es un nodo del árbol —no cuelga de nada— pero pertenece a este eje: es
       lo que ordena el organigrama de arriba abajo, y sin él un cargo no se termina de definir.
       Vive en Configuración, que es donde ya están los peldaños, y se llega desde acá porque es
       acá donde alguien lo va a buscar. Existía desde siempre; lo que no existía era un sitio
       evidente donde encontrarlo.

       SOLO ÉL. «Tipos de cargo» llegó a estar en esta lista y se fue: es un catálogo de tres
       palabras que se elige dentro de la ficha del cargo y no una pantalla a la que nadie va a
       entrar. Un submenú se gasta rápido, y cada entrada que no se usa le quita peso a las que
       sí. */
    catalogos: [
      { label: 'Niveles de mando', path: '/organizacion/mandos' },
    ],
  },
}

/* LAS PESTAÑAS DE UN EJE, DEDUCIDAS DE LOS PELDAÑOS Y NO ESCRITAS A MANO.
   Eran una lista fija por eje, y por eso un nivel propio —«Obra», «Sede», «Faena»— podía
   crearse en la configuración y después no tenía dónde listarse: existía en el árbol y no en el
   menú. Deducirlas cierra ese hueco solo.

   TRES REGLAS, Y SALEN LAS DE SIEMPRE:

   1. Una vista que lista UN SOLO peldaño toma su nombre del plural de ese peldaño. Renombrar
      «Sucursal» a «Agencia» renombra la pestaña, la entrada del menú y el título de la tabla de
      una sola vez, que es lo que uno espera al renombrar algo.

   2. Los peldaños que `vistas` agrupa a propósito siguen agrupados. «Unidades organizacionales»
      es área y subárea juntas porque en el vocabulario de la empresa es UN concepto con su
      jerarquía, no dos entradas de menú que dicen lo mismo. Ahí el nombre lo pone la vista y no
      el peldaño: no hay un plural que sirva para los dos.

   3. Un peldaño propio arma su propia pestaña, en su posición. No hace falta preguntarle nada
      más al usuario: ya dijo cómo se llama en plural y en qué eje vive.

   El ORDEN es el de la lista de peldaños, así que «Distrito» insertado entre región y sucursal
   aparece entre sus dos pestañas sin que nadie ordene nada. */
export function vistasDeEje(ejeKey, niveles) {
  const base = EJES[ejeKey]?.vistas || []
  const agrupadas = new Set(base.flatMap(v => v.tipos))
  const salida = []

  lista(niveles).forEach(t => {
    if (t.eje !== ejeKey || !estaEncendido(t.key, niveles)) return
    /* El peldaño sin vista no arma pestaña. Sigue existiendo en el árbol y en el menú de
       «Agregar» de quien lo permita; lo que no tiene es una lista propia donde vivir. */
    if (t.sinVista) return
    if (!agrupadas.has(t.key)) {
      salida.push({ key: t.key, label: t.plural || t.label, tipos: [t.key], desc: t.desc, propia: true })
      return
    }
    const v = base.find(x => x.tipos.includes(t.key))
    if (salida.some(x => x.key === v.key)) return
    salida.push(v.tipos.length === 1 ? { ...v, label: t.plural || v.label, desc: t.desc || v.desc } : v)
  })
  return salida
}

/* LOS PELDAÑOS APAGADOS DE UN EJE, para nombrarlos al final de la fila de pestañas. No es lo
   mismo que «las vistas que no salen»: acá interesa el peldaño —es lo que se va a encender— y
   por eso se listan de a uno aunque su vista agrupe dos. */
export const nivelesApagadosDe = (ejeKey, niveles) =>
  lista(niveles).filter(t => t.eje === ejeKey && !estaEncendido(t.key, niveles))

/* Todos los tipos de un eje que están encendidos. Es el «todo» de la pantalla y el respaldo de
   `tiposDeVista` cuando la vista pedida ya no existe. */
export const tiposDeEje = (ejeKey, niveles) =>
  lista(niveles).filter(t => t.eje === ejeKey && estaEncendido(t.key, niveles)).map(t => t.key)

/* DE DÓNDE VIENE UN NODO Y A DÓNDE SE VUELVE, según su TIPO y no según por dónde se llegó.
   La ficha tenía la ruta de vuelta escrita a mano —siempre a Estructura organizacional—, así que
   cancelar la creación de una regional te dejaba en el otro eje. Un nodo pertenece a la lista que
   lo lista; de ahí saliste y ahí esperas volver. */
export function listaDe(tipo, niveles) {
  const nivel = tipoDe(tipo, niveles)
  const eje = EJES[nivel?.eje]
  if (!eje) return { ruta: '/organizacion/distribucion', label: 'Estructura' }
  /* SIN LISTA PROPIA SE VUELVE A LA DE ARRIBA. Un puesto no tiene pantalla donde listarse, pero sí
     tiene de dónde cuelga: la flecha de atrás y el «Cancelar» de su ficha llevan a la lista de su
     cargo, que es de donde se salió. Sin esto caían en la pantalla del eje, sin pestaña puesta. */
  if (nivel?.sinVista && nivel.soloBajo?.length) return listaDe(nivel.soloBajo[0], niveles)
  const vista = vistasDeEje(eje.key, niveles).find(v => v.tipos.includes(tipo))
  return {
    ruta: vista ? `${eje.ruta}?ver=${vista.key}` : eje.ruta,
    label: vista?.label || eje.label,
  }
}

/* Los tipos que una vista muestra, ya filtrados por lo que la empresa encendió. */
export function tiposDeVista(eje, vistaKey, niveles) {
  const vista = vistasDeEje(eje.key, niveles).find(v => v.key === vistaKey)
  /* El respaldo excluye los peldaños sin vista: cayendo acá —vista borrada, URL vieja— la tabla
     mezclaría los puestos dentro de la lista de cargos, que es justo lo que se quitó. */
  const base = vista
    ? vista.tipos
    : tiposDeEje(eje.key, niveles).filter(k => !tipoDe(k, niveles)?.sinVista)
  return base.filter(k => estaEncendido(k, niveles))
}

/* El árbol recortado a un conjunto de tipos. Cada nodo se recuelga de su ANCESTRO MÁS CERCANO
   que también esté en el conjunto: así "Área Comercial", que en el árbol completo cuelga de una
   sucursal, aparece en la raíz de la vista organizacional en vez de desaparecer con su padre.

   Y se devuelve lo que quedó en el medio (`saltados`) para poder enseñarlo en gris: un área que
   sale sin decir en qué sucursal está es un dato a medias. */
export function filasEje(nodos, tipos) {
  const delEje = n => tipos.includes(n.tipo)
  const porId = new Map(nodos.map(n => [n.id, n]))

  const recolgar = n => {
    const saltados = []
    let p = n.padreId ? porId.get(n.padreId) : null
    let v = 0
    while (p && !delEje(p) && v < 20) { saltados.unshift(p); p = p.padreId ? porId.get(p.padreId) : null; v += 1 }
    return { padre: p && delEje(p) ? p.id : null, saltados }
  }

  const visibles = nodos.filter(delEje).map(n => ({ nodo: n, ...recolgar(n) }))
  const filas = []
  const bajar = (padre, nivel) => {
    visibles.filter(v => v.padre === padre).forEach(v => {
      filas.push({ nodo: v.nodo, nivel, saltados: v.saltados })
      bajar(v.nodo.id, nivel + 1)
    })
  }
  bajar(null, 0)
  return filas
}

/* Filas del árbol en profundidad, con su sangría. Los huérfanos —padre borrado o apagado— salen
   al final y en la raíz, porque desaparecer de la lista es peor que verse fuera de lugar. */
export function filasArbol(nodos) {
  const filas = []
  const vistos = new Set()
  const bajar = (padre, nivel) => {
    hijosDe(padre, nodos).forEach(n => {
      if (vistos.has(n.id)) return
      vistos.add(n.id)
      filas.push({ nodo: n, nivel })
      bajar(n.id, nivel + 1)
    })
  }
  bajar(null, 0)
  nodos.forEach(n => { if (!vistos.has(n.id)) filas.push({ nodo: n, nivel: 0, huerfano: true }) })
  return filas
}

/* LOS COLORES DEL ÁREA, que bajan a todo lo que le cuelga. Es lo que hace legible un organigrama
   grande: se sigue una rama por el color antes que por la línea. Seis y no veinte: más de seis
   dejan de distinguirse de un vistazo. */
export const COLORES_AREA = [
  { valor: 'azul',    etiqueta: 'Azul',     hex: '#2563eb' },
  { valor: 'verde',   etiqueta: 'Verde',    hex: '#16a34a' },
  { valor: 'ambar',   etiqueta: 'Ámbar',    hex: '#d97706' },
  { valor: 'rojo',    etiqueta: 'Rojo',     hex: '#dc2626' },
  { valor: 'violeta', etiqueta: 'Violeta',  hex: '#7c3aed' },
  { valor: 'cian',    etiqueta: 'Cian',     hex: '#0891b2' },
]
export const hexDeColor = v => COLORES_AREA.find(c => c.valor === v)?.hex || null

/* QUÉ PIDE LA FICHA DE CADA TIPO. Los descriptores son los mismos que come `TarjetaCampos`, así
   que estas fichas se leen y se editan exactamente igual que las de empresa y sucursal sin una
   línea de pantalla nueva.

   Solo `sucursal` pide datos fiscales: el código ante el SIN es de la sucursal, y un depósito que no
   factura no tiene por qué inventarse uno. Una región no pide dirección porque la dirección la
   tienen sus sucursales, no ella. */
/* LA FICHA HABLA CON LA PALABRA DE LA EMPRESA, no con la nuestra. Los títulos y los avisos de
   este formulario decían «la oficina» escrito a mano, así que una empresa que renombrara el nivel
   a «Almacén» seguía leyendo «Información de la oficina» al darlo de alta: exactamente la mentira
   que el renombrado vino a sacar. Ahora entra el peldaño y de él sale la palabra.

   Y SE ESCRIBE SIN GÉNERO. «De qué sucursal cuelga y quién responde por ella» funciona con
   «oficina» y se rompe con «almacén», y no hay forma de saber el género de una palabra que el
   usuario va a escribir mañana. Así que las frases se dicen sin artículo ni pronombre que
   apunten al nivel —«De qué cuelga, dónde queda y quién responde»— que además se leen mejor. */
/* `valores` ES LO QUE HAY ESCRITO EN EL FORMULARIO, y entra acá porque hay campos que dependen
   de otro: el cargo del responsable no tiene sentido hasta que haya un responsable. Es opcional a
   propósito —quien solo quiere saber QUÉ campos existe un nivel, como la tabla al decidir sus
   columnas, no tiene ningún formulario que pasar— y por eso todo lo que lo use se pregunta antes
   si está. */
export function gruposDe(tipo, { personas, padres, ciudades, nivel, niveles, valores, lugares, mandos, jefes, vinculos, heredado, negocios }) {
  /* ══ A QUÉ LÍNEA DE NEGOCIO PERTENECE ═══════════════════════════════════════════════════
     Con la misma forma que «Dónde está»: el desplegable enseña la RESPUESTA —la que hereda o la
     que declara— y el campo de al lado dice DE DÓNDE SALE. Son dos preguntas y estaban bien
     separadas allá, así que no hay motivo para juntarlas acá.

     SIN NINGUNA LÍNEA ES UNA RESPUESTA: hay áreas que sirven a todos los frentes por igual
     —Recursos Humanos, Contabilidad— y obligarlas a elegir una inventaría un reparto que nadie
     decidió. Se llama «transversal» y se elige de la lista, para poder volver a ella.

     LA TARJETA NO APARECE SI LA EMPRESA NO TIENE LÍNEAS. Un desplegable con una sola opción
     —«transversal»— es una pregunta sin respuestas posibles. */
  const hereda = !!heredado?.linea
  /* Los que no la declaran solo tienen tarjeta si heredan algo: sin nada arriba no hay nada que
     enseñar, y ofrecerles el desplegable sería dejarlos declarar por la puerta de atrás. */
  const puedeDeclararLinea = DECLARAN_LINEA.includes(tipo)
  const tarjetaLinea = negocios?.length && (hereda || puedeDeclararLinea) ? [{
    titulo: 'A qué negocio pertenece',
    desc: hereda
      ? 'Lo hereda de su rama: alguien más arriba ya lo declaró, y por eso acá se lee y no se elige. Así una empresa reparte sus frentes en un solo escalón y no en dos.'
      : 'El frente del negocio al que pertenece esto y todo lo que cuelgue de ello. Si sirve a todos por igual, no pertenece a ninguno en particular.',
    campos: [hereda || !puedeDeclararLinea
      ? {
        key: 'lineaHeredada', label: 'Unidad de negocio', col: 'c-medio',
        deducido: heredado.linea,
        ayuda: `Sale de «${heredado.lineaDe}». Se cambia en su ficha, y desde ahí baja a todo lo que cuelgue.`,
      }
      : {
        key: 'lineaNegocio', label: 'Unidad de negocio', col: 'c-medio', tipo: 'lista',
        opciones: [{ valor: RAIZ, etiqueta: 'Transversal: ninguna en particular' }, ...negocios],
        ph: 'Transversal: ninguna en particular', vacio: 'Transversal: ninguna en particular',
        ayuda: 'Lo que declares acá baja a todo lo que cuelgue de esto. Sirve para consolidar —cuánta gente y cuánto cuesta cada frente— y no dibuja nada en el organigrama.',
      }],
  }] : []
  const comoSeLlama = nivel?.label || 'nivel'
  /* LA CIUDAD ES UNA LISTA SI SABEMOS DE QUÉ PAÍS, y texto libre si no.
     Una lista cerrada que no contiene tu ciudad es peor que ningún catálogo: obliga a elegir
     una que no es, o a inventarse un «Otra» que después no agrupa con nada. Las ciudades salen
     del país que la empresa declaró en Datos de la empresa; si no lo declaró —o su país todavía
     no está en el catálogo— el campo se escribe a mano y nadie miente. */
  /* EL AVISO DE «TODAVÍA NO HAY LISTA» LO PONE QUIEN LLAMA, porque no siempre es el mismo país
     el que falta: en la sucursal es el de la empresa —arriba, en Datos de la empresa— y en la
     regional es el suyo propio, que está dos campos más a la izquierda. Mandar a alguien a otra
     pantalla a contestar algo que tiene delante es peor que no decirle nada. */
  const campoCiudad = (extra = {}, sinLista = 'Elige el país en Datos de la empresa para poder elegirla de una lista.') => (ciudades?.length
    ? { key: 'ciudad', label: 'Ciudad', tipo: 'lista', opciones: ciudades,
        ph: 'Elige una ciudad', ...extra }
    : { key: 'ciudad', label: 'Ciudad', ph: 'Santa Cruz de la Sierra',
        ayuda: sinLista, ...extra })

  /* «DEPENDE DE» SOLO CUANDO HAY DE DÓNDE ELEGIR.
     Es el campo que arma el árbol —sin él una sucursal no puede meterse dentro de una regional—
     pero salía siempre, incluso cuando la lista tenía una sola opción: «Ninguna». Un campo
     obligatorio con una única respuesta posible no es una pregunta, es un trámite; y en la
     empresa recién creada, que es cuando más se crean nodos, era el caso de todos.

     Con una sola opción el valor se pone solo —el formulario ya nace con ella— y el campo
     desaparece. En cuanto exista un segundo padre posible, vuelve. */
  /* EL RÓTULO NOMBRA AL PELDAÑO DE ARRIBA: «De qué región depende» y no «Depende de». Decía lo
     genérico porque encima de una sucursal puede haber una región Y una unidad de negocio, y un
     rótulo que nombra a una miente en la otra; pero de las dos, la que se elige casi siempre es
     la de al lado, y por decir la verdad en el caso raro se estaba callando en el común.

     SALE DEL NIVEL, NO ESCRITO A MANO, que es lo que lo salva del renombrado: quien le diga
     «Distrito» a su región lee «De qué distrito depende». Si no hay ningún peldaño encendido
     arriba, vuelve a «Depende de».

     Y SE ESCRIBE «DE QUÉ … DEPENDE» PARA NO TENER GÉNERO. «Región de la que depende» obliga a
     saber si la palabra es femenina, y la palabra la escribe la empresa mañana: «Almacén de la
     que depende» está mal. La forma con «de qué» funciona con cualquiera. Es la misma regla que
     ya siguen los títulos y avisos de esta ficha. */
  /* LOS LUGARES LLEGAN CRUDOS —los nodos del eje físico tal cual— y no como opciones ya hechas,
     porque acá dentro hay que filtrarlos por lo que se eligió en el campo de al lado, y para eso
     hace falta saber de quién cuelga cada uno. Una lista de pares {valor, etiqueta} ya perdió esa
     información. */
  const nodosLugar = lugares || []

  // Si un nodo cuelga de `id`, a cualquier profundidad. Es lo que acota una lista a una rama.
  const bajoDe = (n, id) => {
    let p = n
    for (let i = 0; p && i < 30; i += 1) {
      if (p.padreId === id) return true
      p = nodosLugar.find(x => x.id === p.padreId)
    }
    return false
  }

  /* Las opciones de un campo que pide un lugar: de un tipo, dentro de lo elegido más arriba, y
     sin ofrecerse a sí mismo ni a su descendencia —un centro dentro de su propio hijo es un
     ciclo, y el árbol se recorre en bucle infinito—. */
  const opcionesDe = (t, dentroDe, excluir) => nodosLugar
    .filter(n => n.tipo === t
      && (!dentroDe || bajoDe(n, dentroDe))
      && n.id !== excluir
      && !(excluir && bajoDe(n, excluir)))
    .map(n => ({ valor: n.id, etiqueta: n.nombre }))

  /* Para quien pide UN lugar cualquiera: el tipo delante, que es lo que distingue dos homónimos.

     Y CON LA FORMA DEL ÁRBOL, no en el orden en que se crearon. Plana, la lista ponía «Casa Matriz
     Equipetrol» y «Oriente» como hermanas cuando una está dentro de la otra, y encontrar las
     sucursales de una regional era leerlas todas. Sangradas, cada sucursal cuelga de su regional y
     cada centro de su sucursal: es la misma pregunta que se contesta con dos campos encadenados
     —primero la región, después la sucursal— pero en un solo campo, que es lo que corresponde
     porque acá se elige UN lugar y no una ruta.

     Y ES UN SOLO CAMPO POR UNA RAZÓN DE FONDO: una unidad puede operar a nivel de regional, de
     sucursal o de centro de trabajo. Con campos encadenados habría que dejar los de abajo vacíos,
     y ahí «vacío» significaría dos cosas —«no lo contesté» y «opera a nivel de regional»—, que es
     justo la ambigüedad que este módulo se dedica a no tener.

     La `pista` es para cuando se busca: escribiendo, la sangría se pierde —los resultados salen de
     ramas distintas— y lo que ubica a cada uno pasa a ser de qué cuelga. */
  const opcionesLugar = arbolDeLugares(nodosLugar, niveles)
  const nivelPadre = nivelSobre(tipo, niveles)
  const campoPadre = padres.length > 1 ? [{
    key: 'padreId', col: 'c-tercio', tipo: 'lista',
    label: nivelPadre ? `De qué ${nivelPadre.label.toLowerCase()} depende` : 'Depende de',
    ph: 'Ninguna', opciones: padres,
  }] : []

  const tarjetaJerarquia = campoPadre.length ? [{
    titulo: 'Jerarquía',
    desc: 'De qué nivel cuelga dentro de la estructura. Si no cuelga de ninguno, queda directo bajo la empresa.',
    campos: [{ ...campoPadre[0], col: 'c-medio' }],
  }] : []

  const identidad = extra => ({
    titulo: 'Identificación',
    desc: 'Cómo se llama y de qué depende.',
    campos: [
      { key: 'nombre', label: 'Nombre', requerido: true, col: 'c-tercio',
        ph: tipo === 'region' ? 'Santa Cruz' : tipo === 'sucursal' ? 'Casa Matriz' : 'Recursos Humanos',
        faltaMsg: 'Sin nombre no hay forma de elegirlo al colgarle algo debajo.' },
      ...campoPadre,
      ...extra,
    ],
  })

  const operacion = campos => ({ titulo: 'Operación', desc: 'Quién responde por esto y si sigue activo.', campos })

  /* El cargo que la persona tiene HOY en el directorio. Se lee cada vez que se dibuja la ficha,
     así que un ascenso se ve solo. */
  const cargoDe = nombre => (personas || []).find(p => p.nombre === nombre)?.cargo || ''

  const responsable = {
    key: 'responsable', label: 'Responsable', col: 'c-tercio', tipo: 'persona',
    personas, ph: 'Sin responsable asignado',
    vacioTitulo: 'Aún no tienes ningún colaborador registrado',
    vacioNota: 'Cuando des de alta a tu gente en Colaboradores aparecerá aquí. Mientras tanto puedes ponerte a ti.',
  }
  /* EL ESTADO, DE VUELTA EN EL FORMULARIO. Lo había sacado porque estaba en tres sitios —acá,
     el distintivo del título y «Cambiar estado» del menú— y porque al crear algo la respuesta ya
     se sabe. Vuelve a pedido: en la ficha se corrige de una pasada junto con lo demás, sin salir
     a la tabla a buscar el menú. Los otros dos caminos siguen: el distintivo para leerlo de
     reojo, el menú para cambiarlo sin entrar.

     A un ancho de tercio, no de dos columnas: así cierra su fila y la nota le cabe en un
     renglón, que era el hueco de antes. */
  const estado = {
    key: 'estado', label: 'Estado', requerido: true, col: 'c-tercio', tipo: 'lista',
    opciones: Object.entries(estadosDe(tipo)).map(([valor, e]) => ({ valor, etiqueta: e.label })),
    ayuda: `${verboApagar(tipo)} no es borrar: deja de ofrecerse y conserva su historia.`,
    faltaMsg: `Está ${Object.values(estadosDe(tipo)).map(e => e.label.toLowerCase()).join(' o ')}: no hay un tercer estado.`,
  }

  /* «DE QUÉ CUELGA», EN SU PROPIA TARJETA Y NUNCA OBLIGATORIO. Una sucursal puede colgar de una
     regional o de nada: hay empresas de una sola ciudad que no tienen regionales, y obligarlas
     a inventarse una para poder crear su única sucursal es hacerles dibujar una jerarquía que no
     existe. Por eso la primera opción de la lista es «Ninguna», y no cuelgue de ningún nivel
     quiere decir que queda directo bajo la empresa.

     Y POR ESO LA TARJETA ENTERA DESAPARECE cuando «Ninguna» es la única respuesta posible
     —una empresa recién creada, sin regionales ni unidades de negocio—: un campo obligatorio con
     una sola respuesta no es una pregunta, es un trámite, y de los que más molestan porque salen
     justo cuando más nodos se están creando. En cuanto exista la primera regional, vuelve.

     EL RÓTULO DEL CAMPO NOMBRA AL PELDAÑO DE ARRIBA —«De qué región depende»— y la línea gris
     de abajo avisa que la lista puede traer más de un nivel: encima de una sucursal también puede
     haber una unidad de negocio, y cada opción del desplegable dice de qué tipo es. */
  /* LA MISMA UBICACIÓN PARA LOS DOS NIVELES QUE SON UN SITIO. La regional y la sucursal preguntan
     exactamente lo mismo —dónde queda y por dónde se le llama— y lo tuvieron escrito por separado:
     dos listas idénticas que se parecen hasta que alguien toca una. Misma lección que la pastilla
     de estado, que también estaba escrita dos veces.

     EL PAÍS SE PREGUNTA ACÁ AUNQUE LA EMPRESA YA TENGA EL SUYO, y no es repetirlo: el de la
     empresa es de dónde es la empresa, y de él salía hasta hoy la lista de ciudades de TODO el
     sistema. Una empresa boliviana con una sucursal en Asunción no tenía cómo decirlo —el
     desplegable solo le ofrecía ciudades de Bolivia—. Con el país acá, las ciudades salen del país
     de ESTE nodo, y nace contestado con el de arriba, que es el caso de casi todos.

     NO PIDE DEPARTAMENTO, Y ESA AUSENCIA ES UNA DECISIÓN. Era texto libre, así que no agrupaba
     nada —«Santa Cruz» y «Sta. Cruz» son dos zonas distintas para una máquina—; se deduce de la
     ciudad; y no se llama igual en todas partes —departamento, estado, provincia— así que el
     rótulo necesitaba una línea gris debajo para explicarse, que casi siempre es la señal de que
     un campo no va ahí. Si algún día hace falta agrupar por división política, el sitio es el
     catálogo de ciudades —cada ciudad sabiendo de cuál es— y entonces sale deducido y agrupa de
     verdad. El centro de trabajo sí las pide, y ahí sí van: eso es el domicilio que aparece en los
     papeles laborales, no una forma de ordenar reportes. */
  const tarjetaUbicacion = desc => ({
    titulo: 'Ubicación',
    desc,
    campos: [
      { key: 'pais', label: 'País', requerido: true, col: 'c-tercio', tipo: 'lista',
        opciones: NOMBRES_PAISES, ph: 'Elige un país',
        ayuda: 'De él sale la lista de ciudades de acá al lado.',
        faltaMsg: 'Sin país no hay lista de ciudades que ofrecer acá al lado.' },
      campoCiudad({ requerido: true, col: 'c-tercio',
        /* SIN NOMBRAR LA PLANILLA. El motivo escrito era «ordena las planillas y los reportes por
           zona», y las planillas son de un módulo que todavía no existe: un aviso que apoya lo
           que pide en algo que quien lee no puede ver no explica nada, y da por hecho un alcance
           que no está decidido. Lo que sí es verdad hoy es que sin ciudad esta sede no se puede
           ubicar ni agrupar con las de al lado. */
        faltaMsg: 'Sin ciudad no hay forma de ubicarla ni de agruparla con las de su zona.' },
        'Elige primero el país y la ciudad se elige de una lista.'),
      { key: 'direccion', label: 'Dirección', col: 'c-tercio',
        ph: 'Av. San Martín 200, Equipetrol' },
      /* A media fila cada uno: arriba quedan país, ciudad y dirección —tres tercios justos— y
         estos dos cierran la segunda fila con 6+6. */
      { key: 'telefono', label: 'Teléfono', ph: '+591 3 000 0000', col: 'c-medio', html: 'tel' },
      { key: 'correo', label: 'Correo electrónico', ph: 'contacto@ejemplo.com', col: 'c-medio', html: 'email' },
    ],
  })

  /* EL CARGO NO SE PREGUNTA HASTA QUE HAY A QUIÉN PREGUNTÁRSELO, y cuando aparece NO SE ESCRIBE:
     se lee de su ficha. Copiarlo lo convertiría en una foto —el día que asciendan a esa persona,
     su ficha diría una cosa y este nodo otra para siempre—. `deducido` enseña lo que dice hoy,
     cada vez que se dibuja, y no hay caja donde teclearlo ni en modo edición. Se cambia donde
     vive: en Colaboradores. */
  /* Los dos campos del responsable, para las fichas que lo llevan dentro de su primera tarjeta. */
  const camposResponsable = [
    { ...responsable, col: valores?.responsable ? 'c-medio' : 'c-tercio' },
    ...(valores?.responsable ? [{
      key: 'cargoResponsable', label: 'Cargo del responsable', col: 'c-medio',
      deducido: cargoDe(valores.responsable), soloEdicion: true,
      ayuda: 'Sale de su ficha en Colaboradores. Si cambia de cargo, esto cambia con ella.',
    }] : []),
  ]
  const anchoDesc = valores?.responsable ? 'c-todo' : 'c-ancho'


  /* LA SUCURSAL ES LA ÚNICA CON IDENTIDAD FISCAL, y por eso es la única que pregunta un código
     ante el SIN. Todo lo demás que se le pregunta —dónde queda, quién responde— se le pregunta
     igual que a la regional, y sale de las mismas tarjetas: son el mismo tipo de cosa, un sitio
     con nombre y dirección, y solo se diferencian en lo fiscal y en quién cuelga de quién. */
  if (tipo === 'sucursal') {
    return [
      {
        titulo: 'Información general',
        desc: 'Cómo se llama, con qué se la identifica y si sigue operando.',
        campos: [
          { key: 'nombre', label: 'Nombre', requerido: true, col: 'c-tercio', ph: 'Sucursal Equipetrol',
            faltaMsg: 'Sin nombre no hay forma de elegirla al asignarle gente.' },
          /* SIN LÍNEA GRIS, IGUAL QUE EN LA REGIONAL. Llegó a tener una que explicaba de dónde
             sale el número y quién lo pide —«El número con el que factura ante el SIN», y antes
             de eso también «Es lo único fiscal propio de una sucursal»— y se fue entera: quien
             da de alta una sucursal sabe qué es su código, y el ejemplo del campo ya enseña la
             forma que tiene. Lo fiscal tampoco se explica ya en la descripción de la pestaña
             «Sucursales»: mientras el producto no toque planillas, el impuesto no es lo que
             distingue a este nivel —la sede lo es— y nombrarlo obligaba a explicarlo. */
          { key: 'codigo', label: 'Código de sucursal', ph: '0001', col: 'c-tercio' },
          estado,
          /* SE PROBÓ UN «TIPO DE SUCURSAL» —comercial, administrativa, operativa, otra— y duró lo
             que tardó en mirarse. No lo leía nadie: no filtraba, no agrupaba, no salía en la tabla
             y no cambiaba lo que se le puede colgar debajo. Un campo que solo se guarda cuesta una
             pregunta en cada alta y no devuelve nada.

             SUS CATEGORÍAS NO SON EXCLUYENTES, que es el defecto de fondo. Una sucursal de verdad
             vende Y lleva su administración; obligarla a elegir una de cuatro hace que todo el
             mundo marque «Comercial» y que la columna no distinga nada. Y «Otra» era el aviso: la
             opción que existe porque la lista no alcanza.

             LO QUE DE VERDAD DICE A QUÉ SE DEDICA UNA SUCURSAL YA ESTÁ EN EL ÁRBOL: una con
             «Ventas» dentro es comercial y una con «Contabilidad» y «RRHH» es administrativa. Es
             el mismo argumento con el que se fue «Departamento» —un dato que se deduce no se
             pregunta— y el mismo con el que el cargo del responsable dejó de escribirse.

             Y SI UNA EMPRESA SÍ DISTINGUE de verdad entre sus tipos de local, el sistema ya tiene
             una respuesta mejor: un peldaño propio. Renombrar «Sucursal» a «Agencia» o agregar
             «Punto de venta» cambia la palabra en las pestañas, los menús y los formularios; un
             desplegable escondido en la ficha no cambia nada de eso. */
          ...camposResponsable,
          { key: 'descripcion', label: 'Descripción', col: anchoDesc, tipo: 'texto',
            ph: 'Qué se hace en esta sucursal, desde cuándo…' },
        ],
      },
      ...tarjetaJerarquia,
      tarjetaUbicacion('Dónde queda y por dónde se le llega.'),
      ...tarjetaLinea,
    ]
  }

  /* LA REGIÓN AGRUPA Y YA: no manda, no factura y no liquida. Por eso su ficha es corta.
     Se fue todo lo de sueldos que llegó a estar acá —los cinco parámetros de planilla primero,
     y después «Orden para planillas» y «Dirección para liquidaciones»—. Son datos de nómina
     dentro de la pantalla con la que se monta la estructura: quien la está montando no los sabe
     todavía, y quien lleva planillas no entra por acá. Cuando exista el módulo de sueldos, ese
     es su sitio, y ahí podrá pedirlos sabiendo a qué regional se los pide. */
  if (tipo === 'region') {
    /* TRES TARJETAS PORQUE SON TRES PREGUNTAS. Estuvo en una sola, y una sola tarjeta con diez
       campos obliga a leerlos todos para encontrar el que se venía a cambiar: el teléfono queda
       al lado del código y la dirección debajo del estado, sin nada que diga dónde termina una
       cosa y empieza la otra. Quien da de alta una regional contesta en este orden —cómo se
       llama, dónde queda, quién responde— y cada tarjeta es una de esas tres paradas.

       SIGUE VALIENDO LA CUENTA DE LAS DOCE COLUMNAS: ninguna fila deja un hueco a su derecha.
       La descripción es la que se estira, porque es la única a la que el ancho le da igual.

       LO OBLIGATORIO ES LO QUE NO SE PUEDE DEDUCIR NI DEJAR PARA DESPUÉS: nombre, país,
       departamento, ciudad y estado. El resto se rellena cuando se sepa —el responsable puede no
       estar todavía dado de alta, el teléfono puede no existir todavía— porque una regional
       creada a medias vale más que una regional que no se pudo crear. */
    return [
      {
        titulo: 'Información general',
        /* NO DICE «DE QUÉ DEPENDE» PORQUE UNA REGIONAL NO DEPENDE DE NADA: es la cima del eje
           físico, no hay peldaño encima de ella y su ficha nunca tuvo ese campo. El subtítulo
           prometía una pregunta que la tarjeta no hace, que es peor que no decir nada: quien lo
           lee busca el campo y no lo encuentra. */
        desc: 'Cómo se llama, con qué se la identifica y si sigue operando.',
        campos: [
          { key: 'nombre', label: 'Nombre', requerido: true, col: 'c-tercio', ph: 'Regional Santa Cruz',
            faltaMsg: 'Sin nombre no hay forma de elegirla al colgarle una sucursal.' },
          /* EL RÓTULO DICE DE QUÉ ES EL CÓDIGO, y por eso se fue la línea gris que lo explicaba.
             Decía «Código» a secas y debajo, en 10 px, «no es fiscal: eso es de la sucursal»: una
             aclaración que solo hace falta porque el rótulo no aclaraba. Con el nivel dentro del
             rótulo no hay con qué confundirlo —el de la sucursal se llama «Código de sucursal» y
             está en otra ficha— y la explicación sobra.

             Y sale del peldaño, no escrito a mano: una empresa que renombre el nivel a «Zona» lee
             «Código de zona» sin que nadie toque esto. */
          { key: 'codigo', label: `Código de ${comoSeLlama.toLowerCase()}`, ph: 'SCZ-01', col: 'c-tercio' },
          estado,
          ...camposResponsable,
          /* Nombre, código y estado cierran la primera fila con tres tercios; lo que quede de la
             segunda —después del responsable y su cargo— se lo lleva la descripción, que es el
             único campo al que el ancho le da igual. */
          { key: 'descripcion', label: 'Descripción', col: anchoDesc,
            tipo: 'texto', ph: 'Qué abarca esta regional, con qué sucursales y desde cuándo…' },
        ],
      },
      ...tarjetaJerarquia,
      tarjetaUbicacion('Desde dónde opera y por dónde se le llega.'),
      ...tarjetaLinea,
    ]
  }

  /* EL CENTRO DE TRABAJO ES EL NIVEL DONDE DE VERDAD SE SABE DÓNDE ESTÁ LA GENTE: la sucursal
     es la sede, el centro de trabajo es el domicilio donde se marca asistencia.

     DE QUÉ REGIONAL Y DE QUÉ SUCURSAL CUELGA NO SE PREGUNTA DOS VECES. «Depende de» elige la
     sucursal —es lo que arma el árbol— y la regional se deduce subiendo por los padres, así que
     no hay un campo para ella: la cadena entera se lee arriba, en las migas de la ficha
     («FarmaVida › Oriente › Casa Matriz»), que además son enlaces. Un campo que solo repite un
     dato deducido es un campo que algún día se contradice con el árbol.

     LO DE PLANILLAS NO ESTÁ ACÁ, igual que en la regional: es dato de nómina en la pantalla con
     la que se monta la estructura, y su sitio es el módulo de sueldos.

     LOS CUATRO DE LA DIVISIÓN POLÍTICA —departamento, provincia, municipio, localidad— van como
     texto y no como listas: el catálogo cambia de un país a otro y el sistema se vende a varios.
     Una lista cerrada que no contiene tu municipio es peor que ningún catálogo. */
  /* EL CENTRO DE TRABAJO, EN CINCO TARJETAS. Era UNA sola con once campos seguidos —nombre, de
     qué cuelga, código, departamento, provincia, municipio, localidad, dirección, estado,
     responsable, horario— y ahí adentro conviven cuatro preguntas que no se parecen: qué es esto,
     de qué parte de la empresa depende, en qué punto del mapa está, y qué papel juega en lo
     laboral. Once campos en fila obligan a leerlos todos para encontrar el que se vino a tocar.

     Y CUATRO OBLIGATORIOS DE DIVISIÓN POLÍTICA se fueron: departamento, provincia, municipio y
     localidad, todos texto libre. Eran la mitad de los campos exigidos para dar de alta un
     depósito, no agrupaban nada —«Santa Cruz» y «Sta. Cruz» son dos sitios distintos para una
     máquina—, y el departamento se deduce de la ciudad. Es el mismo argumento con el que ya se
     habían ido de la sucursal. Queda la ciudad, que sí sale de un catálogo, y la dirección.

     El número de obligatorios casi no cambia —seis antes, seis ahora— pero lo que hay que
     CONTESTAR sí: el estado nace en «Activa» y el país se hereda de lo que tenga encima, así que
     quedan cuatro, y ninguno es una división política escrita a mano. */
  if (tipo === 'centro') {
    /* Cada campo vive solo si su peldaño tiene nodos: sin regionales creadas, «Regional» sería un
       desplegable con una sola opción y el nombre de un escalón que esta empresa no usa. */
    const camposJerarquia = [
      ...(opcionesDe('region').length ? [{
        key: 'regionalId', label: 'Regional', col: 'c-tercio', tipo: 'lista',
        opciones: [{ valor: RAIZ, etiqueta: 'Ninguna' }, ...opcionesDe('region')],
        ph: 'Ninguna', ayuda: 'Opcional. Acota las sucursales de al lado.',
      }] : []),
      ...(opcionesDe('sucursal').length ? [{
        key: 'sucursalId', label: 'Sucursal', col: 'c-tercio', tipo: 'lista',
        opciones: [{ valor: RAIZ, etiqueta: 'Ninguna' }, ...opcionesDe('sucursal', sinRaiz(valores?.regionalId))],
        ph: 'Ninguna', ayuda: 'Opcional. Solo las de la regional elegida.',
      }] : []),
      ...(opcionesDe('centro', null, valores?.id).length ? [{
        key: 'centroPadre', label: 'Centro de trabajo superior', col: 'c-tercio', tipo: 'lista',
        opciones: [{ valor: RAIZ, etiqueta: 'Ninguno' }, ...opcionesDe('centro', sinRaiz(valores?.sucursalId), valores?.id)],
        ph: 'Ninguno', ayuda: 'Opcional. Un centro puede estar dentro de otro.',
      }] : []),
    ]

    return [
      {
        titulo: 'Información general',
        desc: 'Cómo se llama, qué clase de sitio es y si sigue operando.',
        campos: [
          { key: 'nombre', label: 'Nombre', requerido: true, col: 'c-tercio',
            ph: 'Oficina Central Santa Cruz',
            faltaMsg: 'Sin nombre no hay forma de elegirlo al asignarle gente.' },
          { key: 'codigo', label: 'Código', ph: 'CT-SCZ-01', col: 'c-tercio' },
          { key: 'tipoCentro', label: 'Tipo de centro de trabajo', requerido: true, col: 'c-tercio',
            tipo: 'lista', opciones: TIPOS_CENTRO, ph: 'Elige uno',
            faltaMsg: 'Sin el tipo, un almacén y una oficina se leen igual en toda la aplicación.' },
          { key: 'descripcion', label: 'Descripción', tipo: 'texto', col: 'c-ancho',
            ph: 'Describe brevemente este centro…' },
          { ...estado, col: 'c-tercio' },
        ],
      },
      /* TRES CAMPOS, Y CADA UNO FILTRA AL SIGUIENTE.
         Los tres desplegables se piden por separado —regional, sucursal, centro superior— y los
         tres son opcionales: un centro puede colgar directo de la empresa. El riesgo de pedirlo
         así es contestar «Occidente» y «Equipetrol», que está en Oriente: tres respuestas para
         una sola pregunta y ninguna forma de saber cuál vale.

         SE RESUELVE ACOTANDO LA LISTA, no prohibiendo el campo: elegida una regional, «Sucursal»
         solo ofrece las suyas, y elegida una sucursal, «Centro superior» solo ofrece los que
         están dentro. Así los tres campos existen y ninguna combinación imposible se puede
         elegir. Lo que se guarda es el más específico de los tres, que es lo que cuelga en el
         árbol; los otros dos quedan de camino, no de dato aparte. */
      ...(camposJerarquia.length ? [{
        titulo: 'Jerarquía',
        desc: 'De qué cuelga dentro de la estructura. Sin ninguno, queda directo bajo la empresa.',
        /* «NINGUNA» ES UNA OPCIÓN DE LA LISTA Y NO UN MARCADOR GRIS. Los tres campos son
           opcionales, pero el gris que dice «Ninguna» solo se ve mientras no hayas elegido nada:
           elegida una sucursal por error, no había forma de volver a dejarla vacía —había que
           salir sin guardar—. Un campo opcional que no se puede desandar no es opcional.

           Y elegida a propósito, «Ninguna» dice algo distinto de un campo en blanco: en blanco es
           «no lo contesté», elegido es «este centro no cuelga de ninguna regional». Leyendo la
           ficha esa diferencia es la que separa un dato que falta de una decisión tomada. */
        campos: [
          ...camposJerarquia,
        ],
      }] : []),
      {
        titulo: 'Ubicación',
        desc: 'El domicilio del centro: es el que sale en los papeles laborales.',
        campos: [
          { key: 'pais', label: 'País', requerido: true, tipo: 'lista',
            col: valores?.pais === 'Bolivia' ? 'c-tercio' : 'c-medio',
            opciones: NOMBRES_PAISES, ph: 'Elige un país',
            ayuda: 'De él sale la lista de ciudades de acá al lado.',
            faltaMsg: 'Sin país no hay lista de ciudades que ofrecer acá al lado.' },
          /* EL DEPARTAMENTO ES SOLO DE BOLIVIA, y no por geografía sino por honestidad: se
             intentó traducir la palabra a cada país —Provincia en Argentina, Estado en México— y
             el remedio traía dos problemas. Uno, que en Chile la división se llama «Región» y esa
             palabra ya es un PELDAÑO de esta estructura: dos «regiones» en el mismo formulario,
             una del país y otra de la empresa, se confunden aunque las dos estén bien. Dos, que
             traducir el rótulo no traduce el dato: sigue siendo texto libre y sigue sin agrupar
             nada.

             Fuera de Bolivia el campo directamente no sale. Un formulario más corto es mejor que
             uno que pregunta algo que no sabe cómo se llama, y la ciudad —que sí sale de un
             catálogo— ya ubica al centro. */
          ...(departamentosDe(valores?.pais) ? [{
            key: 'departamento', label: 'Departamento', requerido: true, col: 'c-tercio',
            tipo: 'lista', opciones: departamentosDe(valores.pais), ph: 'Elige uno',
            ayuda: 'Acota las ciudades de acá al lado.',
            faltaMsg: 'Es el primer nivel de la dirección en los formularios oficiales.',
          }] : []),
          /* LA CIUDAD SALE DEL DEPARTAMENTO cuando hay uno elegido, y del país cuando no. Dos
             listas sueltas dejan guardar «Departamento: La Paz · Ciudad: Sucre»; acotada, esa
             combinación no se puede ni elegir. Es la misma regla con la que la sucursal se acota
             por su regional.

             Y SIN DEPARTAMENTO la fila quedaría a ocho de doce, así que país y ciudad se reparten
             la fila entera: es la misma rejilla contestando a lo que hay, no dos diseños. */
          (() => {
            const lista = ciudadesDeDepartamento(valores?.pais, valores?.departamento) || []
            const col = departamentosDe(valores?.pais) ? 'c-tercio' : 'c-medio'
            const falta = 'Es lo que ubica al centro y lo agrupa con los de su zona.'
            return lista.length
              ? { key: 'ciudad', label: 'Ciudad o municipio', requerido: true, col, tipo: 'lista',
                  opciones: lista, ph: 'Elige una ciudad', faltaMsg: falta }
              : { key: 'ciudad', label: 'Ciudad o municipio', requerido: true, col,
                  ph: 'Santa Cruz de la Sierra', faltaMsg: falta,
                  ayuda: 'Elige primero el país y la ciudad se elige de una lista.' }
          })(),
          /* LA SEGUNDA FILA ES «CÓMO SE LLEGA», los tres en tercios: la zona acota el barrio, la
             dirección da la calle y la referencia dice qué buscar al llegar. Se leen juntos porque
             se escriben juntos, mirando el mismo papel.

             SIN CÓDIGO POSTAL: en Bolivia no se usa —no hay reparto por código y nadie lo sabe de
             memoria— así que se llenaba con ceros o se dejaba vacío siempre. La referencia hace el
             trabajo que acá sí se hace.

             Y SIN UBICACIÓN EN MAPA: un selector de mapa necesita un proveedor con su clave y su
             costo por carga, que es una decisión de producto y no una pantalla; y un par de
             coordenadas escritas a mano no las acierta nadie. Un campo que no se puede llenar bien
             es peor que ninguno. Vuelve cuando haya proveedor. */
          { key: 'zona', label: 'Zona o barrio', ph: 'Equipetrol', col: 'c-tercio' },
          /* LA DIRECCIÓN NO ES OBLIGATORIA. Era el único obligatorio de esta fila y no hay forma
             de garantizarlo: se da de alta un centro para poder asignarle gente, y la calle exacta
             aparece después —o la sabe otra persona—. Un asterisco que frena el alta por un dato
             que se completa en el segundo día enseña a rellenar cualquier cosa con tal de guardar,
             y entonces el campo miente en vez de estar vacío. */
          { key: 'direccion', label: 'Dirección', col: 'c-tercio', ph: 'Av. San Martín 123' },
          { key: 'referencia', label: 'Referencia', ph: 'Frente a la plaza', col: 'c-tercio' },
        ],
      },
      /* SIN TARJETA LABORAL, Y ES LA MISMA REGLA DE SIEMPRE ACÁ: lo que pertenece a un módulo que
         todavía no existe no se pregunta hoy. El centro principal, el identificador ante la
         autoridad laboral y la fecha de inicio de operaciones solo tienen sentido cuando haya algo
         que los use —planillas, contratos, papeles— y mientras tanto son tres campos que hay que
         explicar en cada alta y que nadie va a mirar.

         El día que ese módulo exista vuelven acá. Lo único que hay que recordar entonces es que
         «principal» no es un sí/no cualquiera: solo puede haber uno en toda la empresa, y eso se
         resuelve al guardar desmarcando el anterior, no con un aviso. */
      {
        titulo: 'Responsable',
        desc: 'Quién responde por este centro.',
        campos: [
          { ...responsable, col: 'c-medio' },
          /* El cargo se completa solo y no se escribe nunca: sale de la ficha de la persona en
             Colaboradores, así que un ascenso se refleja acá sin que nadie lo copie. */
          ...(valores?.responsable ? [{
            key: 'cargoResponsable', label: 'Cargo', col: 'c-medio',
            deducido: cargoDe(valores.responsable), soloEdicion: true,
            ayuda: 'Se completa con el cargo que esa persona tiene hoy en Colaboradores.',
          }] : []),
        ],
      },
      ...tarjetaLinea,
    ]
  }

  /* LA UNIDAD ORGANIZACIONAL, EN CUATRO TARJETAS QUE SON CUATRO PREGUNTAS DISTINTAS:
     qué es, de quién depende, dónde opera y quién responde por ella. Estaban las dos primeras
     mezcladas en «Identificación» —el nombre y el padre juntos— y eso funciona mientras el padre
     sea un trámite; acá es la mitad del organigrama y merece su sitio. */
  if (tipo === 'unidad') {
    /* El lugar SOLO SE PREGUNTA ARRIBA DE TODO. Colgando de otra unidad, dónde opera ya está
       contestado por su rama, y volver a preguntarlo es ofrecer la oportunidad de contradecirla.
       Lo que hereda se lee igual, abajo, en «Lo que sale solo del árbol». */
    const primerNivel = !valores?.padreId || valores.padreId === RAIZ
    /* NO DECLARAR NADA SE LLAMA DISTINTO SEGÚN DE QUÉ CUELGUE, porque significa distinto: en
       primer nivel no hay de quién heredar y la respuesta es «toda la empresa»; colgando de otra,
       es «el de mi rama», y entonces el desplegable dice cuál es sin que haya que ir a buscarlo. */
    /* EL CAMPO ENSEÑA EL SITIO Y NADA MÁS. Decía «Hereda de "Tecnología": Sucursal Casa Matriz»
       —la respuesta y su procedencia apretadas en un renglón de desplegable— y lo que uno mira
       ahí es dónde está. De dónde sale lo cuenta el campo de al lado, que para eso está. */
    const vacioLugar = primerNivel || !heredado?.lugarDe ? 'Toda la empresa' : heredado.lugar

    const propio = valores?.ubicacion && valores.ubicacion !== RAIZ

    const lugar = opcionesLugar.length ? [{
      titulo: 'Dónde está',
      desc: primerNivel
        ? 'La región, la sucursal o el centro de trabajo al que pertenece esta unidad y todo lo que cuelgue de ella. Si no pertenece a ninguno en particular, vale para toda la empresa.'
        : 'La región, la sucursal o el centro de trabajo al que pertenece. Sin declarar ninguno usa el de la unidad de la que cuelga; declarando uno propio, ese pasa a valer para todo lo que tenga debajo.',
      campos: [
        {
          key: 'ubicacion', label: 'Está en', col: 'c-medio', tipo: 'lista',
          /* Igual que en el centro: no declarar nada es una respuesta, no la ausencia de una, así
             que se elige de la lista y se puede volver a ella. */
          opciones: [{ valor: RAIZ, etiqueta: vacioLugar }, ...opcionesLugar],
          ph: vacioLugar, vacio: vacioLugar,
          ayuda: primerNivel
            ? 'Es la sede de la unidad, no la de su gente: cada puesto puede declarar otra si trabaja en otro sitio.'
            : 'Es la sede de la unidad, no la de su gente. Declarar una propia no contradice a la de arriba: la afina para esta rama —«Almacén La Paz» dentro de «Logística», que está en Casa Matriz—.',
        },
        /* DE DÓNDE SALE EL DATO, AL LADO Y NO DENTRO. El desplegable ya no tiene que explicarse a
           sí mismo: enseña el sitio y ya. Que sea heredado o propio es OTRA pregunta, y tenía la
           media fila de la derecha vacía esperándola. */
        ...(primerNivel ? [] : [{
          key: 'lugarDeDonde', label: 'De dónde sale', col: 'c-medio',
          deducido: propio
            ? 'Declarado en esta unidad'
            : `Heredado de «${heredado?.lugarDe || 'la unidad superior'}»`,
          ayuda: propio
            ? 'Esta unidad declara el suyo, así que no depende del de arriba.'
            : 'Cambiando el sitio de esa unidad, este cambia con ella. Para que no cambie, declara uno propio aquí al lado.',
        }]),
      ],
    }] : []

    return [
      {
        titulo: 'Información general',
        desc: 'Cómo se llama, qué clase de unidad es y si sigue vigente.',
        campos: [
          /* TRES TERCIOS Y LA FILA CIERRA. El nombre iba a media fila y con dos tercios detrás
             sumaba catorce de doce, así que el tercer campo se caía al renglón siguiente y dejaba
             un hueco a la derecha del segundo. La rejilla es de doce y cada fila tiene que sumar
             doce: es lo único que hace que un formulario se lea como una tabla y no como una
             lista de campos apilados de cualquier manera. */
          { key: 'nombre', label: 'Nombre', requerido: true, col: 'c-tercio',
            ph: 'Departamento de Recursos Humanos',
            faltaMsg: 'Sin nombre no hay forma de elegirla al colgarle un cargo.' },
          { key: 'codigo', label: 'Código', ph: 'RRHH-01', col: 'c-tercio' },
          /* QUÉ CLASE DE UNIDAD ES. Obligatorio porque es lo que la ubica en el organigrama de
             un vistazo: «Ventas» no dice si es una gerencia o un equipo de tres personas, y esa
             es la primera pregunta de cualquiera que lo mire. */
          { key: 'tipoUnidad', label: 'Tipo de unidad', requerido: true, col: 'c-tercio',
            tipo: 'lista', opciones: TIPOS_UNIDAD, ph: 'Elige uno',
            faltaMsg: 'Sin el tipo, el organigrama no distingue una dirección de un equipo.' },
          /* SIN COLOR. Era una decisión de dibujo metida en el formulario de un dato: al dar de
             alta una gerencia nadie está pensando de qué color se va a ver en el organigrama, y
             el campo obligaba a pasar por encima de él en cada alta. Si el color hace falta, el
             sitio donde se decide es el organigrama —mirando el dibujo, que es lo único que
             contesta si se distingue de la rama de al lado— y no una ficha de datos. */
          { key: 'corto', label: 'Nombre corto', ph: 'RRHH', col: 'c-tercio',
            ayuda: 'El que entra en la tarjeta del organigrama cuando el largo no cabe.' },
          { ...estado, col: 'c-tercio' },
          /* QUIÉN RESPONDE NO ES DE QUIÉN DEPENDE, y por eso lo dice. «Responsable» es una
             persona y es un dato de contacto: quién contesta cuando hay que preguntar algo de
             esta unidad. «Bajo el mando de», dos tarjetas más abajo, es un PUESTO y es lo que
             dibuja la línea del organigrama. Puestos uno al lado del otro sin aclararlo, se
             confunden —y llenar el equivocado deja el dibujo colgado de otra parte—. */
          { ...responsable, col: 'c-tercio',
            ayuda: 'Quién contesta por esta unidad. No dibuja la línea del organigrama: eso lo hace «Bajo el mando de».' },
          /* SALE CON EL RESPONSABLE Y SE VA CON ÉL, así que la descripción cede cuatro columnas
             cuando está y se las queda cuando no. La rejilla es de doce y cada fila tiene que
             sumar doce: es lo único que hace que un formulario se lea como una tabla. */
          ...(valores?.responsable ? [{
            key: 'cargoResponsable', label: 'Cargo del responsable', col: 'c-tercio',
            deducido: cargoDe(valores.responsable), soloEdicion: true,
            ayuda: 'Sale de su ficha en Colaboradores. Si cambia de cargo, esto cambia con ella.',
          }] : []),
          { key: 'descripcion', label: 'Descripción', tipo: 'texto',
            col: valores?.responsable ? 'c-ancho' : 'c-todo',
            ph: 'Qué hace esta unidad, de qué responde…' },
        ],
      },
      /* DÓNDE ESTÁ Y DE QUIÉN DEPENDE SON DOS PREGUNTAS, y por eso son dos campos en la misma
         tarjeta. «Unidad superior» AGRUPA —dice en qué rama vive— y «Bajo el mando de» DIBUJA LA
         LÍNEA: de qué puesto concreto de esa rama cuelga.

         EL SEGUNDO FALTABA ACÁ Y ESTABA EN EL MODAL DEL ORGANIGRAMA, que es la peor forma de
         repartir un campo: una unidad creada desde la tabla nacía sin decir de quién depende, y el
         dibujo no tenía dónde colgarla. Ahora que las dos pantallas escriben el mismo dato, la que
         no pregunta es la que deja el trabajo a medias.

         SE INTENTÓ DEDUCIRLO —colgar la unidad de la cabeza de su superior— y se cae en cuanto esa
         superior tiene tres puestos sin jefe: el dibujo elegía uno adivinando.

         SOLO SI CUELGA DE OTRA UNIDAD. En primer nivel depende de la empresa y no de ningún
         puesto, así que la pregunta no tiene respuesta posible. Es la misma regla que ya aplica
         «Dónde opera» dos tarjetas más abajo. */
      {
        titulo: 'Jerarquía',
        desc: 'De qué unidad depende dentro del organigrama. Sin ninguna, es una unidad de primer nivel.',
        campos: [
          {
            key: 'padreId', label: 'Unidad organizacional superior', col: 'c-medio', tipo: 'lista',
            opciones: padres, ph: 'Ninguna',
            ayuda: 'Una unidad puede colgar de otra sin límite de profundidad.',
          },
          /* EN PRIMER NIVEL EL CAMPO NO DESAPARECE: CONTESTA. Lo escondí y el resultado fue que
             una unidad que cuelga de la empresa —el caso más común al empezar— no enseñaba el
             campo por ningún lado, así que parecía que no existía. Un campo que aparece y
             desaparece según otro campo obliga a descubrir la regla para creerle a la pantalla.

             Colgando de la empresa la respuesta es una sola y se sabe, así que se enseña como lo
             que es: un dato deducido, sin caja y sin desplegable. Es la misma forma que ya usan la
             unidad y el nivel de mando heredados en la ficha del puesto. */
          primerNivel
            ? {
              key: 'mandoDeducido', label: 'Bajo el mando de', col: 'c-medio',
              deducido: 'La empresa',
              ayuda: 'En primer nivel la unidad cuelga de la empresa y no de un puesto. Elige una unidad superior para poder decir de quién depende.',
            }
            : {
              key: 'mandoId', label: 'Bajo el mando de', col: 'c-medio', tipo: 'lista',
              opciones: [{ valor: RAIZ, etiqueta: 'Nadie: cuelga de la unidad' }, ...(jefes || [])],
              ph: 'Nadie: cuelga de la unidad', vacio: 'Nadie: cuelga de la unidad',
              ayuda: 'El puesto del que depende. Se elige entre los de la unidad superior.',
              vacioTitulo: 'Su unidad superior todavía no tiene puestos',
              vacioNota: 'En cuanto tenga uno, se puede elegir aquí de quién depende esta.',
            },
        ],
      },
      ...lugar,
      ...tarjetaLinea,
    ]
  }

  /* LA UNIDAD DE NEGOCIO NO TIENE RESPONSABLE, Y SE QUEDA EN UNA SOLA TARJETA.
     Tenía la de «Operación» —responsable y estado— y sin el responsable esa tarjeta pasaba a ser
     un recuadro con un solo campo y un subtítulo que prometía «quién responde por esto». Con dos
     datos no hacen falta dos secciones: se lee de un vistazo o no se lee.

     Y NO TIENE RESPONSABLE PORQUE NO MANDA: agrupa para medir, como la Región. Quien dirige el
     negocio dirige la unidad organizacional que cuelga de él, y ahí sí hay un responsable. La
     descripción del peldaño se corrigió con esto —prometía un gerente que la ficha no guarda—. */
  /* EL CARGO: LA DEFINICIÓN DE UN ROL, NO LA SILLA.
     «Ejecutiva Comercial» es un cargo; las tres sillas de Ejecutiva Comercial en Santa Cruz son
     puestos. Por eso acá no se pregunta ni sucursal ni quién lo ocupa: eso es del puesto, que se
     administra en su pantalla y hereda de acá el nombre, la unidad y el nivel.

     TRES PREGUNTAS Y NADA MÁS: cómo se llama, en qué unidad vive, y qué manda. El resto —perfil,
     banda salarial, competencias— es un módulo que todavía no existe, y pedirlo hoy sería llenar
     una ficha para nadie. */
  if (tipo === 'cargo') {
    return [
      {
        titulo: 'Información general',
        desc: 'Qué rol es, con qué nivel manda y cuántos ocupantes admite.',
        campos: [
          { key: 'nombre', label: 'Nombre del cargo', requerido: true, col: 'c-tercio',
            ph: 'Ejecutiva Comercial',
            faltaMsg: 'Sin nombre no hay forma de elegirlo al abrir un puesto.' },
          /* «CÓDIGO DEL CARGO» Y NO «CÓDIGO». Es el del rol en el catálogo —el que va en la
             descripción de puesto y en la banda salarial— y abajo, en cada silla, hay otro que
             identifica la plaza. Con los dos rotulados «Código» en la misma pantalla, el de
             arriba parecía el mismo campo repetido. Es la misma regla que ya seguían la sucursal
             y la regional: el rótulo dice de qué es el código. */
          { key: 'codigo', label: 'Código del cargo', ph: 'CAR-014', col: 'c-tercio' },
          { ...estado, col: 'c-tercio' },
          /* CUÁNTA GENTE PUEDE HABER EN ESTE CARGO A LA VEZ. Es el cupo autorizado: no cuenta a
             nadie, pone un techo. Quien lo ocupa se resuelve en los puestos —cada puesto es una
             silla— y este número dice cuántas sillas se pueden llegar a abrir.

             VACÍO ES «SIN LÍMITE» Y NO «FALTA». La mayoría de los cargos no tiene tope: hay tantas
             ejecutivas comerciales como plazas se abran. Obligar a poner un número inventaría un
             límite que nadie decidió, así que el campo es opcional y su vacío tiene nombre propio
             —se lee «Sin límite», no un guion—. */
          /* EL NIVEL DE MANDO SALE DEL CATÁLOGO DE LA EMPRESA, no de una lista escrita acá: se
             renombra y se reordena en «Niveles de mando», y este campo lo sigue.

             SOLO SI MANDA EN LA LÍNEA. Un staff o un tercerizado se dibujan al costado, así que
             preguntarles a qué altura mandan no tiene respuesta. */
          ...((valores?.tipoCargo || 'colaborador') === 'colaborador' ? [{
            key: 'nivelMando', label: 'Nivel de mando', requerido: true, col: 'c-tercio',
            tipo: 'lista', opciones: mandos || [], ph: 'Elige uno',
            ayuda: 'Se administran en «Niveles de mando», en el menú de la izquierda.',
            faltaMsg: 'El nivel de mando es lo que ordena el organigrama de arriba abajo.',
          }] : []),
          /* OBLIGATORIO, IGUAL QUE EN EL MODAL DEL DIBUJO. Era opcional acá y obligatorio allá, y
             con las dos pantallas escribiendo el mismo dato eso significaba que la validez de un
             cargo dependía de por qué puerta se creó. Cuesta cero: llega con «Colaborador». */
          { key: 'tipoCargo', label: 'Tipo de cargo', requerido: true, col: 'c-tercio',
            tipo: 'lista', opciones: TIPOS_CARGO.map(t => ({ valor: t.key, etiqueta: t.label })),
            ph: 'Colaborador',
            ayuda: 'Staff y outsourcing se dibujan al costado de la línea de mando.',
            faltaMsg: 'Sin la clase, el dibujo no sabe si va en la línea de mando o al costado.' },
          /* CUÁNTA GENTE PUEDE HABER EN ESTE CARGO A LA VEZ. Es el cupo autorizado: no cuenta a
             nadie, pone un techo, y por eso es del ROL y no de sus sillas. Vacío es «sin límite»
             y no «falta»: la mayoría de los cargos no tiene tope. */
          { key: 'maxPersonas', label: 'Máximo de ocupantes', col: 'c-tercio', html: 'number',
            min: 1, max: 50, ph: 'Sin límite', vacio: 'Sin límite',
            ayuda: 'Con 4, el cargo tiene cuatro sillas: las que no estén cubiertas figuran como vacantes.' },
          { key: 'descripcion', label: 'Descripción', tipo: 'texto', col: 'c-todo',
            ph: 'De qué responde este cargo…' },
        ],
      },
      /* EL NIVEL DE MANDO NO EXISTE PARA STAFF NI TERCERIZADOS, y por eso desaparece en vez de
         quedarse vacío. El dibujo los pone al costado de la línea de mando —eso es lo que
         significa «asiste sin mandar»— así que preguntarles a qué altura mandan es una pregunta
         sin respuesta posible.

         ERA OBLIGATORIO SIEMPRE Y EL MODAL DEL DIBUJO YA LO ESCONDÍA para esos dos, así que un
         cargo de staff creado allá no se podía guardar acá: la ficha exigía un nivel que la otra
         pantalla no deja poner y que el modelo no quiere. Con las dos escribiendo el mismo dato,
         eso pasó de rareza a callejón sin salida. */
      /* LA UNIDAD NO SE PREGUNTA ACÁ: se dibuja con las sillas, que es lo que depende de ella.
         La ficha la sigue exigiendo —un cargo suelto no se puede dibujar en ningún organigrama—
         pero esa comprobación vive en la pantalla, junto al campo. */
      ...tarjetaLinea,
    ]
  }

  /* EL PUESTO: DÓNDE Y QUIÉN, PORQUE EL QUÉ YA LO DIJO EL CARGO.
     Casi todo lo que define a un puesto lo hereda: la unidad organizacional y el nivel de mando
     salen del cargo del que cuelga y se ENSEÑAN, no se preguntan. Volver a pedirlos permitiría
     que una silla de «Ejecutiva Comercial» declare estar en Contabilidad, que es una contradicción
     que después nadie sabe cuál de las dos resolver.

     LO QUE SÍ ES SUYO SON TRES COSAS: de qué cargo es, dónde se trabaja y quién la ocupa. */
  if (tipo === 'puesto') {
    return [
      {
        titulo: 'El puesto',
        desc: 'De qué cargo es esta silla. Lo demás lo hereda de él.',
        campos: [
          { key: 'padreId', label: 'Cargo', requerido: true, col: 'c-tercio',
            tipo: 'lista', opciones: padres.filter(o => o.valor !== RAIZ), ph: 'Elige uno',
            faltaMsg: 'Un puesto es la silla de un cargo: sin cargo no hay puesto.' },
          { key: 'codigo', label: 'Código del puesto', ph: 'PU-0042', col: 'c-tercio',
            ayuda: 'Lo que distingue una silla de otra del mismo cargo.' },
          { ...estado, col: 'c-tercio' },
          /* LO HEREDADO SE ENSEÑA CON LA MISMA CARA QUE UN DATO, pero sin caja ni en edición: es
             lo que hace evidente que el cargo manda y que corregirlo se hace allá. */
          { key: 'unidadHeredada', label: 'Unidad organizacional', col: 'c-medio',
            deducido: heredado?.unidad || '',
            ayuda: 'Sale del cargo. Se cambia en su ficha.' },
          { key: 'mandoHeredado', label: 'Nivel de mando', col: 'c-medio',
            deducido: heredado?.mando || '',
            ayuda: 'Sale del cargo. Se cambia en su ficha.' },
        ],
      },
      /* DE QUIÉN DEPENDE, QUE ES LA MITAD DEL ORGANIGRAMA Y NO ESTABA.
         El puesto hereda de su cargo el QUÉ —la unidad, el nivel— pero de quién depende es suyo:
         dos sillas del mismo cargo en dos sedes pueden responderle a dos jefes distintos, y en los
         datos de ejemplo ya pasa. Vivía solo en el modal del dibujo, así que un puesto creado desde
         la tabla nacía sin línea y el organigrama no tenía dónde colgarlo.

         NO ES OBLIGATORIO PORQUE «DE NADIE» ES UNA RESPUESTA: el puesto más alto del organigrama no
         depende de ninguno, y esa es una opción de la lista con su nombre y no un hueco.

         SIN OTRO PUESTO AL LADO NO HAY PREGUNTA, y entonces se contesta sola: el primero de todos
         es la cima porque no hay nadie más. Mismo criterio que «Bajo el mando de» de la unidad. */
      {
        titulo: 'Línea de mando',
        desc: 'De qué puesto depende este. Es la línea que el organigrama dibuja.',
        campos: [
          (jefes || []).length
            ? {
              key: 'reportaA', label: 'De quién depende', col: 'c-medio', tipo: 'lista',
              opciones: [{ valor: RAIZ, etiqueta: 'De nadie: es la cima' }, ...jefes],
              ph: 'De nadie: es la cima', vacio: 'De nadie: es la cima',
              ayuda: 'De acá sale la línea de mando: quién aprueba y a quién le llega la bandeja.',
            }
            : {
              key: 'reportaDeducido', label: 'De quién depende', col: 'c-medio',
              deducido: 'De nadie: es la cima',
              /* DOS RAZONES DISTINTAS PARA EL MISMO HUECO, y decir una sola miente en la otra. Sin
                 candidatos puede ser porque es el primer puesto que existe, o porque TODOS los
                 demás cuelgan de él —el caso del gerente general, donde la frase «todavía no hay
                 ningún otro puesto» se lee delante de una lista de treinta y ocho—. */
              ayuda: vinculos?.otrosPuestos
                ? 'Todos los demás puestos cuelgan de este, así que no queda ninguno por encima.'
                : 'Todavía no hay ningún otro puesto del que pueda depender.',
            },
          /* LO QUE SE MIRA Y NO SE TOCA. Los apoyos funcionales y las coordinaciones se declaran en
             el organigrama y no acá, y es a propósito: son líneas que cruzan de una rama a otra y
             solo se entienden viéndolas dibujadas —en una tabla son una lista de nombres que no
             dice nada—. Pero callarlas era peor: quien mira la ficha no tenía forma de saber que
             este puesto trabaja en otras dos unidades. Se enseñan, y para cambiarlas se va al
             dibujo, que es la misma regla que ya usa la hoja de la unidad con sus apoyos. */
          { key: 'apoyaEn', label: 'También trabaja en', col: 'c-medio',
            deducido: vinculos?.apoyos || '', vacio: 'Solo en su unidad',
            ayuda: 'Las unidades donde trabaja sin pertenecer a ellas. Púlsalo para cambiarlas.' },
          { key: 'coordinaCon', label: 'Coordina con', col: 'c-todo',
            deducido: vinculos?.coordina || '', vacio: 'Con nadie declarado',
            ayuda: 'Coordinan trabajo sin ser línea de mando. Se declara en el organigrama.' },
        ],
      },
      {
        titulo: 'Dónde y quién',
        desc: 'El sitio donde se trabaja esta silla y la persona que la ocupa.',
        campos: [
          /* EL SITIO PUEDE SER CUALQUIERA DEL EJE FÍSICO y no solo un centro de trabajo. Una
             empresa que todavía no partió sus sucursales en centros tiene que poder decir que la
             silla está en Casa Matriz, y el organigrama de siempre ancla sus plazas justamente a
             una sucursal. Elegido el sitio, lo que esté por encima se deduce solo. */
          /* MISMA LLAVE QUE LA UNIDAD (`ubicacion`) Y NO UNA PROPIA. De ella sube la deducción
             que llena la columna «Sucursal» de la tabla y el bloque «Lo que sale solo del árbol»;
             con un nombre distinto por peldaño habría que enseñarle a esa cuenta un caso nuevo
             cada vez que aparece un tipo de nodo. */
          { key: 'ubicacion', label: 'Dónde se trabaja', col: 'c-medio', tipo: 'lista',
            opciones: [{ valor: RAIZ, etiqueta: 'Sin asignar' }, ...opcionesLugar],
            ph: 'Sin asignar', vacio: 'Sin asignar',
            ayuda: 'La sucursal sale de acá: no hace falta declararla aparte.' },
          /* VACÍO ES «VACANTE», y por eso lo dice con esa palabra en vez de un guion: un puesto sin
             nadie no es un dato que falte, es una plaza abierta —que además es lo que Onboarding
             viene a buscar—. */
          { ...responsable, key: 'ocupante', label: 'Quién lo ocupa', col: 'c-medio',
            ph: 'Vacante', vacio: 'Vacante',
            vacioTitulo: 'Aún no tienes ningún colaborador registrado',
            vacioNota: 'Cuando des de alta a tu gente en Colaboradores aparecerá aquí.' },
        ],
      },
    ]
  }

  if (tipo === 'negocio') {
    const anchoLateral = campoPadre.length ? 'c-tercio' : 'c-medio'
    /* QUÉ AGRUPA, DE SOLO LECTURA Y A PROPÓSITO. El dato se escribe en la ficha de cada nodo
       —«esta sucursal es de Farmacias»— porque es ahí donde uno está cuando lo sabe. Repetir la
       asignación acá sería una segunda puerta para el mismo dato, y dos puertas para un dato
       terminan discrepando. Lo que sí hace falta es VERLO junto: cuántos y cuáles.

       Es la misma forma que ya usa la unidad organizacional con sus apoyos funcionales. */
    const queAgrupa = valores?.id ? [{
      titulo: 'Qué agrupa',
      desc: 'Lo que declaró pertenecer a esta línea. Se asigna desde la ficha de cada uno, en «A qué negocio pertenece».',
      campos: [{
        key: 'agrupa', label: 'Le pertenecen', col: 'c-todo',
        deducido: vinculos?.agrupa || '',
        vacio: 'Todavía nadie declaró pertenecer a esta línea',
        ayuda: 'Lo que cuelgue de cada uno la hereda, así que no hace falta declararla dos veces en la misma rama.',
      }],
    }] : []
    return [{
      titulo: 'Información general',
      desc: 'Cómo se llama y si sigue vigente.',
      campos: [
        /* EL NOMBRE SE ESCRIBE, Y LOS EJEMPLOS VIVEN DENTRO DEL CAMPO.
           Fue un desplegable de ocho palabras más «Otro», y «Otro» abría un segundo campo al
           lado. La idea era normalizar —que no convivan «Corporativo» y «Corporativa»— pero eso
           solo importa dentro de UNA empresa, y ahí la línea de negocio se escribe una vez y
           después se elige de la lista de nodos, no de este catálogo. Lo que sí pasaba en cada
           alta era el baile de dos campos, porque ningún catálogo iba a adivinar la «Cadena de
           frío» de una distribuidora de vacunas.

           Los ejemplos siguen estando: adentro del campo, donde sugieren sin obligar. Salen de
           `NEGOCIOS_COMUNES` para que haya una sola lista y no dos que se separen. */
        { key: 'nombre', label: 'Nombre', requerido: true, col: anchoLateral,
          ph: `${NEGOCIOS_COMUNES.slice(0, 3).join(', ')}…`,
          faltaMsg: 'Sin nombre no hay forma de elegirla al colgarle algo debajo.' },
        ...campoPadre.map(c => ({ ...c, col: 'c-tercio' })),
        { ...estado, col: anchoLateral },
      ],
    }, ...queAgrupa]
  }

  // Un peldaño propio de la empresa: no es un lugar, así que no pide dirección ni horario.
  return [
    identidad([]),
    operacion([{ ...responsable, col: 'c-medio' }, { ...estado, col: 'c-medio' }]),
  ]
}

/* LA SEMILLA SON LOS DATOS DE VERDAD, y nada más. Cada sucursal de hoy entra como nodo
   `sucursal` sin padre; cada unidad, como `unidad`, conservando de quién cuelga. Ya no hace
   falta decidir si es «área» o «subárea» según tenga padre o no: es la misma clase de cosa a
   distinta profundidad, y la profundidad la dice el padre.

   Los ids se conservan tal cual, y por eso los cargos siguen encontrando su unidad: el contador
   de cargos de cada rama es real, no un número puesto a mano.

   HUBO UN EJEMPLO DE TECNOSOL de relleno para cuando el organigrama está vacío, y se sacó: una
   pantalla que abre con la empresa de otro obliga a distinguir cada vez qué es tuyo y qué es
   decorado. Vacía dice la verdad —todavía no hay áreas cargadas— y el botón de agregar está
   justo ahí. */
/* EL NOMBRE DE QUIEN OCUPA LA PLAZA, resuelto acá y no en cada pantalla que convierte.
   Es siempre la misma cuenta —del cargo al id del ocupante, del id a la ficha de la persona— y
   pedirla como parámetro en cada llamada la volvía olvidable: el ejemplo la olvidaba y todos sus
   puestos habrían salido vacantes. Se sigue pudiendo pasar otra, para el día que las personas no
   vivan en el directorio sembrado. */
const nombreDeOcupante = c => getPersona(ocupanteDe(c))?.name || ''

/* LO QUE EL ORGANIGRAMA LLAMA «CARGO» SON SILLAS, Y ACÁ SE PARTEN EN DOS.
   En el modelo viejo cada fila de `cargos` es una plaza con un nombre repetido: cinco
   «Ejecutiva Comercial» son cinco filas que dicen lo mismo cinco veces. Acá el nombre sube a
   ser un CARGO —la definición, una sola vez— y cada fila baja a ser un PUESTO que cuelga de él.
   Es la misma cuenta que la pantalla vieja de Cargos hacía para poder listar el catálogo, solo
   que ahora el resultado se guarda en vez de recalcularse en cada dibujo.

   SE AGRUPA POR NOMBRE Y UNIDAD, no por nombre a secas: un cargo del árbol cuelga de UNA
   unidad, así que dos «Analista» en áreas distintas son dos cargos. Es lo mismo que hace el
   dibujo al apilar plazas repetidas dentro de una rama.

   EL PUESTO SE QUEDA CON EL ID EXACTO DE LA PLAZA, sin prefijo. Lo llevaba —`puesto-gg`— para
   poder rastrear de dónde salió cada una, y eso valía mientras esto era una copia de mirar. Desde
   que el árbol es el dato compartido, ese id ES la identidad de la silla en las dos pantallas: las
   coordinaciones del organigrama y el «Reporta a» de cada cargo apuntan a él, y con el prefijo
   delante quedaban todos señalando a una plaza que ya no se llama así. El cargo, que es el nodo
   inventado acá, sí lleva id propio.

   VIVE FUERA DE `convertirTodo` porque los dos arranques la necesitan. Estaba dentro, y por eso
   «Cargar datos de ejemplo» llenaba el organigrama de cargos y dejaba las pestañas Cargos y
   Puestos de la estructura en cero: el eje organizacional abría con sus áreas y sin una sola
   silla, que es justo la mitad del modelo que hay que poder mirar. */
export function cargosYPuestos(cargos = [], nombreDePersona = nombreDeOcupante) {
  const idDeCargo = new Map()
  const cargosNodo = []
  const puestos = []

  cargos.forEach(c => {
    const nombre = (c.nombre || '').trim()
    if (!nombre) return
    const clave = `${c.unidadId || ''}·${nombre.toLowerCase()}`
    if (!idDeCargo.has(clave)) {
      const id = `cargo-${cargosNodo.length + 1}`
      idDeCargo.set(clave, id)
      cargosNodo.push({
        id, tipo: 'cargo', nombre, padreId: c.unidadId || null,
        nivelMando: c.grado || '', tipoCargo: c.tipo || 'colaborador', estado: 'activa',
        /* EL CUPO Y LA JEFATURA POR DEFECTO SON DEL CARGO, no de cada silla, así que se toman de
           la PRIMERA entrada del grupo: es la que crea el cargo, y las demás solo le agregan
           sillas. Sin declarar, el cargo queda sin techo, que es el caso corriente. */
        ...(c.maxPersonas ? { maxPersonas: c.maxPersonas } : {}),
        ...(c.jefeSillas ? { jefeSillas: c.jefeSillas } : {}),
      })
    }
    puestos.push({
      id: c.id, tipo: 'puesto', nombre,
      padreId: idDeCargo.get(clave),
      codigo: c.codigo || '',
      ubicacion: (c.sucursalIds || [])[0] || '',
      /* El id manda y el nombre acompaña, igual que en `aplicarCargos`: la tabla enseña el nombre
         y el modelo se queda con la referencia que no se rompe si dos personas se llaman igual. */
      ocupanteId: ocupanteDe(c),
      ocupante: nombreDePersona(c) || '',
      reportaA: c.reportaA ?? null,
      funcionales: c.funcionales || [],
      estado: 'activa',
    })
  })

  return [...cargosNodo, ...puestos]
}

/* CONVERTIR NO ES SEMBRAR, y por eso son dos funciones.
   CONVERTIR pasa a nodos todo lo que exista en la demo —las sucursales de arranque, las áreas si
   las hay— y es lo que hace el botón «Traer mis datos». SEMBRAR decide con qué abre la pantalla
   la primera vez, y ahí sí manda la demo: en cero, vacía.

   Estaban juntas y las ocho sucursales de arranque quedaban inalcanzables: la pantalla abría
   vacía —correcto— pero el botón para traerlas tampoco aparecía, porque preguntaba por la misma
   función que acababa de devolver nada. */
export function convertirTodo(sucursales, unidades, cargos = [], nombreDePersona = nombreDeOcupante) {
  const comoNodos = sucursales.map(s => ({
    id: s.id, tipo: 'sucursal', nombre: s.nombre, padreId: null,
    ciudad: s.ciudad, codigo: s.codigo, direccion: s.direccion, telefono: s.telefono,
    correo: s.correo, responsable: s.responsable, horario: s.horario,
    apertura: s.apertura, estado: s.estado || 'activa',
  }))

  const areas = unidades.map(u => ({
    id: u.id, tipo: 'unidad', nombre: u.nombre, corto: u.corto,
    padreId: u.padreId ?? null, estado: 'activa',
  }))

  return [...comoNodos, ...areas, ...cargosYPuestos(cargos, nombreDePersona)]
}

/* LA ESTRUCTURA DE EJEMPLO, que es la que carga «Cargar datos de ejemplo».
   La conversión de los datos viejos daba ocho sucursales sueltas y las áreas: ni una regional,
   ni una oficina —esos dos niveles no existían en el modelo anterior, así que no había nada que
   convertir—. Y son justamente los dos que hay que ver para juzgar si el modelo sirve.

   Y LE FALTABA LA OTRA MITAD: los cargos. El ejemplo llenaba el organigrama con sus cuarenta y
   pico de plazas y dejaba la estructura con las áreas vacías —las pestañas Cargos y Puestos en
   cero—, así que la propuesta se enseñaba a medias: se veía dónde está la empresa y cómo se
   divide, y no se veía la silla, que es el nodo donde los tres ejes se tocan y lo único que
   demuestra que partir «cargo» en cargo y puesto funciona sobre datos de verdad.

   Son los MISMOS cargos del organigrama pasados por la misma conversión que usa «Traer mis
   datos», no una lista aparte: si el reparto se equivoca, se equivoca igual en los dos sitios y
   se arregla una sola vez.

   SE CONSTRUYE SOBRE LOS DATOS QUE YA HAY y no en paralelo: las sucursales son las ocho de
   siempre y las áreas son las unidades del organigrama, CON SUS MISMOS IDS. Por eso los cargos
   siguen encontrando su área y los contadores de cada rama dan números de verdad. Lo único
   inventado son las tres regionales de arriba y los dos depósitos, que es lo que faltaba.

   Y SE SALTA NIVELES A PROPÓSITO: Operaciones cuelga del depósito, las demás áreas cuelgan
   directo de la Casa Matriz, y solo dos sucursales tienen depósito. Un ejemplo donde todas las
   ramas tienen la misma profundidad no prueba nada —lo que hay que poder ver es que la falta de
   un escalón no rompe nada—. */
const REGIONALES = [
  /* `direccion` y no `direccionLiquidaciones`, y sin `ordenPlanillas`: los dos se fueron de la
     ficha de la regional y quedaban acá como datos que ninguna pantalla enseña. */
  { id: 'reg-oriente', nombre: 'Oriente', ciudad: 'Santa Cruz de la Sierra', codigo: 'REG-01',
    direccion: 'Av. San Martín 200, Equipetrol',
    descripcion: 'Santa Cruz y el norte integrado. Concentra la casa matriz y el depósito central.' },
  { id: 'reg-occidente', nombre: 'Occidente', ciudad: 'La Paz', codigo: 'REG-02',
    direccion: 'Av. Arce 2180, Sopocachi',
    descripcion: 'La Paz, El Alto, Oruro y Potosí.' },
  { id: 'reg-valles', nombre: 'Valles', ciudad: 'Cochabamba', codigo: 'REG-03',
    direccion: 'Av. Ballivián 415, El Prado',
    descripcion: 'Cochabamba, Sucre y Tarija.' },
]

/* A qué regional pertenece cada una de las sucursales de siempre. */
const REGION_DE = {
  central: 'reg-oriente', mtr: 'reg-oriente',
  /* `eal` y no `alto`: la sucursal de El Alto se llama así en el catálogo, y con la llave
     equivocada se quedaba sin regional —salía con un guion en «Depende de» mientras las otras
     siete tenían la suya—. */
  lpz: 'reg-occidente', eal: 'reg-occidente', oru: 'reg-occidente', pot: 'reg-occidente',
  cbb: 'reg-valles', sre: 'reg-valles', tja: 'reg-valles',
}

const DEPOSITOS = [
  { id: 'dep-central', nombre: 'Depósito Central', padreId: 'central',
    direccion: 'Parque Industrial, manzana 12', horario: 'Lun a Sáb, 07:00–19:00' },
  { id: 'dep-alto', nombre: 'Depósito El Alto', padreId: 'eal',
    direccion: 'Av. 6 de Marzo, zona Villa Bolívar', horario: 'Lun a Vie, 08:00–18:00' },
]

export function estructuraEjemplo(sucursales, unidades, cargos = []) {
  const regionales = REGIONALES.map(r => ({ ...r, tipo: 'region', padreId: null, estado: 'activa' }))

  /* De qué frente atiende cada sede. Casa Matriz no está: es la corporativa y sirve a las tres. */
  const LINEA_DE_SEDE = {
    mtr: 'neg-farmacias', lpz: 'neg-farmacias', cbb: 'neg-farmacias',
    sre: 'neg-farmacias', tja: 'neg-farmacias', oru: 'neg-farmacias',
    pot: 'neg-farmacias',
    eal: 'neg-institucional',
    /* La casa matriz atiende a los tres frentes: es corporativa y no es de ninguno. Por eso las
       áreas ancladas en ella —Dirección, RRHH, Finanzas— salen transversales, que es lo correcto.
       «neg-distribucion» se queda sin sedes propias a propósito: enseña que una unidad de negocio
       puede existir antes de que se le asigne nada. */
  }

  const sedes = sucursales.map(s => ({
    id: s.id, tipo: 'sucursal', nombre: s.nombre, padreId: REGION_DE[s.id] || null,
    lineaNegocio: LINEA_DE_SEDE[s.id] || '',
    ciudad: s.ciudad, codigo: s.codigo, direccion: s.direccion, telefono: s.telefono,
    correo: s.correo, responsable: s.responsable, horario: s.horario,
    apertura: s.apertura, estado: s.estado || 'activa',
  }))

  /* LOS DEPÓSITOS NO DECLARAN: HEREDAN DE SU SUCURSAL. Declaraban «Distribución» y con eso la
     demo repartía a dos niveles a la vez —sucursales y centros—, que es lo que el modelo no
     admite: una empresa elige UN nivel y reparte todo ahí. FarmaVida reparte por sucursal. */
  const centros = DEPOSITOS.map(d => ({ ...d, tipo: 'centro', estado: 'activa' }))

  /* Operaciones opera desde el depósito; el resto, desde la casa matriz. Va en `ubicacion` y no
     en `padreId`: colgarlas de la sucursal las sacaba del organigrama —dependían de un edificio y
     no de otra unidad— y era la confusión que el modelo nuevo separa en dos campos. Solo lo
     declaran las de primer nivel; las que cuelgan de otra heredan el suyo. */
  const areas = unidades.map(u => ({
    id: u.id,
    tipo: 'unidad',
    tipoUnidad: u.padreId ? 'Departamento' : 'Gerencia',
    nombre: u.nombre,
    corto: u.corto,
    padreId: u.padreId ?? null,
    /* OPERACIONES OPERA DESDE EL DEPÓSITO, y hasta ahora no lo hacía. La condición decía «solo las
       de primer nivel declaran sitio» y adentro preguntaba por Operaciones —que cuelga de
       Dirección General y por lo tanto NO es de primer nivel—, así que esa rama nunca se ejecutó y
       Operaciones heredaba la casa matriz como todas las demás.

       Sacada de la condición, la demo enseña de una vez las dos cosas que más cuesta explicar sin
       verlas: una unidad que AFINA la sede que heredaba, y una unidad que saca su LÍNEA DE NEGOCIO
       de dónde opera —Distribución, del depósito— sin haberla declarado. */
    ...(u.id === 'operaciones'
      ? { ubicacion: 'dep-central' }
      : u.padreId ? {} : { ubicacion: 'central' }),
    estado: 'activa',
  }))

  /* NADA CUELGA DE ELLAS TODAVÍA, y es a propósito. En este modelo una unidad organizacional
     que cuelga de una línea de negocio deja de tener padre DIBUJABLE —el organigrama no dibuja
     las líneas de negocio— y pasa a ser otra raíz del dibujo. Colgarle «Ventas» a «Retail»
     partiría el organigrama de la demo en dos árboles, y lo que hoy se lee de un vistazo pasaría
     a leerse en dos. Cómo repartir las áreas entre líneas es una decisión de cada empresa; la
     demo enseña que el peldaño existe y deja el reparto abierto. */
  const negocios = [
    { id: 'neg-farmacias', nombre: 'Farmacias', descripcion: 'Venta al público en farmacias propias y afiliadas.' },
    { id: 'neg-institucional', nombre: 'Institucional', descripcion: 'Provisión a hospitales, clínicas y entidades del Estado.' },
    { id: 'neg-distribucion', nombre: 'Distribución', descripcion: 'Venta mayorista a distribuidoras y cadenas.' },
  ].map(n => ({ ...n, tipo: 'negocio', padreId: null, estado: 'activa' }))

  /* UN CARGO DEFINIDO Y SIN NINGUNA PLAZA ABIERTA. Es un estado válido y frecuente —se aprueba
     el rol y las plazas se abren cuando hay presupuesto— y no salía de la lista de arriba, que
     nace de los puestos: sin puesto no hay cargo. Trae su jefatura por defecto puesta, así que la
     primera silla que alguien abra desde la tabla ya nace colgada de la coordinación y no suelta.

     Es además el único de la demo con «sin límite» y jefatura declarada a la vez, que es el caso
     que hace visible para qué sirve ese campo. */
  const cargoSinPlazas = {
    id: 'cargo-sin-plazas', tipo: 'cargo', nombre: 'Ejecutivo Comercial Junior',
    padreId: 'ventas', nivelMando: 'bajo', tipoCargo: 'colaborador', estado: 'activa',
    jefeSillas: 'sup-lpz',
    descripcion: 'Aprobado para la próxima campaña. Todavía sin plazas abiertas.',
  }

  return [...regionales, ...sedes, ...centros, ...negocios, ...areas, cargoSinPlazas, ...cargosYPuestos(cargos)]
}

/* NO EXISTE UNA EMPRESA SIN NINGÚN SITIO DONDE OPERA.
   La estructura abría vacía y el resultado era absurdo: una empresa registrada, con su nombre y
   su NIT, y cero sucursales —así que el selector de ámbito del riel no tenía nada que ofrecer y el
   primer cargo no tenía dónde nacer—. Y abría con OCHO, que era peor: sucursales de nadie que hay
   que borrar una por una antes de poder cargar las propias.

   Lo cierto es lo del medio: toda empresa tiene una casa matriz. Se crea con el nombre de la
   empresa, hereda su dirección legal si la tiene, y se puede renombrar o borrar como cualquier
   otro nodo. No es un dato de relleno: es el único que se puede afirmar con certeza en cuanto
   existe la empresa.

   EL ID ES 'central' A PROPÓSITO: es el que ya usan los cargos del organigrama de ejemplo en su
   `sucursalIds`, así que cargar los datos de muestra sigue cuadrando con la sucursal que ya existe
   en vez de dejar sus puestos apuntando a una sucursal fantasma. */
export function casaMatriz(empresa) {
  return {
    id: 'central',
    tipo: 'sucursal',
    nombre: empresa?.nombre ? `Casa Matriz` : 'Casa Matriz',
    padreId: null,
    estado: 'activa',
    ciudad: '',
    codigo: '',
    direccion: empresa?.direccionLegal || '',
  }
}

/* Con qué abre la pantalla la primera vez. Con la demo cargada —hay áreas— se convierte todo y
   se ve la migración funcionando. Sin ella, la casa matriz sola. */
export function semillaNodos(sucursales, unidades, empresa) {
  return unidades.length ? convertirTodo(sucursales, unidades) : [casaMatriz(empresa)]
}


/* QUÉ PELDAÑOS CORRESPONDEN A UNA SEMILLA. El ejemplo los usa todos; la conversión de los
   datos de hoy usa los que la empresa ya tiene. Así la pantalla nunca abre con un nivel apagado
   y nodos de ese nivel dentro. Ahora devuelve la LISTA ENTERA con sus marcas, no las llaves
   encendidas: los apagados tienen que seguir existiendo para conservar su nombre. */
export const nivelesDeSemilla = nodos => {
  const usados = new Set(nodos.map(n => n.tipo))
  return nivelesIniciales().map(t => ({ ...t, on: !!t.fijo || usados.has(t.key) }))
}

/* ---------- UN SOLO DATO PARA LAS UNIDADES, Y NO DOS COPIAS ---------- */

/* EL ORGANIGRAMA Y LA TABLA DEJAN DE TENER CADA UNO SU LISTA.
   Vivían en dos llaves distintas de `localStorage` —`organigrama` y `estructuraNodos2`— y el
   único puente era el botón «Traer mis datos», que copia UNA VEZ y en UN SOLO SENTIDO. Coincidían
   justo después de apretarlo y se separaban con el primer cambio: un área creada en el dibujo no
   llegaba nunca a la tabla, y encima el botón para volver a traerla se esconde apenas la tabla
   tiene una unidad adentro. Dos verdades sobre lo mismo y ninguna forma de saber cuál vale.

   Ahora el árbol es el dato y el organigrama lo MIRA: `unidades` se proyecta de los nodos al
   leer y se aplica sobre los nodos al escribir. No hay sincronización que pueda fallar porque no
   hay dos cosas que sincronizar; es la misma lista contada de dos maneras.

   SE ELIGIÓ EL ÁRBOL COMO FUENTE y no la lista vieja porque es el único de los dos que puede con
   lo que viene: unidades anidadas sin límite, el cargo separado del puesto, y los peldaños que la
   empresa se inventa. Al revés, la propuesta quedaba capada dentro del modelo que vino a superar.

   LA TRADUCCIÓN ES CORTA A PROPÓSITO. Solo cruzan los campos que el organigrama conoce; lo que es
   del árbol y él no sabe —`tipoUnidad`, `ubicacion`, `estado`— se conserva intacto al escribir.
   Un dato que la otra pantalla no entiende no es un dato que se pueda perder. */
/* QUÉ CRUZA. Empezó siendo lo que el organigrama ya sabía —nombre, corto, padre, código, mando— y
   ahora lleva también `tipoUnidad` y `estado`, porque el modal del dibujo pasó a preguntarlos: un
   campo que se puede editar de un lado y no viaja al otro se pierde al guardar, en silencio. */
const CAMPOS_UNIDAD = ['nombre', 'corto', 'padreId', 'codigo', 'mandoId', 'tipoUnidad', 'estado', 'ubicacion', 'responsable', 'descripcion']

/* El nodo visto como la unidad de siempre. `corto` cae al nombre cuando falta porque el dibujo lo
   usa para la píldora y una píldora vacía no se puede leer. */
export const unidadesDeNodos = nodos => nodos
  .filter(n => n.tipo === 'unidad')
  .map(n => ({
    id: n.id,
    nombre: n.nombre,
    corto: n.corto || n.nombre,
    padreId: n.padreId ?? null,
    codigo: n.codigo ?? null,
    mandoId: n.mandoId ?? null,
    tipoUnidad: n.tipoUnidad ?? null,
    /* DÓNDE ESTÁ: la región, la sucursal o el centro de trabajo al que pertenece. Vacío no es un
       dato que falte —es «usa el de la rama de la que cuelga», y arriba de todo, «toda la
       empresa»—. Por eso viaja como cadena vacía y no como null. */
    ubicacion: n.ubicacion || '',
    /* QUIÉN RESPONDE POR EL ÁREA. Es una persona y es un dato de contacto: no dibuja la línea del
       organigrama —eso lo hace `mandoId`— pero las dos pantallas lo escriben, así que viaja. */
    responsable: n.responsable || '',
    descripcion: n.descripcion || '',
    estado: n.estado || 'activa',
  }))

const comoNodo = u => ({
  nombre: u.nombre,
  corto: u.corto || u.nombre,
  padreId: u.padreId ?? null,
  codigo: u.codigo ?? null,
  mandoId: u.mandoId ?? null,
  tipoUnidad: u.tipoUnidad ?? null,
  ubicacion: u.ubicacion || '',
  responsable: u.responsable || '',
  descripcion: u.descripcion || '',
  estado: u.estado || 'activa',
})

/* La lista del organigrama devuelta al árbol: se actualizan las que siguen, se borran las que no
   están y nacen las que no existían. Los nodos que no son unidades no se tocan ni de casualidad.

   DEVUELVE EL MISMO ARREGLO CUANDO NO CAMBIÓ NADA. `setNodos` guarda en `localStorage` y avisa a
   media aplicación en cada llamada; el organigrama escribe la lista entera en cada guardado, así
   que sin esta comparación un cambio de color reescribía todas las unidades. */
export function aplicarUnidades(nodos, unidades) {
  const porId = new Map(unidades.map(u => [u.id, u]))
  const previas = new Set(nodos.filter(n => n.tipo === 'unidad').map(n => n.id))

  let cambio = false
  const quedan = []
  for (const n of nodos) {
    if (n.tipo !== 'unidad') { quedan.push(n); continue }
    const u = porId.get(n.id)
    if (!u) { cambio = true; continue }
    const sig = { ...n, ...comoNodo(u) }
    if (CAMPOS_UNIDAD.some(k => (n[k] ?? null) !== (sig[k] ?? null))) { cambio = true; quedan.push(sig) }
    else quedan.push(n)
  }

  const nuevas = unidades
    .filter(u => !previas.has(u.id))
    .map(u => ({ id: u.id, tipo: 'unidad', ...comoNodo(u) }))

  return cambio || nuevas.length ? [...quedan, ...nuevas] : nodos
}

/* LA LLAVE LLEVA VERSIÓN, y esto es lo que hace que un cambio de arranque llegue a quien ya
   había abierto la pantalla. `useLocalStorage` solo usa el valor inicial cuando la llave NO
   existe: al pasar el arranque de «solo sucursal» a «todos encendidos», quien ya tenía algo
   guardado seguía viendo el reparto viejo y el cambio no se notaba por ningún lado.

   Cambiar el nombre de la llave abandona lo anterior y hace que el arranque nuevo se aplique una
   vez. Cuesta la configuración que alguien hubiera tocado a mano —en una prueba, barato— y evita
   lo caro: no poder distinguir «esto está apagado porque lo apagué» de «está apagado porque lo
   guardó una versión anterior». */
/* SUBE CADA VEZ QUE CAMBIA UNA DESCRIPCIÓN. Las de los peldaños son un DATO de la empresa —se
   renombran— así que la copia guardada manda sobre el catálogo, y quien ya tenía niveles seguía
   leyendo «La sucursal con código propio ante el SIN. Es la única con identidad fiscal.» mucho
   después de que esa frase saliera del código. Un texto que ya no existe en ningún archivo y sin
   embargo aparece en pantalla es de lo más caro que hay para encontrar.

   Van dos veces por lo mismo: la del SIN y ahora la de la unidad de negocio, que prometía un
   gerente que la ficha ya no guarda. Mientras las descripciones se sigan afinando, subir la llave
   es más barato que dejar copias viejas dando vueltas. Cuesta los renombres hechos a mano; el día
   que el producto sea de verdad, esto es una migración y no un número. */
/* SUBE TAMBIÉN CUANDO CAMBIA EL REPARTO. `sanearNiveles` corrige solo el `eje` de un peldaño
   guardado, pero no su POSICIÓN: quien ya tenía la lista vieja seguiría con la unidad de negocio
   entre la empresa y la región, o sea numerada 2 dentro del grupo organizacional y por encima de
   toda la geografía. El orden es la escalera; una escalera a medio migrar no se puede leer. */
export const LLAVE_NIVELES = 'estructuraNiveles6'


/* ---------- Y LO MISMO PARA LOS CARGOS, QUE ES DONDE LOS DOS MODELOS NO COINCIDEN ---------- */

/* UNA FILA DEL ORGANIGRAMA ES UNA SILLA; EN EL ÁRBOL SON DOS NODOS.
   Con las unidades la traducción era casi un cambio de nombre. Acá no: el modelo viejo tiene UNA
   lista de plazas donde el nombre se repite —cinco «Ejecutiva Comercial» son cinco filas— y el
   árbol tiene el CARGO una sola vez con sus PUESTOS colgando. Traducir es repartir y volver a
   juntar.

   DE QUÉ CARGO ES CADA PLAZA: del que tiene su mismo nombre dentro de su misma unidad, y si no
   hay ninguno, de uno nuevo. Es la misma cuenta que el dibujo ya hace para apilar las plazas
   repetidas de una rama, así que crear un puesto desde el organigrama lo mete en el cargo que uno
   esperaría sin haber tenido que elegirlo en ninguna parte.

   LO COMPARTIDO VIVE EN EL CARGO —nombre, unidad, nivel de mando, clase— y lo de cada silla en su
   puesto: código, dónde se trabaja, quién la ocupa, a quién le responde. Es el mismo reparto que
   el modal del organigrama ya hacía entre «lo común» y «lo de cada puesto».

   «REPORTA A» SE GUARDA, NO SE DEDUCE. El árbol no lo tenía y era el único dato del organigrama
   sin sitio donde caer. Deducirlo —cada cargo responde a la cabeza de su unidad— alcanza para el
   caso corriente y miente en cuanto una unidad tiene dos jefaturas, que es justo cuando el dato
   hace falta. Va en el PUESTO y no en el cargo porque dos sillas del mismo cargo en dos sedes
   pueden responderle a dos jefes distintos, y eso ya pasa en los datos de ejemplo. */

const SILLA_IMPLICITA = '::silla'

/* Cómo se agrupa: mismo nombre dentro de la misma unidad. */
const claveDeCargo = (unidadId, nombre) => `${unidadId || ''}·${(nombre || '').trim().toLowerCase()}`

const esImplicita = id => typeof id === 'string' && id.endsWith(SILLA_IMPLICITA)
const cargoDeImplicita = id => id.slice(0, -SILLA_IMPLICITA.length)

const comoPlaza = (c, pu) => ({
  id: pu.id,
  nombre: c.nombre,
  unidadId: c.padreId ?? null,
  reportaA: pu.reportaA ?? null,
  tipo: c.tipoCargo || 'colaborador',
  grado: c.nivelMando || undefined,
  destacado: c.destacado || undefined,
  estado: c.estado || 'activa',
  codigo: pu.codigo || null,
  sucursalIds: pu.ubicacion ? [pu.ubicacion] : [],
  ocupantes: pu.ocupanteId != null ? [pu.ocupanteId] : [],
  funcionales: pu.funcionales || [],
})

/* EL CARGO SIN NINGÚN PUESTO IGUAL SE DIBUJA. El árbol permite definir un cargo y todavía no abrir
   ninguna silla —es una de las cosas que el modelo viejo no podía— pero el organigrama solo sabe
   dibujar plazas: sin esto, un cargo creado desde la tabla no aparecería en ninguna parte y
   parecería que no se guardó. Se le presta una silla vacante, con un id derivado del suyo para que
   siga siendo la misma de un dibujo al siguiente. */
export function cargosDeNodos(nodos) {
  const sillas = new Map()
  for (const n of nodos) {
    if (n.tipo !== 'puesto') continue
    const l = sillas.get(n.padreId)
    if (l) l.push(n)
    else sillas.set(n.padreId, [n])
  }

  const salida = []
  for (const c of nodos) {
    if (c.tipo !== 'cargo') continue
    const propias = sillas.get(c.id)
    if (propias) propias.forEach(pu => salida.push(comoPlaza(c, pu)))
    else salida.push(comoPlaza(c, { id: c.id + SILLA_IMPLICITA }))
  }
  return salida
}

/* EL NOMBRE DEL OCUPANTE SE GUARDA AL LADO DEL ID, y no es la segunda verdad de siempre: el id
   manda —dos personas se pueden llamar igual— y el nombre está porque la tabla y la ficha del
   árbol lo enseñan tal cual. Se escriben SIEMPRE JUNTOS y acá, que es el único sitio que los
   escribe; no hay forma de que uno termine diciendo algo distinto del otro. */
const conOcupante = plaza => {
  const id = (plaza.ocupantes ?? (plaza.ocupanteId != null ? [plaza.ocupanteId] : []))[0] ?? null
  return { ocupanteId: id, ocupante: (id != null && getPersona(id)?.name) || '' }
}

const mismaPlaza = (a, b) => !!a && !!b && JSON.stringify(a) === JSON.stringify(b)

/* Un id libre mirando también lo que se está por agregar en esta misma pasada. */
function nuevoIdDeNodo(prefijo, nodos, pendientes) {
  let n = nodos.length + pendientes.length + 1
  const ocupado = id => nodos.some(x => x.id === id) || pendientes.some(x => x.id === id)
  while (ocupado(`${prefijo}-${n}`)) n += 1
  return `${prefijo}-${n}`
}

/* LA VUELTA: la lista de plazas del organigrama, aplicada sobre el árbol.
   Se compara contra lo que el árbol proyecta HOY y solo se toca lo que de verdad cambió. Sin eso,
   guardar un color reescribía los cuarenta puestos —y de paso materializaba todas las sillas
   prestadas, que es justo lo que no tienen que hacer mientras nadie las edite—. */
export function aplicarCargos(nodos, cargos) {
  const actuales = new Map(cargosDeNodos(nodos).map(c => [c.id, c]))
  const llegan = new Set(cargos.map(c => c.id))
  const previos = new Map(nodos.map(n => [n.id, n]))
  const porClave = new Map(
    nodos.filter(n => n.tipo === 'cargo').map(n => [claveDeCargo(n.padreId, n.nombre), n]),
  )

  const cargosNuevos = []
  const puestosNuevos = []
  const parches = new Map()
  const muertos = new Set()

  /* De qué cargo cuelga una plaza HOY: de su nodo si ya existe, o del cargo que le prestó la
     silla si todavía es implícita. */
  const cargoDeLaPlaza = id => (esImplicita(id) ? cargoDeImplicita(id) : previos.get(id)?.padreId)

  /* SE VAN LAS QUE YA NO ESTÁN. Y con la última silla se va también su cargo: en el modelo viejo
     borrar la última plaza borra el cargo del catálogo, y dejarlo vivo acá lo haría volver a
     dibujarse al instante con una silla prestada. Borrar algo y verlo reaparecer es lo peor que
     puede hacer una pantalla. */
  const sillasVivas = new Set()
  for (const c of cargos) {
    const cargoId = cargoDeLaPlaza(c.id)
    if (cargoId) sillasVivas.add(cargoId)
  }
  for (const id of actuales.keys()) {
    if (llegan.has(id)) continue
    if (!esImplicita(id)) muertos.add(id)
    const cargoId = cargoDeLaPlaza(id)
    if (cargoId && !sillasVivas.has(cargoId)) muertos.add(cargoId)
  }

  for (const plaza of cargos) {
    if (mismaPlaza(actuales.get(plaza.id), plaza)) continue

    const clave = claveDeCargo(plaza.unidadId, plaza.nombre)
    let cargo = porClave.get(clave)
    if (!cargo) {
      cargo = {
        id: nuevoIdDeNodo('cargo', nodos, cargosNuevos),
        tipo: 'cargo',
        nombre: (plaza.nombre || '').trim(),
        padreId: plaza.unidadId ?? null,
        estado: 'activa',
        nivelMando: plaza.grado || '',
        tipoCargo: plaza.tipo || 'colaborador',
        destacado: !!plaza.destacado,
      }
      cargo.estado = plaza.estado || 'activa'
      cargosNuevos.push(cargo)
      porClave.set(clave, cargo)
    } else {
      /* Lo compartido se pisa en el cargo: el modal del organigrama edita los cinco puestos de una
         tacada, así que el nivel de mando o la clase que llegan valen para el grupo entero. */
      parches.set(cargo.id, {
        ...(parches.get(cargo.id) || {}),
        nivelMando: plaza.grado || '',
        tipoCargo: plaza.tipo || 'colaborador',
        destacado: !!plaza.destacado,
        estado: plaza.estado || 'activa',
      })
    }

    const propio = {
      tipo: 'puesto',
      nombre: cargo.nombre,
      padreId: cargo.id,
      codigo: plaza.codigo || '',
      ubicacion: (plaza.sucursalIds || [])[0] || '',
      reportaA: plaza.reportaA ?? null,
      funcionales: plaza.funcionales || [],
      ...conOcupante(plaza),
    }

    const previo = previos.get(plaza.id)
    if (previo && previo.tipo === 'puesto') parches.set(plaza.id, propio)
    else puestosNuevos.push({ id: plaza.id, estado: 'activa', ...propio })
  }

  if (!muertos.size && !parches.size && !cargosNuevos.length && !puestosNuevos.length) return nodos

  const vivos = nodos
    .filter(n => !muertos.has(n.id))
    .map(n => (parches.has(n.id) ? { ...n, ...parches.get(n.id) } : n))

  /* Los cargos nuevos van ANTES que los puestos: el orden del arreglo no significa nada para el
     modelo, pero una lista donde el hijo aparece antes que el padre se lee mal al depurarla. */
  return [...vivos, ...cargosNuevos, ...puestosNuevos]
}

/* EL MANDO DE UNA UNIDAD SE ESCRIBE EN DOS SITIOS PORQUE SE LEE DE DOS SITIOS, y esto no es la
   segunda verdad de siempre: es UNA sola, guardada donde corresponde según el caso.

   Una unidad VACÍA no tiene de dónde colgar más que de sí misma, así que su mando vive en ella
   —`mandoId`—. En cuanto tiene puestos adentro, el dueño del dato es su CABEZA: el organigrama
   dibuja la línea desde el «Reporta a» de ese puesto, y `unidad.mandoId` deja de mirarse. Es
   exactamente lo que ya hacía el modal del dibujo; puesto acá, la ficha de la tabla puede guardar
   lo mismo en vez de escribir un campo que nadie iba a leer.

   Se recuelga SOLO la cabeza. Todo lo que colgaba de ella la sigue, sin tocar una línea más. */
export function aplicarMandoDeUnidad(nodos, unidadId, mandoId) {
  const plazas = cargosDeNodos(nodos)
  const cabeza = cabezaDe(unidadId, { cargos: plazas })
  const destino = mandoId && mandoId !== RAIZ ? mandoId : null
  if (!cabeza || (cabeza.reportaA ?? null) === destino) return nodos
  return aplicarCargos(nodos, plazas.map(p => (p.id === cabeza.id ? { ...p, reportaA: destino } : p)))
}
