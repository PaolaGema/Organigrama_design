// Directorio de colaboradores del prototipo. Vive fuera de `Colaboradores.jsx` para que
// los modales que necesitan la lista (asignar buddy, previsualizar ruta) no tengan que
// importar de vuelta a la pantalla que a su vez los importa a ellos.


/* Retratos de gente que no existe (randomuser.me). El prototipo se muestra en reuniones y una
   grilla de iniciales no se parece a la pantalla que va a ser; con la conexión caída, la inicial
   sigue estando debajo, así que nunca se ve peor que antes.

   `foto` guarda la referencia corta —'m/32', 'w/44'— y no la URL entera para que el archivo se
   siga leyendo. Cuando SoulyHR aloje las fotos de verdad, esto pasa a ser la ruta del archivo
   subido y no cambia nada más: la pantalla ya pide la foto por persona.

   Las caras están puestas a mano, una por una. Ninguna se deduce del nombre —eso sale mal— así
   que si alguna no pega con el personaje, se cambia su referencia acá y listo. */
export const fotoDe = persona => (persona?.foto
  ? `https://randomuser.me/api/portraits/${persona.foto[0] === 'w' ? 'women' : 'men'}/${persona.foto.slice(2)}.jpg`
  : null)

export const departamentos = ['Todos', 'Dirección General', 'Ventas', 'Tecnología', 'Marketing', 'Operaciones', 'Recursos Humanos', 'Finanzas', 'Diseño']

/* Una ruta asignada no arranca sola: queda "Sin iniciar" hasta que el colaborador abre su
   primera tarea. Solo entonces pasa a "En curso". */
export const ESTADOS_ONBOARDING = {
  'n-a': { label: 'N/A', color: '#b0b8c4', dot: '#cbd5e1', bg: '#f8fafc', desc: 'Incorporado antes del sistema' },
  'sin-ruta': { label: 'Sin ruta', color: '#64748b', dot: '#94a3b8', bg: '#f8fafc', desc: 'Nuevo ingreso sin ruta asignada' },
  'sin-iniciar': { label: 'Sin iniciar', color: '#b45309', dot: '#f59e0b', bg: '#fefce8', desc: 'Ruta asignada, aún no la comienza' },
  'en-curso': { label: 'En curso', color: '#2563eb', dot: '#2563eb', bg: '#eff6ff', desc: 'Realizando su onboarding' },
  'en-riesgo': { label: 'En riesgo', color: '#dc2626', dot: '#dc2626', bg: '#fef2f2', desc: '+3 días sin actividad' },
  'graduado': { label: 'Graduado', color: '#16a34a', dot: '#16a34a', bg: '#f0fdf4', desc: 'Completó todas las etapas' },
}

// Estados en los que ya existe una ruta viva: se puede desasignar y se puede acompañar con un buddy.
export const CON_RUTA_ACTIVA = ['sin-iniciar', 'en-curso', 'en-riesgo']

// Solo puede acompañar a alguien quien ya terminó su propio onboarding (o entró antes del
// sistema). Nadie guía un camino que todavía está recorriendo.
export const BUDDY_ELEGIBLE = ['graduado', 'n-a']

// El buddy es una relación que cuelga de la asignación de onboarding: Diego es Colaborador
// graduado y, además, acompaña a tres personas.
const BUDDY_MARTIN = { name: 'Martín Solano', initials: 'MS', color: '#10b981' }
const BUDDY_DIEGO = { name: 'Diego Morales', initials: 'DM', color: '#3b82f6' }

/* El jefe es una relación estable del colaborador, no de la asignación: sigue ahí cuando el
   onboarding termina. Por eso apunta a la persona y no al área — un área puede tener varios
   líderes, y quien dirige no siempre es el senior de su propio departamento. */
const JEFE_ANA = { name: 'Ana Martínez Ruiz', initials: 'AM', color: '#c026d3' }
const JEFE_NICOLAS = { name: 'Nicolás Zapata', initials: 'NZ', color: '#84cc16' }

export const colaboradoresData = [
  { id: 1, name: 'Diego Morales', email: 'diego.morales@farmavida.com.bo', depto: 'Tecnología', cargo: 'Desarrollador Backend', rol: 'Colaborador', ingreso: '15 Mar 2025', status: 'activo', registro: 100, onb: 'graduado', foto: 'm/32', initials: 'DM', color: '#3b82f6' },
  { id: 2, name: 'Camila Herrera', email: 'camila.herrera@farmavida.com.bo', depto: 'Ventas', cargo: 'Ejecutiva Comercial', rol: 'Colaborador', ingreso: '02 Ene 2026', status: 'activo', registro: 100, onb: 'sin-iniciar', onbPct: 0, foto: 'w/44', initials: 'CH', color: '#f97316', buddy: BUDDY_MARTIN, jefe: JEFE_NICOLAS },
  { id: 3, name: 'Valentina Cruz', email: 'valentina.cruz@farmavida.com.bo', depto: 'Diseño', cargo: 'Diseñadora UX/UI', rol: 'Colaborador', ingreso: '20 May 2026', status: 'activo', registro: 100, onb: 'en-riesgo', onbPct: 25, foto: 'w/68', initials: 'VC', color: '#ec4899', buddy: BUDDY_DIEGO },
  { id: 4, name: 'Facundo Medina', email: 'facundo.medina@farmavida.com.bo', depto: 'Tecnología', cargo: 'QA Engineer', rol: 'Colaborador', ingreso: '10 Abr 2026', status: 'activo', registro: 100, onb: 'en-riesgo', onbPct: 15, foto: 'm/75', initials: 'FM', color: '#ef4444' },
  { id: 5, name: 'Sofía Ramírez', email: 'sofia.ramirez@farmavida.com.bo', depto: 'Ventas', cargo: 'Pasante Comercial', rol: 'Colaborador', ingreso: '10 Jun 2026', status: 'activo', registro: 60, onb: 'sin-ruta', foto: 'w/12', initials: 'SR', color: '#f59e0b', jefe: JEFE_NICOLAS },
  { id: 6, name: 'Martín Solano', email: 'martin.solano@farmavida.com.bo', depto: 'Tecnología', cargo: 'Frontend Developer', rol: 'Colaborador', ingreso: '03 Feb 2025', status: 'activo', registro: 100, onb: 'graduado', foto: 'm/45', initials: 'MS', color: '#10b981' },
  { id: 7, name: 'Luciana Paredes', email: 'luciana.paredes@farmavida.com.bo', depto: 'Ventas', cargo: 'Account Manager', rol: 'Colaborador', ingreso: '17 Jun 2026', status: 'activo', registro: 40, onb: 'sin-ruta', foto: 'w/29', initials: 'LP', color: '#0d9488', jefe: JEFE_NICOLAS },
  { id: 8, name: 'Tomás Ibáñez', email: 'tomas.ibanez@farmavida.com.bo', depto: 'Operaciones', cargo: 'Analista de Procesos', rol: 'Colaborador', ingreso: '17 Jun 2026', status: 'activo', registro: 25, onb: 'sin-ruta', foto: 'm/11', initials: 'TI', color: '#8b5cf6' },
  { id: 9, name: 'Paola Arce', email: 'paola.arce@farmavida.com.bo', depto: 'Recursos Humanos', cargo: 'Especialista RRHH', rol: 'Sub-admin RRHH', ingreso: '10 Ago 2024', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/56', initials: 'PA', color: '#d946ef' },
  { id: 10, name: 'Roberto Peña', email: 'roberto.pena@farmavida.com.bo', depto: 'Finanzas', cargo: 'Contador General', rol: 'Supervisor', ingreso: '05 Nov 2024', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/60', initials: 'RP', color: '#0C2D40' },
  { id: 11, name: 'Andrea Núñez', email: 'andrea.nunez@farmavida.com.bo', depto: 'Marketing', cargo: 'Community Manager', rol: 'Colaborador', ingreso: '22 Sep 2025', status: 'activo', registro: 100, onb: 'en-curso', onbPct: 55, foto: 'w/33', initials: 'AN', color: '#06b6d4', buddy: BUDDY_DIEGO, jefe: JEFE_ANA },
  { id: 12, name: 'Nicolás Zapata', email: 'nicolas.zapata@farmavida.com.bo', depto: 'Ventas', cargo: 'Ejecutivo Senior', rol: 'Líder de área', ingreso: '14 Jul 2024', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/22', initials: 'NZ', color: '#84cc16' },
  { id: 13, name: 'Carolina Vega', email: 'carolina.vega@farmavida.com.bo', depto: 'Marketing', cargo: 'Analista de Marketing', rol: 'Colaborador', ingreso: '08 Mar 2025', status: 'activo', registro: 100, onb: 'graduado', onbPct: 100, foto: 'w/81', initials: 'CV', color: '#14b8a6', buddy: BUDDY_DIEGO, jefe: JEFE_ANA },
  { id: 14, name: 'Alejandro Ríos', email: 'alejandro.rios@farmavida.com.bo', depto: 'Tecnología', cargo: 'DevOps Engineer', rol: 'Colaborador', ingreso: '22 Nov 2024', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/8', initials: 'AR', color: '#6366f1' },
  { id: 15, name: 'Daniela Flores', email: 'daniela.flores@farmavida.com.bo', depto: 'Recursos Humanos', cargo: 'Analista de Nóminas', rol: 'Colaborador', ingreso: '15 Ene 2025', status: 'activo', registro: 100, onb: 'graduado', foto: 'w/9', initials: 'DF', color: '#e11d48' },
  { id: 16, name: 'Sebastián Torres', email: 'sebastian.torres@farmavida.com.bo', depto: 'Operaciones', cargo: 'Coordinador Logístico', rol: 'Supervisor', ingreso: '03 Sep 2025', status: 'vacaciones', registro: 100, onb: 'graduado', foto: 'm/54', initials: 'ST', color: '#0891b2' },
  { id: 17, name: 'Isabella Mendoza', email: 'isabella.mendoza@farmavida.com.bo', depto: 'Finanzas', cargo: 'Analista Financiera', rol: 'Colaborador', ingreso: '18 Abr 2025', status: 'activo', registro: 100, onb: 'en-curso', onbPct: 32, foto: 'w/20', initials: 'IM', color: '#7c3aed' },
  { id: 18, name: 'Mateo Guzmán', email: 'mateo.guzman@farmavida.com.bo', depto: 'Ventas', cargo: 'SDR Junior', rol: 'Colaborador', ingreso: '25 Jun 2026', status: 'activo', registro: 75, onb: 'sin-ruta', foto: 'm/91', initials: 'MG', color: '#ca8a04', jefe: JEFE_NICOLAS },
  { id: 19, name: 'Renata Castillo', email: 'renata.castillo@farmavida.com.bo', depto: 'Diseño', cargo: 'Diseñadora Gráfica', rol: 'Colaborador', ingreso: '12 Feb 2026', status: 'activo', registro: 100, onb: 'en-curso', onbPct: 48, foto: 'w/71', initials: 'RC', color: '#db2777' },
  { id: 20, name: 'Gabriel Pacheco', email: 'gabriel.pacheco@farmavida.com.bo', depto: 'Tecnología', cargo: 'Data Analyst', rol: 'Colaborador', ingreso: '30 May 2025', status: 'activo', registro: 100, onb: 'en-curso', onbPct: 70, foto: 'm/17', initials: 'GP', color: '#059669', buddy: BUDDY_DIEGO },
  { id: 21, name: 'Valeria Rojas', email: 'valeria.rojas@farmavida.com.bo', depto: 'Marketing', cargo: 'Content Creator', rol: 'Colaborador', ingreso: '07 Ago 2025', status: 'activo', registro: 100, onb: 'graduado', foto: 'w/48', initials: 'VR', color: '#c026d3', jefe: JEFE_ANA },
  { id: 22, name: 'Emilio Vargas', email: 'emilio.vargas@farmavida.com.bo', depto: 'Operaciones', cargo: 'Asistente Operativo', rol: 'Colaborador', ingreso: '20 Jun 2026', status: 'licencia', registro: 50, onb: 'sin-ruta', foto: 'm/83', initials: 'EV', color: '#ea580c' },
  { id: 23, name: 'Camilo Espinoza', email: 'camilo.espinoza@farmavida.com.bo', depto: 'Finanzas', cargo: 'Tesorero', rol: 'Gerente', ingreso: '11 Oct 2024', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/40', initials: 'CE', color: '#2563eb' },
  { id: 24, name: 'Julieta Sánchez', email: 'julieta.sanchez@farmavida.com.bo', depto: 'Recursos Humanos', cargo: 'Reclutadora', rol: 'Colaborador', ingreso: '28 Jun 2026', status: 'activo', registro: 15, onb: 'sin-ruta', foto: 'w/5', initials: 'JS', color: '#9333ea' },
  { id: 25, name: 'Ana Martínez Ruiz', email: 'ana.martinez@farmavida.com.bo', depto: 'Marketing', cargo: 'Líder de Marketing', rol: 'Líder de área', ingreso: '19 Feb 2024', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/65', initials: 'AM', color: '#c026d3' },
  { id: 26, name: 'Bruno Salazar', email: 'bruno.salazar@farmavida.com.bo', depto: 'Marketing', cargo: 'Especialista SEO', rol: 'Colaborador', ingreso: '01 Jun 2026', status: 'activo', registro: 100, onb: 'en-riesgo', onbPct: 18, foto: 'm/29', initials: 'BS', color: '#f43f5e', buddy: BUDDY_MARTIN, jefe: JEFE_ANA },
  { id: 27, name: 'Natalia Ferrer', email: 'natalia.ferrer@farmavida.com.bo', depto: 'Marketing', cargo: 'Ejecutiva de Marca', rol: 'Colaborador', ingreso: '15 Jun 2026', status: 'activo', registro: 100, onb: 'sin-iniciar', onbPct: 0, foto: 'w/90', initials: 'NF', color: '#8b5cf6', jefe: JEFE_ANA },
  // Dirección General: son la punta del organigrama, por eso existen en el directorio.
  { id: 28, name: 'Ricardo Ballivián', email: 'ricardo.ballivian@farmavida.com.bo', depto: 'Dirección General', cargo: 'Gerente General', rol: 'Gerente', ingreso: '02 Ene 2023', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/68', initials: 'RB', color: '#0C2D40' },
  { id: 29, name: 'Lorena Aguirre', email: 'lorena.aguirre@farmavida.com.bo', depto: 'Dirección General', cargo: 'Asistente de Dirección', rol: 'Colaborador', ingreso: '18 Mar 2023', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/37', initials: 'LA', color: '#0891b2' },

  /* PERSONAL SIN UBICAR EN EL ORGANIGRAMA. Existen en el directorio y no ocupan ningún cuadro:
     son el banco de gente disponible para cubrir plazas. Sin ellos el organigrama sembrado deja
     a cada persona en una casilla, y la lista de "Quiénes lo ocupan" —que solo ofrece a quien no
     ocupa otro puesto— sale vacía justo al ir a cubrir una vacante.

     "Sin puesto asignado" es el respaldo que muestra el directorio mientras nadie los dibuje: el
     cargo de verdad sale del cuadro que ocupan (`cargoDe`), y área no tienen —eso lo decide la
     estructura, no el directorio—. Van como 'n-a' a propósito: es personal existente sin ubicar,
     no ingresos nuevos, así que no ensucian los tableros de onboarding. */
  { id: 30, name: 'Adriana Ledezma', email: 'adriana.ledezma@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '02 Ene 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/1', initials: 'AL', color: '#0ea5e9' },
  { id: 31, name: 'Fernando Quisbert', email: 'fernando.quisbert@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '05 Feb 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/1', initials: 'FQ', color: '#f97316' },
  { id: 32, name: 'Marcela Antelo', email: 'marcela.antelo@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '08 Mar 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/2', initials: 'MA', color: '#8b5cf6' },
  { id: 33, name: 'Iván Chumacero', email: 'ivan.chumacero@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '11 Abr 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/2', initials: 'IC', color: '#14b8a6' },
  { id: 34, name: 'Gabriela Loayza', email: 'gabriela.loayza@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '14 May 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/3', initials: 'GL', color: '#e11d48' },
  { id: 35, name: 'Rodrigo Terceros', email: 'rodrigo.terceros@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '17 Jun 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/3', initials: 'RT', color: '#3b82f6' },
  { id: 36, name: 'Lucía Balderrama', email: 'lucia.balderrama@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '20 Jul 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/4', initials: 'LB', color: '#65a30d' },
  { id: 37, name: 'Álvaro Justiniano', email: 'alvaro.justiniano@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '23 Ago 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/4', initials: 'ÁJ', color: '#d946ef' },
  { id: 38, name: 'Patricia Mostajo', email: 'patricia.mostajo@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '26 Ene 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/6', initials: 'PM', color: '#0891b2' },
  { id: 39, name: 'Javier Suárez', email: 'javier.suarez@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '03 Feb 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/5', initials: 'JS', color: '#ca8a04' },
  { id: 40, name: 'Silvia Ortuño', email: 'silvia.ortuno@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '06 Mar 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/7', initials: 'SO', color: '#7c3aed' },
  { id: 41, name: 'Marcelo Zurita', email: 'marcelo.zurita@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '09 Abr 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/6', initials: 'MZ', color: '#059669' },
  { id: 42, name: 'Karen Villarroel', email: 'karen.villarroel@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '12 May 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/8', initials: 'KV', color: '#db2777' },
  { id: 43, name: 'Pablo Encinas', email: 'pablo.encinas@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '15 Jun 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/7', initials: 'PE', color: '#2563eb' },
  { id: 44, name: 'Rocío Calderón', email: 'rocio.calderon@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '18 Jul 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/10', initials: 'RC', color: '#f59e0b' },
  { id: 45, name: 'Óscar Landívar', email: 'oscar.landivar@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '21 Ago 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/9', initials: 'ÓL', color: '#10b981' },
  { id: 46, name: 'Fabiola Arispe', email: 'fabiola.arispe@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '24 Ene 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/11', initials: 'FA', color: '#c026d3' },
  { id: 47, name: 'Hugo Michel', email: 'hugo.michel@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '27 Feb 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/10', initials: 'HM', color: '#0d9488' },
  { id: 48, name: 'Verónica Ayala', email: 'veronica.ayala@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '04 Mar 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/13', initials: 'VA', color: '#ef4444' },
  { id: 49, name: 'Ramiro Cuéllar', email: 'ramiro.cuellar@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '07 Abr 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/12', initials: 'RC', color: '#6366f1' },
  { id: 50, name: 'Andrea Pinto', email: 'andrea.pinto@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '10 May 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/14', initials: 'AP', color: '#84cc16' },
  { id: 51, name: 'Gonzalo Áñez', email: 'gonzalo.anez@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '13 Jun 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/13', initials: 'GÁ', color: '#ea580c' },
  { id: 52, name: 'Mariana Ribera', email: 'mariana.ribera@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '16 Jul 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/15', initials: 'MR', color: '#06b6d4' },
  { id: 53, name: 'Enrique Dorado', email: 'enrique.dorado@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '19 Ago 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/14', initials: 'ED', color: '#9333ea' },
  { id: 54, name: 'Claudia Nogales', email: 'claudia.nogales@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '22 Ene 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/16', initials: 'CN', color: '#f43f5e' },
  { id: 55, name: 'Diego Camacho', email: 'diego.camacho@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '25 Feb 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/15', initials: 'DC', color: '#22c55e' },
  { id: 56, name: 'Tatiana Roca', email: 'tatiana.roca@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '02 Mar 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/17', initials: 'TR', color: '#a855f7' },
  { id: 57, name: 'Luis Peñaranda', email: 'luis.penaranda@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '05 Abr 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/16', initials: 'LP', color: '#0C2D40' },
  { id: 58, name: 'Alejandra Vaca', email: 'alejandra.vaca@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '08 May 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'w/18', initials: 'AV', color: '#ec4899' },
  { id: 59, name: 'Sergio Molina', email: 'sergio.molina@farmavida.com.bo', depto: 'Sin asignar', cargo: 'Sin puesto asignado', rol: 'Colaborador', ingreso: '11 Jun 2026', status: 'activo', registro: 100, onb: 'n-a', foto: 'm/18', initials: 'SM', color: '#334155' },
]
