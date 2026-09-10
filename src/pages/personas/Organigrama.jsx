import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, Network, LayoutGrid, Table2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  X, Building2, UploadCloud, FileSpreadsheet, Check, User, Search, Pencil, Star, Users,
  Minus, Plus, ArrowUp, Briefcase, MapPin, Trash2, FolderPlus, Printer, Image, FileCode2,
  Settings, Layers, Palette, GitBranch,
} from 'lucide-react'
import OrgGrafico from '../../components/personas/OrgGrafico'
import CabeceraModal from '../../components/personas/CabeceraModal'
import PreviaPuesto from '../../components/personas/PreviaPuesto'
import PreviaUnidad from '../../components/personas/PreviaUnidad'
import AyudaCampo from '../../components/personas/AyudaCampo'
import ConfigMandos from '../../components/personas/ConfigMandos'
import ConfigColores from '../../components/personas/ConfigColores'
import SelectorLista from '../../components/personas/SelectorLista'
import SelectorPersona from '../../components/personas/SelectorPersona'
import ApoyoFuncional from '../../components/organizacion/ApoyoFuncional'
import { ListaCrear } from '../../components/personas/MenuCrear'
import ConfirmarAccionModal from '../../components/layout/ConfirmarAccionModal'
import { HojaCargo, HojaUnidad } from '../../components/personas/HojaDetalle'
import PreviaLugar from '../../components/personas/PreviaLugar'
import FraseFiltro from '../../components/personas/FraseFiltro'
import Avatar from '../../components/personas/Avatar'
import { exportarPNG, exportarSVG, imprimir } from '../../components/personas/exportarOrganigrama'
import { TIPOS_UNIDAD, estadosDe, lugaresPosibles, tipoDe as peldanoDe } from '../../data/estructuraData'
import { colaboradoresData } from './colaboradoresData'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { lugaresDeSucursal } from '../../data/estructuraData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import {
  getUnidad, nuevoId, tipoDe, TIPOS_CARGO, esTipoDeclarado, nivelesDe,
  buildOrgTree, filasTabla, buscarCargos, normalizar, unidadesRaiz, subunidadesDe,
  tarjetaUnidad, cargosDeUnidad, estaEnSucursal, filtrarPorSucursal, TODAS_SUCURSALES,
  eliminarCargo, ramaDe, podarConCostura, codigosDeSerie, eliminarUnidad, bloqueoUnidad, unidadesPadrePosibles, cabezaDe,
  filtrarPorUnidad, cargosEnRama, TODAS_UNIDADES,
  ocupantesDe, funcionalesDe, areasQueApoya, apoyosDeUnidad, getPersona,
  coincideCargo, estiloColores,
  filaDeCargo,
  coordinacionesDe,
} from '../../data/organigramaData'

/* Un valor que no coincide con ninguna opción del selector: con él, el campo muestra su
   marcador en vez de una respuesta que nadie dio. `undefined` no sirve para eso porque el
   selector lo compara como texto vacío y lo confundiría con 'sin jefe', que sí es una respuesta. */
const SIN_ELEGIR = '__sin_elegir__'

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
/* Cuántos puestos se pueden crear de una vez. No es un límite del modelo —son cargos comunes—
   sino del formulario: pasando de aquí, la bandeja deja de poder revisarse a ojo y lo que hace
   falta es importar desde un Excel. */
const CUANTOS_MAX = 50


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
/* ---------- La ficha de UN puesto dentro del modal del cargo ----------

   Un cargo puede ser cinco puestos, y hay cinco datos que NO comparten: el código, la sede, a
   quién apoya, quién lo ocupa y su lugar en la fila. Antes vivían en dos pestañas del cargo
   —Funcional y Localización—, que pedían un valor para los cinco: el de Santa Cruz y los dos de
   La Paz terminaban con la misma sede, y quien apoyaba a Marketing se lo contagiaba al resto.

   Acá quedan los suyos, y solo los del puesto que esté elegido: el renglón que los lista se
   fue al panel de la izquierda, que ahora es el menú. */
function PuestoFicha({
  puesto, org, sucursales, puestosPorSede, unidadPropia, cargoId, onCambio,
  /* SOLO CUANDO LOS PUESTOS ESTÁN REPARTIDOS. Compartiendo jefatura la pregunta ya está
     contestada arriba y repetirla acá sería el mismo dato en dos sitios, que es la forma segura
     de que un día digan cosas distintas. */
  jefes = null,
}) {
  const sedeId = puesto.sucursalIds?.[0] || null
  const apoyos = puesto.funcionales || []

  const campos = (
    <>
      <div className="og-fila-puesto">
        <label className="pl-label">
          <span className="og-label-fila">
            Código
            <AyudaCampo>
              El identificador de este puesto en planilla o en los reportes de RRHH. Es
              opcional: si la empresa no los usa, se deja vacío.
            </AyudaCampo>
          </span>
          <input
            className="pl-input"
            value={puesto.codigo || ''}
            maxLength={20}
            onChange={e => onCambio({ codigo: e.target.value })}
            placeholder="Ej. CAR-001"
          />
        </label>
        <div className="pl-label">
          <span className="og-label-fila">
            Sucursal
            <AyudaCampo>
              El organigrama es uno solo: lo que cambia por sede es qué puestos existen en cada
              una. Si el mismo trabajo se hace en dos ciudades, son <strong>dos puestos</strong>,
              cada uno con su código y su gente.
            </AyudaCampo>
          </span>
          {/* SIEMPRE UN DESPLEGABLE. Acá había dos caras: parado en una sede la sucursal no se
              elegía, se mostraba —«lo que creas nace donde estás»—, que era la mitad que convertía
              al ámbito en algo más que un filtro. Quitado el ámbito global, esa cara no tiene de
              dónde salir: no hay ninguna sede en la que estar parado, así que la sucursal de cada
              puesto se elige, siempre, acá.

              Desplegable y no la reja de sedes a la vista que había en la pestaña: acá adentro
              conviven cinco fichas, y cinco listas de ocho sucursales son cuarenta renglones para
              contestar cinco veces lo mismo. El buscador y la cuenta de puestos por sede —que es
              la única pista que ayuda a decidir— se conservan dentro de la lista. */}
          <SelectorLista
            valor={sedeId}
            onCambio={v => onCambio({ sucursalIds: v ? [v] : [] })}
            vacia="Toda la empresa"
            placeholder="Toda la empresa"
            opciones={sucursales.map(s => ({
              id: s.id, nombre: s.ciudad, detalle: s.nombre, n: puestosPorSede[s.id] || 0,
            }))}
          />
        </div>
      </div>

      {/* DE QUIÉN DEPENDE ESTE PUESTO Y NO EL CARGO — BR‑ORG‑012. La línea de mando vive en el
          puesto, no en el cargo: es lo que hace posible que nueve vendedores con el mismo cargo
          respondan a dos supervisores. */}
      {jefes && (
        <div className="pl-label">
          <span className="og-label-fila">
            De quién depende <em className="og-req">*</em>
            <AyudaCampo>
              Solo de este puesto. Los otros del mismo cargo conservan la suya.
            </AyudaCampo>
          </span>
          <SelectorLista
            valor={puesto.jefe === undefined ? SIN_ELEGIR : puesto.jefe}
            onCambio={v => onCambio({ jefe: v })}
            placeholder="Elige de quién depende"
            vacia="Sin jefe · es otra cabeza de la organización"
            opciones={jefes.map(c => ({
              id: c.id,
              nombre: c.nombre,
              detalle: getUnidad(c.unidadId, org)?.nombre,
            }))}
          />
        </div>
      )}

      {/* EL RÓTULO QUE LE FALTABA. «Apoya funcionalmente a» arrancaba pegado a la sucursal, sin
          nada que dijera que empieza otro asunto: los dos campos de arriba dicen dónde está el
          puesto y este dice dónde MÁS trabaja, que es una pregunta de otra naturaleza.

          Es el mismo rótulo que ya separa la definición del cargo de lo que es del puesto —línea
          fina, título y una frase corta al lado— y no un estilo nuevo: si dos cosas cortan un
          formulario en dos, tienen que cortarlo igual.

          Y ADEMÁS RECUPERA UN NOMBRE QUE LA PANTALLA SEGUÍA USANDO. Esto vivía en una pestaña
          llamada «Funcional» que se quitó al pasar los campos al puesto, pero dos ayudas seguían
          mandando «a la pestaña Funcional» —a un sitio que ya no existía—. Con la sección
          rotulada, esas frases vuelven a apuntar a algo que se ve. */}
      <div className="og-rot-bloque og-rot-funcional">
        Funcional
        <em>Dónde más trabaja, sin pertenecer ahí</em>
      </div>

      <div className="pl-label og-apoya">
        <span className="og-label-fila">
          Apoya funcionalmente a
          <AyudaCampo>
            El puesto <strong>pertenece</strong> a una unidad y puede <strong>trabajar</strong> en
            otras. En cada área que apoya se dibuja como un cuadro más, en azul, y sigue siendo
            el mismo puesto: no se cuenta dos veces.
          </AyudaCampo>
        </span>

        {/* EL EDITOR SE FUE A SU PROPIO ARCHIVO. Ahora también se usa desde la lista de cargos, y
            dos copias del mismo formulario es garantizar que dentro de un mes una valide algo que
            la otra no. Lo que quedó acá es el rótulo, la ayuda y el sitio. */}
        <ApoyoFuncional
          apoyos={apoyos}
          org={org}
          unidadPropia={unidadPropia}
          cargoId={cargoId}
          onCambio={funcionales => onCambio({ funcionales })}
        />
      </div>
    </>
  )

  return <div className="og-pto-sola">{campos}</div>
}

function CargoModal({ cargo, base, sedeActiva, onGuardar, onEliminar, onEliminarRama, onCerrar, org, abrirEnEdicion }) {
  /* Las sedes salen del contexto y ya no de la constante del modelo. Desde que se editan en
     Organización → Sucursales, leerlas del módulo dejaría este desplegable ofreciendo una lista que
     el usuario ya cambió —o una sede que borró—. */
  const { sucursales } = useOnboardingData()
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
  /* Qué se lleva puesto el borrado en cadena: él y todo lo que cuelga. Se calcula acá porque el
     botón lleva el número por delante —"Eliminar la rama · 7"— y ese número es la mitad de la
     advertencia: sin él, el botón parece decir lo mismo que el de al lado. */
  const rama = cargo ? ramaDe(cargo.id, org) : []

  /* LOS HERMANOS DE ESTE PUESTO: los otros cargos que son el mismo puesto repetido. Comparten
     nombre, área, clase y jefe, que es exactamente lo que la pila usa para agruparlos en el
     dibujo — si se agrupan ahí, se editan juntos acá.

     Es la respuesta a la única desventaja real de no tener un contenedor: sin ellos, renombrar el
     cargo sería editar cinco fichas. */
  const hermanos = useMemo(() => (cargo ? org.cargos.filter(c => (
    c.id !== cargo.id
    && c.nombre === cargo.nombre
    && c.unidadId === cargo.unidadId
    && (c.tipo || 'colaborador') === (cargo.tipo || 'colaborador')
    /* SIN EXIGIR EL MISMO JEFE. Lo pedía, y con eso un cargo cuyas plazas responden a dos
       coordinaciones se abría partido en dos grupos que se editaban por separado y no se veían
       entre sí: renombrarlo era hacerlo dos veces, y la cuenta de puestos mentía en las dos.
       Nombre, área y clase es lo que hace que dos puestos sean el mismo puesto; el jefe es de
       cada uno —BR‑ORG‑012— y por eso no entra en la agrupación. */
  )) : []), [cargo, org])

  /* ¿SUS PUESTOS RESPONDEN A JEFATURAS DISTINTAS? Se mira lo guardado y no lo que se está
     escribiendo: es el estado del que parte el modal. */
  const jefeRepartido = useMemo(() => (cargo
    ? new Set([cargo, ...hermanos].map(x => x.reportaA || '')).size > 1
    : false), [cargo, hermanos])
  /* `null` es «como esté»: la casilla sigue a la realidad hasta que alguien la toca, y desde ahí
     manda su decisión. */
  const [mismoJefe, setMismoJefe] = useState(null)

  /* LO QUE HABÍA AL ABRIR. Sirve para saber si se escribió algo y no cerrar el formulario de un
     clic al costado: perder seis campos por errarle al modal por veinte píxeles no es un
     accidente del usuario, es un descuido del diseño. */
  const inicial = useRef(null)

  /* QUÉ SE ESTÁ EDITANDO: el cargo —lo que comparten todos— o uno de los puestos. Lo elige el
     panel de la izquierda, que dejó de ser una estampa: el cuadro que se toca es el que se edita.

     Con un solo puesto no hay nada que elegir y el formulario los muestra juntos, la definición
     arriba y lo suyo abajo. El caso común no paga por el de cinco. */
  const [sel, setSel] = useState(() => (cargo && hermanos.length ? 0 : 'cargo'))
  /* Los que se sacaron de la lista mientras el modal está abierto. No se borran todavía: nada de
     lo que pasa acá adentro toca el organigrama hasta guardar, así que Cancelar es el deshacer. */
  const [quitados, setQuitados] = useState([])
  /* El puesto que se está por eliminar teniendo a alguien adentro. Sacarlo de un clic dejaría a
     una persona sin puesto sin que nadie lo dijera. */
  const [aBorrar, setABorrar] = useState(null)
  const [form, setForm] = useState(() => ({
    codigo: cargo?.codigo ?? base?.codigo ?? '',
    /* Cuántos puestos crear de una vez, y qué lleva cada uno. Editando siempre es uno: los
       cinco se crearon una vez y de ahí en más cada uno es un cargo con su propia ficha. */
    /* LA LISTA DE PUESTOS. Editando son este y sus hermanos —los otros cargos con el mismo
       nombre, área, clase y jefe, que es exactamente lo que la pila usa para agruparlos en el
       dibujo—: si se agrupan ahí, se editan juntos acá. Creando, son los que se van a crear.

       En los dos casos es UNA sola lista y el panel la dibuja. Antes había dos —los cuadros de la
       previa y las fichas del formulario— y podían decir cosas distintas. */
    cuantos: cargo ? 1 + hermanos.length : 1,
    puestos: cargo ? [cargo, ...hermanos]
      .sort((x, y) => (x.codigo || '').localeCompare(y.codigo || ''))
      .map(c => ({
        id: c.id,
        codigo: c.codigo || '',
        /* DE CADA UNO Y NO DEL CARGO. `?? null` y no `|| null`: responder «a nadie» es una
           respuesta dada, no un campo vacío, y hay que poder distinguirla de la que falta. */
        jefe: c.reportaA ?? null,
        sucursalIds: (c.sucursalIds || []).slice(0, 1),
        funcionales: funcionalesDe(c).map(f => ({ ...f })),
        ocupantes: ocupantesDe(c),
      })) : [],
    nombre: cargo?.nombre ?? base?.nombre ?? '',
    /* Los valores por defecto salen de la estructura que hay, no de ids sembrados: en un
       organigrama recién empezado no existe ni 'gg' ni una unidad en la segunda posición. */
    unidadId: cargo?.unidadId || base?.unidadId || org.unidades[0]?.id || '',
    /* El primer cargo de un área vacía nace colgado de quien esa área declaró como su mando:
       es el jefe que el dibujo ya le estaba dando al área. */
    /* DEL CARGO, NO DE LA SILLA: el techo de plazas aprobadas y la jefatura con la que nacen
       las nuevas. Todas las plazas del cargo traen el mismo valor, así que da igual de cuál se
       lea. */
    maxPersonas: cargo?.maxPersonas || '',
    jefeSillas: cargo?.jefeSillas || '',
    reportaA: cargo ? cargo.reportaA
      : base && 'reportaA' in base ? base.reportaA
      /* SIN JEFE INVENTADO. El último recurso era `org.cargos[0]` —el primer cargo de la
         lista—, así que un puesto creado sin contexto nacía colgado de alguien que nadie eligió
         y nadie se enteraba. Ahora queda `undefined`: "todavía no se decidió", y hay que
         decidirlo. Solo cuando no existe ningún otro cargo nace en `null`, que ahí no es una
         omisión sino el único hecho posible: es el primer puesto del organigrama. */
      : (jefeDeUnidadVacia(base?.unidadId || org.unidades[0]?.id, org) ?? (org.cargos.length ? undefined : null)),
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
    /* EL ESTADO, QUE SOLO ESTABA DEL OTRO LADO. Desactivar no es borrar —el puesto conserva su
       historia y su gente y deja de ofrecerse para cosas nuevas— y hasta ahora eso solo se podía
       hacer desde la tabla. Es del CARGO y no de cada silla: el modal edita la definición del
       grupo, y desactivar «Ejecutiva Comercial» las desactiva a las cinco. */
    estado: cargo?.estado || 'activa',
    /* Si se está mirando una sede concreta, el puesto nuevo nace en esa sede y no en todas: es
       la respuesta a "¿para qué sucursal estoy creando?".

       Sin sede activa nace con la lista VACÍA y no con las sedes enumeradas: las dos se ven
       igual hoy, pero la lista vacía quiere decir "en todas" y sigue valiendo cuando mañana se
       abra la novena; enumerarlas dejaría al puesto fuera de esa. */
    /* Una sola, siempre. Un dato viejo de cuando un cargo podía existir en varias sedes se
       queda con la primera. */
    sucursalIds: (cargo?.sucursalIds || (sedeActiva ? [sedeActiva.id] : [])).slice(0, 1),
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  /* UN PUESTO O VARIOS. Con uno solo no hay panel que elegir ni peine que dibujar: el formulario
     muestra la definición y lo del puesto en la misma hoja. */
  const unico = form.puestos.length <= 1
  /* Con uno solo, lo que es del puesto sale del propio formulario y no de la lista: es el mismo
     dato de siempre, leído con la forma que la ficha espera. */
  const puestoUnico = form.puestos[0]
    || { codigo: form.codigo, sucursalIds: form.sucursalIds, funcionales: form.funcionales }
  /* Al quedar uno solo, la selección vuelve al cargo: apuntar a un renglón que ya no existe
     dejaría el formulario en blanco. */
  useEffect(() => { if (unico) setSel('cargo') }, [unico])

  /* CON UN SOLO PUESTO NO HAY REPARTO POSIBLE: un puesto responde a una jefatura y la pregunta
     común y la de cada uno son la misma. La casilla ni se ofrece. */
  const todasIguales = unico || (mismoJefe === null ? !jefeRepartido : mismoJefe)

  /* LAS PLAZAS, CON LA JEFATURA QUE LES TOCA. Marcada la casilla, la común gana sobre lo que
     tenga cada una —es lo que la casilla promete—; desmarcada manda la de cada fila, y las que
     nunca se tocaron parten de la común. */
  const puestosConJefe = useMemo(() => form.puestos.map(p => ({
    ...p,
    jefe: todasIguales ? (form.reportaA ?? null) : (p.jefe ?? form.reportaA ?? null),
  })), [form.puestos, form.reportaA, todasIguales])

  /* AL DESMARCAR SE ESCRIBE LO QUE LA COMÚN VENÍA DICIENDO. Sin esto, los desplegables de cada
     puesto abrirían en blanco y parecería que nadie tiene jefe. */
  const cambiarMismoJefe = v => {
    setMismoJefe(v)
    if (!v) setForm(f => ({ ...f, puestos: f.puestos.map(p => ({ ...p, jefe: p.jefe ?? f.reportaA ?? null })) }))
  }

  /* EL DIBUJO LEE LO MISMO QUE VA A GUARDARSE. Y con las plazas repartidas no hay un jefe del
     cargo que dibujar: el panel agrupa por jefatura y dice cuántas son, en vez de colgar las
     cinco de una sola y prometer un sitio que el organigrama no les va a dar. */
  const previaForm = useMemo(() => {
    const unaSola = new Set(puestosConJefe.map(p => p.jefe || '')).size <= 1
    return {
      ...form,
      puestos: puestosConJefe,
      reportaA: unaSola ? (puestosConJefe[0]?.jefe ?? form.reportaA ?? null) : null,
    }
  }, [form, puestosConJefe])
  /* Cuántos puestos existen ya en cada sede. El que se está editando no se cuenta: la pregunta
     es qué hay allá, no qué va a haber cuando se guarde. Sale de `estaEnSucursal`, que es la
     misma regla que usa el filtro de la pantalla —contarlos a mano acá sería una segunda verdad
     que se despega de la primera en cuanto una cambie. */
  const puestosPorSede = useMemo(() => Object.fromEntries(sucursales.map(sc => [
    sc.id,
    org.cargos.filter(c => c.id !== cargo?.id && estaEnSucursal(c, sc.id)).length,
  /* `sucursales` entra en las dependencias porque ya no es una constante del módulo: viene del
     contexto y cambia en cuanto alguien crea o borra una sede en Organización. Sin ella, el
     desplegable seguiría contando sobre la lista de sedes anterior. */
  ])), [org.cargos, cargo?.id, sucursales])

  const coordinaciones = cargo ? coordinacionesDe(cargo.id, org) : []
  const ocupantes = form.ocupantes
    .map(id => colaboradoresData.find(pe => pe.id === id))
    .filter(Boolean)
  const t = tipoVisual(form.tipo)
  const externo = form.tipo === 'outsourcing'
  /* EL NIVEL DE MANDO, OBLIGATORIO COMO EN LA FICHA —y solo cuando la pantalla lo enseña—.
     Staff y tercerizados no lo tienen: el dibujo los pone al costado de la línea de mando, así que
     preguntarles a qué altura mandan no tiene respuesta. Exigirlo siempre habría bloqueado
     justamente los dos casos en que el campo ni se ve. */
  const pideNivel = form.tipo === 'colaborador'
  /* CADA PUESTO CON SU JEFATURA DECIDIDA. Repartidas, no alcanza con que la común esté
     contestada: la que manda es la de cada fila, y una sin decidir es un puesto que nace suelto. */
  const jefeDecidido = todasIguales
    ? form.reportaA !== undefined
    : form.puestos.every(p => p.jefe !== undefined)
  const valido = !!form.nombre.trim() && !!form.unidadId && jefeDecidido
    && (!pideNivel || !!form.grado)
  /* Los cargos de los que este puesto podría colgar. Vacío quiere decir que es el primero del
     organigrama, y entonces "de quién depende" deja de ser una pregunta. */
  const jefesPosibles = org.cargos.filter(c => c.id !== cargo?.id)

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

  /* CUÁNTOS PUESTOS Y QUÉ TIENE CADA UNO.

     `cuantos` y `puestos` son lo mismo visto de dos maneras: subir el número agrega filas, borrar
     una fila baja el número. Nunca hay que hacerlos coincidir a mano y nunca pueden decir cosas
     distintas — por eso el número no es un campo aparte, es `puestos.length`.

     Cada fila guarda SOLO lo suyo: código, sede y apoyos. El resto —nombre, área, jefe, clase,
     nivel— vive en el formulario y vale para todos, así que no se copia cinco veces. */
  const puestosDe = (n, previos = [], base = form) => {
    const codigos = codigosDeSerie(base.codigo, n, org)
    return Array.from({ length: n }, (_, i) => previos[i] || {
      codigo: codigos[i] || '',
      /* Nace con la jefatura de arriba, que es «el valor con el que nacen todos». Si todavía no
         se eligió ninguna, nace en `undefined` —«falta decidirlo»— y el botón de guardar espera. */
      jefe: base.reportaA,
      /* Nacen con la sede y los apoyos del formulario: es «el valor con el que nacen todos», y la
         bandeja corrige a los que difieren. */
      sucursalIds: base.sucursalIds.slice(0, 1),
      funcionales: [],
      ocupantes: [],
    })
  }

  const setCuantos = n => {
    const cuantos = Math.max(1, Math.min(CUANTOS_MAX, n))
    setForm(f => ({ ...f, cuantos, puestos: puestosDe(cuantos, (f.puestos || []).slice(0, cuantos), f) }))
  }

  /* Al tocar una ficha. El código de la PRIMERA arrastra a la serie —escribir EC-001 arriba
     numera EC-002, EC-003…—, pero solo a las que nadie tocó: si alguien escribió un código a
     mano, cambiar el primero no puede pisárselo. */
  const setPuesto = (i, parche) => setForm(f => {
    if (i === 0 && parche.codigo !== undefined && f.puestos.length > 1) {
      const antes = codigosDeSerie(f.puestos[0].codigo, f.puestos.length, org)
      const ahora = codigosDeSerie(parche.codigo, f.puestos.length, org)
      return {
        ...f,
        codigo: parche.codigo,
        puestos: f.puestos.map((p, n) => (n === 0
          ? { ...p, ...parche }
          : (p.codigo === antes[n] ? { ...p, codigo: ahora[n] } : p))),
      }
    }
    return { ...f, puestos: f.puestos.map((p, n) => (n === i ? { ...p, ...parche } : p)) }
  })

  /* QUITAR UN PUESTO. Tres casos y tres fricciones distintas:

     · VACANTE — se saca de la lista y ya. Nada de lo que pasa en el modal toca el organigrama
       hasta guardar, así que Cancelar ya es el deshacer y preguntar acá sería preguntar por algo
       que no arrastra nada. Confirmar de más entrena a contestar que sí sin leer, y entonces la
       pregunta que sí importa tampoco se lee.
     · OCUPADO — se pregunta nombrando a quien lo ocupa: al guardar, esa persona se queda sin
       puesto. La cara ya se ve en el panel antes de tocar el tacho; esto lo confirma.
     · EL ÚLTIMO — un cargo sin ningún puesto no existe en el modelo: quitarlo no es quitar un
       puesto, es eliminar el cargo, y para eso está el botón que ya dice eso.

     Los que se sacan quedan anotados en `quitados`: al guardar, esos cargos se eliminan. */
  const pedirQuitar = i => {
    if (form.puestos.length <= 1) return
    if ((form.puestos[i].ocupantes || []).length) return setABorrar(i)
    quitarPuesto(i)
  }

  const quitarPuesto = i => {
    const fuera = form.puestos[i]
    if (fuera?.id) setQuitados(q => [...q, fuera.id])
    setForm(f => {
      const puestos = f.puestos.filter((_, n) => n !== i)
      return { ...f, puestos, cuantos: puestos.length }
    })
    setSel(s => (s === 'cargo' ? s : Math.max(0, Math.min(s, form.puestos.length - 2))))
    setABorrar(null)
  }


  const guardar = () => onGuardar({
    codigo: form.codigo.trim() || null,
    nombre: form.nombre.trim(),
    unidadId: form.unidadId,
    reportaA: form.reportaA ?? null,
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
    /* EL NIVEL SE LIMPIA SI EL PUESTO YA NO ES COLABORADOR. El campo desaparece del formulario
       para staff y outsourcing, y dejar el valor viejo guardado por debajo sería un dato que
       nadie ve y que nadie eligió: la ficha lo seguiría mostrando, la lista de niveles lo
       contaría entre sus cargos, y al volver el puesto a Colaborador reaparecería un nivel que
       nunca se declaró. */
    grado: (form.tipo === 'colaborador' && form.grado) || null,
    sucursalIds: form.sucursalIds.slice(0, 1),
    /* LA LISTA VIAJA APARTE. La página escribe un cargo por entrada: los campos de acá arriba son
       los COMUNES —valen para todos— y cada entrada trae lo suyo, su código, su sede y sus apoyos.
       Cada uno es un puesto de verdad, con su cuadro, su ficha y su fila en la tabla; no una
       casilla dentro de un contenedor.

       `quitados` son los que se sacaron del panel mientras el modal estaba abierto. Se eliminan
       recién al guardar: hasta entonces Cancelar los devuelve.

       Creando de cero la lista todavía no existe —«Ocupantes» ni se tocó—, y sin ella la página no
       tendría ninguna entrada que escribir. Se arma una con lo que hay arriba: un puesto es la
       lista de uno. */
    /* CON LA JEFATURA YA RESUELTA. La página no tiene por qué saber si la casilla estaba
       marcada: recibe una lista donde cada entrada dice la suya. */
    puestos: (form.puestos.length ? puestosConJefe : [{
      jefe: form.reportaA,
      codigo: form.codigo,
      sucursalIds: form.sucursalIds,
      funcionales: form.funcionales,
      ocupantes: form.ocupantes,
    }]),
    quitados,
  })

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
              form={previaForm}
              org={org}
              cargoId={cargo?.id}
              ocupantes={ocupantes}
              nuevo={nuevo}
              /* EL PANEL ES EL MENÚ: qué está elegido y qué pasa al tocar un cuadro o su tacho. */
              sel={unico ? null : sel}
              onSel={setSel}
              onBorrar={pedirQuitar}
            />
          )}

          {/* MIRANDO, LA HOJA DE DATOS; EDITANDO, EL FORMULARIO DE SIEMPRE. Son dos preguntas
              distintas —qué es este puesto y qué quiero cambiarle— y por eso no comparten
              composición. El dibujo de la izquierda es el mismo en los dos: es lo único que
              contesta las dos. */}
          {soloVer ? <HojaCargo cargo={cargo} org={org} /> : (
          <div className="og-hojas-col">
            {/* NI PESTAÑAS NI PASOS: manda la selección del panel. Cargo, Funcional y Localización
                se repartieron cuando un cargo ERA un puesto; los dos pasos vinieron después y
                partían el alta en dos pantallas que el alta no necesita. Ahora el dibujo de la
                izquierda dice qué se está editando y este lado muestra sus campos. */}
          <div className="pl-modal-body og-cargo-campos">
            {(unico || sel === 'cargo') && (
            <section className="og-bloque">
              {/* EL ÚNICO BLOQUE SIN RÓTULO ERA JUSTO EL PRIMERO. Abajo dicen «El puesto · Lo suyo,
                  no del cargo» y «Funcional · Dónde más trabaja», y arriba había cinco campos
                  sueltos: el formulario contaba su estructura a partir de la mitad, así que hasta
                  llegar ahí no se sabía que lo de arriba era compartido y lo de abajo no.

                  Con el tercero puesto, el modal se lee de un vistazo como lo que es: la
                  DEFINICIÓN, la SILLA y lo FUNCIONAL. Es la misma división que la propuesta hace en
                  el árbol, dicha con las mismas palabras en la pantalla vieja. */}
              <div className="og-rot-bloque og-rot-primero">
                El cargo
                <em>{unico ? 'La definición, no la silla' : `Vale para sus ${form.puestos.length} puestos`}</em>
              </div>
              {/* QUIÉN COMPARTE ESTO. Sin decirlo, quien abre el EC-003 no tiene forma de saber
                  que hay cuatro más iguales, y renombrarlo dejaría uno con otro nombre y cuatro
                  con el viejo. El panel de la izquierda muestra a los cinco; esto nombra lo que
                  el panel dibuja. */}
              {!unico && (
                <p className="og-vale-para">
                  <Layers size={13} />
                  <span>
                    Lo de acá abajo vale para <strong>los {form.puestos.length} puestos</strong>.
                    El código, la sede y los apoyos son de cada uno: se eligen en el panel.
                  </span>
                </p>
              )}


              {/* EL CÓDIGO Y EL NOMBRE COMPARTEN RENGLÓN. Uno mide veinte caracteres y el otro
                  sesenta, así que en renglones separados el del código dejaba media línea vacía y
                  empujaba todo lo demás un escalón hacia abajo. Juntos entran cómodos y el
                  formulario arranca con lo que de verdad identifica al puesto. En pantalla
                  angosta se vuelven a apilar. */}
              <div className={`og-fila-campos${nuevo ? ' og-fila-cuantos' : ''}`}>
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


                {/* CUÁNTOS PUESTOS SON. Al lado del nombre porque es parte de la DEFINICIÓN
                    —«Ejecutivo Comercial ×5»— y no de a quién se le asigna: en un puesto nuevo se
                    fija antes de tener a nadie.

                    Solo al CREAR. Editando ya es uno: los cinco se crearon una vez y de ahí en más
                    cada uno se edita por su cuenta, con su propia ficha y su propio cuadro. */}
                {nuevo && (
                  <label className="pl-label og-campo-cuantos">
                    {/* «CUÁNTOS PUESTOS» Y NO «OCUPANTES». Este número CREA sillas; el «Máximo de
                        personas» de la ficha pone un TECHO a cuántas puede llegar a haber. Dos
                        cosas distintas que se leían igual, y con las dos pantallas escribiendo el
                        mismo cargo esa confusión se paga. Y de paso deja de sugerir que acá se
                        elige gente: la persona se asigna en cada puesto, más abajo. */}
                    <span className="og-label-fila">
                      Número máximo de ocupantes en este cargo
                      <AyudaCampo>
                        Cada ocupante ocupa una silla, y cada silla nace con su código y su sede —
                        no es un puesto compartido entre varios. Es la misma pregunta que la ficha
                        del cargo hace en Estructura organizacional.
                      </AyudaCampo>
                    </span>
                    <input
                      className="pl-input"
                      type="number"
                      min="1"
                      max={CUANTOS_MAX}
                      value={form.cuantos}
                      onChange={e => setCuantos(Number(e.target.value) || 1)}
                    />
                  </label>
                )}

              </div>


              {/* EL ÁREA Y EL JEFE, EN EL MISMO RENGLÓN. Son las dos mitades de una sola
                  pregunta —dónde queda este puesto— y además se condicionan: al cambiar de área,
                  la lista de jefes posibles cambia con ella. Separados por un renglón entero, esa
                  relación no se veía y el formulario pedía dos veces lo que en la cabeza es una
                  decisión sola. */}
              <div className="og-fila-campos og-fila-mitades">
                <label className="pl-label">
                  <span className="og-label-fila">
                    {/* "Unidad organizacional" a secas, con la pestaña Funcional al lado hablando
                        también de áreas, no decía cuál de las dos es esta. */}
                    Unidad organizacional a la que pertenece <em className="og-req">*</em>
                    <AyudaCampo>
                      Su unidad de verdad: la que lo evalúa y donde se lo cuenta. Si además ayuda a
                      otras, eso se declara más abajo, en <strong>Funcional</strong>.
                    </AyudaCampo>
                  </span>
                  <SelectorLista
                    valor={form.unidadId}
                    /* Cambiar de área puede cambiar el jefe: si la elegida está vacía, el puesto
                       entra colgado del mando que ella declaró. */
                    onCambio={v => setForm(f => ({ ...f, unidadId: v, reportaA: jefeDeUnidadVacia(v, org) ?? f.reportaA }))}
                    placeholder="Elige la unidad"
                    /* EN CASCADA, como el selector del área madre. Antes era una lista plana con
                       el nombre de la madre de subtítulo, y eso obliga a reconstruir el árbol
                       leyendo: con doce áreas anidadas hay que ir renglón por renglón atando
                       "Ventas · dentro de Comercial" con "Comercial · dentro de Dirección". El
                       componente ya sabe sangrar —solo necesita el `padreId`— y sangrado se ve de
                       un vistazo qué cuelga de qué. El subtítulo se va porque la sangría ya lo
                       dice, y al buscar el componente muestra el camino completo igual. */
                    opciones={org.unidades.map(u => ({
                      id: u.id,
                      nombre: u.nombre,
                      padreId: u.padreId,
                    }))}
                    arbol
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
  
                {/* LA JEFATURA COMÚN, MIENTRAS VALGA PARA TODOS. Desmarcada la casilla de abajo,
                    esta pregunta no tiene una sola respuesta y cada puesto contesta la suya en su
                    propia hoja: dejar el campo acá diciendo un nombre sería anunciar una línea de
                    mando que tres de los cinco no tienen. */}
                {todasIguales && (
                <label className="pl-label">
                  <span className="og-label-fila">
                    De quién depende {jefesPosibles.length > 0 && <em className="og-req">*</em>}
                    <AyudaCampo>El cargo del que depende este puesto. De acá sale la línea de mando: quién aprueba y a quién le llega la bandeja.</AyudaCampo>
                  </span>
                  {/* EL PRIMER CARGO DEL ORGANIGRAMA no tiene de quién depender: no hay ningún
                      otro. Ofrecerle un desplegable con una sola opción —y encima la de "sin
                      jefe"— es pedir una decisión que ya está tomada por los hechos. */}
                  {jefesPosibles.length === 0 ? (
                    <p className="og-modal-nota og-nota-suelta">
                      Es el <strong>primer puesto</strong> del organigrama, así que no depende de
                      nadie: va arriba de todo. Cuando existan otros, vas a poder colgarlo de uno.
                    </p>
                  ) : (
                    <SelectorLista
                      /* SIN VALOR HASTA QUE ALGUIEN ELIJA. `undefined` es "todavía no se decidió"
                         y `null` es "no depende de nadie" —dos cosas distintas que antes se
                         confundían—, así que se manda un valor que no coincide con ninguna opción
                         para que el campo muestre su marcador y no una respuesta que nadie dio. */
                      valor={form.reportaA === undefined ? SIN_ELEGIR : form.reportaA}
                      onCambio={v => set('reportaA', v)}
                      placeholder="Elige de quién depende"
                      /* No es un detalle técnico: es declarar otra cabeza de la organización, que
                         se dibuja arriba de todo junto a la primera. Dicho así, nadie la elige
                         creyendo que significa "todavía no sé". */
                      vacia="Sin jefe · es otra cabeza de la organización"
                      opciones={jefesPosibles.map(c => ({
                        id: c.id,
                        nombre: c.nombre,
                        detalle: getUnidad(c.unidadId, org)?.nombre,
                      }))}
                    />
                  )}
                </label>
                )}
              </div>

              {/* ¿UNA JEFATURA O VARIAS? Es la misma casilla que la ficha del cargo, con las
                  mismas palabras: nueve vendedores repartidos entre dos supervisores es un cargo
                  normal, y hasta ahora el dibujo lo abría partido en dos grupos que no se veían
                  entre sí.

                  Marcada por defecto porque es el caso corriente —todos responden al mismo— y
                  desmarcarla es el paso que se pide cuando no. */}
              {!unico && jefesPosibles.length > 0 && (
                <div className="est-mismo-jefe">
                  <label className="est-mismo-jefe-check">
                    <input
                      type="checkbox"
                      checked={todasIguales}
                      onChange={e => cambiarMismoJefe(e.target.checked)}
                    />
                    <span>
                      Todos los puestos dependen de la misma jefatura
                      <em>Desmárcalo si alguno responde a otra persona.</em>
                    </span>
                  </label>

                  {!todasIguales && (
                    <p className="est-mismo-jefe-nota">
                      Cada puesto elige la suya en su propia hoja. Tócalo en el panel de la
                      izquierda para abrirla.
                    </p>
                  )}

                  {/* AVISO Y NO BLOQUEO: aplanar el reparto es una decisión válida —«todos pasan
                      a depender del nuevo coordinador»— pero tiene que decirse antes de guardar
                      y no descubrirse después. */}
                  {todasIguales && jefeRepartido && (
                    <p className="est-mismo-jefe-aviso">
                      Sus {form.puestos.length} puestos responden hoy a jefaturas distintas. Al
                      guardar, todos pasan a depender de la que elijas arriba.
                    </p>
                  )}
                </div>
              )}

              {/* EL TECHO DE PLAZAS Y LA JEFATURA CON LA QUE NACEN LAS NUEVAS. Son del cargo y no
                  de cada silla, y hasta ahora solo se podían poner desde la ficha: creando desde
                  el dibujo, el cargo nacía sin techo y sus plazas futuras nacían sueltas.

                  «Cuántos puestos» de más arriba es otra cosa: son los que se abren AHORA. Esto
                  es cuántos autoriza la empresa, que puede ser más. */}
              <div className="og-form-2col">
                <label className="pl-label">
                  <span className="og-label-fila">
                    Máximo de ocupantes
                    <AyudaCampo>
                      El cupo aprobado para este cargo, que puede ser mayor que las plazas
                      abiertas hoy.<br /><br />
                      Vacío es <strong>sin límite</strong>: hay tantas plazas como se abran.
                    </AyudaCampo>
                  </span>
                  {/* SE LIMPIA AL ESCRIBIR. El mínimo del navegador solo gobierna las flechitas:
                      tecleando un menos o un cero, el valor entra igual y se guarda. */}
                  <input
                    className="pl-input"
                    type="number"
                    min={1}
                    max={50}
                    value={form.maxPersonas}
                    placeholder="Sin límite"
                    onChange={e => {
                      const d = e.target.value.replace(/\D/g, '').replace(/^0+/, '')
                      set('maxPersonas', d === '' ? '' : String(Math.min(Number(d), 50)))
                    }}
                  />
                </label>

                {jefesPosibles.length > 0 && (
                  <div className="pl-label">
                    <span className="og-label-fila">
                      Jefatura de las plazas nuevas
                      <AyudaCampo>
                        Con la que <strong>nacen</strong> las plazas que se abran más adelante
                        desde la tabla.<br /><br />
                        No mueve a las que ya existen: cada una guarda la suya.
                      </AyudaCampo>
                    </span>
                    <SelectorLista
                      valor={form.jefeSillas || null}
                      onCambio={v => set('jefeSillas', v || '')}
                      vacia="De nadie: nacen como cima"
                      opciones={jefesPosibles.map(c => ({
                        id: c.id,
                        nombre: c.nombre,
                        detalle: getUnidad(c.unidadId, org)?.nombre,
                      }))}
                    />
                  </div>
                )}
              </div>

              {/* NIVEL Y ESTADO, DE A DOS. Cada uno ocupaba una fila entera para un desplegable de
                  dos palabras: «Mando medio» estirado sobre seiscientos píxeles, dos veces
                  seguidas y justo debajo de las tres tarjetas del tipo, que sí son anchas. El ojo
                  bajaba por tres franjas del mismo ancho y ninguna pesaba más que otra.

                  De a dos vuelven a medir lo que dicen. Y cuando el tipo es staff o tercerizado
                  —que no llevan nivel— el estado se queda en la mitad izquierda en vez de estirarse
                  solo: la reja no se mueve al cambiar de tipo, que es lo que haría saltar el
                  formulario debajo del dedo. */}
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

              {/* NIVEL DE MANDO, Y SOLO PARA COLABORADOR. Va abajo del tipo porque son las dos
                  preguntas que el puesto contesta sobre sí mismo —de qué clase es y cuánto pesa—,
                  pero la segunda no aplica a las otras dos clases, y por razones distintas:

                  · El STAFF asiste al costado de la línea, no en una fila. El dibujo nunca lo
                    escalona —los laterales se pintan sin ese dato— así que el campo se pedía y no
                    hacía absolutamente nada. Pedir algo que no tiene efecto es peor que no
                    pedirlo: quien lo llena cree que declaró algo.
                  · El OUTSOURCING sí baja en la línea y el escalón le funcionaría, pero un
                    servicio tercerizado no está en la estructura de grados de la empresa: no se
                    le paga por banda, se le paga por contrato. Preguntarle su nivel de mando es
                    meterlo en una escala que no es la suya.

                  PASÓ A SER OBLIGATORIO para el colaborador, y no porque se haya vuelto más
                  importante: la ficha del árbol ya lo exigía, así que un cargo creado acá sin nivel
                  no se podía guardar allá. Con las dos pantallas escribiendo el mismo cargo, un
                  obligatorio que solo una de las dos pide no es una asimetría de estilo.

                  Lo guardado antes de que el campo existiera no tiene ninguno y no se toca: la
                  exigencia es para guardar, no para abrir. Sin declarar, el cuadro no se mueve de
                  su sitio y la tabla lo dice en gris. */}
              <div className="og-fila-campos og-fila-mitades">
              {form.tipo === 'colaborador' && (
                <label className="pl-label">
                  <span className="og-label-fila">
                    Nivel de mando <em className="og-req">*</em>
                    <AyudaCampo>
                      Dice <strong>cuánto pesa</strong> el puesto en la empresa, y es independiente
                      de quién reporta a quién: dos cargos sin jefe pueden tener niveles distintos,
                      y ahí el nivel es lo único que los diferencia. En el dibujo, el que se salta
                      un peldaño respecto del de su jefe se dibuja una caja más abajo.
                    </AyudaCampo>
                  </span>
                  <SelectorLista
                    valor={form.grado}
                    onCambio={v => set('grado', v)}
                    placeholder="Elige uno"
                    opciones={nivelesDe(org).map((n, i) => ({
                      id: n.id,
                      nombre: n.nombre,
                      /* El número no se guarda: sale del orden del catálogo. Se muestra porque es
                         lo que hace comparable un nivel con otro de un vistazo. */
                      detalle: `Nivel ${i + 1} de ${nivelesDe(org).length}`,
                    }))}
                  />
                </label>
              )}

              <div className="pl-label">
                <span className="og-label-fila">
                  Estado
                  <AyudaCampo>
                    Desactivar no es borrar: el puesto deja de ofrecerse para cosas nuevas y
                    conserva su historia y a quien lo ocupó. Vale para todos los puestos de este
                    cargo.
                  </AyudaCampo>
                </span>
                <SelectorLista
                  valor={form.estado || 'activa'}
                  onCambio={v => set('estado', v || 'activa')}
                  placeholder="Activo"
                  opciones={Object.entries(estadosDe('cargo')).map(([id, e]) => ({ id, nombre: e.label }))}
                />
              </div>
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

            {/* LO QUE ES DEL PUESTO Y NO DEL CARGO: su código, su sede y a quién apoya. Son los
                mismos campos que antes vivían en las pestañas Funcional y Localización — solo que
                ahora cuelgan del puesto, que es de quien siempre fueron.

                Con uno solo van debajo de la definición, en la misma hoja. Con varios, el panel
                dice cuál y acá aparecen los suyos: una lista sola, no una acá y otra allá. */}
            {(unico || (sel !== 'cargo' && form.puestos[sel])) && (
            <section className="og-bloque">
              <div className="og-rot-bloque">
                {unico
                  ? (nuevo ? 'El puesto' : 'Este puesto')
                  : `Puesto ${sel + 1} de ${form.puestos.length}`}
                <em>{unico ? 'Lo suyo, no del cargo' : 'Solo este puesto'}</em>
              </div>
              {/* De qué cargo es. Con el puesto elegido el formulario no muestra el nombre —es del
                  cargo y vale para todos—, y sin esto no queda dicho adentro de qué se está. */}
              {!unico && (
                <p className="og-de-que-cargo">
                  <Layers size={11} />
                  {form.nombre.trim() || 'Sin nombre'} · {getUnidad(form.unidadId, org)?.nombre || 'Sin unidad'}
                </p>
              )}
              <PuestoFicha
                puesto={unico ? puestoUnico : form.puestos[sel]}
                org={org}
                sucursales={sucursales}
                puestosPorSede={puestosPorSede}
                unidadPropia={form.unidadId}
                cargoId={cargo?.id}
                jefes={todasIguales || !jefesPosibles.length ? null : jefesPosibles}
                /* Con uno solo el dato vive en el formulario; con varios, en su renglón de la
                   lista. Es el mismo campo escribiendo en dos lugares distintos, y por eso el
                   componente no sabe en cuál: se lo dice quien lo dibuja. */
                onCambio={parche => (unico
                  ? setForm(f => ({ ...f, ...parche, puestos: f.puestos.length ? [{ ...f.puestos[0], ...parche }] : [] }))
                  : setPuesto(sel, parche))}
              />
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
              {/* DOS BORRADOS, y la diferencia es qué pasa con los que cuelgan. "Eliminar" saca
                  este puesto y sube sus reportes un escalón; "Eliminar la rama" se lleva todo lo
                  que depende de él. En el dibujo, el segundo es el gesto que de verdad se pide
                  —se cerró un área entera— y hacerlo de a uno son nueve confirmaciones.

                  Solo aparece cuando hay algo colgando: con un cargo sin reportes las dos
                  puertas hacen exactamente lo mismo y hay que elegir entre dos botones iguales. */}
              <button className="pl-btn-delete og-btn-eliminar" onClick={() => onEliminar(cargo)}>
                <Trash2 size={13} /> Eliminar
              </button>
              {rama.length > 1 && (
                <button className="pl-btn-delete og-btn-rama" onClick={() => onEliminarRama(cargo)}>
                  <GitBranch size={13} /> Eliminar la rama · {rama.length}
                </button>
              )}
              <button className="pl-btn-cancel" onClick={onCerrar}>Cerrar</button>
              <button className="pl-btn-save og-btn-editar" onClick={() => setEditar(true)}>
                <Pencil size={13} /> Editar
              </button>
            </>
          ) : (
            <>
              {/* En el paso 2 el botón de la izquierda deja de cancelar y vuelve: cerrar el modal
                  entero desde la segunda pantalla tira a la basura lo que se escribió en la
                  primera, y la salida ya está en la cruz de la cabecera. */}
              {/* ELIMINAR EL PUESTO ELEGIDO. Va al extremo opuesto de Guardar —separado, no se
                  aprieta queriendo cerrar— y solo cuando hay más de uno: con uno solo, quitarlo
                  es eliminar el cargo, y para eso está el botón del detalle. */}
              {!unico && sel !== 'cargo' && (
                <button className="pl-btn-delete og-btn-eliminar" onClick={() => pedirQuitar(sel)}>
                  <Trash2 size={13} /> {nuevo ? 'Quitar' : 'Eliminar'} este puesto
                </button>
              )}
              <button className="pl-btn-cancel" onClick={cancelar}>Cancelar</button>
              <button className="pl-btn-save" disabled={!valido} onClick={guardar}>
                {/* Un botón que crea cinco cosas tiene que decir cuántas antes de crearlas. */}
                {nuevo
                  ? (form.puestos.length > 1 ? `Crear los ${form.puestos.length} puestos` : 'Crear cargo / puesto')
                  : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>

        {/* ELIMINAR UN PUESTO OCUPADO SE PREGUNTA, y se pregunta nombrando a quien lo ocupa: al
            guardar, esa persona se queda sin puesto en el organigrama. Un puesto vacante no
            pregunta nada —no arrastra a nadie, y Cancelar ya deshace todo lo del modal—.

            Va fijo a la ventana para salir del recorte del modal, igual que las listas de los
            desplegables. */}
        {aBorrar !== null && form.puestos[aBorrar] && (
          <div className="og-confirmar" onClick={() => setABorrar(null)}>
            <div className="og-confirmar-caja" onClick={e => e.stopPropagation()}>
              <div className="og-confirmar-hd">
                <span className="og-confirmar-ico"><Trash2 size={16} /></span>
                <strong>¿Eliminar este puesto?</strong>
              </div>
              <p>
                El puesto <strong>{form.puestos[aBorrar].codigo || `número ${aBorrar + 1}`}</strong>{' '}
                no está vacante.
              </p>
              {(form.puestos[aBorrar].ocupantes || []).map(getPersona).filter(Boolean).map(pe => (
                <div key={pe.id} className="og-confirmar-quien">
                  <Avatar persona={pe} size={26} />
                  <span>
                    <strong>{pe.name}</strong>
                    <em>se queda sin puesto y pasa a estar sin asignar</em>
                  </span>
                </div>
              ))}
              <div className="og-confirmar-acc">
                <button className="pl-btn-cancel" onClick={() => setABorrar(null)}>Cancelar</button>
                <button className="pl-btn-delete og-btn-eliminar" onClick={() => quitarPuesto(aBorrar)}>
                  <Trash2 size={13} /> Eliminar igual
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

/* Qué se lleva puesto cambiar de quién depende una unidad. Devuelve null cuando no arrastra
   nada, y entonces no se dice nada: avisar de un cambio que no ocurre entrena a ignorar los
   avisos. Ver la misma idea en el resto del constructor.

   El área con cargos no guarda su mando aparte: el dato es el "Reporta a" de su cabeza, y este
   aviso es el que dice en voz alta que tocar el campo del área va a mover ese cargo. */
/* `empresa` entra por parámetro y no por import: es una función suelta, no un componente, así
   que no puede leer el contexto por su cuenta. */
function avisoDeMudanza(unidad, form, org, empresa) {
  if (!unidad) return null
  const cabeza = cabezaDe(unidad.id, org)
  if (!cabeza) return null
  const mando = form.mandoId ?? null
  if (mando === (cabeza.reportaA ?? null)) return null
  const jefe = mando ? org.cargos.find(c => c.id === mando) : null
  if (jefe) return `Al guardar, ${cabeza.nombre} pasa a reportar a ${jefe.nombre}.`
  const donde = form.padreId ? getUnidad(form.padreId, org)?.nombre ?? 'su unidad' : empresa.nombre
  return `Al guardar, ${cabeza.nombre} deja de tener jefe y ${unidad.nombre} cuelga de ${donde}.`
}

/* ---------- Modal: alta y detalle de una unidad organizacional ---------- */

function UnidadModal({ unidad, base, org, onGuardar, onEliminar, onCerrar, onAbrirCargo, abrirEnEdicion }) {
  const { empresa, nodos, nivelesEstructura: nivelesEstr } = useOnboardingData()
  /* EL DIRECTORIO, ORDENADO. Es el mismo que ofrece la ficha: si las dos pantallas eligen entre
     listas distintas, el mismo nombre puede existir en una y no en la otra. */
  const personasDelDirectorio = useMemo(() => colaboradoresData
    .map(c => ({ nombre: c.name, cargo: c.cargo, initials: c.initials, color: c.color }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre)), [])
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
    /* LOS DOS QUE FALTABAN, Y NO ES UN CAPRICHO DE SIMETRÍA. La ficha de la tabla pide «Tipo de
       unidad» como OBLIGATORIO, así que una unidad creada desde acá nacía inválida: abrirla del
       otro lado exigía completar un campo antes de dejar guardar algo que ya estaba guardado.
       Desde que las dos pantallas escriben el mismo dato, un obligatorio que solo una de las dos
       pregunta no es una inconsistencia de estilo, es una pantalla contradiciendo a la otra.

       Descripción, responsable y dónde opera se quedan solo en la ficha: son opcionales y no hacen
       falta para dibujar. El modal crea rápido; la ficha completa. */
    tipoUnidad: unidad?.tipoUnidad || '',
    estado: unidad?.estado || 'activa',
    padreId: unidad ? unidad.padreId
      : base && 'padreId' in base ? base.padreId
      : (org.unidades[0]?.id ?? null),
    /* De qué cargo depende el área. Mientras no tiene cargos adentro el dato vive acá, porque
       no hay dónde más ponerlo; en cuanto tiene cabeza, el dueño del dato es esa cabeza y el
       campo lo lee de ella. Una sola verdad, mostrada desde el lado en que se está parado. */
    mandoId: (unidad ? cabezaDe(unidad.id, org)?.reportaA ?? unidad.mandoId : base?.mandoId) ?? null,
    /* Vacío no es un dato que falte: es «usa el de la unidad de la que cuelgo». */
    ubicacion: unidad?.ubicacion || '',
    responsable: unidad?.responsable || '',
    descripcion: unidad?.descripcion || '',
  }))

  /* LOS SITIOS QUE SE PUEDEN ELEGIR salen del árbol y no de las sucursales de la demo: acá una
     sede puede ser un nodo que alguien acaba de crear en Estructura. `arbol` los sangra por su
     propio `padreId`, así que las sucursales cuelgan de su regional como en la otra pantalla. */
  const sitios = useMemo(() => lugaresPosibles(nodos, nivelesEstr).map(n => ({
    id: n.id,
    nombre: `${peldanoDe(n.tipo, nivelesEstr)?.label}: ${n.nombre}`,
    padreId: n.padreId ?? null,
  })), [nodos, nivelesEstr])

  /* QUÉ DICE «NO DECLARAR NADA». En primer nivel, «toda la empresa»: no hay de quién heredar.
     Colgando de otra unidad, el sitio de su rama —se sube hasta la primera que declare uno— y se
     nombra al PADRE, que es de quien lo saca y donde se cambia. */
  /* SIN `useMemo`, como todo lo que depende del borrador: la dependencia sería un campo de
     `form` y lo que se ahorraría son dos búsquedas en una lista de decenas de unidades. */
  const heredaLugar = (() => {
    const padre = form.padreId ? org.unidades.find(u => u.id === form.padreId) : null
    if (!padre) return null
    let p = padre
    for (let i = 0; p && i < 30; i += 1) {
      if (p.ubicacion) {
        const sitio = sitios.find(x => x.id === p.ubicacion)
        if (sitio) return { id: sitio.id, lugar: sitio.nombre, de: padre.nombre }
      }
      p = p.padreId ? org.unidades.find(u => u.id === p.padreId) : null
    }
    return { id: null, lugar: 'Toda la empresa', de: padre.nombre }
  })()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valido = form.nombre.trim().length > 0 && !!form.tipoUnidad
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
  const mudanza = avisoDeMudanza(unidad, form, org, empresa)
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
                El identificador de la unidad en los reportes de RRHH. Es opcional: si la empresa no
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
              Tipo de unidad <em className="og-req">*</em>
              <AyudaCampo>
                Qué clase de unidad es. «Ventas» no dice si es una gerencia o un equipo de tres
                personas, y esa es la primera pregunta de cualquiera que mire el organigrama.
              </AyudaCampo>
            </span>
            <SelectorLista
              valor={form.tipoUnidad || null}
              onCambio={v => set('tipoUnidad', v || '')}
              placeholder="Elige uno"
              opciones={TIPOS_UNIDAD.map(t => ({ id: t, nombre: t }))}
            />
          </div>

          <div className="pl-label">
            <span className="og-label-fila">
              Estado
              <AyudaCampo>
                Desactivar no es borrar: la unidad deja de ofrecerse para cosas nuevas y conserva
                su historia y su gente.
              </AyudaCampo>
            </span>
            <SelectorLista
              valor={form.estado || 'activa'}
              onCambio={v => set('estado', v || 'activa')}
              placeholder="Activa"
              opciones={Object.entries(estadosDe('unidad')).map(([id, e]) => ({ id, nombre: e.label }))}
            />
          </div>

          <div className="pl-label">
            <span className="og-label-fila">
              Dentro de
              {/* Decía "es contención, no mando", que es la idea correcta contada en el idioma
                  del modelo de datos: hay que saber qué significa contención para entenderla.
                  Un ejemplo de área adentro de otra la explica sola. */}
              <AyudaCampo>
                La unidad que la contiene. Por ejemplo, <strong>Selección</strong> va dentro de{' '}
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

          {/* DÓNDE ESTÁ: LA OTRA DIMENSIÓN. «Dentro de» y «Bajo el mando de» son las dos preguntas
              del eje organizacional; esta es la del eje físico, y es la que decide si la unidad
              aparece al filtrar el dibujo por una sucursal.

              NO DECLARAR NADA ES UNA OPCIÓN Y SE LLAMA POR SU RESULTADO: la lista enseña qué sitio
              se hereda y de quién, así que elegir otro es un paso y no un descubrimiento. */}
          {sitios.length > 0 && (
            <div className="pl-label">
              <span className="og-label-fila">
                Dónde está
                <AyudaCampo>
                  La región, la sucursal o el centro de trabajo al que pertenece esta unidad y
                  todo lo que cuelgue de ella.<br /><br />
                  Es la sede de la unidad, <strong>no la de su gente</strong>: cada puesto puede
                  declarar otra si trabaja en otro sitio.
                </AyudaCampo>
              </span>
              <SelectorLista
                valor={form.ubicacion || null}
                /* Elegir el que ya se hereda vuelve a heredar, no lo copia. */
                onCambio={v => set('ubicacion', !v || v === heredaLugar?.id ? '' : v)}
                vacia={heredaLugar ? heredaLugar.lugar : 'Toda la empresa'}
                opciones={sitios}
                arbol
              />
              {heredaLugar && !form.ubicacion && (
                <p className="og-field-nota">Heredado de <strong>{heredaLugar.de}</strong></p>
              )}
              {heredaLugar && form.ubicacion && (
                <p className="og-field-nota">
                  Declarado en esta unidad: no cambia si <strong>{heredaLugar.de}</strong> se muda.
                </p>
              )}
            </div>
          )}

          {/* AL FINAL Y NO ENTRE MEDIO. Es el único campo largo del formulario, y puesto arriba
              empuja hacia abajo todo lo que sí hace falta para crear. */}
          <label className="pl-label">
            <span className="og-label-fila">Descripción</span>
            <textarea
              className="pl-input pl-area"
              rows={3}
              value={form.descripcion}
              placeholder="Qué hace esta unidad, de qué responde…"
              onChange={e => set('descripcion', e.target.value)}
            />
          </label>

          {/* QUIÉN RESPONDE POR EL ÁREA, que no es de quién depende. Este es una PERSONA y es a
              quién se le pregunta; el de abajo es un PUESTO y es lo que dibuja la línea. Puestos
              uno al lado del otro sin aclararlo se confunden, así que cada uno lo dice. */}
          <div className="pl-label">
            <span className="og-label-fila">
              Responsable
              <AyudaCampo>
                Quién contesta por esta unidad — una persona del directorio.<br /><br />
                <strong>No dibuja la línea del organigrama</strong>: eso lo hace «Bajo el mando
                de», que es un puesto y no una persona.
              </AyudaCampo>
            </span>
            <SelectorPersona
              valor={form.responsable}
              personas={personasDelDirectorio}
              onCambio={v => set('responsable', v || '')}
              ariaLabel="Responsable de la unidad"
              vacioNota="Cuando des de alta a tu gente en Colaboradores aparecerá aquí."
            />
          </div>

          {/* DE QUIÉN DEPENDE, que es distinto de dónde está. "Dentro de" agrupa; esto dibuja la
              línea. Se intentó deducirlo —colgar el área de la cabeza de su madre— y se cae en
              cuanto la madre tiene tres cargos sin jefe: el dibujo elegía uno adivinando. */}
          <div className="pl-label">
            <span className="og-label-fila">
              Bajo el mando de
              <AyudaCampo>
                El cargo del que depende esta unidad. Por ejemplo, <strong>Ventas</strong> bajo el
                mando del <strong>CEO</strong>: así se dibuja debajo de él y no a su lado.
                <br /><br />
                Se elige entre los cargos de la unidad que la contiene.
              </AyudaCampo>
            </span>
            <SelectorLista
              valor={form.mandoId}
              onCambio={v => set('mandoId', v)}
              vacia="Nadie: cuelga de la unidad"
              opciones={cargosDelPadre.map(c => ({
                id: c.id,
                nombre: c.nombre,
                detalle: filaDeCargo(c, org).ocupantes[0]?.name || 'Vacante',
              }))}
            />

            {!form.padreId && (
              <p className="og-field-nota">
                Al colgar de {empresa.nombre} la unidad no depende de ningún cargo.
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
                  Puestos de otras unidades que trabajan en esta. No pertenecen aquí ni se cuentan
                  entre sus cargos: se declara en el formulario de cada puesto, en{' '}
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
                        de {getUnidad(c.unidadId, org)?.nombre || 'sin unidad'}
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
              tipoUnidad: form.tipoUnidad || null,
              estado: form.estado || 'activa',
              padreId: form.padreId,
              mandoId: form.mandoId ?? null,
              ubicacion: form.ubicacion || '',
              responsable: form.responsable || '',
              descripcion: form.descripcion.trim(),
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
            <strong> Depende de</strong> y <strong>Ocupante</strong>. Las filas sin ocupante se cargan como vacantes.
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

/* LA BARRA DE LO SELECCIONADO. Una sola, usada por la tabla y por Cards: son la misma decisión
   —cuántos hay, soltarlos, borrarlos— y tenerla escrita dos veces terminaba en dos barras que se
   ven iguales hasta que alguien toca una de las dos. */
function BarraSeleccion({ cuantos, onSoltar, onEliminar }) {
  if (!cuantos) return null
  return (
    <div className="og-barra-sel">
      <strong>{cuantos} {cuantos === 1 ? 'cargo seleccionado' : 'cargos seleccionados'}</strong>
      <button type="button" className="og-barra-quitar" onClick={onSoltar}>Quitar la selección</button>
      <button type="button" className="og-barra-borrar" onClick={onEliminar}>
        <Trash2 size={13} /> Eliminar
      </button>
    </div>
  )
}

function CargoCard({ fila, onAbrir, funcional, elegido, onElegir }) {
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
  if (elegido) clases.push('og-cc-elegida')

  return (
    <div className={clases.join(' ')} onDoubleClick={() => onAbrir(cargo)}>
      {vacante && <span className="og-cc-tag">Vacante</span>}
      {/* LA CASILLA. Solo en las tarjetas de cargo: la grilla mezcla cargos con sub-unidades y
          un área con gente adentro no se puede borrar —lo impide su propia regla—, así que una
          casilla que a veces borra y a veces avisa que no puede es peor que no tenerla. */}
      {onElegir && (<label className="og-cc-check" onClick={e => e.stopPropagation()}>
        <Casilla marcado={!!elegido} onCambiar={onElegir} etiqueta={`Seleccionar ${cargo.nombre}`} />
      </label>)}
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
        <div className="og-cc-reporta"><ArrowUp size={10} /> Depende de <strong>{jefeNombre}</strong></div>
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

function VistaCards({ org, busca, setBusca, onAbrir, onEditarUnidad, onEliminarVarios }) {
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

  /* LO SELECCIONADO, igual que en la tabla y por las mismas razones. Cards es una grilla que se
     navega —un explorador de archivos— y ahí la casilla en la esquina de la tarjeta es el gesto
     que ya conoce cualquiera. */
  const [elegidos, setElegidos] = useState(() => new Set())

  useEffect(() => {
    setElegidos(prev => {
      if (prev.size === 0) return prev
      const vivos = new Set(org.cargos.map(c => c.id))
      const quedan = [...prev].filter(id => vivos.has(id))
      return quedan.length === prev.size ? prev : new Set(quedan)
    })
  }, [org.cargos])

  /* Entrar a otra área o buscar otra cosa suelta lo marcado: lo elegido siempre es lo que se
     está viendo, y arrastrar seis tarjetas de un área a otra pantalla sería una bomba puesta
     hace rato. */
  useEffect(() => { setElegidos(new Set()) }, [actual, q])

  const alternar = id => setElegidos(prev => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id); else s.add(id)
    return s
  })

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

      {/* Debajo de las migas y no dentro: la fila de migas crece con la ruta y meter ahí la
          barra la haría saltar de sitio según lo hondo que uno esté navegando. */}
      <BarraSeleccion
        cuantos={elegidos.size}
        onSoltar={() => setElegidos(new Set())}
        onEliminar={() => onEliminarVarios([...elegidos])}
      />

      <div className="og-scroll">
        {q ? (
          <>
            <Seccion titulo={`Resultados para "${q}"`} conteo={`${resultados.length} ${resultados.length === 1 ? 'cargo' : 'cargos'}`} />
            {resultados.length === 0
              ? <p className="og-vacio">Ningún cargo, persona ni unidad coincide con la búsqueda.</p>
              : <div className="og-grid">{resultados.map(f => <CargoCard key={f.cargo.id} fila={f} onAbrir={onAbrir} elegido={elegidos.has(f.cargo.id)} onElegir={() => alternar(f.cargo.id)} />)}</div>}
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
              : <div className="og-grid">{cargosAqui.map(f => <CargoCard key={f.cargo.id} fila={f} onAbrir={onAbrir} elegido={elegidos.has(f.cargo.id)} onElegir={() => alternar(f.cargo.id)} />)}</div>}

            {/* QUIÉNES APOYAN A ESTA ÁREA desde afuera. En sección aparte y no mezclados con los
                cargos: no son del área y no entran en su cuenta, igual que en el dibujo no suman
                al conteo de la píldora. La tarjeta va en azul, que es el color con el que se
                dibujan sus cuadros prestados. */}
            {apoyosAqui.length > 0 && (
              <>
                <Seccion
                  titulo="Apoyo funcional"
                  conteo={`${apoyosAqui.length} ${apoyosAqui.length === 1 ? 'puesto de otra unidad' : 'puestos de otras unidades'}`}
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

/* LA CASILLA. Un checkbox de verdad y no un div con un ícono: el navegador ya sabe marcarlo con
   la barra espaciadora, anunciarlo a un lector de pantalla y dibujar el tercer estado —el guion
   de "algunos sí"— que un div tendría que fingir. Solo se le cambia la piel.

   Frena el clic para que no llegue a la fila: la fila abre el cargo al doble clic y marcar dos
   casillas seguidas rápido no puede terminar abriendo un modal. */
function Casilla({ marcado, medio, onCambiar, etiqueta }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !marcado && !!medio
  }, [marcado, medio])
  return (
    <input
      ref={ref}
      type="checkbox"
      className="og-check"
      checked={marcado}
      onChange={onCambiar}
      onClick={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      aria-label={etiqueta}
    />
  )
}

function TipoPill({ tipo }) {
  const t = tipoVisual(tipo)
  return <span className={`og-tipo og-tipo-${t.clase}`} title={t.desc}><t.Icon size={10} /> {t.label}</span>
}

function VistaTabla({ org, busca, setBusca, onAbrir, onEliminarVarios }) {
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

  /* LO ELEGIDO, para borrar de a muchos. Vive acá y no en la pantalla a propósito: al cambiar de
     vista la tabla se desmonta y la selección se va con ella, que es lo que uno espera —volver
     al dibujo y encontrar ocho cargos todavía marcados sería una bomba puesta hace rato—. */
  const [elegidos, setElegidos] = useState(() => new Set())

  /* Lo borrado deja de estar elegido solo. Sin esto la barra seguiría contando cargos que ya no
     existen y el siguiente "Eliminar" pediría borrar fantasmas. */
  useEffect(() => {
    setElegidos(prev => {
      if (prev.size === 0) return prev
      const vivos = new Set(org.cargos.map(c => c.id))
      const quedan = [...prev].filter(id => vivos.has(id))
      return quedan.length === prev.size ? prev : new Set(quedan)
    })
  }, [org.cargos])

  const alternar = id => setElegidos(prev => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id); else s.add(id)
    return s
  })

  /* Marcar un grupo entero es marcar sus filas: la unidad en sí no se borra desde acá —un área
     con cargos adentro está bloqueada por su propia regla— y una casilla que a veces borra un
     área y a veces no sería imposible de explicar. */
  const marcarVarios = (ids, poner) => setElegidos(prev => {
    const s = new Set(prev)
    for (const id of ids) poner ? s.add(id) : s.delete(id)
    return s
  })

  /* Todo lo que se está viendo, filtro incluido: con "ventas" escrito arriba, la casilla del
     encabezado marca los de ventas y no los 300 de la empresa. */
  const idsVisibles = useMemo(() => visibles.flatMap(g => g.filas.map(f => f.cargo.id)), [visibles])
  const todos = idsVisibles.length > 0 && idsVisibles.every(id => elegidos.has(id))
  const algunos = idsVisibles.some(id => elegidos.has(id))

  return (
    <>
      {/* La barra va en la misma línea del buscador y no en una franja propia: el buscador ya
          está empujado a la derecha, así que ocupa el hueco de la izquierda y la tabla no se
          mueve un píxel cuando aparece. */}
      <div className="og-buscador-fila">
        <BarraSeleccion
          cuantos={elegidos.size}
          onSoltar={() => setElegidos(new Set())}
          onEliminar={() => onEliminarVarios([...elegidos])}
        />
        <Buscador value={busca} onChange={setBusca} />
      </div>

      <div className="og-tabla-wrap">
        <table className="og-tabla">
          <thead>
            <tr>
              {/* La casilla del encabezado: marca lo que se está viendo, no toda la empresa. */}
              <th className="og-th-check">
                <Casilla
                  marcado={todos}
                  medio={algunos}
                  onCambiar={() => marcarVarios(idsVisibles, !todos)}
                  etiqueta={todos ? 'Desmarcar todos' : 'Marcar todos los cargos a la vista'}
                />
              </th>
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
              <th>Depende de</th>
              <th className="og-th-acc">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map(g => {
              const cerrado = !!colapsados[g.id]
              const idsGrupo = g.filas.map(f => f.cargo.id)
              return (
                <Fragment key={g.id}>
                  <tr className={`og-grupo${g.unidad?.padreId === null ? ' og-grupo-raiz' : ''}`}>
                    {/* La casilla del grupo va en su propia celda y no dentro de la píldora: así
                        cae en la misma columna que las de abajo y se lee como la cabecera de esa
                        columna, que es lo que es. */}
                    <td className="og-td-check">
                      <Casilla
                        marcado={idsGrupo.length > 0 && idsGrupo.every(id => elegidos.has(id))}
                        medio={idsGrupo.some(id => elegidos.has(id))}
                        onCambiar={() => marcarVarios(idsGrupo, !idsGrupo.every(id => elegidos.has(id)))}
                        etiqueta={`Marcar los cargos de ${g.unidad?.nombre || 'sin unidad'}`}
                      />
                    </td>
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
                      className={[f.cargo.destacado && 'og-fila-top', elegidos.has(f.cargo.id) && 'og-fila-elegida'].filter(Boolean).join(' ') || undefined}
                      onDoubleClick={() => onAbrir(f.cargo)}
                    >
                      <td className="og-td-check">
                        <Casilla
                          marcado={elegidos.has(f.cargo.id)}
                          onCambiar={() => alternar(f.cargo.id)}
                          etiqueta={`Marcar ${f.cargo.nombre}`}
                        />
                      </td>
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
              bloqueo: sinAreas ? 'Primero hace falta una unidad donde ponerlo' : null,
              accion: onCargo,
            },
            {
              id: 'unidad', Icon: Building2, titulo: 'Unidad organizacional',
              detalle: 'Una unidad que agrupa cargos y otras unidades',
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
  /* `nodos` vuelve: el filtro de sede necesita el árbol para saber qué centros hay dentro de cada
     sucursal, y las sedes que ofrece salen de ahí y no de la lista vieja. */
  const { organigrama: org, setOrganigrama: setOrg, empresa, nodos } = useOnboardingData()
  const [vista, setVista] = useState('grafico')
  const [pestana, setPestana] = useState('completo')
  /* LA SEDE YA NO ES ESTADO DE ESTA PANTALLA: es el ámbito, y vive en el riel. Era el más
     visible de los cuatro filtros sueltos que había, y el más engañoso: se reiniciaba al salir,
     así que uno recortaba el organigrama a Santa Cruz, entraba a Puestos y volvía a ver la
     empresa entera sin que nada avisara del cambio.

     El hueco de la frase sigue estando y sigue funcionando igual —quien mira el dibujo espera
     poder cambiar de sede desde ahí—, solo que ahora mueve el ámbito de toda la aplicación, y la
     franja verde de arriba lo dice. */
  /* LOS FILTROS, EN UN PANEL. Antes eran dos desplegables en la barra oscura y dos controles
     flotando sobre el dibujo. Se juntaron porque contestan la misma pregunta —qué parte de la
     empresa estoy mirando— y porque en la barra ya no cabía uno más: el de tipo de puesto
     entraba a presión y el de vacantes no tenía dónde. */
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
  /* Tres posiciones: 'sin', 'con' o 'solo' los cuadros prestados. Clave nueva porque lo
     guardado antes era un booleano y llegaría como `true`. */
  const [verFuncionales, setVerFuncionales] = useLocalStorage('organigramaApoyos', 'con')
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
  /* El elemento de la barra donde el gráfico va a portalar su buscador. Es estado y no un ref
     para que el gráfico se vuelva a dibujar cuando la ranura aparece. */
  /* EN QUÉ SEDE SE ESTÁ MIRANDO. Es un FILTRO DE ESTA VISTA y no un ámbito: vive en la pantalla,
     arranca en «todas», se ve escrito en la frase de arriba y se quita tocándolo.

     Hubo un ámbito global de sucursal y se quitó por lo contrario de esto: venía elegido de
     fábrica, cambiaba lo que veías Y lo que creabas en seis pantallas, y recortaba el organigrama
     sin decir que lo estaba haciendo. La diferencia no es el filtro, es quién lo puso y si se ve. */
  const [sedeId, setSedeId] = useState(TODAS_SUCURSALES)

  const [ranuraBuscador, setRanuraBuscador] = useState(null)
  const [editando, setEditando] = useState(null)      // { cargo } | { cargo: null } para alta
  const [editandoUnidad, setEditandoUnidad] = useState(null) // { unidad } | { unidad: null }
  /* Las vistas leen la estructura recortada a la sede; los modales, la completa: al elegir
     jefe o unidad hay que poder apuntar a algo que el filtro dejó fuera de pantalla. */
  /* Primero el área y después la sede: los dos recortan y se aplican uno sobre el otro, así que
     "Marketing en La Paz" es una vista posible y no dos filtros que se pisan. */
  const orgVisible = useMemo(
    /* SIN ÁMBITO YA NO SE RECORTA POR SEDE. Quedaba `filtrarPorSucursal(..., sedeId)` envolviendo
       esto, con `sedeId` clavado en «todas»: una llamada que ya no podía hacer nada y que había
       que leer entera para descubrirlo. */
    () => filtrarPorSucursal(
      filtrarPorUnidad(org, unidadId),
      sedeId,
      /* Los sitios que valen por esa sede: ella y sus centros de trabajo. Un puesto que declara
         «Depósito Central» trabaja en Casa Matriz, aunque su id sea otro. */
      sedeId === TODAS_SUCURSALES ? null : lugaresDeSucursal(nodos, sedeId),
    ),
    [org, unidadId, sedeId, nodos],
  )
  /* Clase, nivel y estado no recortan la ESTRUCTURA: sacan cargos. El gráfico los poda con
     costura y las listas simplemente se quedan con los que pasan. */
  const recorteBlando = tipos.length > 0 || grados.length > 0 || estadoFiltro !== 'todos'
  const orgListas = useMemo(() => (
    recorteBlando
      ? { ...orgVisible, cargos: orgVisible.cargos.filter(c => coincideCargo(c, { tipos, grados, estado: estadoFiltro })) }
      : orgVisible
  ), [orgVisible, recorteBlando, tipos, grados, estadoFiltro])

  /* EL GRÁFICO YA NO APAGA: SACA. Clase, nivel y estado quitan el cuadro del dibujo y los que
     colgaban de él suben al primer jefe que sí pasó, con una marquita que dice cuántos quedaron
     en el medio. Apagar dejaba veintiséis cuadros grises alrededor de ocho encendidos y un pie
     que decía "8 a la vista" con 34 dibujados; ahora el número y la pantalla coinciden solas. */
  const orgPodado = useMemo(() => (
    recorteBlando
      ? podarConCostura(orgVisible, c => coincideCargo(c, { tipos, grados, estado: estadoFiltro }))
      : orgVisible
  ), [orgVisible, recorteBlando, tipos, grados, estadoFiltro])

  const tree = useMemo(
    () => buildOrgTree(pestana, orgPodado, {
      funcionales: verFuncionales,
      /* Se rescatan las unidades sin cargos, que es como se ve un organigrama a medio armar. La
         excepción de la sede se fue con el ámbito; queda la de los filtros de cargo, donde
         enseñar unidades vacías contradiría el recorte que se acaba de pedir. */
      /* Con una sede elegida tampoco: ahí una unidad sin puestos no existe. A diferencia del
         ámbito global de antes, esto ya no sorprende a nadie —la sede está escrita en la frase de
         arriba y la puso quien mira—. */
      vacias: !recorteBlando && sedeId === TODAS_SUCURSALES,
    }),
    [pestana, orgPodado, verFuncionales, recorteBlando, sedeId],
  )
  /* HUBO UN AVISO ACÁ —«N unidades quedaron fuera de la pantalla porque todavía no tienen
     puestos»— y se fue por donde nació mal: trataba como anomalía algo que es normal. Una unidad
     NO NECESITA PUESTOS para existir; recién creada no tiene ninguno y eso no es un estado a
     medias que haya que explicar con un cartel amarillo.

     Lo que quedaba debajo era cierto —el dibujo es más ancho que la pantalla y lo que cae al borde
     no se ve— pero eso le pasa a cualquier nodo del organigrama, no a las unidades vacías: es del
     lienzo y ya tiene su respuesta, el botón de ver todo. Un aviso que solo aparece para las
     unidades sin puestos las señalaba a ellas por un problema que no es suyo. */
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



  /* LAS SEDES SALEN DEL ÁRBOL Y NO DE LA LISTA VIEJA: se crean y se borran en Estructura física, y
     ofrecer una que ya no existe es ofrecer un filtro que deja el dibujo en blanco.

     LA CUENTA VA CON CADA UNA porque es la única pista que ayuda a elegir: «Sopocachi · 4» avisa
     antes de pulsar de que ese recorte deja cuatro cuadros. Se cuenta sobre el organigrama COMPLETO
     y no sobre lo ya filtrado, para que el número no cambie según por dónde se venga. */
  const sedes = useMemo(() => nodos
    .filter(n => n.tipo === 'sucursal' && n.estado !== 'cerrada')
    .map(s => {
      const dentro = lugaresDeSucursal(nodos, s.id)
      return {
        id: s.id,
        nombre: s.nombre,
        detalle: s.ciudad || undefined,
        n: org.cargos.filter(c => (c.sucursalIds || []).some(x => dentro.has(x))).length,
      }
    }), [nodos, org.cargos])

  const unidadVista = org.unidades.find(u => u.id === unidadId) || null

  /* Los cuatro recortes en un objeto: el panel los lee juntos y los devuelve en parches, así
     agregar uno nuevo no obliga a pasarle cuatro pares de props más. */
  const filtros = { sedeId, unidadId, tipos, grados, estado: estadoFiltro }
  const cambiarFiltro = parche => {
    if ('sedeId' in parche) setSedeId(parche.sedeId ?? TODAS_SUCURSALES)
    if ('unidadId' in parche) setUnidadId(parche.unidadId)
    if ('tipos' in parche) setTipos(parche.tipos)
    if ('grados' in parche) setGrados(parche.grados)
    if ('estado' in parche) setEstadoFiltro(parche.estado)
  }
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
          id: 'unidad', Icon: Building2, titulo: 'Unidad dentro',
          detalle: `Una unidad que cuelga de ${u.nombre}`,
          accion: () => setEditandoUnidad({ unidad: null, base: { padreId: u.id, mandoId: jefe } }),
        },
      ]
    },
    deCargo: c => [
      {
        id: 'cargo', Icon: User, titulo: 'Cargo que le reporta',
        detalle: `Cuelga de ${c.nombre}, en ${getUnidad(c.unidadId, org)?.nombre ?? 'su unidad'}`,
        accion: () => setEditando({ cargo: null, base: { reportaA: c.id, unidadId: c.unidadId } }),
      },
      {
        id: 'unidad', Icon: Building2, titulo: 'Unidad bajo su mando',
        detalle: `Una unidad nueva que responde a ${c.nombre}`,
        /* La misma regla que ya aplica el desplegable de mando: staff y outsourcing quedan
           fuera. Un área bajo un cuadro lateral desaparecía del dibujo entero, así que el
           motivo se dice en vez de dejar crear algo que no se va a ver. */
        bloqueo: esTipoDeclarado(tipoDe(c))
          ? 'Un puesto de apoyo o tercerizado no encabeza una unidad'
          : null,
        accion: () => setEditandoUnidad({ unidad: null, base: { padreId: c.unidadId, mandoId: c.id } }),
      },
    ],
    /* UNO MÁS IGUAL. Desde la pila —donde ya se ven los cinco— pedir el sexto no debería ser
       volver a escribir el nombre, el área, el jefe y la clase. Llega con todo eso puesto y con
       el código que sigue en la serie; lo único por decidir es la sede. */
    otroIgual: c => setEditando({
      cargo: null,
      base: {
        nombre: c.nombre,
        unidadId: c.unidadId,
        reportaA: c.reportaA,
        tipo: tipoDe(c),
        grado: c.grado ?? null,
        codigo: codigosDeSerie(c.codigo, 2, org)[1] || '',
      },
    }),
  }), [org])

  const vacio = org.unidades.length === 0
  /* CREAR VARIOS DE UNA. El modal manda `puestos` cuando se pidió más de uno: la definición común
     viaja en `form` y cada entrada trae lo suyo —código, sede, apoyos—. Se crean como cargos
     completos y no como casillas de un contenedor: cada uno lleva su código, así que cada uno es
     un puesto de verdad, con su cuadro, su ficha y su fila en la tabla.

     Editar nunca crea: con `editando.cargo` presente, `puestos` se ignora. Los cinco se crean una
     vez y de ahí en más cada uno se edita por su cuenta. */
  /* ESCRIBIR EL GRUPO. El modal manda la definición común y la lista de puestos: los que traen
     `id` ya existen y se actualizan, los que no traen nacen, y los de `quitados` se eliminan.

     Un cargo con cinco puestos son CINCO CARGOS con el mismo nombre, área, clase y jefe —eso es
     lo que la pila usa para agruparlos en el dibujo—, así que guardar el grupo es escribirlos a
     los cinco. Lo que es de cada uno viaja en su entrada y nunca se pisa con el valor común. */
  const guardar = form => {
    const { puestos, quitados, ...comun } = form
    /* Lo propio de cada puesto no puede salir del bloque común: mandarlo pisaría cinco sedes
       distintas con una sola. Sale de la entrada, no de acá. */
    /* LA JEFATURA SE VA CON LO PROPIO. Viajaba en el bloque común, así que escribir el grupo
       pisaba las cinco líneas de mando con una sola: era la razón de fondo por la que el modal
       tenía que abrir partido un cargo repartido. */
    const { codigo, sucursalIds, funcionales, ocupantes, reportaA, ...compartido } = comun

    setOrg(prev => {
      let cargos = prev.cargos
      if (quitados?.length) {
        for (const id of quitados) cargos = eliminarCargo(id, { ...prev, cargos }).cargos
      }
      for (const pz of (puestos || [])) {
        const propio = {
          codigo: (pz.codigo || '').trim() || null,
          sucursalIds: (pz.sucursalIds || []).slice(0, 1),
          funcionales: (pz.funcionales || [])
            .filter(f => f.unidadId && f.unidadId !== compartido.unidadId)
            .map(f => ({ unidadId: f.unidadId, reportaA: f.reportaA || null })),
          ocupantes: pz.ocupantes || [],
          /* Sin decidir, la común: es el caso de siempre —un cargo con una sola jefatura— donde
             el modal ni pregunta por puesto. `?? null` en los dos pasos para no confundir «no
             depende de nadie» con «falta contestarlo». */
          reportaA: (pz.jefe === undefined ? reportaA : pz.jefe) ?? null,
        }
        if (pz.id && cargos.some(c => c.id === pz.id)) {
          cargos = cargos.map(c => (c.id === pz.id ? { ...c, ...compartido, ...propio } : c))
        } else {
          cargos = [...cargos, { id: nuevoId('cargo', cargos), ...compartido, ...propio }]
        }
      }
      return { ...prev, cargos }
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
    /* De a muchos: uno por uno sobre el resultado del anterior, para que la regla de siempre
       —los reportes suben al jefe del que se va— se aplique en cadena cuando el jefe y el
       subordinado estaban los dos marcados. */
    if (borrando.tipo === 'cargos' || borrando.tipo === 'rama') {
      setOrg(prev => borrando.ids.reduce((o, id) => eliminarCargo(id, o), prev))
      /* La rama se pide desde la ficha, así que al confirmarla hay que cerrarla: quedaría
         abierta mostrando un puesto que ya no existe. */
      setEditando(null)
      setBorrando(null)
      return
    }
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
    /* LA RAMA. Acá los nombres SÍ se dicen: no son una selección que uno acaba de armar y tiene
       fresca, son los que el árbol arrastra sin que nadie los haya elegido. Se listan hasta seis
       y el resto se cuenta, que es donde una lista deja de leerse. Y el dibujo de atrás los tiene
       pintados en rojo mientras esto se decide. */
    if (borrando.tipo === 'rama') {
      const cuelgan = borrando.ids.slice(1).map(id => org.cargos.find(c => c.id === id)?.nombre).filter(Boolean)
      const gente = borrando.ids.filter(id => {
        const c = org.cargos.find(x => x.id === id)
        return c && ocupantesDe(c).length > 0
      }).length
      return (
        <>
          ¿Eliminar <strong>{borrando.obj.nombre}</strong> y los {cuelgan.length} puestos que dependen
          de él? No se puede deshacer.
          {' '}<em>{cuelgan.slice(0, 6).join(', ')}{cuelgan.length > 6 && ` y ${cuelgan.length - 6} más`}.</em>
          {gente > 0 && (
            <>
              {' '}{gente} {gente === 1 ? 'persona se queda' : 'personas se quedan'} sin puesto en el organigrama.
            </>
          )}
        </>
      )
    }
    /* De a muchos, el aviso cuenta lo que arrastra en vez de nombrarlo: con doce elegidos, doce
       nombres son una lista que nadie lee. Lo que importa es lo que NO se eligió y se mueve
       igual —los reportes que quedan huérfanos— y la gente que se queda sin cuadro. */
    if (borrando.tipo === 'cargos') {
      const n = borrando.ids.length
      const marcados = new Set(borrando.ids)
      const huerfanos = org.cargos.filter(c => !marcados.has(c.id) && marcados.has(c.reportaA)).length
      const conGente = borrando.ids.filter(id => {
        const c = org.cargos.find(x => x.id === id)
        return c && ocupantesDe(c).length > 0
      }).length
      return (
        <>
          {n === 1
            ? <>¿Eliminar el puesto <strong>{org.cargos.find(x => x.id === borrando.ids[0])?.nombre}</strong>? No se puede deshacer.</>
            : <>¿Eliminar los <strong>{n} puestos seleccionados</strong>? No se puede deshacer.</>}
          {huerfanos > 0 && (
            <>
              {' '}Otros {huerfanos} {huerfanos === 1 ? 'cargo depende' : 'cargos dependen'}
              {' '}de {n === 1 ? 'él' : 'alguno de los seleccionados'}:{' '}
              {huerfanos === 1 ? 'pasa' : 'pasan'} a depender del jefe que quede por encima.
            </>
          )}
          {conGente > 0 && (
            <>
              {' '}{conGente} {conGente === 1 ? 'persona se queda' : 'personas se quedan'} sin puesto en el organigrama.
            </>
          )}
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
        <div className="og-topbar-actions">
          {/* El color de la empresa se mudó a "Configurar colores": eran los dos juegos de color
              del organigrama repartidos en dos botones distintos de la misma barra, y nadie tenía
              por qué adivinar que la leyenda y la marca eran cosas distintas. */}
          {/* Importar y Exportar son el mismo asunto —el archivo que entra y el que sale—, así
              que van pegados y en ese orden: primero se carga el organigrama, después se lo
              saca. La configuración se fue al final, que es donde vive un engranaje. */}
          <button className="og-import" onClick={() => setImportar(true)} title="Importar el organigrama desde un Excel">
            <ArrowUpFromLine size={13} /> <span className="og-seg-txt">Importar</span>
          </button>
          {/* Exportar. Tres formatos porque son tres usos: la imagen que se pega en una
              presentación, el archivo que escala sin pixelarse, y el papel. */}
          <div className="og-marca">
            <button className="og-marca-btn" onClick={() => setExportAbierto(v => !v)} disabled={!!exportando} title="Exportar el organigrama">
              <ArrowDownToLine size={13} />
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
                      <small>El tono de cada clase de puesto y el color de tu empresa</small>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
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
      {/* LA FRASE, como segunda fila de la misma barra. Tuvo tarjeta propia un rato y sobraba:
          un recuadro blanco entre la barra y el lienzo era un tercer plano que no hacía falta y
          le comía 51 px al dibujo. Acá arriba se lee como parte del encabezado de la pantalla,
          que es lo que es: dice qué estás mirando.

          Reemplaza al botón "Filtrar", al panel de la derecha y a las fichas de abajo: los tres
          decían lo mismo en tres sitios, y ninguno lo decía sin abrirse. */}
      <FraseFiltro
        org={org}
        filtros={filtros}
        onCambio={cambiarFiltro}
        /* La ranura donde el gráfico dibuja su buscador: el buscador y los filtros son la misma
           familia —las dos formas de acotar lo que estás mirando— y tienen que leerse juntos. */
        sedes={sedes}
        ranuraBuscador={setRanuraBuscador}
      />

      {/* EL AVISO NOMBRA LA CAUSA Y OFRECE LA SALIDA, en ese orden. Decir solo «hay 3 unidades que
          no se ven» deja el trabajo a medias: lo que hace falta saber es POR QUÉ y qué apretar.
          Con una sede elegida, el botón la quita —es la causa más común y la que uno no sabe que
          puso—; con filtros de cargo, no hay botón porque están a la vista en la frase de arriba. */}
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
              /* La rama en rojo mientras se confirma. Se pasa un predicado y no una lista
                  porque es lo que ya hace el filtro con el atenuado, y una función que devuelve
                  falso siempre es más barata que repartir un Set vacío por todo el árbol. */
              condenado={borrando?.tipo === 'rama' ? c => borrando.ids.includes(c.id) : undefined}
              vista={{ pestana, setPestana, verFuncionales, setVerFuncionales, cuantosFuncionales }}
              ranuraBuscador={ranuraBuscador}
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
              onEliminarVarios={ids => setBorrando({ tipo: 'cargos', ids })}
            />
          )}
          {vista === 'tabla' && !vacio && (
            <div className="og-scroll">
              <VistaTabla
                org={orgListas}
                busca={busca}
                setBusca={setBusca}
                onAbrir={(c, aEditar) => setEditando({ cargo: c, editar: aEditar })}
                onEliminarVarios={ids => setBorrando({ tipo: 'cargos', ids })}
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
          titulo={{ cargo: 'Eliminar cargo / puesto', unidad: 'Eliminar unidad', rama: 'Eliminar la rama entera' }[borrando.tipo]
            || `Eliminar ${borrando.ids?.length} ${borrando.ids?.length === 1 ? 'cargo' : 'cargos'}`}
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
          org={org}
          onGuardar={guardar}
          onEliminar={cargo => setBorrando({ tipo: 'cargo', obj: cargo })}
          /* La ficha se cierra al pedir la rama, y no al confirmarla: es lo que deja ver el
             dibujo con la rama pintada de rojo detrás del diálogo, que es la única razón de
             pintarla. Con la ficha abierta encima, la advertencia volvía a ser un número. */
          onEliminarRama={cargo => {
            setBorrando({ tipo: 'rama', obj: cargo, ids: ramaDe(cargo.id, org) })
            setEditando(null)
          }}
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
