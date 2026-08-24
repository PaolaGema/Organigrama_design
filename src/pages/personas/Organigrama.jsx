import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  Download, Network, LayoutGrid, Table2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  X, Building2, UploadCloud, FileSpreadsheet, Check, User, Search, Pencil, Star, Users,
  Minus, Plus, ArrowUp, Briefcase, MapPin, Trash2, FolderPlus, Printer, Image, FileCode2,
  ClipboardList, Share2,
} from 'lucide-react'
import OrgGrafico from '../../components/personas/OrgGrafico'
import CabeceraModal from '../../components/personas/CabeceraModal'
import PreviaPuesto from '../../components/personas/PreviaPuesto'
import PreviaUnidad from '../../components/personas/PreviaUnidad'
import AyudaCampo from '../../components/personas/AyudaCampo'
import SelectorLista from '../../components/personas/SelectorLista'
import Avatar from '../../components/personas/Avatar'
import { exportarPNG, exportarSVG, imprimir } from '../../components/personas/exportarOrganigrama'
import { colaboradoresData } from './colaboradoresData'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import {
  empresa, sucursales, getUnidad, nuevoId, tipoDe, TIPOS_CARGO,
  buildOrgTree, filasTabla, buscarCargos, unidadesRaiz, subunidadesDe,
  tarjetaUnidad, cargosDeUnidad, filtrarPorSucursal, TODAS_SUCURSALES, estaEnSucursal,
  eliminarCargo, eliminarUnidad, bloqueoUnidad, unidadesPadrePosibles, cabezaDe, paresDe, moverEntrePares,
  filtrarPorUnidad, cargosEnRama, TODAS_UNIDADES,
  ocupantesDe, plazasDe, rotuloVacantes, esTipoDeclarado, funcionalesDe, areasQueApoya, apoyosDeUnidad, cargoDe, areaDe,
  coordinacionesDe,
} from '../../data/organigramaData'

/* Lo visual de cada tipo. Los textos viven en `TIPOS_CARGO` (el modelo) y aquí solo se les
   suma ícono y clase: antes había dos mapas de etiquetas —uno en las cards, otro en la
   tabla— y ninguno conocía Outsourcing, así que los cargos externos se mostraban como
   colaboradores comunes. */
/* `propio` = el tipo tiñe la tarjeta con su propio color. Es lo que decide que el amarillo de
   vacante no le pase por encima: un servicio tercerizado sin prestador se sigue viendo violeta
   y lo que avisa de la vacante es la etiqueta. */
const PINTA_TIPO = {
  colaborador: { clase: 'colab', Icon: User },
  jefe: { clase: 'jefe', Icon: Star },
  staff: { clase: 'staff', Icon: Users, propio: true },
  outsourcing: { clase: 'ext', Icon: Briefcase, propio: true },
}

const tipoVisual = tipo => {
  const base = TIPOS_CARGO.find(t => t.key === tipo) || TIPOS_CARGO[0]
  return { ...base, ...PINTA_TIPO[base.key] }
}

/* Lo que sí se elige del tipo de puesto. Jefe queda fuera a propósito: `tipoDe` lo deduce de
   tener gente a cargo, así que ofrecerlo en el formulario sería una opción que al guardar no
   cambia nada. Los subtítulos hablan en el idioma del contrato —planilla, servicios,
   prestador de servicios— porque es como lo nombra RRHH al dar de alta. */
const TIPOS_PUESTO = [
  { key: 'colaborador', label: 'Colaborador', sub: 'En planilla, baja en la línea', Icon: User },
  { key: 'staff', label: 'Staff', sub: 'Asiste al costado de la línea', Icon: Users },
  { key: 'outsourcing', label: 'Outsourcing', sub: 'Lo cubre un prestador externo', Icon: Briefcase },
]

/* El formulario del puesto va en pestañas, como en el diseño: son cuatro preguntas de
   naturaleza distinta y verlas todas de una vez es lo que lo hacía pesado. Solo hay pestañas
   para lo que el modelo sabe contestar: "Perfil" y "Laboral" del diseño quedan fuera hasta
   que exista el dato detrás, porque una pestaña vacía promete algo que no está. */
const PESTANAS_CARGO = [
  { key: 'basico', label: 'Básico', Icon: ClipboardList },
  { key: 'jerarquia', label: 'Jerarquía', Icon: Network },
  { key: 'funcional', label: 'Funcional', Icon: Share2 },
  { key: 'donde', label: 'Localización', Icon: MapPin },
  { key: 'gente', label: 'Colaboradores', Icon: Users },
]

/* Tope de plazas de un puesto. No hay regla de negocio detrás: es el freno para que un dedo
   apoyado en el "+" no deje un cuadro con seiscientas vacantes. */
const PLAZAS_MAX = 99

const VISTAS = [
  { key: 'grafico', label: 'Gráfico', icon: Network },
  { key: 'cards', label: 'Cards', icon: LayoutGrid },
  { key: 'tabla', label: 'Tabla', icon: Table2 },
]

/* Colores de marca sugeridos. Son de arranque: al lado hay un selector libre, porque ninguna
   paleta de diez adivina el azul exacto de una empresa. */
const COLORES_MARCA = [
  '#0C2D40', '#1e3a8a', '#0f766e', '#166534', '#7c2d12',
  '#831843', '#4c1d95', '#334155', '#b45309', '#991b1b',
]

function Buscador({ value, onChange }) {
  return (
    <div className="og-buscador">
      <Search size={14} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar en todo el organigrama"
      />
      {value && <button onClick={() => onChange('')} title="Limpiar"><X size={13} /></button>}
    </div>
  )
}

/* ---------- Modal: alta y detalle de un cargo ---------- */

/* `base` son los valores que el gesto ya decidió: al soltar una cajita sobre un cuadro, de
   quién depende y en qué unidad queda ya están dichos, y volver a preguntarlos sería deshacer
   con el formulario lo que se acaba de hacer con la mano. */
function CargoModal({ cargo, base, sedeActiva, onGuardar, onEliminar, onCerrar, org }) {
  const nuevo = !cargo
  /* Lo que había al abrir. Sirve para saber si se escribió algo y no cerrar el formulario de un
     clic al costado: perder seis campos por errarle al modal por veinte píxeles no es un
     accidente del usuario, es un descuido del diseño. */
  const inicial = useRef(null)
  const [hoja, setHoja] = useState('basico')
  const [form, setForm] = useState(() => ({
    codigo: cargo?.codigo || '',
    nombre: cargo?.nombre || '',
    /* Los valores por defecto salen de la estructura que hay, no de ids sembrados: en un
       organigrama recién empezado no existe ni 'gg' ni una unidad en la segunda posición. */
    unidadId: cargo?.unidadId || base?.unidadId || org.unidades[0]?.id || '',
    reportaA: cargo ? cargo.reportaA
      : base && 'reportaA' in base ? base.reportaA
      : (org.cargos[0]?.id ?? null),
    ocupantes: cargo ? ocupantesDe(cargo) : [],
    /* Cuánta gente cabe. Uno es el caso normal, así que el puesto nuevo nace con una plaza y
       quien necesita cinco lo dice; al revés —preguntar siempre cuántas— le cobra el campo a
       los cientos de puestos que tienen una sola. */
    plazas: cargo ? plazasDe(cargo) : 1,
    /* Áreas donde trabaja sin pertenecer. Al cambiar de área propia hay que sacarla de acá si
       estaba marcada, o el puesto quedaría apoyándose a sí mismo. */
    funcionales: cargo ? funcionalesDe(cargo).map(f => ({ ...f })) : [],
    /* El tipo que se muestra es el que ve el resto de la pantalla: para un cargo con gente
       debajo, `tipoDe` devuelve 'jefe' aunque el cargo no lo declare. */
    tipo: cargo ? tipoDe(cargo, org) : (base?.tipo || 'colaborador'),
    /* Si se está mirando una sede concreta, el puesto nuevo nace en esa sede y no en todas. Es
       la respuesta a "¿para qué sucursal estoy creando?": para la que se está viendo, y el
       formulario lo deja dicho y modificable en vez de suponerlo en silencio.

       Sin sede activa nace con la lista VACÍA y no con las sedes enumeradas: las dos se ven
       igual hoy, pero la lista vacía quiere decir "en todas" y sigue valiendo cuando mañana se
       abra la novena; enumerarlas dejaría al puesto fuera de esa. */
    sucursalIds: cargo?.sucursalIds || (sedeActiva ? [sedeActiva.id] : []),
    /* El lugar que ocupa entre los cargos que se dibujan en su misma fila. No es un campo del
       cargo —el orden es el de la lista— pero se edita acá y se guarda con el resto: mover un
       cuadro y que el cambio quede a medias entre "ya pasó" y "hay que guardar" sería la peor
       de las dos cosas. */
    posicion: cargo ? paresDe(cargo, org).findIndex(c => c.id === cargo.id) : -1,
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  /* Cambia una sola fila de la lista funcional dejando las demás como están. */
  const setFuncional = (i, cambios) => setForm(f => ({
    ...f,
    funcionales: f.funcionales.map((x, j) => (j === i ? { ...x, ...cambios } : x)),
  }))
  const alternarSede = id => setForm(f => {
    const siguiente = f.sucursalIds.includes(id)
      ? f.sucursalIds.filter(x => x !== id)
      : [...f.sucursalIds, id]
    /* Marcarlas todas una por una es decir "todas", y así se guarda: con la lista enumerada, una
       sede que se abra mañana nacería fuera de este puesto. */
    return { ...f, sucursalIds: siguiente.length === sucursales.length ? [] : siguiente }
  })

  /* "En todas" no es un modo aparte sino un valor: ninguna sede declarada. Así lo lee el resto
     del sistema (`estaEnSucursal`) y así se guarda, que además es lo correcto a futuro —una
     sede nueva entra sola en los puestos que existen en todas, y no en los que enumeran tres—. */
  const [buscaSede, setBuscaSede] = useState('')
  /* Con 50 sedes y 3 marcadas, repasar lo elegido obliga a recorrer las 50: lo marcado queda
     repartido entre lo que no. Este modo muestra solo eso. Se ofrece únicamente cuando la lista
     no entra de un vistazo —con tres sedes no hay nada que repasar— y cuando hay algo marcado
     que no sea "todas", que ya se lee en una línea. */
  const [soloSedesMarcadas, setSoloSedesMarcadas] = useState(false)
  const sedesFiltradas = sucursales
    .filter(s => `${s.nombre} ${s.ciudad}`.toLowerCase().includes(buscaSede.trim().toLowerCase()))
    .filter(s => !soloSedesMarcadas || form.sucursalIds.includes(s.id))
  const enTodasLasSedes = form.sucursalIds.length === 0
  /* Cuántos puestos existen ya en cada sede. El que se está editando no se cuenta: la pregunta
     es qué hay allá, no qué va a haber cuando se guarde. Sale de `estaEnSucursal`, que es la
     misma regla que usa el filtro de la pantalla —contarlos a mano acá sería una segunda
     verdad que se despega de la primera en cuanto una cambie. */
  const puestosPorSede = useMemo(() => Object.fromEntries(sucursales.map(sc => [
    sc.id,
    org.cargos.filter(c => c.id !== cargo?.id && estaEnSucursal(c, sc.id)).length,
  ])), [org.cargos, cargo?.id])

  const [buscaPersona, setBuscaPersona] = useState('')
  const [soloPersonasMarcadas, setSoloPersonasMarcadas] = useState(false)
  /* Qué puesto ocupa hoy cada persona en el organigrama, sin contar este. Es lo que hay que
     saber antes de marcarla: el directorio dice qué cargo TIENE, y esto dice qué cuadro del
     dibujo ya está ocupando —que no siempre coinciden—. */
  const puestoDePersona = useMemo(() => {
    const m = {}
    for (const c of org.cargos) {
      if (c.id === cargo?.id) continue
      for (const pid of ocupantesDe(c)) if (!(pid in m)) m[pid] = c.nombre
    }
    return m
  }, [org.cargos, cargo?.id])

  /* La lista muestra a los LIBRES. Quien ya ocupa otro cuadro no se puede asignar acá —nadie
     tiene dos cargos en la misma empresa— así que su renglón era una fila apagada que no
     respondía al clic: ocupaba la lista sin ser una opción, y en un directorio de doscientos
     dejaba a los asignables perdidos entre gente que no lo era.

     No desaparecen del todo: se piden con un botón y el buscador avisa cuando lo que se está
     buscando está entre ellos. Ese era el motivo por el que antes se mostraban siempre —que
     nadie quede buscando a alguien que sí está en el directorio— y sigue cubierto.

     Ojo: `puestoDePersona` no cuenta ESTE cargo, así que quienes ya lo ocupan siguen contando
     como libres y no se esconden al abrir el detalle de un puesto con gente. */
  const [verOcupados, setVerOcupados] = useState(false)
  const { libres, ocupados } = useMemo(() => {
    const t = buscaPersona.trim().toLowerCase()
    const coinciden = colaboradoresData.filter(pe => (
      /* Se busca por lo que la fila MUESTRA. Buscar por el `depto` del directorio encontraría
         gente por un área que la fila no dice, y que además puede no ser la suya. */
      !t || `${pe.name} ${areaDe(pe, org) || ''} ${cargoDe(pe, org) || ''}`.toLowerCase().includes(t)
    ))
    const vistas = soloPersonasMarcadas ? coinciden.filter(pe => form.ocupantes.includes(pe.id)) : coinciden
    return {
      libres: vistas.filter(pe => !puestoDePersona[pe.id]),
      ocupados: vistas.filter(pe => puestoDePersona[pe.id]),
    }
  }, [buscaPersona, puestoDePersona, org, soloPersonasMarcadas, form.ocupantes])
  const personasFiltradas = verOcupados ? [...libres, ...ocupados] : libres
  const plazasLibres = Math.max(0, form.plazas - form.ocupantes.length)
  const puestoLleno = plazasLibres === 0

  const coordinaciones = cargo ? coordinacionesDe(cargo.id, org) : []
  const ocupantes = form.ocupantes
    .map(id => colaboradoresData.find(pe => pe.id === id))
    .filter(Boolean)
  const t = tipoVisual(form.tipo)
  const externo = form.tipo === 'outsourcing'
  /* Los dos obligatorios quedaron en pestañas distintas, así que no alcanza con saber que
     falta algo: hay que saber en cuál. */
  const faltaEn = { basico: !form.nombre.trim(), jerarquia: !form.unidadId }
  const valido = !faltaEn.basico && !faltaEn.jerarquia

  /* Solo se guarda lo que no se puede deducir: Jefe y Colaborador salen de la propia
     estructura, así que declararlos sería dejar en el dato una etiqueta que se contradice
     sola en cuanto alguien mueve un cargo de lugar. */
  /* El clic en el fondo cierra solo si no se tocó nada. Es el punto medio entre cerrarse de
     un roce —y perder lo escrito— y obligar a apuntarle a la X aunque el formulario esté
     intacto. */
  if (inicial.current === null) inicial.current = JSON.stringify(form)
  const sucio = JSON.stringify(form) !== inicial.current
  const intentarCerrar = () => { if (!sucio) onCerrar() }

  /* Reordenar solo tiene sentido mientras el cargo siga entre los mismos pares: si en esta
     misma edición se le cambió el jefe o dejó de ser lateral, la fila donde estaba ya no es la
     suya y "3.º de 5" hablaría de un lugar que no existe. */
  const pares = cargo ? paresDe(cargo, org) : []
  const mismaFila = !nuevo
    && form.reportaA === cargo.reportaA
    && t.lateral === (cargo.tipo === 'staff')

  const guardar = () => onGuardar({
    codigo: form.codigo.trim() || null,
    nombre: form.nombre.trim(),
    unidadId: form.unidadId,
    reportaA: form.reportaA,
    ocupantes: form.ocupantes,
    /* Nunca por debajo de la gente que ya está adentro: bajar el cupo no puede echar a nadie. */
    plazas: Math.max(form.plazas, form.ocupantes.length),
    /* Se descartan las filas a medio llenar y la propia área: una asignación sin área no dice
       nada, y apoyarse a uno mismo tampoco. */
    funcionales: form.funcionales.filter(f => f.unidadId && f.unidadId !== form.unidadId),
    /* El campo viejo se limpia para que no queden dos verdades sobre quién ocupa el puesto. */
    ocupanteId: null,
    /* Se guarda el tipo solo cuando no se puede deducir: Staff y Outsourcing hay que
       declararlos; Jefe y Colaborador salen de tener o no gente a cargo. Ya no se pregunta por
       la lateralidad —el outsourcing dejó de ser lateral y así se perdía su tipo al guardar—. */
    tipo: esTipoDeclarado(form.tipo) ? form.tipo : null,
    sucursalIds: form.sucursalIds,
  }, mismaFila ? form.posicion : null)

  return (
    <div className="pl-overlay" onClick={intentarCerrar}>
      <div className="pl-modal og-modal-puesto" onClick={e => e.stopPropagation()}>
        <CabeceraModal
          Icon={nuevo ? Plus : User}
          titulo={nuevo ? 'Nuevo cargo / puesto' : 'Detalle del cargo / puesto'}
          onCerrar={onCerrar}
        />

        {/* Dos columnas: el dibujo a la izquierda y los campos a la derecha, cada una con su
            propio scroll. El dibujo no se va de la pantalla al bajar hasta el ocupante —que es
            justo cuando cambia— ni empuja los campos hacia abajo. */}
        <div className="og-puesto-cuerpo">
          <PreviaPuesto
            form={form}
            org={org}
            cargoId={cargo?.id}
            ocupantes={ocupantes}
            nuevo={nuevo}
          />

          <div className="og-hojas-col">
            <div className="og-hojas">
              {PESTANAS_CARGO.map(h => (
                <button
                  key={h.key}
                  type="button"
                  className={`og-hoja${hoja === h.key ? ' on' : ''}`}
                  onClick={() => setHoja(h.key)}
                >
                  <h.Icon size={13} /> {h.label}
                  {/* El punto avisa dónde falta algo obligatorio: sin esto, con el botón de
                      guardar apagado y la pestaña equivocada abierta, no hay forma de saber
                      qué falta. */}
                  {faltaEn[h.key] && <span className="og-hoja-falta" />}
                </button>
              ))}
            </div>

          <div className="pl-modal-body og-cargo-campos">
            {hoja === 'basico' && (
            <section className="og-bloque">

              <label className="pl-label">
                <span className="og-label-fila">
                  Código
                  <AyudaCampo>
                    El identificador del puesto en planilla o en los reportes de RRHH. Es
                    opcional: si la empresa no los usa, se deja vacío.
                  </AyudaCampo>
                </span>
                <input
                  className="pl-input"
                  value={form.codigo}
                  maxLength={20}
                  onChange={e => set('codigo', e.target.value)}
                  placeholder="Ej. CAR-001"
                />
              </label>

              <label className="pl-label">
                <span className="og-label-fila">
                  Nombre del cargo / puesto <em className="og-req">*</em>
                  <AyudaCampo>El título del cargo, no el nombre de quien lo ocupa.</AyudaCampo>
                  <span className="og-contador">{form.nombre.length}/60</span>
                </span>
                <input
                  className="pl-input"
                  value={form.nombre}
                  maxLength={60}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej. Analista de Marketing Digital"
                  autoFocus={nuevo}
                />
              </label>

              {/* El cupo, en su propio renglón y no al lado del nombre. Se probó en la misma
                  fila y confundía: un texto de sesenta caracteres y un número de un dígito
                  tienen pesos muy distintos, así que las dos etiquetas se leían como una sola
                  —"Nombre del cargo / puesto … Plazas"— y el escalón parecía un accesorio del
                  input. Abajo, con su renglón entero, se lee como lo que es: otra decisión
                  sobre el puesto.

                  Sigue en Básico y no en Colaboradores porque cuántas personas caben es parte
                  de la DEFINICIÓN del puesto, no de a quién se le asigna: en uno nuevo el cupo
                  se fija antes de tener a nadie. */}
              {/* La pregunta en el idioma de quien la contesta. "Plazas del puesto" es como lo
                  nombra RRHH en su planilla, no como lo piensa quien está armando el
                  organigrama: la duda real es cuánta gente hace el mismo trabajo. La palabra
                  "plaza" queda solo en la ayuda, que es donde se puede explicar. */}
              <div className="pl-label">
                <span className="og-label-fila">
                  ¿Cuántas personas ocupan este puesto?
                  <AyudaCampo>
                    Cuando varias personas hacen exactamente el mismo trabajo, es{' '}
                    <strong>un</strong> puesto con varias plazas y no un cuadro repetido por
                    cada una: cuatro ejecutivas comerciales son un cuadro con cuatro. Se
                    renombra una vez, se define una vez, y las plazas sin cubrir se cuentan
                    solas como vacantes.
                  </AyudaCampo>
                </span>

                <div className="og-cupo">
                  {/* No baja de la gente que ya está adentro: quitar una plaza no puede echar
                      a nadie. */}
                  <button
                    type="button"
                    disabled={form.plazas <= Math.max(1, form.ocupantes.length)}
                    onClick={() => set('plazas', form.plazas - 1)}
                    title="Una menos"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="og-cupo-val">
                    <strong>{form.plazas}</strong> {form.plazas === 1 ? 'persona' : 'personas'}
                  </span>
                  <button
                    type="button"
                    disabled={form.plazas >= PLAZAS_MAX}
                    onClick={() => set('plazas', form.plazas + 1)}
                    title="Una más"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Con una sola persona no hay nada que aclarar: el cuadro es un cuadro y lo
                    demás lo dice la pestaña Colaboradores. El renglón aparecía igual y decía
                    "0 de 1 cubiertas · Vacante", que es la misma cosa dicha dos veces. */}
                {form.plazas > 1 && (
                  <p className="og-modal-nota">
                    Va a salir <strong>un solo cuadro</strong> con {form.plazas} casillas:{' '}
                    {form.ocupantes.length > 0
                      ? <>{form.ocupantes.length} con nombre</>
                      : <>ninguna con nombre</>}
                    {plazasLibres > 0 && <> y {plazasLibres} por cubrir</>}.{' '}
                    {plazasLibres > 0 && (
                      <button type="button" className="og-solo" onClick={() => setHoja('gente')}>
                        Elegir a quiénes
                      </button>
                    )}
                  </p>
                )}
              </div>

            </section>
            )}

            {hoja === 'jerarquia' && (
            <section className="og-bloque">

              <label className="pl-label">
                <span className="og-label-fila">
                  Unidad organizacional <em className="og-req">*</em>
                  <AyudaCampo>Área, gerencia o departamento al que pertenece el puesto.</AyudaCampo>
                </span>
                <SelectorLista
                  valor={form.unidadId}
                  onCambio={v => set('unidadId', v)}
                  placeholder="Elige la unidad"
                  opciones={org.unidades.map(u => ({
                    id: u.id,
                    nombre: u.nombre,
                    detalle: getUnidad(u.padreId, org)?.nombre,
                  }))}
                />
                {/* Igual que con la sede: si el área vino puesta por el alcance que se está
                    mirando, se dice acá en vez de suponerlo. Un puesto creado fuera del área
                    filtrada se guardaría bien y desaparecería del dibujo en el mismo instante. */}
                {nuevo && base?.unidadId && base.unidadId === form.unidadId && (
                  <p className="og-modal-nota">
                    Viene elegida <strong>{getUnidad(base.unidadId, org)?.nombre}</strong> porque
                    es el área que estás viendo.
                  </p>
                )}
              </label>

              <label className="pl-label">
                <span className="og-label-fila">
                  Reporta a
                  <AyudaCampo>El cargo al que le responde este puesto. De acá sale la línea de mando: quién aprueba y a quién le llega la bandeja.</AyudaCampo>
                </span>
                <SelectorLista
                  valor={form.reportaA}
                  onCambio={v => set('reportaA', v)}
                  vacia="Sin jefe: queda como raíz"
                  opciones={org.cargos.filter(c => c.id !== cargo?.id).map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    detalle: getUnidad(c.unidadId, org)?.nombre,
                  }))}
                />
              </label>

              {/* Dónde queda dentro de su fila. Es lo único del dibujo que se puede acomodar a
                  mano, y por eso vive acá y no en un gesto del lienzo: no es una posición
                  libre, es el orden entre iguales, que sí significa algo. */}
              {mismaFila && pares.length > 1 && (
                <div className="pl-label">
                  <span className="og-label-fila">
                    Orden entre sus pares
                    <AyudaCampo>
                      Mueve el cuadro dentro de su propia fila, sin cambiar de quién depende.
                      {t.lateral
                        ? ' En los laterales el orden decide de qué lado del jefe cae cada uno.'
                        : ' Entre los reportes de un mismo jefe, quién va antes y quién después.'}
                    </AyudaCampo>
                  </span>
                  <div className="og-orden">
                    <button
                      type="button"
                      disabled={form.posicion <= 0}
                      onClick={() => set('posicion', form.posicion - 1)}
                      title="Un lugar antes"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="og-orden-txt">
                      <strong>{form.posicion + 1}.º</strong> de {pares.length}
                    </span>
                    <button
                      type="button"
                      disabled={form.posicion >= pares.length - 1}
                      onClick={() => set('posicion', form.posicion + 1)}
                      title="Un lugar después"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tres tarjetas y no un desplegable: son tres cosas distintas —una en planilla,
                  una al costado de la línea, una que presta un tercero— y en un `select` se leen
                  como tres palabras hasta que alguien las abre una por una. Jefe no está entre
                  ellas a propósito: no se elige, se deduce de tener gente a cargo, y ofrecerlo
                  sería una opción que no hace nada al guardar. */}
              <div className="pl-label">
                <span className="og-label-fila">Tipo de cargo / puesto <em className="og-req">*</em></span>
                <div className="og-tipo-cards">
                  {TIPOS_PUESTO.map(o => {
                    const activa = o.key === form.tipo || (o.key === 'colaborador' && form.tipo === 'jefe')
                    return (
                      <button
                        key={o.key}
                        type="button"
                        className={`og-tipo-card og-tipo-card-${o.key}${activa ? ' on' : ''}`}
                        onClick={() => set('tipo', o.key)}
                      >
                        <span className="og-tipo-card-hd">
                          <o.Icon size={12} /> {o.label}
                          {/* La muestra dice de qué color va a salir el cuadro ANTES de
                              marcarlo, con los mismos colores de la leyenda del dibujo. */}
                          <span className={`og-tipo-muestra og-tipo-muestra-${o.key}`} />
                        </span>
                        <em>{o.sub}</em>
                      </button>
                    )
                  })}
                </div>
                {form.tipo === 'jefe' && (
                  <p className="og-modal-nota">
                    Ya tiene gente a cargo, así que en el organigrama figura como <strong>Jefe</strong>.
                    Es lo mismo que un puesto interno: la jefatura se deduce sola.
                  </p>
                )}
              </div>
            </section>
            )}

            {/* FUNCIONAL: dónde más trabaja este puesto. Tiene pestaña propia porque no es un
                campo sino una LISTA, y cada fila lleva dos respuestas —en qué área y a quién le
                responde ahí—. Metida en Jerarquía competía con la línea de mando de verdad, que
                es la que casi siempre se viene a mirar. */}
            {hoja === 'funcional' && (
            <section className="og-bloque">
              <p className="og-modal-nota og-nota-suelta">
                Un puesto <strong>pertenece</strong> a un área —la de Jerarquía— y puede{' '}
                <strong>trabajar</strong> en otras. En cada área que apoya se dibuja como un
                cuadro más, en azul, y sigue siendo el mismo puesto: no se cuenta dos veces.
              </p>

              {form.funcionales.length === 0 ? (
                <div className="og-func-vacio">
                  <Network size={20} />
                  <strong>Solo trabaja en su área</strong>
                  <span>Agrega un área si este puesto también apoya a otra.</span>
                </div>
              ) : (
                <div className="og-func-lista">
                  {form.funcionales.map((f, i) => {
                    /* El jefe funcional se elige entre los cargos DEL ÁREA que se apoya: es
                       quien le dirige el trabajo ahí. Ofrecer el organigrama entero convertiría
                       el campo en una segunda línea de mando sin relación con el área. */
                    const deEsaArea = org.cargos.filter(c => c.unidadId === f.unidadId && c.id !== cargo?.id)
                    return (
                      <div key={i} className="og-func-fila">
                        <div className="pl-label">
                          <span className="og-label-fila">Área donde apoya <em className="og-req">*</em></span>
                          <SelectorLista
                            valor={f.unidadId}
                            onCambio={v => setFuncional(i, { unidadId: v, reportaA: null })}
                            placeholder="Elige el área"
                            /* Fuera la suya y las que ya están en la lista: repetir un área no
                               agrega nada y deja dos filas diciendo lo mismo. */
                            opciones={org.unidades
                              .filter(u => u.id !== form.unidadId)
                              .filter(u => u.id === f.unidadId || !form.funcionales.some(x => x.unidadId === u.id))
                              .map(u => ({ id: u.id, nombre: u.nombre, detalle: getUnidad(u.padreId, org)?.nombre }))}
                          />
                        </div>

                        <div className="pl-label">
                          <span className="og-label-fila">
                            Le responde a
                            <AyudaCampo>
                              Quién le dirige el trabajo dentro de esa área. Es opcional: se
                              puede apoyar a un área sin tener un jefe ahí, y entonces el cuadro
                              cuelga del área. No reemplaza a su jefe de verdad, que es el de
                              la pestaña <strong>Jerarquía</strong>.
                            </AyudaCampo>
                          </span>
                          <SelectorLista
                            valor={f.reportaA}
                            onCambio={v => setFuncional(i, { reportaA: v })}
                            vacia="Nadie: cuelga del área"
                            placeholder={f.unidadId ? 'Nadie: cuelga del área' : 'Elige primero el área'}
                            opciones={deEsaArea.map(c => ({ id: c.id, nombre: c.nombre }))}
                          />
                        </div>

                        <button
                          type="button"
                          className="og-func-quitar"
                          title="Quitar esta área"
                          onClick={() => set('funcionales', form.funcionales.filter((_, j) => j !== i))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Solo si queda alguna por elegir: un botón que abre una fila sin opciones es
                  una fila que hay que borrar a mano. */}
              {org.unidades.filter(u => u.id !== form.unidadId && !form.funcionales.some(x => x.unidadId === u.id)).length > 0 && (
                <button
                  type="button"
                  className="og-func-agregar"
                  onClick={() => set('funcionales', [...form.funcionales, { unidadId: '', reportaA: null }])}
                >
                  <Plus size={14} /> Agregar un área
                </button>
              )}
            </section>
            )}

            {hoja === 'donde' && (
            <section className="og-bloque">

                {/* Un puesto puede existir en varias sedes a la vez —una gerencia regional es UN
                  cargo con dos sedes, no dos cuadros repetidos—, así que se marcan varias.

                  Un solo campo y no dos pestañas. Antes se contestaba primero "¿en todas?" y
                  recién ahí aparecía la lista: tres controles apilados —pestañas, cuenta,
                  desplegable— para una pregunta que se contesta con uno. "Todas las sedes" es la
                  primera opción de la misma lista, que además es lo que significa en el dato:
                  ninguna declarada = está en todas, incluidas las que se abran después. */}
              <div className="pl-label">
                <span className="og-label-fila">
                  Sedes donde existe el cargo / puesto
                  <AyudaCampo>
                    El organigrama es uno solo: lo que cambia por sede es en cuáles existe cada
                    puesto. Una gerencia regional es <strong>un</strong> cargo con dos sedes, no
                    dos cuadros repetidos.
                  </AyudaCampo>
                  <span className="og-contador">
                    {enTodasLasSedes
                      ? `Las ${sucursales.length}`
                      : `${form.sucursalIds.length} de ${sucursales.length}`}
                  </span>
                  {!enTodasLasSedes && form.sucursalIds.length > 0 && (
                    <button type="button" className="og-solo" onClick={() => setSoloSedesMarcadas(v => !v)}>
                      {soloSedesMarcadas ? 'Ver todas' : 'Ver solo las marcadas'}
                    </button>
                  )}
                </span>

                {/* Sin desplegable: la pestaña tiene una columna entera libre y las sedes son
                    pocas, así que se marcan a la vista en vez de esconderlas detrás de un clic.
                    La reja scrollea y no crece: una empresa con cuarenta sucursales no puede
                    estirar el modal. */}
                {/* "Todas" no es una sede más sino la regla que las abarca: va arriba y separada
                    por una línea, no como una cuarta fila de la lista. */}
                <button
                  type="button"
                  className={`og-fila-op og-fila-op-cabeza${enTodasLasSedes ? ' on' : ''}`}
                  onClick={() => set('sucursalIds', [])}
                >
                  <span className="og-op-box">{enTodasLasSedes && <Check size={12} />}</span>
                  <span className="og-op-txt">
                    <strong>Todas las sedes</strong>
                    <em>Incluye las que se abran más adelante</em>
                  </span>
                </button>

                <div className="pl-search-wrap og-lista-buscar">
                  <Search size={13} className="pl-search-ico" />
                  <input
                    className="pl-search"
                    value={buscaSede}
                    onChange={e => setBuscaSede(e.target.value)}
                    placeholder="Buscar por sede"
                  />
                </div>

                <div className="og-lista-op">
                  {sedesFiltradas.map(sc => {
                    /* Cubierta = la abarca "Todas las sedes", no fue elegida. Se dibuja apagada
                       y sin tilde para que las dos respuestas no se vean iguales: marcar las
                       ocho a mano deja fuera a la novena, y "todas" no.
                       Sigue respondiendo al clic a propósito: es la única salida del modo, ya
                       que "todas" se guarda como lista vacía y destildarla no significa nada. */
                    const cubierta = enTodasLasSedes
                    const marcada = !cubierta && form.sucursalIds.includes(sc.id)
                    const cuantos = puestosPorSede[sc.id] || 0
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        className={`og-fila-op${marcada ? ' on' : ''}${cubierta ? ' og-fila-op-cubierta' : ''}`}
                        title={cubierta
                          ? `Ya está incluida por "Todas las sedes". Al tocarla, el puesto pasa a existir solo en ${sc.ciudad}.`
                          : undefined}
                        onClick={() => (cubierta ? set('sucursalIds', [sc.id]) : alternarSede(sc.id))}
                      >
                        <span className="og-op-box">{marcada && <Check size={12} />}</span>
                        {/* La ciudad manda y el nombre va debajo: dos sedes se llaman
                            "Sucursal" y lo único que las distingue es dónde están. Es además
                            como las nombra el resto del producto —"Existe en Santa Cruz, La
                            Paz"— y como se leen en la barra de la pantalla. */}
                        <span className="og-op-txt">
                          <strong>{sc.ciudad}</strong>
                          <em>{sc.nombre}</em>
                        </span>
                        {/* Cuántos puestos hay ya allá. Es la única pista que ayuda a decidir
                            si este cargo va o no: una sede con dos puestos y una con cuarenta
                            no son la misma decisión. */}
                        <span className="og-op-extra">
                          {cuantos === 0 ? 'Sin puestos' : `${cuantos} puesto${cuantos === 1 ? '' : 's'}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {sedesFiltradas.length === 0 && (
                  <p className="og-sedes-vacio">Ninguna sede coincide con “{buscaSede.trim()}”.</p>
                )}

                {nuevo && sedeActiva && form.sucursalIds.length === 1
                  && form.sucursalIds[0] === sedeActiva.id && (
                  <p className="og-modal-nota">
                    Viene elegida <strong>{sedeActiva.ciudad}</strong> porque es la sede que estás viendo.
                  </p>
                )}
              </div>
            </section>

            )}

            {hoja === 'gente' && (
            <section className="og-bloque">

              <div className="pl-label">
                <span className="og-label-fila">
                  Quiénes lo ocupan
                  <AyudaCampo>
                    Se pueden marcar <strong>varias personas</strong> en un mismo puesto: tres
                    ejecutivas comerciales son un cargo con tres ocupantes, no tres cuadros. Sin
                    nadie, el puesto sale como vacante en el dibujo.
                  </AyudaCampo>
                  <span className="og-contador">
                    {form.ocupantes.length} de {form.plazas}
                  </span>
                  {form.ocupantes.length > 0 && (
                    <button type="button" className="og-solo" onClick={() => setSoloPersonasMarcadas(v => !v)}>
                      {soloPersonasMarcadas ? 'Ver todos' : 'Ver solo los marcados'}
                    </button>
                  )}
                </span>
                {/* Por qué las filas dejaron de responder. El cupo se fija en Básico, así que
                    acá se explica y se ofrece el camino de vuelta: sin esto, quedan veinte
                    casillas apagadas sin ningún motivo a la vista. */}
                {puestoLleno && form.ocupantes.length > 0 && (
                  <p className="og-modal-nota">
                    El puesto está completo: {form.plazas} de {form.plazas}{' '}
                    {form.plazas === 1 ? 'plaza' : 'plazas'}. Para sumar a alguien más{' '}
                    <button type="button" className="og-solo" onClick={() => setHoja('basico')}>
                      agrega una plaza
                    </button>.
                  </p>
                )}

                {/* La misma lista a la vista que en Localización, y por lo mismo: la pestaña
                    tiene una columna entera para una sola pregunta, así que esconder la
                    respuesta detrás de un clic no compra nada. */}
                <button
                  type="button"
                  className={`og-fila-op og-fila-op-cabeza${form.ocupantes.length === 0 ? ' on' : ''}`}
                  onClick={() => set('ocupantes', [])}
                >
                  <span className="og-op-box">{form.ocupantes.length === 0 && <Check size={12} />}</span>
                  <span className="og-op-txt">
                    <strong>{externo ? 'Sin prestador asignado' : 'Nadie asignado todavía'}</strong>
                    <em>El puesto sale como vacante en el dibujo</em>
                  </span>
                </button>

                <div className="pl-search-wrap og-lista-buscar">
                  <Search size={13} className="pl-search-ico" />
                  <input
                    className="pl-search"
                    value={buscaPersona}
                    onChange={e => setBuscaPersona(e.target.value)}
                    placeholder="Buscar por nombre, área o cargo"
                  />
                </div>

                <div className="og-lista-op og-lista-personas">
                  {personasFiltradas.map(pe => {
                    const marcada = form.ocupantes.includes(pe.id)
                    const ocupa = puestoDePersona[pe.id]
                    return (
                      <button
                        key={pe.id}
                        type="button"
                        /* Dos motivos distintos para no poder marcar a alguien: que la persona
                           ya tenga puesto, o que este puesto ya no tenga plazas. El título dice
                           cuál de los dos es, porque la salida es distinta en cada caso. */
                        disabled={!!ocupa || (puestoLleno && !marcada)}
                        className={`og-fila-op${marcada ? ' on' : ''}${ocupa ? ' og-fila-op-ocupada' : ''}`}
                        title={ocupa
                          ? `${pe.name} ya ocupa ${ocupa}. Para asignarlo acá hay que liberarlo de ese puesto primero.`
                          : puestoLleno && !marcada
                            ? `El puesto tiene ${form.plazas} ${form.plazas === 1 ? 'plaza' : 'plazas'} y ya está completo. Agrega una plaza para sumar a alguien más.`
                            : undefined}
                        onClick={() => set('ocupantes', marcada
                          ? form.ocupantes.filter(x => x !== pe.id)
                          : [...form.ocupantes, pe.id])}
                      >
                        <span className="og-op-box">{marcada && <Check size={12} />}</span>
                        <Avatar persona={pe} size={26} />
                        <span className="og-op-txt">
                          <strong>{pe.name}</strong>
                          {/* El área sale del cuadro que ocupa: quien no ocupa ninguno no
                              pertenece a un área todavía, y el renglón no se la inventa. */}
                          <em>{areaDe(pe, org)}</em>
                        </span>
                        {/* El puesto que ya ocupa es la razón por la que la fila está apagada,
                            así que se lee ahí mismo y no en un cartel aparte. */}
                        <span className={`og-op-extra${ocupa ? ' og-op-extra-ocupado' : ''}`}>
                          {ocupa || 'Libre'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {personasFiltradas.length === 0 && (
                  <p className="og-sedes-vacio">
                    {buscaPersona.trim()
                      ? `Nadie libre coincide con “${buscaPersona.trim()}”.`
                      : 'Todo el directorio ya ocupa un puesto.'}
                  </p>
                )}

                {/* La salida para quien busca a alguien y no lo encuentra: dice cuántos quedaron
                    fuera y por qué. Con el buscador escrito el número es el de las coincidencias,
                    así que contesta justo la pregunta que se acaba de hacer. */}
                {ocupados.length > 0 && (
                  <button
                    type="button"
                    className="og-ver-ocupados"
                    onClick={() => setVerOcupados(v => !v)}
                  >
                    {verOcupados
                      ? 'Ocultar a quienes ya ocupan un puesto'
                      : `Ver ${ocupados.length} ${ocupados.length === 1 ? 'persona que ya ocupa' : 'personas que ya ocupan'} un puesto`}
                  </button>
                )}
              </div>

              {/* Las coordinaciones no se editan aquí —se trazan sobre el lienzo— pero sí se
                  muestran: son la otra mitad de con quién trabaja el puesto. */}
              {!nuevo && coordinaciones.length > 0 && (
                <div className="pl-label">
                  <span className="og-label-fila">
                    Coordina con <span className="og-coord-count">{coordinaciones.length}</span>
                    <AyudaCampo>
                      Coordinan trabajo sin ser línea de mando: no cambian de quién depende el
                      puesto. Todavía no se pueden crear ni cerrar desde ninguna pantalla.
                    </AyudaCampo>
                  </span>
                  {coordinaciones.map(c => (
                    <div key={c.id} className="og-coord-fila">
                      <span className={`og-coord-rol og-coord-${c.rol}`}>
                        {c.rol === 'par' ? 'Par' : c.rol === 'supervisor' ? 'Supervisa' : 'Lo supervisa'}
                      </span>
                      <span className="og-coord-cargo">{c.contraparte.nombre}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            )}
          </div>
          </div>
        </div>

        <div className="pl-modal-footer">
          {/* Los subordinados no se borran con él: suben un escalón y quedan colgando de su
              jefe. El aviso lo dice antes de que pase, no después. */}
          {!nuevo && (
            <button className="pl-btn-delete" onClick={() => onEliminar(cargo)}>
              <Trash2 size={13} /> Eliminar
            </button>
          )}
          <button className="pl-btn-cancel" onClick={onCerrar}>Cancelar</button>
          <button className="pl-btn-save" disabled={!valido} onClick={guardar}>
            {nuevo ? 'Crear cargo / puesto' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* Qué se lleva puesto cambiar de quién depende una unidad. Devuelve null cuando no arrastra
   nada, y entonces no se dice nada: avisar de un cambio que no ocurre entrena a ignorar los
   avisos. Ver la misma idea en el resto del constructor. */
function avisoDeMudanza(unidad, nuevoPadreId, org) {
  if (!unidad || nuevoPadreId === unidad.padreId) return null
  const cabeza = cabezaDe(unidad.id, org)
  if (!cabeza) return `Al guardar, ${unidad.nombre} se mueve de lugar. Todavía no tiene cargos, así que no le cambia el jefe a nadie.`
  if (!nuevoPadreId) return `Al guardar, ${cabeza.nombre} deja de tener jefe y ${unidad.nombre} pasa a colgar de la empresa.`
  const nueva = cabezaDe(nuevoPadreId, org)
  const nombrePadre = getUnidad(nuevoPadreId, org)?.nombre ?? 'la unidad elegida'
  if (!nueva) return `${nombrePadre} todavía no tiene ningún cargo, así que ${cabeza.nombre} se queda con el jefe que tiene y el gráfico no cambia.`
  if (nueva.id === cabeza.reportaA) return null
  return `Al guardar, ${cabeza.nombre} pasa a reportar a ${nueva.nombre}.`
}

/* ---------- Modal: alta y detalle de una unidad organizacional ---------- */

function UnidadModal({ unidad, base, org, onGuardar, onEliminar, onCerrar, onAbrirCargo }) {
  const nueva = !unidad
  const [form, setForm] = useState(() => ({
    codigo: unidad?.codigo || '',
    nombre: unidad?.nombre || '',
    corto: unidad?.corto || '',
    padreId: unidad ? unidad.padreId
      : base && 'padreId' in base ? base.padreId
      : (org.unidades[0]?.id ?? null),
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valido = form.nombre.trim().length > 0
  const inicial = useRef(null)
  if (inicial.current === null) inicial.current = JSON.stringify(form)
  const intentarCerrar = () => { if (JSON.stringify(form) === inicial.current) onCerrar() }
  const bloqueo = unidad ? bloqueoUnidad(unidad.id, org) : null
  const apoyos = unidad ? apoyosDeUnidad(unidad.id, org) : []
  const padres = unidadesPadrePosibles(unidad?.id, org)
  const mudanza = avisoDeMudanza(unidad, form.padreId, org)

  /* Un desplegable plano con veinte unidades no dice dónde queda la que se está colocando:
     "Marketing Digital" y "Marketing" se leen como hermanas cuando una está dentro de la otra.
     Las opciones salen en orden de árbol y sangradas, así el propio desplegable dibuja la
     jerarquía. */
  const opciones = []
  const permitidas = new Set(padres.map(u => u.id))
  const recorrer = (padreId, nivel) => {
    for (const u of org.unidades.filter(x => x.padreId === padreId)) {
      if (permitidas.has(u.id)) opciones.push({ u, nivel })
      recorrer(u.id, nivel + 1)
    }
  }
  recorrer(null, 0)


  return (
    <div className="pl-overlay" onClick={intentarCerrar}>
      <div className="pl-modal og-modal-puesto" onClick={e => e.stopPropagation()}>
        <CabeceraModal
          Icon={nueva ? FolderPlus : Building2}
          titulo={nueva ? 'Nueva unidad organizacional' : 'Detalle de la unidad'}
          onCerrar={onCerrar}
        />

        {/* La misma forma que el detalle de un cargo: el dibujo a la izquierda y los campos a
            la derecha. Antes el costado contaba con texto sangrado dónde iba a quedar la
            unidad —"SoulyHR › esta unidad"—, que es justo lo que un organigrama existe para
            no tener que hacer. */}
        <div className="og-puesto-cuerpo">
          <PreviaUnidad form={form} org={org} unidad={unidad} nueva={nueva} empresa={empresa} />

          <div className="pl-modal-body og-unidad-campos">
          <label className="pl-label">
            <span className="og-label-fila">
              Código
              <AyudaCampo>
                El identificador del área en los reportes de RRHH. Es opcional: si la empresa no
                los usa, se deja vacío.
              </AyudaCampo>
            </span>
            <input
              className="pl-input"
              value={form.codigo}
              maxLength={20}
              onChange={e => set('codigo', e.target.value)}
              placeholder="Ej. COD-001"
            />
          </label>

          <label className="pl-label">
            Nombre de la unidad
            <input
              className="pl-input"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Ej. Recursos Humanos"
            />
          </label>

          <label className="pl-label">
            <span className="og-label-fila">
              Nombre corto
              <AyudaCampo>
                Es la píldora “Pertenece a” de la tabla, donde el nombre largo no entra. Si lo
                dejas vacío se usa el nombre completo.
              </AyudaCampo>
            </span>
            <input
              className="pl-input"
              value={form.corto}
              onChange={e => set('corto', e.target.value)}
              placeholder="Ej. RRHH"
            />
          </label>

          <div className="pl-label">
            <span className="og-label-fila">
              Dentro de
              <AyudaCampo>
                En qué unidad está esta. Es contención, no mando: una unidad no le reporta a otra,
                está adentro. Quien reporta es el <strong>cargo</strong>, y eso se define en su
                propio formulario.
              </AyudaCampo>
            </span>
            <SelectorLista
              valor={form.padreId}
              onCambio={v => set('padreId', v)}
              vacia={`Ninguna: cuelga de ${empresa.nombre}`}
              opciones={opciones.map(({ u, nivel }) => ({ id: u.id, nombre: u.nombre, nivel }))}
            />

            {/* El organigrama tiene dos jerarquías: la de cargos y la de unidades. El dibujo
                principal se arma con la de cargos, así que mover una unidad de madre sin tocar
                a nadie más la movía solo en la pestaña "Ver por unidades" y en el gráfico se
                quedaba donde estaba. Se arrastra la cabeza —y se dice acá, antes de guardar,
                a quién le cambia el jefe. */}
            {mudanza && <p className="og-field-nota">{mudanza}</p>}
          </div>

          {/* Quién trabaja acá sin ser de acá, SOLO PARA MIRAR. El dato es del cargo y se edita
              en su formulario: dos puertas para lo mismo obligan a aprender dos veces dónde se
              cambia, y con el tiempo dejan dos verdades. Acá se contesta la pregunta que se hace
              parado en el área —"¿quién más trabaja conmigo?"— y se ofrece el camino a la otra
              puerta, no una segunda. */}
          {!nueva && apoyos.length > 0 && (
            <div className="pl-label">
              <span className="og-label-fila">
                Apoyo funcional
                <AyudaCampo>
                  Puestos de otras áreas que trabajan en esta. No pertenecen aquí ni se cuentan
                  entre sus cargos: se declara en el formulario de cada puesto, en{' '}
                  <strong>También apoya a estas áreas</strong>.
                </AyudaCampo>
                <span className="og-contador">{apoyos.length}</span>
              </span>
              <div className="og-apoyo-lista">
                {apoyos.map(({ cargo: c, reportaA }) => (
                  <button
                    key={c.id}
                    type="button"
                    className="og-apoyo-fila"
                    title={`Abrir ${c.nombre}`}
                    onClick={() => onAbrirCargo?.(c)}
                  >
                    <span className="og-apoyo-txt">
                      <strong>{c.nombre}</strong>
                      <em>
                        de {getUnidad(c.unidadId, org)?.nombre || 'sin área'}
                        {reportaA && <> · responde a {org.cargos.find(x => x.id === reportaA)?.nombre}</>}
                      </em>
                    </span>
                    <ChevronRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>


        </div>

        <div className="pl-modal-footer">
          {!nueva && (
            <button className="pl-btn-delete" disabled={!!bloqueo} onClick={() => onEliminar(unidad)}>
              <Trash2 size={13} /> Eliminar
            </button>
          )}
          <button className="pl-btn-cancel" onClick={onCerrar}>Cancelar</button>
          <button
            className="pl-btn-save"
            disabled={!valido}
            onClick={() => onGuardar({
              codigo: form.codigo.trim() || null,
              nombre: form.nombre.trim(),
              corto: form.corto.trim() || form.nombre.trim(),
              padreId: form.padreId,
            })}
          >
            {nueva ? 'Crear unidad' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Modal: importar desde Excel ---------- */

function ImportarModal({ onCerrar }) {
  return (
    <div className="pl-overlay" onClick={onCerrar}>
      <div className="pl-modal" onClick={e => e.stopPropagation()}>
        <CabeceraModal Icon={FileSpreadsheet} titulo="Importar organigrama desde Excel" onCerrar={onCerrar} />
        <div className="pl-modal-body">
          <div className="og-drop">
            <UploadCloud size={26} />
            <strong>Arrastra tu archivo aquí</strong>
            <span>o haz clic para buscarlo — .xlsx o .csv</span>
          </div>
          <button className="pl-btn-cancel" style={{ width: '100%', justifyContent: 'center' }}>
            <FileSpreadsheet size={14} /> Descargar plantilla de ejemplo
          </button>
          <p className="og-modal-nota">
            La plantilla espera una fila por cargo con las columnas <strong>Cargo</strong>, <strong>Unidad</strong>,
            <strong> Reporta a</strong> y <strong>Ocupante</strong>. Las filas sin ocupante se cargan como vacantes.
          </p>
        </div>
        <div className="pl-modal-footer">
          <button className="pl-btn-cancel" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Vistas alternativas ---------- */

function Seccion({ titulo, conteo }) {
  return (
    <div className="og-seccion">
      <h3>{titulo}</h3>
      <span>{conteo}</span>
    </div>
  )
}

function CargoCard({ fila, onAbrir }) {
  const { cargo, tipo, ocupantes, vacante, plazas, libres, jefeNombre, sedes } = fila
  const t = tipoVisual(tipo)
  const externo = tipo === 'outsourcing'
  const clases = ['og-cc']
  /* Mismo reparto que en el árbol: el color es el tipo de puesto y la etiqueta es la vacante.
     El amarillo solo entra donde no hay color de tipo que pisar. Se pregunta por el color
     propio y no por la lateralidad: el outsourcing dejó de ser lateral y seguía teñido. */
  if (vacante && !t.propio) clases.push('og-cc-vacante')
  if (t.propio) clases.push(`og-cc-${t.clase}`)

  return (
    <div className={clases.join(' ')} onDoubleClick={() => onAbrir(cargo)}>
      {libres > 0 && <span className="og-cc-tag">{rotuloVacantes(libres)}</span>}
      <button className="og-cc-edit" onClick={() => onAbrir(cargo)} title="Editar cargo"><Pencil size={12} /></button>

      <div className="og-cc-hd">
        <span className="og-cc-ico"><t.Icon size={17} className={`og-ico-${t.clase}`} /></span>
        <div className="og-cc-hd-txt">
          <strong>{cargo.nombre}</strong>
          <span>{t.label}</span>
        </div>
      </div>

      {jefeNombre && (
        <div className="og-cc-reporta"><ArrowUp size={10} /> Reporta a <strong>{jefeNombre}</strong></div>
      )}

      {/* Un cargo puede existir en más de una sede; sin sedes declaradas está en todas. */}
      <div className="og-cc-sedes">
        <MapPin size={10} />
        {sedes.length === 0
          ? <span>Todas las sedes</span>
          : sedes.map(s => <span key={s.id}>{s.ciudad}</span>)}
      </div>

      <div className="og-cc-sep" />
      {ocupantes.length ? (
        <>
          <div className="og-cc-label">
            {/* Con plazas de sobra la cuenta se lee contra el cupo: "3 de 5 plazas cubiertas"
                dice lo mismo y además cuánto falta. */}
            {plazas > ocupantes.length
              ? `${ocupantes.length} de ${plazas} plazas cubiertas`
              : ocupantes.length === 1
                ? '1 colaborador asignado'
                : `${ocupantes.length} colaboradores asignados`}
          </div>
          {/* La ficha sí tiene lugar para la lista entera: es la pantalla a la que uno viene
              justamente a ver quiénes ocupan el puesto. */}
          {ocupantes.map(p => (
            <div key={p.id} className="og-cc-persona"><Avatar persona={p} size={22} />{p.name}</div>
          ))}
        </>
      ) : externo ? (
        <div className="og-cc-persona og-cc-persona-vacia">Sin prestador asignado</div>
      ) : (
        <div className="og-cc-persona og-cc-persona-vacia">Sin colaborador asignado</div>
      )}
    </div>
  )
}

function UnidadCard({ datos, onEntrar, onEditar }) {
  const { unidad, cabeza, totalCargos, totalSub } = datos
  return (
    <div className="og-un" onClick={() => onEntrar(unidad.id)}>
      <button
        className="og-un-edit"
        title="Editar unidad organizacional"
        onClick={e => { e.stopPropagation(); onEditar(unidad) }}
      >
        <Pencil size={12} />
      </button>
      <div className="og-un-top">
        <span className="og-un-ico"><Building2 size={16} /></span>
        <strong>{unidad.nombre}</strong>
        {cabeza && <span className="og-un-jefe"><Star size={11} /> {cabeza.nombre}</span>}
      </div>
      <div className="og-un-ft">
        <div className="og-un-stat"><b>{totalCargos}</b><span>{totalCargos === 1 ? 'cargo' : 'cargos'}</span></div>
        <div className="og-un-stat"><b>{totalSub}</b><span>{totalSub === 1 ? 'sub-unidad' : 'sub-unidades'}</span></div>
        <span className="og-un-cta">Ver unidad →</span>
      </div>
    </div>
  )
}

function VistaCards({ org, busca, setBusca, onAbrir, onEditarUnidad }) {
  const [ruta, setRuta] = useState([])

  const actual = ruta.length ? ruta[ruta.length - 1] : null
  const q = busca.trim()

  const resultados = useMemo(() => (q ? buscarCargos(q, org) : []), [q, org])
  const raices = useMemo(() => unidadesRaiz(org).map(u => tarjetaUnidad(u.id, org)), [org])
  const cargosAqui = useMemo(() => (actual ? cargosDeUnidad(actual, org) : []), [actual, org])
  const subsAqui = useMemo(
    () => (actual ? subunidadesDe(actual, org).map(u => tarjetaUnidad(u.id, org)) : []),
    [actual, org],
  )

  const entrar = id => setRuta(r => [...r, id])
  const irA = i => setRuta(r => r.slice(0, i))
  const nombreActual = actual ? getUnidad(actual, org)?.nombre : null

  return (
    <>
      {/* MIGAS */}
      <div className="og-crumbs">
        {ruta.length > 0 && (
          <button className="og-crumb-back" onClick={() => setRuta(r => r.slice(0, -1))}>
            <ChevronLeft size={13} /> Atrás
          </button>
        )}
        <button className={`og-crumb${ruta.length === 0 ? ' on' : ''}`} onClick={() => setRuta([])}>Inicio</button>
        {ruta.map((id, i) => (
          <Fragment key={id}>
            <ChevronRight size={12} className="og-crumb-sep" />
            <button
              className={`og-crumb${i === ruta.length - 1 ? ' on' : ''}`}
              onClick={() => irA(i + 1)}
            >
              {getUnidad(id, org)?.nombre}
            </button>
          </Fragment>
        ))}
        <Buscador value={busca} onChange={setBusca} />
      </div>

      <div className="og-scroll">
        {q ? (
          <>
            <Seccion titulo={`Resultados para "${q}"`} conteo={`${resultados.length} ${resultados.length === 1 ? 'cargo' : 'cargos'}`} />
            {resultados.length === 0
              ? <p className="og-vacio">Ningún cargo, persona ni unidad coincide con la búsqueda.</p>
              : <div className="og-grid">{resultados.map(f => <CargoCard key={f.cargo.id} fila={f} onAbrir={onAbrir} />)}</div>}
          </>
        ) : !actual ? (
          <>
            <Seccion titulo="Unidades organizacionales" conteo="Haz clic en una unidad para ver sus cargos y sub-unidades." />
            <div className="og-grid">{raices.map(d => <UnidadCard key={d.unidad.id} datos={d} onEntrar={entrar} onEditar={onEditarUnidad} />)}</div>
          </>
        ) : (
          <>
            <Seccion titulo={`Cargos en ${nombreActual}`} conteo={`${cargosAqui.length} ${cargosAqui.length === 1 ? 'cargo' : 'cargos'}`} />
            {cargosAqui.length === 0
              ? <p className="og-vacio">Esta unidad todavía no tiene cargos definidos.</p>
              : <div className="og-grid">{cargosAqui.map(f => <CargoCard key={f.cargo.id} fila={f} onAbrir={onAbrir} />)}</div>}

            {subsAqui.length > 0 && (
              <>
                <Seccion titulo={`Sub-unidades de ${nombreActual}`} conteo={`${subsAqui.length} ${subsAqui.length === 1 ? 'unidad' : 'unidades'}`} />
                <div className="og-grid">{subsAqui.map(d => <UnidadCard key={d.unidad.id} datos={d} onEntrar={entrar} onEditar={onEditarUnidad} />)}</div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

function TipoPill({ tipo }) {
  const t = tipoVisual(tipo)
  return <span className={`og-tipo og-tipo-${t.clase}`} title={t.desc}><t.Icon size={10} /> {t.label}</span>
}

function VistaTabla({ org, busca, setBusca, onAbrir }) {
  const [colapsados, setColapsados] = useState({})
  const grupos = useMemo(() => filasTabla(org), [org])

  const q = busca.trim().toLowerCase()
  const visibles = useMemo(() => {
    if (!q) return grupos
    const coincide = f =>
      f.cargo.nombre.toLowerCase().includes(q) ||
      f.ocupantes.some(p => p.name.toLowerCase().includes(q)) ||
      (f.unidad?.nombre || '').toLowerCase().includes(q)
    return grupos
      .map(g => ({ ...g, filas: g.filas.filter(coincide) }))
      .filter(g => g.filas.length > 0)
  }, [grupos, q])

  return (
    <>
      <div className="og-buscador-fila"><Buscador value={busca} onChange={setBusca} /></div>

      <div className="og-tabla-wrap">
        <table className="og-tabla">
          <thead>
            <tr>
              <th>Unidad organizacional / Cargo</th>
              {/* El código va después del nombre y no antes: se busca por nombre, se confirma por
                  código. Vacío se muestra con una raya, que dice "no tiene" sin ocupar lugar. */}
              <th className="og-th-codigo">Código</th>
              <th>Pertenece a</th>
              <th>Tipo</th>
              <th>Colaborador</th>
              <th>Reporta a</th>
              <th className="og-th-acc">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map(g => {
              const cerrado = !!colapsados[g.id]
              return (
                <Fragment key={g.id}>
                  <tr className={`og-grupo${g.unidad?.padreId === null ? ' og-grupo-raiz' : ''}`}>
                    <td colSpan={7}>
                      <div className="og-grupo-in">
                        <Building2 size={13} />
                        <span className="og-grupo-nom">{g.unidad?.nombre || 'Sin unidad'}</span>
                        <span className="og-grupo-chip">{g.filas.length} {g.filas.length === 1 ? 'Cargo' : 'Cargos'}</span>
                        <button onClick={() => setColapsados(p => ({ ...p, [g.id]: !cerrado }))}>
                          {cerrado ? 'Expandir' : 'Colapsar'}
                          {cerrado ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {!cerrado && g.filas.map(f => (
                    <tr
                      key={f.cargo.id}
                      className={f.cargo.destacado ? 'og-fila-top' : undefined}
                      onDoubleClick={() => onAbrir(f.cargo)}
                    >
                      <td>
                        <div className="og-cargo-cel" style={{ paddingLeft: f.nivel * 22 }}>
                          {f.nivel > 0 && <span className="og-sangria" />}
                          <span className="og-cargo-nom">{f.cargo.nombre}</span>
                        </div>
                      </td>
                      <td className="og-td-codigo">{f.cargo.codigo || '—'}</td>
                      <td><span className="og-pertenece">{f.unidad?.corto || '—'}</span></td>
                      <td><TipoPill tipo={f.tipo} /></td>
                      <td>
                        {f.ocupantes.length ? (
                          <span className="og-td-persona">
                            {f.ocupantes.slice(0, 3).map(p => <Avatar key={p.id} persona={p} size={22} />)}
                            {/* El nombre solo cuando el puesto está completo con una persona.
                                Con plazas libres manda la cuenta: en una tabla de cien filas es
                                lo que se recorre buscando qué falta cubrir. */}
                            {f.ocupantes.length === 1 && f.libres === 0
                              ? f.ocupantes[0].name
                              : `${f.ocupantes.length} de ${f.plazas}`}
                          </span>
                        ) : (
                          <span className="og-td-persona">
                            <span className="og-av og-av-vacio"><Minus size={11} /></span>
                            <em className="og-td-vacio">
                              {f.plazas > 1
                                ? `${f.plazas} plazas por cubrir`
                                : f.tipo === 'outsourcing' ? 'Sin prestador asignado' : 'Sin colaborador asignado'}
                            </em>
                          </span>
                        )}
                      </td>
                      <td className="og-reporta">{f.jefeNombre || '— Empresa'}</td>
                      <td className="og-td-acc">
                        <button onClick={() => onAbrir(f.cargo)} title="Editar cargo"><Pencil size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* EL BOTÓN DE CREAR. Antes eran dos círculos flotantes: uno con un "+" y otro con un ícono de
   carpeta sin rótulo, así que cuál creaba un área y cuál un cargo había que averiguarlo pasando
   el mouse. Dos objetos compitiendo para una sola intención —agregar algo—.

   Ahora es UNO que abre un menú pegado a él. Se eligió menú y no modal: un modal tapa el
   organigrama para preguntar entre dos opciones y hay que cerrarlo con un botón; el menú se
   descarta tocando afuera y deja el dibujo a la vista. Y es el mismo menú que va a usar el "+"
   de cada cuadro cuando exista, con las opciones que correspondan a ese lugar.

   El cargo puede estar bloqueado —no se puede crear un puesto sin un área donde ponerlo— y en
   un menú eso se puede DECIR. Como círculo apagado solo se veía un botón que no responde. */
function BotonCrear({ onCargo, onUnidad, sinAreas }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = e => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false) }
    const escape = e => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  const elegir = accion => { setAbierto(false); accion() }

  return (
    <div className="og-crear" ref={caja}>
      {abierto && (
        <div className="og-crear-menu">
          <div className="og-crear-hd">Agregar al organigrama</div>

          <button
            className="og-crear-op"
            disabled={sinAreas}
            onClick={() => elegir(onCargo)}
          >
            <span className="og-crear-ico"><User size={15} /></span>
            <div>
              <strong>Cargo / puesto</strong>
              <small>{sinAreas
                ? 'Primero hace falta un área donde ponerlo'
                : 'Una posición del organigrama, con sus plazas'}</small>
            </div>
          </button>

          <button className="og-crear-op" onClick={() => elegir(onUnidad)}>
            <span className="og-crear-ico"><Building2 size={15} /></span>
            <div>
              <strong>Unidad organizacional</strong>
              <small>Un área que agrupa cargos y otras áreas</small>
            </div>
          </button>
        </div>
      )}

      <button
        className={`og-fab${abierto ? ' on' : ''}`}
        onClick={() => setAbierto(v => !v)}
        title="Agregar al organigrama"
        aria-expanded={abierto}
      >
        <Plus size={22} />
      </button>
    </div>
  )
}

/* ---------- Organigrama todavía sin dibujar ---------- */

/* Las sucursales aparecen aquí a propósito: son lo único que ya existe cuando no hay nada
   dibujado, y verlas listadas contesta la pregunta obvia de "¿tengo que cargar las sedes
   otra vez?" antes de que alguien la haga. */
/* Sin botones acá: los de abajo a la derecha son los mismos que se usan el resto del tiempo,
   y tener dos puertas para lo mismo obliga a aprender dos veces dónde se crea una unidad. El
   aviso explica, la acción vive donde siempre. */
function VacioOrganigrama() {
  return (
    <div className="og-scroll">
      <div className="og-vacio-caja">
        <span className="og-vacio-ico"><Building2 size={30} /></span>
        <h2>Todavía no hay un organigrama</h2>
        <p>
          Empieza por las unidades organizacionales: cada cargo tiene que pertenecer a una.
          Después cuelgas los cargos, eliges de quién dependen y quién los ocupa.
        </p>
      </div>
    </div>
  )
}

/* ---------- Pantalla ---------- */

export default function Organigrama() {
  /* La estructura vive en el contexto de la demo, no en la pantalla: así se persiste, la
     borra "Resetear demo" y la siembra "Cargar datos de ejemplo", igual que las rutas o los
     documentos. Es la estructura completa ({ unidades, cargos, relaciones }) porque es lo
     que esperan todas las funciones de `organigramaData`. */
  const { organigrama: org, setOrganigrama: setOrg } = useOnboardingData()
  const [vista, setVista] = useState('grafico')
  const [pestana, setPestana] = useState('completo')
  const [sedeId, setSedeId] = useState(TODAS_SUCURSALES)
  const [sedeAbierta, setSedeAbierta] = useState(false)
  /* Qué parte de la empresa se está mirando. Es un ALCANCE y no una pestaña: "solo Marketing"
     vale igual en el gráfico completo, en la línea de mando y en la vista por áreas, así que
     recorta la estructura antes de dibujar en vez de agregar un modo más. Una pestaña por área
     serían veinte pestañas. */
  const [unidadId, setUnidadId] = useState(TODAS_UNIDADES)
  const [unidadAbierta, setUnidadAbierta] = useState(false)
  const [buscaFiltroUnidad, setBuscaFiltroUnidad] = useState('')
  /* El filtro de sede es un desplegable más y lleva buscador como todos los demás: se limpia al
     cerrarlo para que no reabra filtrado por algo que se escribió hace media hora. */
  const [buscaFiltroSede, setBuscaFiltroSede] = useState('')
  const [busca, setBusca] = useState('')
  const [importar, setImportar] = useState(false)
  /* El color vive fuera de la pantalla porque tiene que sobrevivir a recargar: enseñarlo en una
     reunión y que vuelva al azul de fábrica al cambiar de pestaña sería peor que no tenerlo. */
  const [colorMarca, setColorMarca] = useLocalStorage('organigramaColor', COLORES_MARCA[0])
  /* Ver o no los cuadros de apoyo que llegan de otras áreas. Es estado de VISTA —no toca el
     dato— pero se recuerda entre sesiones: quien arma el organigrama estructural los apaga una
     vez y no quiere volver a apagarlos cada vez que entra. */
  const [verFuncionales, setVerFuncionales] = useLocalStorage('organigramaFuncionales', true)
  const [marcaAbierta, setMarcaAbierta] = useState(false)
  const [exportAbierto, setExportAbierto] = useState(false)
  /* Mientras se dibuja la imagen el árbol tiene que quedarse quieto y entero, así que el botón
     avisa que está trabajando en vez de parecer que no hizo nada: en un organigrama de treinta
     cargos el PNG tarda un segundo largo. */
  const [exportando, setExportando] = useState(null)

  /* Si la exportación falla hay que DECIRLO. Esto se rompió durante meses sin que se notara:
     el error subía sin que nadie lo atajara, el botón volvía a su estado normal y no bajaba
     ningún archivo, así que desde la pantalla se veía igual que si nunca lo hubieran tocado. */
  const [falloExport, setFalloExport] = useState(null)
  const exportar = async (formato, fn) => {
    setExportando(formato)
    setExportAbierto(false)
    setFalloExport(null)
    try {
      await fn(empresa.nombre)
    } catch (e) {
      console.error('No se pudo exportar el organigrama', e)
      setFalloExport(formato)
    } finally {
      setExportando(null)
    }
  }
  const [editando, setEditando] = useState(null)      // { cargo } | { cargo: null } para alta
  const [editandoUnidad, setEditandoUnidad] = useState(null) // { unidad } | { unidad: null }

  /* Las vistas leen la estructura recortada a la sede; los modales, la completa: al elegir
     jefe o unidad hay que poder apuntar a algo que el filtro dejó fuera de pantalla. */
  /* Primero el área y después la sede: los dos recortan y se aplican uno sobre el otro, así que
     "Marketing en La Paz" es una vista posible y no dos filtros que se pisan. */
  const orgVisible = useMemo(
    () => filtrarPorSucursal(filtrarPorUnidad(org, unidadId), sedeId),
    [org, unidadId, sedeId],
  )
  const tree = useMemo(
    () => buildOrgTree(pestana, orgVisible, {
      funcionales: verFuncionales,
      /* Sin filtro de sede se rescatan las áreas sin cargos, que es como se ve un organigrama
         a medio armar. Con una sede elegida no: ahí un área sin puestos no existe. */
      vacias: sedeId === TODAS_SUCURSALES,
    }),
    [pestana, orgVisible, verFuncionales, sedeId],
  )
  /* Cuántos cuadros de apoyo hay para mostrar. Si no hay ninguno el interruptor no aparece: un
     control que no cambia nada enseña a ignorar la fila donde vive. */
  const cuantosFuncionales = useMemo(() => {
    const hay = c => org.cargos.some(x => x.id === c)
    return orgVisible.cargos.reduce((n, c) => n + funcionalesDe(c).filter(f => (
      /* En "Ver por cargos" solo se dibujan los que tienen jefe funcional: los demás cuelgan de
         la píldora del área, que ahí no existe. El número tiene que contar lo que se va a ver,
         o promete cuadros que no aparecen. */
      pestana === 'completo' ? true : hay(f.reportaA)
    )).length, 0)
  }, [org, orgVisible, pestana])

  const sede = sucursales.find(s => s.id === sedeId)
  const sedesDelFiltro = sucursales.filter(s => (
    `${s.nombre} ${s.ciudad}`.toLowerCase().includes(buscaFiltroSede.trim().toLowerCase())
  ))

  const unidadVista = org.unidades.find(u => u.id === unidadId) || null
  /* Mirando un área, lo que se crea nace ahí. Si no, se crearía en la primera unidad de la lista
     y desaparecería al instante detrás del filtro: se guarda bien y parece que no pasó nada.
     Es la misma respuesta que ya da la sede —"para la que estás viendo"— dicha y modificable en
     el formulario en vez de supuesta en silencio. */
  const baseDelAlcance = unidadVista
    ? { unidadId: unidadVista.id, padreId: unidadVista.id }
    : undefined
  /* Las áreas del desplegable, en orden de árbol y sangradas: un listado plano de veinte no dice
     que Marketing Digital está DENTRO de Marketing, que es justo lo que hay que saber para
     elegir el alcance. Cada una con cuántos cargos trae, para no elegir a ciegas. */
  const areasDelFiltro = useMemo(() => {
    const texto = buscaFiltroUnidad.trim().toLowerCase()
    const salida = []
    const recorrer = (padreId, nivel) => {
      for (const u of org.unidades.filter(x => x.padreId === padreId)) {
        salida.push({ unidad: u, nivel, cargos: cargosEnRama(u.id, org) })
        recorrer(u.id, nivel + 1)
      }
    }
    recorrer(null, 0)
    return texto ? salida.filter(o => o.unidad.nombre.toLowerCase().includes(texto)) : salida
  }, [org, buscaFiltroUnidad])
  const vacio = org.unidades.length === 0
  const guardar = (form, posicion) => {
    setOrg(prev => {
      const id = editando.cargo ? editando.cargo.id : nuevoId('cargo', prev.cargos)
      const cargos = editando.cargo
        ? prev.cargos.map(c => (c.id === id ? { ...c, ...form } : c))
        : [...prev.cargos, { id, ...form }]
      const siguiente = { ...prev, cargos }
      /* El orden se aplica sobre el organigrama YA actualizado: si en la misma edición cambió
         algo más, los pares que cuentan son los de después del cambio. */
      return posicion == null ? siguiente : moverEntrePares(id, posicion, siguiente)
    })
    setEditando(null)
  }

  const borrarCargo = cargo => {
    setOrg(prev => eliminarCargo(cargo.id, prev))
    setEditando(null)
  }

  const guardarUnidad = form => {
    const anterior = editandoUnidad.unidad
    setOrg(prev => {
      const unidades = anterior
        ? prev.unidades.map(u => (u.id === anterior.id ? { ...u, ...form } : u))
        : [...prev.unidades, { id: nuevoId('area', prev.unidades), ...form }]

      /* Mover una unidad de madre tiene que mover también su cabeza, o el cambio se ve en
         "Ver por unidades" y no en el gráfico: son dos jerarquías y el dibujo principal usa la
         de cargos. Lo que se recuelga es solo la cabeza; todo lo que colgaba de ella la sigue
         sin tocar nada más. */
      if (!anterior || form.padreId === anterior.padreId) return { ...prev, unidades }
      const cabeza = cabezaDe(anterior.id, prev)
      if (!cabeza) return { ...prev, unidades }
      const nuevoJefe = form.padreId ? cabezaDe(form.padreId, prev) : null
      if (form.padreId && !nuevoJefe) return { ...prev, unidades }
      return {
        ...prev,
        unidades,
        cargos: prev.cargos.map(c => (c.id === cabeza.id ? { ...c, reportaA: nuevoJefe?.id ?? null } : c)),
      }
    })
    setEditandoUnidad(null)
  }

  /* Acomodar un cuadro no toca ningún dato del organigrama: se guarda aparte, en un mapa de
     corrimientos respecto del lugar que le dio el árbol. Por eso no vive dentro del cargo —un
     cargo no tiene coordenadas, tiene jefe y unidad— y por eso volver al acomodo automático es
     simplemente borrar el mapa. Se suma al anterior: mover dos veces mueve dos veces. */
  const mover = (clave, delta) => setOrg(prev => {
    const previo = prev.desplazamientos?.[clave] || { dx: 0, dy: 0 }
    return {
      ...prev,
      desplazamientos: {
        ...prev.desplazamientos,
        [clave]: { dx: previo.dx + delta.dx, dy: previo.dy + delta.dy },
      },
    }
  })

  const acomodar = () => setOrg(prev => ({ ...prev, desplazamientos: {} }))

  const borrarUnidad = unidad => {
    setOrg(prev => eliminarUnidad(unidad.id, prev))
    setEditandoUnidad(null)
  }

  return (
    <div className="og-page" style={{ '--og-marca': colorMarca }}>
      {/* BARRA SUPERIOR */}
      <div className="og-topbar">
        <span className="og-empresa-nombre">{empresa.nombre}</span>

        {/* Los dos filtros como un grupo: contestan la misma pregunta —qué parte de la empresa
            estoy mirando— y separados por el mismo hueco que las acciones se leían como seis
            botones sueltos en fila. */}
        <div className="og-filtros">
        {/* "Todas las sucursales" es la opción por defecto: una empresa con varias sedes casi
            siempre quiere ver la estructura entera, y entrar a una sede es la excepción. */}
        <div className="og-sede">
          <button
            className="og-sede-btn"
            onClick={() => { setBuscaFiltroSede(''); setSedeAbierta(v => !v) }}
          >
            {/* Sin la palabra "Viendo" delante. La decía cada uno de los dos filtros, y con
                dos botones seguidos que empiezan igual el ojo tiene que leer hasta la mitad
                para saber cuál es cuál. El ícono lo dice antes y en menos lugar: un pin es la
                sede, un edificio es el área. */}
            <MapPin size={14} className="og-sede-ico" />
            <span className="og-sede-txt">
              {sede ? `${sede.nombre} ${sede.ciudad}` : 'Todas las sucursales'}
            </span>
            <span className="og-sede-chip">{sede ? '1' : sucursales.length}</span>
            <ChevronDown size={14} />
          </button>
          {sedeAbierta && (
            <div className="og-sede-menu">
              <div className="pl-search-wrap og-lista-buscar">
                <Search size={13} className="pl-search-ico" />
                <input
                  className="pl-search"
                  value={buscaFiltroSede}
                  onChange={e => setBuscaFiltroSede(e.target.value)}
                  placeholder="Buscar por sede"
                  autoFocus
                />
              </div>
              {/* "Todas las sucursales" no se filtra: es la salida del filtro, no una sede más,
                  y esconderla dejaría escribiendo cualquier cosa para poder volver a verlo todo. */}
              <div className="og-sede-lista">
                <button
                  className={sedeId === TODAS_SUCURSALES ? 'on' : ''}
                  onClick={() => { setSedeId(TODAS_SUCURSALES); setSedeAbierta(false) }}
                >
                  Todas las sucursales <span>{sucursales.length} sedes</span>
                </button>
                {sedesDelFiltro.map(s => (
                  <button
                    key={s.id}
                    className={sedeId === s.id ? 'on' : ''}
                    onClick={() => { setSedeId(s.id); setSedeAbierta(false) }}
                  >
                    {s.nombre} <span>{s.ciudad}</span>
                  </button>
                ))}
              </div>
              {sedesDelFiltro.length === 0 && (
                <p className="og-sedes-vacio">Ninguna sede coincide con “{buscaFiltroSede.trim()}”.</p>
              )}
            </div>
          )}
        </div>

        {/* ALCANCE: toda la empresa o un área con lo suyo. Va al lado del de sede porque son la
            misma clase de control —los dos recortan lo que se mira, no cambian cómo se dibuja—
            y se combinan entre ellos. */}
        <div className="og-sede">
          <button
            className="og-sede-btn"
            onClick={() => { setBuscaFiltroUnidad(''); setUnidadAbierta(v => !v) }}
          >
            <Building2 size={14} className="og-sede-ico" />
            <span className="og-sede-txt">
              {unidadVista ? unidadVista.nombre : 'Toda la empresa'}
            </span>
            <span className="og-sede-chip">
              {unidadVista ? orgVisible.cargos.length : org.unidades.length}
            </span>
            <ChevronDown size={14} />
          </button>
          {unidadAbierta && (
            <div className="og-sede-menu og-areas-menu">
              <div className="pl-search-wrap og-lista-buscar">
                <Search size={13} className="pl-search-ico" />
                <input
                  className="pl-search"
                  value={buscaFiltroUnidad}
                  onChange={e => setBuscaFiltroUnidad(e.target.value)}
                  placeholder="Buscar por área"
                  autoFocus
                />
              </div>
              <div className="og-sede-lista">
                {/* "Toda la empresa" no se filtra: es la salida del recorte, y esconderla dejaría
                    escribiendo cualquier cosa para poder volver a verlo todo. */}
                <button
                  className={unidadId === TODAS_UNIDADES ? 'on' : ''}
                  onClick={() => { setUnidadId(TODAS_UNIDADES); setUnidadAbierta(false) }}
                >
                  Toda la empresa <span>{org.cargos.length} cargos</span>
                </button>
                {areasDelFiltro.map(({ unidad, nivel, cargos }) => (
                  <button
                    key={unidad.id}
                    className={unidadId === unidad.id ? 'on' : ''}
                    style={nivel ? { paddingLeft: 10 + nivel * 14 } : undefined}
                    onClick={() => { setUnidadId(unidad.id); setUnidadAbierta(false) }}
                  >
                    {unidad.nombre} <span>{cargos} {cargos === 1 ? 'cargo' : 'cargos'}</span>
                  </button>
                ))}
              </div>
              {areasDelFiltro.length === 0 && (
                <p className="og-sedes-vacio">Ningún área coincide con “{buscaFiltroUnidad.trim()}”.</p>
              )}
              <p className="og-areas-pie">
                Un área trae sus sub-áreas y todo lo que depende de sus cargos, aunque sea de
                otra área.
              </p>
            </div>
          )}
        </div>
        </div>

        <div className="og-topbar-actions">
          {/* Color de la empresa. Tiñe las superficies del organigrama —barra, nodos, píldoras,
              controles—, no los textos: con una marca naranja los nombres de los cargos
              saldrían naranjas y el dibujo se volvería ilegible. */}
          <div className="og-marca">
            {/* Solo la muestra de color: la palabra "Color" al lado de un cuadrito de color
                repite lo que el cuadrito ya dice, y en una barra apretada eso cuesta lugar. */}
            <button className="og-marca-btn og-btn-ico" onClick={() => setMarcaAbierta(v => !v)} title="Color de la empresa">
              <span className="og-marca-muestra" style={{ background: colorMarca }} />
            </button>
            {marcaAbierta && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMarcaAbierta(false)} />
                <div className="og-marca-menu">
                  <div className="og-marca-hd">Color de la empresa</div>
                  <div className="og-marca-grid">
                    {COLORES_MARCA.map(c => (
                      <button
                        key={c}
                        className={`og-marca-op${colorMarca === c ? ' on' : ''}`}
                        style={{ background: c }}
                        onClick={() => setColorMarca(c)}
                        title={c}
                      />
                    ))}
                  </div>
                  <label className="og-marca-libre">
                    El de tu marca
                    <input type="color" value={colorMarca} onChange={e => setColorMarca(e.target.value)} />
                  </label>
                  <p className="og-marca-pie">
                    Tiñe el dibujo: la empresa y las píldoras de cada unidad. La barra y los
                    controles no cambian, y los colores de staff, outsourcing y vacante tampoco:
                    son la leyenda del organigrama.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Exportar. Tres formatos porque son tres usos: la imagen que se pega en una
              presentación, el archivo que escala sin pixelarse, y el papel. */}
          <div className="og-marca">
            <button className="og-marca-btn" onClick={() => setExportAbierto(v => !v)} disabled={!!exportando} title="Exportar el organigrama">
              <Download size={13} />
              {exportando ? 'Generando…' : 'Exportar'}
            </button>
            {/* El aviso cuelga del botón que falló y se va al volver a intentarlo. Sin él, un
                error dejaba la pantalla idéntica a no haber hecho nada. */}
            {falloExport && !exportando && (
              <span className="og-export-fallo" role="status">
                No se pudo generar el {falloExport.toUpperCase()}. Intenta de nuevo.
              </span>
            )}
            {exportAbierto && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setExportAbierto(false)} />
                <div className="og-marca-menu og-export-menu">
                  <div className="og-marca-hd">Exportar</div>
                  <button className="og-export-op" onClick={() => exportar('png', exportarPNG)}>
                    <Image size={14} />
                    <div>
                      <strong>Imagen PNG</strong>
                      <small>Para pegar en una presentación</small>
                    </div>
                  </button>
                  <button className="og-export-op" onClick={() => exportar('svg', exportarSVG)}>
                    <FileCode2 size={14} />
                    <div>
                      <strong>Vector SVG</strong>
                      <small>Escala sin pixelarse</small>
                    </div>
                  </button>
                  <button className="og-export-op" onClick={() => { setExportAbierto(false); imprimir() }}>
                    <Printer size={14} />
                    <div>
                      <strong>Imprimir o PDF</strong>
                      <small>El PDF sale con texto buscable</small>
                    </div>
                  </button>
                  <p className="og-marca-pie">
                    Se exporta el organigrama entero a tamaño natural, no el pedazo que se ve en
                    pantalla.
                  </p>
                </div>
              </>
            )}
          </div>

          <button className="og-import" onClick={() => setImportar(true)} title="Importar el organigrama desde un Excel">
            <Download size={13} /> <span className="og-seg-txt">Importar</span>
          </button>
          <div className="og-seg">
            {VISTAS.map(v => (
              <button
                key={v.key}
                className={vista === v.key ? 'on' : ''}
                onClick={() => setVista(v.key)}
                title={v.label}
              >
                {/* El ícono siempre y la palabra cuando hay lugar: en pantallas angostas los tres
                    nombres se comen 120 px que la barra no tiene, y el ícono ya distingue un
                    árbol de una grilla de una tabla. */}
                <v.icon size={13} />
                <span className="og-seg-txt">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      {vacio ? (
        /* El aviso y los botones flotantes conviven: el organigrama vacío sigue siendo el
           lienzo, no otra pantalla, así que las dos formas de crear —unidad y cargo— están donde
           van a estar siempre. */
        <>
          <VacioOrganigrama />
          <BotonCrear
            sinAreas={org.unidades.length === 0}
            onCargo={() => setEditando({ cargo: null, base: baseDelAlcance })}
            onUnidad={() => setEditandoUnidad({ unidad: null, base: baseDelAlcance })}
          />
        </>
      ) : (
        <>
          {vista === 'grafico' && !vacio && (
            <OrgGrafico
              tree={tree}
              org={orgVisible}
              modo={pestana}
              onModo={setPestana}
              funcionales={{
                activo: verFuncionales,
                alternar: () => setVerFuncionales(v => !v),
                cuantos: cuantosFuncionales,
              }}
              onAbrirCargo={nodo => setEditando({ cargo: nodo.cargo })}
              onAbrirUnidad={unidad => setEditandoUnidad({ unidad })}
              desplazamientos={org.desplazamientos}
              onMover={mover}
              onAcomodar={acomodar}
            />
          )}
          {vista === 'cards' && !vacio && (
            <VistaCards
              org={orgVisible}
              busca={busca}
              setBusca={setBusca}
              onAbrir={c => setEditando({ cargo: c })}
              onEditarUnidad={u => setEditandoUnidad({ unidad: u })}
            />
          )}
          {vista === 'tabla' && !vacio && (
            <div className="og-scroll">
              <VistaTabla org={orgVisible} busca={busca} setBusca={setBusca} onAbrir={c => setEditando({ cargo: c })} />
            </div>
          )}

          <BotonCrear
            sinAreas={org.unidades.length === 0}
            onCargo={() => setEditando({ cargo: null, base: baseDelAlcance })}
            onUnidad={() => setEditandoUnidad({ unidad: null, base: baseDelAlcance })}
          />
        </>
      )}

      {importar && <ImportarModal onCerrar={() => setImportar(false)} />}
      {editando && (
        <CargoModal
          cargo={editando.cargo}
          base={editando.base}
          sedeActiva={sede || null}
          org={org}
          onGuardar={guardar}
          onEliminar={borrarCargo}
          onCerrar={() => setEditando(null)}
        />
      )}
      {editandoUnidad && (
        <UnidadModal
          unidad={editandoUnidad.unidad}
          base={editandoUnidad.base}
          org={org}
          onGuardar={guardarUnidad}
          onEliminar={borrarUnidad}
          onCerrar={() => setEditandoUnidad(null)}
          /* Abrir el cargo que apoya cierra esta ficha y abre la suya: es la otra puerta, no
             una segunda forma de editar lo mismo. */
          onAbrirCargo={c => { setEditandoUnidad(null); setEditando({ cargo: c }) }}
        />
      )}
    </div>
  )
}
