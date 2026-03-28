'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'arrivo_onboarding_v1'

const pasos = [
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    titulo: '¡Bienvenido a Arrivo!',
    descripcion: 'Arrivo automatiza tu prospección B2B: encuentra contactos reales, genera emails personalizados con IA y gestiona el seguimiento automático. En 5 minutos tendrás tu primera campaña lista.',
    detalle: null,
    cta: 'Empezar el tour →',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
    titulo: 'Paso 1 — Crea una campaña',
    descripcion: 'Una campaña es un conjunto de prospectos a los que quieres contactar. Dale un nombre, define el sector y empieza.',
    detalle: (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">1</span>
          </div>
          <p className="text-sm text-gray-700">Ve a <strong>Campañas</strong> en el menú de la izquierda</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">2</span>
          </div>
          <p className="text-sm text-gray-700">Pulsa el botón naranja <strong>"Nueva campaña"</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">3</span>
          </div>
          <p className="text-sm text-gray-700">Ponle nombre y define el <strong>sector objetivo</strong></p>
        </div>
      </div>
    ),
    cta: 'Siguiente →',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    titulo: 'Paso 2 — Busca contactos reales',
    descripcion: 'Arrivo usa Hunter.io para encontrar los emails reales de las personas en las empresas que te interesan. Puedes buscar por dominio o dejar que la IA sugiera empresas del sector.',
    detalle: (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-orange-600 text-[10px] font-bold">A</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Por dominio</p>
            <p className="text-xs text-gray-500 mt-0.5">Pega los dominios de las empresas que te interesan: <span className="font-mono bg-gray-100 px-1 rounded">empresa.com</span></p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-orange-600 text-[10px] font-bold">B</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Por sector con IA</p>
            <p className="text-xs text-gray-500 mt-0.5">Escribe el sector y Claude genera una lista de empresas reales. Tú seleccionas cuáles buscar.</p>
          </div>
        </div>
        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          💡 Usa los filtros para quedarte solo con decisores (CEO, Director, Manager) y excluir emails genéricos como info@ o contacto@
        </p>
      </div>
    ),
    cta: 'Siguiente →',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    titulo: 'Paso 3 — Genera emails con IA',
    descripcion: 'Antes de escribir el email, Claude analiza la web de cada empresa: qué hace, su tamaño y su punto de dolor. El email se construye a partir de ese análisis.',
    detalle: (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-gray-600 text-xs font-bold">1</span>
          </div>
          <p className="text-sm text-gray-700">Pulsa <strong>"Analizar"</strong> — Claude estudia cada empresa</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-gray-600 text-xs font-bold">2</span>
          </div>
          <p className="text-sm text-gray-700">Revisa el <strong>panel de análisis</strong>: actividad + punto de dolor</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">3</span>
          </div>
          <p className="text-sm text-gray-700">Pulsa <strong>"Generar emails IA"</strong>, describe tu servicio y listo</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">Puedes editar cualquier email antes de enviarlo haciendo clic sobre él.</p>
      </div>
    ),
    cta: 'Siguiente →',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    titulo: 'Paso 4 — Envía (primero en modo test)',
    descripcion: 'Antes de mandar emails reales, prueba el flujo completo en modo test: marca los contactos como enviados sin mandar nada. Así verificas que todo funciona.',
    detalle: (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200">○ Test</span>
          <p className="text-xs text-gray-600">Simula el envío sin mandar nada. <strong>Úsalo primero siempre.</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">● Real</span>
          <p className="text-xs text-gray-600">Envía emails reales a los contactos desde tu cuenta de Resend.</p>
        </div>
        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          💡 Después del envío se crean automáticamente seguimientos en los días 3, 7 y 14. Los gestiones en la sección <strong>Seguimientos</strong>.
        </p>
      </div>
    ),
    cta: 'Siguiente →',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>
      </svg>
    ),
    titulo: 'Paso 5 — Gestiona las respuestas',
    descripcion: 'Cuando alguien responde, muévelo al Pipeline Kanban para gestionar la oportunidad: Call agendada → Propuesta → Negociando → Cerrado.',
    detalle: (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {['Respondió', 'Call agendada', 'Propuesta', 'Negociando', 'Cerrado ✓', 'Cerrado ✗'].map((etapa, i) => (
            <div key={etapa} className={`rounded-lg px-2 py-2 text-xs font-medium border ${
              i === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              i === 5 ? 'bg-red-50 text-red-500 border-red-200' :
              'bg-white text-gray-600 border-gray-200'
            }`}>
              {etapa}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Mueve los contactos entre columnas con las flechas → o arrastrando la tarjeta.</p>
      </div>
    ),
    cta: '¡Empezar ahora!',
  },
]

export default function OnboardingTour() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState(0)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    const hecho = localStorage.getItem(STORAGE_KEY)
    if (!hecho) setVisible(true)
  }, [])

  const cerrar = (irACampanas = false) => {
    setSaliendo(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1')
      setVisible(false)
      setSaliendo(false)
      if (irACampanas) router.push('/dashboard/campanas/nueva')
    }, 200)
  }

  const siguiente = () => {
    if (paso < pasos.length - 1) {
      setPaso(paso + 1)
    } else {
      cerrar(true)
    }
  }

  if (!visible) return null

  const actual = pasos[paso]
  const esUltimo = paso === pasos.length - 1

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${saliendo ? 'opacity-0' : 'opacity-100'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => cerrar()} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header naranja */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-6 pb-8">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              {actual.icono}
            </div>
            <button
              onClick={() => cerrar()}
              className="text-white/60 hover:text-white transition-colors mt-1"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold text-white mt-4 leading-tight">{actual.titulo}</h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">{actual.descripcion}</p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          {actual.detalle}

          {/* Acciones */}
          <div className="flex items-center justify-between mt-6">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {pasos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPaso(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === paso
                      ? 'w-5 h-2 bg-orange-500'
                      : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {paso > 0 && (
                <button
                  onClick={() => setPaso(paso - 1)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Anterior
                </button>
              )}
              <button
                onClick={siguiente}
                className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                  esUltimo
                    ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-orange-500 hover:bg-orange-400 text-white'
                }`}
              >
                {actual.cta}
              </button>
            </div>
          </div>

          {paso === 0 && (
            <button
              onClick={() => cerrar()}
              className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors mt-3"
            >
              Ya sé cómo funciona, saltar el tour
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
