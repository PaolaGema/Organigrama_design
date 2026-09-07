import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CalendarDays, Network, Settings, Gift, Sparkles, Plus, FileText, MapPin } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { colaboradoresData } from '../personas/colaboradoresData'
import { cargoDe, areaDe, sedesDe } from '../../data/organigramaData'
import { HOY, avatarUrl } from '../../utils/calendarEvents'
import logoClaro from '../../assets/imagenes/logo_souly_claro.png'

/* MI PERFIL — LA FICHA PROPIA, NO UN FORMULARIO.
   Es la misma pantalla que el colaborador tiene en el teléfono: se entra a mirarse, no a
   editarse. Por eso todo el peso visual está arriba —la banda, la foto y el nombre— y lo de
   abajo son secciones que hoy están vacías y lo dicen.

   NADA DE ESTO SE ESCRIBE AQUÍ. El cargo, el área y la sucursal SE DERIVAN del puesto que la
   persona ocupa en el organigrama, con las mismas funciones que usan las otras pantallas
   (`cargoDe`, `areaDe`, `sedesDe`). Es la regla de siempre: un dato, un dueño. Si el perfil
   guardara su propio cargo, un día diría "Diseñadora UX/UI" mientras su cuadro dice otra cosa, y
   no habría manera de saber cuál miente.

   LAS SECCIONES VACÍAS SE MUESTRAN VACÍAS, no se esconden: enseñan qué va a haber aquí —deseos,
   habilidades, publicaciones propias— y son la lista de lo que falta construir. */

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/* "15 Mar 2025" → Date. Es el formato en que están escritas las fechas de ingreso del
   directorio; se lee aquí y no se cambia el dato para no tocar veinte fichas por una pantalla. */
function fechaIngreso(texto) {
  if (!texto) return null
  const [dia, mes, anio] = texto.split(' ')
  const i = MESES_CORTOS.indexOf(mes)
  if (i < 0) return null
  return new Date(Number(anio), i, Number(dia))
}

/* "1 año, 3 meses en la empresa". Se cuenta contra el hoy ficticio de la demo —el mismo que usan
   el calendario y el dashboard— para que no diga una cosa distinta en cada pantalla. */
function antiguedad(desde) {
  if (!desde) return null
  let meses = (HOY.getFullYear() - desde.getFullYear()) * 12 + (HOY.getMonth() - desde.getMonth())
  if (HOY.getDate() < desde.getDate()) meses--
  if (meses < 0) return null
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  const partes = []
  if (anios) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`)
  if (resto || !anios) partes.push(`${resto} ${resto === 1 ? 'mes' : 'meses'}`)
  return `${partes.join(', ')} en la empresa`
}

function SeccionVacia({ icon: Icon, titulo, vacio }) {
  return (
    <div>
      <h2 style={{
        display: 'flex', alignItems: 'center', gap: 9, margin: '0 0 6px',
        fontSize: 16, fontWeight: 700, color: 'var(--text-heading)',
      }}>
        <Icon size={18} style={{ color: 'var(--text-heading)' }} /> {titulo}
      </h2>
      <p style={{ margin: 0, fontSize: 13.5, fontStyle: 'italic', color: 'var(--text-muted)' }}>{vacio}</p>
    </div>
  )
}

export default function Perfil() {
  const { currentUser } = useUser()
  const { organigrama: org } = useOnboardingData()
  const navigate = useNavigate()
  const [sinFoto, setSinFoto] = useState(false)

  /* El usuario de la demo y la ficha del directorio son dos cosas distintas —uno es con quién
     estás mirando, la otra es la persona— y no todos los perfiles de la demo existen en el
     directorio. Cuando no está, la pantalla se dibuja igual con lo que el usuario sí trae. */
  const ficha = colaboradoresData.find(c => c.name === currentUser.name) || null

  /* El cargo sale del cuadro que la persona ocupa; si no está en el organigrama, del respaldo
     del usuario. Nunca del rol: «Administrador HR» es lo que su cuenta puede hacer, no el
     trabajo que hace, y ponerlo en la pastilla del cargo mezcla dos cosas que el producto se
     pasa el día distinguiendo. Sin ninguno de los dos se dice que falta, que es la verdad. */
  const cargo = (ficha && cargoDe(ficha, org)) || currentUser.cargo || null
  const area = (ficha && areaDe(ficha, org)) || ficha?.depto || currentUser.area || null
  const sedes = ficha ? sedesDe(ficha, org) : null
  const sede = sedes?.[0] || null
  const tiempo = antiguedad(fechaIngreso(ficha?.ingreso))
  const gestiona = currentUser.role === 'admin' || currentUser.role === 'manager'

  return (
    <div className="content-scroll" style={{ maxWidth: 720, margin: '0 auto', width: '100%', gap: 26 }}>

      {/* LA BANDA Y LA FICHA VAN JUNTAS: la foto monta sobre las dos, así que si fueran dos
          bloques sueltos cualquier separación entre ellos partiría el avatar por la mitad. */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: 170, borderRadius: 20,
          background: 'linear-gradient(135deg, #05543A 0%, #00A96B 52%, #00E091 100%)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 20,
        }}>
          <img src={logoClaro} alt="SoulyHR" style={{ height: 34, width: 'auto', opacity: .95 }} />
        </div>

        {/* EL AVATAR CUELGA DEL CONTENEDOR, NO DE LA TARJETA. Dentro de la tarjeta se veía
            cortado por arriba: `.sec-card` lleva `overflow: hidden` —lo necesita para que nada
            se salga de sus esquinas redondeadas— y eso recorta también lo que sobresale a
            propósito. Colgándolo del contenedor, que no recorta, la foto se ve entera y sigue
            montada sobre las dos piezas.

            Las medidas se sostienen entre sí: banda de 170, avatar arrancando a los 80, y la
            tarjeta subida 20 con 58 de relleno arriba, que es lo que hace falta para que el
            nombre no choque con la foto. Tocar una obliga a mirar las otras tres. */}
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          width: 112, height: 112, borderRadius: '50%',
          border: '4px solid var(--green)', background: 'var(--surface-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          boxShadow: '0 6px 20px rgba(12,45,64,.14)',
        }}>
          {sinFoto ? (
            <span style={{ fontSize: 34, fontWeight: 700, color: '#fff', width: '100%', height: '100%', background: currentUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser.initials}
            </span>
          ) : (
            <img
              src={avatarUrl(currentUser.name, 240)}
              alt={currentUser.name}
              onError={() => setSinFoto(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>

        <div className="sec-card" style={{ marginTop: -20, padding: '58px 24px 24px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-.02em', lineHeight: 1.2 }}>
            {currentUser.name}
          </h1>

          <div style={{
            display: 'inline-block', marginTop: 12, padding: '7px 18px', borderRadius: 99,
            background: cargo ? 'var(--green-bg)' : 'var(--input-bg)',
            border: `1px solid ${cargo ? 'var(--green)' : 'var(--border-soft)'}`,
            fontSize: 13.5, fontWeight: 600,
            color: cargo ? 'var(--text-heading)' : 'var(--text-muted)',
            fontStyle: cargo ? 'normal' : 'italic',
          }}>
            {cargo || 'Sin puesto asignado'}
          </div>

          {/* EL ROL, DICHO COMO LO QUE ES. Va debajo del cargo, en gris y con la palabra
              delante, porque es un permiso de la cuenta y no un puesto de la empresa. Antes
              ocupaba la pastilla del cargo y se leía como si «Administrador HR» fuera el
              trabajo de Juan; su trabajo es Jefe de Recursos Humanos, y administrador es lo
              que puede hacer aquí dentro. */}
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Rol en el sistema: <strong style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{currentUser.roleLabel}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, marginTop: 16, fontSize: 13.5, color: 'var(--text-heading)' }}>
            {area && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={15} style={{ color: 'var(--icon-muted)' }} /> {area}
              </span>
            )}
            {/* La sucursal sale del puesto, igual que el cargo y el área. Quien no está en el
                organigrama no tiene sede y aquí, sencillamente, no aparece la línea. */}
            {sede && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={15} style={{ color: 'var(--icon-muted)' }} /> {sede.ciudad}
              </span>
            )}
            {tiempo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <CalendarDays size={15} style={{ color: 'var(--icon-muted)' }} /> {tiempo}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
            {/* Solo se ofrece lo que esta persona puede abrir: el organigrama vive detrás del
                guardia de rutas, así que a un colaborador este botón lo mandaría a un rebote. */}
            {gestiona && (
              <button
                onClick={() => navigate('/organizacion/organigrama')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9, padding: '12px 22px',
                  borderRadius: 12, border: '1.5px solid var(--green)', background: 'transparent',
                  color: 'var(--text-heading)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Network size={16} style={{ color: 'var(--green)' }} /> Organigrama
              </button>
            )}
            <button
              title="Los ajustes de la cuenta todavía no están construidos en el prototipo"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, padding: '12px 22px',
                borderRadius: 12, border: 'none', background: 'var(--green)',
                color: '#0C2D40', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                cursor: 'default',
              }}
            >
              <Settings size={16} /> Configuración
            </button>
          </div>
        </div>
      </div>

      <SeccionVacia icon={Gift} titulo="Wishlist" vacio="Sin deseos agregados" />
      <SeccionVacia icon={Sparkles} titulo="Habilidades" vacio="Sin habilidades agregadas" />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h2 style={{
            margin: 0, flex: 1, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            Mis publicaciones
          </h2>
          <button
            aria-label="Nueva publicación"
            title="Publicar en el muro todavía no está construido en el prototipo"
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none', background: 'var(--navy)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'default', flexShrink: 0,
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="sec-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <FileText size={30} strokeWidth={1.5} style={{ color: 'var(--icon-muted)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>Todavía no publicaste nada</div>
          <p style={{ margin: '6px auto 0', maxWidth: 320, fontSize: 12, lineHeight: 1.55, color: 'var(--text-muted)' }}>
            Lo que publiques en el muro de la empresa aparecerá aquí, en tu perfil.
          </p>
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
