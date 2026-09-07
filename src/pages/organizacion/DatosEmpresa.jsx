import { useEffect, useRef, useState } from 'react'
import { Building2, Save, UploadCloud, Trash2, Pencil, X } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import TarjetaCampos from '../../components/organizacion/TarjetaCampos'
import { NOMBRES_PAISES } from '../../data/paisesData'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'

/* LOS DATOS DE LA EMPRESA.
   Vivían como una constante de dos campos dentro del modelo del organigrama y no había forma
   de tocarlos desde la aplicación: el nombre que encabeza el dibujo era el que alguien escribió
   en el código.

   No es una pantalla de configuración aunque lo parezca, y por eso no está detrás del engranaje:
   el nombre se imprime en el organigrama, encabeza sus exportaciones y es de quien cuelga un
   área que no depende de ninguna otra. Es dato, y se consulta.

   EL BLOQUE HACE DOS COSAS, y por eso va partido en dos alturas. Arriba PRESENTA a la empresa
   —logo, nombre, cómo firma—, que es lo que uno viene a ver al entrar a "Datos de la empresa";
   abajo se RELLENA. Antes esa presentación vivía en una tarjeta suelta al pie de la página, que
   repetía el logo y el nombre lejos de los campos que los producen: la banda la reemplaza y se
   actualiza mientras se escribe.

   LOS CAMPOS NUEVOS SON OPCIONALES A PROPÓSITO. Un dato guardado antes de que existieran entra
   sin ellos, así que la pantalla los trata como vacíos y no inventa ninguno. El único que se
   exige es el nombre: es lo que identifica a la empresa en todo lo que el sistema imprime
   —hoy el organigrama y sus exportaciones, mañana los reportes— y ninguno de esos sitios tiene
   qué poner si falta.

   NI AQUÍ NI EN PANTALLA SE DICE CUÁNTOS SITIOS SON. Se decía "tres" y era verdad el día que se
   escribió; en cuanto se sume un reporte deja de serlo, y una cifra que se queda vieja es peor
   que no dar ninguna, porque la primera vez que alguien la comprueba deja de creerse el resto. */

/* EL RUBRO ES UNA LISTA, no texto libre: escrito a mano, la misma empresa acaba siendo
   "Tecnología", "tecnologia" y "TI" según quién lo teclee, y el día que alguien quiera agrupar o
   comparar por rubro no hay nada que agrupar.

   Cerrada y ordenada alfabéticamente, con "Otro" al final para el caso que no encaje —sin él, la
   lista obliga a mentir a quien no se ve en ninguna opción—. Son categorías amplias a propósito:
   una lista de cien actividades es más difícil de recorrer que un campo de texto. */
const RUBROS = [
  'Agricultura y ganadería',
  'Alimentos y bebidas',
  'Banca y finanzas',
  'Comercio y retail',
  'Construcción e inmobiliaria',
  'Consultoría y servicios profesionales',
  'Educación',
  'Energía y minería',
  'Entretenimiento y medios',
  'Hotelería y turismo',
  'Industria y manufactura',
  'Logística y transporte',
  'Organizaciones sin fines de lucro',
  'Salud',
  'Seguros',
  'Sector público',
  'Tecnología',
  'Telecomunicaciones',
  'Textil y confección',
  'Otro',
]

const GRUPOS = [
  {
    titulo: 'Identificación',
    desc: 'Cómo se llama la empresa por dentro y cómo firma por fuera.',
    conBanda: true,
    campos: [
      /* TRES POR FILA, Y LA FILA SUMA 12 EXACTAS. Iban de tres, tres y dos columnas: entraban
         cuatro campos en la primera fila y el País se quedaba solo en la segunda con dos tercios
         de hueco a la derecha. Con tres tercios arriba y dos mitades abajo no sobra nada, y los
         dos desplegables —cuyo texto es el más largo de la tarjeta— son los que más ancho
         necesitan. */
      { key: 'nombre', label: 'Nombre comercial', ph: 'FarmaVida', requerido: true, col: 'c-tercio',
        ayuda: 'El que se lee en el organigrama y en sus exportaciones.',
        faltaMsg: 'El organigrama lo imprime en su cabecera: no puede quedar vacío.' },
      { key: 'razonSocial', label: 'Razón social', ph: 'FarmaVida S.R.L.', col: 'c-tercio',
        ayuda: 'El nombre legal, para contratos y documentos.' },
      { key: 'nit', label: 'NIT', ph: '1234567890', col: 'c-tercio' },
      /* `c-tercio` y no `c-corto` como el NIT: el rubro se elige de una lista cuyo texto más
         largo pasa de los 200 px, y en una columna estrecha el desplegable lo partía en dos
         renglones y crecía de alto. Se mide por lo que va a mostrar, no por lo que se teclea. */
      { key: 'rubro', label: 'Rubro', col: 'c-medio', tipo: 'lista', opciones: RUBROS,
        ph: 'Elige un rubro' },
      /* EL PAÍS SE PREGUNTA UNA VEZ Y AQUÍ, no en cada sucursal ni en cada regional. De él
         salen las ciudades que ofrece el resto del sistema: sin él, la lista de ciudades sería
         la de un país escrito a mano en el código, y esto se vende a varios. */
      { key: 'pais', label: 'País', col: 'c-medio', tipo: 'lista', opciones: NOMBRES_PAISES,
        ph: 'Elige un país',
        ayuda: 'De aquí salen las ciudades que se ofrecen al crear regionales y sucursales.' },
    ],
  },
  {
    titulo: 'Contacto',
    desc: 'Los datos de la casa matriz. Las direcciones de cada oficina van en Sucursales.',
    /* DOS TELÉFONOS, Y CADA UNO CON SU NOMBRE. No son "teléfono 1" y "teléfono 2": el fijo y el
       celular son canales distintos —a uno se llama en horario de oficina, al otro se le escribe
       por WhatsApp a cualquier hora— y numerarlos obliga a adivinar cuál sirve para qué. */
    campos: [
      { key: 'correo', label: 'Correo electrónico', ph: 'contacto@ejemplo.com', col: 'c-tercio',
        html: 'email', ayuda: 'El buzón de la empresa, no el de una persona.' },
      { key: 'telefono', label: 'Teléfono', ph: '+591 3 000 0000', col: 'c-tercio', html: 'tel' },
      { key: 'celular', label: 'Celular o WhatsApp', ph: '+591 700 00000', col: 'c-tercio',
        html: 'tel' },
      { key: 'direccionLegal', label: 'Dirección legal', ph: 'Av. Principal 100, Santa Cruz',
        col: 'c-todo',
        ayuda: 'La del domicilio fiscal, que no siempre coincide con una sucursal.' },
    ],
  },
  /* LA PRESENCIA DIGITAL VA APARTE DEL CONTACTO. El teléfono y el correo son por dónde se HABLA
     con la empresa; el sitio y las redes son dónde se la MIRA. Quien entra a corregir un número
     no entra a pegar cuatro enlaces, y separadas cada tarjeta se completa de una sentada.

     TRES REDES Y NO TODAS. Están las que una empresa usa de vitrina ante quien va a trabajar en
     ella: LinkedIn para lo laboral, Instagram y Facebook para lo público. X, TikTok o YouTube se
     quedaron fuera porque ocho casillas casi todas vacías se leen peor que ninguna —y sumar una
     el día que haga falta es una línea de aquí abajo, igual que quitarla—.

     SE GUARDAN COMO LA GENTE LAS ESCRIBE: "instagram.com/empresa" vale, sin https:// delante,
     que es como sale de copiar la barra del navegador. El prefijo lo pone el enlace al leerlo. */
  {
    titulo: 'Presencia digital',
    desc: 'Dónde encuentra a la empresa quien la busca por fuera.',
    campos: [
      { key: 'web', label: 'Sitio web', ph: 'ejemplo.com', col: 'c-med', enlace: true },
      { key: 'linkedin', label: 'LinkedIn', ph: 'linkedin.com/company/ejemplo', col: 'c-med',
        enlace: true },
      { key: 'instagram', label: 'Instagram', ph: 'instagram.com/ejemplo', col: 'c-med',
        enlace: true },
      { key: 'facebook', label: 'Facebook', ph: 'facebook.com/ejemplo', col: 'c-med',
        enlace: true },
    ],
  },
]

const vacio = v => !v || !String(v).trim()

/* EL LOGO SE REDIMENSIONA ANTES DE GUARDARSE.
   Se queda como dataURL —viaja junto al resto de los datos de la empresa y sobrevive a la
   recarga, cosa que un objectURL no hace—, pero un PNG recién exportado son varios megas y en
   base64 engordan un tercio más. `localStorage` ronda los 5 MB y, cuando se llena, la escritura
   falla EN SILENCIO: el logo parecería guardado hasta recargar. A 512 px de lado mayor un logo
   se ve impecable en pantalla y baja a unas decenas de kilobytes.

   Lo pequeño no se toca: por debajo de 200 KB y de 512 px se guarda tal cual, para no volver a
   comprimir un PNG que ya estaba bien y perder nitidez sin ganar nada. */
const LOGO_LADO_MAX = 512
const LOGO_ENTRADA_MAX = 5 * 1024 * 1024

function prepararLogo(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Elige un archivo de imagen.'))
    if (file.size > LOGO_ENTRADA_MAX) return reject(new Error('La imagen pesa más de 5 MB.'))

    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      img.onload = () => {
        const lado = Math.max(img.width, img.height)
        if (lado <= LOGO_LADO_MAX && file.size <= 200 * 1024) return resolve(lector.result)

        const escala = Math.min(1, LOGO_LADO_MAX / lado)
        const lienzo = document.createElement('canvas')
        lienzo.width = Math.max(1, Math.round(img.width * escala))
        lienzo.height = Math.max(1, Math.round(img.height * escala))
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
        // PNG y no JPEG: los logos suelen venir con fondo transparente y el JPEG lo pinta negro.
        resolve(lienzo.toDataURL('image/png'))
      }
      img.src = lector.result
    }
    lector.readAsDataURL(file)
  })
}

/* LA BANDA DE IDENTIDAD: la empresa tal como queda, encima de los campos que la definen.
   El marco del logo es CUADRADO aunque el logo no lo sea, para que la banda no cambie de alto
   según la imagen que suban; un logo apaisado se centra dentro con `contain` en vez de
   deformarse.

   La línea de abajo solo enseña lo que existe —razón social, NIT, rubro— y se arma con `filter`
   en vez de con huecos: escribir "NIT —" cuando nadie puso un NIT es afirmar un dato que no hay. */
/* LA BANDA TAMBIÉN TIENE DOS ESTADOS. En lectura es una ficha —logo, nombre, con qué firma— y
   nada más: sin botones, sin zona de arrastre y sin la nota de "PNG con fondo transparente",
   que es una instrucción para quien va a subir algo y ruido para quien vino a mirar. En edición
   aparece todo eso. El recuadro del logo no se mueve de sitio entre un estado y otro. */
function BandaIdentidad({ form, onLogo, editando }) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const [encima, setEncima] = useState(false)

  async function recibir(file) {
    if (!file) return
    try {
      setError(null)
      onLogo(await prepararLogo(file))
    } catch (e) {
      setError(e.message)
    }
  }

  const nombre = form.nombre?.trim()
  /* EL PAÍS ENTRA EN LA LÍNEA porque en lectura la banda pasa a ser la tarjeta entera: si no
     estuviera acá, no estaría en ningún sitio sin pulsar «Editar». */
  const meta = [form.razonSocial, form.nit && `NIT ${form.nit}`, form.rubro, form.pais]
    .map(v => (v || '').trim()).filter(Boolean).join(' · ')

  /* Las iniciales, para el hueco del logo cuando no hay logo y no se está editando. */
  const iniciales = (nombre || '').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('')

  /* Soltar un archivo sobre la banda solo hace algo mientras se edita. Fuera de edición ni
     siquiera se cancela el evento del navegador: que abra la imagen en una pestaña, como haría
     en cualquier página, es más claro que tragársela sin decir nada. */
  const arrastre = editando ? {
    onDragOver: e => { e.preventDefault(); setEncima(true) },
    onDragLeave: () => setEncima(false),
    onDrop: e => { e.preventDefault(); setEncima(false); recibir(e.dataTransfer.files?.[0]) },
  } : {}

  return (
    <div>
      <div
        {...arrastre}
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 18px', borderRadius: 12,
          background: encima ? 'var(--green-tint)' : 'var(--surface-hover)',
          border: `1px solid ${encima ? 'var(--green)' : 'var(--border-soft)'}`,
          transition: 'background .15s, border-color .15s',
        }}
      >
        <div
          style={{
            width: 76, height: 76, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
            border: `1.5px ${form.logo || !editando ? 'solid' : 'dashed'} var(--border-soft)`,
            background: 'var(--surface-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {form.logo ? (
            /* EL LOGO LLENA SU RECUADRO. Estaba al 80% y ese 20% sobrante se leía como un marco
               blanco alrededor de la imagen —el recuadro tiene fondo de tarjeta y la banda es
               gris, así que el hueco se ve—, no como aire de diseño.

               `contain` y no `cover`: un logo suele ser un texto apaisado y `cover` lo llenaría
               recortándole los lados, que es justo lo que nadie quiere que le pase a su marca.
               Si la imagen no es cuadrada quedan bandas a los costados, pero son la forma del
               logo y no un borde puesto por nosotros. */
            <img
              src={form.logo}
              alt="Logo de la empresa"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : editando ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Subir el logo de la empresa"
              style={{
                width: '100%', height: '100%', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <UploadCloud size={20} />
            </button>
          ) : (
            /* SIN LOGO Y EN LECTURA, LAS INICIALES. Antes iba el mismo icono de subida que en
               edición, solo que gris y sin poder pulsarse: un recuadro punteado con una nube
               dentro se lee como un botón roto, no como «aquí no hay logo». Las iniciales llenan
               el hueco con algo que es de la empresa —igual que el avatar de una persona sin
               foto— y se distinguen a la primera de un logo de verdad. */
            <span style={{
              fontSize: 26, fontWeight: 700, letterSpacing: '-.02em',
              color: 'var(--text-muted)',
            }}>{iniciales || '—'}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 19, fontWeight: 700, letterSpacing: '-.02em',
            color: nombre ? 'var(--text-heading)' : 'var(--text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {nombre || 'Sin nombre'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
            {meta || 'Así se verá la empresa en el organigrama'}
          </div>
        </div>

        {editando && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600,
                color: 'var(--text-heading)', background: 'var(--surface-card)',
                border: '1px solid var(--border-soft)',
              }}
            >
              {form.logo ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {form.logo && (
              <button
                type="button"
                aria-label="Quitar el logo"
                onClick={() => { setError(null); onLogo(null) }}
                style={{
                  width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--red)', background: 'transparent',
                  border: '1px solid var(--border-soft)',
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => { recibir(e.target.files?.[0]); e.target.value = '' }}
      />

      {(editando || error) && (
        <p style={{ fontSize: 10.5, color: error ? 'var(--red)' : 'var(--text-muted)', margin: '7px 0 0', lineHeight: 1.45 }}>
          {error || 'PNG con fondo transparente, o arrastra la imagen sobre la banda.'}
        </p>
      )}
    </div>
  )
}

export default function DatosEmpresa() {
  const { empresa, setEmpresa } = useOnboardingData()
  const { setDirty, setSaveHandler } = useUnsavedChanges()
  const [form, setForm] = useState(empresa)

  /* SE ENTRA A MIRAR, Y A EDITAR SOLO A PROPÓSITO.
     Esto no es una pantalla de ajustes: son los datos de la empresa, se llenan una vez y se
     consultan durante años. Con el formulario permanentemente abierto, cada visita dejaba a
     tiro de un clic distraído el NIT o la razón social ya escritos, y una tarjeta llena de
     cajas se lee bastante peor que una lista de datos.

     El botón es además lo que vuelve honesto el aviso de "cambios sin guardar": mientras nadie
     haya pulsado Editar no hay borrador que perder y salir de la pantalla no pregunta nada. */
  const [editando, setEditando] = useState(false)

  const cambiado = JSON.stringify(form) !== JSON.stringify(empresa)
  const invalido = vacio(form.nombre)

  /* Fuera de edición, lo que se enseña es lo guardado. Importa cuando el dato cambia desde otro
     lado —otra pestaña, una importación— con esta pantalla abierta: sin esto seguiría mostrando
     la copia que se hizo al montar. */
  useEffect(() => { if (!editando) setForm(empresa) }, [editando, empresa])

  /* El aviso de "tienes cambios sin guardar" es el mismo del resto de la app: se enciende
     mientras el borrador difiera de lo guardado y se apaga al salir, para no dejar la marca
     puesta en la pantalla siguiente. */
  useEffect(() => {
    setDirty(editando && cambiado && !invalido)
    return () => setDirty(false)
  }, [editando, cambiado, invalido, setDirty])

  /* Guardar desde el aviso de salida cierra también la edición: si no, se volvía a esta pantalla
     con el formulario abierto y sin nada pendiente que lo justificara. */
  useEffect(() => {
    setSaveHandler(() => { if (!invalido) { setEmpresa(form); setEditando(false) } })
    return () => setSaveHandler(null)
  }, [form, invalido, setEmpresa, setSaveHandler])

  const set = (key, valor) => setForm(prev => ({ ...prev, [key]: valor }))

  function guardar() {
    if (invalido) return
    setEmpresa(form)
    setDirty(false)
    setEditando(false)
  }

  /* Cancelar devuelve el borrador a lo guardado ANTES de cerrar la edición. Al revés funciona
     igual —el efecto de arriba lo repondría— pero por un fotograma se leerían en modo lectura
     los valores a medio escribir que se acaban de descartar. */
  function cancelar() {
    setForm(empresa)
    setDirty(false)
    setEditando(false)
  }

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Datos de la empresa</h1>
          <p className="pl-subtitle">Quién es la organización. Se define una vez y casi no se toca.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {editando ? (
            <>
              {/* "Cancelar" y no "Descartar": ahora se sale de un modo, no solo se tiran unos
                  cambios, y el botón hace las dos cosas de una vez. */}
              <button className="pl-btn-cancel" onClick={cancelar}>
                <X size={14} /> Cancelar
              </button>
              <button
                className="pl-btn-save"
                onClick={guardar}
                disabled={invalido || !cambiado}
                title={!cambiado ? 'No has cambiado nada todavía' : undefined}
              >
                <Save size={14} /> Guardar cambios
              </button>
            </>
          ) : (
            <button className="pl-btn-save" onClick={() => setEditando(true)}>
              <Pencil size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      {/* 1180 y no 880: a 880 la identificación no llegaba a caber en una fila y el rubro se
          quedaba solo con media tarjeta vacía al lado. Sigue habiendo tope —un formulario a todo
          lo ancho de un monitor deja los rótulos lejísimos de sus campos—, solo que más alto. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180 }}>
        {GRUPOS.map(grupo => (
          <TarjetaCampos
            key={grupo.titulo}
            titulo={grupo.titulo}
            desc={grupo.desc}
            /* EN LECTURA, LA BANDA ES LA TARJETA. Debajo de ella venían los mismos cuatro datos
               otra vez con su rótulo —«FarmaVida», «FarmaVida S.R.L.», «1023456789», «Salud»—, a
               tres centímetros de donde ya estaban escritos. Es el mismo defecto que el
               distintivo repetido de la tabla: leer dos veces lo mismo hace dudar de si son dos
               cosas distintas.

               Editando sí salen los cinco: ahí no se leen, se escriben, y cada uno necesita su
               rótulo, su asterisco y su caja. */
            campos={grupo.conBanda && !editando ? [] : grupo.campos}
            form={form}
            set={set}
            editando={editando}
            prefijo="emp"
          >
            {/* Lo único que esta ficha tiene de propio: la banda con el logo, entre la cabecera
                de la tarjeta y sus campos. */}
            {grupo.conBanda && (
              <>
                <BandaIdentidad form={form} editando={editando} onLogo={v => set('logo', v)} />
                {/* La raya separa la banda de los campos: sin campos debajo no separa nada. */}
                {editando && <div style={{ height: 1, background: 'var(--border-soft)', margin: '18px 0' }} />}
              </>
            )}
          </TarjetaCampos>
        ))}

        {/* La leyenda va DEBAJO del formulario y no encima: arriba se lee antes de haber visto un
            solo asterisco y no significa nada; abajo, se busca justo cuando uno se pregunta por
            qué no le deja guardar. Y solo en edición: sin campos que rellenar no hay obligación
            que explicar. */}
        {editando && <p className="pl-leyenda"><b>*</b> Campo obligatorio</p>}

        {/* SOLO EN EDICIÓN, como la leyenda del asterisco. Explica por qué el nombre no puede
            quedar vacío: eso le importa a quien está rellenando, y en lectura era un párrafo de
            seis renglones al final de la página hablando de un campo que quedó ochocientos
            píxeles más arriba. */}
        {editando && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '16px 18px', borderRadius: 12,
          background: 'var(--surface-hover)', border: '1px solid var(--border-soft)',
        }}>
          <Building2 size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-heading)' }}>El nombre comercial identifica a la empresa en toda la plataforma.</strong>{' '}
            Hoy encabeza el organigrama, nombra los archivos que se exportan desde él y es de quien
            cuelga un área que no depende de ninguna otra; y se repetirá en cada reporte y cada
            documento que emita el sistema. Por eso es el único dato que no puede quedar vacío.
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
