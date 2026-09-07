/* EL PAÍS ES DE LA EMPRESA, Y LAS CIUDADES SALEN DE ÉL.
   La lista de ciudades estaba escrita a mano con las capitales de Bolivia dentro del catálogo de
   la estructura. Eso convierte un producto que se vende a cualquier país en uno que solo sirve
   acá: una empresa peruana abría el desplegable de ciudad y tenía que elegir entre Oruro y
   Potosí, o escribir la suya en «Otra» y perder para siempre la posibilidad de agrupar.

   Se pregunta UNA VEZ, en Datos de la empresa, y de ahí sale todo lo demás. No se pregunta por
   nodo —una empresa opera en un país y sus regionales están dentro— y no se deduce del idioma ni
   de la zona horaria del navegador, que aciertan a medias y fallan en silencio.

   LO QUE NO ESTÁ, SE ESCRIBE. Estos son los países donde el producto se vende hoy, con sus
   ciudades principales. Para cualquier otro país el campo de ciudad pasa a ser texto libre en
   vez de una lista que no lo contiene: es peor una lista cerrada equivocada que ninguna. Sumar
   un país es agregar una entrada acá abajo. */

export const PAISES = [
  {
    codigo: 'BO', nombre: 'Bolivia',
    ciudades: [
      'Santa Cruz de la Sierra', 'La Paz', 'El Alto', 'Cochabamba', 'Sucre', 'Oruro',
      'Potosí', 'Tarija', 'Trinidad', 'Cobija', 'Montero', 'Quillacollo', 'Sacaba',
      'Yacuiba', 'Riberalta', 'Warnes', 'La Guardia', 'Viacha', 'Camiri', 'Villazón',
    ],
  },
  {
    codigo: 'PE', nombre: 'Perú',
    ciudades: [
      'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Huancayo', 'Iquitos',
      'Tacna', 'Chimbote', 'Juliaca', 'Ica', 'Pucallpa', 'Cajamarca', 'Ayacucho', 'Callao',
    ],
  },
  {
    codigo: 'CL', nombre: 'Chile',
    ciudades: [
      'Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Viña del Mar', 'La Serena',
      'Temuco', 'Rancagua', 'Iquique', 'Puerto Montt', 'Talca', 'Arica', 'Chillán', 'Calama',
    ],
  },
  {
    codigo: 'AR', nombre: 'Argentina',
    ciudades: [
      'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán',
      'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Neuquén',
      'Bahía Blanca', 'Corrientes', 'Posadas', 'Paraná',
    ],
  },
  {
    codigo: 'CO', nombre: 'Colombia',
    ciudades: [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga',
      'Pereira', 'Santa Marta', 'Ibagué', 'Manizales', 'Villavicencio', 'Pasto', 'Neiva',
    ],
  },
  {
    codigo: 'EC', nombre: 'Ecuador',
    ciudades: [
      'Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Manta', 'Portoviejo',
      'Ambato', 'Riobamba', 'Loja', 'Esmeraldas', 'Ibarra',
    ],
  },
  {
    codigo: 'PY', nombre: 'Paraguay',
    ciudades: [
      'Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré',
      'Fernando de la Mora', 'Encarnación', 'Pedro Juan Caballero', 'Coronel Oviedo',
    ],
  },
  {
    codigo: 'UY', nombre: 'Uruguay',
    ciudades: [
      'Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú', 'Las Piedras', 'Rivera',
      'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes',
    ],
  },
  {
    codigo: 'MX', nombre: 'México',
    ciudades: [
      'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León',
      'Ciudad Juárez', 'Zapopan', 'Mérida', 'Querétaro', 'San Luis Potosí', 'Aguascalientes',
      'Cancún', 'Culiacán', 'Toluca', 'Chihuahua',
    ],
  },
  {
    codigo: 'ES', nombre: 'España',
    ciudades: [
      'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia',
      'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo',
    ],
  },
  {
    codigo: 'CR', nombre: 'Costa Rica',
    ciudades: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Liberia', 'Puntarenas', 'Limón'],
  },
  {
    codigo: 'PA', nombre: 'Panamá',
    ciudades: ['Ciudad de Panamá', 'San Miguelito', 'Colón', 'David', 'La Chorrera', 'Santiago'],
  },
  {
    codigo: 'DO', nombre: 'República Dominicana',
    ciudades: ['Santo Domingo', 'Santiago de los Caballeros', 'La Romana', 'San Pedro de Macorís', 'Puerto Plata'],
  },
  {
    codigo: 'GT', nombre: 'Guatemala',
    ciudades: ['Ciudad de Guatemala', 'Mixco', 'Villa Nueva', 'Quetzaltenango', 'Escuintla'],
  },
  {
    codigo: 'US', nombre: 'Estados Unidos',
    ciudades: [
      'Nueva York', 'Los Ángeles', 'Chicago', 'Houston', 'Phoenix', 'Filadelfia',
      'San Antonio', 'San Diego', 'Dallas', 'Miami', 'Atlanta', 'Denver', 'Seattle', 'Boston',
    ],
  },
]

export const NOMBRES_PAISES = PAISES.map(p => p.nombre)

/* Las ciudades del país de la empresa. Sin país elegido —o con uno que no está en la lista—
   devuelve null, y quien pinta el campo sabe que ahí toca texto libre. */
export const ciudadesDe = pais => PAISES.find(p => p.nombre === pais)?.ciudades || null

/* LOS NUEVE DEPARTAMENTOS DE BOLIVIA, Y DE CUÁL ES CADA CIUDAD.
   El campo era texto libre y por eso no agrupaba nada: «Santa Cruz» y «Sta. Cruz» son dos
   departamentos distintos para cualquier reporte. Son nueve y no cambian nunca, así que una lista
   cerrada acá no es una limitación, es el dato correcto.

   Y CADA CIUDAD SABE DE CUÁL ES, que es lo que permite acotar una lista con la otra: elegido
   Cochabamba, el desplegable de ciudad ofrece Cochabamba, Quillacollo y Sacaba, y ya no se puede
   guardar «Departamento: La Paz · Ciudad: Sucre», que era la contradicción que dos listas sueltas
   dejan pasar. Es la misma regla que acota las sucursales por su regional.

   Solo Bolivia por ahora: es el único país donde el campo se pregunta. */
export const DEPARTAMENTOS_BO = [
  'Beni', 'Chuquisaca', 'Cochabamba', 'La Paz', 'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija',
]

const DEPTO_DE_CIUDAD = {
  'Santa Cruz de la Sierra': 'Santa Cruz', Montero: 'Santa Cruz', Warnes: 'Santa Cruz',
  'La Guardia': 'Santa Cruz', Camiri: 'Santa Cruz',
  'La Paz': 'La Paz', 'El Alto': 'La Paz', Viacha: 'La Paz',
  Cochabamba: 'Cochabamba', Quillacollo: 'Cochabamba', Sacaba: 'Cochabamba',
  Sucre: 'Chuquisaca',
  Oruro: 'Oruro',
  'Potosí': 'Potosí', 'Villazón': 'Potosí',
  Tarija: 'Tarija', Yacuiba: 'Tarija',
  Trinidad: 'Beni', Riberalta: 'Beni',
  Cobija: 'Pando',
}

export const departamentosDe = pais => (pais === 'Bolivia' ? DEPARTAMENTOS_BO : null)

/* Las ciudades de un departamento. Sin departamento elegido devuelve todas: el campo sigue
   sirviendo mientras no se haya contestado el de al lado. */
export const ciudadesDeDepartamento = (pais, depto) => {
  const todas = ciudadesDe(pais)
  if (!todas || !depto) return todas
  return todas.filter(c => DEPTO_DE_CIUDAD[c] === depto)
}

