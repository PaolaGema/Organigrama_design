import { createContext, useContext, useState } from 'react'

/* EL CARGO NO ES EL ROL, y aquí conviven los dos porque son dos cosas distintas: el CARGO es el
   trabajo que la persona hace —«Gerente de Recursos Humanos»— y el ROL es lo que su cuenta puede
   hacer en el sistema —«Administrador HR»—. Se veían mezclados en el perfil, que enseñaba el rol
   en el lugar del cargo.

   `cargo` es solo el RESPALDO de los perfiles de la demo que no están en el directorio. Cuando la
   persona ocupa un cuadro del organigrama manda el organigrama, igual que en el resto de las
   pantallas: el cargo se decide dibujando la estructura, no escribiéndolo en una ficha. */
const users = [
  { id: 1, name: 'Juan Pérez Gómez', role: 'admin', roleLabel: 'Administrador HR', cargo: 'Gerente de Recursos Humanos', initials: 'JP', color: '#0C2D40', onbNA: true },
  { id: 2, name: 'María López Torres', role: 'colaborador', roleLabel: 'Colaboradora Web — Ventas', cargo: 'Ejecutiva Comercial', initials: 'ML', color: '#7c3aed' },
  { id: 3, name: 'Ana Martínez Ruiz', role: 'manager', roleLabel: 'Líder de Área — Marketing', cargo: 'Líder de Marketing', initials: 'AM', color: '#c026d3', area: 'Marketing', onbNA: true },
  // `mobile` decide si la app se dibuja dentro del marco de teléfono. Es una bandera y no
  // un id fijo porque ya son varios los perfiles que se demuestran en celular.
  { id: 4, name: 'Carlos Mendoza Ríos', role: 'colaborador', roleLabel: 'Colaborador Mobile — Tecnología', cargo: 'Desarrollador Frontend', initials: 'CM', color: '#f59e0b', mobile: true },
  { id: 5, name: 'Nicolás Zapata Silva', role: 'colaborador', roleLabel: 'Ejecutivo Senior — Ventas', cargo: 'Ejecutivo Senior', initials: 'NZ', color: '#84cc16', onbGraduado: true },
  /* `sucursalIds` es el ALCANCE: qué sedes puede ver esta persona. Ausente o vacío = todas, que
     es el caso de la mayoría; enumerar las ocho en cada usuario sería inventar trabajo y dejaría
     fuera la novena el día que se abra.

     Laura lo tiene acotado a La Paz a propósito, para poder demostrar el caso: alguien de un
     área Y de una sede. A ella el selector de sucursal ni le aparece —no hay nada que elegir— y
     todo lo que registre nace en La Paz. Es lo que verá un jefe de sucursal en producción. */
  { id: 6, name: 'Laura Díaz Romero', role: 'auxiliar', roleLabel: 'Auxiliar — Marketing', cargo: 'Analista de Marketing', initials: 'LD', color: '#14b8a6', area: 'Marketing', sucursalIds: ['lpz'], delegadoPor: 'Ana Martínez Ruiz' },
  // OJO devs: aquí "buddy" es un rol solo para poder simularlo en el prototipo. En el
  // modelo real es una relación (una asignación de onboarding apunta a su buddy), no un
  // permiso: Diego sigue siendo Colaborador y puede acompañar a varias personas a la vez.
  { id: 7, name: 'Diego Morales', role: 'buddy', roleLabel: 'Buddy — Tecnología', cargo: 'Desarrollador Backend', initials: 'DM', color: '#3b82f6', onbGraduado: true },
  // Es la misma Ana del id 3, en celular. Se repite la persona en vez de inventar otro líder
  // porque cada área ya tiene su cabeza definida en el organigrama y en el directorio:
  // agregar un jefe de Tecnología, por ejemplo, contradiría la vacante que ahí se muestra.
  { id: 8, name: 'Ana Martínez Ruiz', role: 'manager', roleLabel: 'Líder de Área Mobile — Marketing', cargo: 'Líder de Marketing', initials: 'AM', color: '#c026d3', area: 'Marketing', mobile: true, onbNA: true },
  // El mismo Diego del id 7, en celular: acompañar es trabajo de pasillo — se hace desde el
  // teléfono, entre una reunión y otra — así que el buddy necesita su propia demo móvil.
  // Va graduado porque solo puede ser buddy quien ya pasó por su propio onboarding.
  { id: 9, name: 'Diego Morales', role: 'buddy', roleLabel: 'Buddy Mobile — Tecnología', cargo: 'Desarrollador Backend', initials: 'DM', color: '#3b82f6', mobile: true, onbGraduado: true },
]

const UserContext = createContext()

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(users[0])
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, users }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
