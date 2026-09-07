import { ChevronLeft, ChevronRight } from 'lucide-react'

/* LA PAGINACIÓN, EN UN SOLO SITIO.
   Estaba copiada a mano en cuatro pantallas —Seguimiento, Plantillas, Colaboradores, Recursos—
   con los colores escritos en crudo dentro del JSX (`#0C2D40`, `#e2e8f0`, `#fff`). Eso tiene dos
   consecuencias: en tema oscuro los botones se quedan blancos sobre fondo oscuro, y cualquier
   arreglo hay que hacerlo cuatro veces. Aquí va una sola, con las variables del tema.

   NO PINTA TODAS LAS PÁGINAS. Las copias existentes hacen `Array.from({length: totalPages})`, que
   con cincuenta sucursales dibuja cincuenta botones y desborda la fila. Se muestran la primera,
   la última y las vecinas de la actual; el resto se resume en un salto. */

const paginasVisibles = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cerca = [page - 1, page, page + 1].filter(p => p > 1 && p < total)
  return [1, ...(cerca[0] > 2 ? ['…'] : []), ...cerca,
    ...(cerca[cerca.length - 1] < total - 1 ? ['…'] : []), total]
}

export default function Paginacion({ page, setPage, total, perPage, nombre = 'filas', nombreUno }) {
  const paginas = Math.ceil(total / perPage)
  /* CON UNA SOLA PÁGINA SE DIBUJA LA CUENTA PERO NO LOS BOTONES.
     Antes no se dibujaba nada, y eso dejaba la tabla sin decir cuántas filas tiene hasta que
     hubiera once. «3 de 3 regionales» es información aunque quepan todas —confirma que no falta
     nada debajo— y además avisa de que esto pagina, que es lo que uno quiere saber ANTES de
     cargar cincuenta. Los botones sí desaparecen: un control que no puede hacer nada solo
     ocupa sitio y hace dudar de si está roto. */
  if (total === 0) return null

  const desde = (page - 1) * perPage + 1
  const hasta = Math.min(page * perPage, total)

  return (
    <div className="pag">
      <span className="pag-cuenta">
        {/* «1 sucursales» es de las cosas que hacen que un producto parezca sin terminar. El
            singular lo da quien llama, porque de «Regionales» no se deduce «Región». */}
        {paginas > 1
          ? `${desde}–${hasta} de ${total} ${nombre}`
          : `${total} ${total === 1 && nombreUno ? nombreUno : nombre}`}
      </span>
      {paginas > 1 && (
      <div className="pag-botones">
        <button
          className="pag-btn"
          aria-label="Página anterior"
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          <ChevronLeft size={14} />
        </button>

        {paginasVisibles(page, paginas).map((p, i) => (
          p === '…'
            ? <span key={`s${i}`} className="pag-salto">…</span>
            : (
              <button
                key={p}
                className={`pag-btn pag-num${p === page ? ' on' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => setPage(p)}
              >{p}</button>
            )
        ))}

        <button
          className="pag-btn"
          aria-label="Página siguiente"
          disabled={page === paginas}
          onClick={() => setPage(p => Math.min(paginas, p + 1))}
        >
          <ChevronRight size={14} />
        </button>
      </div>
      )}
    </div>
  )
}
