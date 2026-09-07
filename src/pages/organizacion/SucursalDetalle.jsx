import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, MapPin, Pencil, Plus, Save, X } from 'lucide-react'
import { useOnboardingData } from '../../context/OnboardingDataContext'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'
import { nuevoId, ESTADOS_SUCURSAL } from '../../data/organigramaData'
import { colaboradoresData, fotoDe } from '../personas/colaboradoresData'
import { useUser } from '../../context/UserContext'
import TarjetaCampos from '../../components/organizacion/TarjetaCampos'
import EmptyState from '../../components/layout/EmptyState'

/* LA FICHA DE UNA SUCURSAL, EN SU PROPIA PANTALLA.
   Crear y editar una sede vivían en un modal de 560 px: doce campos en cuatro grupos metidos en
   una ventana con scroll propio, encima de una tabla que ya no se podía usar. Un modal es para
   una decisión corta —confirmar, elegir una cosa— y esto es una ficha que se llena con papeles
   delante y se vuelve a mirar meses después.

   ES LA MISMA VISTA QUE «DATOS DE LA EMPRESA», no una parecida: las dos arman sus tarjetas con
   `TarjetaCampos`, así que se leen igual, se editan igual y el día que una mejore, mejoran las
   dos. Lo único propio de aquí es qué campos hay y cuándo se puede guardar.

   SU PROPIA RUTA, y no un estado dentro de la lista: `/organizacion/sucursales/suc-3` se puede
   enlazar, marcar y compartir, la flecha de atrás del navegador hace lo que uno espera, y
   «nueva» es una dirección más y no un modo escondido de otra pantalla. */

const vacio = v => !v || !String(v).trim()

const PASTILLA_ESTADO = valor => {
  const e = ESTADOS_SUCURSAL[valor] || ESTADOS_SUCURSAL.activa
  return (
    <span style={{
      display: 'inline-block', padding: '3px 11px', borderRadius: 99,
      fontSize: 11.5, fontWeight: 700, background: e.bg, color: e.color,
    }}>{e.label}</span>
  )
}

/* LOS CAMPOS DE LA SEDE. Es lo mismo que pedía el modal y en los mismos tres grupos: lo que la
   identifica, cómo se la contacta y cómo opera.

   LO QUE NO ESTÁ ES LA IDENTIDAD LEGAL. Razón social y NIT existen UNA vez y viven en Datos de
   la empresa; repetirlos por sede es garantizar que algún día dos digan cosas distintas y que
   nadie sepa cuál vale. Lo único fiscal propio de cada sede es su código ante el SIN. */
const GRUPOS = personas => [
  {
    titulo: 'Identificación',
    desc: 'Cómo se llama esta sede y con qué número factura.',
    campos: [
      { key: 'nombre', label: 'Nombre', ph: 'Sucursal Central', requerido: true, col: 'c-tercio',
        ayuda: 'Cómo la llama la empresa por dentro.',
        faltaMsg: 'Sin nombre no hay forma de elegirla al ubicar un puesto.' },
      { key: 'ciudad', label: 'Ciudad', ph: 'Santa Cruz', requerido: true, col: 'c-tercio',
        ayuda: 'Es lo que la identifica en toda la aplicación: hay tres «Sucursal».',
        faltaMsg: 'Es lo que distingue una «Sucursal» de otra.' },
      { key: 'codigo', label: 'Código de sucursal', ph: '0001', col: 'c-tercio',
        ayuda: 'El número con el que esta sede factura. El NIT y la razón social son de la empresa y viven en Datos de la empresa.' },
    ],
  },
  {
    titulo: 'Contacto',
    desc: 'Por dónde se llega a esta oficina.',
    campos: [
      { key: 'direccion', label: 'Dirección', ph: 'Av. Principal 100', col: 'c-tercio' },
      { key: 'telefono', label: 'Teléfono', ph: '+591 3 000 0000', col: 'c-tercio', html: 'tel' },
      { key: 'correo', label: 'Correo', ph: 'sucursal@ejemplo.com', col: 'c-tercio', html: 'email' },
    ],
  },
  {
    titulo: 'Operación',
    desc: 'Quién responde por ella, cuándo abre y si sigue abierta.',
    campos: [
      /* Se elige de la gente que existe, no se teclea: un nombre a mano no es una persona del
         sistema y mañana nadie sabe a quién apunta. */
      { key: 'responsable', label: 'Responsable', col: 'c-tercio', tipo: 'persona',
        personas, ph: 'Sin responsable asignado',
        vacioTitulo: 'Aún no tienes ningún colaborador registrado',
        vacioNota: 'Cuando des de alta a tu gente en Colaboradores aparecerá aquí. Mientras tanto puedes ponerte a ti.' },
      { key: 'horario', label: 'Horario de atención', ph: 'Lun a Vie, 08:30–18:00', col: 'c-tercio' },
      /* Cerrar no es borrar. Una sede que cerró tiene puestos, gente y planillas detrás: se
         apaga y deja de ofrecerse, pero su historia queda. */
      { key: 'estado', label: 'Estado', col: 'c-corto', tipo: 'lista',
        opciones: Object.entries(ESTADOS_SUCURSAL).map(([valor, e]) => ({ valor, etiqueta: e.label })),
        leer: PASTILLA_ESTADO },
      { key: 'apertura', label: 'Fecha de apertura', col: 'c-corto', html: 'date' },
    ],
  },
]

const EN_BLANCO = {
  nombre: '', ciudad: '', codigo: '', direccion: '', telefono: '', correo: '',
  responsable: '', horario: '', estado: 'activa', apertura: '',
}

/* `nueva` llega como prop desde la ruta y no se deduce de la dirección: "sucursales/nueva" es
   una ruta sin `:id`, así que ahí `useParams()` viene vacío y mirar la URL desde dentro daba
   siempre que no —y la pantalla de crear se abría diciendo que no encontraba la sucursal—. */
export default function SucursalDetalle({ nueva = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sucursales, setSucursales } = useOnboardingData()
  const { setDirty, setSaveHandler } = useUnsavedChanges()
  const { currentUser } = useUser()

  const sucursal = nueva ? null : sucursales.find(s => s.id === id) || null

  const [form, setForm] = useState(sucursal || EN_BLANCO)
  /* Una sede que se está creando entra ya en edición: no hay nada que leer todavía. Una que
     existe se abre para mirarla, como la ficha de la empresa. */
  const [editando, setEditando] = useState(nueva)
  /* NO SE REGAÑA ANTES DE EMPEZAR. Una ficha en blanco enseñaba sus dos obligatorios en rojo
     nada más abrirse, con el botón de crear apagado: la pantalla se quejaba de que no hubieras
     hecho todavía lo que acababas de entrar a hacer. El aviso se enciende al primer intento de
     guardar —el botón ya no está apagado, para que ese intento exista y diga qué falta—. */
  const [intento, setIntento] = useState(false)

  /* QUIÉN PUEDE SER RESPONSABLE DE UNA SEDE: el directorio, y uno mismo.
     Uno mismo va primero y aparte porque en una empresa que recién empieza a cargar su gente es
     la única respuesta posible —y porque cuando ya hay veinte, buscarse a uno mismo entre ellas
     es lo más común—. Si ya figura en el directorio no se repite: sería la misma persona dos
     veces en la lista y elegir una u otra guardaría lo mismo. */
  const personas = useMemo(() => {
    const directorio = colaboradoresData
      .map(c => ({ nombre: c.name, cargo: c.cargo, foto: fotoDe(c), initials: c.initials, color: c.color }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    const yo = {
      nombre: currentUser.name, cargo: currentUser.cargo,
      foto: null, initials: currentUser.initials, color: currentUser.color, tu: true,
    }
    return directorio.some(p => p.nombre === yo.nombre)
      ? directorio
      : [yo, ...directorio]
  }, [currentUser])
  const grupos = useMemo(() => GRUPOS(personas), [personas])

  const guardada = sucursal || EN_BLANCO
  const cambiado = JSON.stringify(form) !== JSON.stringify(guardada)

  /* DOS SEDES CON EL MISMO NOMBRE EN LA MISMA CIUDAD son indistinguibles en todos los sitios
     donde se elige una, así que se avisa antes y no después. En ciudades distintas sí puede
     repetirse: «Sucursal» hay una en cada una. */
  const repetida = sucursales.some(s =>
    s.id !== sucursal?.id
    && s.nombre.trim().toLowerCase() === (form.nombre || '').trim().toLowerCase()
    && (s.ciudad || '').trim().toLowerCase() === (form.ciudad || '').trim().toLowerCase())

  const problema = vacio(form.nombre) ? 'Ponle un nombre'
    : vacio(form.ciudad) ? 'Falta la ciudad'
      : repetida ? 'Ya hay una sucursal con ese nombre en esa ciudad'
        : null

  // Fuera de edición, lo que se enseña es lo guardado, aunque cambie desde otro lado.
  useEffect(() => { if (!editando && sucursal) setForm(sucursal) }, [editando, sucursal])

  useEffect(() => {
    setDirty(editando && cambiado && !problema)
    return () => setDirty(false)
  }, [editando, cambiado, problema, setDirty])

  const limpio = datos => ({
    ...datos,
    nombre: (datos.nombre || '').trim(),
    ciudad: (datos.ciudad || '').trim(),
    direccion: (datos.direccion || '').trim(),
    estado: datos.estado || 'activa',
  })

  function guardar() {
    if (problema) { setIntento(true); return }
    if (nueva) {
      /* El id se calcula ANTES de guardar porque hace falta para ir a la ficha recién creada.
         `replace` para que la flecha de atrás vuelva a la lista y no a un formulario vacío que
         ya se guardó. */
      const nuevo = nuevoId('sucursal', sucursales)
      setSucursales(prev => [...prev, { ...limpio(form), id: nuevo }])
      setDirty(false)
      /* Y se sale de edición: la ruta cambia pero el componente es el mismo, así que sin esto la
         ficha recién creada se abriría con el formulario todavía puesto. */
      setEditando(false)
      navigate(`/organizacion/sucursales/${nuevo}`, { replace: true })
      return
    }
    setSucursales(prev => prev.map(s => (s.id === sucursal.id ? { ...s, ...limpio(form) } : s)))
    setDirty(false)
    setEditando(false)
  }

  /* Guardar desde el aviso de salida es el mismo guardado, y por eso se registra: sin esto, el
     modal de «tienes cambios sin guardar» ofrecía un botón que no hacía nada.

     SIN LISTA DE DEPENDENCIAS a propósito: `guardar` se vuelve a crear en cada render, así que
     cualquier lista que la incluyera dispararía igual siempre, y una que no la incluyera dejaría
     registrada una versión con el formulario viejo dentro. */
  useEffect(() => {
    setSaveHandler(() => { if (!problema) guardar() })
    return () => setSaveHandler(null)
  })

  function cancelar() {
    setDirty(false)
    // Crear y arrepentirse es volver a la lista; editar y arrepentirse es volver a la ficha.
    if (nueva) { navigate('/organizacion/sucursales'); return }
    setForm(sucursal)
    setEditando(false)
  }

  const volver = () => navigate('/organizacion/sucursales')

  if (!nueva && !sucursal) {
    return (
      <div className="content-scroll">
        <button className="det-back" onClick={volver}>
          <ArrowLeft size={15} /> Sucursales
        </button>
        <div className="sec-card">
          <EmptyState
            icon={MapPin}
            title="No encontramos esta sucursal"
            description="Puede que se haya eliminado desde otra pantalla."
            actionLabel="Volver a Sucursales"
            onAction={volver}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="content-scroll">
      <button className="det-back" onClick={volver}>
        <ArrowLeft size={15} /> Sucursales
      </button>

      <div className="pl-header">
        <div>
          <h1 className="pl-title">{nueva ? 'Nueva sucursal' : form.nombre || 'Sucursal'}</h1>
          <p className="pl-subtitle">
            {nueva
              ? 'Una sede nueva. Solo el nombre y la ciudad son obligatorios; el resto se puede completar después.'
              : `${form.ciudad || 'Sin ciudad'} · Ficha de la sede.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {editando ? (
            <>
              <button className="pl-btn-cancel" onClick={cancelar}>
                <X size={14} /> Cancelar
              </button>
              {/* EL BOTÓN NO SE APAGA. Uno apagado no explica nada: deja a quien lo mira
                  buscando por su cuenta cuál de los doce campos lo tiene bloqueado. Pulsable,
                  el clic señala en rojo lo que falta y lo dice bajo la cabecera. */}
              <button
                className="pl-btn-save"
                onClick={guardar}
                disabled={!nueva && !cambiado}
                title={!nueva && !cambiado ? 'No has cambiado nada todavía' : (problema || undefined)}
              >
                {nueva ? <Plus size={14} /> : <Save size={14} />}
                {nueva ? 'Crear sucursal' : 'Guardar cambios'}
              </button>
            </>
          ) : (
            <button className="pl-btn-save" onClick={() => setEditando(true)}>
              <Pencil size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180 }}>
        {/* Lo que un campo no puede decir por su cuenta: que el nombre choca con otra sede. */}
        {intento && problema && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '11px 14px', borderRadius: 10,
            background: 'var(--red-bg)', border: '1px solid var(--red)',
          }}>
            <AlertTriangle size={15} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>{problema}</span>
          </div>
        )}

        {grupos.map(grupo => (
          <TarjetaCampos
            key={grupo.titulo}
            titulo={grupo.titulo}
            desc={grupo.desc}
            campos={grupo.campos}
            form={form}
            set={(k, v) => setForm(prev => ({ ...prev, [k]: v }))}
            editando={editando}
            prefijo="suc"
            marcarFaltas={intento}
          />
        ))}

        {editando && <p className="pl-leyenda"><b>*</b> Campo obligatorio</p>}

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '16px 18px', borderRadius: 12,
          background: 'var(--surface-hover)', border: '1px solid var(--border-soft)',
        }}>
          <MapPin size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-heading)' }}>La razón social, el NIT y el logo no cambian por sucursal.</strong>{' '}
            Son de la empresa entera y se editan en Datos de la empresa. Aquí vive lo que sí es
            propio de esta sede: dónde está, con qué código factura, quién responde por ella y en
            qué horario abre.
          </div>
        </div>
      </div>
    </div>
  )
}
