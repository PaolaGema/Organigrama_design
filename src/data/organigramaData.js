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

export const empresa = {
  nombre: 'FarmaVida',
  razonSocial: 'FarmaVida S.R.L.',
  nit: '1023456789',
  rubro: 'Salud',
  pais: 'Bolivia',
  web: 'farmavida.com.bo',
  correo: 'contacto@farmavida.com.bo',
  telefono: '+591 3 344 5566',
  celular: '+591 700 11223',
  direccionLegal: 'Av. San Martín 200, Equipetrol, Santa Cruz',
}

/* Ocho y no tres: con tres nunca aparecen el buscador ni "ver solo las marcadas" —los dos se
   activan pasadas seis sedes— así que la demo escondía justo lo que se diseñó para una empresa
   grande. Ocho es el número más chico que los enciende y sigue entrando en pantalla. */
/* QUÉ GUARDA UNA SUCURSAL Y QUÉ NO. Guarda lo OPERATIVO —dónde está, a qué número se llama, quién
   responde, en qué horario abre— y su número de sucursal ante el SIN, que es lo único fiscal que
   sí es propio de cada sede.

   NO guarda razón social ni NIT: el NIT es UNO y las sedes se registran como números de sucursal
   dentro de él. Copiarle esos campos a cada sede sería invitar a que un día dos digan razones
   sociales distintas y no haya forma de saber cuál vale. Eso vive en Datos de la empresa.

   `estado` existe porque una sucursal no se borra: la que cerró tiene historia, gente y planillas
   detrás. Se cierra, con su fecha, y deja de ofrecerse para puestos nuevos. */
/* LAS SUCURSALES SE LLAMAN COMO SE LLAMAN DE VERDAD: por el barrio o el hito donde están.
   Se llamaban «Sucursal», «Sucursal», «Oficina Regional», «Punto de Venta» —el TIPO puesto de
   nombre—, y eso hacía dos daños. En la tabla, cinco filas decían lo mismo en la columna que
   sirve para distinguirlas, y solo se diferenciaban mirando la ciudad de al lado. Y en una demo
   que se le enseña a alguien, un catálogo que se repite se lee como un catálogo sin cargar.

   Cada nombre es el barrio de su propia dirección, que es como bautiza sus locales cualquier
   cadena: el tipo delante y el barrio detrás. Así se lee de un vistazo QUÉ es y DÓNDE queda, y
   sigue distinguiéndose de las demás, que era lo que fallaba cuando todas se llamaban igual. */
export const sucursales = [
  { id: 'central', nombre: 'Casa Matriz Equipetrol', ciudad: 'Santa Cruz', codigo: '0001', direccion: 'Av. San Martín 200, Equipetrol', telefono: '+591 3 344 5566', correo: 'equipetrol@farmavida.com.bo', horario: 'Lun a Vie, 08:30–18:00', estado: 'activa', apertura: '2018-02-15' },
  /* DOS EN SANTA CRUZ A PROPÓSITO. Con una sucursal por ciudad, la ciudad parecía ser la llave
     —y no lo es—: una cadena abre varias en la misma plaza. Tener dos obliga a que todo lo que
     mira sucursales las distinga por nombre y no por ciudad, que es justo lo que hay que poder
     enseñar. */
  { id: 'mtr', nombre: 'Sucursal Montero', ciudad: 'Santa Cruz', codigo: '0009', direccion: 'Av. Circunvalación 340, Montero', telefono: '+591 3 922 4455', correo: 'montero@farmavida.com.bo', horario: 'Lun a Sáb, 08:00–18:00', estado: 'activa', apertura: '2024-11-04' },
  { id: 'lpz', nombre: 'Sucursal Sopocachi', ciudad: 'La Paz', codigo: '0002', direccion: 'Av. Arce 2180, Sopocachi', telefono: '+591 2 244 7788', correo: 'sopocachi@farmavida.com.bo', horario: 'Lun a Vie, 08:30–18:00', estado: 'activa', apertura: '2019-09-09' },
  { id: 'cbb', nombre: 'Sucursal El Prado', ciudad: 'Cochabamba', codigo: '0003', direccion: 'Av. Ballivián 415, El Prado', telefono: '+591 4 425 1122', correo: 'elprado@farmavida.com.bo', horario: 'Lun a Vie, 08:30–18:00', estado: 'activa', apertura: '2020-03-02' },
  { id: 'sre', nombre: 'Sucursal La Recoleta', ciudad: 'Sucre', codigo: '0004', direccion: 'Calle Bolívar 120, La Recoleta', telefono: '+591 4 645 3344', correo: 'recoleta@farmavida.com.bo', horario: 'Lun a Vie, 08:30–17:30', estado: 'activa', apertura: '2021-06-01' },
  { id: 'tja', nombre: 'Sucursal Las Américas', ciudad: 'Tarija', codigo: '0005', direccion: 'Av. Las Américas 88', telefono: '+591 4 663 9900', correo: 'lasamericas@farmavida.com.bo', horario: 'Lun a Vie, 08:30–17:30', estado: 'activa', apertura: '2022-01-17' },
  { id: 'oru', nombre: 'Sucursal Plaza 10 de Febrero', ciudad: 'Oruro', codigo: '0006', direccion: 'Calle Bolívar 340, Plaza 10 de Febrero', telefono: '+591 2 527 6611', correo: 'oruro@farmavida.com.bo', horario: 'Lun a Vie, 09:00–17:00', estado: 'activa', apertura: '2023-04-10' },
  { id: 'pot', nombre: 'Sucursal Villa Imperial', ciudad: 'Potosí', codigo: '0007', direccion: 'Av. Serrudo 55', telefono: '+591 2 622 4433', correo: 'potosi@farmavida.com.bo', horario: 'Lun a Vie, 09:00–17:00', estado: 'activa', apertura: '2024-08-05' },
  { id: 'eal', nombre: 'Sucursal 16 de Julio', ciudad: 'El Alto', codigo: '0008', direccion: 'Av. 6 de Marzo 1200, zona 16 de Julio', telefono: '+591 2 282 1177', correo: '16dejulio@farmavida.com.bo', horario: 'Lun a Sáb, 09:00–19:00', estado: 'activa', apertura: '2025-05-20' },
]

/* Los dos estados y nada más. Una sede cerrada se sigue viendo —sus puestos y su gente existieron
   ahí— pero no se ofrece para nada nuevo. */
export const ESTADOS_SUCURSAL = {
  activa: { label: 'Activa', color: 'var(--green)', bg: 'var(--green-bg)' },
  cerrada: { label: 'Cerrada', color: 'var(--text-muted)', bg: 'var(--surface-hover)' },
}

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

  { id: 'dir-tec', nombre: 'Director de Tecnología', unidadId: 'tecnologia', reportaA: 'gg', ocupanteId: null, grado: 'medio', sucursalIds: ['central'] },
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
  { id: 'jefe-mkt-dig', nombre: 'Jefe de Marketing Digital', unidadId: 'mkt-digital', reportaA: 'dir-mkt', ocupanteId: null, grado: 'medio', sucursalIds: ['central'] },
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
  /* CINCO PUESTOS DEL MISMO CARGO: mismo nombre, misma área, ninguno con gente debajo. Es el
     caso que se apila. Tres están en Santa Cruz y dos en La Paz, y esa diferencia de sede es la
     que arrastra la de jefatura: los de La Paz responden a su supervisor local. */
  /* LA SEGUNDA JEFATURA DE VENTAS, y la razón de que exista: sin ella los cinco ejecutivos
     dependen del mismo y el caso que el modelo resuelve —un cargo repartido entre dos jefes— no
     se puede ver en ninguna pantalla. Es el caso de los nueve vendedores, en chico. */
  { id: 'sup-lpz', nombre: 'Supervisor Comercial La Paz', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: null, grado: 'bajo', sucursalIds: ['lpz'] },

  /* EL CUPO Y LA JEFATURA POR DEFECTO viajan en la primera entrada del grupo, que es la que
     crea el cargo. Cinco plazas aprobadas y cinco abiertas: bajando el número en su ficha se ve
     el aviso del techo y las sillas que sobran, que es lo que este cargo viene a enseñar. */
  { id: 'ec-1', nombre: 'Ejecutivo Comercial', codigo: 'EC-001', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: null, sucursalIds: ['central'], maxPersonas: 5, jefeSillas: 'lider-ventas' },
  { id: 'ec-2', nombre: 'Ejecutivo Comercial', codigo: 'EC-002', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: null, sucursalIds: ['central'] },
  { id: 'ec-3', nombre: 'Ejecutivo Comercial', codigo: 'EC-003', unidadId: 'ventas', reportaA: 'lider-ventas', ocupanteId: null, sucursalIds: ['central'] },
  /* Los dos de La Paz responden a su supervisor local y no al líder de Santa Cruz: mismo cargo,
     misma área, otra jefatura. Es exactamente lo que BR‑ORG‑012 permite. */
  { id: 'ec-4', nombre: 'Ejecutivo Comercial', codigo: 'EC-004', unidadId: 'ventas', reportaA: 'sup-lpz', ocupanteId: null, sucursalIds: ['lpz'] },
  { id: 'ec-5', nombre: 'Ejecutivo Comercial', codigo: 'EC-005', unidadId: 'ventas', reportaA: 'sup-lpz', ocupanteId: null, sucursalIds: ['lpz'] },

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
/* UNA LISTA VACÍA TAMBIÉN ES «NO HAY CATÁLOGO».
   El respaldo miraba solo si el campo no existía (`??`), así que un `niveles: []` guardado —por
   haber borrado los tres desde Configuración, o por un reseteo a medias— pasaba tal cual: la
   pantalla abría sin un solo peldaño que elegir, y el campo «Nivel de mando» del cargo quedaba
   con una lista vacía y sin forma de arreglarlo desde ahí.

   No es una limitación: CERO NIVELES NO ES UN ESTADO VÁLIDO de este producto. Sin peldaños el
   organigrama no puede ordenar nada de arriba abajo y un cargo no se puede terminar de definir,
   así que quedarse sin ninguno es siempre un accidente y volver a los tres es la salida. */
export const nivelesDe = (org = orgSeed) => (org?.niveles?.length ? org.niveles : NIVELES_MANDO)

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

/* ES RAÍZ DEL DIBUJO LA QUE NO CUELGA DE OTRA UNIDAD: ni porque no tenga padre, ni porque su
   padre sea algo que el organigrama no dibuja —una unidad de negocio, una regional—. Las dos
   respuestas significan lo mismo para quien mira: arriba de ella no hay nada que ver. */
export const esRaizDeUnidad = (u, org = orgSeed) =>
  !!u && (!u.padreId || !getUnidad(u.padreId, org))

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

/* LA SUCURSAL DE UNA PERSONA ES LA DE SU PUESTO, y no un campo suyo. Mismo criterio que el
   área y por la misma razón: la silla es la que está en un lugar físico, la persona está donde
   está su silla. Guardarlo en los dos lados garantiza que un día la ficha diga La Paz y su
   puesto diga Santa Cruz, y entonces no hay manera de saber cuál de los dos miente.

   Devuelve la lista de sedes del cuadro —hoy de a lo sumo una—, o `null` para quien no está en
   la estructura. Son tres respuestas distintas y hay que poder distinguirlas: `null` es "no
   tiene puesto, no sabemos dónde está"; lista vacía es "su puesto es transversal, está en
   todas"; y una lista con algo es su sede. */
export function sedesDe(persona, org = orgSeed) {
  const cuadro = cuadroDe(persona, org)
  return cuadro ? sucursalesDe(cuadro, org) : null
}

/* ¿Esta persona entra en el recorte por sede? El mismo criterio que `estaEnSucursal` usa para
   el puesto —el transversal entra en todas—, más el caso de quien no ocupa ningún cuadro: sin
   puesto no hay sede, así que solo aparece cuando no hay recorte. Esconderlo sería mentir; y
   colarlo en todas las sedes, también. */
export function personaEnSucursal(persona, sucursalId, org = orgSeed) {
  if (!sucursalId || sucursalId === TODAS_SUCURSALES) return true
  const cuadro = cuadroDe(persona, org)
  return cuadro ? estaEnSucursal(cuadro, sucursalId) : false
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

/* PODAR CON COSTURA. El filtro saca el cuadro del dibujo —que es lo que uno espera de un
   filtro— sin partir la línea de mando.

   Antes estos tres recortes solo APAGABAN el cuadro en el gráfico, porque sacarlo dejaba a sus
   subordinados colgando de la nada. El precio era un organigrama de veintiséis cuadros grises
   alrededor de ocho encendidos, que no es un dibujo filtrado sino un dibujo con ruido. Y encima
   el contador mentía: decía "8 a la vista" con 34 dibujados.

   La salida no es reenganchar al huérfano con su abuelo y callarse —eso dibuja una línea de
   mando que no existe— sino reengancharlo Y DEJAR LA MARCA de cuántos quedaron en el medio.
   `ocultos` es ese número; el dibujo lo convierte en una marquita sobre la línea. El cuadro se
   fue, la jerarquía no se falseó, y se ve que hay algo escondido ahí.

   Se poda por LÍNEA DE MANDO y no por área: quien cuelga de un cargo que no pasó el filtro sube
   por `reportaA`, esté donde esté su unidad. */
export function podarConCostura(org, pasa) {
  const vive = new Map()
  for (const c of org.cargos) vive.set(c.id, pasa(c))

  const porId = new Map(org.cargos.map(c => [c.id, c]))

  /* El primer ancestro que sí pasó, contando los que se saltaron por el camino. `vueltas` corta
     un dato con ciclo: sin eso, un cargo que termina reportando a su propio subordinado colgaría
     el navegador en vez de dibujarse mal. */
  const arriba = cargo => {
    let actual = cargo.reportaA
    let ocultos = 0
    let vueltas = 0
    while (actual && vueltas++ < org.cargos.length) {
      if (vive.get(actual)) return { reportaA: actual, ocultos }
      const padre = porId.get(actual)
      if (!padre) break
      ocultos++
      actual = padre.reportaA
    }
    return { reportaA: null, ocultos }
  }

  return {
    ...org,
    cargos: org.cargos.filter(c => vive.get(c.id)).map(c => {
      const { reportaA, ocultos } = arriba(c)
      return ocultos > 0 ? { ...c, reportaA, ocultos } : { ...c, reportaA }
    }),
  }
}

/* APILAR LOS PUESTOS INTERCAMBIABLES.

   Cincuenta vendedores y tres jefes regionales no son el mismo caso, aunque los dos sean «varios
   cuadros con el mismo nombre». Los vendedores son SILLAS INTERCAMBIABLES —ninguno manda sobre
   nadie y lo único que los distingue es el código y la sede—, así que se apilan y el árbol no se
   estira a lo ancho. Los tres jefes son la cabeza de tres operaciones distintas: cada uno tiene
   gente debajo y necesita su propia rama.

   De ahí la regla, y es una sola: SE APILA LO QUE NO TIENE A NADIE DEBAJO. Un cuadro apilado no
   podría abrir su rama sin empujar a los de abajo o cruzarles la línea por encima, así que en
   cuanto uno tiene equipo el grupo entero vuelve a dibujarse como ramas.

   Se agrupa por nombre + área + clase, que es lo que hace que dos puestos sean el mismo puesto
   repetido. El jefe no hace falta compararlo: ya son hermanos, cuelgan del mismo. */

const apilable = n => n.tipo === 'cargo'
  && !n.funcional
  && !(n.hijos || []).length
  && !(n.staff || []).length
  && !(n.pares || []).length

const claveDePila = n => `${n.cargo.nombre}|${n.cargo.unidadId}|${n.cargo.tipo || 'colaborador'}`

function apilarHermanos(nodos) {
  if (!nodos || nodos.length < 2) return nodos

  /* Cuántos hay de cada clave, mirando SOLO los apilables: si uno de los cinco tiene equipo, ese
     no entra en la cuenta y los otros cuatro igual se apilan. Con el grupo entero convertido en
     ramas —que era la otra opción— cuarenta y nueve vendedores pagaban por uno. */
  const cuenta = new Map()
  for (const n of nodos) {
    if (!apilable(n)) continue
    const k = claveDePila(n)
    cuenta.set(k, (cuenta.get(k) || 0) + 1)
  }

  const salida = []
  const pilas = new Map()
  for (const n of nodos) {
    const k = apilable(n) ? claveDePila(n) : null
    if (!k || cuenta.get(k) < 2) { salida.push(n); continue }
    let pila = pilas.get(k)
    if (!pila) {
      /* La pila ocupa el lugar del PRIMERO del grupo: el orden de la fila lo sigue decidiendo el
         árbol, no la agrupación. */
      pila = {
        tipo: 'pila',
        id: `pila-${n.cargo.unidadId}-${n.cargo.id}`,
        cargo: n.cargo,
        puestos: [],
        hijos: [],
        staff: [],
      }
      pilas.set(k, pila)
      salida.push(pila)
    }
    pila.puestos.push(n)
  }

  /* Primero los cubiertos y después los vacantes, cada grupo por código. Sin esto el orden lo
     decide el azar de la creación y una vacante en el medio parte visualmente el equipo. */
  for (const pila of pilas.values()) {
    pila.puestos.sort((a, b) => {
      if (a.vacante !== b.vacante) return a.vacante ? 1 : -1
      return (a.cargo.codigo || '').localeCompare(b.cargo.codigo || '')
    })
    /* Hasta ocho nace abierta; de ahí para arriba, plegada. Cincuenta cajitas abiertas de entrada
       hacen el árbol impracticable, y el gesto para abrirla es el mismo que ya pliega ramas. */
  }
  return salida
}

/* Se aplica de una sola vez sobre el árbol ya armado, y no en cada sitio que crea hermanos: los
   hijos de un cuadro, los de una píldora y las raíces se arman en tres lugares distintos, y
   agrupar en los tres era garantizar que el cuarto se olvidara. */
function apilarArbol(nodo) {
  if (!nodo || typeof nodo !== 'object') return nodo
  if (nodo.hijos?.length) {
    nodo.hijos = apilarHermanos(nodo.hijos)
    for (const h of nodo.hijos) {
      if (h.tipo === 'pila') continue
      apilarArbol(h)
    }
  }
  for (const l of nodo.staff || []) apilarArbol(l)
  return nodo
}

export function buildOrgTree(modo = 'completo', org = orgSeed, opciones = {}) {
  /*  tiene TRES posiciones y no dos: sin los prestados, con los prestados, o solo
     los prestados. Son las tres respuestas posibles a «¿qué hago con los apoyos?», y por eso van
     en un mismo control en vez de repartirse entre un modo y un interruptor. Se acepta el
     booleano de antes para no romper a quien todavía pase true/false. */
  /* El interruptor de funcionales tiene TRES posiciones y no dos: sin los prestados, con los
     prestados, o solo los prestados. Son las tres respuestas posibles a la misma pregunta, y por
     eso van en un mismo control en vez de repartirse entre un modo y un interruptor. Se sigue
     aceptando el booleano de antes para no romper a quien todavía pase true o false. */
  const { funcionales = 'con', vacias: conVacias = true } = opciones
  const modoFunc = funcionales === true ? 'con' : funcionales === false ? 'sin' : funcionales
  /* SOLO LOS PRESTADOS. Es la tercera posición del interruptor de funcionales y no un cuarto modo
     de dibujo: contesta la misma pregunta que las otras dos —qué hago con los apoyos— pero con la
     respuesta extrema.

     Acá el dibujo deja de ser un árbol de MANDO y pasa a ser un mapa de COLABORACIÓN: cada área con
     los puestos que recibe prestados de otras. Por eso no se dibuja ni un cargo propio ni una sola
     línea de jefatura —un préstamo no es una jerarquía— y el cuadro cuelga de la píldora del área
     que lo recibe.

     Y las áreas que no reciben a nadie no se dibujan. Es la misma regla que ya vale al filtrar por
     sede: si acá no hay nada que mostrar, el área no está. Sin esto quedarían siete píldoras vacías
     y una con un cuadro. */
  if (modoFunc === 'solo') {
    const conApoyo = u => {
      /* TODOS los apoyos del área, no solo los que cuelgan de su píldora. Un apoyo que declaró
         jefe funcional cuelga de esa persona en el organigrama completo —y acá no hay personas—,
         así que usando solo los «sin jefe» el mapa salía vacío justo en las áreas donde el
         préstamo está mejor declarado. */
      const apoyos = apoyosDeUnidad(u.id, org).map(a => nodoApoyo(a.cargo, u.id, org))
      const nodo = nodoUnidad(u, org, undefined, false)
      const hijas = org.unidades.filter(x => x.padreId === u.id).map(conApoyo).filter(Boolean)
      /* Una madre sin apoyos propios se queda SI alguna hija recibe: es el eslabón que hace falta
         para llegar hasta ella, igual que la cadena de áreas del organigrama completo. */
      if (!apoyos.length && !hijas.length) return null
      return { ...nodo, sinCargos: true, hijos: [...apoyos, ...hijas] }
    }
    return {
      tipo: 'empresa', id: 'empresa', empresa, staff: [],
      hijos: unidadesRaiz(org).map(conApoyo).filter(Boolean),
    }
  }

  const conFuncionales = modoFunc === 'con'
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
    return apilarArbol({ tipo: 'empresa', id: 'empresa', empresa, staff: [], hijos: unidadesRaiz(org).map(rama) })
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
    return apilarArbol({ tipo: 'empresa', id: 'empresa', empresa, staff: [], hijos: nodos })
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
  /* Antes de que ninguna se plante en la raíz: la que tiene área madre se anida adentro. */
  const cimas = anidarPorArea(grupos, org, conFuncionales)
  /* Las áreas sin cargos se rescatan solo cuando se está mirando la empresa entera. Ese
     rescate existe para el organigrama que recién se empieza —un área creada todavía sin
     puestos tiene que verse para poder llenarla—, pero al filtrar por sede significaba otra
     cosa: dibujaba "Finanzas" en El Alto, donde Finanzas no tiene un solo puesto. Un filtro
     contesta qué hay ACÁ, y un área sin cargos acá no está. */
  const hijos = conVacias ? colgarUnidadesVacias(cimas, org, conFuncionales) : cimas
  return apilarArbol({ tipo: 'empresa', id: 'empresa', empresa, staff: [], hijos })
}

/* CADA PÍLDORA DENTRO DE LA DE SU ÁREA MADRE, TAMBIÉN EN LA RAÍZ.

   El árbol se arma desde los CARGOS: se buscan los que no tienen jefe y esos son las raíces. Cada
   raíz se envuelve en la píldora de su área, y hasta acá todo bien mientras haya jefes encadenados
   —la cadena de áreas se abre siguiendo la línea de mando—.

   El problema aparece con un área VACÍA en el medio. Creando «Directorio» bajo la empresa y
   «Gerencia General» dentro de Directorio: el Gerente General no tiene jefe, así que su píldora
   llegaba a la raíz; y Directorio, sin un solo cargo, no tenía nada que la arrastrara al dibujo, así
   que la recogía el rescate de áreas vacías y la dejaba también colgando de la empresa. Las dos
   terminaban hermanas. El dato estaba bien —Gerencia General declara a Directorio como madre— y el
   dibujo decía otra cosa.

   La causa de fondo: al armar las raíces se miraba de quién depende cada CARGO y nunca de qué área
   depende cada ÁREA. Acá se mira. Una píldora que iba a plantarse en la raíz pregunta primero si su
   área tiene madre, y si la tiene se anida adentro —creando la píldora de la madre si no existe,
   que es justo lo que un área sin cargos necesita—.

   `vistas` corta un `padreId` con ciclo: sin eso, dos áreas declaradas madres una de la otra se
   llamarían para siempre. */
function anidarPorArea(grupos, org, conFuncionales) {
  const dibujadas = new Map()
  for (const g of grupos) if (g.unidad && !dibujadas.has(g.unidad.id)) dibujadas.set(g.unidad.id, g)

  const raices = []
  const vistas = new Set()

  const pildoraDe = u => {
    if (dibujadas.has(u.id)) return dibujadas.get(u.id)
    /* La madre que no tiene cargos se dibuja igual, vacía: es lo que un Directorio sin puestos
       es, y sin ella la cadena no se puede mostrar. */
    const nodo = { ...nodoUnidad(u, org, `u-madre-${u.id}`, conFuncionales), sinCargos: true }
    nodo.hijos.push(...nodo.apoyos)
    dibujadas.set(u.id, nodo)
    colocar(nodo, u)
    return nodo
  }

  const colocar = (nodo, u) => {
    if (!u || vistas.has(u.id)) { raices.push(nodo); return }
    vistas.add(u.id)
    const madre = u.padreId ? getUnidad(u.padreId, org) : null
    if (madre) pildoraDe(madre).hijos.push(nodo)
    else raices.push(nodo)
  }

  for (const g of grupos) colocar(g, g.unidad)
  return raices
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

export const unidadesRaiz = (org = orgSeed) => org.unidades.filter(u => esRaizDeUnidad(u, org))

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
    if (!padre || esRaizDeUnidad(padre, org)) break
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
/* `lugares` es el conjunto de sitios que cuentan como esa sede —ella y sus centros—. Sin él se
   compara contra el id suelto, que es lo que valía cuando un puesto solo podía declarar sucursal. */
export function filtrarPorSucursal(org, sucursalId, lugares = null) {
  if (!sucursalId || sucursalId === TODAS_SUCURSALES) return org
  const acepta = lugares || new Set([sucursalId])
  /* Sin sitio declarado, el puesto vale para toda la empresa: entra en cualquier sede. */
  const estaAca = cargo => {
    const ids = cargo.sucursalIds || []
    return ids.length === 0 || ids.some(x => acepta.has(x))
  }

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
    /* LA COSTURA: un jefe que no trabaja en esta sede se queda si alguno de los suyos sí. Sin esto
       el recorte parte la línea de mando y los de abajo quedan colgando de nada. */
    const r = estaAca(cargo) || (hijosDe.get(cargo.id) || []).some(alcanza)
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

/* LA SERIE DE CÓDIGOS. Crear cinco puestos de una vez pide cinco códigos, y escribirlos a mano es
   justo el trabajo que el «cuántos» vino a evitar.

   Se numera desde el código base: «EC-001» da EC-002, EC-003…; «EC» solo da EC-001, EC-002…; y sin
   base no se inventa nada —quedan vacíos— porque un código que el sistema se sacó de la manga no
   sirve para lo único que sirve un código: coincidir con la planilla de RRHH.

   El ancho se conserva: si el base tiene tres dígitos, los siguientes también. Un EC-009 seguido de
   un EC-10 rompe el orden alfabético, que es con el que se ordenan las pilas y las listas. */
export function codigosDeSerie(base, cuantos, org = orgSeed) {
  const limpio = (base || '').trim()
  if (!limpio) return Array.from({ length: cuantos }, () => '')

  const m = limpio.match(/^(.*?)(\d+)$/)
  const raiz = m ? m[1] : `${limpio}-`
  const desde = m ? Number(m[2]) : 1
  const ancho = m ? m[2].length : 3

  /* Se saltan los que ya existen: agregar un sexto a un cargo que llega hasta EC-005 tiene que
     dar EC-006 y no chocar con uno guardado. */
  const usados = new Set(org.cargos.map(c => c.codigo).filter(Boolean))
  const salida = []
  let n = desde
  while (salida.length < cuantos) {
    const cod = raiz + String(n).padStart(ancho, '0')
    if (!usados.has(cod) || (salida.length === 0 && cod === limpio)) salida.push(cod)
    n++
    if (n > desde + cuantos + 999) break
  }
  return salida
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
