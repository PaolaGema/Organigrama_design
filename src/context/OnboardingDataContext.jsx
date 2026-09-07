import { createContext, useContext, useCallback, useEffect, useMemo } from 'react'
import { useLocalStorage, clearAllDemoData } from '../hooks/useLocalStorage'
import { rutasSeedEtapas } from '../data/rutasSeedEtapas'
import { colaboradoresData } from '../pages/personas/colaboradoresData'
import { orgSeed, orgVacio, empresa as empresaSeed, sucursales as sucursalesSeed } from '../data/organigramaData'
import {
  semillaNodos, nivelesIniciales, nivelesDeSemilla, estructuraEjemplo, LLAVE_NIVELES, sanearNiveles,
  unidadesDeNodos, aplicarUnidades, cargosDeNodos, aplicarCargos,
} from '../data/estructuraData'
import { cargosDe } from '../utils/rutaEstados'

const OnboardingDataContext = createContext()

/* UN ORGANIGRAMA SIN SU LISTA DE UNIDADES, que es como se guarda desde que el árbol es el dueño de
   esa lista. Se BORRA la llave en vez de dejarla quieta: una copia vieja ahí adentro es la segunda
   verdad que este cambio vino a matar, esperando a que alguien la lea por error. */
const sinListas = org => {
  const copia = { ...org }
  delete copia.unidades
  delete copia.cargos
  return copia
}

/* EL ORGANIGRAMA COMO LO PIDEN LAS PANTALLAS: lo que queda guardado en su llave —relaciones,
   niveles de mando, colores, acomodos— más las dos listas que ahora vienen del árbol. */
const conListas = (crudo, nodos) => ({
  ...crudo,
  unidades: unidadesDeNodos(nodos),
  cargos: cargosDeNodos(nodos),
})

const sampleRecursos = [
  {
    name: 'Políticas',
    docs: [
      { id: 1, name: 'Código de conducta 2025.pdf', size: '2.4 MB', estado: 'procesado', fecha: '12 Jun 2026', general: true, subidoPor: 'Paola Gema' },
      { id: 2, name: 'Política de vacaciones.pdf', size: '1.1 MB', estado: 'procesado', fecha: '10 Jun 2026', general: true, subidoPor: 'Paola Gema' },
      { id: 3, name: 'Reglamento interno.docx', size: '3.8 MB', estado: 'procesado', fecha: '18 Jun 2026', general: true, subidoPor: 'Paola Gema' },
    ],
  },
  {
    name: 'Beneficios',
    docs: [
      { id: 4, name: 'Manual de beneficios.pdf', size: '4.2 MB', estado: 'procesado', fecha: '8 Jun 2026', general: true, subidoPor: 'Paola Gema' },
      { id: 5, name: 'Guía de seguro médico.pdf', size: '1.8 MB', estado: 'procesado', fecha: '5 Jun 2026', general: true, subidoPor: 'Paola Gema' },
    ],
  },
  {
    name: 'Cultura',
    docs: [
      { id: 8, name: 'Valores y misión.pdf', size: '1.5 MB', estado: 'procesado', fecha: '1 Jun 2026', general: true, subidoPor: 'Paola Gema' },
    ],
  },
]

const samplePlantillasBase = [
  { id: 1, name: 'Onboarding Ventas — Pasante', area: 'Ventas', cargos: ['Pasante Comercial', 'SDR Junior'], tipo: 'Onboarding', etapas: 12, tareas: 34, asignados: 8, status: 'activa', updated: 'Hace 2 días', updatedFecha: '29/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '02/03/2026', color: '#3b82f6' },
  { id: 2, name: 'Onboarding Comercial — Ejecutivo', area: 'Comercial', cargos: ['Ejecutivo Comercial'], tipo: 'Onboarding', etapas: 10, tareas: 28, asignados: 5, status: 'activa', updated: 'Hace 5 días', updatedFecha: '26/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '15/02/2026', color: '#10b981' },
  { id: 3, name: 'Onboarding Liderazgo', area: 'Dirección', cargos: ['Director de Área'], tipo: 'Onboarding', etapas: 8, tareas: 22, asignados: 2, status: 'activa', updated: 'Hace 1 semana', updatedFecha: '24/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '10/01/2026', color: '#8b5cf6' },
  { id: 4, name: 'Onboarding Operaciones', area: 'Operaciones', cargos: ['Analista de Procesos'], tipo: 'Onboarding', etapas: 9, tareas: 25, asignados: 3, status: 'activa', updated: 'Hace 1 semana', updatedFecha: '24/06/2026', creador: 'Ana Martínez Ruiz', creadorRole: 'Líder de Área — Marketing', creadoEl: '20/01/2026', color: '#f59e0b' },
  { id: 5, name: 'Onboarding Tech — Backend', area: 'Tecnología', cargos: ['Desarrollador Backend', 'QA Engineer'], tipo: 'Onboarding', etapas: 14, tareas: 40, asignados: 4, status: 'activa', updated: 'Hace 3 días', updatedFecha: '28/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '05/12/2025', color: '#06b6d4' },
  { id: 6, name: 'Onboarding Finanzas', area: 'Finanzas', cargos: ['Analista Financiera'], tipo: 'Onboarding', etapas: 7, tareas: 18, asignados: 0, status: 'borrador', updated: 'Ayer', updatedFecha: '30/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '15/06/2026', color: '#f97316' },
  { id: 7, name: 'Onboarding Diseño & UX', area: 'Diseño', cargos: ['Diseñadora UX/UI'], tipo: 'Onboarding', etapas: 11, tareas: 30, asignados: 2, status: 'activa', updated: 'Hace 4 días', updatedFecha: '27/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '08/03/2026', color: '#ec4899' },
  { id: 8, name: 'Onboarding RRHH — Generalista', area: 'Recursos Humanos', cargos: ['Generalista RRHH'], tipo: 'Onboarding', etapas: 6, tareas: 15, asignados: 0, status: 'borrador', updated: 'Hace 2 semanas', updatedFecha: '17/06/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '01/06/2026', color: '#0d9488' },
  { id: 9, name: 'Onboarding Marketing Digital', area: 'Marketing', cargos: ['Content Creator'], tipo: 'Onboarding', etapas: 10, tareas: 26, asignados: 1, status: 'activa', updated: 'Hace 6 días', updatedFecha: '25/06/2026', creador: 'Ana Martínez Ruiz', creadorRole: 'Líder de Área — Marketing', creadoEl: '20/04/2026', color: '#d946ef' },
  { id: 10, name: 'Onboarding Legal 2025', area: 'Legal', cargos: ['Abogado Corporativo'], tipo: 'Onboarding', etapas: 5, tareas: 12, asignados: 0, status: 'inactiva', updated: 'Hace 3 meses', updatedFecha: '01/04/2026', creador: 'Juan Pérez Gómez', creadorRole: 'Administrador HR', creadoEl: '15/11/2025', color: '#64748b' },
]

// Adjunta las etapas de ejemplo a las rutas que las tienen y recalcula sus
// contadores de etapas/tareas para que cuadren con el contenido real.
const samplePlantillas = samplePlantillasBase.map(p => {
  const etapasData = rutasSeedEtapas[p.id]
  if (!etapasData) return p
  const tareas = etapasData.reduce((s, e) => s + e.actividades.reduce((s2, a) => s2 + a.tareas.length, 0), 0)
  return { ...p, etapasData, etapas: etapasData.length, tareas }
})

/* El `cargo` no es decorativo: además de mostrarse en la ficha, alimenta el filtro por cargo
   de Seguimiento, que queda vacío en cuanto una asignación no lo trae. */
const sampleAsignaciones = [
  // 75% = 6 de 8 tareas: incluye "Prueba de arquitectura" (la 6ª), para que en el detalle
  // aparezca completada y se puedan ver sus respuestas simuladas.
  { id: 1, nombre: 'Diego Morales', area: 'Tecnología', cargo: 'Desarrollador Backend', ruta: 'Onboarding Tech — Backend', dia: 14, totalDias: 30, pct: 75, status: 'en-curso', fechaInicio: '03 Jun 2026', color: '#3b82f6' },
  { id: 2, nombre: 'Camila Herrera', area: 'Ventas', cargo: 'Ejecutiva Comercial', ruta: 'Onboarding Ventas — Pasante', dia: 18, totalDias: 30, pct: 42, status: 'en-curso', fechaInicio: '30 May 2026', color: '#f97316' },
  { id: 3, nombre: 'Valentina Cruz', area: 'Diseño', cargo: 'Diseñadora UX/UI', ruta: 'Onboarding Diseño & UX', dia: 20, totalDias: 30, pct: 25, status: 'atrasado', fechaInicio: '28 May 2026', color: '#ec4899' },
  { id: 4, nombre: 'Facundo Medina', area: 'Tecnología', cargo: 'QA Engineer', ruta: 'Onboarding Tech — Backend', dia: 21, totalDias: 30, pct: 15, status: 'en-riesgo', fechaInicio: '27 May 2026', color: '#ef4444' },
  { id: 5, nombre: 'Sofía Ramírez', area: 'Ventas', cargo: 'Pasante Comercial', ruta: 'Onboarding Ventas — Pasante', dia: 1, totalDias: 30, pct: 0, status: 'pendiente', fechaInicio: '17 Jun 2026', color: '#f59e0b' },
  { id: 6, nombre: 'Martín Solano', area: 'Tecnología', cargo: 'Frontend Developer', ruta: 'Onboarding Tech — Backend', dia: 30, totalDias: 30, pct: 100, status: 'completado', fechaInicio: '18 May 2026', color: '#10b981' },
  { id: 7, nombre: 'Isabella Vargas', area: 'Comercial', cargo: 'Ejecutiva Comercial', ruta: 'Onboarding Comercial — Ejecutivo', dia: 10, totalDias: 30, pct: 55, status: 'en-curso', fechaInicio: '07 Jun 2026', color: '#8b5cf6' },
  { id: 8, nombre: 'Nicolás Paredes', area: 'Ventas', cargo: 'Pasante Comercial', ruta: 'Onboarding Ventas — Pasante', dia: 24, totalDias: 30, pct: 73, status: 'en-curso', fechaInicio: '24 May 2026', color: '#0d9488' },
  { id: 9, nombre: 'Andrea Ríos', area: 'Operaciones', cargo: 'Analista de Procesos', ruta: 'Onboarding Operaciones', dia: 8, totalDias: 30, pct: 35, status: 'en-curso', fechaInicio: '09 Jun 2026', color: '#06b6d4' },
  { id: 10, nombre: 'Rodrigo Peña', area: 'Dirección', cargo: 'Director de Área', ruta: 'Onboarding Liderazgo', dia: 28, totalDias: 30, pct: 90, status: 'en-curso', fechaInicio: '20 May 2026', color: '#d946ef' },
  { id: 11, nombre: 'Paula Mendoza', area: 'Marketing', cargo: 'Content Creator', ruta: 'Onboarding Marketing Digital', dia: 30, totalDias: 30, pct: 100, status: 'completado', fechaInicio: '18 May 2026', color: '#3b82f6' },
  { id: 12, nombre: 'Emilio Castañeda', area: 'Recursos Humanos', cargo: 'Generalista RRHH', ruta: 'Onboarding RRHH — Generalista', dia: 5, totalDias: 30, pct: 20, status: 'en-curso', fechaInicio: '12 Jun 2026', color: '#f97316' },
  { id: 13, nombre: 'Andrea Núñez', area: 'Marketing', cargo: 'Community Manager', ruta: 'Onboarding Marketing Digital', dia: 16, totalDias: 30, pct: 55, status: 'en-curso', fechaInicio: '01 Jun 2026', color: '#06b6d4' },
  { id: 14, nombre: 'Isabella Mendoza', area: 'Marketing', cargo: 'Analista de Marketing', ruta: 'Onboarding Marketing Digital', dia: 10, totalDias: 30, pct: 32, status: 'en-curso', fechaInicio: '07 Jun 2026', color: '#7c3aed' },
]

const sampleFeed = [
  { text: 'Martín Solano completó su ruta de Onboarding Tech', time: 'Hace 2 h' },
  { text: 'Diego Morales completó la tarea "Mensaje del CEO"', time: 'Hace 3 h' },
  { text: 'Valentina Cruz fue marcada "en riesgo" por inactividad', time: 'Hace 5 h' },
  { text: 'Nueva ruta "Onboarding Finanzas" creada', time: 'Ayer' },
  { text: 'Sofía Ramírez fue asignada a Onboarding Ventas 2026', time: 'Ayer' },
]

const sampleConfig = {
  gamificacion: true,
  buddy: true,
  menciones: true,
  riesgo: true,
  extension: false,
  asignacion: 'auto',
  activacion: 'fecha',
  horaAsignacion: '08:00',
  riesgoDias: 3,
}

export function OnboardingDataProvider({ children }) {
  const [recursos, setRecursos] = useLocalStorage('recursos', [
    { name: 'Políticas', docs: [] },
    { name: 'Beneficios', docs: [] },
    { name: 'Cultura', docs: [] },
  ])
  const [recursosPersonas, setRecursosPersonas] = useLocalStorage('recursosPersonas', [])
  const [recursosComunicacion, setRecursosComunicacion] = useLocalStorage('recursosComunicacion', [])
  const [recursosEvaluacion, setRecursosEvaluacion] = useLocalStorage('recursosEvaluacion', [])
  const [plantillas, setPlantillas] = useLocalStorage('plantillas', [])
  const [asignaciones, setAsignaciones] = useLocalStorage('asignaciones', [])
  const [feed, setFeed] = useLocalStorage('feed', [])
  /* El organigrama es dato de demo como todo lo demás: arranca vacío para poder construirlo
     desde cero, "Cargar datos de ejemplo" lo siembra y "Resetear demo" lo borra. Antes vivía
     en un `useState` dentro de la pantalla, así que era lo único que sobrevivía al reseteo. */
  const [organigramaCrudo, setOrganigramaCrudo] = useLocalStorage('organigrama', orgVacio)
  /* LA EMPRESA Y SUS SUCURSALES NO SON DATO DE DEMO, y por eso arrancan sembradas en vez de vacías
     como el organigrama: son lo único que ya existe antes de que alguien dibuje un solo cargo.
     Vivían como constantes importadas del modelo —nadie podía cambiarlas desde la app— y ahora
     son estado, que es lo que le da algo que editar a las dos primeras pantallas de
     Organización. Un dato guardado antes de que existieran estos campos entra sin ellos: las
     pantallas los tratan como opcionales y no rellenan nada por su cuenta. */
  const [empresa, setEmpresa] = useLocalStorage('empresa', empresaSeed)
  const [sucursales, setSucursales] = useLocalStorage('sucursales', sucursalesSeed)

  /* LA ESTRUCTURA VIVE ACÁ Y NO EN CADA PANTALLA.
     La leían por su cuenta cinco sitios —el árbol, la ficha, la configuración, el menú y el
     selector de ámbito—, cada uno con su propio `useLocalStorage`. Eso no comparte estado: son
     cinco copias que solo se enteran de un cambio al volver a montarse. Creabas una sucursal y
     el selector del riel seguía sin verla hasta recargar.

     Puesta en el contexto, es un dato de la demo como los demás: se comparte, y «cargar datos de
     ejemplo» y «reiniciar» pueden tocarla igual que tocan el organigrama. */
  const [nodos, setNodos] = useLocalStorage('estructuraNodos2', semillaNodos(sucursalesSeed, [], empresaSeed))
  const [nivelesEstructura, setNivelesEstructura] = useLocalStorage(LLAVE_NIVELES, nivelesIniciales())
  /* LA LISTA GUARDADA SE SANEA AL LEERLA, UNA VEZ Y PARA TODOS. Los peldaños sobreviven a los
     cambios del código —son un dato de la empresa— así que una lista guardada antes de que «Área»
     y «Subárea» se fusionaran en «Unidad organizacional» trae dos peldaños que ya no existen y le
     falta uno obligatorio. Saneada acá, la configuración también ve la lista buena: si se saneara
     solo dentro del modelo, la pantalla que las edita seguiría enseñando los fantasmas y
     dejándolos reordenar. */
  const nivelesSanos = useMemo(() => sanearNiveles(nivelesEstructura), [nivelesEstructura])

  /* ---------- DONDE EL ORGANIGRAMA Y LAS TABLAS SE VUELVEN UN SOLO DATO ---------- */

  /* LAS UNIDADES YA NO SE GUARDAN DOS VECES. El organigrama sigue pidiendo su `org.unidades` y
     recibiéndolo, pero eso ya no sale de la llave `organigrama`: se proyecta de los nodos del
     árbol, que es el mismo sitio del que la tabla de Unidades organizacionales lee sus filas.
     Crear una unidad en el dibujo y verla en la tabla dejó de necesitar un botón.

     EL EMPALME VIVE ACÁ Y NO EN CADA PANTALLA a propósito: son veinte archivos los que piden
     `organigrama` al contexto, y ninguno tiene que enterarse de esto. Cambia de dónde sale el
     dato, no la forma que tiene. */
  const organigrama = useMemo(() => conListas(organigramaCrudo, nodos), [organigramaCrudo, nodos])

  /* GUARDAR REPARTE EN VEZ DE ESCRIBIR EN UN SITIO. Quien llama sigue entregando un organigrama
     entero —la pantalla no sabe que hay dos almacenes— y acá se abre en dos: las unidades bajan al
     árbol y todo lo demás se queda en la llave de siempre.

     SE LE ENTREGA LA VERSIÓN PROYECTADA como `prev`, no la cruda: las pantallas hacen
     `prev.unidades.map(...)` y con la lista vieja habrían trabajado sobre una copia muerta.

     Y SE LA PIDE DOS VECES, UNA POR ALMACÉN. Cada actualizador recibe de React el `prev` REAL del
     almacén que va a escribir, así que dos guardados seguidos en el mismo gesto no se pisan. El
     precio es llamar a `cambio` dos veces, que no cuesta nada: un actualizador tiene que ser puro
     de todas formas —React ya lo llama dos veces en desarrollo— y estos lo son. */
  const setOrganigrama = useCallback(cambio => {
    const resolver = previo => (typeof cambio === 'function' ? cambio(previo) : cambio)

    setNodos(nodosPrev => {
      const { unidades, cargos } = resolver(conListas(organigramaCrudo, nodosPrev))
      /* LAS UNIDADES PRIMERO Y LOS CARGOS DESPUÉS, sobre el resultado de las unidades y no sobre
         el árbol de entrada: un cargo puede llegar apuntando a una unidad que nace en este mismo
         guardado —crear un área y su primer puesto de una tacada es un gesto solo—, y aplicado al
         revés ese cargo colgaría de una unidad que todavía no existe. */
      const conUnidades = unidades ? aplicarUnidades(nodosPrev, unidades) : nodosPrev
      return cargos ? aplicarCargos(conUnidades, cargos) : conUnidades
    })

    setOrganigramaCrudo(crudoPrev => ({
      ...sinListas(crudoPrev),
      ...sinListas(resolver(conListas(crudoPrev, nodos))),
    }))
  }, [nodos, organigramaCrudo, setNodos, setOrganigramaCrudo])

  /* LO QUE YA ESTABA CARGADO NO SE PIERDE AL CAMBIAR DE SITIO. Quien venía usando la demo tiene sus
     unidades y sus cargos en la llave del organigrama y puede no haber apretado nunca «Traer mis
     datos»: sin
     esto, el día que esta versión llega, sus unidades desaparecen del dibujo y de la tabla a la vez.
     Se suben al árbol las que no estén —por id, así que las ya copiadas no se duplican— y recién
     entonces se limpia la lista vieja. Corre una vez y no vuelve a tener nada que hacer. */
  useEffect(() => {
    const viejas = organigramaCrudo?.unidades || []
    const viejos = organigramaCrudo?.cargos || []
    if (!viejas.length && !viejos.length) return
    setNodos(prev => {
      const hay = new Set(prev.filter(n => n.tipo === 'unidad').map(n => n.id))
      const faltan = viejas.filter(u => !hay.has(u.id)).map(u => ({
        id: u.id, tipo: 'unidad', estado: 'activa',
        nombre: u.nombre, corto: u.corto || u.nombre, padreId: u.padreId ?? null,
        codigo: u.codigo ?? null, mandoId: u.mandoId ?? null,
      }))
      const conUnidades = faltan.length ? [...prev, ...faltan] : prev
      /* Los cargos entran por la misma puerta que usan de acá en más: se le pasa a `aplicarCargos`
         la lista vieja MÁS lo que el árbol ya proyecta, para no borrar de un plumazo lo que ya
         estuviera cargado del otro lado. */
      if (!viejos.length) return conUnidades
      const yaEstan = new Set(cargosDeNodos(conUnidades).map(c => c.id))
      return aplicarCargos(conUnidades, [
        ...cargosDeNodos(conUnidades),
        ...viejos.filter(c => !yaEstan.has(c.id)),
      ])
    })
    setOrganigramaCrudo(sinListas)
  }, [])

  /* LA DEMO CAMBIÓ DE EMPRESA: era «SoulyHR», que es el nombre del propio producto, y pasó a
     «FarmaVida». Quien ya había abierto la aplicación tiene la anterior guardada y no vería el
     cambio nunca —`useLocalStorage` solo usa el valor inicial cuando la llave no existe—.

     Se cambia SOLO si está intacta: si coincide exactamente con la semilla vieja, nadie la
     tocó y es dato de relleno. En cuanto alguien haya escrito su propio nombre o su NIT, se
     queda como está. Migrar a ciegas habría borrado el trabajo de quien ya cargó su empresa. */
  useEffect(() => {
    if (empresa?.nombre === 'SoulyHR' && empresa?.razonSocial === 'SoulyHR S.R.L.' && !empresa?.nit) {
      setEmpresa(empresaSeed)
    }
  }, [])

  /* LAS SUCURSALES DE EJEMPLO CAMBIARON DE NOMBRE, y por la misma razón que la empresa: quien ya
     tenía la demo abierta seguiría viendo «Sucursal», «Sucursal», «Oficina Regional» para siempre.
     Los datos de ejemplo solo se siembran cuando la llave no existe todavía.

     Mismo criterio que arriba: se renombra SOLO la que sigue con el nombre genérico exacto. Si
     alguien ya la bautizó, no se toca. Y de paso se engancha El Alto —y su depósito— a Occidente:
     colgaban de una llave que no existía y salían con un guion en «Depende de».

     Vale para el árbol y para la lista vieja de sucursales, porque las dos guardan el nombre. */
  useEffect(() => {
    /*  lleva TODOS los nombres que esta demo llegó a poner —el genérico primero y el barrio
       a secas después—, porque hubo una versión intermedia y quien la vio tiene ese guardado. Se
       renombra si el nombre actual es cualquiera de ellos; con cualquier otro, es que lo escribió
       una persona y no se toca. */
    const NOMBRES = {
      central: { de: ['Sucursal Central'], a: 'Casa Matriz Equipetrol' },
      lpz: { de: ['Sucursal', 'Sopocachi'], a: 'Sucursal Sopocachi' },
      cbb: { de: ['Sucursal', 'El Prado'], a: 'Sucursal El Prado' },
      sre: { de: ['Sucursal', 'La Recoleta'], a: 'Sucursal La Recoleta' },
      tja: { de: ['Sucursal', 'Las Américas'], a: 'Sucursal Las Américas' },
      oru: { de: ['Oficina Regional', 'Plaza 10 de Febrero'], a: 'Sucursal Plaza 10 de Febrero' },
      pot: { de: ['Oficina Regional', 'Villa Imperial'], a: 'Sucursal Villa Imperial' },
      eal: { de: ['Punto de Venta', 'La Ceja', 'Sucursal La Ceja'], a: 'Sucursal 16 de Julio' },
    }
    const renombrar = x => {
      const m = NOMBRES[x.id]
      return m && m.de.includes(x.nombre) ? { ...x, nombre: m.a } : x
    }
    const recolgar = x => (
      (x.id === 'eal' || x.id === 'dep-alto') && !x.padreId
        ? { ...x, padreId: x.id === 'eal' ? 'reg-occidente' : 'eal' }
        : x
    )

    setNodos(prev => {
      const sig = prev.map(n => recolgar(renombrar(n)))
      return sig.some((n, i) => n !== prev[i]) ? sig : prev
    })
    setSucursales(prev => {
      const sig = prev.map(renombrar)
      return sig.some((n, i) => n !== prev[i]) ? sig : prev
    })
  }, [])
  const [configToggles, setConfigToggles] = useLocalStorage('config', {
    gamificacion: true,
    buddy: true,
    menciones: true,
    riesgo: true,
    extension: true,
    certificado: true,
    asignacion: 'manual',
    activacion: 'manual',
    horaAsignacion: '08:00',
    riesgoDias: 3,
    mencionesEventos: { inicio: true, etapa: false, graduacion: true },
    cert: { color: '#0C2D40', logo: null, firmas: [{ nombre: '', cargo: '' }, { nombre: '', cargo: '' }] },
  })
  const [tronco] = useLocalStorage('tronco', { configured: false, etapas: [] })

  // Migración de una sola vez: el viejo "tronco" (Inducción general hardcodeada)
  // pasa a ser una plantilla real marcada como global, para no perder lo ya configurado.
  useEffect(() => {
    if (!tronco.configured || !tronco.etapas.length) return
    setPlantillas(prev => {
      if (prev.some(p => p.migratedFromTronco)) return prev
      const tareasCount = tronco.etapas.reduce((s, e) => s + e.actividades.reduce((s2, a) => s2 + a.tareas.length, 0), 0)
      return [...prev, {
        id: Date.now(),
        name: 'Inducción general',
        area: 'Todas las áreas',
        cargo: '',
        esGlobal: true,
        ordenGlobal: 0,
        etapasData: tronco.etapas,
        etapas: tronco.etapas.length,
        tareas: tareasCount,
        asignados: 0,
        status: 'activa',
        updated: 'Migrada automáticamente',
        color: '#0C2D40',
        migratedFromTronco: true,
      }]
    })
  }, [tronco, setPlantillas])

  // Backfill de rutas: (1) rellena etapas de ejemplo del seed que falten y
  // (2) inicializa el historial de versiones (v1) si la ruta aún no lo tiene.
  useEffect(() => {
    setPlantillas(prev => {
      let changed = false
      const next = prev.map(p => {
        let np = p
        const seed = rutasSeedEtapas[p.id]
        if (seed && !(np.etapasData && np.etapasData.length)) {
          const tareas = seed.reduce((s, e) => s + e.actividades.reduce((s2, a) => s2 + a.tareas.length, 0), 0)
          np = { ...np, etapasData: seed, etapas: seed.length, tareas }
          changed = true
        }
        if (!np.versiones || !np.versiones.length) {
          const etapasData = np.etapasData || []
          const tareas = etapasData.reduce((s, e) => s + e.actividades.reduce((s2, a) => s2 + a.tareas.length, 0), 0)
          np = {
            ...np,
            versionActual: 1,
            versiones: [{ v: 1, etapasData, etapas: etapasData.length, tareas, fecha: np.creadoEl || np.updatedFecha || '—', autor: np.creador || '—' }],
          }
          changed = true
        }
        return np
      })
      return changed ? next : prev
    })
  }, [setPlantillas])

  // Backfill de asignaciones: las que no tienen versión se fijan a la v1 de su
  // ruta (más un snapshot de respaldo del contenido), para que ediciones
  // posteriores a la plantilla no alteren a quien ya está en curso.
  useEffect(() => {
    if (!plantillas.length) return
    setAsignaciones(prev => {
      let changed = false
      const next = prev.map(a => {
        let na = a
        if (!(na.etapasData && na.etapasData.length)) {
          const ruta = plantillas.find(p => p.id === na.rutaId || p.name === na.ruta)
          if (ruta && ruta.etapasData && ruta.etapasData.length) {
            na = { ...na, rutaId: ruta.id, etapasData: JSON.parse(JSON.stringify(ruta.etapasData)) }
            changed = true
          }
        }
        if (na.version == null) {
          na = { ...na, version: 1 }
          changed = true
        }
        /* Las asignaciones guardadas antes de que existiera el campo se quedaron sin cargo,
           y sin él la ficha muestra solo el área y el filtro por cargo llega vacío. Se toma
           del directorio y, si la persona no está ahí, del cargo al que apunta su ruta —solo
           si apunta a uno: con varios, cualquiera de ellos sería inventarle un puesto. */
        if (!na.cargo) {
          const cargosRuta = cargosDe(plantillas.find(p => p.id === na.rutaId || p.name === na.ruta))
          const cargo = colaboradoresData.find(c => c.name === na.nombre)?.cargo
            || (cargosRuta.length === 1 ? cargosRuta[0] : null)
          if (cargo) {
            na = { ...na, cargo }
            changed = true
          }
        }
        return na
      })
      return changed ? next : prev
    })
  }, [plantillas, setAsignaciones])

  const addFeedEntry = useCallback((text) => {
    setFeed(prev => [{ text, time: 'Ahora' }, ...prev].slice(0, 20))
  }, [setFeed])

  const resetDemo = useCallback(() => {
    clearAllDemoData()
    /* AL RESETEAR SE VA AL ORGANIGRAMA Y NO A ONBOARDING. Con la demo recién borrada no hay una
       sola ruta, ni una asignación, ni un recurso: Onboarding abre vacío y sin nada que hacer ahí
       —lo que falta primero es la estructura—. El organigrama vacío, en cambio, abre con sus dos
       botones de crear y es literalmente por donde se empieza a armar una empresa. */
    window.location.href = '/organizacion/organigrama'
  }, [])

  const loadSampleData = useCallback(() => {
    setRecursos(sampleRecursos)
    setPlantillas(samplePlantillas)
    setAsignaciones(sampleAsignaciones)
    setFeed(sampleFeed)
    setConfigToggles(sampleConfig)
    setOrganigrama(orgSeed)
    /* La estructura también, y con los tres niveles que la conversión no podía dar: regionales,
       sucursales y depósitos. Sin esto, cargar el ejemplo llenaba el organigrama y dejaba
       Distribución física con una sola casa matriz, que es justo la mitad que hay que ver.

       Y CON LOS CARGOS DEL ORGANIGRAMA, que es lo que faltaba del otro lado: se sembraban las
       áreas y no las plazas, así que Estructura organizacional abría con sus unidades y las
       pestañas Cargos y Puestos en cero mientras el organigrama de al lado dibujaba cuarenta
       sillas. Los mismos cargos, repartidos en catálogo y sillas por la conversión de siempre. */
    const ejemplo = estructuraEjemplo(sucursalesSeed, orgSeed.unidades, orgSeed.cargos)
    setNodos(ejemplo)
    setNivelesEstructura(nivelesDeSemilla(ejemplo))
  }, [setRecursos, setPlantillas, setAsignaciones, setFeed, setConfigToggles, setOrganigrama, setNodos, setNivelesEstructura])

  const totalDocs = recursos.reduce((s, c) => s + c.docs.length, 0)
  const isDemoFresh = totalDocs === 0 && plantillas.length === 0 && asignaciones.length === 0

  /* `?demo=1` siembra los datos de ejemplo al abrir, si no hay nada cargado. La app arranca
     vacía a propósito —se quiere poder construirla desde cero— pero para mirar una pantalla
     con contenido había que entrar y recorrer el menú hasta el botón de "cargar ejemplo" cada
     vez. Con el parámetro se llega directo, que es lo que hace falta al revisar un cambio o al
     mostrarle el prototipo a alguien.

     Solo siembra si está vacío: sobre datos ya cargados no pisa nada. */
  useEffect(() => {
    if (!isDemoFresh) return
    if (!new URLSearchParams(window.location.search).has('demo')) return
    loadSampleData()
  }, [isDemoFresh, loadSampleData])

  return (
    <OnboardingDataContext.Provider value={{
      recursos, setRecursos,
      recursosPersonas, setRecursosPersonas,
      recursosComunicacion, setRecursosComunicacion,
      recursosEvaluacion, setRecursosEvaluacion,
      plantillas, setPlantillas,
      asignaciones, setAsignaciones,
      feed, addFeedEntry,
      configToggles, setConfigToggles,
      organigrama, setOrganigrama,
      empresa, setEmpresa,
      nodos, setNodos,
      nivelesEstructura: nivelesSanos, setNivelesEstructura,
      sucursales, setSucursales,
      resetDemo, loadSampleData, isDemoFresh,
    }}>
      {children}
    </OnboardingDataContext.Provider>
  )
}

export function useOnboardingData() {
  return useContext(OnboardingDataContext)
}
