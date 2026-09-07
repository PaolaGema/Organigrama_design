import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, FolderTree, Pencil, Save, AlertTriangle } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { colaboradoresData, fotoDe } from '../personas/colaboradoresData'
import { useUser } from '../../context/UserContext'
import TarjetaCampos from '../../components/organizacion/TarjetaCampos'
import EmptyState from '../../components/layout/EmptyState'
import { ciudadesDe } from '../../data/paisesData'
import {
  tipoDe, gruposDe, padresPosibles, lugaresPosibles, filasEje, caminoDe, descendientes, ancestroDe, listaDe, anclajeDeCentro, padreDeCentro, cargosDeNodos, aplicarMandoDeUnidad, NEGOCIOS_COMUNES, OTRO, RAIZ,
} from '../../data/estructuraData'
import { descendientesDe } from '../../data/organigramaData'
import PastillaEstado from '../../components/organizacion/PastillaEstado'
import { ModalApoyoFuncional } from '../../components/organizacion/ApoyoFuncional'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'

/* LA FICHA DE UN NODO, sea del nivel que sea.
   Una sola pantalla para los seis tipos, porque la ficha no cambia de forma: cambia qué campos
   declara, y eso lo dice `gruposDe`. Es la misma `TarjetaCampos` de Datos de la empresa y de
   Sucursales, así que se lee y se edita igual sin una línea nueva — que era justamente lo que
   había que comprobar con esta prueba.

   LA RAÍZ SE GUARDA COMO `null` Y SE EDITA COMO `RAIZ`. En el formulario hace falta una opción
   que diga "Ninguna" y que se pueda elegir; en el dato, un padre inexistente es null y no una
   cadena mágica. La conversión pasa en los dos bordes de esta pantalla y en ningún otro lado del
   modelo. La constante vive en `estructuraData` porque es una regla del dato y no de esta
   pantalla: quien lea o escriba un padre tiene que hacer la misma conversión en sus dos bordes. */

const aForm = n => ({ ...n, padreId: n.padreId ?? RAIZ })

/* LOS CAMPOS DONDE «NINGUNA» ES UNA RESPUESTA. Todos guardan un id, y todos tienen que poder
   guardar la ausencia de uno; en el formulario esa ausencia necesita ser una opción elegible
   —si no, elegir por error es irreversible— y en el dato vuelve a ser lo que es: nada. La
   conversión pasa en los dos bordes de esta pantalla, igual que con el padre. */
const OPCIONALES = ['regionalId', 'sucursalId', 'centroPadre', 'ubicacion', 'mandoId', 'reportaA']

const aDato = f => {
  const salida = { ...f, padreId: f.padreId === RAIZ ? null : f.padreId }
  OPCIONALES.forEach(k => { if (salida[k] === RAIZ) salida[k] = '' })
  return salida
}

const vacio = v => !v || !String(v).trim()

export default function NodoDetalle({ nuevo = false }) {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { organigrama: org, empresa, nodos, setNodos, nivelesEstructura: niveles } = useOnboardingData()
  const { setDirty, setSaveHandler, guardNavigate } = useUnsavedChanges()
  const { currentUser } = useUser()


  const tipoNuevo = params.get('tipo')
  const padreNuevo = params.get('padre') || null

  const guardado = nuevo ? null : nodos.find(n => n.id === id) || null
  const tipo = nuevo ? tipoNuevo : guardado?.tipo

  /* UNA REGIONAL NUEVA NACE EN EL PAÍS DE LA EMPRESA. Se pregunta igual —una empresa puede tener
     una regional del otro lado de la frontera— pero contestada de antemano, que es el caso de
     casi todas: preguntar algo cuya respuesta ya sabemos es cobrarle a todo el mundo el precio
     de la excepción.

     SE MIRA SI EL NIVEL PIDE EL CAMPO en vez de nombrar «region» acá. Es la misma cuenta que hace
     la tabla para decidir sus columnas: el día que el país se le pregunte también a la sucursal,
     esto ya funciona sin tocarlo. */
  function formInicial() {
    /* UN CENTRO ABRE CON SUS TRES CASILLAS DE ANCLAJE PUESTAS. En el dato solo hay un `padreId`;
       repartirlo en regional, sucursal y centro superior es lo que hace que la ficha diga lo
       mismo que el árbol en vez de abrir los tres campos vacíos. */
    if (!nuevo) {
      if (!guardado) return null
      if (guardado.tipo === 'centro') return aForm({ ...guardado, ...anclajeDeCentro(guardado, nodos) })
      /* Sin lugar declarado, el campo abre en «Toda la empresa» ELEGIDO y no en gris: es la
         respuesta que tiene, no una que le falte. */
      if (guardado.tipo === 'unidad') return aForm({ ...guardado, ubicacion: guardado.ubicacion || RAIZ, mandoId: guardado.mandoId || RAIZ })
      if (guardado.tipo === 'puesto') return aForm({ ...guardado, ubicacion: guardado.ubicacion || RAIZ, reportaA: guardado.reportaA || RAIZ })
      /* Una unidad de negocio con un nombre que no está en la lista se abre en «Otro» con su
         nombre en el campo de al lado: el dato guardado es el nombre, y el desplegable es solo
         la forma de elegirlo. */
      if (guardado.tipo === 'negocio' && guardado.nombre && !NEGOCIOS_COMUNES.includes(guardado.nombre)) {
        return aForm({ ...guardado, nombre: OTRO, nombreOtro: guardado.nombre })
      }
      return aForm(guardado)
    }
    const pidePais = gruposDe(tipoNuevo, { personas: [], padres: [], ciudades: [], nivel: tipoDe(tipoNuevo, niveles), niveles })
      .some(g => g.campos.some(c => c.key === 'pais'))
    /* Y NACE EN EL PAÍS DE LO QUE TIENE ENCIMA, no en el de la empresa. Una sucursal que cuelga de
       una regional de Paraguay está en Paraguay, y arrancar con «Bolivia» porque la empresa es
       boliviana obliga a corregir un dato que el árbol ya sabía. Se sube por los padres hasta
       encontrar el primero que declare país, y si ninguno lo hace, cae en el de la empresa.

       El tope de vueltas es un cinturón: la regla del orden ya impide que un nodo sea su propio
       abuelo, pero un dato roto en `localStorage` no tiene por qué colgar la pantalla. */
    const paisDeArriba = () => {
      let n = nodos.find(x => x.id === padreNuevo)
      for (let i = 0; n && i < 20; i += 1) {
        if (n.pais) return n.pais
        n = n.padreId ? nodos.find(x => x.id === n.padreId) : null
      }
      return empresa?.pais || ''
    }
    /* Y NACE CON SUS «NINGUNA» PUESTAS. Un centro nuevo abre con regional, sucursal y centro
       superior en «Ninguna» elegido, no en gris: cuelga de la empresa hasta que se diga otra cosa,
       y eso es una respuesta válida con la que se puede guardar. */
    const sinAnclaje = tipoNuevo === 'centro'
      ? { regionalId: RAIZ, sucursalId: RAIZ, centroPadre: RAIZ }
      : ['unidad', 'puesto'].includes(tipoNuevo) ? { ubicacion: RAIZ } : {}
    return aForm({
      id: '', tipo: tipoNuevo, nombre: '', padreId: padreNuevo, estado: 'activa',
      ...sinAnclaje,
      ...(pidePais ? { pais: paisDeArriba() } : {}),
    })
  }
  const [form, setForm] = useState(formInicial)
  /* CON QUÉ NACIÓ EL FORMULARIO, para saber si hay algo que perder. Creando un nodo no hay nada
     guardado contra qué comparar, así que sin esto «tienes cambios sin guardar» no se enteraba
     nunca de un formulario a medio llenar. Se guarda una vez, al montar. */
  const [inicial] = useState(() => JSON.stringify(formInicial()))
  /* Se abre en edición si se llegó por el lápiz de la tabla —`?editar=1`— o si es un nodo que
     se está creando. Pulsando la fila, o «Ver detalle», se llega a ESTA MISMA PANTALLA en
     lectura: los campos son los mismos y están donde van a estar, solo que bloqueados, y
     «Editar» los activa en el sitio. Leer y corregir no son dos pantallas que haya que aprender
     por separado; es una, con la llave puesta o no. */
  const [editando, setEditando] = useState(nuevo || params.get('editar') === '1')
  const [intento, setIntento] = useState(false)
  /* Si está abierto el editor de «dónde más trabaja». Vive acá y no en el modelo: es una pantalla
     abierta encima de otra, no un campo del formulario. */
  const [funcional, setFuncional] = useState(false)
  /* HAY UNA SOLA FORMA DE CREAR, y es el botón «Agregar» de la lista. Hubo un «Agregar dentro»
     acá, en la ficha, y se sacó: dos caminos para lo mismo obligan a preguntarse en qué se
     diferencian, y no se diferencian en nada —de qué cuelga el nodo nuevo se elige igual, en el
     campo «Depende de» del formulario—. Un camino, y el padre es un campo como cualquier otro. */

  const personas = useMemo(() => {
    const directorio = colaboradoresData
      .map(c => ({ nombre: c.name, cargo: c.cargo, foto: fotoDe(c), initials: c.initials, color: c.color }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
    const yo = {
      nombre: currentUser.name, cargo: currentUser.cargo,
      foto: null, initials: currentUser.initials, color: currentUser.color, tu: true,
    }
    return directorio.some(p => p.nombre === yo.nombre) ? directorio : [yo, ...directorio]
  }, [currentUser])

  /* Los padres válidos salen de la regla del orden, y por eso la lista nunca ofrece un disparate:
     un área no puede colgar de un cargo, ni un nodo de sí mismo. «Ninguna» va primera porque es
     la respuesta de todo lo de primer nivel. */
  const padres = useMemo(() => {
    const candidatos = padresPosibles(form ? { ...form, tipo } : null, nodos, niveles)
      .filter(n => n.id !== id)

    /* UN PELDAÑO ANIDABLE SE ELIGE SOBRE SU PROPIO ÁRBOL, no sobre una lista plana.
       Los candidatos a padre de una unidad son otras unidades, y entre ellas hay jerarquía: en
       una lista suelta, «Recursos Humanos», «Análisis» y «ghjb» se leen como tres opciones
       hermanas cuando una cuelga de la otra —y elegir la equivocada no da ningún aviso, porque
       las tres son respuestas válidas—.

       Se ordenan como el árbol y cada una viaja con su profundidad, así que el desplegable las
       sangra igual que la tabla. Es la misma función que arma las filas de la lista, `filasEje`,
       y por eso no puede discrepar de lo que se ve allá: si alguien mueve una unidad, este
       desplegable se entera el mismo día.

       Sin el tipo delante del nombre: acá son todas del mismo peldaño y repetir «Unidad
       organizacional:» en cada renglón gasta el ancho que necesita la sangría. */
    const posibles = tipoDe(tipo, niveles)?.anidable
      ? (() => {
          /* Cada opción viaja además con SU CAMINO, que es lo único que la ubica cuando la
             búsqueda aplana la lista. Se arma con una pila mientras se recorre el árbol: en el
             nivel N, el camino son los nombres de los niveles anteriores. */
          const pila = []
          return filasEje(candidatos, [tipo]).map(f => {
            pila[f.nivel] = f.nodo.nombre
            return {
              valor: f.nodo.id,
              etiqueta: f.nodo.nombre,
              nivel: f.nivel,
              pista: pila.slice(0, f.nivel).join(' › '),
            }
          })
        })()
      : candidatos.map(n => ({ valor: n.id, etiqueta: `${tipoDe(n.tipo, niveles)?.label}: ${n.nombre}` }))
    /* «NINGUNA», NO «EMPRESA: FARMAVIDA». La pregunta es de qué NIVEL de la estructura cuelga
       este nodo, y la empresa no es un nivel que se elija: todo lo que se crea acá es de la
       empresa, así que ofrecerla como opción es hacer contestar algo que ya está contestado —y
       encima la ponía a competir en la lista con las regionales, escrita igual que ellas, como
       si fuera una más.

       Que la opción diga lo mismo que guarda el dato por dentro (`padreId: null`) no cuesta
       nada acá: la miga de pan de esta misma ficha sigue arrancando en FarmaVida, así que dónde
       queda el nodo en el árbol se ve igual, sin tener que declararlo. */
    return [{ valor: RAIZ, etiqueta: 'Ninguna' }, ...posibles]
  }, [form, tipo, nodos, niveles, id])

  /* LAS CIUDADES SALEN DEL PAÍS DEL NODO, y del de la empresa solo cuando el nodo no tiene uno
     propio —la sucursal y el centro de trabajo no lo declaran—. Es lo que hace que una regional
     en Asunción pueda elegir Asunción: mientras el catálogo colgaba únicamente del país de la
     empresa, cualquier nodo fuera de él tenía que escribir su ciudad a mano y no agrupaba con
     nada. */
  /* Sin `useMemo`: `ciudadesDe` devuelve el mismo array del catálogo cada vez —no construye uno
     nuevo— así que memorizarlo no ahorraba nada y obligaba a declarar como dependencia un campo
     del borrador, que es justo lo que el compilador de React no puede seguir. */
  const ciudades = ciudadesDe(form?.pais || empresa?.pais)
  /* SIN `useMemo`, y a propósito. La ficha ya no depende solo del tipo: hay campos que aparecen
     según lo que haya escrito —el cargo del responsable, en cuanto se elige a alguien— así que
     tendría que declarar el borrador entero como dependencia, que es lo que el compilador de
     React no puede seguir. Y no hay nada que ahorrar: son una docena de objetos literales, el
     mismo trabajo que hace el propio `useMemo` para decidir si los rehace. */
  /* LOS LUGARES DONDE PUEDE OPERAR UNA UNIDAD: el árbol físico entero, de regional a centro de
     trabajo. Se calcula acá y no dentro del modelo porque es la misma cuenta que los padres —una
     lista de opciones para un desplegable— y comparte su forma: el tipo delante del nombre, que
     es lo único que distingue «Central» sucursal de «Central» depósito. */
  /* LOS LUGARES VAN CRUDOS AL MODELO. Antes salían de acá ya convertidos en opciones y eso les
     quitaba de quién cuelga cada uno, que es justo lo que el formulario del centro necesita para
     que «Sucursal» solo ofrezca las de la regional elegida. Convertir es trabajo de quien dibuja
     el campo, no de quien lo trae. */
  const lugares = useMemo(() => lugaresPosibles(nodos, niveles), [nodos, niveles])
  /* LOS NIVELES DE MANDO SON UN DATO DE LA EMPRESA —se renombran y se reordenan en
     Configuración— así que salen del organigrama guardado y no de una constante. Sin respaldo a
     propósito: si la empresa se quedó sin ninguno, el campo tiene que verse vacío y mandar a
     crearlos, no inventarle tres.

     El VALOR es el id y la ETIQUETA el nombre: renombrar «Mando medio» a «Jefatura» no puede
     desconectar a los cargos que ya lo tenían puesto. */
  const mandos = useMemo(
    () => (org.niveles || []).map(n => ({ valor: n.id, etiqueta: n.nombre })),
    [org.niveles],
  )

  /* LO QUE UN PUESTO HEREDA DE SU CARGO. Se resuelve acá y no en el modelo porque hay que subir
     dos escalones del árbol —del puesto a su cargo, y del cargo a su unidad— y el modelo dibuja
     campos, no recorre nodos. */
  /* SIN `useMemo`, como todo lo que depende del borrador: la dependencia sería un campo de
     `form`, que es justo lo que el compilador de React no puede seguir, y lo que se ahorraría
     son dos búsquedas en una lista de decenas de nodos. */
  const cargoDelPuesto = tipo === 'puesto' ? nodos.find(n => n.id === form?.padreId) : null
  const heredado = cargoDelPuesto ? {
    unidad: nodos.find(n => n.id === cargoDelPuesto.padreId)?.nombre || '',
    mando: (org.niveles || []).find(m => m.id === cargoDelPuesto.nivelMando)?.nombre || '',
  } : null

  /* EL TOPE DEL CARGO, VERIFICADO DE VERDAD. «Máximo de personas» era hasta ahora un número que
     nadie miraba: se declaraba en el cargo y no impedía nada. Un límite que no limita es peor
     que ninguno, porque hace creer que el sistema lo está cuidando.

     Se cuenta contra los puestos que ya cuelgan de ese cargo, excluyéndose a sí mismo: editar un
     puesto que ya existe no puede contarse dos veces y bloquear su propio guardado. */
  const tope = (() => {
    const max = Number(cargoDelPuesto?.maxPersonas)
    if (!cargoDelPuesto || !max) return null
    const usados = nodos.filter(n => n.tipo === 'puesto' && n.padreId === cargoDelPuesto.id && n.id !== id).length
    return usados >= max
      ? `«${cargoDelPuesto.nombre}» ya tiene ${usados} de ${max} puestos, que es el máximo declarado en el cargo.`
      : null
  })()

  /* DE QUÉ PUESTO PUEDE COLGAR ESTA UNIDAD: de los de su unidad superior, y de ninguno más. El
     jefe de una unidad es alguien de la de arriba; ofrecer el organigrama entero convertiría el
     campo en una línea de mando paralela a la del dibujo.

     SIN STAFF NI TERCERIZADOS. El gráfico los dibuja al costado y sin nada colgando —eso es lo que
     significa «asiste sin mandar»— así que una unidad puesta bajo uno de ellos desaparecía del
     organigrama entero. Es la misma regla que ya aplica el desplegable del modal.

     SIN `useMemo`, como todo lo que depende del borrador: la dependencia sería un campo de `form`,
     que es justo lo que el compilador de React no puede seguir. */
  /* Y PARA UN PUESTO, DE QUIÉN PUEDE DEPENDER: cualquier otro, menos él mismo y menos los que
     cuelgan de él. Lo segundo el modal del dibujo no lo filtra y debería: un puesto puesto bajo su
     propio subordinado arma un círculo que el árbol no puede dibujar. */
  const jefesDelPuesto = () => {
    const plazas = cargosDeNodos(nodos)
    /* `descendientesDe` devuelve un SET DE IDS, no una lista de plazas —y ya trae adentro la
       propia—, así que se usa tal cual y el filtro no necesita excluirla aparte. Tratarlo como
       arreglo tiraba la ficha entera: abrir cualquier puesto o crear uno nuevo moría en
       «.map is not a function» antes de dibujar nada. */
    const abajo = descendientesDe(id, { cargos: plazas })
    return plazas
      .filter(c => !abajo.has(c.id))
      .map(c => ({ valor: c.id, etiqueta: c.nombre }))
  }

  const jefes = tipo === 'unidad'
    ? (form?.padreId && form.padreId !== RAIZ
      ? cargosDeNodos(nodos)
        .filter(c => c.unidadId === form.padreId && (c.tipo || 'colaborador') === 'colaborador')
        .map(c => ({ valor: c.id, etiqueta: c.nombre }))
      : [])
    : tipo === 'puesto' ? jefesDelPuesto() : []

  /* LO QUE SE ENSEÑA SIN DEJAR EDITAR en la ficha del puesto. Se arma acá y no en el modelo porque
     hay que cruzar tres cosas —los apoyos del puesto, las coordinaciones del organigrama y los
     nombres de las unidades— y el modelo dibuja campos, no arma frases. */
  /* CUÁNTAS SILLAS TIENE ESTE CARGO. Es lo primero que hay que poder contestar mirando su ficha, y
     hasta ahora no se decía en ninguna parte: se creaba «Analista», se iba a Puestos y no había
     nada, sin un solo sitio donde enterarse de que el cargo había nacido hueco. */
  const sillasDelCargo = () => {
    const n = nodos.filter(x => x.tipo === 'puesto' && x.padreId === id).length
    return n ? `${n} ${n === 1 ? 'puesto' : 'puestos'}` : ''
  }

  const vinculos = tipo === 'cargo' ? { sillas: sillasDelCargo() } : tipo === 'puesto' ? (() => {
    const plaza = cargosDeNodos(nodos).find(c => c.id === id)
    const nombreUnidad = uid => nodos.find(n => n.id === uid)?.nombre || uid
    const nombrePlaza = pid => cargosDeNodos(nodos).find(c => c.id === pid)?.nombre || pid
    const propios = plaza?.funcionales || []
    const apoyos = propios.map(f => nombreUnidad(f.unidadId))
    const coordina = (org.relaciones || [])
      .filter(r => r.origen === id || r.destino === id)
      .map(r => nombrePlaza(r.origen === id ? r.destino : r.origen))
    /* EL VALOR ES UN BOTÓN Y NO UN TEXTO. `deducido` se pinta tal cual, así que puede ser un
       elemento: el dato se sigue leyendo igual y además se puede tocar. Era lo único de esta ficha
       que decía «se declara en el organigrama» —o sea, «andá a buscarlo a otra pantalla»— para algo
       que es del puesto y se edita en dos desplegables. */
    return {
      apoyos: (
        <button type="button" className="est-silla-func" onClick={() => setFuncional(true)}>
          {apoyos.length ? apoyos.join(' · ') : 'Solo en su unidad'}
        </button>
      ),
      coordina: [...new Set(coordina)].join(' · '),
      otrosPuestos: cargosDeNodos(nodos).filter(c => c.id !== id).length,
    }
  })() : null

  const grupos = tipo
    ? gruposDe(tipo, { personas, padres, ciudades, nivel: tipoDe(tipo, niveles), niveles, valores: form, lugares, mandos, jefes, vinculos, heredado })
    : []

  /* La lista de la que salió este nodo, deducida de su tipo. Todo lo que "vuelve" —la flecha
     de arriba, Cancelar, y el borrado— usa esta y no una ruta escrita a mano. */
  const lista = listaDe(tipo || 'sucursal', niveles)
  /* LA FLECHA PREGUNTA ANTES DE TIRAR. Es el mismo guardián que ya protege al menú lateral, y es
     lo que convierte a la flecha en una salida honesta: sin nada pendiente sale directo, y con
     el formulario a medias ofrece guardar o descartar en vez de decidirlo por su cuenta. */
  const volver = () => guardNavigate(() => navigate(lista.ruta))

  /* LOS OBLIGATORIOS SALEN DE LOS PROPIOS CAMPOS, no de una lista escrita aparte.
     Estaba comprobado a mano y solo el nombre: Ciudad, Orden para planillas y Dirección para
     liquidaciones llevaban su asterisco rojo, tenían escrito su mensaje de falta… y se guardaban
     vacíos igual. Un asterisco que no impide nada es peor que no ponerlo, porque enseña que los
     avisos de esta pantalla no van en serio.

     Recorriendo `grupos` —lo mismo que dibuja el formulario— no hay dos verdades y no hay nada
     que acordarse de actualizar: el campo que mañana se marque `requerido` queda cubierto el
     mismo día, y el que deje de serlo también. */
  const faltantes = form
    ? grupos.flatMap(g => g.campos).filter(c => c.requerido && vacio(form[c.key]))
    : []

  /* Con uno que falte se dice POR QUÉ hace falta, que es lo que cada campo trae escrito en su
     `faltaMsg` —«Es el domicilio que sale en cada finiquito»— y no un «campo obligatorio» que no
     enseña nada. Con varios se nombran todos: hace falta saber cuántas paradas quedan antes de
     poder guardar, no descubrirlas de una en una. */
  /* El tope se antepone a los campos que falten: es lo único que no se arregla completando algo
     de esta ficha, así que decirlo primero evita mandar a llenar campos que no van a servir. */
  const problema = tope || (!form ? 'Falta el nodo'
    : faltantes.length === 1
      ? (faltantes[0].faltaMsg || `Falta ${faltantes[0].label.toLowerCase()}.`)
      : faltantes.length > 1
        ? `Faltan ${faltantes.length} campos obligatorios: ${faltantes.map(c => c.label).join(', ')}.`
        : null)

  /* Si el borrador es idéntico a lo guardado no hay nada que guardar. Se compara el objeto
     entero y no campo por campo: cualquier campo que se agregue mañana entra solo. Creando, lo
     "guardado" es con qué nació el formulario. */
  const cambiado = nuevo
    ? JSON.stringify(form) !== inicial
    : !!guardado && JSON.stringify(form) !== JSON.stringify(aForm(guardado))
  const sinCambios = !nuevo && !cambiado

  useEffect(() => { if (!editando && guardado) setForm(aForm(guardado)) }, [editando, guardado])

  /* EL AVISO DE CAMBIOS SIN GUARDAR, el mismo que ya tenían la ficha de la empresa y la de la
     sucursal. Esta pantalla era la única de las tres que no lo declaraba, así que salir por el
     menú con el formulario a medias se llevaba lo escrito sin preguntar — y por eso esta ficha
     había tenido que ESCONDER su flecha de volver mientras se editaba: era tapar un agujero
     quitando la puerta. Declarado el aviso, la flecha puede quedarse siempre, como en las otras
     dos, y quien la pulse con algo sin guardar recibe la pregunta en vez del silencio. */
  useEffect(() => {
    setDirty(editando && cambiado && !problema)
    return () => setDirty(false)
  }, [editando, cambiado, problema, setDirty])

  function guardar() {
    if (problema) { setIntento(true); return }
    /* EL PUESTO SE LLAMA COMO SU CARGO. No tiene campo de nombre —lo que lo distingue es su
       código y quién lo ocupa— pero el árbol necesita uno para listarlo, así que se toma del
       cargo al guardar. Copiado y no deducido a propósito: si mañana el cargo se renombra, este
       nombre queda viejo, y eso se arregla releyéndolo en la tabla, no guardando dos verdades.
       Mientras tanto la tabla lo muestra y nadie ve una fila sin nombre. */
    const nombreFinal = tipo === 'puesto'
      ? (nodos.find(n => n.id === form.padreId)?.nombre || 'Puesto')
      : (form.nombre || '').trim()
    const base = aDato({ ...form, nombre: nombreFinal })
    /* Los tres desplegables del centro son un solo padre, y manda el más específico: el árbol no
       entiende de regionales y sucursales a la vez. */
    const conPadre = tipo === 'centro' ? { ...base, padreId: padreDeCentro(form) } : base
    /* «Otro» es de la pantalla y no del dato: lo escrito pasa a ser el nombre y el campo
       auxiliar no llega al nodo. Sin esto quedarían dos datos para una sola respuesta. */
    const datos = conPadre.nombre === OTRO
      ? (({ nombreOtro, ...resto }) => ({ ...resto, nombre: (nombreOtro || '').trim() }))(conPadre)
      : conPadre
    if (nuevo) {
      /* El id sale del nombre, como los del catálogo de siempre, con un número detrás si ya
         existe. En el producto de verdad lo daría el servidor. */
      const raiz = datos.nombre.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'nodo'
      let nid = raiz
      let n = 2
      while (nodos.some(x => x.id === nid)) { nid = `${raiz}-${n}`; n += 1 }
      /* EL CARGO NACE SOLO, SIN SILLAS. Acá se creaban tantos puestos como dijera «Puestos que se
         abren ahora», y esa pregunta se fue del formulario: el cupo del cargo ya dice cuántas
         sillas tiene, y la lista de cargos las despliega debajo. Abrir una es completarla ahí. */
      setNodos(prev => [...prev, { ...datos, id: nid }])
      setDirty(false)
      setEditando(false)
      /* AL CREAR SE VUELVE A LA LISTA, no a la ficha de lo recién creado. Uno no crea una
         regional para quedarse mirándola: la crea para tenerla en la tabla, y casi siempre para
         crear la siguiente. Dejar la ficha abierta obligaba a un clic más —la flecha de atrás—
         antes de poder hacer cualquier otra cosa.

         `replace` para que la flecha del navegador no devuelva al formulario vacío que ya se
         guardó. */
      navigate(lista.ruta, { replace: true })
      return
    }
    setNodos(prev => {
      const actualizado = prev.map(x => (x.id === id ? { ...x, ...datos } : x))
      /* GUARDAR EL MANDO DE UNA UNIDAD TOCA TAMBIÉN A SU CABEZA. Con puestos adentro, el dibujo lee
         la línea del «Reporta a» de esa cabeza y no de `unidad.mandoId`: escribir solo el campo de
         la ficha lo dejaría guardado y sin efecto, que es la peor clase de campo. */
      return tipo === 'unidad'
        ? aplicarMandoDeUnidad(actualizado, id, datos.mandoId ?? null)
        : actualizado
    })
    setDirty(false)
    setEditando(false)
  }

  /* Guardar desde el aviso de salida es este mismo guardado. SIN LISTA DE DEPENDENCIAS, igual
     que en la ficha de la sucursal: `guardar` se rehace en cada dibujo, y una lista que no la
     incluyera dejaría registrada una versión con el formulario viejo dentro. */
  useEffect(() => {
    setSaveHandler(() => { if (!problema) guardar() })
    return () => setSaveHandler(null)
  })

  if (!tipo || (!nuevo && !guardado)) {
    return (
      <div className="content-scroll">
        <button className="det-back" onClick={volver}>
          <ArrowLeft size={15} /> {lista.label}
        </button>
        <div className="sec-card">
          <EmptyState
            icon={FolderTree}
            title="No encontramos este nodo"
            description="Puede que se haya eliminado desde otra pantalla."
            actionLabel={`Volver a ${lista.label}`}
            onAction={volver}
          />
        </div>
      </div>
    )
  }

  const t = tipoDe(tipo, niveles)
  const camino = nuevo ? [] : caminoDe(id, nodos).slice(0, -1)
  const hijos = nuevo ? [] : descendientes(id, nodos)
  const suc = nuevo ? null : ancestroDe(id, 'sucursal', nodos)

  /* CAMBIAR EL PAÍS VACÍA LA CIUDAD. Las ciudades salen del país, así que dejar «Lima» debajo de
     «Bolivia» es guardar una contradicción que nadie vuelve a mirar. El desplegable conserva a
     propósito los valores que no están en su lista —para no borrar en silencio lo que alguien
     escribió a mano antes de que el campo fuera una lista—, y sin esto ese rescate se convierte
     justo en el error que evita: una ciudad de otro país, elegida, guardada y con pinta de bien.

     Solo cuando el país CAMBIA de verdad: reelegir el mismo no tiene por qué borrar nada. */
  function set(k, v) {
    setForm(prev => (k === 'pais' && v !== prev.pais
      ? { ...prev, pais: v, ciudad: '', departamento: '' }
      : k === 'departamento' && v !== prev.departamento
        ? { ...prev, departamento: v, ciudad: '' }
      : { ...prev, [k]: v }))
  }



  /* LA FLECHA SE QUEDA SIEMPRE, COMO EN TODAS LAS DEMÁS FICHAS.
     Se escondía mientras se editaba, con el argumento de que duplicaba a «Cancelar» y de que
     tiraba lo escrito sin avisar. Lo segundo era cierto y ya no lo es —esta ficha declara el
     aviso de cambios sin guardar, así que la flecha pregunta—, y quitada la mentira se cae lo
     primero: no hacen lo mismo. La flecha NAVEGA —es la misma de la ficha de la empresa y la de
     la sucursal, en el mismo sitio de la pantalla, y es lo que uno busca para volver— y
     «Cancelar» CIERRA EL MODO EDICIÓN, que no siempre termina en la lista.

     Y esconderla tenía su propio precio: esta era la única pantalla del módulo donde la esquina
     de arriba a la izquierda cambiaba de contenido según lo que estuvieras haciendo. */

  return (
    <div className="content-scroll">
      <button className="det-back" onClick={volver}>
        <ArrowLeft size={15} /> {lista.label}
      </button>

      <div className="pl-header">
        <div style={{ minWidth: 0 }}>
          {/* LAS MIGAS SON UN CAMINO, Y CREANDO TODAVÍA NO HAY CAMINO. En la pantalla de crear se
              quedaban en una sola palabra —«FarmaVida»— sin flecha, sin enlace y sin nada
              alrededor: el nombre de la empresa suelto sobre el título, que ya está en el resto
              de la pantalla y no dice nada de lo que se está creando.

              Y encima se quedaba quieta: eligiendo «Oriente» en «Depende de», el nodo pasa a
              colgar de Oriente y las migas seguían diciendo «FarmaVida» a secas. Una miga que no
              sigue al dato es peor que ninguna, porque se lee como si fuera verdad.

              Con el nodo ya guardado sí son un camino —«FarmaVida › Oriente › Casa Matriz», con
              cada tramo pulsable— y ahí se quedan: es lo que reemplaza a declarar la sucursal a
              mano, que es media gracia del modelo. */}
          {/* SIN CAMINO NO HAY MIGAS. Un nodo que cuelga directo de la empresa dejaba arriba del
              título el nombre de la empresa solo —«FarmaVida», sin flecha, sin enlace y sin nada
              detrás—: una palabra suelta que no es un camino, que ya está en el resto de la
              pantalla y que solo hace ruido encima del nombre que uno vino a leer. Con algo
              encima sí son un camino y ahí se quedan, con la empresa de raíz. */}
          {!nuevo && camino.length > 0 && (
            <div className="est-migas">
              <span>{empresa.nombre || 'La empresa'}</span>
              {camino.map(n => (
                <span key={n.id} className="est-miga">
                  <ChevronRight size={12} />
                  <button onClick={() => navigate(`/organizacion/nodo/${n.id}`)}>{n.nombre}</button>
                </span>
              ))}
            </div>
          )}
          {/* EL ESTADO SE LEE, NO SE RELLENA. Como campo obligaba a entrar en modo edición
              para enterarse de algo que se mira de reojo; acá está siempre a la vista, con el
              mismo distintivo que en la tabla, y se cambia por un solo camino: el menú de
              acciones de la tabla. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="pl-title">{nuevo ? `Nuevo: ${t.label.toLowerCase()}` : form.nombre || t.label}</h1>
            {!nuevo && <PastillaEstado tipo={tipo} estado={form.estado} />}
          </div>
          <p className="pl-subtitle">
            <span className={`est-tipo t-${tipo}`} style={{ marginRight: 8 }}>{t.label}</span>
            {t.desc}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {editando ? (
            <>
              {/* SIN «CANCELAR». Eran dos botones donde hay una sola decisión —esto se queda o
                  no— y el segundo pesaba lo mismo que el primero en la esquina que más se mira.
                  Lo que hacía sigue existiendo, mejor: salir por la flecha con algo escrito
                  pregunta si guardar o descartar, así que la salida ya no es un botón más en la
                  cabecera, es la pregunta en el momento en que hace falta. */}
              <button
                className="pl-btn-save"
                onClick={guardar}
                disabled={sinCambios}
                title={sinCambios ? 'No has cambiado nada todavía' : (problema || undefined)}
              >
                {/* «Guardar» a secas, también al crear. «Crear región» nombraba la operación
                    dos veces —el título ya dice «Nuevo: región»— y hacía que el par de botones
                    de abajo cambiara de nombre según cómo hubieras llegado, cuando lo que hacen
                    es lo mismo: dejar escrito lo que hay en el formulario. */}
                <Save size={14} />
                {nuevo ? 'Guardar' : 'Guardar cambios'}
              </button>
            </>
          ) : (
            /* SOLO EDITAR. «Eliminar» estaba también acá y era el mismo botón dos veces: la
               tabla ya lo tiene en su menú de acciones, que es donde uno va a buscar qué hacer
               con una fila. Dos caminos para borrar es un camino de más para equivocarse, y el
               de la tabla es mejor —no hace falta entrar a la ficha para deshacerse de algo—. */
            <button className="pl-btn-save" onClick={() => setEditando(true)}>
              <Pencil size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180 }}>
        {intento && problema && (
          <div className="est-error">
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{problema}</span>
          </div>
        )}

        {grupos.map(grupo => (
          <TarjetaCampos
            key={grupo.titulo}
            titulo={grupo.titulo}
            desc={grupo.desc}
            campos={grupo.campos}
            form={form}
            set={set}
            editando={editando}
            prefijo="nodo"
            marcarFaltas={intento}
          />
        ))}

        {editando && <p className="pl-leyenda"><b>*</b> Campo obligatorio</p>}

        {/* LO QUE SE DEDUCE DEL CAMINO, y que hoy hay que declarar a mano en cada cargo. Es la
            mitad de la gracia del modelo, así que se enseña en vez de quedar implícita. */}
        {!nuevo && !editando && (
          <div className="est-deducido">
            <p className="est-deducido-tit">Lo que sale solo del árbol</p>
            <div className="est-deducido-grid">
              <div>
                <span className="est-deducido-rot">Sucursal</span>
                <span className="est-deducido-val">
                  {suc ? suc.nombre : 'Ninguna en el camino — vale para toda la empresa'}
                </span>
              </div>
              <div>
                <span className="est-deducido-rot">Cuelga debajo</span>
                <span className="est-deducido-val">
                  {hijos.length} {hijos.length === 1 ? 'nodo' : 'nodos'}
                </span>
              </div>
              <div>
                <span className="est-deducido-rot">Cargos en la rama</span>
                <span className="est-deducido-val">
                  {org.cargos.filter(c => [id, ...hijos].includes(c.unidadId)).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DÓNDE MÁS TRABAJA ESTA SILLA. El mismo modal que la lista de cargos: un solo archivo, dos
          puertas. Se abre desde el propio valor del campo, que es donde estaba el dato leyéndose
          sin poder tocarse. */}
      {funcional && tipo === 'puesto' && (
        <ModalApoyoFuncional
          titulo={guardado?.nombre}
          apoyos={guardado?.funcionales || []}
          org={org}
          unidadPropia={nodos.find(n => n.id === guardado?.padreId)?.padreId}
          cargoId={id}
          onCerrar={() => setFuncional(false)}
          onCambio={funcionales => setNodos(prev => prev.map(n => (n.id === id ? { ...n, funcionales } : n)))}
        />
      )}

    </div>
  )
}
