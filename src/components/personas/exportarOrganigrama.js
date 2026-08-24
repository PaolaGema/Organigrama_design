import { toPng, toSvg } from 'html-to-image'

/* Sacar el organigrama de la pantalla. Son tres formatos porque son tres usos distintos:
   la imagen que se pega en una presentación, el archivo que escala sin pixelarse, y el papel.

   Lo que se captura es el ÁRBOL (`.og-tree`), no el lienzo: el lienzo lleva el zoom y el
   desplazamiento con los que uno estaba mirando, y exportar "lo que se ve" significa exportar
   un organigrama cortado por los bordes de la ventana. La librería clona el nodo, así que la
   transformación del escenario que está por encima no viaja: sale entero y a tamaño natural
   aunque en pantalla esté al 30%. */

/* Qué se captura. En el organigrama de solo lectura, el ÁRBOL: el lienzo lleva el zoom y el
   desplazamiento con los que uno estaba mirando, y exportar "lo que se ve" significa exportar
   un organigrama cortado por los bordes de la ventana.

   En la pizarra hay que subir un escalón, hasta el escenario, porque ahí las líneas de mando
   se dibujan en un SVG que es hermano del árbol y no parte de él: capturando solo el árbol
   saldrían los cuadros sin una sola línea. El zoom del escenario se anula en el clon. */
const dibujo = () => document.querySelector('.og-page .og-stage:has(.og-mando)')
  || document.querySelector('.og-page .og-tree')

/* El fondo tiene que ir explícito: el árbol es transparente y sin esto la imagen sale con el
   fondo del visor, que en un PNG pegado sobre una diapositiva oscura deja los nombres
   ilegibles. */
/* Aire alrededor del árbol. Va sumado al alto y al ancho a mano: el relleno se aplica al clon
   pero el tamaño del lienzo se calcula ANTES, sobre el nodo original, y sin sumarlo la última
   fila de cargos sale cortada por el borde de abajo. */
const MARGEN = 24

/* LAS CARAS DE OTRO DOMINIO NO ENTRAN. Para incrustar una imagen hay que poder LEERLA, y las
   fotos del prototipo vienen de randomuser.me, que no autoriza a este origen a hacerlo. La
   librería intentaba bajar las veintinueve, fallaban todas y el error se llevaba puesta la
   exportación entera: no bajaba ningún archivo y no avisaba nada.

   Se sacan del clon en vez de reemplazarlas por un cuadro gris: la inicial sobre el color de
   la persona ya está DEBAJO de cada foto —es el respaldo que dibuja `Avatar`— así que al
   quitar la imagen aparece sola y el PNG sale con el mismo círculo que se ve sin conexión.

   La regla pregunta de dónde viene la foto y no si es una foto: el día que SoulyHR aloje las
   suyas van a ser del mismo origen, se van a poder leer, y van a salir en la exportación sin
   tocar nada de esto. */
const seLeeDesdeAca = src => !src || src.startsWith('data:') || src.startsWith(location.origin)
const filtro = nodo => !(nodo.tagName === 'IMG' && !seLeeDesdeAca(nodo.currentSrc || nodo.src))

const opciones = () => ({
  filter: filtro,
  backgroundColor: getComputedStyle(document.body).getPropertyValue('--surface-card')?.trim() || '#ffffff',
  pixelRatio: 2,
  /* La tipografía viene de Google Fonts, que es otro dominio: el navegador no deja leer esa
     hoja para incrustarla y la librería se queda en el intento. Se salta el embebido y la
     familia se declara a mano en el nodo exportado. */
  skipFonts: true,
  style: {
    margin: '0',
    padding: `${MARGEN}px`,
    fontFamily: getComputedStyle(document.body).fontFamily,
    /* El escenario de la pizarra viaja con el zoom y el desplazamiento puestos; en el clon se
       anulan para que salga entero y a tamaño natural. */
    transform: 'none',
    position: 'static',
  },
})

const medidas = nodo => ({
  width: nodo.scrollWidth + MARGEN * 2,
  height: nodo.scrollHeight + MARGEN * 2,
})

/* LAS LÍNEAS DE MANDO, ESCRITAS EN EL ELEMENTO. La librería copia el estilo calculado de cada
   nodo HTML —por eso los cuadros salen con sus colores— pero no lo hace con los `path` de
   adentro del SVG: llegaban al clon sin ninguna regla, y un `path` sin reglas usa el valor por
   omisión de SVG, que es relleno NEGRO y trazo ninguno. Cada codo de la línea de mando salía
   como un manchón negro sobre el dibujo.

   Se pasan a atributos de presentación, que sí viajan en el clon. En la pantalla no cambia nada
   —la hoja de estilos le gana a un atributo— y se limpian al terminar para que un cambio de
   tema no se quede con el color viejo pegado. */
function fijarLineas(nodo) {
  const lineas = [...nodo.querySelectorAll('.og-mando-linea')]
  for (const linea of lineas) {
    const estilo = getComputedStyle(linea)
    linea.setAttribute('fill', 'none')
    linea.setAttribute('stroke', estilo.stroke)
    linea.setAttribute('stroke-width', estilo.strokeWidth)
    if (estilo.strokeDasharray && estilo.strokeDasharray !== 'none') {
      linea.setAttribute('stroke-dasharray', estilo.strokeDasharray)
    }
  }
  return () => lineas.forEach(linea => {
    for (const attr of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray']) linea.removeAttribute(attr)
  })
}

const bajar = (url, nombre) => {
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
}

const nombreArchivo = (empresa, ext) => {
  const limpio = empresa.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
  const hoy = new Date().toISOString().slice(0, 10)
  return `organigrama-${limpio}-${hoy}.${ext}`
}

const capturar = async (dibujar, empresa, ext) => {
  const nodo = dibujo()
  if (!nodo) return
  const limpiar = fijarLineas(nodo)
  try {
    bajar(await dibujar(nodo, { ...opciones(), ...medidas(nodo) }), nombreArchivo(empresa, ext))
  } finally {
    limpiar()
  }
}

export const exportarPNG = empresa => capturar(toPng, empresa, 'png')
export const exportarSVG = empresa => capturar(toSvg, empresa, 'svg')

/* Imprimir va por el navegador y no por la librería: el diálogo de impresión ya trae "Guardar
   como PDF", y ese PDF sale con el texto de verdad —se puede buscar y copiar— en vez de una
   foto del texto. La hoja que esconde la aplicación y deja solo el árbol vive en `@media print`.

   Lo que falta ahí es la ESCALA, y sin ella lo que salía por la impresora estaba mal: el árbol
   se dibujaba a tamaño natural —cinco mil píxeles de ancho— y la hoja lo cortaba por el borde
   derecho. Media empresa quedaba fuera del papel sin ningún aviso.

   El factor no puede vivir en el CSS porque depende de cuánto mide ESTE organigrama, así que se
   calcula acá y baja como variable. Un organigrama que ya entra no se agranda: `min(1, …)`. */

/* Ancho útil de un A4 apaisado con los márgenes de `@page`, a 96 ppp: 297mm − 20mm ≈ 1047px. */
const HOJA = 1040

export function imprimir() {
  const nodo = document.querySelector('.og-page .og-stage')
  if (!nodo) return window.print()

  const raiz = document.documentElement
  raiz.style.setProperty('--og-print-escala', Math.min(1, HOJA / nodo.scrollWidth))
  /* Se limpia al volver del diálogo: la variable solo tiene sentido dentro de `@media print`,
     pero dejarla puesta significa que la próxima impresión arranca con la escala de la
     anterior, que puede ser de otro organigrama. */
  const limpiar = () => {
    raiz.style.removeProperty('--og-print-escala')
    window.removeEventListener('afterprint', limpiar)
  }
  window.addEventListener('afterprint', limpiar)
  window.print()
}
