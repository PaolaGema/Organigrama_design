import { useState } from 'react'
import { Palette, RotateCcw, User, Briefcase } from 'lucide-react'
import CabeceraModal from './CabeceraModal'
import { COLORES_LEYENDA, empresa } from '../../data/organigramaData'

/* LOS COLORES DE LA LEYENDA, elegidos por la empresa.
   Lo que se cambia es QUÉ TONO tiene cada significado, nunca cuántos significados hay ni cuál
   pinta qué: eso último es la leyenda, y una leyenda que cada empresa redefine deja de poder
   explicarse. Cambiar el tono sí hace falta —por marca, y sobre todo por daltonismo: el teal
   del staff y el ámbar del vacante son justo el par que más se confunde—.

   Cada renglón trae su cuadro de verdad al lado, con los mismos estilos del dibujo, porque un
   círculo de color no dice cómo va a quedar un borde punteado con su relleno detrás. */

/* El colaborador se muestra y NO se puede tocar. Podría haberse omitido, pero entonces la
   pregunta "¿y el colaborador de qué color va?" queda sin contestar justo en la pantalla que
   existe para contestarla. Se lista con su cuadro blanco y su motivo. */
function CuadroMuestra({ clase, nombre, vacante, externo }) {
  return (
    <div className={`og-col-muestra og-card ${clase}`}>
      {vacante && <span className="og-card-tag">Vacante</span>}
      <div className="og-card-title">
        {externo ? <Briefcase size={11} className="og-card-ico" /> : <User size={11} className="og-card-ico" />}
        <span>{nombre}</span>
      </div>
      <div className="og-chip og-chip-vacio">{externo ? 'Sin prestador' : 'Sin colaborador'}</div>
    </div>
  )
}

export default function ConfigColores({ org, marca, paletaMarca, onGuardar, onCerrar }) {
  const [elegidos, setElegidos] = useState(() => {
    const base = {}
    for (const c of COLORES_LEYENDA) base[c.key] = org?.colores?.[c.key] || c.porOmision
    return base
  })
  const [tonoMarca, setTonoMarca] = useState(marca)

  const cambiar = (key, valor) => setElegidos(e => ({ ...e, [key]: valor }))
  const alDeFabrica = key => cambiar(key, COLORES_LEYENDA.find(c => c.key === key).porOmision)
  const hayCambios = tonoMarca !== marca
    || COLORES_LEYENDA.some(c => elegidos[c.key] !== (org?.colores?.[c.key] || c.porOmision))

  /* Todo se pinta con lo que se está eligiendo AHORA, no con lo guardado: elegir un tono y no
     verlo hasta guardar convierte la decisión en prueba y error. La clase `og-colores` es la que
     hace que el modal vuelva a derivar relleno y texto desde estos valores en vez de heredar los
     que ya resolvió la página. */
  const estiloVivo = { '--og-marca': tonoMarca }
  for (const c of COLORES_LEYENDA) estiloVivo[c.var] = elegidos[c.key]

  const clasePorKey = {
    func: 'og-card-func',
    ext: 'og-card-ext',
    staff: 'og-card-staff',
    vacante: 'og-card-vacante',
  }

  return (
    <div className="pl-overlay" onClick={onCerrar}>
      <div className="pl-modal og-modal-colores og-colores" onClick={e => e.stopPropagation()} style={estiloVivo}>
        <CabeceraModal Icon={Palette} titulo="Configurar los colores del organigrama" onCerrar={onCerrar} />

        <div className="pl-modal-body">
          {/* DOS GRUPOS, y separarlos es la mitad de la explicación: uno dice QUÉ ES cada puesto
              —la leyenda, que se lee— y el otro es de quién es el dibujo —la marca, que se mira—.
              Estaban en dos controles distintos de la barra y nadie tenía por qué adivinar que
              eran cosas distintas; juntos y rotulados, la diferencia se cuenta sola. */}
          <div className="og-col-rot">La leyenda · qué es cada puesto</div>
          <p className="og-mandos-intro">
            En el organigrama <strong>el color dice de qué clase es el puesto</strong> y la
            etiqueta dice si está vacante: son dos preguntas y van por dos canales. Acá se cambia
            el tono de cada significado — no cuáles son ni qué pinta cada uno, que es lo que hace
            que la leyenda se pueda explicar.
          </p>

          <div className="og-col-lista">
            {COLORES_LEYENDA.map(c => (
              <div key={c.key} className="og-col-fila">
                <CuadroMuestra
                  clase={clasePorKey[c.key]}
                  nombre={c.label}
                  vacante={c.key === 'vacante'}
                  externo={c.key === 'ext'}
                />
                <div className="og-col-txt">
                  <strong>{c.label}</strong>
                  <small>{c.desc}</small>
                </div>
                <div className="og-col-acc">
                  <label className="og-col-pick" title={`Elegir el color de ${c.label}`}>
                    <span style={{ background: elegidos[c.key] }} />
                    <input
                      type="color"
                      value={elegidos[c.key]}
                      onChange={e => cambiar(c.key, e.target.value)}
                      aria-label={`Color de ${c.label}`}
                    />
                  </label>
                  {/* Solo cuando hay a qué volver: un botón de deshacer siempre visible enseña a
                      ignorar la fila donde vive. */}
                  {elegidos[c.key] !== c.porOmision && (
                    <button type="button" className="og-col-reset" onClick={() => alDeFabrica(c.key)} title="Volver al color de fábrica">
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* El quinto renglón, sin control. Contesta la pregunta en vez de dejarla abierta. */}
            <div className="og-col-fila og-col-fija">
              <CuadroMuestra clase="" nombre="Colaborador" />
              <div className="og-col-txt">
                <strong>Colaborador · en planilla</strong>
                <small>
                  Va en blanco y no se configura: son cuatro de cada cinco cuadros, y pintarlos
                  dejaría el organigrama entero de colores. El blanco es lo que hace resaltar a
                  los otros cuatro.
                </small>
              </div>
            </div>
          </div>

          <p className="og-col-pie">
            {/* Sin nombrar los tonos: son configurables, así que "sigue siendo teal" dejaría de
                ser cierto en cuanto alguien toque esta misma pantalla. */}
            <strong>Un puesto ocupado no cambia de color.</strong> Un staff con alguien adentro
            conserva su color de staff y un tercerizado el suyo: dejaron de estar vacantes, no
            dejaron de ser lo que son. Lo único que se va es la etiqueta.
          </p>

          {/* EL COLOR DE LA EMPRESA. Estaba en su propio botón de la barra y se mudó acá: son los
              dos juegos de color del organigrama y tenerlos en dos sitios distintos obligaba a
              descubrir por separado que existían. */}
          <div className="og-col-rot og-col-rot-sep">La marca · de quién es el dibujo</div>
          <p className="og-mandos-intro">
            Tiñe las <strong>superficies</strong>: la empresa y las píldoras de cada área. No toca
            los textos ni la leyenda de arriba — con una marca naranja los nombres de los cargos
            saldrían naranjas y el dibujo se volvería ilegible.
          </p>

          <div className="og-col-marca">
            {/* Las piezas de verdad del dibujo, no un cuadrito: el nodo de la empresa lleva el
                tono tal cual y la píldora de un área lo lleva aclarado. Mostrar una sola escondía
                la mitad de lo que el tono hace. */}
            <div className="og-col-marca-previa">
              <span className="og-col-empresa">{empresa.nombre}</span>
              <span className="og-unidad og-col-pildora">Recursos Humanos</span>
            </div>
            <div className="og-col-marca-elegir">
              <div className="og-marca-grid">
                {paletaMarca.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`og-marca-op${tonoMarca === c ? ' on' : ''}`}
                    style={{ background: c }}
                    onClick={() => setTonoMarca(c)}
                    title={c}
                  />
                ))}
              </div>
              <label className="og-marca-libre">
                El de tu marca
                <input type="color" value={tonoMarca} onChange={e => setTonoMarca(e.target.value)} />
              </label>
            </div>
          </div>
        </div>

        <div className="pl-modal-footer">
          <button className="pl-btn-cancel" onClick={onCerrar}>Cancelar</button>
          <button
            className="pl-btn-save"
            onClick={() => onGuardar({ colores: elegidos, marca: tonoMarca })}
            disabled={!hayCambios}
          >
            Guardar colores
          </button>
        </div>
      </div>
    </div>
  )
}
