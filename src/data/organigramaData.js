/* Modelo del organigrama.
   El nodo del árbol es el CARGO, no la persona. Esa distinción es la que permite
   representar un cargo vacante (existe la posición, no hay quien la ocupe) y la que
   evita duplicar un puesto cuando lo comparten dos personas.
   Las UNIDADES son las áreas; se anidan entre sí (Marketing → Marketing Digital) y
   agrupan cargos, pero no reportan: quien reporta es el cargo.
   Las personas viven en `colaboradoresData`; aquí solo se referencian por id.

   Todas las funciones reciben el `org` completo ({ unidades, cargos }) en vez de leer
   las constantes: la pantalla guarda su propia copia editable, así que las áreas y los
   cargos que ve el usuario no son necesariamente los sembrados. */

import { colaboradoresData } from '../pages/personas/colaboradoresData'

export const empresa = { nombre: 'SoulyHR', razonSocial: 'SoulyHR S.R.L.' }

/* Ocho y no tres: con tres nunca aparecen el buscador ni "ver solo las marcadas" —los dos se
   activan pasadas seis sedes— así que la demo escondía justo lo que se diseñó para una empresa
   grande. Ocho es el número más chico que los enciende y sigue entrando en pantalla. */
export const sucursales = [
  { id: 'central', nombre: 'Sede Central', ciudad: 'Santa Cruz' },
  { id: 'lpz', nombre: 'Sucursal', ciudad: 'La Paz' },
  { id: 'cbb', nombre: 'Sucursal', ciudad: 'Cochabamba' },
  { id: 'sre', nombre: 'Sucursal', ciudad: 'Sucre' },
  { id: 'tja', nombre: 'Sucursal', ciudad: 'Tarija' },
  { id: 'oru', nombre: 'Oficina Regional', ciudad: 'Oruro' },
  { id: 'pot', nombre: 'Oficina Regional', ciudad: 'Potosí' },
  { id: 'eal', nombre: 'Punto de Venta', ciudad: 'El Alto' },
]

/* `corto` es la etiqueta de la píldora "Pertenece a" en la tabla, donde el nombre largo
   no entra. */
export const unidades = [
  { id: 'direccion', nombre: 'Dirección General', corto: 'Dir. General', padreId: null },
  { id: 'tecnologia', nombre: 'Tecnología', corto: 'Tecnología', padreId: 'direccion' },
  { id: 'rrhh', nombre: 'Recursos Humanos', corto: 'RRHH', padreId: 'direccion' },
  { id: 'marketing', nombre: 'Marketing', corto: 'Marketing', padreId: 'direccion' },
  { id: 'mkt-digital', nombre: 'Marketing Digital', corto: 'Mkt. Digital', padreId: 'marketing' },
  { id: 'contenidos', nombre: 'Contenidos y Creatividad', corto: 'Contenidos', padreId: 'marketing' },
  { id: 'ventas', nombre: 'Ventas', corto: 'Ventas', padreId: 'direccion' },
  { id: 'operaciones', nombre: 'Operaciones', corto: 'Operaciones', padreId: 'direccion' },
  { id: 'finanzas', nombre: 'Finanzas', corto: 'Finanzas', padreId: 'direccion' },
  { id: 'diseno', nombre: 'Diseño', corto: 'Diseño', padreId: 'direccion' },
]

/* Los cuatro tipos de cargo. `staff` y `outsourcing` cuelgan de lado en vez de bajar en la
   línea de mando: asesoran o prestan un servicio, pero no mandan sobre nadie.

   `jefatura` y `colaborador` se deducen de tener o no gente a cargo —ver `tipoDe`—, así que
   en los cargos sembrados casi ninguno lo declara. Los dos laterales sí tienen que
   declararse: de nada se puede deducir que alguien es externo. */
export const TIPOS_CARGO = [
  { key: 'colaborador', label: 'Colaborador', desc: 'Puesto sin gente a cargo', lateral: false },
  { key: 'jefe', label: 'Jefe / Director', desc: 'Puesto con línea de mando', lateral: false },
  { key: 'staff', label: 'Staff', desc: 'Asiste a un cargo sin estar en su línea de mando', lateral: true },
  /* No es lateral: cuelga de su jefe y queda dentro de su área como cualquier otro puesto. Lo
     que dice que es externo es el color y la línea punteada, no el lugar donde se dibuja. */
  { key: 'outsourcing', label: 'Outsourcing', desc: 'Lo cubre un prestador de servicios', lateral: false },
]

/* `sucursalIds` es una lista y no un id suelto a propósito: una gerencia responsable de dos
   regiones es UN cargo con dos sedes, no dos cuadros duplicados en el árbol.

   TRES PUESTOS QUEDAN SIN OCUPANTE A PROPÓSITO —Reclutadora, Pasante Comercial y Asistente
   Operativo— y por lo tanto tres personas quedan sin cuadro. Antes las 29 del directorio
   ocupaban una casilla cada una y no quedaba NADIE libre: al abrir un puesto vacante para
   cubrirlo, la lista de colaboradores salía vacía —solo se puede asignar a quien no ocupa otro
   cuadro— y el campo parecía roto. Son los tres ingresos más recientes, así que el dato cuenta
   una historia coherente: entraron y todavía no los ubicaron en la estructura. */
export const cargos = [
  { id: 'gg', nombre: 'Gerente General', unidadId: 'direccion', reportaA: null, ocupanteId: 28, destacado: true, sucursalIds: [] },
  { id: 'asist-dir', nombre: 'Asistente de Dirección', unidadId: 'direccion', reportaA: 'gg', ocupanteId: 29, tipo: 'staff', sucursalIds: ['central'] },
  { id: 'legal-ext', nombre: 'Asesoría Legal Externa', unidadId: 'direccion', reportaA: 'gg', ocupanteId: null, tipo: 'outsourcing', sucursalIds: [] },

  { id: 'dir-tec', nombre: 'Dirección de Tecnología', unidadId: 'tecnologia', reportaA: 'gg', ocupanteId: null, sucursalIds: ['central'] },
  { id: 'dev-back', nombre: 'Desarrollador Backend', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 1, sucursalIds: ['central'] },
  { id: 'dev-front', nombre: 'Frontend Developer', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 6, sucursalIds: ['lpz'] },
  { id: 'qa', nombre: 'QA Engineer', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 4, sucursalIds: ['central'] },
  { id: 'devops', nombre: 'DevOps Engineer', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 14, sucursalIds: ['central'] },
  { id: 'data', nombre: 'Data Analyst', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 20, sucursalIds: ['central'] },
  { id: 'soporte-ext', nombre: 'Soporte de Infraestructura', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: null, tipo: 'outsourcing', sucursalIds: ['central'] },

  { id: 'dir-rrhh', nombre: 'Especialista RRHH', unidadId: 'rrhh', reportaA: 'gg', ocupanteId: 9, sucursalIds: ['central', 'lpz', 'sre'] },
  { id: 'nominas', nombre: 'Analista de Nóminas', unidadId: 'rrhh', reportaA: 'dir-rrhh', ocupanteId: 15, sucursalIds: ['central'] },
  { id: 'recluta', nombre: 'Reclutadora', unidadId: 'rrhh', reportaA: 'dir-rrhh', ocupanteId: null, sucursalIds: ['central'] },

  { id: 'dir-mkt', nombre: 'Líder de Marketing', unidadId: 'marketing', reportaA: 'gg', ocupanteId: 25, sucursalIds: ['central'] },
  { id: 'jefe-mkt-dig', nombre: 'Jefatura de Marketing Digital', unidadId: 'mkt-digital', reportaA: 'dir-mkt', ocupanteId: null, sucursalIds: ['central'] },
  /* El caso de apoyo funcional del sembrado: es de Marketing Digital y ayuda en Contenidos.
     Pertenece a una sola área —la de su jefe— y trabaja en dos. */
  { id: 'cm', nombre: 'Community Manager', unidadId: 'mkt-digital', reportaA: 'jefe-mkt-dig', ocupanteId: 11, sucursalIds: ['central'], funcionales: [{ unidadId: 'contenidos', reportaA: 'analista-mkt' }] },
  { id: 'seo', nombre: 'Especialista SEO', unidadId: 'mkt-digital', reportaA: 'jefe-mkt-dig', ocupanteId: 26, sucursalIds: ['lpz', 'eal'] },
  { id: 'analista-mkt', nombre: 'Analista de Marketing', unidadId: 'contenidos', reportaA: 'dir-mkt', ocupanteId: 13, sucursalIds: ['central'] },
  { id: 'content', nombre: 'Content Creator', unidadId: 'contenidos', reportaA: 'dir-mkt', ocupanteId: 21, sucursalIds: ['central'] },
  { id: 'marca', nombre: 'Ejecutiva de Marca', unidadId: 'contenidos', reportaA: 'dir-mkt', ocupanteId: 27, sucursalIds: ['cbb', 'tja'] },

  { id: 'lider-ventas', nombre: 'Ejecutivo Senior', unidadId: 'ventas', reportaA: 'gg', ocupanteId: 12, sucursalIds: [] },
  { id: 'ejec-com', nombre: 'Ejecutiva Comercial', unidadId: 'ventas', reportaA: 'lider-ventas', ocupantes: [2], sucursalIds: ['central', 'sre', 'tja'] },
  { id: 'account', nombre: 'Account Manager', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: 7, sucursalIds: ['lpz', 'oru'] },
  { id: 'sdr', nombre: 'SDR Junior', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: 18, sucursalIds: ['cbb', 'pot', 'eal'] },
  { id: 'pasante', nombre: 'Pasante Comercial', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: null, sucursalIds: ['central', 'eal'] },

  { id: 'coord-log', nombre: 'Coordinador Logístico', unidadId: 'operaciones', reportaA: 'gg', ocupanteId: 16, sucursalIds: ['central', 'cbb', 'tja'] },
  { id: 'analista-proc', nombre: 'Analista de Procesos', unidadId: 'operaciones', reportaA: 'coord-log', ocupanteId: 8, sucursalIds: ['central'] },
  { id: 'asist-op', nombre: 'Asistente Operativo', unidadId: 'operaciones', reportaA: 'coord-log', ocupanteId: null, sucursalIds: ['cbb', 'oru', 'pot'] },
  { id: 'limpieza-ext', nombre: 'Servicio de Limpieza', unidadId: 'operaciones', reportaA: 'coord-log', ocupanteId: null, tipo: 'outsourcing', sucursalIds: [] },

  { id: 'tesorero', nombre: 'Tesorero', unidadId: 'finanzas', reportaA: 'gg', ocupanteId: 23, sucursalIds: ['central'] },
  { id: 'contador', nombre: 'Contador General', unidadId: 'finanzas', reportaA: 'tesorero', ocupanteId: 10, sucursalIds: ['central'] },
  { id: 'analista-fin', nombre: 'Analista Financiera', unidadId: 'finanzas', reportaA: 'tesorero', ocupanteId: 17, sucursalIds: ['central'] },

  { id: 'dis-ux', nombre: 'Diseñadora UX/UI', unidadId: 'diseno', reportaA: 'gg', ocupanteId: 3, sucursalIds: ['central'] },
  { id: 'dis-graf', nombre: 'Diseñadora Gráfica', unidadId: 'diseno', reportaA: 'dis-ux', ocupanteId: 19, sucursalIds: ['central'] },
]

/* Las relaciones que NO son la línea de mando. Van en su propia lista y no como un campo del
   cargo, porque son varias por cargo y porque cada una tiene su propia vigencia.

   `calidad` distingue las dos formas de coordinar y solo aplica al tipo `funcional`:
     · `par`                 — trabajan en conjunto, ninguno manda sobre el otro
     · `supervisor_funcional` — el destino le supervisa una parte del trabajo al origen,
                                sin ser su jefe

   Guardar la coordinación sin calidad sería capturar el dato y perder justo lo que lo hace
   útil: Desempeño necesita saber si el contraparte evalúa como par o como supervisor.

   `hasta: null` = vigente. Nada se borra: cuando una relación termina se le pone fecha. */
export const relaciones = [
  { id: 'r1', origen: 'dir-rrhh', destino: 'coord-log', tipo: 'funcional', calidad: 'par', desde: '2026-01-15', hasta: null },
  { id: 'r2', origen: 'dis-ux', destino: 'dir-mkt', tipo: 'funcional', calidad: 'par', desde: '2026-02-01', hasta: null },
  { id: 'r3', origen: 'dis-graf', destino: 'dir-mkt', tipo: 'funcional', calidad: 'supervisor_funcional', desde: '2026-02-01', hasta: null },
  { id: 'r4', origen: 'analista-fin', destino: 'nominas', tipo: 'funcional', calidad: 'par', desde: '2026-03-10', hasta: null },
  { id: 'r5', origen: 'qa', destino: 'dev-back', tipo: 'funcional', calidad: 'par', desde: '2026-01-20', hasta: null },
  { id: 'r6', origen: 'asist-op', destino: 'contador', tipo: 'funcional', calidad: 'supervisor_funcional', desde: '2026-04-02', hasta: null },
]

/* Estructura de arranque. La pantalla la clona en su estado persistido y a partir de ahí
   trabaja sobre la copia; esta constante nunca se muta. */
export const orgSeed = { unidades, cargos, relaciones }

/* Con qué arranca una demo reseteada. Las sucursales NO están aquí: son datos de la empresa
   —existen antes de que nadie dibuje un organigrama— y por eso sobreviven al reseteo. Lo que
   se construye desde cero son las áreas y los cargos. */
export const orgVacio = { unidades: [], cargos: [], relaciones: [] }

const personaPorId = new Map(colaboradoresData.map(c => [c.id, c]))

export const getPersona = id => (id == null ? null : personaPorId.get(id) || null)
export const getUnidad = (id, org = orgSeed) => org.unidades.find(u => u.id === id) || null

/* Lateral = va al COSTADO del jefe en vez de bajar en la línea. Hoy solo el staff, que es lo
   que un staff es: alguien que asiste a un cargo sin estar en su línea de mando.

   El OUTSOURCING dejó de ser lateral. Un servicio tercerizado sí depende de quien lo contrata
   y sí pertenece al área que lo usa, así que se dibuja como cualquier otro reporte —abajo, y
   dentro de la píldora de su unidad—; lo que lo distingue es que no es de la empresa, y eso
   ya lo dicen su color violeta y su línea punteada. Sacado al costado, un área con dos
   servicios tercerizados no mostraba de qué área eran.

   Se pregunta por la lateralidad y no por el tipo para que agregar mañana otro tipo lateral no
   obligue a tocar el algoritmo del árbol. */
const esLateral = c => c.tipo === 'staff'

/* Los tipos que hay que GUARDAR: de nada se deduce que un puesto es externo o de apoyo, así que
   se declaran. Jefe y Colaborador no entran —`tipoDe` los saca de tener o no gente a cargo— y
   escribirlos dejaría en el dato una etiqueta que se contradice sola en cuanto alguien mueve un
   cargo de lugar. */
export const esTipoDeclarado = tipo => tipo === 'staff' || tipo === 'outsourcing'

/* Un cargo lo pueden ocupar VARIAS personas: "Ejecutiva Comercial" puede tener tres. Por eso
   los ocupantes son una lista y no un id suelto, que obligaba a duplicar el cuadro —con su
   tipo, sus sedes y mañana su ruta de onboarding— una vez por persona.

   Cuántas caben lo dice `plazas` (ver `plazasDe`, más abajo): la lista de ocupantes es quiénes
   están, y las plazas son cuántos entran.

   El campo viejo de un solo ocupante se sigue leyendo: hay organigramas guardados con él y
   no hace falta migrarlos para que se vean bien. */
export const ocupantesDe = cargo => (
  cargo.ocupantes ?? (cargo.ocupanteId != null ? [cargo.ocupanteId] : [])
)

/* CUÁNTA GENTE CABE EN EL PUESTO. Un cargo es una posición con N plazas: cuatro ejecutivas
   comerciales son un cuadro con cuatro plazas, no cuatro cuadros repetidos. Es lo que convierte
   "vacante" en una cuenta —cuántas quedan por cubrir— en vez de un sí o un no.

   Sin declarar vale UNA, que es el caso normal y el de todo lo que se guardó antes de que este
   campo existiera. Nunca menos que la gente que ya tiene adentro: un dato importado puede traer
   más ocupantes que plazas, y el cupo no puede desmentir a quien ya está trabajando ahí. */
export const plazasDe = cargo => Math.max(cargo.plazas ?? 1, ocupantesDe(cargo).length)

/* EL APOYO FUNCIONAL. Un cargo PERTENECE a un área —`unidadId`, la que manda: ahí está su jefe,
   su presupuesto y su evaluación— y además puede TRABAJAR en otras. El Community Manager es de
   Marketing y apoya a Contenidos y Creatividad: en Contenidos no es un puesto del área, es
   alguien que ayuda ahí.

   Son dos preguntas distintas y por eso son dos campos distintos. Metidas en uno solo se pierde
   cuál de las dos áreas es la verdadera, que es la que necesita saber toda la aplicación —quién
   lo evalúa, en qué área se cuenta, de qué presupuesto sale—.

   En el área que apoya se dibuja como cualquier otro cargo —mismo tamaño, misma línea, se abre
   igual— y solo cambia el color, que dice que viene prestado. Pero sigue contándose UNA vez:
   el área tiene los cargos que tiene, no uno más porque alguien la ayude.

   Cada asignación funcional tiene DOS datos: en qué área trabaja y, si corresponde, a quién le
   responde ahí. Lo segundo no siempre existe —se puede apoyar a un área sin tener un jefe
   funcional— y por eso `reportaA` es opcional; cuando está, el cuadro cuelga de esa persona
   igual que cualquier reporte. */
export const funcionalesDe = cargo => (
  cargo.funcionales
  /* Formato viejo: una lista de áreas sin jefe funcional. Se sigue leyendo para no migrar a
     mano lo que ya se guardó. */
  ?? (cargo.unidadesFuncionales || []).map(unidadId => ({ unidadId, reportaA: null }))
)

export const areasQueApoya = cargo => funcionalesDe(cargo).map(f => f.unidadId)

/* Quiénes apoyan a un área desde afuera. Es la pregunta al revés, la que se hace parado en el
   área: "¿quién más trabaja acá sin ser de acá?". Devuelve el cargo junto con a quién le
   responde en esa área, que es lo que decide de dónde cuelga su cuadro. */
export const apoyosDeUnidad = (unidadId, org = orgSeed) => org.cargos
  .map(c => {
    const f = funcionalesDe(c).find(x => x.unidadId === unidadId)
    return f ? { cargo: c, reportaA: f.reportaA || null } : null
  })
  .filter(Boolean)

/* El rótulo de las plazas por cubrir. Vive acá porque lo dibujan tres pantallas —el árbol, las
   cards y la tabla— y tres textos para el mismo dato se despegan al primer cambio. */
export const rotuloVacantes = libres => (libres === 1 ? 'Vacante' : `${libres} vacantes`)

/* Dónde está parada una persona en el organigrama: el cuadro que ocupa, o nada. Nadie ocupa
   dos puestos —la lista de Colaboradores del modal no deja marcar a quien ya tiene uno— así
   que el `find` devuelve el único; en un organigrama guardado antes de esa regla, el primero. */
export const cuadroDe = (persona, org = orgSeed) => (persona
  ? org.cargos.find(c => ocupantesDe(c).includes(persona.id)) || null
  : null)

/* El cargo de una persona. Manda el CUADRO que ocupa, no el campo del directorio: el
   organigrama es donde se decide la estructura, y tener el dato escrito en dos lados garantiza
   que tarde o temprano digan cosas distintas.

   El campo del directorio no se borra: queda de respaldo para quien todavía no está en ningún
   cuadro. El organigrama arranca vacío, así que sin ese respaldo el directorio se quedaría sin
   un solo cargo hasta que alguien lo dibuje. */
export function cargoDe(persona, org = orgSeed) {
  const cuadro = cuadroDe(persona, org)
  return cuadro ? cuadro.nombre : (persona?.cargo || null)
}

/* El área de una persona: la unidad del cuadro que ocupa. Sin cuadro no hay área —y acá NO hay
   respaldo del directorio a propósito: el área de alguien es consecuencia de dónde está parado
   en la estructura, así que quien no está en ninguna parte no pertenece a un área, aunque el
   directorio traiga un `depto` escrito de antes. */
export function areaDe(persona, org = orgSeed) {
  const cuadro = cuadroDe(persona, org)
  return cuadro ? (getUnidad(cuadro.unidadId, org)?.nombre || null) : null
}

/* `vacante` sigue queriendo decir "no hay NADIE": es lo que pinta el cuadro de amarillo, y un
   puesto con tres de cinco plazas cubiertas no está vacante, está incompleto. Las plazas por
   cubrir son `libres`, que es otra pregunta y por eso es otro campo. */
const estadoDeOcupantes = cargo => {
  const ocupantes = ocupantesDe(cargo).map(getPersona).filter(Boolean)
  const plazas = plazasDe(cargo)
  return {
    ocupantes,
    plazas,
    libres: Math.max(0, plazas - ocupantes.length),
    vacante: ocupantes.length === 0,
  }
}

const nodoSuelto = cargo => ({
  tipo: 'cargo', id: cargo.id, cargo,
  ...estadoDeOcupantes(cargo),
  staff: [], hijos: [],
})

/* `vistos` corta los ciclos: al editar "reporta a" se puede dejar a un cargo colgando de su
   propio subordinado, y sin este tope la recursión revienta la pila. */
function nodoCargo(cargo, org, verUnidades, vistos, conFuncionales) {
  if (vistos.has(cargo.id)) return nodoSuelto(cargo)
  vistos.add(cargo.id)
  return {
    ...nodoSuelto(cargo),
    staff: org.cargos.filter(c => c.reportaA === cargo.id && esLateral(c)).map(nodoSuelto),
    hijos: agruparHijos(cargo, org, verUnidades, vistos, conFuncionales),
  }
}

/* Un hijo que pertenece a otra unidad que su jefe entra envuelto en la píldora de esa
   unidad; el que comparte unidad cuelga directo. Así el árbol muestra dónde empieza
   cada área sin declarar la jerarquía dos veces. */
function agruparHijos(cargo, org, verUnidades, vistos, conFuncionales) {
  const hijos = org.cargos.filter(c => c.reportaA === cargo.id && !esLateral(c))
  /* En "Ver por cargos" no hay píldoras de área, así que solo aparecen los apoyos que declararon
     a quién le responden: esos cuelgan de esa persona igual que en el organigrama completo. Los
     que apoyan al área sin jefe funcional se quedan afuera —no por regla, sino porque no hay de
     dónde colgarlos cuando el área no está dibujada—. */
  if (!verUnidades) {
    return [
      ...hijos.map(h => nodoCargo(h, org, verUnidades, vistos, conFuncionales)),
      ...(conFuncionales ? apoyosDeJefe(cargo, org) : []),
    ]
  }

  const salida = []
  const grupoPorUnidad = new Map()
  for (const hijo of hijos) {
    if (hijo.unidadId === cargo.unidadId) {
      salida.push(nodoCargo(hijo, org, verUnidades, vistos, conFuncionales))
      continue
    }
    let grupo = grupoPorUnidad.get(hijo.unidadId)
    if (!grupo) {
      grupo = nodoUnidad(getUnidad(hijo.unidadId, org), org, `u-${hijo.unidadId}`, conFuncionales)
      grupoPorUnidad.set(hijo.unidadId, grupo)
      salida.push(grupo)
    }
    grupo.hijos.push(nodoCargo(hijo, org, verUnidades, vistos, conFuncionales))
  }
  /* Los prestados van al final de cada fila: primero los cargos que el área tiene, después los
     que le ayudan desde afuera. */
  for (const grupo of grupoPorUnidad.values()) grupo.hijos.push(...grupo.apoyos)
  if (conFuncionales) salida.push(...apoyosDeJefe(cargo, org))
  return salida
}

/* La píldora de un área, con los apoyos que le llegan de afuera colgados. Se arma acá y no en
   cada sitio que la necesita —son cuatro— porque agregarle un dato a la píldora en tres de los
   cuatro es la forma segura de que el cuarto dibuje un área sin apoyos que sí los tiene. */
/* EL CUADRO DE APOYO. Es el mismo puesto dibujado en el área donde ayuda, y se comporta como
   cualquier otro cargo: cuelga en la línea, se abre igual, ocupa su lugar en la fila. Lo único
   distinto es el color y la línea punteada, que dicen que viene prestado de otra área.

   `clave` e `id` llevan el área adelante porque el MISMO cargo aparece en dos lugares del
   dibujo: sin eso React repite claves y arrastrar un cuadro movería al otro. */
const nodoApoyo = (cargo, unidadId, org) => ({
  ...nodoSuelto(cargo),
  id: `f-${unidadId}-${cargo.id}`,
  clave: `f:${unidadId}:${cargo.id}`,
  funcional: true,
  deArea: getUnidad(cargo.unidadId, org)?.nombre || null,
})

/* Los apoyos de un área que NO declararon jefe funcional: cuelgan de la píldora, como cualquier
   cargo del área que no tiene jefe adentro. Los que sí lo declararon cuelgan de esa persona
   —ver `agruparHijos`— y por eso no entran acá. */
const apoyosSinJefe = (unidadId, org) => apoyosDeUnidad(unidadId, org)
  .filter(a => !a.reportaA || !org.cargos.some(c => c.id === a.reportaA))
  .map(a => nodoApoyo(a.cargo, unidadId, org))

/* Los apoyos que le responden a un cargo dentro del área que apoyan. */
const apoyosDeJefe = (cargo, org) => apoyosDeUnidad(cargo.unidadId, org)
  .filter(a => a.reportaA === cargo.id)
  .map(a => nodoApoyo(a.cargo, cargo.unidadId, org))

const nodoUnidad = (unidad, org, id = `u-${unidad?.id}`, conFuncionales = true) => ({
  tipo: 'unidad',
  id,
  unidad,
  staff: [],
  /* Se guardan aparte y se agregan al final: los hijos estructurales se van empujando después
     de crear el nodo, y prellenar `hijos` pondría a los prestados delante de los propios. */
  apoyos: unidad && conFuncionales ? apoyosSinJefe(unidad.id, org) : [],
  hijos: [],
})

/* modo: 'completo' (unidades + cargos) | 'cargos' (solo cargos) | 'unidades' (solo áreas) */
/* `conFuncionales` es de VISTA y no del dato: enciende y apaga los cuadros de apoyo que llegan
   de otras áreas. Se decide afuera y baja hasta acá porque lo que cambia es el árbol que se
   arma, no el estilo de algo ya dibujado. */
export function buildOrgTree(modo = 'completo', org = orgSeed, opciones = {}) {
  const { funcionales: conFuncionales = true, vacias: conVacias = true } = opciones
  if (modo === 'unidades') {
    /* SIN APOYOS, aunque el interruptor esté encendido. Esta vista es la estructura de áreas y
       nada más: no dibuja un solo cargo, así que un cuadro de apoyo sería el único cargo del
       dibujo y encima uno prestado. Lo mismo pasa en "Ver por cargos", que es solo la línea de
       mando: un apoyo no es línea de mando. Los cuadros funcionales viven en el organigrama
       completo, que es donde conviven áreas y cargos. */
    const rama = u => ({
      ...nodoUnidad(u, org, undefined, false),
      hijos: org.unidades.filter(x => x.padreId === u.id).map(rama),
    })
    return { tipo: 'empresa', id: 'empresa', empresa, staff: [], hijos: org.unidades.filter(u => u.padreId === null).map(rama) }
  }

  /* RAÍCES, en plural. Antes se tomaba solo la primera y cualquier otro cargo sin jefe —con
     todo lo que colgara de él— desaparecía del dibujo: se guardaba y no se veía. Un organigrama
     a medio armar tiene varias piezas todavía sin enganchar, y hay que poder verlas para
     engancharlas.

     `vistos` es uno solo para todas: corta ciclos y además evita que un cargo aparezca dos
     veces si el dato quedó encadenado de forma rara. */
  const raices = org.cargos.filter(c => c.reportaA === null)
  const vistos = new Set()
  const nodos = raices.map(r => nodoCargo(r, org, modo === 'completo', vistos, conFuncionales))

  /* "Ver por cargos" es solo la línea de mando: ahí no se dibuja ninguna unidad, ni siquiera
     las que todavía no tienen a nadie. */
  if (modo !== 'completo') {
    return { tipo: 'empresa', id: 'empresa', empresa, staff: [], hijos: nodos }
  }

  /* En "completo" cada raíz entra envuelta en la píldora de su unidad, igual que cualquier
     otro cargo que abre unidad. Las que comparten unidad comparten píldora. */
  const grupos = []
  const porUnidad = new Map()
  for (const nodo of nodos) {
    const uid = nodo.cargo.unidadId
    let grupo = porUnidad.get(uid)
    if (!grupo) {
      grupo = nodoUnidad(getUnidad(uid, org), org, `u-raiz-${uid}`, conFuncionales)
      porUnidad.set(uid, grupo)
      grupos.push(grupo)
    }
    grupo.hijos.push(nodo)
  }
  for (const grupo of porUnidad.values()) grupo.hijos.push(...grupo.apoyos)
  /* Las áreas sin cargos se rescatan solo cuando se está mirando la empresa entera. Ese
     rescate existe para el organigrama que recién se empieza —un área creada todavía sin
     puestos tiene que verse para poder llenarla—, pero al filtrar por sede significaba otra
     cosa: dibujaba "Finanzas" en El Alto, donde Finanzas no tiene un solo puesto. Un filtro
     contesta qué hay ACÁ, y un área sin cargos acá no está. */
  const hijos = conVacias ? colgarUnidadesVacias(grupos, org, conFuncionales) : grupos
  return { tipo: 'empresa', id: 'empresa', empresa, staff: [], hijos }
}

/* Una unidad sin ningún cargo no tiene de dónde colgarse en un árbol que se arma desde los
   cargos. Antes se agregaban todas al pie, en fila, y ahí aparecía el problema de verdad: se
   creaba una sub-unidad dentro de Marketing y se dibujaba AL LADO de Marketing, no debajo. El
   dato estaba bien; el dibujo decía otra cosa.

   Ahora cada una se engancha a la píldora de su unidad madre cuando esa píldora está dibujada,
   y las vacías se anidan entre ellas —que es el caso de un organigrama recién empezado, donde
   todavía no hay ni un cargo y toda la estructura son unidades—. Solo queda al pie lo que
   cuelga de la empresa o lo que perdió a su madre. */
function colgarUnidadesVacias(hijosRaiz, org, conFuncionales) {
  const vacias = org.unidades.filter(u => !org.cargos.some(c => c.unidadId === u.id))
  if (!vacias.length) return hijosRaiz

  /* Dónde quedó dibujada cada unidad que sí tiene cargos. Una unidad puede aparecer en más de
     un lugar del árbol —abre píldora cada vez que un jefe de otra unidad tiene hijos suyos—;
     se toma la primera para no duplicar la sub-unidad en todas. */
  const pildoras = new Map()
  const recorrer = nodos => {
    for (const n of nodos) {
      if (n.tipo === 'unidad' && n.unidad && !pildoras.has(n.unidad.id)) pildoras.set(n.unidad.id, n)
      if (n.hijos?.length) recorrer(n.hijos)
    }
  }
  recorrer(hijosRaiz)

  const idsVacias = new Set(vacias.map(u => u.id))
  const construir = u => {
    const nodo = nodoUnidad(u, org, undefined, conFuncionales)
    return {
      ...nodo,
      sinCargos: true,
      hijos: [...vacias.filter(x => x.padreId === u.id).map(construir), ...nodo.apoyos],
    }
  }

  /* Las cimas son las vacías cuya madre NO es otra vacía: las demás ya entran anidadas dentro
     de ellas y colocarlas otra vez las dibujaría dos veces. */
  const alPie = []
  for (const u of vacias.filter(x => !x.padreId || !idsVacias.has(x.padreId))) {
    const nodo = construir(u)
    const madre = u.padreId ? pildoras.get(u.padreId) : null
    if (madre) madre.hijos.push(nodo)
    else alPie.push(nodo)
  }
  return [...hijosRaiz, ...alPie]
}

/* Forma común de una fila/tarjeta de cargo: la comparten la tabla, las cards y el buscador. */
const datosFila = (cargo, org) => ({
  cargo,
  unidad: getUnidad(cargo.unidadId, org),
  tipo: tipoDe(cargo, org),
  sedes: sucursalesDe(cargo, org),
  ...estadoDeOcupantes(cargo),
  jefeNombre: cargo.reportaA ? (org.cargos.find(c => c.id === cargo.reportaA)?.nombre ?? null) : null,
})

/* La cabeza de un área es el cargo cuyo jefe está fuera del área: es por donde el área
   se engancha al resto de la empresa. */
export function cabezaDe(unidadId, org = orgSeed) {
  const propios = org.cargos.filter(c => c.unidadId === unidadId)
  return propios.find(c => !c.reportaA || !propios.some(p => p.id === c.reportaA)) || propios[0] || null
}

export const unidadesRaiz = (org = orgSeed) => org.unidades.filter(u => u.padreId === null)

export const subunidadesDe = (unidadId, org = orgSeed) => org.unidades.filter(u => u.padreId === unidadId)

export function tarjetaUnidad(unidadId, org = orgSeed) {
  return {
    unidad: getUnidad(unidadId, org),
    cabeza: cabezaDe(unidadId, org),
    totalCargos: org.cargos.filter(c => c.unidadId === unidadId).length,
    totalSub: subunidadesDe(unidadId, org).length,
  }
}

export const cargosDeUnidad = (unidadId, org = orgSeed) =>
  org.cargos.filter(c => c.unidadId === unidadId).map(c => datosFila(c, org))

export function buscarCargos(texto, org = orgSeed) {
  const q = texto.trim().toLowerCase()
  if (!q) return []
  return org.cargos
    .map(c => datosFila(c, org))
    .filter(f =>
      f.cargo.nombre.toLowerCase().includes(q) ||
      /* Por CADA ocupante. Antes miraba `f.ocupante` en singular, un campo que dejó de existir
         cuando un cargo pasó a poder tener varios: buscar por el nombre de una persona no
         encontraba nada, en ninguna de las tres vistas. */
      f.ocupantes.some(p => p.name.toLowerCase().includes(q)) ||
      (f.unidad?.nombre || '').toLowerCase().includes(q))
}

/* La tabla agrupa por ÁREA, no por unidad exacta: las subunidades (Marketing Digital,
   Contenidos) caen dentro de la banda de su área madre y se distinguen por la píldora
   "Pertenece a". Por eso el grupo es el ancestro que cuelga directo de la raíz. */
export function grupoDe(unidadId, org = orgSeed) {
  let u = getUnidad(unidadId, org)
  if (!u) return null
  while (u.padreId) {
    const padre = getUnidad(u.padreId, org)
    if (!padre || padre.padreId === null) break
    u = padre
  }
  return u
}

/* Lo declarado gana; lo que no se declaró se deduce. Staff y Outsourcing no se pueden
   deducir de nada, así que siempre vienen declarados. Jefe y colaborador sí: tener gente
   debajo es exactamente lo que los distingue, y deducirlo evita que el árbol se contradiga
   con su propia etiqueta cuando alguien mueve un cargo. */
export const tipoDe = (cargo, org = orgSeed) => {
  if (cargo.tipo && cargo.tipo !== 'jefe' && cargo.tipo !== 'colaborador') return cargo.tipo
  return org.cargos.some(c => c.reportaA === cargo.id) ? 'jefe' : 'colaborador'
}

/* Devuelve las filas ya ordenadas jerárquicamente y con el nivel de sangría calculado
   dentro de cada grupo, para que la tabla solo tenga que pintarlas. */
export function filasTabla(org = orgSeed) {
  const grupos = []
  const indice = new Map()
  const vistos = new Set()

  const claveGrupo = unidadId => grupoDe(unidadId, org)?.id || 'sin-unidad'

  const empujar = (cargo, profundidad) => {
    if (vistos.has(cargo.id)) return
    vistos.add(cargo.id)

    const clave = claveGrupo(cargo.unidadId)
    let grupo = indice.get(clave)
    if (!grupo) {
      grupo = { id: clave, unidad: grupoDe(cargo.unidadId, org), filas: [] }
      indice.set(clave, grupo)
      grupos.push(grupo)
    }

    const nivel = grupo.filas.length === 0 ? 0 : profundidad
    grupo.filas.push({ ...datosFila(cargo, org), nivel })

    for (const hijo of org.cargos.filter(c => c.reportaA === cargo.id)) {
      const mismoGrupo = claveGrupo(hijo.unidadId) === clave
      empujar(hijo, mismoGrupo ? nivel + 1 : 0)
    }
  }

  const raiz = org.cargos.find(c => c.reportaA === null)
  if (raiz) empujar(raiz, 0)
  // Un cargo cuyo jefe fue borrado quedaría fuera del recorrido: se lista igual.
  for (const c of org.cargos) empujar(c, 0)

  return grupos
}

/* ---------- Relaciones funcionales ---------- */

export const CALIDADES = [
  { key: 'par', label: 'Par', desc: 'Trabajan en conjunto; ninguno manda sobre el otro' },
  { key: 'supervisor_funcional', label: 'Supervisor funcional', desc: 'Le supervisa una parte del trabajo, sin ser su jefe' },
]

export const etiquetaCalidad = k => CALIDADES.find(c => c.key === k)?.label || k

/* Solo las vigentes: una relación cerrada sigue en la lista para poder reconstruir el pasado,
   pero no se dibuja en el organigrama de hoy. */
export const coordinaciones = (org = orgSeed) =>
  (org.relaciones || []).filter(r => r.tipo === 'funcional' && !r.hasta)

/* Las coordinaciones de un cargo, mire desde donde se mire: da igual si el cargo las declaró
   o si se las declararon a él. Quien abre una ficha quiere ver con quién coordina, no quién
   escribió la fila. */
export function coordinacionesDe(cargoId, org = orgSeed) {
  const porId = new Map(org.cargos.map(c => [c.id, c]))
  return coordinaciones(org)
    .filter(r => r.origen === cargoId || r.destino === cargoId)
    .map(r => {
      const esOrigen = r.origen === cargoId
      const otro = porId.get(esOrigen ? r.destino : r.origen)
      return {
        id: r.id,
        calidad: r.calidad,
        contraparte: otro || null,
        /* En una supervisión importa de qué lado está cada uno; entre pares, no. */
        rol: r.calidad !== 'supervisor_funcional' ? 'par'
          : esOrigen ? 'supervisado' : 'supervisor',
      }
    })
    .filter(c => c.contraparte)
}

/* ---------- Ubicaciones ---------- */

export const TODAS_SUCURSALES = 'todas'

export const sucursalesDe = (cargo, org = orgSeed) => {
  const ids = cargo.sucursalIds || []
  return sucursales.filter(s => ids.includes(s.id))
}

/* Un cargo sin sedes declaradas se considera presente en todas: es lo que evita que al
   filtrar desaparezca de la vista un cargo al que todavía nadie le cargó la sede. */
export const estaEnSucursal = (cargo, sucursalId) => {
  if (!sucursalId || sucursalId === TODAS_SUCURSALES) return true
  const ids = cargo.sucursalIds || []
  return ids.length === 0 || ids.includes(sucursalId)
}

/* Recorta la estructura a una sede. Un cargo también se queda si alguien debajo suyo está en
   la sede aunque él no lo esté: sacar a un jefe intermedio dejaría a su gente sin de quién
   colgar y partiría el árbol en pedazos sueltos. Filtrar un organigrama es quedarse con las
   ramas que llegan a esa sede, no con una lista de cargos. */
export function filtrarPorSucursal(org, sucursalId) {
  if (!sucursalId || sucursalId === TODAS_SUCURSALES) return org

  const hijosDe = new Map()
  org.cargos.forEach(c => {
    const lista = hijosDe.get(c.reportaA) || []
    lista.push(c)
    hijosDe.set(c.reportaA, lista)
  })

  const resuelto = new Map()
  const alcanza = cargo => {
    if (resuelto.has(cargo.id)) return resuelto.get(cargo.id)
    resuelto.set(cargo.id, false) // corta ciclos si el dato quedó mal encadenado
    const r = estaEnSucursal(cargo, sucursalId)
      || (hijosDe.get(cargo.id) || []).some(alcanza)
    resuelto.set(cargo.id, r)
    return r
  }

  const cargos = org.cargos.filter(alcanza)
  const vivos = new Set(cargos.map(c => c.id))
  return {
    ...org,
    cargos,
    relaciones: (org.relaciones || []).filter(r => vivos.has(r.origen) && vivos.has(r.destino)),
  }
}

export const TODAS_UNIDADES = 'todas'

/* El área pedida y todas las que cuelgan dentro de ella. "Ver Marketing" tiene que traerse
   Marketing Digital y Contenidos: son parte de Marketing, no vecinas suyas. */
export function ramaDeUnidad(unidadId, org = orgSeed) {
  const ids = new Set([unidadId])
  let crecio = true
  while (crecio) {
    crecio = false
    for (const u of org.unidades) {
      if (!ids.has(u.id) && u.padreId && ids.has(u.padreId)) { ids.add(u.id); crecio = true }
    }
  }
  return ids
}

/* RECORTA LA ESTRUCTURA A UN ÁREA. Es un alcance y no un modo de dibujar: "solo Marketing" vale
   igual en las tres pestañas, así que se aplica antes de armar el árbol y no dentro.

   Se lleva tres cosas: el área, sus sub-áreas, y TODO LO QUE DEPENDE de sus cargos aunque sea
   de otra área —si un cargo de Ventas le reporta a la jefatura de Marketing, en la vista de
   Marketing tiene que estar, porque depende de ahí—.

   Y reengancha lo que quedó colgando: el jefe del área tenía un jefe afuera, que ya no está,
   así que pasa a ser raíz. Sin esto el árbol se arma desde `reportaA === null` y no encuentra
   ninguna raíz: el dibujo sale vacío con todos los datos presentes.

   Las áreas de los cargos traídos de afuera también se conservan, o la píldora que los envuelve
   se quedaría sin nombre. */
/* Los cargos que PERTENECEN a un grupo de áreas, más todo lo que cuelga de ellos. Es la cuenta
   estructural del área: la que se muestra al lado de su nombre y la que dibuja el árbol. */
function cargosEstructurales(areas, org) {
  const dentro = new Set(org.cargos.filter(c => areas.has(c.unidadId)).map(c => c.id))
  let crecio = true
  while (crecio) {
    crecio = false
    for (const c of org.cargos) {
      if (!dentro.has(c.id) && c.reportaA && dentro.has(c.reportaA)) { dentro.add(c.id); crecio = true }
    }
  }
  return dentro
}

export function filtrarPorUnidad(org, unidadId) {
  if (!unidadId || unidadId === TODAS_UNIDADES) return org

  const areas = ramaDeUnidad(unidadId, org)
  const dentro = cargosEstructurales(areas, org)

  /* Los que APOYAN al área desde afuera viajan también, o al filtrar por Contenidos el cuadro
     de apoyo del Community Manager desaparecería justo en la vista que existe para ver el
     equipo real del área.
     Van SIN reenganchar a propósito: conservan su `reportaA` original, que en este recorte ya
     no existe, así que `buildOrgTree` —que baja desde las raíces— nunca los alcanza y no se
     dibujan en la línea de mando. Quedan solo para que `apoyosDeUnidad` los encuentre y los
     ponga al costado de la píldora, que es donde corresponden. */
  const apoyan = new Set(
    org.cargos.filter(c => areasQueApoya(c).some(u => areas.has(u))).map(c => c.id),
  )

  const cargos = org.cargos
    .filter(c => dentro.has(c.id) || apoyan.has(c.id))
    .map(c => {
      if (!dentro.has(c.id)) return c
      return c.reportaA && dentro.has(c.reportaA) ? c : { ...c, reportaA: null }
    })

  const vivas = new Set(areas)
  cargos.forEach(c => vivas.add(c.unidadId))
  const unidades = org.unidades
    .filter(u => vivas.has(u.id))
    .map(u => (u.padreId && vivas.has(u.padreId) ? u : { ...u, padreId: null }))

  return {
    ...org,
    unidades,
    cargos,
    relaciones: (org.relaciones || []).filter(r => dentro.has(r.origen) && dentro.has(r.destino)),
  }
}

/* Cuántos cargos entran en la vista de un área. Es lo que el desplegable muestra al lado de cada
   nombre: elegir a ciegas entre veinte áreas y encontrar una vista de un solo cuadro es el
   camino largo para averiguar lo mismo.

   Cuenta los ESTRUCTURALES: los apoyos que llegan de afuera se dibujan pero no son del área, y
   sumarlos haría que el desplegable prometa más cargos de los que el área tiene. */
export const cargosEnRama = (unidadId, org = orgSeed) =>
  cargosEstructurales(ramaDeUnidad(unidadId, org), org).size

/* ---------- Altas, bajas y modificaciones ---------- */

/* Ids de lo que se crea en la sesión. Van con prefijo propio para no chocar nunca con
   los sembrados, y se recalculan sobre la lista real porque el organigrama se persiste:
   un contador en memoria arrancaría de cero después de recargar y pisaría ids. */
export function nuevoId(prefijo, lista) {
  let n = lista.length + 1
  while (lista.some(x => x.id === `${prefijo}-${n}`)) n += 1
  return `${prefijo}-${n}`
}

/* Ids del cargo y de todo lo que cuelga debajo. Sirve para no ofrecer como jefe a un
   subordinado propio, que dejaría el árbol en ciclo. */
export function descendientesDe(cargoId, org) {
  const dentro = new Set([cargoId])
  let cambio = true
  while (cambio) {
    cambio = false
    for (const c of org.cargos) {
      if (c.reportaA && dentro.has(c.reportaA) && !dentro.has(c.id)) {
        dentro.add(c.id)
        cambio = true
      }
    }
  }
  return dentro
}

/* Los pares de un cargo: los que se dibujan en su misma fila. Se pregunta por la lateralidad
   y no por el tipo porque el árbol dibuja dos filas distintas —la línea de mando abajo, los
   laterales al costado— y mover un staff entre los reportes de su jefe no lo movería de lugar
   en el dibujo. Salen en el orden en que se dibujan, que es el de la lista de cargos. */
export function paresDe(cargo, org) {
  if (!cargo) return []
  const lateral = esLateral(cargo)
  return org.cargos.filter(c => c.reportaA === cargo.reportaA && esLateral(c) === lateral)
}

/* Mover un cargo entre sus pares. El orden del dibujo ES el orden de la lista de cargos, así
   que no hace falta un campo nuevo: se reordena la lista. Los pares vuelven a los mismos
   lugares que ocupaban —solo cambia cuál va en cada uno— para no alterar la posición de nadie
   más ni el orden en que se leen las otras ramas.

   Y sí cambia el dibujo de verdad: entre los laterales, el orden decide de qué lado del jefe
   cae cada uno; entre los reportes, quién queda a la izquierda. */
export function moverEntrePares(cargoId, nuevaPos, org) {
  const cargo = org.cargos.find(c => c.id === cargoId)
  const pares = paresDe(cargo, org)
  const actual = pares.findIndex(c => c.id === cargoId)
  const destino = Math.max(0, Math.min(pares.length - 1, nuevaPos))
  if (actual < 0 || actual === destino) return org

  const orden = pares.filter(c => c.id !== cargoId)
  orden.splice(destino, 0, cargo)

  const huecos = []
  org.cargos.forEach((c, i) => { if (pares.some(p => p.id === c.id)) huecos.push(i) })
  const cargos = [...org.cargos]
  huecos.forEach((hueco, i) => { cargos[hueco] = orden[i] })
  return { ...org, cargos }
}

/* Al borrar un cargo sus subordinados suben un escalón y quedan colgando del jefe que
   tenía el borrado, en vez de desaparecer del árbol. */
export function eliminarCargo(cargoId, org) {
  const cargo = org.cargos.find(c => c.id === cargoId)
  if (!cargo) return org
  return {
    ...org,
    cargos: org.cargos
      .filter(c => c.id !== cargoId)
      .map(c => (c.reportaA === cargoId ? { ...c, reportaA: cargo.reportaA } : c)),
    // Sus coordinaciones se van con él: una relación a un cargo que ya no existe
    // dibujaría una línea contra la nada.
    relaciones: (org.relaciones || []).filter(r => r.origen !== cargoId && r.destino !== cargoId),
  }
}

/* Un área no se borra en cascada: arrastraría cargos y sub-áreas sin que el usuario lo
   vea venir. Devuelve el motivo por el que está bloqueada, o null si se puede borrar. */
export function bloqueoUnidad(unidadId, org) {
  const conCargos = org.cargos.filter(c => c.unidadId === unidadId).length
  if (conCargos > 0) return `Primero mueve o elimina sus ${conCargos} ${conCargos === 1 ? 'cargo' : 'cargos'}.`
  const subs = subunidadesDe(unidadId, org).length
  if (subs > 0) return `Primero mueve o elimina sus ${subs} ${subs === 1 ? 'sub-unidad' : 'sub-unidades'}.`
  if (org.unidades.length === 1) return 'Es la única unidad: la empresa necesita al menos una.'
  return null
}

export const eliminarUnidad = (unidadId, org) => ({
  ...org,
  unidades: org.unidades.filter(u => u.id !== unidadId),
})

/* Áreas que pueden ser madre de esta sin cerrar un ciclo (ni ella misma ni sus hijas). */
export function unidadesPadrePosibles(unidadId, org) {
  if (!unidadId) return org.unidades
  const dentro = new Set([unidadId])
  let cambio = true
  while (cambio) {
    cambio = false
    for (const u of org.unidades) {
      if (u.padreId && dentro.has(u.padreId) && !dentro.has(u.id)) {
        dentro.add(u.id)
        cambio = true
      }
    }
  }
  return org.unidades.filter(u => !dentro.has(u.id))
}
