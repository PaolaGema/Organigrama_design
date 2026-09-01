import { useState } from 'react'
import { Palette, Pipette, User, Briefcase } from 'lucide-react'
import CabeceraModal from './CabeceraModal'
import AyudaCampo from './AyudaCampo'
import { COLORES_LEYENDA, empresa } from '../../data/organigramaData'

/* LOS COLORES DE LA LEYENDA, elegidos por la empresa.
   Lo que se cambia es QUÉ TONO tiene cada significado, nunca cuántos significados hay ni cuál
   pinta qué: eso último es la leyenda, y una leyenda que cada empresa redefine deja de poder
   explicarse. Cambiar el tono sí hace falta —por marca, y sobre todo por daltonismo: el teal
   del staff y el ámbar del vacante son justo el par que más se confunde—.

   EL MODAL VA PARTIDO EN DOS: los cinco tonos a la izquierda y un pedazo de organigrama a la
   derecha con los cinco conviviendo. Antes cada color traía su propio cuadrito de muestra y la
   marca tenía su previa aparte, así que se elegían cinco cosas que iban a compartir un dibujo
   sin verlas nunca juntas. Y elegir un violeta mirando un cuadrito violeta no dice nada: lo que
   hay que saber es si ese violeta se distingue del azul y del verde en el mismo dibujo.

   LAS RAZONES SE FUERON DETRÁS DEL "?". Eran tres párrafos para cinco controles —por qué el
   colaborador va en blanco, por qué un ocupado no cambia de tono, por qué la marca no tiñe los
   textos—. Son buenas y por eso siguen estando, pero donde alguien las busque. */

/* El cuadro de verdad, con los estilos del dibujo: un círculo de color no dice cómo va a quedar
   un borde punteado con su relleno detrás. Con `quien`, el cuadro sale ocupado. */
function CuadroMuestra({ clase, nombre, vacante, externo, quien }) {
  return (
    <div className={`og-col-muestra og-card ${clase}`}>
      {vacante && <span className="og-card-tag">Vacante</span>}
      <div className="og-card-title">
        {externo ? <Briefcase size={11} className="og-card-ico" /> : <User size={11} className="og-card-ico" />}
        <span>{nombre}</span>
      </div>
      <div className={`og-chip${quien ? '' : ' og-chip-vacio'}`}>
        {quien || (externo ? 'Sin prestador' : 'Sin colaborador')}
      </div>
    </div>
  )
}

const CLASE = {
  func: 'og-card-func',
  ext: 'og-card-ext',
  staff: 'og-card-staff',
  vacante: 'og-card-vacante',
}

export default function ConfigColores({ org, marca, paletaMarca, onGuardar, onCerrar }) {
  const [elegidos, setElegidos] = useState(() => {
    const base = {}
    for (const c of COLORES_LEYENDA) base[c.key] = org?.colores?.[c.key] || c.porOmision
    return base
  })
  const [tonoMarca, setTonoMarca] = useState(marca)

  const cambiar = (key, valor) => setElegidos(e => ({ ...e, [key]: valor }))
  const hayCambios = tonoMarca !== marca
    || COLORES_LEYENDA.some(c => elegidos[c.key] !== (org?.colores?.[c.key] || c.porOmision))

  /* Todo se pinta con lo que se está eligiendo AHORA, no con lo guardado: elegir un tono y no
     verlo hasta guardar convierte la decisión en prueba y error. La clase `og-colores` es la que
     hace que el modal vuelva a derivar relleno y texto desde estos valores en vez de heredar los
     que ya resolvió la página. */
  const estiloVivo = { '--og-marca': tonoMarca }
  for (const c of COLORES_LEYENDA) estiloVivo[c.var] = elegidos[c.key]

  return (
    <div className="pl-overlay" onClick={onCerrar}>
      <div className="pl-modal og-modal-colores og-colores" onClick={e => e.stopPropagation()} style={estiloVivo}>
        <CabeceraModal Icon={Palette} titulo="Colores del organigrama" onCerrar={onCerrar} />

        <div className="og-colores-cuerpo">
          <div className="og-colores-editar">
            {/* DOS GRUPOS, y separarlos es la mitad de la explicación: uno dice QUÉ ES cada
                puesto —la leyenda, que se lee— y el otro de quién es el dibujo —la marca, que se
                mira—. Estaban en dos botones distintos de la barra y nadie tenía por qué adivinar
                que eran cosas distintas. */}
            <p className="og-colores-rot">
              El color dice qué clase de puesto es
              <AyudaCampo>
                El <strong>color</strong> dice de qué clase es el puesto y la <strong>etiqueta</strong>
                {' '}dice si está vacante: son dos preguntas y van por dos canales. Aquí se cambia el
                tono de cada significado, no cuáles son ni qué pinta cada uno — eso es lo que hace
                que la leyenda se pueda explicar.
                <br /><br />
                Un puesto ocupado <strong>no cambia de color</strong>: un staff con alguien adentro
                conserva su color de staff. Dejó de estar vacante, no dejó de ser lo que es. Lo
                único que se va es la etiqueta.
              </AyudaCampo>
            </p>

            <div className="og-col-lista">
              {COLORES_LEYENDA.map(c => (
                <div key={c.key} className="og-col-fila">
                  <div className="og-col-txt">
                    <strong>{c.label}</strong>
                    <small>{c.desc}</small>
                  </div>
                  {/* Los tonos de esta clase, con el de fábrica primero. Antes acá vivía un botón
                      de deshacer que solo aparecía si habías tocado algo: media fila vacía casi
                      siempre, y un control que se materializa donde no había nada. Con los tonos
                      a la vista se elige de un toque y volver al de fábrica es el primero. */}
                  <div className="og-col-tonos">
                    {c.tonos.map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`og-col-tono${elegidos[c.key] === t ? ' on' : ''}`}
                        style={{ background: t }}
                        onClick={() => cambiar(c.key, t)}
                        title={t === c.porOmision ? 'El de fábrica' : t}
                        aria-label={`Pintar ${c.label} de ${t}`}
                      />
                    ))}
                  </div>
                  {/* La salida, para el que tiene un color de marca que no está entre los cinco.
                      Solo muestra un tono cuando ese tono NO es ninguno de los cinco: si no,
                      repetía al lado del disco ya elegido el mismo color, y dos manchas iguales
                      pegadas se leen como que una de las dos no hace nada. */}
                  <label className="og-col-pick" title={`Otro color para ${c.label}`}>
                    {c.tonos.includes(elegidos[c.key])
                      ? <span className="og-col-otro"><Pipette size={12} /></span>
                      : <span style={{ background: elegidos[c.key] }} />}
                    <input
                      type="color"
                      value={elegidos[c.key]}
                      onChange={e => cambiar(c.key, e.target.value)}
                      aria-label={`Otro color para ${c.label}`}
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* EL COLOR DE LA EMPRESA. Estaba en su propio botón de la barra y se mudó acá: son
                los dos juegos de color del organigrama y tenerlos en dos sitios distintos obligaba
                a descubrir por separado que existían. */}
            <p className="og-colores-rot og-colores-rot-sep">
              El color de tu empresa
              <AyudaCampo>
                Tiñe las <strong>superficies</strong>: la caja de la organización y la píldora de
                cada área. No toca los textos ni los colores de arriba — con una marca naranja los
                nombres de los cargos saldrían naranjas y el dibujo se volvería ilegible.
              </AyudaCampo>
            </p>
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

          {/* LO QUE RESULTA. Un pedazo de organigrama con los cinco significados a la vez, más las
              dos superficies que tiñe la marca. El COLABORADOR vive acá y no en la lista: no se
              puede configurar, y una fila apagada entre cuatro que responden se lee como un
              control roto. Dibujado, en cambio, contesta la pregunta sin decir una palabra —se ve
              que es blanco y se ve por qué: es el fondo contra el que resaltan los otros—.
              Y el staff sale OCUPADO a propósito: ahí se ve que un puesto con alguien adentro
              conserva su color, que era el otro párrafo que había que leer. */}
          <div className="og-colores-previa">
            <p className="og-colores-rot">Cómo va a verse</p>
            <span className="og-col-empresa">{empresa.nombre}</span>
            <div className="og-colores-hilo" />
            <span className="og-unidad og-col-pildora">Recursos Humanos</span>
            <div className="og-colores-hilo" />
            <CuadroMuestra clase="" nombre="Jefe de RRHH" quien="Paola Arce" />
            <div className="og-colores-hilo" />
            {/* Los cuatro de abajo van en el MISMO orden que los cuatro renglones de la
                izquierda: tocar el tercero y ver cambiar el tercero es lo que hace que no haga
                falta buscar cuál se movió. */}
            <div className="og-colores-cuadros">
              <CuadroMuestra clase={CLASE.func} nombre="Diseñadora" quien="Ana Martínez" />
              <CuadroMuestra clase={CLASE.ext} nombre="Limpieza" externo />
              <CuadroMuestra clase={CLASE.staff} nombre="Asistente" quien="Lorena Aguirre" />
              <CuadroMuestra clase={CLASE.vacante} nombre="Reclutadora" vacante />
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
