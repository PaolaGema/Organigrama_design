import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  FileDown, FileUp, Network, LayoutGrid, Table2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  X, Building2, UploadCloud, FileSpreadsheet, Check, User, Search, Pencil, Star, Users,
  Minus, Plus, ArrowUp, Briefcase, MapPin, Trash2, FolderPlus, Printer, Image, FileCode2,
  ClipboardList, Share2, SlidersHorizontal, Settings, Layers, Palette,
} from 'lucide-react'
import OrgGrafico from '../../components/personas/OrgGrafico'
import CabeceraModal from '../../components/personas/CabeceraModal'
import PreviaPuesto from '../../components/personas/PreviaPuesto'
import PreviaUnidad from '../../components/personas/PreviaUnidad'
import AyudaCampo from '../../components/personas/AyudaCampo'
import ConfigMandos from '../../components/personas/ConfigMandos'
import ConfigColores from '../../components/personas/ConfigColores'
import SelectorLista from '../../components/personas/SelectorLista'
import { ListaCrear } from '../../components/personas/MenuCrear'
import ConfirmarAccionModal from '../../components/layout/ConfirmarAccionModal'
import { HojaCargo, HojaUnidad } from '../../components/personas/HojaDetalle'
import PreviaLugar from '../../components/personas/PreviaLugar'
import PanelFiltros, { FichasFiltro } from '../../components/personas/PanelFiltros'
import Avatar from '../../components/personas/Avatar'
import { exportarPNG, exportarSVG, imprimir } from '../../components/personas/exportarOrganigrama'
import { colaboradoresData } from './colaboradoresData'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import {
  empresa, sucursales, getUnidad, nuevoId, tipoDe, TIPOS_CARGO, esTipoDeclarado, nivelesDe,
  buildOrgTree, filasTabla, buscarCargos, normalizar, unidadesRaiz, subunidadesDe,
  tarjetaUnidad, cargosDeUnidad, filtrarPorSucursal, TODAS_SUCURSALES, estaEnSucursal,
  eliminarCargo, eliminarUnidad, bloqueoUnidad, unidadesPadrePosibles, cabezaDe, paresDe, moverEntrePares,
  filtrarPorUnidad, cargosEnRama, TODAS_UNIDADES,
  ocupantesDe, funcionalesDe, areasQueApoya, apoyosDeUnidad,
  coincideCargo, recortesActivos, estiloColores,
  filaDeCargo,
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
  staff: { clase: 'staff', Icon: Users, propio: true },
  outsourcing: { clase: 'ext', Icon: Briefcase, propio: true },
}

const tipoVisual = tipo => {
  const base = TIPOS_CARGO.find(t => t.key === tipo) || TIPOS_CARGO[0]
  return { ...base, ...PINTA_TIPO[base.key] }
}

/* Los tres tipos, tal cual se guardan: no hay ninguno que la pantalla deduzca por su cuenta.
   Los subtítulos hablan en el idioma del contrato —planilla, servicios, prestador de
   servicios— porque es como lo nombra RRHH al dar de alta. */
const TIPOS_PUESTO = [
  { key: 'colaborador', label: 'Colaborador', sub: 'En planilla, baja en la línea', Icon: User },
  { key: 'staff', label: 'Staff', sub: 'Asiste al costado de la línea', Icon: Users },
  { key: 'outsourcing', label: 'Outsourcing', sub: 'Lo cubre un prestador externo', Icon: Briefcase },
]

/* El formulario del puesto va en pestañas, como en el diseño: son preguntas de naturaleza
   distinta y verlas todas de una vez es lo que lo hacía pesado. Solo hay pestañas para lo que
   el modelo sabe contestar: "Perfil" y "Laboral" del diseño quedan fuera hasta que exista el
   dato detrás, porque una pestaña vacía promete algo que no está.

   "Básico" —código y nombre— era una pestaña de dos renglones, y encima la única que casi no
   movía el dibujo del costado: se abría el formulario y parecía que no pasaba nada. Sus dos
   campos se subieron acá arriba, así lo primero que se ve es qué es el puesto y dónde va, y
   el dibujo se arma mientras se escribe. */
const PESTANAS_CARGO = [
  { key: 'cargo', label: 'Cargo', Icon: ClipboardList },
  { key: 'funcional', label: 'Funcional', Icon: Share2 },
  { key: 'donde', label: 'Localización', Icon: MapPin },
]

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

/* De quién depende un área que todavía no tiene a nadie adentro. Mientras está vacía el dato
   vive en la unidad —no hay cargo donde ponerlo—; el primer puesto que entra lo hereda, y a
   partir de ahí el dueño del dato es el cargo. Así el área no se muda de sitio en el dibujo
   por el solo hecho de poblarse. */
const jefeDeUnidadVacia = (unidadId, org) => {
  const u = getUnidad(unidadId, org)
  if (!u || org.cargos.some(c => c.unidadId === unidadId)) return null
  return u.mandoId ?? null
}

/* ---------- Modal: alta y detalle de un cargo ---------- */

/* `base` son los valores que el gesto ya decidió: al soltar una cajita sobre un cuadro, de
   quién depende y en qué unidad queda ya están dichos, y volver a preguntarlos sería deshacer
   con el formulario lo que se acaba de hacer con la mano. */
function CargoModal({ cargo, base, sedeActiva, onGuardar, onEliminar, onCerrar, org, abrirEnEdicion }) {
  const nuevo = !cargo
  /* SE ABRE PARA MIRAR, NO PARA CAMBIAR. Un cuadro del organigrama se abre muchas más veces
     para consultarlo que para editarlo, y entrando directo al formulario cualquier descuido
     —rozar un desplegable y guardar— muda a alguien de área sin que nadie lo haya pedido.
     Ahora el doble clic abre la ficha y editar es un paso que se pide.

     Un alta no tiene nada que mirar todavía: nace en edición. Y el lápiz de las otras vistas
     también entra directo —es un botón que dice "Editar", apretarlo no tiene nada de
     accidental—: lo que se protege es el gesto de abrir, no el de pedir el editor. */
  const [editar, setEditar] = useState(nuevo || abrirEnEdicion)
  const soloVer = !editar
  /* Lo que había al abrir. Sirve para saber si se escribió algo y no cerrar el formulario de un
     clic al costado: perder seis campos por errarle al modal por veinte píxeles no es un
     accidente del usuario, es un descuido del diseño. */
  const inicial = useRef(null)
  const [hoja, setHoja] = useState('cargo')
  const [form, setForm] = useState(() => ({
    codigo: cargo?.codigo || '',
    nombre: cargo?.nombre || '',
    /* Los valores por defecto salen de la estructura que hay, no de ids sembrados: en un
       organigrama recién empezado no existe ni 'gg' ni una unidad en la segunda posición. */
    unidadId: cargo?.unidadId || base?.unidadId || org.unidades[0]?.id || '',
    /* El primer cargo de un área vacía nace colgado de quien esa área declaró como su mando:
       es el jefe que el dibujo ya le estaba dando al área. */
    reportaA: cargo ? cargo.reportaA
      : base && 'reportaA' in base ? base.reportaA
      : (jefeDeUnidadVacia(base?.unidadId || org.unidades[0]?.id, org) ?? org.cargos[0]?.id ?? null),
    ocupantes: cargo ? ocupantesDe(cargo) : [],
    /* Áreas donde trabaja sin pertenecer. Al cambiar de área propia hay que sacarla de acá si
       estaba marcada, o el puesto quedaría apoyándose a sí mismo. */
    funcionales: cargo ? funcionalesDe(cargo).map(f => ({ ...f })) : [],
    /* De qué clase es el puesto. Se declara y se guarda: no hay ninguno que la pantalla
       deduzca de la estructura. */
    tipo: cargo ? tipoDe(cargo) : (base?.tipo || 'colaborador'),
    /* Cuánto pesa el puesto. Se guarda el id del peldaño y no su número: reordenar el catálogo
       renumera todo solo, sin tocar un solo cargo. Vacío = sin declarar. */
    grado: cargo?.grado ?? base?.grado ?? null,
    /* Si se está mirando una sede concreta, el puesto nuevo nace en esa sede y no en todas: es
       la respuesta a "¿para qué sucursal estoy creando?".

       Sin sede activa nace con la lista VACÍA y no con las sedes enumeradas: las dos se ven
       igual hoy, pero la lista vacía quiere decir "en todas" y sigue valiendo cuando mañana se
       abra la novena; enumerarlas dejaría al puesto fuera de esa. */
    /* Una sola, siempre. Un dato viejo de cuando un cargo podía existir en varias sedes se
       queda con la primera. */
    sucursalIds: (cargo?.sucursalIds || (sedeActiva ? [sedeActiva.id] : [])).slice(0, 1),
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
  const [buscaSede, setBuscaSede] = useState('')
  /* El buscador va siempre, sin umbral de "a partir de N sedes": una lista corta se busca igual
     y el campo no estorba. */
  const sedesFiltradas = sucursales
    .filter(sc => `${sc.nombre} ${sc.ciudad}`.toLowerCase().includes(buscaSede.trim().toLowerCase()))
  /* "Toda la empresa" no es un modo aparte sino un valor: ninguna sede declarada. Así lo lee el
     resto del sistema (`estaEnSucursal`) y así se guarda. */
  const enTodasLasSedes = form.sucursalIds.length === 0
  /* Cuántos puestos existen ya en cada sede. El que se está editando no se cuenta: la pregunta
     es qué hay allá, no qué va a haber cuando se guarde. Sale de `estaEnSucursal`, que es la
     misma regla que usa el filtro de la pantalla —contarlos a mano acá sería una segunda verdad
     que se despega de la primera en cuanto una cambie. */
  const puestosPorSede = useMemo(() => Object.fromEntries(sucursales.map(sc => [
    sc.id,
    org.cargos.filter(c => c.id !== cargo?.id && estaEnSucursal(c, sc.id)).length,
  ])), [org.cargos, cargo?.id])

  const coordinaciones = cargo ? coordinacionesDe(cargo.id, org) : []
  const ocupantes = form.ocupantes
    .map(id => colaboradoresData.find(pe => pe.id === id))
    .filter(Boolean)
  const t = tipoVisual(form.tipo)
  const externo = form.tipo === 'outsourcing'
  /* Los dos obligatorios quedaron en pestañas distintas, así que no alcanza con saber que
     falta algo: hay que saber en cuál. */
  const faltaEn = { cargo: !form.nombre.trim() || !form.unidadId }
  const valido = !faltaEn.cargo

  /* Solo se guarda lo que no se puede deducir: Jefe y Colaborador salen de la propia
     estructura, así que declararlos sería dejar en el dato una etiqueta que se contradice
     sola en cuanto alguien mueve un cargo de lugar. */
  /* El clic en el fondo cierra solo si no se tocó nada. Es el punto medio entre cerrarse de
     un roce —y perder lo escrito— y obligar a apuntarle a la X aunque el formulario esté
     intacto. */
  if (inicial.current === null) inicial.current = JSON.stringify(form)
  const sucio = JSON.stringify(form) !== inicial.current
  /* En la ficha el clic afuera cierra siempre: la guarda existe para no perder lo escrito, y
     mirando no se escribió nada. */
  const intentarCerrar = () => { if (soloVer || !sucio) onCerrar() }

  /* Cancelar sobre un cargo que ya existe vuelve a la ficha con los valores de antes: es el
     revés exacto de "Editar". Cerrar del todo es lo que hace la X de la cabecera. */
  const cancelar = () => {
    if (nuevo) return onCerrar()
    setForm(JSON.parse(inicial.current))
    setEditar(false)
  }

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
    /* Se descartan las filas a medio llenar y la propia área: una asignación sin área no dice
       nada, y apoyarse a uno mismo tampoco. */
    funcionales: form.funcionales
      .filter(f => f.unidadId && f.unidadId !== form.unidadId)
      .map(f => ({ unidadId: f.unidadId, reportaA: f.reportaA || null })),
    /* El campo de las plazas se limpia: un dato viejo con cupo cinco haría que `ocupantesDe`
       y el dibujo hablaran de casillas que ya no existen. */
    plazas: null,
    plazasSedes: null,
    /* El campo viejo se limpia para que no queden dos verdades sobre quién ocupa el puesto. */
    ocupanteId: null,
    /* Los tres se declaran, así que el tipo se guarda tal cual viene del formulario. */
    tipo: form.tipo,
    grado: form.grado || null,
    sucursalIds: form.sucursalIds.slice(0, 1),
  }, mismaFila ? form.posicion : null)

  return (
    <div className="pl-overlay" onClick={intentarCerrar}>
      <div
        className={`pl-modal og-modal-puesto${soloVer ? ' og-modal-ficha' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <CabeceraModal
          /* El título no puede prometer un sitio donde se mira sin riesgo y ser un editor:
             cada modo dice el suyo. */
          Icon={nuevo ? Plus : editar ? Pencil : User}
          titulo={nuevo ? 'Nuevo cargo / puesto' : editar ? 'Editar cargo / puesto' : 'Detalle del cargo / puesto'}
          onCerrar={onCerrar}
        />

        {/* Dos columnas: el dibujo a la izquierda y los campos a la derecha, cada una con su
            propio scroll. El dibujo no se va de la pantalla al bajar hasta el ocupante —que es
            justo cuando cambia— ni empuja los campos hacia abajo. */}
        <div className="og-puesto-cuerpo">
          {/* Dos dibujos para dos preguntas. El del editor muestra la fila de hermanos, que es
              lo que se elige con "Orden entre sus pares"; el de lectura baja por la línea de
              mando y muestra los reportes, que es lo que uno viene a ver. */}
          {soloVer ? <PreviaLugar cargo={cargo} org={org} /> : (
            <PreviaPuesto
              form={form}
              org={org}
              cargoId={cargo?.id}
              ocupantes={ocupantes}
              nuevo={nuevo}
            />
          )}

          {/* MIRANDO, LA HOJA DE DATOS; EDITANDO, EL FORMULARIO DE SIEMPRE. Son dos preguntas
              distintas —qué es este puesto y qué quiero cambiarle— y por eso no comparten
              composición. El dibujo de la izquierda es el mismo en los dos: es lo único que
              contesta las dos. */}
          {soloVer ? <HojaCargo cargo={cargo} org={org} /> : (
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
            {hoja === 'cargo' && (
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


              <label className="pl-label">
                <span className="og-label-fila">
                  {/* "Unidad organizacional" a secas, con la pestaña Funcional al lado hablando
                      también de áreas, no decía cuál de las dos es esta. */}
                  Unidad organizacional a la que pertenece <em className="og-req">*</em>
                  <AyudaCampo>
                    Su área de verdad: la que lo evalúa y donde se lo cuenta. Si además ayuda a
                    otras, eso se declara en la pestaña <strong>Funcional</strong>.
                  </AyudaCampo>
                </span>
                <SelectorLista
                  valor={form.unidadId}
                  /* Cambiar de área puede cambiar el jefe: si la elegida está vacía, el puesto
                     entra colgado del mando que ella declaró. */
                  onCambio={v => setForm(f => ({ ...f, unidadId: v, reportaA: jefeDeUnidadVacia(v, org) ?? f.reportaA }))}
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
                    const activa = o.key === form.tipo
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
              </div>

              {/* NIVEL DE MANDO. Va acá abajo del tipo porque son las dos preguntas que el
                  puesto contesta sobre sí mismo —de qué clase es y cuánto pesa— y son ejes
                  distintos: un staff puede ser del nivel más alto.

                  Es opcional, y a propósito: los puestos guardados antes de que el campo
                  existiera no tienen ninguno, y forzar a completarlos convertiría abrir
                  cualquier ficha vieja en una tarea. Sin declarar, el cuadro no se mueve de su
                  fila y la tabla lo dice en gris. */}
              <label className="pl-label">
                <span className="og-label-fila">
                  Nivel de mando
                  <AyudaCampo>
                    Dice <strong>cuánto pesa</strong> el puesto en la empresa, y es independiente
                    de quién reporta a quién: dos cargos sin jefe pueden tener niveles distintos,
                    y ahí el nivel es lo único que los diferencia. En el dibujo, el que declara un
                    nivel más bajo que sus pares se dibuja medio cuadro más abajo, en la misma
                    fila.
                  </AyudaCampo>
                </span>
                <SelectorLista
                  valor={form.grado}
                  onCambio={v => set('grado', v)}
                  vacia="Sin nivel"
                  placeholder="Sin nivel"
                  opciones={nivelesDe(org).map((n, i) => ({
                    id: n.id,
                    nombre: n.nombre,
                    /* El número no se guarda: sale del orden del catálogo. Se muestra porque es
                       lo que hace comparable un nivel con otro de un vistazo. */
                    detalle: `Nivel ${i + 1} de ${nivelesDe(org).length}`,
                  }))}
                />
              </label>

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

            {hoja === 'funcional' && (
            <section className="og-bloque">
              <p className="og-modal-nota og-nota-suelta">
                Un puesto <strong>pertenece</strong> a un área —la que se elige en <strong>Cargo</strong>— y puede{' '}
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
                              la pestaña <strong>Cargo</strong>.
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

                {/* UNA SOLA SEDE. Un puesto es un puesto: tiene su código y está en un lugar. Se
                    elegían varias cuando un cargo era un cuadro con N plazas —"una gerencia
                    regional es un cargo con dos sedes"—, y eso se cayó con el cupo: si la
                    gerencia atiende dos ciudades y hay dos personas, son dos puestos.

                    Sigue siendo una lista a la vista y no un desplegable: la pestaña tiene una
                    columna entera libre, así que esconder la respuesta detrás de un clic no
                    compra nada. La reja scrollea y no crece: una empresa con cuarenta sucursales
                    no puede estirar el modal. */}
              <div className="pl-label">
                <span className="og-label-fila">
                  Sede a la que pertenece
                  <AyudaCampo>
                    El organigrama es uno solo: lo que cambia por sede es qué puestos existen en
                    cada una. Si el mismo trabajo se hace en dos ciudades, son{' '}
                    <strong>dos puestos</strong>, cada uno con su código y su gente.
                  </AyudaCampo>
                </span>

                {/* "Toda la empresa" no es una sede más sino la respuesta de los puestos que no
                    están atados a ninguna —una gerencia general—: va arriba y separada por una
                    línea. En el dato es la lista vacía, que además es lo que hace que una sede
                    nueva no deje afuera a nadie. */}
                <button
                  type="button"
                  className={`og-fila-op og-fila-op-cabeza${enTodasLasSedes ? ' on' : ''}`}
                  onClick={() => set('sucursalIds', [])}
                >
                  <span className="og-op-box">{enTodasLasSedes && <Check size={12} />}</span>
                  <span className="og-op-txt">
                    <strong>Toda la empresa</strong>
                    <em>No pertenece a ninguna sucursal en particular</em>
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
                    const marcada = form.sucursalIds[0] === sc.id
                    const cuantos = puestosPorSede[sc.id] || 0
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        className={`og-fila-op${marcada ? ' on' : ''}`}
                        /* Elegir una reemplaza a la anterior: no se acumulan. Volver a tocar la
                           elegida no la destilda —el puesto tiene que estar en algún lado— y la
                           salida es "Toda la empresa", que está arriba. */
                        onClick={() => set('sucursalIds', [sc.id])}
                      >
                        <span className="og-op-box">{marcada && <Check size={12} />}</span>
                        {/* La ciudad manda y el nombre va debajo: dos sedes se llaman
                            "Sucursal" y lo único que las distingue es dónde están. Es además
                            como las nombra el resto del producto y como se leen en la barra de
                            la pantalla. */}
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

                {nuevo && sedeActiva && form.sucursalIds[0] === sedeActiva.id && (
                  <p className="og-modal-nota">
                    Viene elegida <strong>{sedeActiva.ciudad}</strong> porque es la sede que estás viendo.
                  </p>
                )}
              </div>
            </section>

            )}

          </div>
          </div>
          )}
        </div>

        <div className="pl-modal-footer">
          {/* En la ficha no hay "Cancelar" ni "Eliminar": no hay nada que cancelar, y borrar es
              una acción del editor —para llegar a ella hay que haber pedido editar—. */}
          {soloVer ? (
            <>
              {/* ELIMINAR VIVE EN EL DETALLE, no en el editor: borrar es una acción sobre el
                  puesto y no sobre el borrador que se está escribiendo. En el editor competía
                  con "Guardar cambios" —dos botones a un dedo de distancia, uno guarda y el
                  otro destruye— y encima se llevaba por delante lo tecleado.

                  Va al extremo opuesto de la fila: separado de los otros dos, no se aprieta
                  queriendo cerrar. */}
              <button className="pl-btn-delete og-btn-eliminar" onClick={() => onEliminar(cargo)}>
                <Trash2 size={13} /> Eliminar
              </button>
              <button className="pl-btn-cancel" onClick={onCerrar}>Cerrar</button>
              <button className="pl-btn-save og-btn-editar" onClick={() => setEditar(true)}>
                <Pencil size={13} /> Editar
              </button>
            </>
          ) : (
            <>
              <button className="pl-btn-cancel" onClick={cancelar}>Cancelar</button>
              <button className="pl-btn-save" disabled={!valido} onClick={guardar}>
                {nuevo ? 'Crear cargo / puesto' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* Qué se lleva puesto cambiar de quién depende una unidad. Devuelve null cuando no arrastra
   nada, y entonces no se dice nada: avisar de un cambio que no ocurre entrena a ignorar los
   avisos. Ver la misma idea en el resto del constructor.

   El área con cargos no guarda su mando aparte: el dato es el "Reporta a" de su cabeza, y este
   aviso es el que dice en voz alta que tocar el campo del área va a mover ese cargo. */
function avisoDeMudanza(unidad, form, org) {
  if (!unidad) return null
  const cabeza = cabezaDe(unidad.id, org)
  if (!cabeza) return null
  const mando = form.mandoId ?? null
  if (mando === (cabeza.reportaA ?? null)) return null
  const jefe = mando ? org.cargos.find(c => c.id === mando) : null
  if (jefe) return `Al guardar, ${cabeza.nombre} pasa a reportar a ${jefe.nombre}.`
  const donde = form.padreId ? getUnidad(form.padreId, org)?.nombre ?? 'su área' : empresa.nombre
  return `Al guardar, ${cabeza.nombre} deja de tener jefe y ${unidad.nombre} cuelga de ${donde}.`
}

/* ---------- Modal: alta y detalle de una unidad organizacional ---------- */

function UnidadModal({ unidad, base, org, onGuardar, onEliminar, onCerrar, onAbrirCargo, abrirEnEdicion }) {
  const nueva = !unidad
  /* La misma regla que el cargo: se abre para mirar. Cambiar "Dentro de" o "Bajo el mando de"
     sin querer no corrige un nombre, mueve el área entera del dibujo y le cambia el jefe a su
     cabeza. Ver el modal del cargo. */
  const [editar, setEditar] = useState(nueva || abrirEnEdicion)
  const soloVer = !editar
  const [form, setForm] = useState(() => ({
    codigo: unidad?.codigo || '',
    nombre: unidad?.nombre || '',
    corto: unidad?.corto || '',
    padreId: unidad ? unidad.padreId
      : base && 'padreId' in base ? base.padreId
      : (org.unidades[0]?.id ?? null),
    /* De qué cargo depende el área. Mientras no tiene cargos adentro el dato vive acá, porque
       no hay dónde más ponerlo; en cuanto tiene cabeza, el dueño del dato es esa cabeza y el
       campo lo lee de ella. Una sola verdad, mostrada desde el lado en que se está parado. */
    mandoId: (unidad ? cabezaDe(unidad.id, org)?.reportaA ?? unidad.mandoId : base?.mandoId) ?? null,
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valido = form.nombre.trim().length > 0
  const inicial = useRef(null)
  if (inicial.current === null) inicial.current = JSON.stringify(form)
  const intentarCerrar = () => { if (soloVer || JSON.stringify(form) === inicial.current) onCerrar() }
  const cancelar = () => {
    if (nueva) return onCerrar()
    setForm(JSON.parse(inicial.current))
    setEditar(false)
  }
  const bloqueo = unidad ? bloqueoUnidad(unidad.id, org) : null
  const apoyos = unidad ? apoyosDeUnidad(unidad.id, org) : []
  const padres = unidadesPadrePosibles(unidad?.id, org)
  const mudanza = avisoDeMudanza(unidad, form, org)
  /* Los cargos entre los que se elige el mando: los del área que la contiene. El jefe de un
     área es alguien de la de arriba; ofrecer el organigrama entero convertiría el campo en una
     línea de mando paralela.

     Sin staff ni outsourcing: la leyenda del gráfico ya dice que el staff "asiste sin mandar",
     y el dibujo lo cumple al pie —un cargo lateral se dibuja al costado y no lleva nada
     colgando—, así que un área puesta bajo su mando desaparecía del organigrama entero. */
  const cargosDelPadre = form.padreId
    ? org.cargos.filter(c => c.unidadId === form.padreId && !esTipoDeclarado(tipoDe(c, org)))
    : []

  /* Un desplegable plano con veinte unidades no dice dónde queda la que se está colocando:
     "Marketing Digital" y "Marketing" se leen como hermanas cuando una está dentro de la otra.
     Van con su `padreId` y el desplegable las dibuja como árbol plegable: una empresa grande
     llega a cincuenta áreas, y cincuenta renglones abiertos no se recorren, se sufren. */
  const permitidas = new Set(padres.map(u => u.id))
  const opciones = org.unidades
    .filter(u => permitidas.has(u.id))
    .map(u => ({ id: u.id, nombre: u.nombre, padreId: u.padreId }))


  return (
    <div className="pl-overlay" onClick={intentarCerrar}>
      <div className="pl-modal og-modal-puesto og-modal-unidad" onClick={e => e.stopPropagation()}>
        <CabeceraModal
          Icon={nueva ? FolderPlus : editar ? Pencil : Building2}
          titulo={nueva ? 'Nueva unidad organizacional' : editar ? 'Editar la unidad' : 'Detalle de la unidad'}
          onCerrar={onCerrar}
        />

        {/* La misma forma que el detalle de un cargo: el dibujo a la izquierda y los campos a
            la derecha. Antes el costado contaba con texto sangrado dónde iba a quedar la
            unidad —"SoulyHR › esta unidad"—, que es justo lo que un organigrama existe para
            no tener que hacer. */}
        <div className="og-puesto-cuerpo">
          <PreviaUnidad form={form} org={org} unidad={unidad} nueva={nueva} empresa={empresa} />

          {soloVer ? (
            <HojaUnidad unidad={unidad} org={org} empresa={empresa} onAbrirCargo={onAbrirCargo} />
          ) : (
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
            <span className="og-label-fila">Nombre de la unidad <em className="og-req">*</em></span>
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
              {/* Decía "es contención, no mando", que es la idea correcta contada en el idioma
                  del modelo de datos: hay que saber qué significa contención para entenderla.
                  Un ejemplo de área adentro de otra la explica sola. */}
              <AyudaCampo>
                El área que la contiene. Por ejemplo, <strong>Selección</strong> va dentro de{' '}
                <strong>Recursos Humanos</strong>.<br /><br />
                Dice dónde está, no de quién depende: eso se elige en el campo de abajo.
              </AyudaCampo>
            </span>
            <SelectorLista
              valor={form.padreId}
              /* Cambiar de madre invalida el mando: el cargo elegido era de la otra área. */
              onCambio={v => setForm(f => ({ ...f, padreId: v, mandoId: null }))}
              vacia={`Ninguna: cuelga de ${empresa.nombre}`}
              opciones={opciones}
              arbol
            />
          </div>

          {/* DE QUIÉN DEPENDE, que es distinto de dónde está. "Dentro de" agrupa; esto dibuja la
              línea. Se intentó deducirlo —colgar el área de la cabeza de su madre— y se cae en
              cuanto la madre tiene tres cargos sin jefe: el dibujo elegía uno adivinando. */}
          <div className="pl-label">
            <span className="og-label-fila">
              Bajo el mando de
              <AyudaCampo>
                El cargo del que depende esta área. Por ejemplo, <strong>Ventas</strong> bajo el
                mando del <strong>CEO</strong>: así se dibuja debajo de él y no a su lado.
                <br /><br />
                Se elige entre los cargos del área que la contiene.
              </AyudaCampo>
            </span>
            <SelectorLista
              valor={form.mandoId}
              onCambio={v => set('mandoId', v)}
              vacia="Nadie: cuelga del área"
              opciones={cargosDelPadre.map(c => ({
                id: c.id,
                nombre: c.nombre,
                detalle: filaDeCargo(c, org).ocupantes[0]?.name || 'Vacante',
              }))}
            />

            {!form.padreId && (
              <p className="og-field-nota">
                Al colgar de {empresa.nombre} el área no depende de ningún cargo.
              </p>
            )}
            {form.padreId && cargosDelPadre.length === 0 && (
              <p className="og-field-nota">
                {getUnidad(form.padreId, org)?.nombre} todavía no tiene cargos: cuando tenga uno
                se podrá elegir aquí.
              </p>
            )}

            {/* El organigrama tiene dos jerarquías: la de cargos y la de unidades. El dibujo
                principal se arma con la de cargos, así que cambiar el mando de un área que ya
                tiene gente le cambia el jefe a su cabeza. Se dice acá, antes de guardar. */}
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
                  entre sus cargos: se declara en el formulario de cada puesto, en la pestaña{' '}
                  <strong>Funcional</strong>.
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
          )}

        </div>

        <div className="pl-modal-footer">
          {soloVer ? (
            <>
              {/* Bloqueada, el motivo se lee al pasar por encima: un botón apagado sin
                  explicación se lee como una función rota. */}
              <button
                className="pl-btn-delete og-btn-eliminar"
                disabled={!!bloqueo}
                title={bloqueo || undefined}
                onClick={() => onEliminar(unidad)}
              >
                <Trash2 size={13} /> Eliminar
              </button>
              <button className="pl-btn-cancel" onClick={onCerrar}>Cerrar</button>
              <button className="pl-btn-save og-btn-editar" onClick={() => setEditar(true)}>
                <Pencil size={13} /> Editar
              </button>
            </>
          ) : (
            <>
          <button className="pl-btn-cancel" onClick={cancelar}>Cancelar</button>
          <button
            className="pl-btn-save"
            disabled={!valido}
            onClick={() => onGuardar({
              codigo: form.codigo.trim() || null,
              nombre: form.nombre.trim(),
              corto: form.corto.trim() || form.nombre.trim(),
              padreId: form.padreId,
              mandoId: form.mandoId ?? null,
            })}
          >
            {nueva ? 'Crear unidad' : 'Guardar cambios'}
          </button>
            </>
          )}
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

function CargoCard({ fila, onAbrir, funcional }) {
  const { cargo, tipo, ocupantes, vacante, jefeNombre, sedes } = fila
  const t = tipoVisual(tipo)
  const externo = tipo === 'outsourcing'
  const clases = ['og-cc']
  /* Mismo reparto que en el árbol: el color es el tipo de puesto y la etiqueta es la vacante.
     El amarillo solo entra donde no hay color de tipo que pisar. Se pregunta por el color
     propio y no por la lateralidad: el outsourcing dejó de ser lateral y seguía teñido. */
  if (vacante && !t.propio) clases.push('og-cc-vacante')
  if (t.propio) clases.push(`og-cc-${t.clase}`)
  /* Prestado de otra área: gana sobre el color de tipo, porque lo que hace falta saber acá es
     que no es un puesto de esta área. */
  if (funcional) clases.push('og-cc-func')

  return (
    <div className={clases.join(' ')} onDoubleClick={() => onAbrir(cargo)}>
      {vacante && <span className="og-cc-tag">Vacante</span>}
      {/* El lápiz dice "Editar" y va derecho al editor. El doble clic sobre la tarjeta abre el
          detalle bloqueado: es el gesto que se dispara sin querer, no este. */}
      <button className="og-cc-edit" onClick={() => onAbrir(cargo, true)} title="Editar cargo"><Pencil size={12} /></button>

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

      {/* Un puesto pertenece a una sede; sin ninguna declarada, a ninguna en particular. */}
      <div className="og-cc-sedes">
        <MapPin size={10} />
        {sedes.length === 0
          ? <span>Toda la empresa</span>
          : <span>{sedes[0].ciudad}</span>}
      </div>

      <div className="og-cc-sep" />
      {ocupantes.length ? (
        <>
          <div className="og-cc-label">Colaborador asignado</div>
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
  /* Los que apoyan a esta área desde afuera. Se arma la misma fila que usan las tarjetas de
     cargo para no tener dos formas de describir un puesto. */
  const apoyosAqui = useMemo(
    () => (actual ? apoyosDeUnidad(actual, org).map(a => ({
      ...filaDeCargo(a.cargo, org),
    })) : []),
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

            {/* QUIÉNES APOYAN A ESTA ÁREA desde afuera. En sección aparte y no mezclados con los
                cargos: no son del área y no entran en su cuenta, igual que en el dibujo no suman
                al conteo de la píldora. La tarjeta va en azul, que es el color con el que se
                dibujan sus cuadros prestados. */}
            {apoyosAqui.length > 0 && (
              <>
                <Seccion
                  titulo="Apoyo funcional"
                  conteo={`${apoyosAqui.length} ${apoyosAqui.length === 1 ? 'puesto de otra área' : 'puestos de otras áreas'}`}
                />
                <div className="og-grid">
                  {apoyosAqui.map(f => <CargoCard key={`f-${f.cargo.id}`} fila={f} onAbrir={onAbrir} funcional />)}
                </div>
              </>
            )}

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

  /* La misma normalización que el buscador del gráfico: sin tildes ni eñes de un lado ni del
     otro, o "nunez" no encuentra a Núñez y la tabla contesta distinto que el dibujo. */
  const q = normalizar(busca.trim())
  const visibles = useMemo(() => {
    if (!q) return grupos
    const coincide = f =>
      normalizar(f.cargo.nombre).includes(q) ||
      f.ocupantes.some(p => normalizar(p.name).includes(q)) ||
      normalizar(f.unidad?.nombre).includes(q)
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
              {/* Al lado del tipo porque contestan lo mismo sobre el puesto: de qué clase es y
                  cuánto pesa. Es la única vista donde los niveles se comparan de corrido. */}
              <th>Nivel</th>
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
                    <td colSpan={8}>
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
                      <td>
                        <span className="og-pertenece">{f.unidad?.corto || '—'}</span>
                        {/* Las áreas que APOYA, al lado de la que le pertenece. Van en esta
                            columna y no en la de Tipo porque contestan la misma pregunta —en qué
                            áreas está— y porque funcional no es un tipo de puesto: el Community
                            Manager es un colaborador que además ayuda en otra área. En azul y
                            punteadas, el mismo lenguaje que su cuadro en el dibujo. */}
                        {areasQueApoya(f.cargo).map(id => (
                          <span
                            key={id}
                            className="og-pertenece og-pertenece-func"
                            title={`Apoya a ${getUnidad(id, org)?.nombre}`}
                          >
                            {getUnidad(id, org)?.corto || getUnidad(id, org)?.nombre}
                          </span>
                        ))}
                      </td>
                      <td><TipoPill tipo={f.tipo} /></td>
                      {/* Los que no declararon nivel no se esconden ni se les inventa uno: en
                          gris dicen que falta, y esta columna es la lista de lo que falta. */}
                      <td>
                        {f.grado
                          ? <span className="og-nivel-pill">{f.grado.orden} · {f.grado.nombre}</span>
                          : <span className="og-nivel-sin">Sin nivel</span>}
                      </td>
                      <td>
                        {f.ocupantes.length ? (
                          <span className="og-td-persona">
                            <Avatar persona={f.ocupantes[0]} size={22} />
                            {f.ocupantes[0].name}
                          </span>
                        ) : (
                          <span className="og-td-persona">
                            <span className="og-av og-av-vacio"><Minus size={11} /></span>
                            <em className="og-td-vacio">
                              {f.tipo === 'outsourcing' ? 'Sin prestador asignado' : 'Sin colaborador asignado'}
                            </em>
                          </span>
                        )}
                      </td>
                      <td className="og-reporta">{f.jefeNombre || '— Empresa'}</td>
                      <td className="og-td-acc">
                        <button onClick={() => onAbrir(f.cargo, true)} title="Editar cargo"><Pencil size={13} /></button>
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
        <ListaCrear
          titulo="Agregar al organigrama"
          onElegir={o => elegir(o.accion)}
          opciones={[
            {
              id: 'cargo', Icon: User, titulo: 'Cargo / puesto',
              detalle: 'Una posición del organigrama',
              bloqueo: sinAreas ? 'Primero hace falta un área donde ponerlo' : null,
              accion: onCargo,
            },
            {
              id: 'unidad', Icon: Building2, titulo: 'Unidad organizacional',
              detalle: 'Un área que agrupa cargos y otras áreas',
              accion: onUnidad,
            },
          ]}
        />
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
  /* LOS FILTROS, EN UN PANEL. Antes eran dos desplegables en la barra oscura y dos controles
     flotando sobre el dibujo. Se juntaron porque contestan la misma pregunta —qué parte de la
     empresa estoy mirando— y porque en la barra ya no cabía uno más: el de tipo de puesto
     entraba a presión y el de vacantes no tenía dónde. */
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  /* Lista vacía = todos los tipos. Es la ausencia de recorte, no un recorte que no deja pasar
     nada; la misma convención que `sucursalIds` vacío. */
  const [tipos, setTipos] = useState([])
  /* Misma convención que los tipos: lista vacía = todos los niveles, o sea sin recorte. */
  const [grados, setGrados] = useState([])
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  /* Qué parte de la empresa se está mirando. Es un ALCANCE y no una pestaña: "solo Marketing"
     vale igual en el gráfico completo, en la línea de mando y en la vista por áreas, así que
     recorta la estructura antes de dibujar en vez de agregar un modo más. Una pestaña por área
     serían veinte pestañas. */
  const [unidadId, setUnidadId] = useState(TODAS_UNIDADES)

  /* El filtro de sede es un desplegable más y lleva buscador como todos los demás: se limpia al
     cerrarlo para que no reabra filtrado por algo que se escribió hace media hora. */

  const [busca, setBusca] = useState('')
  const [importar, setImportar] = useState(false)
  const [configAbierto, setConfigAbierto] = useState(false)
  const [configMandos, setConfigMandos] = useState(false)
  const [configColores, setConfigColores] = useState(false)
  /* El color vive fuera de la pantalla porque tiene que sobrevivir a recargar: enseñarlo en una
     reunión y que vuelva al azul de fábrica al cambiar de pestaña sería peor que no tenerlo. */
  const [colorMarca, setColorMarca] = useLocalStorage('organigramaColor', COLORES_MARCA[0])
  /* Ver o no los cuadros de apoyo que llegan de otras áreas. Es estado de VISTA —no toca el
     dato— pero se recuerda entre sesiones: quien arma el organigrama estructural los apaga una
     vez y no quiere volver a apagarlos cada vez que entra. */
  const [verFuncionales, setVerFuncionales] = useLocalStorage('organigramaFuncionales', true)
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
  /* TIPO Y ESTADO NO SACAN AL CARGO DEL ÁRBOL. Quitar del dibujo a los que no son staff dejaría
     a sus subordinados colgando de la nada y partiría la línea de mando, que es justo lo que uno
     vino a mirar —es el mismo criterio que ya sigue el buscador del lienzo—. Así que en el
     gráfico apagan el cuadro, y en tarjetas y tabla, donde no hay línea que romper, lo esconden. */
  const recorteBlando = tipos.length > 0 || grados.length > 0 || estadoFiltro !== 'todos'
  const noCoincide = useMemo(
    () => (recorteBlando ? c => !coincideCargo(c, { tipos, grados, estado: estadoFiltro }) : null),
    [recorteBlando, tipos, grados, estadoFiltro],
  )
  const orgListas = useMemo(() => (
    recorteBlando
      ? { ...orgVisible, cargos: orgVisible.cargos.filter(c => coincideCargo(c, { tipos, grados, estado: estadoFiltro })) }
      : orgVisible
  ), [orgVisible, recorteBlando, tipos, grados, estadoFiltro])

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
    /* En "Ver por cargos" solo se dibujan los que tienen jefe funcional: los demás cuelgan de
       la píldora del área, que ahí no existe. El número tiene que contar lo que se va a ver, o
       promete cuadros que no aparecen. */
    return orgVisible.cargos.reduce((n, c) => n + funcionalesDe(c).filter(f => (
      pestana === 'completo' ? true : hay(f.reportaA)
    )).length, 0)
  }, [org, orgVisible, pestana])

  const sede = sucursales.find(s => s.id === sedeId)


  const unidadVista = org.unidades.find(u => u.id === unidadId) || null

  /* Los cuatro recortes en un objeto: el panel los lee juntos y los devuelve en parches, así
     agregar uno nuevo no obliga a pasarle cuatro pares de props más. */
  const filtros = { sedeId, unidadId, tipos, grados, estado: estadoFiltro }
  const cambiarFiltro = parche => {
    if ('sedeId' in parche) setSedeId(parche.sedeId)
    if ('unidadId' in parche) setUnidadId(parche.unidadId)
    if ('tipos' in parche) setTipos(parche.tipos)
    if ('grados' in parche) setGrados(parche.grados)
    if ('estado' in parche) setEstadoFiltro(parche.estado)
  }
  const limpiarFiltros = () => {
    setSedeId(TODAS_SUCURSALES)
    setUnidadId(TODAS_UNIDADES)
    setTipos([])
    setGrados([])
    setEstadoFiltro('todos')
  }
  const nRecortes = recortesActivos(filtros)
  /* Mirando un área, lo que se crea nace ahí. Si no, se crearía en la primera unidad de la lista
     y desaparecería al instante detrás del filtro: se guarda bien y parece que no pasó nada.
     Es la misma respuesta que ya da la sede —"para la que estás viendo"— dicha y modificable en
     el formulario en vez de supuesta en silencio. */
  const baseDelAlcance = unidadVista
    ? { unidadId: unidadVista.id, padreId: unidadVista.id }
    : undefined
  /* QUÉ OFRECE EL "+" DE CADA CUADRO. Son las mismas dos cosas que ofrece el botón de la
     esquina —un cargo y un área— pero dichas desde donde se está parado: en una píldora
     quieren decir "adentro" y en un cuadro quieren decir "debajo". Ese es todo el ahorro:
     el gesto ya contestó en qué área y bajo qué jefe, así que el formulario abre con esos
     dos campos puestos en vez de con dos desplegables que hay que volver a recorrer.

     Se arma aquí y no en el dibujo porque abrir un formulario con valores predecididos es
     cosa de la pantalla; `OrgNodos` solo dibuja. */
  const crearEnNodo = useMemo(() => ({
    deUnidad: u => {
      /* El jefe que le toca a un puesto nuevo del área es la cabeza del área. Mientras el
         área está vacía no hay cabeza y el dato vive en la unidad, en `mandoId`; sin
         ninguno de los dos se omite y decide el formulario, como en cualquier alta. */
      const jefe = cabezaDe(u.id, org)?.id ?? u.mandoId ?? null
      return [
        {
          id: 'cargo', Icon: User, titulo: 'Cargo / puesto aquí',
          detalle: `Un puesto de ${u.nombre}`,
          accion: () => setEditando({
            cargo: null,
            base: jefe ? { unidadId: u.id, reportaA: jefe } : { unidadId: u.id },
          }),
        },
        {
          id: 'unidad', Icon: Building2, titulo: 'Subárea dentro',
          detalle: `Un área que cuelga de ${u.nombre}`,
          accion: () => setEditandoUnidad({ unidad: null, base: { padreId: u.id, mandoId: jefe } }),
        },
      ]
    },
    deCargo: c => [
      {
        id: 'cargo', Icon: User, titulo: 'Cargo que le reporta',
        detalle: `Cuelga de ${c.nombre}, en ${getUnidad(c.unidadId, org)?.nombre ?? 'su área'}`,
        accion: () => setEditando({ cargo: null, base: { reportaA: c.id, unidadId: c.unidadId } }),
      },
      {
        id: 'unidad', Icon: Building2, titulo: 'Área bajo su mando',
        detalle: `Un área nueva que responde a ${c.nombre}`,
        /* La misma regla que ya aplica el desplegable de mando: staff y outsourcing quedan
           fuera. Un área bajo un cuadro lateral desaparecía del dibujo entero, así que el
           motivo se dice en vez de dejar crear algo que no se va a ver. */
        bloqueo: esTipoDeclarado(tipoDe(c))
          ? 'Un puesto de apoyo o tercerizado no encabeza un área'
          : null,
        accion: () => setEditandoUnidad({ unidad: null, base: { padreId: c.unidadId, mandoId: c.id } }),
      },
    ],
  }), [org])

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

  /* BORRAR NO OCURRE AL APRETAR EL BOTÓN. Pide escribir la palabra, que es la misma fricción
     que el resto del producto ya usa para desasignar una ruta o borrar una carpeta.

     El diálogo vive en la pantalla y no dentro de cada modal por dos razones: se dibuja ENCIMA
     del que lo abrió —adentro quedaría recortado por el `overflow` del propio modal— y las dos
     puertas, cargo y unidad, confirman igual. */
  const [borrando, setBorrando] = useState(null)   // { tipo: 'cargo' | 'unidad', obj }

  const confirmarBorrado = () => {
    if (!borrando) return
    if (borrando.tipo === 'cargo') {
      setOrg(prev => eliminarCargo(borrando.obj.id, prev))
      setEditando(null)
    } else {
      setOrg(prev => eliminarUnidad(borrando.obj.id, prev))
      setEditandoUnidad(null)
    }
    setBorrando(null)
  }

  /* Qué se lleva puesto el borrado, dicho ANTES. Los reportes de un cargo no se borran con él:
     suben un escalón y quedan colgando de su jefe, y eso hay que leerlo antes de escribir la
     palabra, no descubrirlo mirando el dibujo después. */
  const avisoDeBorrado = () => {
    if (!borrando) return null
    if (borrando.tipo === 'unidad') {
      return (
        <>
          ¿Eliminar la unidad <strong>{borrando.obj.nombre}</strong>? Está vacía —sin cargos ni
          sub-unidades—, así que no arrastra nada más. No se puede deshacer.
        </>
      )
    }
    const c = borrando.obj
    const reportes = org.cargos.filter(x => x.reportaA === c.id).length
    const jefe = c.reportaA ? org.cargos.find(x => x.id === c.reportaA)?.nombre : null
    const quien = colaboradoresData.find(pe => pe.id === ocupantesDe(c)[0])
    return (
      <>
        ¿Eliminar el puesto <strong>{c.nombre}</strong>? No se puede deshacer.
        {reportes > 0 && (
          <>
            {' '}Sus {reportes} {reportes === 1 ? 'reporte' : 'reportes'}{' '}
            {reportes === 1 ? 'pasa' : 'pasan'} a depender de{' '}
            {jefe ? <strong>{jefe}</strong> : <>nadie: {reportes === 1 ? 'queda' : 'quedan'} como raíz</>}.
          </>
        )}
        {quien && <> <strong>{quien.name}</strong> se queda sin puesto en el organigrama.</>}
      </>
    )
  }

  const guardarUnidad = form => {
    const anterior = editandoUnidad.unidad
    setOrg(prev => {
      const unidades = anterior
        ? prev.unidades.map(u => (u.id === anterior.id ? { ...u, ...form } : u))
        : [...prev.unidades, { id: nuevoId('area', prev.unidades), ...form }]

      /* El mando declarado por el área y el "Reporta a" de su cabeza son el mismo dato visto
         desde los dos lados. Guardar por los dos a la vez es lo que evita que se contradigan:
         sin esto, el área se movía en "Ver por unidades" y en el gráfico —que se arma con la
         jerarquía de cargos— se quedaba donde estaba. Se recuelga solo la cabeza; todo lo que
         colgaba de ella la sigue sin tocar nada más. */
      const cabeza = anterior ? cabezaDe(anterior.id, prev) : null
      const mando = form.mandoId ?? null
      if (!cabeza || (cabeza.reportaA ?? null) === mando) return { ...prev, unidades }
      return {
        ...prev,
        unidades,
        cargos: prev.cargos.map(c => (c.id === cabeza.id ? { ...c, reportaA: mando } : c)),
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



  return (
    /* Dos juegos de color y no se pisan: `--og-marca` tiñe las SUPERFICIES —la barra, la
       píldora de cada área— y los `--og-*-el` son la LEYENDA, que dice qué es cada puesto. */
    <div className="og-page" style={{ '--og-marca': colorMarca, ...estiloColores(org) }}>
      {/* BARRA SUPERIOR */}
      <div className="og-topbar">
        <span className="og-empresa-nombre">{empresa.nombre}</span>

        {/* Los dos filtros como un grupo: contestan la misma pregunta —qué parte de la empresa
            estoy mirando— y separados por el mismo hueco que las acciones se leían como seis
            botones sueltos en fila. */}
        {/* UN BOTÓN EN LUGAR DE DOS DESPLEGABLES. Los recortes se eligen en el panel; acá
            queda el número, que es lo único que hace falta saber sin abrirlo. */}
        <button
          className={`og-filtrar${filtrosAbiertos ? ' on' : ''}`}
          onClick={() => setFiltrosAbiertos(v => !v)}
          aria-expanded={filtrosAbiertos}
        >
          <SlidersHorizontal size={14} />
          Filtrar
          {nRecortes > 0 && <span className="og-filtrar-n">{nRecortes}</span>}
        </button>

        <div className="og-topbar-actions">
          /* El color de la empresa se mudó a "Configurar colores": eran los dos juegos de color
             del organigrama repartidos en dos botones distintos de la misma barra, y nadie tenía
             por qué adivinar que la leyenda y la marca eran cosas distintas. */
          {/* Exportar. Tres formatos porque son tres usos: la imagen que se pega en una
              presentación, el archivo que escala sin pixelarse, y el papel. */}
          <div className="og-marca">
            <button className="og-marca-btn" onClick={() => setExportAbierto(v => !v)} disabled={!!exportando} title="Exportar el organigrama">
              <FileDown size={13} />
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

          {/* CONFIGURACIÓN. Mismo menú que Exportar y no un botón que abre el modal derecho:
              hoy hay una sola cosa que configurar, pero son ajustes de cómo se comporta el
              organigrama para ESTA empresa —y van a ser más—. Un botón directo habría que
              convertirlo en menú a la segunda, y para entonces ya está aprendido dónde estaba. */}
          <div className="og-marca">
            <button
              className="og-marca-btn og-config-btn"
              onClick={() => setConfigAbierto(v => !v)}
              aria-expanded={configAbierto}
              title="Configuración del organigrama"
            >
              <Settings size={14} />
            </button>
            {configAbierto && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setConfigAbierto(false)} />
                <div className="og-marca-menu og-export-menu">
                  <div className="og-marca-hd">Configuración</div>
                  <button className="og-export-op" onClick={() => { setConfigAbierto(false); setConfigMandos(true) }}>
                    <Layers size={14} />
                    <div>
                      <strong>Configurar mandos</strong>
                      <small>Los niveles con los que tu empresa mide el peso de un puesto</small>
                    </div>
                  </button>
                  <button className="og-export-op" onClick={() => { setConfigAbierto(false); setConfigColores(true) }}>
                    <Palette size={14} />
                    <div>
                      <strong>Configurar colores</strong>
                      <small>El tono de cada significado de la leyenda</small>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button className="og-import" onClick={() => setImportar(true)} title="Importar el organigrama desde un Excel">
            <FileUp size={13} /> <span className="og-seg-txt">Importar</span>
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

      <FichasFiltro
        filtros={filtros}
        org={org}
        sede={sede || null}
        unidad={unidadVista}
        onCambio={cambiarFiltro}
        onLimpiar={limpiarFiltros}
      />

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
              atenuado={noCoincide}
              onAbrirCargo={nodo => setEditando({ cargo: nodo.cargo })}
              onAbrirUnidad={unidad => setEditandoUnidad({ unidad })}
              crear={crearEnNodo}
              desplazamientos={org.desplazamientos}
              onMover={mover}
              onAcomodar={acomodar}
            />
          )}
          {vista === 'cards' && !vacio && (
            <VistaCards
              org={orgListas}
              busca={busca}
              setBusca={setBusca}
              onAbrir={(c, aEditar) => setEditando({ cargo: c, editar: aEditar })}
              onEditarUnidad={u => setEditandoUnidad({ unidad: u, editar: true })}
            />
          )}
          {vista === 'tabla' && !vacio && (
            <div className="og-scroll">
              <VistaTabla
                org={orgListas}
                busca={busca}
                setBusca={setBusca}
                onAbrir={(c, aEditar) => setEditando({ cargo: c, editar: aEditar })}
              />
            </div>
          )}

          <BotonCrear
            sinAreas={org.unidades.length === 0}
            onCargo={() => setEditando({ cargo: null, base: baseDelAlcance })}
            onUnidad={() => setEditandoUnidad({ unidad: null, base: baseDelAlcance })}
          />
        </>
      )}

      {filtrosAbiertos && (
        <PanelFiltros
          org={org}
          filtros={filtros}
          onCambio={cambiarFiltro}
          /* "Qué se dibuja" viaja aparte de los recortes: cambia el dibujo, no lo que entra. */
          vista={{ pestana, setPestana, verFuncionales, setVerFuncionales, cuantosFuncionales }}
          cuantos={orgListas.cargos.length}
          onLimpiar={limpiarFiltros}
          onCerrar={() => setFiltrosAbiertos(false)}
        />
      )}

      {importar && <ImportarModal onCerrar={() => setImportar(false)} />}

      {/* Guardar el catálogo hace DOS cosas, y la segunda es la que no se ve: los cargos que
          apuntaban a un peldaño borrado quedan con un id que ya no existe, así que se les limpia
          el campo. `gradoDe` ya devuelve null en ese caso —ningún cuadro mostraría una insignia
          fantasma— pero dejar el dato colgado es una bomba para el día que alguien reutilice un
          id o exporte la estructura. */}
      {configColores && (
        <ConfigColores
          org={org}
          marca={colorMarca}
          paletaMarca={COLORES_MARCA}
          onCerrar={() => setConfigColores(false)}
          onGuardar={({ colores, marca }) => {
            setOrg(prev => ({ ...prev, colores }))
            setColorMarca(marca)
            setConfigColores(false)
          }}
        />
      )}

      {configMandos && (
        <ConfigMandos
          org={org}
          onCerrar={() => setConfigMandos(false)}
          onGuardar={niveles => {
            const vivos = new Set(niveles.map(n => n.id))
            setOrg(prev => ({
              ...prev,
              niveles,
              cargos: prev.cargos.map(c => (c.grado && !vivos.has(c.grado) ? { ...c, grado: null } : c)),
            }))
            setConfigMandos(false)
          }}
        />
      )}
      {/* Por encima del modal que lo abrió: los dos overlays comparten el z-index 1000 y sin
          esto la confirmación quedaría detrás de lo que viene a confirmar. */}
      {borrando && (
        <ConfirmarAccionModal
          titulo={borrando.tipo === 'cargo' ? 'Eliminar cargo / puesto' : 'Eliminar unidad'}
          descripcion={avisoDeBorrado()}
          palabra="eliminar"
          textoConfirmar="Eliminar"
          onConfirmar={confirmarBorrado}
          onCancelar={() => setBorrando(null)}
          zIndex={1200}
        />
      )}

      {editando && (
        <CargoModal
          cargo={editando.cargo}
          base={editando.base}
          abrirEnEdicion={editando.editar}
          sedeActiva={sede || null}
          org={org}
          onGuardar={guardar}
          onEliminar={cargo => setBorrando({ tipo: 'cargo', obj: cargo })}
          onCerrar={() => setEditando(null)}
        />
      )}
      {editandoUnidad && (
        <UnidadModal
          unidad={editandoUnidad.unidad}
          base={editandoUnidad.base}
          abrirEnEdicion={editandoUnidad.editar}
          org={org}
          onGuardar={guardarUnidad}
          onEliminar={unidad => setBorrando({ tipo: 'unidad', obj: unidad })}
          onCerrar={() => setEditandoUnidad(null)}
          /* Abrir el cargo que apoya cierra esta ficha y abre la suya: es la otra puerta, no
             una segunda forma de editar lo mismo. */
          onAbrirCargo={c => { setEditandoUnidad(null); setEditando({ cargo: c }) }}
        />
      )}

    </div>
  )
}
