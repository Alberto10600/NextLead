'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SECTORES, PAISES } from '@/types'

// ─── Perfiles Apollo ──────────────────────────────────────────────────────────
const PERFILES = [
  {
    id: 'ceo',
    label: 'CEO / Fundador',
    descripcion: 'El máximo decisor de la empresa',
    titulos: ['CEO', 'Chief Executive Officer', 'Founder', 'Co-Founder', 'Owner', 'President', 'Fundador'],
    seniorities: ['owner', 'founder', 'c_suite'],
  },
  {
    id: 'director_mkt',
    label: 'Director de Marketing',
    descripcion: 'Branding, performance y comunicación',
    titulos: ['CMO', 'Chief Marketing Officer', 'Marketing Director', 'VP Marketing', 'VP of Marketing', 'Head of Marketing', 'Director of Marketing'],
    seniorities: ['c_suite', 'vp', 'head'],
  },
  {
    id: 'director_ventas',
    label: 'Director de Ventas',
    descripcion: 'Gestiona el equipo y pipeline comercial',
    titulos: ['CSO', 'Chief Sales Officer', 'Sales Director', 'VP Sales', 'VP of Sales', 'Head of Sales', 'Director of Sales', 'Director Comercial'],
    seniorities: ['c_suite', 'vp', 'head'],
  },
  {
    id: 'cto',
    label: 'CTO / Director Tech',
    descripcion: 'Lidera tecnología y producto',
    titulos: ['CTO', 'Chief Technology Officer', 'CIO', 'VP Engineering', 'Head of Engineering', 'Tech Director'],
    seniorities: ['c_suite', 'vp', 'head'],
  },
  {
    id: 'cfo',
    label: 'Director Financiero',
    descripcion: 'Gestiona las finanzas del negocio',
    titulos: ['CFO', 'Chief Financial Officer', 'Finance Director', 'VP Finance', 'Head of Finance'],
    seniorities: ['c_suite', 'vp', 'head'],
  },
  {
    id: 'manager_mkt',
    label: 'Manager de Marketing',
    descripcion: 'Ejecuta campañas y estrategia digital',
    titulos: ['Marketing Manager', 'Digital Marketing Manager', 'Growth Manager', 'Performance Manager', 'Brand Manager', 'Responsable de Marketing'],
    seniorities: ['director', 'manager', 'senior'],
  },
  {
    id: 'manager_ventas',
    label: 'Manager de Ventas',
    descripcion: 'Gestiona el equipo comercial day-to-day',
    titulos: ['Sales Manager', 'Account Manager', 'Business Development Manager', 'BDM', 'Commercial Manager'],
    seniorities: ['director', 'manager', 'senior'],
  },
  {
    id: 'ecommerce',
    label: 'Responsable Ecommerce',
    descripcion: 'Gestiona tienda online y conversión',
    titulos: ['Ecommerce Manager', 'Head of Ecommerce', 'Digital Manager', 'Online Retail Manager', 'Responsable Ecommerce'],
    seniorities: ['director', 'manager', 'head', 'senior'],
  },
  {
    id: 'hr',
    label: 'Director de RRHH',
    descripcion: 'People, talent y cultura',
    titulos: ['CHRO', 'HR Director', 'People Director', 'Head of HR', 'Head of People', 'Talent Director'],
    seniorities: ['c_suite', 'vp', 'head'],
  },
]

// Mapeo sector → keywords industria para Apollo
const SECTOR_A_INDUSTRIA: Record<string, string[]> = {
  'Retail':                                    ['retail', 'ecommerce', 'online retail'],
  'Software Development':                      ['software', 'saas', 'technology'],
  'Advertising Services':                      ['marketing', 'advertising', 'digital marketing'],
  'Business Consulting and Services':          ['consulting', 'business consulting'],
  'Financial Services':                        ['financial services', 'finance', 'fintech'],
  'Real Estate':                               ['real estate', 'property'],
  'Education':                                 ['education', 'e-learning', 'training'],
  'Hospitals and Health Care':                 ['healthcare', 'health', 'medical'],
  'Hospitality':                               ['hospitality', 'tourism', 'hotel'],
  'Construction':                              ['construction', 'real estate development'],
  'Transportation, Logistics, Supply Chain and Storage': ['logistics', 'transportation', 'supply chain'],
  'Manufacturing':                             ['manufacturing', 'industrial'],
  'Media Production':                          ['media', 'publishing', 'content'],
  'Staffing and Recruiting':                   ['staffing', 'recruiting', 'hr'],
  'Law Practice':                              ['legal', 'law'],
  'IT Services and IT Consulting':             ['it services', 'technology consulting'],
  'Food and Beverage Services':                ['food', 'beverage', 'restaurant'],
  'Apparel and Fashion':                       ['fashion', 'apparel', 'clothing'],
  'Motor Vehicle Manufacturing':               ['automotive', 'car'],
  'Renewable Energy Semiconductor Manufacturing': ['energy', 'renewable energy'],
}

const OBJETIVOS = [10, 25, 50, 100]
const STEP_LABELS = ['Sector', 'Perfil', 'Mensaje', 'Confirmar']

function CreditEstimate({ perfil, objetivo }: { perfil: typeof PERFILES[0] | null; objetivo: number }) {
  if (!perfil || objetivo < 1) return null
  const isTop = perfil.seniorities.includes('c_suite') || perfil.seniorities.includes('owner') || perfil.seniorities.includes('founder')
  const factor = isTop ? 1.5 : 1.3
  const creditos = Math.ceil(objetivo * factor)
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-fit">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 shrink-0">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Estimado: <strong className="text-gray-700">~{creditos} créditos Apollo</strong> para {objetivo} contactos</span>
    </div>
  )
}

export default function NuevaCampanaPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  // Paso 1
  const [sectorValue, setSectorValue] = useState('')
  const [paisValue, setPaisValue] = useState('ES')
  const [nombre, setNombre] = useState('')

  // Paso 2
  const [perfilId, setPerfilId] = useState('')
  const [objetivo, setObjetivo] = useState(25)
  const [objetivoCustom, setObjetivoCustom] = useState('')
  const [objetivoCustomActivo, setObjetivoCustomActivo] = useState(false)

  // Paso 3
  const [descripcion, setDescripcion] = useState('')
  const [tono, setTono] = useState<'cercano' | 'formal' | 'millennial' | 'tecnico'>('cercano')
  const [numFollowups, setNumFollowups] = useState(2)

  const sectorObj = SECTORES.find(s => s.value === sectorValue)
  const paisObj = PAISES.find(p => p.value === paisValue)
  const perfilObj = PERFILES.find(p => p.id === perfilId)
  const objetivoFinal = objetivoCustomActivo ? (parseInt(objetivoCustom) || 0) : objetivo

  useEffect(() => {
    if (sectorObj && paisObj) {
      setNombre(`${sectorObj.label} · ${paisObj.label}`)
    }
  }, [sectorValue, paisValue]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/campanas')
      .then(r => r.json())
      .then(d => {
        const anterior = (d.campanas || []).find((c: { descripcion_agencia?: string }) => c.descripcion_agencia?.trim())
        if (anterior?.descripcion_agencia) setDescripcion(anterior.descripcion_agencia)
      })
      .catch(() => null)
  }, [])

  const puedeAvanzar = () => {
    if (paso === 1) return !!(sectorValue && paisValue && nombre.trim())
    if (paso === 2) return !!(perfilId && objetivoFinal >= 5)
    if (paso === 3) return descripcion.trim().length >= 20
    return true
  }

  const crearCampana = async () => {
    if (!perfilObj) return
    setCreando(true)
    setError('')
    try {
      const diasSeguimiento =
        numFollowups === 0 ? [] :
        numFollowups === 1 ? [3] :
        numFollowups === 2 ? [3, 7] : [3, 7, 14]

      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          sector: sectorValue,
          pais: paisValue,
          descripcion_agencia: descripcion.trim(),
          tono,
          dias_seguimiento: diasSeguimiento,
          cargos_objetivo: perfilObj.titulos,
          preferencias_busqueda: {
            objetivo_contactos: objetivoFinal,
            max_por_dominio: 1,
            perfil_apollo: {
              id: perfilObj.id,
              label: perfilObj.label,
              titulos: perfilObj.titulos,
              seniorities: perfilObj.seniorities,
              industrias: SECTOR_A_INDUSTRIA[sectorValue] || [],
            },
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando campaña')
      router.push(`/dashboard/campanas/${data.id}`)
    } catch (e: unknown) {
      setError((e as Error).message)
      setCreando(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1
              const done = n < paso
              const active = n === paso
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done || active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : n}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-orange-600' : done ? 'text-gray-500' : 'text-gray-300'}`}>{label}</span>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`w-8 sm:w-12 h-0.5 mx-1 ${done ? 'bg-orange-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

          {/* ── Paso 1 ── */}
          {paso === 1 && (
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-base font-semibold text-gray-900">¿A qué tipo de empresa vas?</h1>
                <p className="text-xs text-gray-400 mt-1">Selecciona el sector y el mercado objetivo</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sector</p>
                <div className="grid grid-cols-2 gap-2">
                  {SECTORES.map(s => (
                    <button key={s.value} onClick={() => setSectorValue(s.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        sectorValue === s.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">País</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAISES.map(p => (
                    <button key={p.value} onClick={() => setPaisValue(p.value)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                        paisValue === p.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nombre de la campaña</p>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Ecommerce España Q2 2025"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all" />
              </div>
            </div>
          )}

          {/* ── Paso 2 ── */}
          {paso === 2 && (
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-base font-semibold text-gray-900">¿Qué perfil buscas?</h1>
                <p className="text-xs text-gray-400 mt-1">Apollo filtrará directamente por cargo y seniority — sin contactos basura</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Cargo objetivo</p>
                <div className="grid grid-cols-3 gap-2">
                  {PERFILES.map(p => (
                    <button key={p.id} onClick={() => setPerfilId(p.id)}
                      className={`text-left px-3 py-3 rounded-xl border transition-all ${
                        perfilId === p.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      <p className={`text-xs font-semibold leading-tight ${perfilId === p.id ? 'text-orange-700' : 'text-gray-800'}`}>{p.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{p.descripcion}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">¿Cuántos contactos necesitas?</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {OBJETIVOS.map(n => (
                    <button key={n} onClick={() => { setObjetivo(n); setObjetivoCustomActivo(false) }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        !objetivoCustomActivo && objetivo === n
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {n}
                    </button>
                  ))}
                  <div className={`flex items-center border rounded-lg overflow-hidden ${objetivoCustomActivo ? 'border-orange-400' : 'border-gray-200'}`}>
                    <span className="px-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 py-2">Custom</span>
                    <input type="number" min="5" max="500" placeholder="—"
                      value={objetivoCustom}
                      onChange={e => { setObjetivoCustom(e.target.value); setObjetivoCustomActivo(true) }}
                      onFocus={() => setObjetivoCustomActivo(true)}
                      className="w-16 px-2 py-2 text-sm text-gray-700 outline-none" />
                  </div>
                </div>
              </div>

              <CreditEstimate perfil={perfilObj || null} objetivo={objetivoFinal} />

              {perfilObj && (
                <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Apollo buscará por estos títulos</p>
                  <p className="text-xs text-gray-600">{perfilObj.titulos.slice(0, 5).join(' · ')}{perfilObj.titulos.length > 5 ? ` +${perfilObj.titulos.length - 5}` : ''}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Paso 3 ── */}
          {paso === 3 && (
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-base font-semibold text-gray-900">¿Qué les vas a decir?</h1>
                <p className="text-xs text-gray-400 mt-1">Esto alimenta la generación de emails con IA</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tu servicio o propuesta de valor</p>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  placeholder="Somos una agencia de marketing digital especializada en ecommerce. Ayudamos a tiendas online a aumentar su conversión y reducir el coste de adquisición..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all" />
                <p className="text-[10px] text-gray-400 mt-1">{descripcion.length} caracteres · mínimo 20</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tono del email</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { v: 'cercano', l: 'Cercano', d: 'Natural, directo' },
                    { v: 'formal', l: 'Formal', d: 'Corporativo' },
                    { v: 'millennial', l: 'Millennial', d: 'Fresco, casual' },
                    { v: 'tecnico', l: 'Técnico', d: 'Con datos' },
                  ] as const).map(({ v, l, d }) => (
                    <button key={v} onClick={() => setTono(v)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                        tono === v ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <p className={`text-xs font-semibold ${tono === v ? 'text-orange-700' : 'text-gray-700'}`}>{l}</p>
                      <p className="text-[10px] text-gray-400">{d}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Follow-ups automáticos</p>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} onClick={() => setNumFollowups(n)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        numFollowups === n ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {n === 0 ? 'Ninguno' : `${n} FU`}
                    </button>
                  ))}
                </div>
                {numFollowups > 0 && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Secuencia: email inicial
                    {numFollowups >= 1 && ' → +3d'}
                    {numFollowups >= 2 && ' → +7d'}
                    {numFollowups >= 3 && ' → +14d'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Paso 4 ── */}
          {paso === 4 && (
            <div className="p-6 space-y-5">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Confirmar campaña</h1>
                <p className="text-xs text-gray-400 mt-1">Revisa los detalles antes de crear</p>
              </div>

              <div className="divide-y divide-gray-50">
                {[
                  { label: 'Nombre', value: nombre },
                  { label: 'Sector', value: sectorObj?.label || sectorValue },
                  { label: 'País', value: paisObj?.label || paisValue },
                  { label: 'Perfil objetivo', value: perfilObj?.label || '—' },
                  { label: 'Contactos objetivo', value: `${objetivoFinal} contactos` },
                  { label: 'Tono', value: { cercano: 'Cercano', formal: 'Formal', millennial: 'Millennial', tecnico: 'Técnico' }[tono] },
                  { label: 'Follow-ups', value: numFollowups === 0 ? 'Sin follow-ups' : `${numFollowups} (días: ${[[], [3], [3,7], [3,7,14]][numFollowups].join(', ')})` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between py-2.5">
                    <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
                    <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
                  </div>
                ))}
              </div>

              <CreditEstimate perfil={perfilObj || null} objetivo={objetivoFinal} />

              {descripcion && (
                <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Descripción del servicio</p>
                  <p className="text-xs text-gray-600 line-clamp-3">{descripcion}</p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {/* Nav */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPaso(p => p - 1)} disabled={paso === 1}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Atrás
            </button>

            {paso < 4 ? (
              <button onClick={() => setPaso(p => p + 1)} disabled={!puedeAvanzar()}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 px-5 py-2.5 rounded-lg transition-all">
                Siguiente
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ) : (
              <button onClick={crearCampana} disabled={creando}
                className="flex items-center gap-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 px-6 py-2.5 rounded-lg transition-all">
                {creando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Creando...
                  </>
                ) : <>Crear campaña <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
