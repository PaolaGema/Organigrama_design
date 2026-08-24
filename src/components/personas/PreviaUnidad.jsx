import { Building2, User, Layers } from 'lucide-react'
import { getUnidad, subunidadesDe } from '../../data/organigramaData'

/* Cómo va a quedar la unidad en el organigrama, dibujado. Es el espejo de `PreviaPuesto`: el
   formulario de un cargo mostraba su lugar y el de una unidad lo contaba con texto sangrado
   —"SoulyHR › esta unidad"—, que es justo lo que el organigrama existe para no hacer.

   Lo que se dibuja es la respuesta a las dos preguntas que uno se hace al colocar un área:
   de qué cuelga, y qué se lleva puesto adentro. */

/* Cuántos hijos se dibujan antes de resumir. Un área con quince cargos convertiría la previa
   en la lista de otra pantalla. */
const MAX_HIJOS = 4

function MiniPildora({ nombre, foco, marca }) {
  return (
    <div className={`og-pv-card og-pv-uni${foco ? ' og-pv-foco' : ''}`}>
      {marca && <span className="og-pv-tag">{marca}</span>}
      <span className="og-pv-nom"><Building2 size={11} /> {nombre}</span>
    </div>
  )
}

export default function PreviaUnidad({ form, org, unidad, nueva, empresa }) {
  const madre = form.padreId ? getUnidad(form.padreId, org) : null

  /* El camino completo hasta la empresa. El desplegable dice de quién depende; esto dice
     dónde queda, que es la pregunta de verdad al mover un área de sitio. */
  const camino = []
  let paso = madre
  while (paso) {
    camino.unshift(paso)
    paso = paso.padreId ? getUnidad(paso.padreId, org) : null
  }

  const cargos = unidad ? org.cargos.filter(c => c.unidadId === unidad.id) : []
  const subs = unidad ? subunidadesDe(unidad.id, org) : []
  const dentro = [
    ...subs.map(u => ({ id: `u-${u.id}`, nombre: u.nombre, unidad: true })),
    ...cargos.map(c => ({ id: c.id, nombre: c.nombre })),
  ]
  const visibles = dentro.slice(0, MAX_HIJOS)
  const resto = dentro.length - visibles.length

  /* La unidad que se está creando, con lo que ya tiene adentro. Es el fondo de la recursión. */
  const foco = (
    <>
      <MiniPildora
        foco
        marca={nueva ? 'Nueva' : 'Esta unidad'}
        nombre={form.nombre.trim() || 'Sin nombre todavía'}
      />

      {dentro.length > 0 && (
        <div className="og-pv-rama">
          {visibles.map(h => (
            <div key={h.id} className="og-pv-hijo">
              {h.unidad
                ? <MiniPildora nombre={h.nombre} />
                : (
                  <div className="og-pv-card">
                    <span className="og-pv-nom"><User size={11} /> {h.nombre}</span>
                  </div>
                )}
            </div>
          ))}
          {resto > 0 && (
            <div className="og-pv-hijo"><span className="og-pv-mas">+{resto} más adentro</span></div>
          )}
        </div>
      )}
    </>
  )

  /* Cada escalón del camino contiene al siguiente, y el último contiene al foco. La sangría se
     acumula porque las ramas quedan una dentro de otra, no una al lado de la otra. */
  const escalon = i => (
    <div className={`og-pv-rama${camino.length === 0 ? ' og-pv-rama-raiz' : ''}`}>
      <div className="og-pv-hijo">
        {i < camino.length
          ? <><MiniPildora nombre={camino[i].nombre} />{escalon(i + 1)}</>
          : foco}
      </div>
    </div>
  )

  return (
    <aside className="og-pv">
      <div className="og-pv-hd">Cómo va a quedar en el organigrama</div>

      {/* La empresa encabeza siempre: es de donde cuelga todo, y una unidad sin madre cuelga
          directamente de ella. */}
      <div className="og-pv-area">
        <span className="og-pv-area-rot">Empresa</span>
        <span className="og-pv-area-nom"><Building2 size={13} /> {empresa.nombre}</span>
      </div>

      <div className="og-pv-tree">
        {camino.length > 0
          ? <><MiniPildora nombre={camino[0].nombre} />{escalon(1)}</>
          : escalon(0)}
      </div>

      {!nueva && (
        <>
          <div className="og-pv-rot og-pv-rot-pie"><Layers size={11} /> Qué tiene dentro</div>
          <div className="og-vista-conteo">
            <div><b>{cargos.length}</b><span>{cargos.length === 1 ? 'cargo' : 'cargos'}</span></div>
            <div><b>{subs.length}</b><span>{subs.length === 1 ? 'sub-unidad' : 'sub-unidades'}</span></div>
          </div>
        </>
      )}
    </aside>
  )
}
