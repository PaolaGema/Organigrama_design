import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, FolderTree, Pencil, Save, AlertTriangle, Trash2 } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { colaboradoresData, fotoDe } from '../personas/colaboradoresData'
import { useUser } from '../../context/UserContext'
import TarjetaCampos from '../../components/organizacion/TarjetaCampos'
import EmptyState from '../../components/layout/EmptyState'
import { ciudadesDe } from '../../data/paisesData'
import {
  tipoDe, gruposDe, padresPosibles, lugaresPosibles, arbolDeLugares, filasEje, caminoDe, descendientes, ancestroDe, listaDe, anclajeDeCentro, padreDeCentro, cargosDeNodos, aplicarMandoDeUnidad, lineaConOrigen, DECLARAN_LINEA, MUESTRAN_LINEA, RAIZ,
} from '../../data/estructuraData'
import { descendientesDe, getPersona } from '../../data/organigramaData'
import PreviaPuesto from '../../components/personas/PreviaPuesto'
import PreviaUnidad from '../../components/personas/PreviaUnidad'
import ConfirmarAccionModal from '../../components/layout/ConfirmarAccionModal'
import Desplegable from '../../components/layout/Desplegable'
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

const aForm = n => ({
  ...n,
  padreId: n.padreId ?? RAIZ,
  /* «Sin línea» tiene que poder ELEGIRSE, no solo quedarse en blanco: sin una opción para ella,
     asignar una por error es irreversible. Lo mismo que ya pasa con el padre y con la sede. */
  ...(DECLARAN_LINEA.includes(n.tipo) ? { lineaNegocio: n.lineaNegocio || RAIZ } : {}),
})

/* LOS CAMPOS DONDE «NINGUNA» ES UNA RESPUESTA. Todos guardan un id, y todos tienen que poder
   guardar la ausencia de uno; en el formulario esa ausencia necesita ser una opción elegible
   —si no, elegir por error es irreversible— y en el dato vuelve a ser lo que es: nada. La
   conversión pasa en los dos bordes de esta pantalla, igual que con el padre. */
const OPCIONALES = ['regionalId', 'sucursalId', 'centroPadre', 'ubicacion', 'mandoId', 'reportaA', 'lineaNegocio']

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
    /* Y LA LÍNEA DE NEGOCIO TAMBIÉN NACE ELEGIDA, en su opción vacía: sin ella, «no pertenece a
       ninguna» sería un campo en blanco y no una respuesta, y asignar una por error no se podría
       deshacer. */
    const sinAnclaje = {
      ...(tipoNuevo === 'centro'
        ? { regionalId: RAIZ, sucursalId: RAIZ, centroPadre: RAIZ }
        : ['unidad', 'puesto'].includes(tipoNuevo) ? { ubicacion: RAIZ } : {}),
      ...(DECLARAN_LINEA.includes(tipoNuevo) ? { lineaNegocio: RAIZ } : {}),
    }
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

  /* LAS SILLAS DEL CARGO, mientras se lo edita. Viven acá y no en `form` porque no son campos
     del nodo: son los puestos que se van a crear al guardar, y cada uno terminará siendo un nodo
     propio. La lista se estira y se encoge sola detrás del número, conservando lo ya escrito:
     bajar de 5 a 3 y volver a 5 no puede borrar los códigos de las tres primeras. */
  const [escritas, setEscritas] = useState([])
  /* Qué silla se está por borrar, y si se puede. Se resuelve al pulsar y no al confirmar: la
     ocupación es lo que decide qué modal aparece. */
  const [borrandoSilla, setBorrandoSilla] = useState(null)
  /* Null mientras no se pide el cambio masivo; con la jefatura elegida cuando el modal está
     abierto. Empieza en cadena vacía, que es «de nadie»: es una respuesta válida. */
  const [cambiandoJefe, setCambiandoJefe] = useState(null)
  /* LAS SILLAS QUE YA EXISTEN. Editando un cargo que tiene tres puestos, las fichas tienen que
     llegar con sus códigos y sus sitios: en blanco dirían que el cargo está hueco cuando no lo
     está, y guardar encima borraría lo que había. */
  const sillasGuardadas = useMemo(
    () => nodos
      .filter(n => n.tipo === 'puesto' && n.padreId === id)
      .map(p => ({
        ref: p.id,
        codigo: p.codigo || '',
        ubicacion: p.ubicacion || '',
        /* Cadena vacía y no null: «de nadie» es una respuesta elegible, no la ausencia de una. */
        jefe: p.reportaA || '',
      })),
    [nodos, id],
  )
  /* CUÁNTAS FICHAS SE DIBUJAN. El número declarado, pero nunca menos que las sillas que ya
     existen: un cargo con tres puestos y sin cupo escrito tiene tres sillas, no cero. Es la
     misma cuenta que hace la tabla de cargos para saber cuántas filas desplegar. */
  const cuantasSillas = Math.max(
    Math.min(50, Number(form.maxPersonas) || 0),
    sillasGuardadas.length,
  )
  /* LA LISTA SE DERIVA DEL NÚMERO, no se sincroniza con él. Un efecto que la recorte cada vez que
     el número cambia borra lo escrito al bajar de 5 a 3, y encadena un dibujo más por cada tecla.
     Derivada, bajar a 3 y volver a 5 devuelve las cinco como estaban. */
  /* ¿ESTÁN REPARTIDAS? Se mira lo guardado, no lo que se está escribiendo: es el estado del que
     parte la ficha. Un cargo cuyas sillas responden a dos jefes abre en modo repartido. */
  const jefeRepartido = new Set(sillasGuardadas.map(s => s.jefe || '')).size > 1

  /* `null` es «como esté»: la casilla sigue a la realidad hasta que alguien la toca, y desde ahí
     manda su decisión. Sin esto haría falta un efecto que escriba estado al dibujar, que es lo que
     encadena renders. */
  const [mismoJefe, setMismoJefe] = useState(null)
  const todasIguales = mismoJefe === null ? !jefeRepartido : mismoJefe

  /* LA JEFATURA COMÚN. Mientras nadie elija una, es la que ya tiene la mayoría de las sillas: al
     abrir un cargo de nueve vendedores con el mismo jefe, la casilla marcada tiene que enseñar A
     ESE y no un desplegable en blanco. */
  const jefeMayoria = useMemo(() => {
    const cuenta = new Map()
    sillasGuardadas.forEach(s => { const k = s.jefe || ''; cuenta.set(k, (cuenta.get(k) || 0) + 1) })
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  }, [sillasGuardadas])

  const jefeSillas = form.jefeSillas === undefined
    ? jefeMayoria
    : (form.jefeSillas && form.jefeSillas !== RAIZ ? form.jefeSillas : '')

  const sillas = useMemo(
    () => {
      const base = Array.from({ length: cuantasSillas }, (_, i) => (
        escritas[i]
          /* SIN JEFE PROPIO, EL DEL CARGO. Con `??` y no `||`: una silla que responde «a nadie»
             guarda cadena vacía, y con `||` volvería a heredar la del cargo en cada dibujo. */
          || sillasGuardadas[i]
          || { codigo: '', ubicacion: '', jefe: jefeSillas }
      /* MARCADA, LA COMÚN GANA SOBRE LO QUE TENGA CADA UNA: es lo que la casilla promete, y sin
         esto cambiar el desplegable de arriba no movería a las sillas que ya tienen jefe propio.
         Desmarcada, cada fila manda, y las que nunca se tocaron parten de la común. */
      )).map(s => ({ ...s, jefe: todasIguales ? jefeSillas : (s.jefe ?? jefeSillas) }))
      /* EL CÓDIGO DE LA PLAZA SE PROPONE SOLO, PERO NUNCA SE INVENTA — BR‑ORG‑021.
         Con «CAR-014» arriba, las plazas nacen CAR-014-01, -02, -03: es la numeración que la
         empresa ya eligió, extendida, no una serie nuestra. Sin código de cargo no hay de dónde
         derivarla y el campo se queda vacío: un «PU-001» salido de la nada sería un esquema
         inventado que se lee como si alguien lo hubiera decidido, y de ahí pasa a un contrato.

         Se rellena solo lo que está VACÍO. Una plaza que ya tiene código no se toca: puede estar
         en una planilla, y ahí renumerar no es un cambio de pantalla. Y queda escrito en el
         campo, no de gris al fondo: lo que se va a guardar se tiene que poder leer y cambiar. */
      const raiz = form.codigo?.trim()
      if (!raiz) return base
      const serie = serieDe(`${raiz}-01`, cuantasSillas)
      return base.map((silla, i) => (silla.codigo ? silla : { ...silla, codigo: serie[i] }))
    },
    [cuantasSillas, escritas, sillasGuardadas, form.codigo, jefeSillas, todasIguales],
  )

  /* DE QUIÉN DEPENDEN LAS SILLAS NUEVAS. Una sola vez para todas y no una por ficha: al crear un
     cargo, sus cinco sillas responden casi siempre a la misma jefatura, y preguntarlo cinco veces
     es pedir cinco veces la misma respuesta. Que cada una pueda tener la suya —BR‑ORG‑012— se
     resuelve después, en la ficha de cada puesto: acá es el valor con el que nacen.

     SIN ESTO LAS SILLAS NACÍAN SUELTAS. El organigrama dibuja la línea desde el puesto, así que un
     puesto sin «de quién depende» se guarda bien y no aparece colgado de ninguna parte. */
  /* Una silla sobra cuando su número pasa del tope declarado y además ya existe: las que el
     formulario dibuja de más todavía no ocupan ninguna plaza. */
  /* Hay serie si el primer código termina en número: es de ahí de donde se cuenta. */
  const haySerie = /d$/.test((sillas[0]?.codigo || '').trim())

  /* HAY SILLAS DE LAS QUE HABLAR: las declaradas por el cupo o las que ya existen. Sin ninguna,
     todo lo que se pregunte sobre ellas no tiene a qué aplicarse. */
  const haySillas = cuantasSillas > 0

  const sobraLaSilla = i => {
    const declarado = Math.min(50, Number(form.maxPersonas) || 0)
    return !!declarado && i >= declarado && i < sillasGuardadas.length
  }

  /* PULSAR LA PAPELERA NO BORRA: PREGUNTA. Y la pregunta depende de si la silla tiene a alguien
     adentro, porque en ese caso la respuesta es que no se puede. */
  const pedirBorrarSilla = i => {
    const ref = sillasGuardadas[i]?.ref
    const puesto = ref ? nodos.find(n => n.id === ref) : null
    setBorrandoSilla({
      i,
      id: ref || null,
      ocupante: puesto?.ocupante || '',
      nombre: (sillas[i]?.codigo || '').trim() || `el puesto ${i + 1}`,
    })
  }

  /* BORRAR UNA SILLA BAJA EL TOPE. Es lo que la hace la forma natural de reducir un cargo: el
     número sigue a las filas en vez de ser una declaración aparte que después hay que reconciliar.

     Se quita también de `escritas`, que va por posición: sin eso, lo tecleado en la fila 5 se
     correría a la 4 al desaparecer una de arriba. */
  const borrarSilla = () => {
    const { i, id } = borrandoSilla
    if (id) setNodos(prev => prev.filter(n => n.id !== id))
    setEscritas(prev => prev.filter((_, n) => n !== i))
    const quedan = cuantasSillas - 1
    setForm(prev => ({ ...prev, maxPersonas: quedan > 0 ? String(quedan) : '' }))
    setBorrandoSilla(null)
  }

  /* CÓMO ESTÁN REPARTIDAS HOY. Se agrupan por su jefatura y se ordena de mayor a menor: lo
     primero que uno quiere saber es cuál manda sobre la mayoría. Una jefatura borrada deja
     puestos apuntando a nada, y eso también se dice en vez de esconderlo. */
  const repartoDeJefes = useMemo(() => {
    if (tipo !== 'cargo') return []
    const plazas = cargosDeNodos(nodos)
    const cuenta = new Map()
    nodos
      .filter(n => n.tipo === 'puesto' && n.padreId === id)
      .forEach(p => { const k = p.reportaA || ''; cuenta.set(k, (cuenta.get(k) || 0) + 1) })
    return [...cuenta.entries()]
      .map(([k, cuantas]) => ({
        id: k,
        cuantas,
        nombre: !k
          ? 'nadie: son la cima'
          : plazas.find(c => c.id === k)?.nombre || 'un puesto que ya no existe',
      }))
      .sort((a, b) => b.cuantas - a.cuantas)
  }, [tipo, id, nodos])

  /* MOVERLAS A TODAS, incluidas las que ya tenían otra. Si dejara fuera alguna sería «cambiar
     algunas» y habría que explicar cuáles; la confirmación dice el número exacto antes de hacerlo.
     Después, cualquiera se puede volver a ajustar desde su propia ficha. */
  const aplicarJefeATodas = () => {
    const destino = cambiandoJefe && cambiandoJefe !== RAIZ ? cambiandoJefe : null
    setNodos(prev => prev.map(n => (
      n.tipo === 'puesto' && n.padreId === id ? { ...n, reportaA: destino } : n
    )))
    setCambiandoJefe(null)
  }


  /* EL CÓDIGO DE LA PRIMERA NUMERA LA SERIE. Escribir PU-001 arriba pone PU-002 y PU-003 debajo,
     pero solo en las que nadie tocó: si alguien escribió un código a mano, cambiar el primero no
     puede pisárselo. Mismo comportamiento que el modal del organigrama. */
  /* EL EJEMPLO DE LA PRIMERA SILLA SALE DEL CÓDIGO DEL CARGO. Con CAR-014 arriba, la primera
     silla propone CAR-014-01 y las demás siguen la serie: se ve de un vistazo que la plaza
     pertenece al rol, sin un renglón que lo explique. Sin código de cargo no hay de dónde
     derivarlo y queda el ejemplo genérico. Es un EJEMPLO, no un valor: escribir el código de
     cada plaza sigue siendo una decisión de quien la abre. */
  /* LA CORRIDA DE DÍGITOS ENTERA, no la última cifra. El patrón era perezoso, así que de
     «PU-001» se quedaba con el «1» y contaba desde ahí con un solo dígito: PU-001, PU-002 …
     PU-0010. Ahora el prefijo llega hasta el último carácter que no es dígito, así que el ancho
     sale de la corrida completa y la décima plaza es PU-012, como corresponde. */
  const serieDe = (codigo, n) => {
    const m = String(codigo || '').match(/^(.*[^\d]|)(\d+)$/)
    if (!m) return Array.from({ length: n }, () => '')
    const ancho = m[2].length
    const desde = Number(m[2])
    return Array.from({ length: n }, (_, i) => m[1] + String(desde + i).padStart(ancho, '0'))
  }
  const setSilla = (i, parche) => setEscritas(() => {
    const prev = sillas
    if (i === 0 && parche.codigo !== undefined && prev.length > 1) {
      const antes = serieDe(prev[0].codigo, prev.length)
      const ahora = serieDe(parche.codigo, prev.length)
      return prev.map((s, n) => (n === 0
        ? { ...s, ...parche }
        : (!s.codigo || s.codigo === antes[n] ? { ...s, codigo: ahora[n] } : s)))
    }
    return prev.map((s, n) => (n === i ? { ...s, ...parche } : s))
  })
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
      /* Y LOS QUE NO SON ANIDABLES TAMPOCO SON UNA LISTA PLANA. Un peldaño como la unidad de
         negocio puede colgar de una regional, de una sucursal o de un centro de trabajo, y esos
         tres NO son hermanos: el centro está dentro de la sucursal y la sucursal dentro de la
         regional. Sueltos, elegir «Depósito Central» se veía igual de profundo que elegir
         «Oriente», y no lo es.

         Es el mismo árbol y el mismo dibujo que la lista de sitios de la unidad organizacional
         —codos incluidos— así que la jerarquía se cuenta igual en los dos desplegables. */
      : arbolDeLugares(candidatos, niveles)
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
  /* Los sitios que puede declarar una silla: cualquiera del eje físico, con su nivel delante
     —«Sucursal: Casa Matriz»— que es lo que distingue dos que se llamen igual. */
  const opcionesSitio = useMemo(
    /* LA MISMA LISTA QUE EL FORMULARIO Y CON LA MISMA FORMA: dos listas de los mismos sitios
       ordenadas distinto obligan a buscar dos veces de dos maneras. Viajan con su profundidad y
       su pista, que es lo que el desplegable necesita para dibujar los codos. */
    () => arbolDeLugares(lugares, niveles),
    [lugares, niveles],
  )
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
  /* EL ANCLA DE UNA UNIDAD ANIDADA. Se sube por la rama hasta la primera unidad que declare un
     sitio, y ese vale para todo lo que cuelga de ella —es la misma cuenta que hace `anclaDe`,
     pero arrancando del padre ELEGIDO EN EL FORMULARIO y no del nodo guardado: creando todavía
     no hay nodo, y editando el padre puede estar a medio cambiar.

     Sin ancla en toda la rama no es un error: es una unidad que vale para toda la empresa. */
  const anclaDeLaRama = () => {
    const padre = form?.padreId && form.padreId !== RAIZ ? nodos.find(n => n.id === form.padreId) : null
    if (!padre) return { lugar: 'Toda la empresa', lugarDe: null }
    /* SE NOMBRA AL PADRE Y SE BUSCA EN TODA LA RAMA. Son dos cosas distintas: el sitio puede
       estar declarado tres niveles más arriba, pero quien llena esta ficha cuelga del padre y de
       ahí lo saca. Nombrar al ancestro lejano era contarle la plomería. */
    let p = padre
    for (let i = 0; p && i < 30; i += 1) {
      if (p.ubicacion) {
        const sitio = nodos.find(n => n.id === p.ubicacion)
        if (sitio) return { lugarId: sitio.id, lugar: `${tipoDe(sitio.tipo, niveles)?.label}: ${sitio.nombre}`, lugarDe: padre.nombre }
      }
      p = p.padreId ? nodos.find(n => n.id === p.padreId) : null
    }
    return { lugarId: null, lugar: 'Toda la empresa', lugarDe: padre.nombre }
  }

  /* QUÉ LÍNEA LE TOCARÍA SI NO DECLARARA NADA. Eso es lo que significa la opción vacía, así que
     se resuelve sobre un árbol donde este nodo no declara: preguntándolo con su propia línea
     puesta, la respuesta sería siempre ella misma y el campo diría «heredada de sí mismo».

     Y se arma con lo que hay EN EL FORMULARIO —el padre y la sede que se están eligiendo— y no
     con lo guardado: creando todavía no hay nodo, y editando el padre puede estar a medio cambiar. */
  const lineaHeredada = () => {
    if (!MUESTRAN_LINEA.includes(tipo)) return {}
    const suId = id || '__borrador__'
    const base = [
      ...nodos.filter(n => n.id !== id),
      {
        id: suId,
        tipo,
        padreId: form?.padreId && form.padreId !== RAIZ ? form.padreId : null,
        ubicacion: form?.ubicacion && form.ubicacion !== RAIZ ? form.ubicacion : '',
        lineaNegocio: '',
      },
    ]
    const { linea, origen } = lineaConOrigen(suId, base)
    if (!linea) return {}
    return {
      linea: nodos.find(n => n.id === linea)?.nombre || '',
      lineaDe: nodos.find(n => n.id === origen)?.nombre || '',
    }
  }

  /* LAS LÍNEAS QUE SE PUEDEN ELEGIR. Las cerradas no se ofrecen: desactivar una línea es dejar de
     ofrecerla para cosas nuevas, y quien ya la tenía la conserva. */
  const negocios = useMemo(
    () => nodos
      .filter(n => n.tipo === 'negocio' && n.estado !== 'cerrada')
      .map(n => ({ valor: n.id, etiqueta: n.nombre })),
    [nodos],
  )

  const heredado = cargoDelPuesto ? {
    unidad: nodos.find(n => n.id === cargoDelPuesto.padreId)?.nombre || '',
    mando: (org.niveles || []).find(m => m.id === cargoDelPuesto.nivelMando)?.nombre || '',
    ...lineaHeredada(),
  } : tipo === 'unidad' ? { ...anclaDeLaRama(), ...lineaHeredada() } : lineaHeredada()

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
    : tipo === 'puesto' ? jefesDelPuesto()
      /* LAS JEFATURAS QUE PUEDE TENER UN CARGO. Las de su propia unidad —el caso corriente: un
         vendedor responde a su coordinación— y las de las unidades por encima —el caso de la
         cabeza de un área, que responde al director de la de arriba—. Nunca las de una rama
         hermana: ahí la línea cruzaría el árbol de lado y el dibujo dejaría de ser un árbol. */
      : tipo === 'cargo' && form?.padreId && form.padreId !== RAIZ
        ? (() => {
          const arriba = new Set()
          let paso = form.padreId
          while (paso) { arriba.add(paso); paso = nodos.find(n => n.id === paso)?.padreId }
          return cargosDeNodos(nodos)
            .filter(p => arriba.has(p.unidadId))
            .map(p => ({ valor: p.id, etiqueta: p.nombre }))
        })()
        : []

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

  /* QUIÉNES DECLARARON ESTA LÍNEA. Solo los que la declaran, no los que la heredan: una regional
     de Farmacias con ocho sucursales debajo aparecería nueve veces, y ocho de esas nueve no
     dicen nada nuevo — lo que agrupa la línea es la regional, y el resto viene con ella. */
  const vinculos = tipo === 'negocio' ? {
    agrupa: nodos
      .filter(n => n.lineaNegocio === id)
      .map(n => `${tipoDe(n.tipo, niveles)?.label}: ${n.nombre}`)
      .join(' · '),
  } : tipo === 'cargo' ? { sillas: sillasDelCargo() } : tipo === 'puesto' ? (() => {
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
    ? gruposDe(tipo, { personas, padres, ciudades, nivel: tipoDe(tipo, niveles), niveles, valores: form, lugares, mandos, jefes, vinculos, heredado, negocios })
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
  /* ══ DOS CÓDIGOS IGUALES NO SE GUARDAN — BR‑ORG‑021 ══════════════════════════════════════
     El código del cargo nombra al ROL en el catálogo y el de la plaza nombra a la SILLA
     financiada: son dos documentos distintos en Recursos Humanos —el manual de cargos y la
     plantilla de personal— y fuera del sistema viven en un contrato y en una planilla. Repetido,
     un código deja de nombrar una cosa sola, y el día que hay que renumerar ya salió de acá.

     Se compara SIN MAYÚSCULAS NI ESPACIOS: «car-001» y «CAR-001 » son el mismo código para
     cualquiera que los lea, y dejar pasar uno de los dos es dejar pasar el choque.

     Y se mira en dos direcciones, porque son dos errores distintos: contra lo que ya está
     guardado, y entre los códigos que este mismo formulario está por escribir —un cargo con
     cinco plazas puede chocar consigo mismo sin que exista todavía ninguna—. */
  const codigoNorm = v => String(v || '').trim().toLowerCase()

  const choqueCodigo = useMemo(() => {
    if (tipo !== 'cargo' && tipo !== 'puesto') return null

    /* Lo que este formulario ES DUEÑO de escribir no cuenta como ajeno: el propio nodo y, si es
       un cargo, sus plazas. Sin esto, editar sin tocar nada chocaría contra uno mismo. */
    const propios = new Set([id, ...sillasGuardadas.map(x => x.ref)])
    const ajenos = new Map()
    nodos.forEach(n => {
      if ((n.tipo !== 'cargo' && n.tipo !== 'puesto') || propios.has(n.id)) return
      const k = codigoNorm(n.codigo)
      if (k) ajenos.set(k, n)
    })

    const comoSeLlama = n => (n.tipo === 'cargo' ? 'el cargo' : 'la plaza')
    const mios = [
      { que: tipo === 'cargo' ? 'el cargo' : 'la plaza', cod: form.codigo },
      ...(tipo === 'cargo'
        ? sillas.map((silla, i) => ({ que: `la plaza ${i + 1}`, cod: silla.codigo }))
        : []),
    ]

    const vistos = new Map()
    for (const mio of mios) {
      const k = codigoNorm(mio.cod)
      if (!k) continue
      const otro = ajenos.get(k)
      if (otro) {
        return `El código «${mio.cod.trim()}» ya es de ${comoSeLlama(otro)} «${otro.nombre}». Cada cargo y cada plaza llevan el suyo — BR‑ORG‑021.`
      }
      if (vistos.has(k)) {
        return `El código «${mio.cod.trim()}» está puesto en ${vistos.get(k)} y en ${mio.que}. Cada plaza lleva el suyo — BR‑ORG‑021.`
      }
      vistos.set(k, mio.que)
    }
    return null
  }, [tipo, id, nodos, sillasGuardadas, form.codigo, sillas])

  /* UN CARGO SIN UNIDAD NO SE PUEDE DIBUJAR. La rama de la que cuelga es la mitad de lo que un
     cargo es, así que sigue siendo obligatoria aunque su campo ya no viva en el formulario
     genérico: lo que se mudó es dónde se pregunta, no si hace falta. */
  const faltaUnidad = tipo === 'cargo' && (!form.padreId || form.padreId === RAIZ)

  /* EL TECHO NO PUEDE QUEDAR POR DEBAJO DEL PISO. El cupo autorizado de un cargo dice cuántas
     plazas aprobó la empresa; declarar tres cuando hay cinco abiertas no es achicar, es escribir
     algo que no es cierto. Se cuenta contra las sillas GUARDADAS y no contra las que el formulario
     dibuja, que incluyen las que todavía no existen.

     Vacío es «sin límite» y nunca choca: no hay techo que romper. */
  const choqueCupo = (() => {
    if (tipo !== 'cargo') return null
    const declarado = Math.min(50, Number(form.maxPersonas) || 0)
    const abiertas = sillasGuardadas.length
    if (!declarado || declarado >= abiertas) return null
    const sobran = abiertas - declarado
    return `«${(form.nombre || '').trim() || 'Este cargo'}» tiene ${abiertas} puestos abiertos: el tope no puede ser ${declarado}. Elimina ${sobran} ${sobran === 1 ? 'puesto' : 'puestos'} antes de bajarlo.`
  })()

  /* El choque va DESPUÉS de los campos que faltan: un cargo sin nombre y con el código repetido
     tiene dos problemas, y el primero que hay que resolver es el que impide siquiera identificarlo. */
  const problema = tope || (!form ? 'Falta el nodo'
    : faltantes.length === 1
      ? (faltantes[0].faltaMsg || `Falta ${faltantes[0].label.toLowerCase()}.`)
      : faltantes.length > 1
        ? `Faltan ${faltantes.length} campos obligatorios: ${faltantes.map(c => c.label).join(', ')}.`
        : (faltaUnidad
          ? 'Un cargo pertenece a una unidad: sin ella no hay dónde dibujarlo.'
          : (choqueCupo || choqueCodigo)))

  /* Si el borrador es idéntico a lo guardado no hay nada que guardar. Se compara el objeto
     entero y no campo por campo: cualquier campo que se agregue mañana entra solo. Creando, lo
     "guardado" es con qué nació el formulario. */
  const cambiado = nuevo
    ? JSON.stringify(form) !== inicial
    : !!guardado && JSON.stringify(form) !== JSON.stringify(aForm(guardado))
  /* LAS SILLAS TAMBIÉN SON UN CAMBIO. Viven fuera de `form`, así que sin esto se podían escribir
     cinco códigos con el botón de guardar apagado.

     Y SE COMPARA LA LISTA, no si alguien tecleó. El código propuesto a partir del código del cargo
     no lo escribe nadie —aparece solo— y sin embargo es algo distinto de lo guardado: mirando solo
     las teclas, el botón quedaba apagado con seis códigos nuevos a la vista. */
  const sillasTocadas = tipo === 'cargo' && sillas.some((silla, i) => (
    (silla.codigo || '') !== (sillasGuardadas[i]?.codigo || '')
    || (silla.ubicacion || '') !== (sillasGuardadas[i]?.ubicacion || '')
    || (silla.jefe || '') !== (sillasGuardadas[i]?.jefe || '')
  ))
  const sinCambios = !nuevo && !cambiado && !sillasTocadas

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
    /* LO QUE NO PUEDE COLGAR DE NADA NO GUARDA PADRE. La unidad de negocio dejó de poder
       hacerlo, pero las que se crearon antes conservaban el suyo: su formulario ya no tiene el
       campo, así que sin esto ese dato viejo no había forma de sacarlo, y la tabla seguía
       enseñando una columna «Pertenece a» con valores que el modelo ya no admite. */
    const sinPadrePosible = padres.length === 0 || (padres.length === 1 && padres[0].valor === RAIZ)
    const conPadre = tipo === 'centro'
      ? { ...base, padreId: padreDeCentro(form) }
      : sinPadrePosible ? { ...base, padreId: null } : base
    /* «Otro» es de la pantalla y no del dato: lo escrito pasa a ser el nombre y el campo
       auxiliar no llega al nodo. Sin esto quedarían dos datos para una sola respuesta. */
    /* `jefeSillas` SÍ SE GUARDA, y es lo único de esta ficha que el organigrama no lee: no es
       la línea de mando del cargo —los cargos no tienen— sino CON QUÉ VALOR NACEN sus sillas.
       Guardarlo es lo que hace que una silla abierta más tarde, desde la tabla, no nazca suelta. */
    const datos = { ...conPadre }
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
      /* EL CARGO Y SUS SILLAS, DE UNA VEZ. Antes el cargo nacía solo y las fichas que se acababan
         de completar se perdían: había que volver a la tabla, desplegarlo y abrirlas de a una. */
      setNodos(prev => conSillas([...prev, { ...datos, id: nid }], nid, datos.nombre))
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
      let actualizado = prev.map(x => (x.id === id ? { ...x, ...datos } : x))
      if (tipo === 'cargo') actualizado = conSillas(actualizado, id, datos.nombre)
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

  /* ESCRIBIR LAS SILLAS. Las que ya existen se actualizan —su código y su sitio— y las que faltan
     se crean. Nunca se borra ninguna: bajar el número deja de dibujar la ficha, pero el puesto
     sigue ahí hasta que se decida qué hacer con los que sobran, que es una decisión de producto
     y no de formulario.

     A LAS QUE YA TIENEN JEFE NO SE LES TOCA. El «de quién depende» de arriba es el valor con el
     que NACEN las nuevas; pisarlo en las viejas borraría de un guardado las líneas que alguien
     ajustó silla por silla, que es justo lo que BR‑ORG‑012 permite hacer. */
  const conSillas = (lista, cargoId, nombre) => {
    const ya = lista.filter(n => n.tipo === 'puesto' && n.padreId === cargoId)
    let out = lista
    sillas.forEach((silla, i) => {
      const codigo = (silla.codigo || '').trim()
      const ubicacion = silla.ubicacion || ''
      const existente = ya[i]
      if (existente) {
        /* LO QUE DICE LA FILA MANDA. Antes se respetaba el `reportaA` que ya tuviera —para no
           pisar lo que alguien hubiera ajustado silla por silla— y eso valía cuando la fila no
           preguntaba nada. Ahora lo pregunta, así que la respuesta de la fila ES la del usuario. */
        out = out.map(n => (n.id === existente.id
          ? { ...n, codigo, ubicacion, reportaA: silla.jefe || null }
          : n))
        return
      }
      const base = `${cargoId}-p${i + 1}`
      const libre = out.some(n => n.id === base) ? `${base}-${Date.now().toString(36)}${i}` : base
      out = [...out, {
        id: libre, tipo: 'puesto', nombre, padreId: cargoId,
        codigo, ubicacion, ocupanteId: null, ocupante: '',
        reportaA: silla.jefe || null, funcionales: [], estado: 'activa',
      }]
    })
    return out
  }

  /* ══ EL MISMO DIBUJO QUE EL MODAL, con los datos de esta ficha ═══════════════════════════
     El modal del organigrama trabaja con las listas planas —`org.cargos`, `org.unidades`— y esta
     ficha con el árbol de nodos. Son los mismos datos proyectados de dos maneras, así que en vez
     de dibujar otra previa se traduce el formulario y se reusa la de allá: si el dibujo del modal
     mejora, este mejora con él, y nunca van a prometer dos sitios distintos.

     LAS EQUIVALENCIAS, que es lo único que hay acá:
       · la unidad         → `padreId` del cargo
       · de quién depende  → `jefeSillas`, la línea con la que nacen sus sillas
       · sus puestos       → las sillas del formulario, con lo que ya esté guardado en cada una */
  const nombreEscrito = form.nombre || ''

  const previaSillas = sillas.map((silla, i) => {
    const ref = sillasGuardadas[i]?.ref
    const puesto = ref ? nodos.find(n => n.id === ref) : null
    return {
      id: ref || `sin-guardar-${i}`,
      codigo: silla.codigo,
      /* La jefatura de CADA silla, para que el dibujo pueda contar cuántas hay y escribir la de
         cada una en vez de elegir una y dibujarla como si fuera de todas. */
      jefe: silla.jefe || '',
      sucursalIds: silla.ubicacion ? [silla.ubicacion] : [],
      ocupantes: puesto?.ocupanteId != null ? [puesto.ocupanteId] : [],
      funcionales: puesto?.funcionales || [],
    }
  })

  /* DE QUIÉN DEPENDE, LEYENDO. `jefeSillas` es el valor con el que NACEN las sillas y no se
     guarda en el cargo —el dato vive en cada puesto—, así que sobre un cargo ya guardado llega
     vacío y el dibujo lo pintaba suelto, sin jefe, contradiciendo al organigrama de al lado. Se
     lee de sus sillas: si todas responden al mismo, esa es la línea; si responden a distintos no
     hay UNA línea que dibujar, y el dibujo se queda sin ella en vez de elegir una. */
  const jefeDeLasSillas = useMemo(() => {
    const suyos = new Set(nodos
      .filter(n => n.tipo === 'puesto' && n.padreId === id && n.reportaA)
      .map(n => n.reportaA))
    return suyos.size === 1 ? [...suyos][0] : null
  }, [nodos, id])

  const previaForm = {
    nombre: nombreEscrito,
    unidadId: form.padreId && form.padreId !== RAIZ ? form.padreId : null,
    /* SOLO SI TODAS COINCIDEN. Repartidas, no hay UNA jefatura de la que colgar el cuadro, y
       el dibujo lo dice con palabras en vez de elegir una. */
    reportaA: new Set(previaSillas.map(p => p.jefe)).size === 1
      ? (previaSillas[0].jefe || null)
      : (previaSillas.length ? null : (jefeSillas || jefeDeLasSillas || null)),
    tipo: form.tipoCargo || 'colaborador',
    sucursalIds: previaSillas[0]?.sucursalIds || [],
    puestos: previaSillas,
  }

  /* Con una sola silla el dibujo enseña la cara de quien la ocupa; con varias, cada cuadro
     lleva la suya y este dato no se usa. */
  const previaGente = (previaSillas[0]?.ocupantes || []).map(getPersona).filter(Boolean)

  /* LA UNIDAD, CON EL MISMO TRATO QUE EL CARGO. `PreviaUnidad` es el espejo de `PreviaPuesto` y
     ya vive en el modal del organigrama: contesta las dos preguntas que uno se hace al colocar un
     área —de qué cuelga y qué se lleva puesto adentro—. Traducir es más corto acá porque las dos
     claves se llaman igual en los dos modelos; lo único que cambia es que en el árbol «ninguna»
     se escribe `RAIZ` y en el organigrama se escribe `null`. */
  const previaUnidad = {
    nombre: nombreEscrito,
    tipoUnidad: form.tipoUnidad,
    padreId: form.padreId && form.padreId !== RAIZ ? form.padreId : null,
    mandoId: form.mandoId && form.mandoId !== RAIZ ? form.mandoId : null,
  }

  /* Las sucursales del ÁRBOL y no las de la demo: acá una sede puede ser un nodo que el usuario
     acaba de crear, y el pie tiene que poder nombrarla. */
  const sedesDelArbol = useMemo(() => nodos.filter(n => n.tipo === 'sucursal'), [nodos])

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
    /* ELEGIR EL SITIO QUE YA SE HEREDA ES HEREDAR, no copiarlo. Guardado aparte, el día que la
       unidad de arriba se mude esta se queda donde estaba y nadie lo pidió: diría «declarado en
       esta unidad», que sería verdad y no sería la intención de nadie. */
    if (tipo === 'unidad' && k === 'ubicacion' && v && v === heredado?.lugarId) {
      setForm(prev => ({ ...prev, ubicacion: RAIZ }))
      return
    }
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
            <strong className="pl-subtitle-que">{t.label}:</strong> {t.desc}
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

      {/* EL DIBUJO AL COSTADO, COMO EN EL MODAL. Un cargo se define contestando dónde vive y de
          quién depende, y las dos respuestas son un sitio en un dibujo: enseñarlo mientras se
          llena convierte «Dirección General» de un renglón de un desplegable en un lugar que se
          ve. En cargos y en unidades, que son los dos tipos que el organigrama dibuja: los del eje
          físico —regionales, sucursales, centros— viven en el otro mapa y no tienen sitio ahí. */}
      <div className={`est-ficha${tipo === 'cargo' || tipo === 'unidad' ? ' con-previa' : ''}`}>
        <div className="est-ficha-campos">
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

        {/* DE QUIÉN DEPENDEN, LEYENDO Y EDITANDO. Es la única pantalla donde se ve el reparto
            entero de un cargo sin abrir sus sillas una por una. */}
        {tipo === 'cargo' && repartoDeJefes.length > 0 && (
          <section className="est-plazas">
            <p className="est-plazas-tit">De quién dependen sus sillas</p>
            <p className="est-plazas-desc">
              Cada puesto guarda la suya, y pueden ser distintas. Así están repartidas hoy.
            </p>
            <ul className="est-jefes">
              {repartoDeJefes.map(r => (
                <li key={r.id || '__nadie__'}>
                  <span className="est-jefes-n">{r.cuantas}</span>
                  <span>{r.cuantas === 1 ? 'depende' : 'dependen'} de <b>{r.nombre}</b></span>
                </li>
              ))}
            </ul>
            {editando && jefes.length > 0 && (
              <button
                type="button"
                className="est-accion"
                onClick={() => setCambiandoJefe(repartoDeJefes[0]?.id || RAIZ)}
              >
                Cambiar todas a…
              </button>
            )}
          </section>
        )}

        {/* LAS SILLAS, DEBAJO DEL NÚMERO QUE LAS DECLARA. Solo al editar un cargo: leyendo, las
            sillas ya se ven en la tabla con su gente, y repetirlas acá sería la misma lista dos
            veces. Quién las ocupa no se pregunta —eso es de la ficha de cada puesto, y casi
            siempre se sabe después—: acá van las dos cosas que sí se saben al definir el cargo. */}
        {tipo === 'cargo' && (
          <section className="est-plazas">
            <p className="est-plazas-tit">Sus puestos</p>
            <p className="est-plazas-desc">
              En qué unidad viven, de quién dependen y cuáles son. Las tres cosas van en este
              orden porque cada una necesita la anterior.
            </p>

            {/* LA UNIDAD, PRIMERO. Editando es un desplegable; leyendo, el nombre a secas — el
                mismo trato que le da el formulario a cualquier otro campo, para que la ficha no
                se vea distinta según el modo. */}
            <div className="est-cargo-donde">
            <label className="pl-label">
              <span>Unidad organizacional <em className="pl-req">*</em></span>
              {editando ? (
                <>
                  <div style={intento && faltaUnidad ? { '--border': 'var(--red)' } : undefined}>
                    <Desplegable
                      valor={form.padreId === RAIZ ? '' : (form.padreId || '')}
                      placeholder="Elige una"
                      ariaLabel="Unidad organizacional"
                      onCambio={v => set('padreId', v)}
                      opciones={padres.filter(o => o.valor !== RAIZ)}
                    />
                  </div>
                  {intento && faltaUnidad && (
                    <small style={{ color: 'var(--red)' }}>
                      Un cargo pertenece a una unidad: sin ella no hay dónde dibujarlo.
                    </small>
                  )}
                </>
              ) : (
                <p className="emp-valor">
                  {nodos.find(n => n.id === form.padreId)?.nombre || '—'}
                </p>
              )}
            </label>

            {/* LA JEFATURA COMÚN, AL LADO DE LA UNIDAD. Son las dos mitades de la misma pregunta
                y la segunda depende de la primera: elegida la unidad, acá aparecen sus jefaturas
                y las de las unidades por encima. */}
            {jefes.length > 0 && (!haySillas || todasIguales) && (
              <label className="pl-label">
                <span>De quién dependen</span>
                <Desplegable
                  valor={jefeSillas}
                  placeholder="De nadie: son la cima"
                  ariaLabel="De quién dependen sus sillas"
                  onCambio={v => set('jefeSillas', v || RAIZ)}
                  opciones={[{ valor: '', etiqueta: 'De nadie: son la cima' }, ...jefes]}
                />
                <small>
                  {haySillas
                    ? 'Solo aparecen jefaturas de su unidad y de las que están por encima.'
                    : 'Todavía no hay sillas: las que abras más adelante nacen con esta jefatura.'}
                </small>
              </label>
            )}
            </div>

            {jefes.length === 0 && (!form.padreId || form.padreId === RAIZ) && (
              <p className="est-mismo-jefe-falta">
                Para decir de quién dependen sus sillas, elige primero la unidad organizacional:
                las jefaturas salen de ella y de las que están por encima.
              </p>
            )}

            {haySillas && jefes.length > 0 && (
              <div className="est-mismo-jefe">
                <label className="est-mismo-jefe-check">
                  <input
                    type="checkbox"
                    checked={todasIguales}
                    onChange={e => setMismoJefe(e.target.checked)}
                  />
                  <span>
                    Todas las sillas dependen de la misma jefatura
                    <em>Desmárcalo si alguna responde a otra persona.</em>
                  </span>
                </label>

                {!todasIguales && (
                  <p className="est-mismo-jefe-nota">
                    Cada fila elige la suya. Las que no toques se quedan con la que tenían.
                  </p>
                )}

                {/* AVISO Y NO BLOQUEO: aplanar el reparto es una decisión válida —«todos pasan a
                    depender de la nueva coordinadora»— pero tiene que decirse antes de guardar y
                    no descubrirse después. */}
                {todasIguales && jefeRepartido && (
                  <p className="est-mismo-jefe-aviso">
                    Sus {sillasGuardadas.length} sillas responden hoy a jefaturas distintas. Al
                    guardar, todas pasan a depender de la que elijas arriba.
                  </p>
                )}
              </div>
            )}

            {editando && cuantasSillas > 0 && (
              <p className="est-plazas-sub">
                {cuantasSillas === 1 ? 'La silla de este cargo' : `Las ${cuantasSillas} sillas`}
                <em>
                  Cada una con su código y su sitio. Se crean al guardar, y quien las ocupa se
                  asigna después desde su ficha.
                </em>
              </p>
            )}

            <div className={`est-plazas-lista${jefes.length > 0 && !todasIguales ? ' con-jefe' : ''}`}>
              {sillas.map((silla, i) => (
                /* LAS QUE SOBRAN, MARCADAS. El aviso de arriba dice cuántas hay que cerrar; la
                    marca dice CUÁLES, que es lo que hace falta para poder cerrarlas. Se cuentan
                    desde el tope declarado hacia abajo: las últimas son las que sobran. */
                <div
                  className={`est-plaza${sobraLaSilla(i) ? ' est-plaza-sobra' : ''}`}
                  key={i}
                >
                  <span className="est-plaza-n">{i + 1}</span>
                  <label className="pl-label">
                    <span>Código del puesto</span>
                    <input
                      className="pl-input"
                      value={silla.codigo}
                      placeholder={i === 0 ? 'PU-001' : (haySerie || !sillas[0]?.codigo?.trim() ? 'Sale del primero' : 'Escríbelo')}
                      onChange={e => setSilla(i, { codigo: e.target.value })}
                    />
                  </label>
                  <label className="pl-label">
                    <span>Dónde se trabaja</span>
                    <Desplegable
                      valor={silla.ubicacion || ''}
                      placeholder="Sin asignar"
                      ariaLabel={`Dónde se trabaja, puesto ${i + 1}`}
                      onCambio={v => setSilla(i, { ubicacion: v })}
                      opciones={[{ valor: '', etiqueta: 'Sin asignar' }, ...opcionesSitio]}
                    />
                  </label>
                  {jefes.length > 0 && !todasIguales && (
                    <label className="pl-label">
                      <span>De quién depende</span>
                      <Desplegable
                        valor={silla.jefe || ''}
                        placeholder="De nadie: es la cima"
                        ariaLabel={`De quién depende, puesto ${i + 1}`}
                        onCambio={v => setSilla(i, { jefe: v })}
                        opciones={[{ valor: '', etiqueta: 'De nadie: es la cima' }, ...jefes]}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    className="est-plaza-x"
                    title={`Eliminar ${(silla.codigo || '').trim() || `el puesto ${i + 1}`}`}
                    onClick={() => pedirBorrarSilla(i)}
                  >
                    <Trash2 size={15} />
                  </button>
                  {sobraLaSilla(i) && (
                    <span className="est-plaza-aviso">Sobra: elimínalo para poder bajar el tope</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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

        {(tipo === 'cargo' || tipo === 'unidad') && (
          <aside className="est-ficha-previa">
            {tipo === 'cargo' ? (
              <PreviaPuesto
                form={previaForm}
                org={org}
                propios={sillasGuardadas.map(x => x.ref)}
                ocupantes={previaGente}
                nuevo={nuevo}
                sedes={sedesDelArbol}
              />
            ) : (
              <PreviaUnidad
                form={previaUnidad}
                org={org}
                /* Creando todavía no hay nada adentro que contar: el dibujo enseña dónde va a
                   quedar y no promete un contenido que no existe. */
                unidad={nuevo ? null : { id }}
                nueva={nuevo}
                empresa={empresa}
              />
            )}
          </aside>
        )}
      </div>

      {/* DÓNDE MÁS TRABAJA ESTA SILLA. El mismo modal que la lista de cargos: un solo archivo, dos
          puertas. Se abre desde el propio valor del campo, que es donde estaba el dato leyéndose
          sin poder tocarse. */}
      {/* DOS PREGUNTAS DISTINTAS CON LA MISMA CAJA. Con alguien adentro no hay nada que
          confirmar: se explica y se cierra. Vacía, se confirma, porque borrar no se deshace. */}
      {/* SE ELIGE Y SE CONFIRMA EN EL MISMO PASO, con el número a la vista: mover nueve puestos
          de una vez tiene que decir NUEVE antes de hacerlo, no después. */}
      {cambiandoJefe !== null && (
        <div className="pl-overlay" onClick={() => setCambiandoJefe(null)}>
          <div className="pl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="pl-modal-header">
              <h2>Cambiar la jefatura de todas las sillas</h2>
              <button className="pl-modal-close" onClick={() => setCambiandoJefe(null)}>✕</button>
            </div>
            <div className="pl-modal-body">
              <label className="pl-label">
                <span>Pasan a depender de</span>
                <select
                  className="pl-input"
                  value={cambiandoJefe}
                  onChange={e => setCambiandoJefe(e.target.value)}
                >
                  <option value={RAIZ}>De nadie: son la cima</option>
                  {jefes.map(j => (
                    <option key={j.valor} value={j.valor}>{j.etiqueta}</option>
                  ))}
                </select>
              </label>
              <p className="cb-texto">
                Se mueven <b>{sillasGuardadas.length}</b>{' '}
                {sillasGuardadas.length === 1 ? 'puesto' : 'puestos'}, incluidos los que hoy
                dependen de otra jefatura. Después se puede volver a ajustar cada uno desde su ficha.
              </p>
            </div>
            <div className="pl-modal-footer">
              <button className="pl-btn-cancel" onClick={() => setCambiandoJefe(null)}>Cancelar</button>
              <button className="pl-btn-save" onClick={aplicarJefeATodas}>Cambiar todas</button>
            </div>
          </div>
        </div>
      )}

      {borrandoSilla && (borrandoSilla.ocupante ? (
        <ConfirmarAccionModal
          icono={AlertTriangle}
          titulo="No se puede eliminar"
          descripcion={`${borrandoSilla.nombre} lo ocupa ${borrandoSilla.ocupante}. Muévelo a otro puesto antes de eliminarlo: borrarlo lo dejaría sin sitio en la estructura.`}
          textoConfirmar="Entendido"
          onConfirmar={() => setBorrandoSilla(null)}
          onCancelar={() => setBorrandoSilla(null)}
        />
      ) : (
        <ConfirmarAccionModal
          titulo="Eliminar este puesto"
          descripcion={`Se eliminará ${borrandoSilla.nombre} y no se puede deshacer. El cargo pasa a tener ${Math.max(0, cuantasSillas - 1)} ${cuantasSillas - 1 === 1 ? 'puesto' : 'puestos'}.`}
          textoConfirmar="Eliminar"
          onConfirmar={borrarSilla}
          onCancelar={() => setBorrandoSilla(null)}
        />
      ))}

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
