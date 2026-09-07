import Desplegable from '../layout/Desplegable'
import SelectorPersona, { AvatarPersona } from '../personas/SelectorPersona'
import SelectorFecha from '../layout/SelectorFecha'

/* LA FICHA DE UN OBJETO DE LA ORGANIZACIÓN, en sus dos estados.
   Nació dentro de "Datos de la empresa" y salió de allí en cuanto la sucursal pidió lo mismo:
   una tarjeta con un grupo de campos que se LEE de normal y se EDITA a propósito. Duplicarla
   habría sido garantizar que dentro de tres meses las dos pantallas se parecieran solo de lejos
   —un tamaño de letra aquí, un guion allá—, y son la misma idea.

   LOS CAMPOS SE DECLARAN, NO SE DIBUJAN. Cada pantalla trae su lista de descriptores y esto
   decide cómo se ve cada uno según el estado. Lo que un descriptor puede decir:

     key        la clave dentro del formulario
     label      el rótulo
     col        cuánto ocupa en la rejilla de doce (`c-corto`, `c-med`, `c-tercio`, `c-ancho`)
     ph         el marcador del campo vacío
     ayuda      la línea gris de debajo, solo en edición
     requerido  marca el asterisco y pinta el borde en rojo si queda vacío
     faltaMsg   qué decir cuando falta; hay un texto por defecto
     html       'email' | 'tel' | 'date'. Los dos primeros son el tipo del input y el enlace en
                que se convierte al leerlo; 'date' cambia el campo entero por el calendario propio
     tipo       'lista' + `opciones` para un desplegable, 'persona' + `personas` para elegir
                gente, o 'texto' para un campo de varias líneas
     vacio      qué decir cuando el campo está vacío, si ese vacío significa algo —«Sin límite»—.
                Con esto el campo se sigue viendo al leer la ficha y no cae en «Sin completar»
     enlace     el valor es una URL y en lectura se puede pulsar
     leer       para lo que no es texto: recibe el valor y devuelve lo que se pinta
     deducido   el dato NO se escribe: viene ya calculado de otro sitio y solo se enseña. Ni en
                edición hay caja donde teclearlo, y el formulario no guarda copia de él
     soloEdicion  el campo no sale leyendo la ficha. Es para lo que ya se lee en otro sitio de la
                misma tarjeta —el cargo del responsable, que la persona elegida trae debajo de su
                nombre— y que editando sí hace falta ver aparte */

const vacio = v => !v || !String(v).trim()

/* EL DATO CUANDO NO SE ESTÁ EDITANDO. Lo que en edición es una caja, aquí es texto suelto:
   misma rejilla y mismo rótulo, sin el marco. Y lo que se puede seguir —el correo, los
   teléfonos, el sitio, las redes— se vuelve enlace, que es media razón de tener un modo de
   lectura: a estas pantallas se entra a consultar un dato y casi siempre a usarlo.

   EL GUION DEL CAMPO VACÍO no es adorno. Un renglón en blanco parece un fallo de la pantalla;
   el guion dice que ahí cabe algo y que nadie lo ha puesto. */
function ValorLeido({ campo, valor }) {
  const v = String(valor ?? '').trim()
  /* UN VACÍO QUE SIGNIFICA ALGO SE DICE CON PALABRAS. Hay campos donde no haber contestado ES la
     respuesta: un cargo sin tope está «Sin límite», no «sin completar». El guion sirve cuando el
     vacío es una ausencia; cuando es una decisión, un guion la esconde y encima la manda a la
     línea de «Sin completar», que dice lo contrario de lo que pasa. */
  if (!v) {
    return <p className="emp-valor emp-valor-vacio">{campo.vacio || '—'}</p>
  }

  // Lo que no es texto —una pastilla de estado, por ejemplo— lo pinta quien declaró el campo.
  if (campo.leer) return <div className="emp-valor">{campo.leer(v)}</div>

  /* Una persona se lee como se eligió: con su cara y su cargo. Un nombre que ya no está en el
     directorio se sigue enseñando —sin foto—, porque dar de baja a alguien no debería vaciar en
     silencio el responsable de una sede. */
  if (campo.tipo === 'persona') {
    const p = (campo.personas || []).find(x => x.nombre === v)
    return (
      <div className="emp-persona">
        <AvatarPersona persona={p} tam={30} />
        <div style={{ minWidth: 0 }}>
          <div className="sp-nombre">{v}</div>
          {p?.cargo && <div className="sp-cargo-fila">{p.cargo}</div>}
        </div>
      </div>
    )
  }

  /* De un desplegable se guarda el VALOR y se enseña la ETIQUETA. Coinciden en las listas de
     cadenas sueltas y no en las de pares, donde el valor es un identificador que no se lee. */
  if (campo.tipo === 'lista') {
    const op = (campo.opciones || [])
      .map(o => (typeof o === 'string' ? { valor: o, etiqueta: o } : o))
      .find(o => o.valor === v)
    return <p className="emp-valor">{op ? op.etiqueta : v}</p>
  }

  /* Una fecha se guarda como 'AAAA-MM-DD' porque es lo que come el input y lo que ordena bien,
     pero eso no se le enseña a nadie. El mediodía en la cadena evita el clásico día de menos:
     'T00:00:00' sin zona lo interpreta el navegador en local y no salta, pero un valor a medias
     sí, así que se comprueba antes de escribirlo. */
  if (campo.html === 'date') {
    const d = new Date(`${v}T00:00:00`)
    return (
      <p className="emp-valor">
        {isNaN(d) ? v : d.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    )
  }

  /* El sitio y las redes se guardan como la gente los escribe —"ejemplo.com", sin https://
     delante—, y así tal cual el navegador leería el enlace como una ruta de esta misma
     aplicación y no saldría de ella. El prefijo se pone al construir el href y no al guardar,
     para no ensuciar lo que el usuario tecleó. */
  const href = campo.enlace ? (/^https?:\/\//i.test(v) ? v : `https://${v}`)
    : campo.html === 'email' ? `mailto:${v}`
    /* El `tel:` se queda solo con el + y las cifras: los espacios de "+591 3 000 0000" están
       para leerlo, y algunos marcadores se atragantan con ellos. Lo que se VE no cambia. */
    : campo.html === 'tel' ? `tel:${v.replace(/[^+\d]/g, '')}`
    : null

  /* Leído, un texto de varias líneas conserva sus saltos: escribirlo en tres párrafos y verlo
     en un chorizo es perder la mitad de lo que quien lo escribió quiso decir. */
  if (campo.tipo === 'texto') return <p className="emp-valor emp-valor-parrafo">{v}</p>

  if (!href) return <p className="emp-valor">{v}</p>
  return (
    <a
      className="emp-valor emp-valor-enlace"
      href={href}
      {...(campo.enlace ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {v}
    </a>
  )
}

function CampoFicha({ campo, form, set, editando, prefijo, marcarFaltas }) {
  const id = `${prefijo}-${campo.key}`
  /* UN CAMPO VACÍO NO ESTÁ MAL TODAVÍA. Una ficha en blanco pintaba de rojo sus obligatorios
     antes de que nadie hubiera tecleado una letra: regañaba por no haber empezado. Quien edita
     algo ya escrito sí quiere el aviso en cuanto lo borra —`marcarFaltas` viene puesto por
     defecto—, y la pantalla de crear lo enciende cuando se intenta guardar. */
  /* UN DATO DEDUCIDO NO SE ESCRIBE NUNCA, ni siquiera con el formulario abierto: llega ya
     calculado desde su origen —el cargo que el responsable tiene en su ficha— y este campo solo
     lo enseña. No hay caja, no se guarda copia, y por eso no puede desactualizarse: lo que se ve
     es lo que dice el origen hoy.

     Y NO PUEDE FALTAR, aunque venga vacío: nadie puede rellenarlo, así que exigirlo sería pedir
     algo que no hay forma de dar. */
  const fijo = campo.deducido !== undefined
  const falta = editando && marcarFaltas && campo.requerido && !fijo && vacio(form[campo.key])

  return (
    <div className={campo.col || 'c-med'}>
      {/* `.pl-label` es una columna flex, así que dos hijos son dos renglones: la etiqueta y su
          asterisco van dentro de un mismo hijo para que compartan línea.

          En lectura el mismo rótulo va en un `div`: un `label` sin campo al que apuntar le
          promete a un lector de pantalla un control que no existe. Y el asterisco tampoco sale,
          porque en lectura no hay nada que rellenar. Lo mismo vale para un dato deducido, que no
          tiene control al que apuntar en ningún estado. */}
      {editando && !fijo ? (
        <label className="pl-label" htmlFor={id}>
          <span>
            {campo.label}
            {campo.requerido && <span className="pl-req" aria-hidden="true">*</span>}
          </span>
        </label>
      ) : (
        <div className="pl-label emp-rotulo"><span>{campo.label}</span></div>
      )}

      {fijo ? (
        /* CON EL FORMULARIO ABIERTO OCUPA LA CAJA DE UN CAMPO, para que la fila no quede coja al
           lado del que sí se escribe, pero sin borde ni fondo de campo y en gris: lo que se puede
           teclear tiene que distinguirse de lo que solo se lee ANTES de intentarlo, no después.
           Leyendo la ficha vuelve a ser texto suelto como todo lo demás, que es lo que es. */
        editando
          ? <div className="emp-campo-fijo">{campo.deducido || '—'}</div>
          : <p className={`emp-valor${campo.deducido ? '' : ' emp-valor-vacio'}`}>{campo.deducido || '—'}</p>
      ) : !editando ? (
        <ValorLeido campo={campo} valor={form[campo.key]} />
      ) : campo.tipo === 'texto' ? (
        /* UNA DESCRIPCIÓN NO ES UN DATO CORTO. En una línea de alto, quien escribe dos frases
           deja de ver la primera, y el campo comunica «pon tres palabras» cuando lo que se pide
           es explicar algo. `resize: vertical` porque a veces son tres frases y a veces diez. */
        <textarea
          id={id}
          className="pl-input pl-area"
          rows={3}
          required={!!campo.requerido}
          value={form[campo.key] || ''}
          placeholder={campo.ph}
          onChange={e => set(campo.key, e.target.value)}
          style={falta ? { borderColor: 'var(--red)' } : undefined}
        />
      ) : campo.html === 'date' ? (
        /* Un `<input type="date">` lo dibuja el sistema operativo, calendario incluido, y no hay
           CSS que lo alcance: al lado de nuestros campos se veía de otra aplicación. */
        <SelectorFecha
          id={id}
          valor={form[campo.key] || ''}
          onCambio={v => set(campo.key, v)}
          placeholder={campo.ph || 'Elegir fecha'}
          ariaLabel={campo.label}
        />
      ) : campo.tipo === 'persona' ? (
        <SelectorPersona
          id={id}
          valor={form[campo.key] || ''}
          personas={campo.personas || []}
          placeholder={campo.ph}
          onCambio={v => set(campo.key, v)}
          ariaLabel={campo.label}
          vacioTitulo={campo.vacioTitulo}
          vacioNota={campo.vacioNota}
        />
      ) : campo.tipo === 'lista' ? (
        <Desplegable
          id={id}
          valor={form[campo.key] || ''}
          placeholder={campo.ph}
          onCambio={v => set(campo.key, v)}
          ariaLabel={campo.label}
          /* UN VALOR GUARDADO QUE NO ESTÁ EN LA LISTA SE CONSERVA. Alguno de estos campos fue
             texto libre antes de ser lista, así que puede haber valores escritos a mano que no
             encajen en ninguna opción; sin esto el desplegable los mostraría vacíos y los
             borraría al primer guardado, sin que nadie lo pidiera.

             Solo vale para listas de cadenas: en las de pares el valor es un identificador
             nuestro y uno que no esté en la lista es un dato roto, no una respuesta legítima. */
          opciones={
            !vacio(form[campo.key])
              && campo.opciones.every(o => typeof o === 'string')
              && !campo.opciones.includes(form[campo.key])
              ? [form[campo.key], ...campo.opciones]
              : campo.opciones
          }
        />
      ) : (
        <input
          id={id}
          className="pl-input"
          /* `email`, `tel` y `date` traen el teclado —o el calendario— correcto en el móvil. Una
             dirección web se queda en texto: con `url` el navegador rechaza "ejemplo.com" por no
             llevar https:// delante, que es justo como lo escribe todo el mundo. */
          type={campo.html || 'text'}
          required={!!campo.requerido}
          value={form[campo.key] || ''}
          placeholder={campo.ph}
          onChange={e => set(campo.key, e.target.value)}
          style={falta ? { borderColor: 'var(--red)' } : undefined}
        />
      )}

      {editando && (falta
        ? <p style={{ fontSize: 10.5, color: 'var(--red)', margin: '5px 0 0' }}>
            {campo.faltaMsg || 'No puede quedar vacío.'}
          </p>
        : campo.ayuda && (
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: '5px 0 0', lineHeight: 1.5 }}>
              {campo.ayuda}
            </p>
          ))}
    </div>
  )
}

/* `children` va entre la cabecera y los campos: es donde la empresa mete su banda de identidad.
   Nada más de la tarjeta se puede cambiar desde fuera a propósito —el día que dos fichas no se
   parezcan será porque alguien lo decidió aquí, no porque una pantalla se desvió sola—. */
export default function TarjetaCampos({ titulo, desc, campos, form, set, editando, prefijo, marcarFaltas = true, children }) {
  /* LEYENDO, LO QUE NO HAY NO OCUPA UNA FILA. Una ficha recién creada enseñaba once rótulos con
     un guion debajo —código, país, ciudad, teléfono, correo, descripción, responsable— y entre
     tanto hueco había que buscar los tres datos que sí existían. El guion tiene sentido en un
     campo suelto; en columna, once seguidos son la pantalla entera diciendo que no sabe nada.

     PERO NO DESAPARECEN EN SILENCIO: se nombran juntos en una línea al pie. Así se sigue viendo
     qué cabe ahí —que era lo que el guion protegía— en un renglón en vez de en once, y sin
     competir con lo que sí está escrito. Con el formulario abierto vuelven todos, claro: ahí lo
     vacío no es ausencia, es el sitio donde hay que escribir. */
  const valorDe = campo => (campo.deducido !== undefined ? campo.deducido : form[campo.key])
  /* `soloEdicion` es para lo que ya se lee en otro sitio de la misma tarjeta: el cargo del
     responsable, que la persona elegida ya trae escrito debajo de su nombre. No es un campo
     secreto, es un campo repetido, y repetido solo cuando no se está editando. */
  const deLectura = campos.filter(c => !c.soloEdicion)
  const vacios = editando ? [] : deLectura.filter(c => !c.vacio && vacio(valorDe(c)))
  const visibles = editando ? campos : deLectura.filter(c => c.vacio || !vacio(valorDe(c)))

  /* LA TARJETA VACÍA SE QUEDA. Llegó a esconderse entera cuando ninguno de sus campos tenía
     dato —el caso de «Responsable» en una sucursal recién creada— y el remedio fue peor: la
     ficha dejaba de tener responsable, no vacío sino inexistente, y no había forma de enterarse
     de que ese dato se podía poner sin abrir el formulario a ver qué aparecía. Una sección vacía
     informa; una sección ausente engaña.

     LO QUE SE EVITA ES LA PALABRA REPETIDA, que era el motivo real de esconderla: con un solo
     campo que se llama igual que su tarjeta, el pie decía «Responsable» debajo de «RESPONSABLE».
     Se quitan del pie los nombres que repiten el título y queda «Sin completar» a secas, que es
     todo lo que hay que decir. */
  const faltan = vacios.map(c => c.label).filter(l => l.toLowerCase() !== (titulo || '').toLowerCase())

  return (
    <section style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-soft)',
      borderRadius: 14, padding: '20px 22px', boxShadow: 'var(--shadow-card)',
    }}>
      {/* EL TÍTULO DE LA TARJETA COMPETÍA CON LOS DATOS. Iba a 13 px en negrita oscura y los
          valores van a 14.5 en negrita oscura: el rótulo de la sección pesaba lo mismo —o menos—
          que lo que contiene, así que la ficha se leía como una lista de palabras en negrita
          todas iguales y no como secciones con datos dentro.

          Ahora es un rótulo de sección: más chico, en versalitas espaciadas y con un filete
          debajo que cierra la cabecera. Así quedan tres pesos distintos y no dos parecidos —
          SECCIÓN en versalitas, rótulo del campo en gris normal, y el dato grande y oscuro, que
          es lo único que uno vino a leer y ahora es lo único que grita. */}
      <div className="emp-cab">
        <h2 className="emp-cab-tit">{titulo}</h2>
        {/* LA LÍNEA GRIS DEL TÍTULO ES UNA INSTRUCCIÓN, y una instrucción se lee cuando hay algo
            que hacer. «Cómo se llama, con qué se la identifica y si sigue operando» ayuda a quien
            está rellenando; a quien vino a mirar un dato le pone una frase de catorce palabras
            entre él y lo que busca, cuatro veces por ficha. En lectura manda el título solo, que
            ya dice de qué va la tarjeta. */}
        {desc && editando && (
          <p className="emp-cab-desc">{desc}</p>
        )}
      </div>

      {children}

      <div className={`emp-form${editando ? '' : ' emp-leyendo'}`}>
        {visibles.map(campo => (
          <CampoFicha
            key={campo.key}
            campo={campo}
            form={form}
            set={set}
            editando={editando}
            prefijo={prefijo}
            marcarFaltas={marcarFaltas}
          />
        ))}
      </div>

      {vacios.length > 0 && (
        <p className="emp-faltan">
          <span>Sin completar</span>
          {faltan.join(' · ')}
        </p>
      )}
    </section>
  )
}
