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

/* TRES TIPOS, y ninguno se deduce. "Jefe / Director" era un cuarto tipo que salía de tener
   gente debajo, y se sacó por dos razones que el usuario vio antes que nadie: no es una
   naturaleza del puesto sino una consecuencia de la estructura —el mismo cargo deja de ser
   jefatura porque alguien movió a otro de lugar— y, deducido, era una etiqueta que la pantalla
   afirmaba sin que nadie pudiera decidirla.

   Quién manda se sigue leyendo donde siempre estuvo: en el dibujo, por lo que le cuelga debajo,
   y en la tabla, por la sangría y la columna "Reporta a".

   Lo que queda es de qué CLASE es el puesto, que sí es del puesto y no de su lugar: uno en
   planilla, uno que asiste al costado, o uno que cubre un tercero. Sin declarar vale
   Colaborador, que es el caso común y el de todo lo que se guardó antes. */
export const TIPOS_CARGO = [
  { key: 'colaborador', label: 'Colaborador', desc: 'En planilla, baja en la línea de mando', lateral: false },
  { key: 'staff', label: 'Staff', desc: 'Asiste a un cargo sin estar en su línea de mando', lateral: true },
  /* No es lateral: cuelga de su jefe y queda dentro de su área como cualquier otro puesto. Lo
     que dice que es externo es el color y la línea punteada, no el lugar donde se dibuja. */
  { key: 'outsourcing', label: 'Outsourcing', desc: 'Lo cubre un prestador de servicios', lateral: true },
]

/* `sucursalIds` sigue siendo una lista de a lo sumo UNA: un puesto pertenece a una sede y la
   lista vacía quiere decir "toda la empresa". Se dejó como lista y no como id suelto para no
   reescribir `estaEnSucursal` ni lo ya guardado —un dato viejo con tres sedes sigue entrando en
   el filtro por las tres hasta que alguien guarde ese puesto—.

   Lo que antes justificaba varias —"una gerencia responsable de dos regiones es UN cargo con
   dos sedes"— se cayó con el cupo de plazas: si atiende dos ciudades y hay dos personas, son
   dos puestos, cada uno con su código.

   TRES PUESTOS QUEDAN SIN OCUPANTE A PROPÓSITO —Reclutadora, Pasante Comercial y Asistente
   Operativo— y por lo tanto tres personas quedan sin cuadro. Antes las 29 del directorio
   ocupaban una casilla cada una y no quedaba NADIE libre: al abrir un puesto vacante para
   cubrirlo, la lista de colaboradores salía vacía —solo se puede asignar a quien no ocupa otro
   cuadro— y el campo parecía roto. Son los tres ingresos más recientes, así que el dato cuenta
   una historia coherente: entraron y todavía no los ubicaron en la estructura. */
export const cargos = [
  { id: 'gg', nombre: 'Gerente General', unidadId: 'direccion', reportaA: null, ocupanteId: 28, destacado: true, grado: 'superior', sucursalIds: [] },
  { id: 'asist-dir', nombre: 'Asistente de Dirección', unidadId: 'direccion', reportaA: 'gg', ocupanteId: 29, tipo: 'staff', sucursalIds: ['central'] },
  { id: 'legal-ext', nombre: 'Asesoría Legal Externa', unidadId: 'direccion', reportaA: 'gg', ocupanteId: null, tipo: 'outsourcing', sucursalIds: [] },

  { id: 'dir-tec', nombre: 'Dirección de Tecnología', unidadId: 'tecnologia', reportaA: 'gg', ocupanteId: null, grado: 'medio', sucursalIds: ['central'] },
  { id: 'dev-back', nombre: 'Desarrollador Backend', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 1, grado: 'bajo', sucursalIds: ['central'] },
  { id: 'dev-front', nombre: 'Frontend Developer', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 6, sucursalIds: ['lpz'] },
  { id: 'qa', nombre: 'QA Engineer', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 4, grado: 'bajo', sucursalIds: ['central'] },
  { id: 'devops', nombre: 'DevOps Engineer', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 14, sucursalIds: ['central'] },
  { id: 'data', nombre: 'Data Analyst', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: 20, sucursalIds: ['central'] },
  { id: 'soporte-ext', nombre: 'Soporte de Infraestructura', unidadId: 'tecnologia', reportaA: 'dir-tec', ocupanteId: null, tipo: 'outsourcing', sucursalIds: ['central'] },

  { id: 'dir-rrhh', nombre: 'Especialista RRHH', unidadId: 'rrhh', reportaA: 'gg', ocupanteId: 9, grado: 'medio', sucursalIds: ['central'] },
  { id: 'nominas', nombre: 'Analista de Nóminas', unidadId: 'rrhh', reportaA: 'dir-rrhh', ocupanteId: 15, grado: 'bajo', sucursalIds: ['central'] },
  { id: 'recluta', nombre: 'Reclutadora', unidadId: 'rrhh', reportaA: 'dir-rrhh', ocupanteId: null, sucursalIds: ['central'] },

  { id: 'dir-mkt', nombre: 'Líder de Marketing', unidadId: 'marketing', reportaA: 'gg', ocupanteId: 25, grado: 'medio', sucursalIds: ['central'] },
  { id: 'jefe-mkt-dig', nombre: 'Jefatura de Marketing Digital', unidadId: 'mkt-digital', reportaA: 'dir-mkt', ocupanteId: null, grado: 'medio', sucursalIds: ['central'] },
  /* El caso de apoyo funcional del sembrado: es de Marketing Digital y ayuda en Contenidos.
     Pertenece a una sola área —la de su jefe— y trabaja en dos. */
  { id: 'cm', nombre: 'Community Manager', unidadId: 'mkt-digital', reportaA: 'jefe-mkt-dig', ocupanteId: 11, sucursalIds: ['central'], funcionales: [{ unidadId: 'contenidos', reportaA: 'analista-mkt' }] },
  { id: 'seo', nombre: 'Especialista SEO', unidadId: 'mkt-digital', reportaA: 'jefe-mkt-dig', ocupanteId: 26, grado: 'bajo', sucursalIds: ['lpz'] },
  { id: 'analista-mkt', nombre: 'Analista de Marketing', unidadId: 'contenidos', reportaA: 'dir-mkt', ocupanteId: 13, sucursalIds: ['central'] },
  { id: 'content', nombre: 'Content Creator', unidadId: 'contenidos', reportaA: 'dir-mkt', ocupanteId: 21, sucursalIds: ['central'] },
  { id: 'marca', nombre: 'Ejecutiva de Marca', unidadId: 'contenidos', reportaA: 'dir-mkt', ocupanteId: 27, sucursalIds: ['cbb'] },

  { id: 'lider-ventas', nombre: 'Ejecutivo Senior', unidadId: 'ventas', reportaA: 'gg', ocupanteId: 12, grado: 'medio', sucursalIds: [] },
  { id: 'ejec-com', nombre: 'Ejecutiva Comercial', unidadId: 'ventas', reportaA: 'lider-ventas', ocupantes: [2], sucursalIds: ['sre'] },
  { id: 'account', nombre: 'Account Manager', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: 7, sucursalIds: ['oru'] },
  { id: 'sdr', nombre: 'SDR Junior', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: 18, sucursalIds: ['pot'] },
  { id: 'pasante', nombre: 'Pasante Comercial', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: null, sucursalIds: ['eal'] },

  { id: 'coord-log', nombre: 'Coordinador Logístico', unidadId: 'operaciones', reportaA: 'gg', ocupanteId: 16, grado: 'bajo', sucursalIds: ['tja'] },
  { id: 'analista-proc', nombre: 'Analista de Procesos', unidadId: 'operaciones', reportaA: 'coord-log', ocupanteId: 8, sucursalIds: ['central'] },
  { id: 'asist-op', nombre: 'Asistente Operativo', unidadId: 'operaciones', reportaA: 'coord-log', ocupanteId: null, sucursalIds: ['oru'] },
  { id: 'limpieza-ext', nombre: 'Servicio de Limpieza', unidadId: 'operaciones', reportaA: 'coord-log', ocupanteId: null, tipo: 'outsourcing', sucursalIds: [] },

  { id: 'tesorero', nombre: 'Tesorero', unidadId: 'finanzas', reportaA: 'gg', ocupanteId: 23, grado: 'medio', sucursalIds: ['central'] },
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

/* NIVELES DE MANDO. El nivel dice cuánto PESA un puesto, y es lo único que puede distinguir a
   dos cargos entre los que no hay línea: tres cabezas sin jefe —CEO, CTO, jefatura— se dibujan
   idénticas porque no hay ningún reporte del cual colgar la diferencia.

   No se deduce de la profundidad del árbol. Ese fue el error del cuarto tipo "Jefe / Director"
   que ya se sacó, y acá ni siquiera podría: las tres raíces están a la misma profundidad.

   ES UNA LISTA Y NO UN ENUM, y el número sale del ORDEN, no se escribe: cada empresa nombra sus
   tramos a su manera y decide cuántos son. Los tres sembrados son los que usa el cliente; el día
   que una jefatura de área no pueda estar a la misma altura que un CTO, se intercala un peldaño
   y ningún cargo hay que reeditarlo, porque lo que se guarda en el cargo es el id y no el número.

   `orgVacio` los trae igual: un organigrama recién empezado tiene niveles antes que cargos. */
/* LOS COLORES DE LA LEYENDA. Un canal, un significado — la misma regla por la que se eliminó el
   color por unidad: si el color también dijera de qué área es, dejaría de decir qué es el puesto.

   EL COLOR DICE LA CLASE DEL PUESTO. La etiqueta VACANTE dice el estado. Son dos preguntas y
   por eso van por dos canales: un servicio tercerizado sin prestador sigue siendo violeta —no
   deja de ser tercerizado por estar vacío— y lo que avisa de la vacante es la etiqueta.

   El cuadro toma el PRIMERO que le aplica de esta lista, y por eso el orden importa:
     1. Apoyo funcional — viene prestado de otra área. Gana sobre todo: es lo más raro del
        dibujo y lo que peor se lee si no se marca, porque el mismo puesto sale dos veces.
     2. Outsourcing     — no es gente de la casa.
     3. Staff           — asiste sin mandar.
     4. Vacante         — nadie lo ocupa.
     5. Colaborador     — BLANCO, y no es un color que falta: es el caso normal y son cuatro de
        cada cinco cuadros. Pintarlo dejaría el organigrama entero de colores y la leyenda
        dejaría de señalar nada. El blanco es lo que hace que los otros cuatro resalten.

   El colaborador VACANTE es la única excepción y es deliberada: como no tiene color de clase
   que perder, el cuadro queda libre para avisar del puesto por cubrir, que es lo que uno vino a
   buscar. Con clase declarada el ámbar no pasa por encima —ahí avisa la etiqueta—. */
/* Cada significado trae SUS tonos, y el primero es el de fábrica: así volver atrás es tocar el
   primero y no hace falta un botón aparte que aparezca y desaparezca según si tocaste algo.
   Los cinco de cada fila son de la misma familia a propósito —variar el azul dentro del azul—:
   una paleta única para las cuatro filas dejaría elegir el mismo tono en dos significados, que
   es justamente lo que la leyenda no puede permitirse. */
export const COLORES_LEYENDA = [
  {
    key: 'func', var: '--og-func-el', porOmision: '#2563eb',
    label: 'Apoyo funcional', desc: 'Viene prestado de otra área',
    tonos: ['#2563eb', '#1d4ed8', '#0284c7', '#0891b2', '#4f46e5'],
  },
  {
    key: 'ext', var: '--og-ext-el', porOmision: '#7c3aed',
    label: 'Outsourcing', desc: 'Lo cubre un prestador de servicios',
    tonos: ['#7c3aed', '#6d28d9', '#9333ea', '#c026d3', '#a21caf'],
  },
  {
    key: 'staff', var: '--og-staff-el', porOmision: '#0d9488',
    label: 'Staff', desc: 'Asiste al costado, sin mandar',
    tonos: ['#0d9488', '#047857', '#059669', '#16a34a', '#65a30d'],
  },
  {
    key: 'vacante', var: '--og-vacante-el', porOmision: '#d97706',
    label: 'Vacante', desc: 'El puesto no lo ocupa nadie',
    tonos: ['#d97706', '#b45309', '#ea580c', '#ca8a04', '#dc2626'],
  },
]

/* Las variables que hay que ponerle a `.og-page`. Lo no elegido no se escribe: así el color de
   fábrica sigue viniendo del CSS y no queda copiado en el dato de cada empresa, donde
   envejecería la primera vez que cambiemos la paleta. */
export function estiloColores(org) {
  const elegidos = org?.colores || {}
  const estilo = {}
  for (const c of COLORES_LEYENDA) {
    if (elegidos[c.key] && elegidos[c.key] !== c.porOmision) estilo[c.var] = elegidos[c.key]
  }
  return estilo
}

export const NIVELES_MANDO = [
  { id: 'superior', nombre: 'Mando superior' },
  { id: 'medio', nombre: 'Mando medio' },
  { id: 'bajo', nombre: 'Mando bajo' },
]

/* Estructura de arranque. La pantalla la clona en su estado persistido y a partir de ahí
   trabaja sobre la copia; esta constante nunca se muta. */
export const orgSeed = { unidades, cargos, relaciones, niveles: NIVELES_MANDO }

/* Con qué arranca una demo reseteada. Las sucursales NO están aquí: son datos de la empresa
   —existen antes de que nadie dibuje un organigrama— y por eso sobreviven al reseteo. Lo que
   se construye desde cero son las áreas y los cargos. */
export const orgVacio = { unidades: [], cargos: [], relaciones: [], niveles: NIVELES_MANDO }

/* El catálogo de un `org` cualquiera. Va con respaldo porque lo guardado antes de que el campo
   existiera no lo trae, y sin esto esa demo abriría sin un solo nivel para elegir. */
export const nivelesDe = (org = orgSeed) => org?.niveles ?? NIVELES_MANDO

/* El nivel de un cargo, ya resuelto para dibujar: el número es la posición en la lista, así que
   nadie lo escribe y reordenar el catálogo lo renumera todo solo. Devuelve null cuando el cargo
   no declaró nivel —el caso común y el de todo lo guardado antes—, y también cuando declaró uno
   que ya no existe: un peldaño borrado no puede dejar cuadros mostrando una insignia fantasma.

   SE LLAMA `grado` Y NO `nivel` a propósito, aunque en pantalla diga "Nivel de mando": `nivel`
   ya está tomado en `filasTabla`, donde es la profundidad de la sangría de cada renglón. Con el
   mismo nombre, el spread de `datosFila` y la sangría se pisaban y la tabla perdía la columna. */
export function gradoDe(cargo, org = orgSeed) {
  if (!cargo?.grado) return null
  const lista = nivelesDe(org)
  const i = lista.findIndex(n => n.id === cargo.grado)
  return i < 0 ? null : { ...lista[i], orden: i + 1 }
}

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
const esLateral = c => c.tipo === 'staff' || c.tipo === 'outsourcing'

/* Los tipos que hay que GUARDAR: de nada se deduce que un puesto es externo o de apoyo, así que
   se declaran. Jefe y Colaborador no entran —`tipoDe` los saca de tener o no gente a cargo— y
   escribirlos dejaría en el dato una etiqueta que se contradice sola en cuanto alguien mueve un
   cargo de lugar. */
export const esTipoDeclarado = tipo => tipo === 'staff' || tipo === 'outsourcing'

/* UN CARGO, UNA PERSONA. Cada cargo/puesto lleva su propio código —así lo identifica RRHH— y un
   código no se puede repartir entre cinco casillas: si hay cinco ejecutivas comerciales, hay
   cinco puestos, cada uno con su código, su sede y su gente.

   Se probó lo contrario —un cargo con N plazas, un solo cuadro que se iba llenando— y se
   descartó por eso: el código no encajaba, y todo lo que fue apareciendo después (la sede, el
   apoyo funcional) terminaba teniendo que bajar plaza por plaza hasta que la plaza era el puesto
   con otro nombre.

   `ocupantes` sigue siendo una LISTA de a lo sumo uno: así se guardó lo que ya existe y así lo
   leen `cuadroDe` y `cargoDe`, que preguntan "¿en qué cuadro está esta persona?". El campo viejo
   de un solo ocupante también se sigue leyendo. */
export const ocupantesDe = cargo => {
  const lista = cargo.ocupantes ?? (cargo.ocupanteId != null ? [cargo.ocupanteId] : [])
  /* Un dato viejo puede traer varios de cuando el puesto tenía plazas: manda el primero, que es
     el que el cuadro va a dibujar. */
  return lista.slice(0, 1)
}

/* Quién lo ocupa, o nada. */
export const ocupanteDe = cargo => ocupantesDe(cargo)[0] ?? null

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
/* Cada asignación funcional tiene DOS datos: en qué área trabaja y, si corresponde, a quién le
   responde ahí. Lo segundo no siempre existe —se puede apoyar a un área sin tener un jefe
   funcional— y por eso `reportaA` es opcional; cuando está, el cuadro cuelga de esa persona
   igual que cualquier reporte.

   Se leen los dos formatos viejos sin migrar nada: `unidadesFuncionales` (una lista de áreas
   sueltas) y el intento de colgar el apoyo de cada plaza (`{ plaza, ... }`), que se colapsa por
   área —el puesto es uno, así que apoyar a un área es una sola respuesta—. */
export const funcionalesDe = cargo => {
  const guardadas = cargo.funcionales
    ?? (cargo.unidadesFuncionales || []).map(unidadId => ({ unidadId, reportaA: null }))
  const salida = []
  const visto = new Set()
  for (const f of guardadas) {
    if (!f.unidadId || visto.has(f.unidadId)) continue
    visto.add(f.unidadId)
    salida.push({ unidadId: f.unidadId, reportaA: f.reportaA || null })
  }
  return salida
}

export const areasQueApoya = cargo => funcionalesDe(cargo).map(f => f.unidadId)

/* Quiénes apoyan a un área desde afuera. Es la pregunta al revés, la que se hace parado en el
   área: "¿quién más trabaja acá sin ser de acá?". Devuelve el cargo junto con a quién le
   responde en esa área, que es lo que decide de dónde cuelga su cuadro. */
export const apoyosDeUnidad = (unidadId, org = orgSeed) => org.cargos
  .map(cargo => {
    const f = funcionalesDe(cargo).find(x => x.unidadId === unidadId)
    return f ? { cargo, reportaA: f.reportaA } : null
  })
  .filter(Boolean)

/* Dónde está parada una persona en el organigrama: el cuadro que ocupa, o nada. Nadie ocupa
   dos puestos, así que el `find` devuelve el único; si un dato viejo trae a alguien en dos
   cuadros, el primero. */
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

/* `vacante` quiere decir "no hay nadie", que es lo que pinta el cuadro de amarillo. Con un
   puesto por cargo vuelve a ser una pregunta de sí o no. */
const estadoDeOcupantes = cargo => {
  const ocupantes = ocupantesDe(cargo).map(getPersona).filter(Boolean)
  return { ocupantes, vacante: ocupantes.length === 0 }
}

/* El nivel viaja RESUELTO en el nodo y no se busca al dibujar: el cuadro necesita el nombre
   para la insignia y el número para el escalón, y hacer esa cuenta en cada tarjeta en cada
   repintado —con el árbol entero volviéndose a medir en cada paso de un arrastre— es trabajo
   repetido sobre un dato que no cambia mientras el árbol está armado. */
const nodoSuelto = (cargo, org) => ({
  tipo: 'cargo', id: cargo.id, cargo,
  grado: gradoDe(cargo, org),
  ...estadoDeOcupantes(cargo),
  staff: [], hijos: [],
})

/* `vistos` corta los ciclos: al editar "reporta a" se puede dejar a un cargo colgando de su
   propio subordinado, y sin este tope la recursión revienta la pila. */
function nodoCargo(cargo, org, verUnidades, vistos, conFuncionales) {
  if (vistos.has(cargo.id)) return nodoSuelto(cargo, org)
  vistos.add(cargo.id)
  return {
    ...nodoSuelto(cargo, org),
    /* EL LATERAL SE ARMA COMPLETO, con lo que cuelga de él. Antes se armaba con `nodoSuelto`, que
       no trae `hijos`, y eso no era una limitación del dibujo: era una fuga. Un cargo que
       dependiera de un staff se guardaba bien y no aparecía en NINGUNA parte del organigrama —ni
       escondido ni atenuado: no existía—, porque el árbol baja desde las raíces por `hijos` y ahí
       se cortaba el camino. El botón "+" no se ofrecía en los laterales justamente por eso, pero
       el campo "De quién depende" sí los lista, así que el agujero seguía abierto. */
    staff: org.cargos
      .filter(c => c.reportaA === cargo.id && esLateral(c))
      .map(c => nodoCargo(c, org, verUnidades, vistos, conFuncionales)),
    hijos: agruparHijos(cargo, org, verUnidades, vistos, conFuncionales),
  }
}

/* LAS ÁREAS QUE HAY QUE ATRAVESAR para ir del área del jefe a la del subordinado.

   Antes se metía UNA píldora entre los dos, y eso vale mientras el subordinado esté en un área
   que cuelga directo de la del jefe. Cuando hay un área intermedia sin cargos deja de valer:
   con "Comercial" —sin un solo puesto— conteniendo a Ventas, un ejecutivo de Ventas no tiene a
   quién reportarle dentro de Comercial, así que reporta al Gerente General; y entonces Ventas se
   dibujaba de par de Comercial, o sea al lado de su propio padre. Peor todavía, su hermana
   Atención al Cliente sí quedaba adentro, porque estando vacía se colgaba por `padreId`. Dos
   hermanas del mismo padre en dos niveles distintos, y la única diferencia entre ellas era tener
   o no un cargo.

   El dato nunca estuvo mal: `padreId` dice dónde ESTÁ el área y `reportaA` a quién le RESPONDE
   la persona, y las dos cosas son ciertas a la vez. Lo que faltaba era dibujar los dos saltos.

   SE CORTA EN EL ANCESTRO COMÚN. Subiendo sin freno, un cargo de Marketing Digital con un
   reporte en Contenidos —las dos dentro de Marketing— se llevaría puesta la píldora de Marketing
   y hasta la de Dirección General, colgadas debajo de una jefatura. Solo entran los eslabones
   que todavía no están dibujados en el camino. */
function cadenaDeAreas(deUnidadId, aUnidadId, org) {
  const arriba = new Set()
  for (let u = getUnidad(aUnidadId, org); u && !arriba.has(u.id); u = u.padreId ? getUnidad(u.padreId, org) : null) {
    arriba.add(u.id)
  }
  const cadena = []
  const vistas = new Set()
  for (let u = getUnidad(deUnidadId, org); u && !arriba.has(u.id) && !vistas.has(u.id); u = u.padreId ? getUnidad(u.padreId, org) : null) {
    vistas.add(u.id)
    cadena.unshift(u)
  }
  return cadena
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
  /* Abre la cadena de píldoras y devuelve la última, que es la que recibe el cargo. Las que ya
     estaban abiertas se reusan: dos áreas hermanas del mismo padre comparten su píldora en vez
     de dibujarla dos veces. */
  const abrirCadena = cadena => {
    let padre = null
    for (const u of cadena) {
      let grupo = grupoPorUnidad.get(u.id)
      if (!grupo) {
        grupo = nodoUnidad(u, org, `u-${u.id}`, conFuncionales)
        grupoPorUnidad.set(u.id, grupo)
        if (padre) padre.hijos.push(grupo)
        else salida.push(grupo)
      }
      padre = grupo
    }
    return padre
  }
  for (const hijo of hijos) {
    if (hijo.unidadId === cargo.unidadId) {
      salida.push(nodoCargo(hijo, org, verUnidades, vistos, conFuncionales))
      continue
    }
    /* Sin cadena queda el caso raro de un hijo cuya área es ancestro de la del jefe: ahí no hay
       nada que atravesar hacia abajo y se dibuja la suya sola, como se hacía siempre. */
    const cadena = cadenaDeAreas(hijo.unidadId, cargo.unidadId, org)
    const propia = cadena.length ? cadena : [getUnidad(hijo.unidadId, org)].filter(Boolean)
    const grupo = abrirCadena(propia)
    const nodo = nodoCargo(hijo, org, verUnidades, vistos, conFuncionales)
    if (grupo) grupo.hijos.push(nodo)
    else salida.push(nodo)
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
  ...nodoSuelto(cargo, org),
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
/* LA FILA DE CABEZA. Varias raíces son varias cabezas sin jefe —el caso de una empresa donde el
   CEO, el CTO y una jefatura son los tres máxima autoridad y ninguno manda sobre los otros—, y
   dibujadas como hermanas cualquiera el árbol las manda a los extremos: cada `li` ocupa el ancho
   de SU rama, y la que tiene la empresa entera debajo mide mil quinientos píxeles. Las otras dos
   terminan a media pantalla del CEO, y ahí el escalón de 32 px que dice quién pesa más no se
   puede ver: dos cuadros lejos no se comparan en altura.

   Así que las que no tienen rama se meten DENTRO de la que sí, como `pares`, y se dibujan
   flanqueándola en la misma fila. Es acomodo y no dato: ninguna pasa a reportarle a la otra
   —siguen con `reportaA: null`— y entre ellas no se traza una sola línea. Las tres cuelgan de la
   píldora de su área, que es lo que ya las agrupaba.

   DOS CONDICIONES, y las dos importan:
   - Una sola raíz con rama. Con dos, cada una necesita su propio abanico debajo y no hay forma
     de meter una adentro de la otra sin partirle la rama a alguna.
   - Misma área. Una raíz de otra área metida acá se dibujaría bajo una píldora que no es la
     suya, que es peor que estar lejos. */
function juntarCabeza(nodos) {
  if (nodos.length < 2) return nodos
  const conRama = nodos.filter(n => n.hijos.length > 0)
  if (conRama.length !== 1) return nodos
  const tronco = conRama[0]
  const pares = nodos.filter(n => n !== tronco && n.cargo.unidadId === tronco.cargo.unidadId)
  if (!pares.length) return nodos
  const dentro = new Set(pares)
  return nodos
    .filter(n => n === tronco || !dentro.has(n))
    .map(n => (n === tronco ? { ...n, pares } : n))
}

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
  const nodos = juntarCabeza(raices.map(r => nodoCargo(r, org, modo === 'completo', vistos, conFuncionales)))

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
  /* Y dónde quedó cada cargo, para colgar el área del cuadro que su formulario declaró. El
     mando puede ser cualquiera del área madre, no solo su cabeza, así que no alcanza con
     mirar los hijos directos de la píldora. */
  const nodosPorCargo = new Map()
  const recorrer = nodos => {
    for (const n of nodos) {
      if (n.tipo === 'unidad' && n.unidad && !pildoras.has(n.unidad.id)) pildoras.set(n.unidad.id, n)
      if (n.tipo === 'cargo' && !nodosPorCargo.has(n.cargo.id)) nodosPorCargo.set(n.cargo.id, n)
      if (n.hijos?.length) recorrer(n.hijos)
    }
  }
  recorrer(hijosRaiz)

  const idsVacias = new Set(vacias.map(u => u.id))
  /* Una vacía puede estar YA DIBUJADA: si es un eslabón de la cadena de áreas que se abrió para
     llegar a un cargo de más abajo, su píldora existe en el árbol aunque ella no tenga puestos.
     Es el caso de "Comercial" conteniendo a Ventas. Volver a colocarla la dibujaría dos veces. */
  const construir = u => {
    const nodo = nodoUnidad(u, org, undefined, conFuncionales)
    return {
      ...nodo,
      sinCargos: true,
      hijos: [...vacias.filter(x => x.padreId === u.id && !pildoras.has(x.id)).map(construir), ...nodo.apoyos],
    }
  }

  /* Las cimas son las vacías cuya madre NO es otra vacía: las demás ya entran anidadas dentro
     de ellas y colocarlas otra vez las dibujaría dos veces.

     Con una excepción, y es la que devuelve a las hermanas al mismo nivel: si la madre ya está
     dibujada por la cadena, esta vacía SÍ es una cima —nadie más la va a anidar— y se cuelga de
     esa píldora. Sin esto, Atención al Cliente esperaba a que la colocara Comercial, y Comercial
     ya no se coloca porque la cadena la dibujó: desaparecía del organigrama. */
  const alPie = []
  const anidadaEnOtraVacia = u => u.padreId && idsVacias.has(u.padreId) && !pildoras.has(u.padreId)
  for (const u of vacias.filter(x => !pildoras.has(x.id) && !anidadaEnOtraVacia(x))) {
    const nodo = construir(u)
    const madre = u.padreId ? pildoras.get(u.padreId) : null
    if (madre) engancheDe(madre, u, nodosPorCargo).hijos.push(nodo)
    else alPie.push(nodo)
  }
  return [...hijosRaiz, ...alPie]
}

/* De qué cuadro cuelga una sub-unidad que todavía no tiene cargos.

   Colgaba de la píldora de su madre, y entonces un área nueva salía AL LADO del jefe que la
   dirige: con "Dirección General" conteniendo al CEO, crear "Ventas" adentro la dibujaba de par
   del CEO, como si nadie la mandara.

   El primer intento fue deducirlo —colgarla de la cabeza del área madre—, y se cae solo: si la
   madre tiene tres cargos sin jefe, el dibujo elegía uno adivinando. De quién depende un área
   es una decisión, no un cálculo, y se declara en su formulario: `mandoId`. Sin declarar, se
   queda en la píldora, que es el organigrama recién empezado donde todavía no hay un cargo. */
function engancheDe(pildora, unidad, nodosPorCargo) {
  return (unidad.mandoId && nodosPorCargo.get(unidad.mandoId)) || pildora
}

/* Forma común de una fila/tarjeta de cargo: la comparten la tabla, las cards y el buscador. */
/* La fila de un cargo: el cargo envuelto con su área, su tipo, sus sedes y su estado. Es lo
   que consumen la tabla y las tarjetas, así que se exporta para que quien necesite describir un
   puesto suelto —los apoyos funcionales de un área, por ejemplo— no arme una versión propia. */
export const filaDeCargo = (cargo, org = orgSeed) => datosFila(cargo, org)

const datosFila = (cargo, org) => ({
  cargo,
  unidad: getUnidad(cargo.unidadId, org),
  grado: gradoDe(cargo, org),
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

/* SIN TILDES NI EÑES. Nadie escribe "Núñez" en un buscador: escribe "nunez" y espera
   encontrarlo. Descomponer y quitar los signos deja la ñ en n y la á en a, así que las dos
   formas se cruzan. Se normalizan LOS DOS LADOS, o buscar "Núñez" bien escrito dejaría de
   funcionar. */
export const normalizar = t => (t || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function buscarCargos(texto, org = orgSeed) {
  const q = normalizar(texto.trim())
  if (!q) return []
  return org.cargos
    .map(c => datosFila(c, org))
    .filter(f =>
      normalizar(f.cargo.nombre).includes(q) ||
      /* Por CADA ocupante. Antes miraba `f.ocupante` en singular, un campo que dejó de existir
         cuando un cargo pasó a poder tener varios: buscar por el nombre de una persona no
         encontraba nada, en ninguna de las tres vistas. */
      f.ocupantes.some(p => normalizar(p.name).includes(q)) ||
      normalizar(f.unidad?.nombre).includes(q))
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

/* El tipo es el que se declaró, y nada más. Ya no recibe el organigrama: no hay nada que
   consultar en la estructura para saber de qué clase es un puesto. */
export const tipoDe = cargo => cargo.tipo || 'colaborador'

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

/* Las sucursales del cargo. Lista vacía = en todas, incluidas las que se abran mañana: es lo
   correcto a futuro, y enumerarlas dejaría al puesto fuera de la novena. */
/* ---------- Filtros por tipo y por estado ---------- */

/* DOS RECORTES BLANDOS. A diferencia de los de sede y área, estos NO sacan al cargo del árbol:
   quitar del dibujo a los que no son staff dejaría a sus subordinados colgando de la nada y
   partiría la línea de mando, que es justo lo que uno vino a mirar. Es el mismo criterio que ya
   sigue el buscador del lienzo.

   Así que en el gráfico deciden si el cuadro se dibuja encendido o apagado, y en tarjetas y
   tabla —donde no hay línea que romper— sí deciden si aparece. */

export const TIPOS_FILTRO = ['colaborador', 'staff', 'outsourcing']
export const ESTADOS_FILTRO = ['todos', 'vacantes', 'cubiertos']

export const esVacante = cargo => ocupantesDe(cargo).map(getPersona).filter(Boolean).length === 0

/* `tipos` vacío quiere decir TODOS, igual que `sucursalIds` vacío quiere decir "toda la
   empresa": es la ausencia de recorte, no un recorte que no deja pasar nada. */
export function coincideCargo(cargo, { tipos = [], estado = 'todos', grados = [] } = {}) {
  if (tipos.length && !tipos.includes(tipoDe(cargo))) return false
  /* Un puesto sin nivel declarado NO entra en un recorte por nivel. "Ver los mandos superiores"
     es una pregunta sobre lo que alguien declaró, y no haberlo declarado no es una respuesta. */
  if (grados.length && !grados.includes(cargo.grado)) return false
  if (estado === 'vacantes' && !esVacante(cargo)) return false
  if (estado === 'cubiertos' && esVacante(cargo)) return false
  return true
}

/* Cuántos recortes están puestos. Sirve para el número del botón y para saber si hace falta
   dibujar la fila de fichas: sin recortes no hay nada que mostrar ni que limpiar. */
export function recortesActivos({ sedeId, unidadId, tipos = [], estado = 'todos', grados = [] } = {}) {
  let n = 0
  if (sedeId && sedeId !== TODAS_SUCURSALES) n++
  if (unidadId && unidadId !== TODAS_UNIDADES) n++
  n += tipos.length
  n += grados.length
  if (estado !== 'todos') n++
  return n
}

export const sucursalesDe = (cargo, org = orgSeed) => {
  const ids = cargo.sucursalIds || []
  return sucursales.filter(s => ids.includes(s.id))
}

/* Un cargo sin sedes declaradas se considera presente en todas: es lo que evita que al filtrar
   desaparezca de la vista un cargo al que todavía nadie le cargó la sede. */
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
/* Y LA MISMA ÁREA, que no es lo mismo que el mismo jefe. Un gerente de Ventas y un CTO de
   Dirección General pueden reportarle los dos al CEO y no compartir fila: el árbol envuelve a
   cada hijo de otra área en la píldora de esa área, así que se dibujan a distinto nivel y en
   ramas distintas. Contándolos juntos, el campo "Orden entre sus pares" decía "3.º de 6"
   mientras en la fila había dos, y las flechas movían el cuadro contra vecinos que no eran. */
export function paresDe(cargo, org) {
  if (!cargo) return []
  const lateral = esLateral(cargo)
  return org.cargos.filter(c => (
    c.reportaA === cargo.reportaA
    && esLateral(c) === lateral
    && c.unidadId === cargo.unidadId
  ))
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
/* LA RAMA DE UN CARGO: él y todo lo que cuelga de él, por línea de mando. Es la unidad natural
   del borrado en el dibujo —un área se cerró y se va entera— y la única selección múltiple que
   un árbol puede ofrecer sin que nadie se sorprenda: lo que se lleva es exactamente lo que se
   ve colgando.

   Va por `reportaA` y no por área: un cargo de otra área que reporta a este cuelga de él en el
   dibujo, así que se va con él. Lleva `vistos` porque un dato viejo con un ciclo —alguien que
   termina reportando a su propio subordinado— colgaría el navegador en vez de avisar. */
export function ramaDe(cargoId, org) {
  const ids = []
  const vistos = new Set()
  const bajar = id => {
    if (vistos.has(id)) return
    vistos.add(id)
    ids.push(id)
    for (const h of org.cargos) if (h.reportaA === id) bajar(h.id)
  }
  bajar(cargoId)
  return ids
}

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
