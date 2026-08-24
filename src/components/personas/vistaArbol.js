import { useCallback, useState } from 'react'

/* Cómo estoy mirando el árbol ahora mismo: qué ramas están plegadas y qué cuadros muestran su
   gente. Nada de esto es dato de la empresa —no se guarda, no se exporta, y cada vista lleva
   lo suyo— así que vive fuera del dibujo, en el contenedor, y baja por props.

   Fuera de `OrgNodos` porque ahí convivían con los componentes y eso rompe el refresco en
   caliente: al tocar el archivo, Vite recarga la página entera en vez de la pieza. */

/* Qué cuadros tienen su gente desplegada. Como el pliegue, es estado de VISTA: no se guarda ni
   sale en la exportación, porque no dice nada sobre la empresa sino sobre lo que estoy mirando
   ahora. */
export function useDesglose() {
  const [abiertos, setAbiertos] = useState(() => new Set())

  const alternar = useCallback(id => setAbiertos(previos => {
    const siguiente = new Set(previos)
    if (!siguiente.delete(id)) siguiente.add(id)
    return siguiente
  }), [])

  const cerrarTodo = useCallback(() => setAbiertos(new Set()), [])

  return { abiertos, alternar, cerrarTodo }
}

/* Qué ramas están plegadas. Lo tiene el contenedor y baja por `pliegue` hasta cada rama. No se
   guarda en el dato ni en el almacenamiento: plegar es cómo estoy mirando esto ahora, no cómo
   es la empresa. */
export function usePliegue() {
  const [plegados, setPlegados] = useState(() => new Set())

  const alternar = useCallback(id => setPlegados(previos => {
    const siguiente = new Set(previos)
    if (!siguiente.delete(id)) siguiente.add(id)
    return siguiente
  }), [])

  const abrirTodo = useCallback(() => setPlegados(new Set()), [])

  return { plegados, alternar, abrirTodo }
}
