import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, UserRound, Users } from 'lucide-react'

/* ELEGIR A UNA PERSONA NO ES ELEGIR DE UNA LISTA CUALQUIERA.
   El campo «responsable» usaba el desplegable de la casa con una lista de nombres pelados, y a
   una persona no se la reconoce por su nombre a secas: hay dos Ana Martínez, hay quien sabe la
   cara y no el apellido, y quien busca «el de sistemas» y no un nombre. Así que aquí la opción
   es la persona entera —foto, nombre y cargo— y se puede escribir para encontrarla.

   EL BUSCADOR ESTÁ SIEMPRE, no a partir de cierta cantidad. Que el mismo campo se comportara
   distinto según cuánta gente hubiera obligaría a averiguar, cada vez, si esta toca escribir o
   recorrer. Con cinco personas sobra pero no estorba: la lista entera sigue debajo. Es la misma
   decisión que ya tomó `SelectorLista` para los cargos, y por el mismo motivo.

   BUSCA POR CARGO TAMBIÉN, y sin tildes: «diseñadora», «disenadora» y «UX» encuentran a la
   misma persona. Quien administra sedes suele saber el puesto de quien busca antes que su
   apellido.

   SE GUARDA EL NOMBRE, no un id: es lo que el modelo de sucursales guarda desde siempre y no
   toca migrar nada. Un nombre guardado que ya no está en el directorio se sigue enseñando tal
   cual —sin foto—, porque borrar a alguien de la nómina no debería vaciar en silencio el
   responsable de una sede. */

const sinTildes = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/* La foto si la hay, y si no las iniciales sobre su color. Nunca un hueco gris: media lista con
   cara y media con un cuadrado vacío se lee peor que una lista entera de iniciales. */
export function AvatarPersona({ persona, tam = 30 }) {
  const [rota, setRota] = useState(false)
  const src = rota ? null : persona?.foto

  if (src) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setRota(true)}
        style={{ width: tam, height: tam, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: tam, height: tam, borderRadius: '50%', flexShrink: 0,
      background: persona?.color || 'var(--surface-hover)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {persona?.initials
        ? <span style={{ color: '#fff', fontSize: Math.round(tam * 0.36), fontWeight: 700 }}>{persona.initials}</span>
        : <UserRound size={Math.round(tam * 0.5)} style={{ color: 'var(--text-muted)' }} />}
    </div>
  )
}

export default function SelectorPersona({
  id,
  valor,
  personas = [],
  placeholder = 'Sin responsable asignado',
  onCambio,
  ariaLabel,
  /* Qué se dice cuando el directorio está vacío. Se recibe de fuera porque la frase depende de
     para qué se está eligiendo, y una genérica ("no hay opciones") no dice qué hacer. */
  vacioTitulo = 'Aún no tienes ningún colaborador registrado',
  vacioNota = 'Cuando des de alta a tu gente en Colaboradores, aparecerá aquí para poder elegirla.',
}) {
  const [abierto, setAbierto] = useState(false)
  const [busca, setBusca] = useState('')
  const [haciaArriba, setHaciaArriba] = useState(false)
  const cajaRef = useRef(null)
  const botonRef = useRef(null)

  const elegida = personas.find(p => p.nombre === valor) || null
  const otros = personas.filter(p => !p.tu)

  const filtradas = useMemo(() => {
    const q = sinTildes(busca.trim())
    if (!q) return personas
    return personas.filter(p => sinTildes(p.nombre).includes(q) || sinTildes(p.cargo).includes(q))
  }, [personas, busca])

  useEffect(() => {
    if (!abierto) return
    const fuera = e => { if (cajaRef.current && !cajaRef.current.contains(e.target)) cerrar() }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  function abrir() {
    /* Hacia arriba si abajo no cabe, medido al abrir y no al montar: el mismo campo cabe o no
       según dónde esté el scroll de la página. */
    const caja = botonRef.current?.getBoundingClientRect()
    if (caja) setHaciaArriba(caja.bottom + 300 > window.innerHeight && caja.top > 300)
    setBusca('')
    setAbierto(true)
  }

  function cerrar() {
    setAbierto(false)
    setBusca('')
  }

  function elegir(nombre) {
    onCambio(nombre)
    cerrar()
    botonRef.current?.focus()
  }

  return (
    <div className="pl-dropdown-wrap" ref={cajaRef}>
      <button
        id={id}
        ref={botonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        title={elegida ? `${elegida.nombre}${elegida.cargo ? ` · ${elegida.cargo}` : ''}` : undefined}
        className={`pl-dropdown-trigger${abierto ? ' open' : ''}${valor ? '' : ' placeholder'}`}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={e => { if (e.key === 'Escape' && abierto) { e.preventDefault(); cerrar(); botonRef.current?.focus() } }}
      >
        <span className="sp-cara">
          {valor
            ? (
              <>
                <AvatarPersona persona={elegida} tam={22} />
                <span className="sp-cara-txt">
                  {elegida ? elegida.nombre : valor}
                  {elegida?.cargo && <span className="sp-cargo"> · {elegida.cargo}</span>}
                </span>
              </>
            )
            : placeholder}
        </span>
        <ChevronDown size={15} className="pl-dropdown-chevron" />
      </button>

      {abierto && (
        <div className={`pl-dropdown-menu sp-menu${haciaArriba ? ' up' : ''}`} role="listbox">
          {/* El buscador no scrollea con la lista: escribiendo se vacía la parte de abajo y, si
              se fuera con ella, el campo donde uno está tecleando desaparecería de la vista. */}
          <div className="sp-buscar">
            <Search size={13} className="pl-search-ico" />
            <input
              className="pl-search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nombre o cargo"
              autoFocus
            />
          </div>

          <div className="sp-lista">
            {/* Quitar al responsable tiene que ser posible: antes, una vez puesto uno, no había
                forma de dejar la sede sin responsable salvo recargar sin guardar. */}
            <button
              type="button"
              role="option"
              aria-selected={!valor}
              className={`pl-dropdown-item sp-item${!valor ? ' selected' : ''}`}
              onClick={() => elegir('')}
            >
              <span className="sp-fila">
                <span className="sp-hueco"><UserRound size={14} /></span>
                <span className="sp-txt"><span className="sp-nombre">{placeholder}</span></span>
              </span>
              {!valor && <Check size={14} />}
            </button>

            {filtradas.map(p => (
              <button
                key={p.nombre}
                type="button"
                role="option"
                aria-selected={p.nombre === valor}
                className={`pl-dropdown-item sp-item${p.nombre === valor ? ' selected' : ''}`}
                onClick={() => elegir(p.nombre)}
              >
                <span className="sp-fila">
                  <AvatarPersona persona={p} tam={30} />
                  <span className="sp-txt">
                    <span className="sp-nombre">
                      {p.nombre}
                      {/* Quien está usando la aplicación se reconoce sin tener que leer su
                          propio nombre entre veinte. */}
                      {p.tu && <span className="sp-tu">Tú</span>}
                    </span>
                    {p.cargo && <span className="sp-cargo-fila">{p.cargo}</span>}
                  </span>
                </span>
                {p.nombre === valor && <Check size={14} />}
              </button>
            ))}

            {/* DOS VACÍOS DISTINTOS, y decir «no hay resultados» en el primero sería mentir a
                medias: una cosa es que la búsqueda no encuentre a nadie y otra que no haya nadie
                a quien encontrar. La segunda no se arregla escribiendo otra cosa. */}
            {otros.length === 0 && !busca.trim() && (
              <div className="sp-vacio">
                <Users size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <div className="sp-vacio-tit">{vacioTitulo}</div>
                  <div className="sp-vacio-nota">{vacioNota}</div>
                </div>
              </div>
            )}

            {busca.trim() && filtradas.length === 0 && (
              <p className="sp-nada">Nadie coincide con “{busca.trim()}”.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
