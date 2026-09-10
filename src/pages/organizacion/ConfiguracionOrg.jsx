import { Fragment, useMemo } from 'react'
import {
  ChevronRight, Info, ToggleRight,
} from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import {
  tipoDe, estaEncendido, nivelesEnCadena, nivelesDeCatalogo, hayApagados, encenderTodos, EJES,
} from '../../data/estructuraData'
import { TIPOS_CARGO } from '../../data/organigramaData'

/* LOS NIVELES DE LA ORGANIZACIÓN, EN CONFIGURACIÓN Y NO EN LA PANTALLA DE TODOS LOS DÍAS.
   Estaban plegados al tope de Estructura y ahí estorbaban: encender un nivel es una DECISIÓN
   —se toma una vez, al montar la empresa, y casi nunca se vuelve— mientras que crear un nodo es
   un DATO, que se carga y se corrige seguido. Puestas juntas, la pantalla obligaba a decidir la
   forma de la organización mientras uno intentaba dar de alta una sucursal.

   Y AHORA LA LISTA ES DE LA EMPRESA, NO NUESTRA. Antes eran ocho escalones con nuestros nombres
   y un interruptor cada uno: la única forma de discrepar era apagar. Eso alcanza mientras la
   empresa se parezca a la que imaginamos y se rompe con la primera que no —el colegio con sedes,
   el banco con agencias, la constructora con obras—, porque meter las sedes dentro de un nivel
   que dice «Sucursal» funciona en el árbol y deja la pantalla mintiendo en cada formulario.

   Así que los peldaños se renombran, se mueven y se agregan. Los tres verbos viven en el modelo
   —con sus reglas— y esta pantalla es la que los ofrece.

   NO HAY PERFILES PREARMADOS. Hubo un "Simple / Multisede / Corporativo" y se sacó: eran una
   respuesta a una pregunta que nadie hizo. Cada empresa sabe cómo se llama lo suyo mucho mejor
   que nosotros, y tres botones que arman todo de golpe invitan a aceptar un molde en vez de
   mirar los escalones y decidir.

   LA CADENA DE ARRIBA ES LO QUE HACE ENTENDIBLE LA PANTALLA. Ocho interruptores sueltos no
   dicen qué se está armando; la cadena sí, y se rehace en el momento: encender Región la mete
   entre la unidad de negocio y la sucursal, renombrar Sucursal la renombra ahí también. La
   consecuencia se ve antes de ir a buscarla al árbol. */

export default function ConfiguracionOrg() {
  const { organigrama: org, nodos, nivelesEstructura: niveles, setNivelesEstructura: setNiveles } = useOnboardingData()
  /* SE FUERON LOS DOS ESTADOS que sostenían el renombrado y el alta de un peldaño propio, y con
     ellos el aviso: era la respuesta a un movimiento que el árbol no aguantaba, y ya no se mueve
     nada. Queda un solo control en esta pantalla —el interruptor— y ningún estado que llevarle. */

  /* Cuántos nodos usa cada nivel. Es lo que traba el interruptor y el borrado: apagar o borrar un
     nivel con nodos dentro los dejaría huérfanos y sin pantalla donde verlos. */
  const enUso = useMemo(() => {
    const c = {}
    nodos.forEach(n => { c[n.tipo] = (c[n.tipo] || 0) + 1 })
    return c
  }, [nodos])

  /* LOS QUE DE VERDAD CUELGAN UNO DEL OTRO. La línea de negocio se enseña abajo con los demás
     niveles, pero no en la cadena: no cuelga de nada y nada cuelga de ella. */
  const cadena = nivelesEnCadena(niveles)

  /* LOS ESCALONES, REPARTIDOS EN LOS MISMOS TRES GRUPOS QUE EL MENÚ.
     Eran una lista corrida de siete y había que leerlos uno por uno para descubrir que la Región y
     la Sucursal son la misma clase de cosa, y la Unidad organizacional otra. Esa división ya
     existe: es la del menú de la izquierda —Estructura de negocio, física y organizacional— y es la
     que la persona ya aprendió antes de llegar acá. Repetirla es gratis y ahorra la lectura.

     LA EMPRESA VA SUELTA ARRIBA, sin grupo. No pertenece a ningún eje —es la raíz de los tres— y
     meterla en uno la haría parecer parte de él.

     EL NÚMERO SIGUE SIENDO GLOBAL, del 1 al 7. Es la escalera completa: reiniciar la cuenta en cada
     grupo diría que hay tres escaleras y hay una sola. */
  const grupos = useMemo(() => {
    const todos = nivelesDeCatalogo(niveles).map((t, i) => ({ ...t, n: i + 1 }))
    const raiz = todos.filter(t => !t.eje)
    return [
      { key: null, label: null, tipos: raiz },
      ...['fisica', 'organizacional']
        .map(eje => ({ key: eje, label: EJES[eje].label, tipos: todos.filter(t => t.eje === eje) }))
        .filter(g => g.tipos.length),
    ].filter(g => g.tipos.length)
  }, [niveles])

  /* SE TRABA PARA APAGAR, NO PARA ENCENDER. Tener nodos dentro es razón para no poder apagar un
     nivel —quedarían colgando de un escalón que dejó de existir—, pero jamás para no poder
     encenderlo: justamente ahí es donde hay que encenderlo. */
  function alternar(key) {
    const t = tipoDe(key, niveles)
    if (!t || t.fijo) return
    const on = estaEncendido(key, niveles)
    if (on && enUso[key]) return
    setNiveles(prev => prev.map(x => (x.key === key ? { ...x, on: !on } : x)))
  }

  /* AQUÍ VIVÍAN RENOMBRAR, MOVER, BORRAR Y CREAR, y se fueron con sus botones. La más difícil de
     soltar fue `mover`: no prohibía por las dudas, simulaba el cambio y, si rompía algo, decía QUÉ
     nodo quedaba colgando en vez de un «no se puede» a secas. Era buena, y sostenía una función que
     ya no está.

     Las funciones del modelo —`renombrarNivel`, `moverNivel`, `agregarNivel`, `quitarNivel`,
     `nodoQueRompe`— siguen ahí, probadas y sin usar. El día que la escalera vuelva a editarse, esto
     es enchufarlas de nuevo, no escribirlas. */

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Configuración de la organización</h1>
          <p className="pl-subtitle">
            Cuáles de los escalones usa tu empresa. Lo que apagues no aparece en ningún formulario,
            filtro ni menú.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {/* Volver al arranque —todos encendidos— sin tener que pulsar interruptor por
              interruptor. Solo aparece si hay alguno apagado: un botón que no cambiaría nada es
              un botón que hace dudar de si hizo algo. */}
          {hayApagados(niveles) && (
            <button className="pl-btn-cancel" onClick={() => setNiveles(encenderTodos(niveles))}>
              <ToggleRight size={14} /> Encender todos
            </button>
          )}
          {/* AQUÍ HABÍA UN «Ver la estructura» y se fue. Llevaba a la pantalla que está a dos
              renglones de distancia en el menú de la izquierda, siempre visible: un atajo hacia algo
              que nunca dejó de estar a la vista no ahorra un clic, ocupa el sitio donde el ojo busca
              la acción de esta pantalla. La que queda —«Encender todos»— sí hace algo que solo se
              puede hacer acá. */}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180 }}>

        {/* LA CADENA RESULTANTE. Se rehace con cada cambio, y es la única forma de ver de una lo
            que se está armando: dónde entra el nivel nuevo y qué queda encima y debajo. */}
        <section className="cfg-card">
          <h2 className="cfg-tit">Así queda tu organización</h2>
          <p className="cfg-desc">
            De la empresa al cargo, con los escalones que tienes encendidos y con tus nombres.
            Cualquiera se puede saltar al cargar un dato: lo que no tenga un escalón intermedio
            cuelga directamente del de más arriba.
          </p>
          <div className="cfg-cadena">
            {cadena.map((t, i) => (
              <span key={t.key} className="cfg-eslabon-caja">
                {i > 0 && <ChevronRight size={13} className="cfg-flecha" />}
                {/* Un nivel propio no tiene color escrito para su llave, así que toma el de su
                    eje: verde si es un lugar, azul si es una división del trabajo. Es la misma
                    clave de color del árbol y no hay que aprenderla dos veces. */}
                <span className={`cfg-eslabon e-${t.propio ? t.eje : t.key}`}>{t.label}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="cfg-card">
          <h2 className="cfg-tit">Niveles de la organización</h2>
          <p className="cfg-desc">
            En orden, del más grande al más chico: cada uno cuelga del anterior. Enciende los que
            uses y apaga los que no.
          </p>


          <div className="cfg-niveles">
            {grupos.map(g => (
              <Fragment key={g.key || 'raiz'}>
                {g.label && <h3 className="cfg-grupo-eje">{g.label}</h3>}
                {g.tipos.map(t => {
              const on = estaEncendido(t.key, niveles)
              const usados = enUso[t.key] || 0
              const trabado = t.fijo || (on && usados > 0)


              return (
                <div key={t.key} className={`cfg-nivel${on ? ' on' : ' off'}${trabado ? ' trabado' : ''}`}>
                  <span className="cfg-orden">{t.n}</span>
                  <button
                    className="cfg-sw"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${on ? 'Apagar' : 'Encender'} ${t.label}`}
                    disabled={trabado}
                    onClick={() => alternar(t.key)}
                  />

                    <div style={{ minWidth: 0 }}>
                      <div className="cfg-nivel-nombre">
                        {t.label}
                        {t.propio && <span className="cfg-pill">tuyo</span>}
                      </div>
                      <div className="cfg-nivel-desc">
                        {t.desc || (t.eje ? `Se administra en ${EJES[t.eje].label}.` : '')}
                      </div>
                      {!on && usados > 0 && (
                        <div className="cfg-nivel-sitio cfg-sitio-alerta">
                          Hay <b>{usados}</b> {usados === 1 ? 'nodo' : 'nodos'} de este tipo en el
                          árbol y el nivel está apagado: enciéndelo para que vuelvan a su sitio.
                        </div>
                      )}
                      {/* AQUÍ DECÍA «Cuelga de X · Puede contener Y» y se fue: es la lista, en orden,
                          la que ya lo dice. Cada renglón repetía el nombre del de arriba y el del de
                          abajo, o sea que los siete decían dos veces lo que la escalera enseña de un
                          vistazo, y en el grupo de al lado ya lo dibuja la cadena del principio. */}
                    </div>

                  <span className={`cfg-estado${!on && usados ? ' alerta' : ''}`}>
                    {t.fijo ? 'siempre'
                      : !on && usados ? `${usados} sin sitio`
                        : usados ? `${usados} en uso`
                          : on ? 'encendido' : 'apagado'}
                  </span>

                  {/* SIN BOTONES DE FILA. Había tres —renombrar, subir, bajar— y uno más para borrar
                      los peldaños propios. La escalera pasó a ser LO QUE ES: se enciende y se apaga,
                      y nada más. Renombrar, reordenar y crear peldaños propios eran las tres formas
                      de que la estructura de una empresa deje de parecerse a la de al lado, y cada
                      una traía su propia manera de romperla —un orden que deja nodos colgando de un
                      padre que quedó debajo, un nivel propio que nadie más entiende—.

                      El interruptor de la izquierda es todo el control que queda, y es el que
                      contesta la pregunta que trae a alguien acá: «esto que no uso, ¿lo puedo
                      sacar de mis formularios?». */}
                </div>
                  )
                })}
              </Fragment>
            ))}
          </div>

          {/* ══ AGREGAR UN PELDAÑO PROPIO ══
              Tres preguntas y ninguna de más. El nombre lo sabe de memoria quien viene a crearlo;
              dónde va se pregunta como «debajo de X», que es como se piensa; y el eje es la única
              que hay que traducir, porque «física / organizacional» es vocabulario nuestro y
              «un lugar / una parte de la organización» es la misma pregunta en el idioma de
              cualquiera. La descripción es opcional a propósito: es una ayuda para el que venga
              después, no un requisito para el que está creando. */}
          {/* AQUÍ ESTABA EL FORMULARIO DE «UN NIVEL MÁS» y se fue con su botón. Dejaba inventar un
              peldaño propio —nombre, plural, en qué posición entra y a qué eje pertenece— y era la
              parte más ambiciosa de esta pantalla: la que prometía que una minera pudiera tener
              «Faena» donde otros tienen «Sucursal».

              Se quita porque la promesa era más grande que lo que hay detrás: un peldaño propio
              necesita su pantalla, su ficha, sus reglas de qué puede colgar de él y su sitio en el
              organigrama, y nada de eso se inventa desde un formulario de cuatro campos. Mejor no
              ofrecerlo que ofrecerlo a medias.

              La lista de arriba quedó siendo lo que de verdad sostiene: los ocho escalones que
              vienen, encendidos o apagados. */}
        </section>

        {/* ══ LOS CATÁLOGOS QUE CLASIFICAN UN CARGO ══
            No son nodos del árbol —no cuelgan de nada— pero son la otra mitad de "cómo se
            organiza el trabajo", y por eso viven acá y se llegan desde Estructura organizacional.
            Los dos ya EXISTÍAN en el modelo; lo que no existía era un sitio evidente donde
            encontrarlos: los niveles de mando se editaban desde el menú de exportar del
            organigrama, que es el último lugar donde alguien los buscaría. */}

        <section className="cfg-card" id="tipos">
          <h2 className="cfg-tit">Tipos de cargo</h2>
          <p className="cfg-desc">
            De qué clase es un puesto. Es del puesto y no de su lugar en el árbol, así que se
            declara.
          </p>
          <div className="cfg-catalogo">
            {TIPOS_CARGO.map(t => (
              <div key={t.key} className="cfg-item">
                <span className="cfg-item-nombre">{t.label}</span>
                <span className="cfg-item-desc">{t.desc}</span>
                {/* «1 cargo» y no «1 cargos». Con la demo cargada el staff es exactamente uno, así
                    que la falta de concordancia se lee siempre, no en un caso raro. */}
                <span className="cfg-item-marca">
                  {(() => {
                    const n = org.cargos.filter(c => (c.tipo || 'colaborador') === t.key).length
                    return `${n} ${n === 1 ? 'cargo' : 'cargos'}`
                  })()}
                </span>
              </div>
            ))}
            {/* JEFE NO ESTÁ, Y ES A PROPÓSITO. En el organigrama de TECNOSOL figura como un
                tipo más, con su cuenta de 15; acá se calcula. Está explicado abajo porque es
                la ausencia más llamativa de esta lista. */}
            <div className="cfg-item cfg-item-deducido">
              {/* «JEFE / LÍDER» Y NO «JEFE» A SECAS. La palabra que una empresa usa para esto no es
                  una sola: hay quien tiene jefes y quien tiene líderes, y en la misma casa conviven
                  «Jefa de Planta» y «Líder de Marketing» —los dos están en los datos de ejemplo—.
                  Como este renglón no nombra un dato guardado sino una CONDICIÓN —tener gente
                  colgando— puede llevar las dos palabras sin ambigüedad: no hay ningún cargo que
                  vaya a decir «Jefe / Líder», es la lista la que describe qué se está contando. */}
              <span className="cfg-item-nombre">Jefe / Líder <span className="cfg-pill">deducido</span></span>
              <span className="cfg-item-desc">
                Tiene al menos un cargo colgando. No se declara: se lee del árbol, y por eso
                nunca queda viejo cuando alguien mueve a otro de lugar.
              </span>
              <span className="cfg-item-marca">
                {(() => {
                  const n = org.cargos.filter(c => org.cargos.some(x => x.reportaA === c.id)).length
                  return `${n} ${n === 1 ? 'cargo' : 'cargos'}`
                })()}
              </span>
            </div>
          </div>
        </section>

        {/* AQUÍ ESTABA LA TARJETA DE NIVELES DE MANDO Y SE MUDÓ, entera, a «Niveles de mando»
            —su propia entrada del menú, dentro de Estructura organizacional—. Estaba en los dos
            sitios y con dos caras distintas: acá una tarjeta que se leía de corrido, allá una
            tabla con cuatro botones por fila. Dos pantallas para el mismo catálogo de tres
            palabras, y ninguna forma de saber cuál mandaba.

            NO SE DEJÓ UN ATAJO EN SU LUGAR. El menú ya lleva a «Niveles de mando» y el eje lo
            enlaza desde su barra de catálogos: un tercer camino desde acá sería volver a tener
            dos puertas para lo mismo, que es de lo que se venía. */}

        <div className="cfg-nota">
          <Info size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <div>
            {/* LAS NOTAS SIGUEN A LO QUE LA PANTALLA HACE. Hablaban de renombrar y de mover, que
                eran las dos cosas que se podían hacer acá y ya no; una nota que explica un botón
                que no está es peor que ninguna, porque manda a buscarlo. */}
            <p>
              <strong>Empresa, unidad organizacional y cargo no se apagan.</strong> Sin ellos no hay
              organigrama que dibujar: la empresa es la raíz, la unidad es la primera división del
              trabajo y el cargo es la hoja.
            </p>
            <p>
              <strong>Un nivel con nodos dentro no se apaga.</strong> Quedarían colgando de un
              escalón que dejó de existir, así que el contador dice cuántos habría que mover antes.
              Al revés nunca se traba: tener cosas dentro jamás impide encender un nivel.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Encender o apagar no migra nada.</strong> Los nodos guardan la llave de su
              nivel, así que apagar uno los deja donde están —dejan de ofrecerse, no se borran— y
              encenderlo más adelante solo hace aparecer otra vez el escalón donde colgar cosas.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
