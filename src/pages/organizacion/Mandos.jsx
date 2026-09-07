import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { nivelesDe } from '../../data/organigramaData'
import ConfigMandos from '../../components/personas/ConfigMandos'

/* LOS NIVELES DE MANDO, EN SU PROPIA PANTALLA Y CON UNA SOLA CARA.
   Llegaron a estar en dos sitios con dos formas distintas: acá una TABLA con su columna de orden y
   cuatro botones por fila, y en Configuración una TARJETA que los lee de corrido, numerados, con
   la cuenta de cargos al costado y un solo «Editar». Dos pantallas para el mismo catálogo de tres
   palabras, y cada una enseñándolo distinto.

   GANÓ LA TARJETA, y no por gusto: un nivel de mando no se administra, se MIRA. Son tres o cuatro
   peldaños que se definen una vez y casi no se tocan, así que lo que uno viene a hacer acá es leer
   la escalera —quién manda más que quién— y muy de vez en cuando corregirla. La tabla ponía cuatro
   botones en cada fila para una acción que se usa una vez al año, y encima repartía el reordenar
   —dos flechas por fila— cuando el editor ya sabe hacerlo arrastrando.

   EL EDITOR ES EL MISMO DE SIEMPRE (`ConfigMandos`): reordena arrastrando, valida los nombres
   repetidos y avisa a cuántos cargos deja sin nivel antes de borrar un peldaño. No se reescribió
   nada; se quitó la segunda puerta.

   VIENEN TRES DE FÁBRICA —Mando superior, medio y bajo— y ahí termina nuestra opinión: cada
   empresa los renombra, los reordena y agrega los que le falten. Por eso son un DATO
   (`org.niveles`) y no una lista escrita en el código.

   EL NÚMERO NO SE GUARDA: es la posición en la lista. Intercalar «Jefatura» entre el primero y el
   segundo renumera todo solo sin tocar un solo cargo — lo que el cargo guarda es el ID del
   peldaño, nunca su número ni su nombre. Renombrar no desengancha nada. */

export default function Mandos() {
  const { organigrama: org, setOrganigrama, nodos } = useOnboardingData()
  const lista = nivelesDe(org)
  const [editando, setEditando] = useState(false)

  /* CUENTA LOS DOS MODELOS. Los cargos del dibujo guardan su peldaño en `grado`; los del árbol
     nuevo, en `nivelMando`. Mientras convivan, un contador que mire solo a uno enseña un cero
     tranquilizador sobre un peldaño que sí se está usando. Esta cuenta es la que la tarjeta de
     Configuración NO hacía —miraba solo `grado`— y es la razón de que allá se leyeran tres ceros
     con la demo cargada. */
  const cuantosUsan = id =>
    org.cargos.filter(c => c.grado === id).length
    + nodos.filter(n => n.tipo === 'cargo' && n.nivelMando === id).length

  return (
    <div className="content-scroll">
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Niveles de mando</h1>
          <p className="pl-subtitle">
            La escalera de autoridad de la empresa. Cada cargo se coloca en uno, y de ahí sale su
            altura en el organigrama.
          </p>
        </div>
        {/* EL BOTÓN VA DONDE VAN TODOS: arriba a la derecha del encabezado, con la misma clase y el
            mismo lápiz verde que «Editar sucursal». Estaba dentro de la tarjeta y con la clase de
            «Cancelar» —el botón secundario de los modales—, así que la acción principal de la
            pantalla se veía más apagada que cualquier «Nueva unidad» de al lado y encima aparecía
            en un sitio donde ninguna otra pantalla pone nada.

            Uniformar esto no es prolijidad: la esquina de arriba a la derecha es donde la mano ya
            va sola después de haber entrado a Unidades, a Cargos y a Sucursales. */}
        <button className="pl-btn-new" style={{ marginLeft: 'auto' }} onClick={() => setEditando(true)}>
          <Pencil size={14} color="#00E091" /> Editar los niveles
        </button>
      </div>

      <section className="cfg-card" style={{ maxWidth: 1180 }}>
        <h2 className="cfg-tit">Los peldaños</h2>
        <p className="cfg-desc">
          De arriba abajo: el 1 es el que más manda. Se pueden renombrar, reordenar y agregar: no
          son tres fijos.
        </p>

        <div className="cfg-catalogo">
          {lista.map((n, i) => {
            const usan = cuantosUsan(n.id)
            return (
              <div key={n.id} className="cfg-item">
                <span className="cfg-item-nombre">
                  <span className="cfg-mando-n">{i + 1}</span> {n.nombre}
                </span>
                {/* La descripción sale de la POSICIÓN y no se guarda: el más alto y el más bajo se
                    saben por dónde están, y decirlo en cada peldaño sería un dato que se
                    contradice solo en cuanto alguien reordena. */}
                <span className="cfg-item-desc">
                  {i === 0 ? 'El más alto de la escala.'
                    : i === lista.length - 1 ? 'El más bajo de la escala.'
                      : 'Un peldaño intermedio.'}
                </span>
                {/* Cuántos cargos cuelgan de este peldaño. Es lo que convierte «eliminar» en una
                    decisión informada en vez de una sorpresa. */}
                <span className="cfg-item-marca">
                  {usan} {usan === 1 ? 'cargo' : 'cargos'}
                </span>
              </div>
            )
          })}
        </div>

        <p className="cfg-pie">
          Un cargo guarda la llave de su peldaño, no su nombre ni su número: renombrarlos o
          reordenarlos no desengancha a nadie.
        </p>
      </section>

      {editando && (
        <ConfigMandos
          org={org}
          onCerrar={() => setEditando(false)}
          onGuardar={niveles => {
            setOrganigrama(prev => ({ ...prev, niveles }))
            setEditando(false)
          }}
        />
      )}
    </div>
  )
}
