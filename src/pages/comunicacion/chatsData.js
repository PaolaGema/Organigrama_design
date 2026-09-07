/* CONVERSACIONES DE DEMO.
   Las personas son las mismas del directorio (`colaboradoresData`) y del selector de roles: si
   el chat inventara gente nueva, el prototipo enseñaría una plantilla que no existe en ninguna
   otra pantalla. Los grupos son los tres que cualquier empresa tiene de verdad —toda la
   empresa, el área, y el de la camada que está entrando— y no nombres decorativos.

   `mio: true` marca los mensajes del usuario que mira la demo. No se guarda quién los escribió
   porque el chat no es de nadie en particular en el prototipo: lo que se enseña es la forma de
   la pantalla, no el buzón de Juan Pérez. */

export const conversacionesSeed = [
  {
    id: 'g-trabajito',
    tipo: 'grupo',
    nombre: 'Team Trabajito',
    detalle: '38 miembros',
    color: '#0C2D40',
    hora: '4:31 PM',
    noLeidos: 3,
    mensajes: [
      { id: 1, autor: 'Ana Martínez Ruiz', texto: 'Buenos días a todos ☀️ Recuerden que mañana es el desayuno de bienvenida para la camada de junio.', hora: '9:12 AM' },
      { id: 2, autor: 'Roberto Peña', texto: '¿A qué hora sería? Tengo cierre contable a las 10.', hora: '9:20 AM' },
      { id: 3, autor: 'Ana Martínez Ruiz', texto: '8:30 en el comedor del segundo piso, dura media hora nomás.', hora: '9:22 AM' },
      { id: 4, autor: 'yo', texto: 'Perfecto, ahí confirmo la lista de los que ingresan esta semana.', hora: '9:40 AM', mio: true },
      { id: 5, autor: 'Vania Sabrina Vargas', texto: 'Ya subí las fotos del último evento a Recursos corporativos 📸', hora: '4:31 PM' },
    ],
  },
  {
    id: 'g-onboarding',
    tipo: 'grupo',
    nombre: 'Onboarding — Junio 2026',
    detalle: '9 miembros · buddies y RRHH',
    color: '#00A96B',
    hora: '1:26 PM',
    noLeidos: 0,
    mensajes: [
      { id: 1, autor: 'Paola Arce', texto: 'Equipo, esta semana ingresan Mateo, Julieta y Emilio. Los tres ya tienen ruta asignada.', hora: '11:02 AM' },
      { id: 2, autor: 'Diego Morales', texto: 'Yo acompaño a Mateo. ¿Le doy el recorrido de oficina el primer día o el segundo?', hora: '11:15 AM' },
      { id: 3, autor: 'yo', texto: 'El primero, junto con la entrega de equipos. El segundo día ya entra a las tareas de su área.', hora: '11:30 AM', mio: true },
      { id: 4, autor: 'Paola Arce', texto: 'Confirmado. Dejo el checklist actualizado en la ruta 👌', hora: '1:26 PM' },
    ],
  },
  {
    id: 'p-ana',
    tipo: 'personal',
    nombre: 'Ana Martínez Ruiz',
    detalle: 'Líder de Área — Marketing',
    color: '#c026d3',
    hora: '11:48 AM',
    noLeidos: 2,
    mensajes: [
      { id: 1, autor: 'Ana Martínez Ruiz', texto: 'Hola! ¿Viste que Andrea va por el 55 % de su onboarding?', hora: '11:40 AM' },
      { id: 2, autor: 'yo', texto: 'Sí, la vi ayer en el seguimiento. Va bien de tiempo.', hora: '11:44 AM', mio: true },
      { id: 3, autor: 'Ana Martínez Ruiz', texto: 'Me gustaría sumarle la capacitación de marca antes de que cierre el mes.', hora: '11:47 AM' },
      { id: 4, autor: 'Ana Martínez Ruiz', texto: '¿La agregamos a su ruta o la dejamos como tarea suelta?', hora: '11:48 AM' },
    ],
  },
  {
    id: 'p-diego',
    tipo: 'personal',
    nombre: 'Diego Morales',
    detalle: 'Buddy — Tecnología',
    color: '#3b82f6',
    hora: 'Ayer',
    noLeidos: 0,
    mensajes: [
      { id: 1, autor: 'Diego Morales', texto: 'Terminé el recorrido con Gabriel. Le quedó clara la parte de accesos.', hora: '3:10 PM' },
      { id: 2, autor: 'yo', texto: 'Gracias Diego 🙌 ¿Alguna traba con los permisos del repositorio?', hora: '3:22 PM', mio: true },
      { id: 3, autor: 'Diego Morales', texto: 'Ninguna, ya está adentro. Marco la tarea como cumplida.', hora: '3:25 PM' },
    ],
  },
  {
    id: 'p-paola',
    tipo: 'personal',
    nombre: 'Paola Arce',
    detalle: 'Especialista RRHH',
    color: '#d946ef',
    hora: 'Ayer',
    noLeidos: 1,
    mensajes: [
      { id: 1, autor: 'yo', texto: '¿Ya subieron el reglamento actualizado a Recursos corporativos?', hora: '10:05 AM', mio: true },
      { id: 2, autor: 'Paola Arce', texto: 'Lo subo hoy. Falta la firma de gerencia en la última hoja.', hora: '10:31 AM' },
      { id: 3, autor: 'Paola Arce', texto: 'Te aviso apenas quede publicado 📄', hora: '10:32 AM' },
    ],
  },
  {
    id: 'g-tecnologia',
    tipo: 'grupo',
    nombre: 'Tecnología',
    detalle: '12 miembros',
    color: '#6366f1',
    hora: 'Viernes',
    noLeidos: 0,
    mensajes: [
      { id: 1, autor: 'Alejandro Ríos', texto: 'Despliegue de la versión 2.4 el lunes a primera hora.', hora: '5:02 PM' },
      { id: 2, autor: 'Martín Solano', texto: 'Listo de mi lado ✅', hora: '5:09 PM' },
      { id: 3, autor: 'Facundo Medina', texto: 'Corro las pruebas el domingo por la noche para no bloquear a nadie.', hora: '5:14 PM' },
    ],
  },
  {
    id: 'p-carolina',
    tipo: 'personal',
    nombre: 'Carolina Vega',
    detalle: 'Analista de Marketing',
    color: '#14b8a6',
    hora: 'Jueves',
    noLeidos: 0,
    mensajes: [
      { id: 1, autor: 'Carolina Vega', texto: 'Terminé mi onboarding 🎉 gracias por el acompañamiento.', hora: '2:40 PM' },
      { id: 2, autor: 'yo', texto: '¡Felicidades Carolina! Te llega el reconocimiento por el muro esta semana.', hora: '2:55 PM', mio: true },
    ],
  },
  {
    id: 'p-nicolas',
    tipo: 'personal',
    nombre: 'Nicolás Zapata',
    detalle: 'Líder de Área — Ventas',
    color: '#84cc16',
    hora: 'Miércoles',
    noLeidos: 0,
    mensajes: [
      { id: 1, autor: 'Nicolás Zapata', texto: 'Necesito abrir una plaza más de SDR para Santa Cruz.', hora: '9:15 AM' },
      { id: 2, autor: 'yo', texto: 'Pásame el cargo y la sede y la creo en Puestos hoy mismo.', hora: '9:30 AM', mio: true },
      { id: 3, autor: 'Nicolás Zapata', texto: 'SDR Junior, sucursal Santa Cruz. Gracias!', hora: '9:33 AM' },
    ],
  },
  {
    id: 'p-daniela',
    tipo: 'personal',
    nombre: 'Daniela Flores',
    detalle: 'Analista de Nóminas',
    color: '#e11d48',
    hora: 'Martes',
    noLeidos: 0,
    mensajes: [
      { id: 1, autor: 'Daniela Flores', texto: 'Las altas del mes ya están cargadas en planillas.', hora: '4:48 PM' },
      { id: 2, autor: 'yo', texto: 'Perfecto, gracias 🙏', hora: '5:01 PM', mio: true },
    ],
  },
]
