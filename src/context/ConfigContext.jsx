import { createContext, useContext } from 'react'
import { useOnboardingData } from './OnboardingDataContext'

const ConfigContext = createContext()

export function ConfigProvider({ children }) {
  const { configToggles, setConfigToggles } = useOnboardingData()

  const gamificacion = configToggles.gamificacion
  const asistenteIA = configToggles.buddy
  /* DÓNDE VIVEN LA CUENTA, LA SUCURSAL Y LOS AVISOS: en el riel (por defecto) o en una barra
     superior. Es un interruptor de presentación, no de producto —está para poder enseñar las dos
     propuestas al equipo sin recompilar— y por eso vive con el resto de los conmutadores de la
     demo, compartido, y no en un `useLocalStorage` suelto en cada pantalla: dos copias del mismo
     valor se desincronizan en cuanto una de las dos lo cambia. */
  /* EL ENCABEZADO YA NO ES UNA VARIANTE. Hubo dos propuestas de ventana —todo en el riel, o con
     una barra superior— y un conmutador para enseñarlas una al lado de la otra. Elegida la de la
     barra, el conmutador dejó de ser una comparación y pasó a ser una forma de romperla. */

  function setGamificacion(val) {
    setConfigToggles(prev => ({ ...prev, gamificacion: val }))
  }
  function setAsistenteIA(val) {
    setConfigToggles(prev => ({ ...prev, buddy: val }))
  }

  return (
    <ConfigContext.Provider value={{ gamificacion, setGamificacion, asistenteIA, setAsistenteIA }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}
