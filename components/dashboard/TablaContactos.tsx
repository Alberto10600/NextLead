'use client'

import { useState, useMemo } from 'react'
import type { Contacto } from '@/types'
import ModalEmail from './ModalEmail'

interface TablaContactosProps {
  contactos: Contacto[]
  onExcluir?: (id: string) => void
  onRegenerar?: (id: string) => void
}

const estadoStyles: Record<Contacto['estado'], { bg: string; text: string }> = {
  pendiente:  { bg: 'bg-gray-100',      text: 'text-gray-500' },
  enviado:    { bg: 'bg-orange-50',     text: 'text-orange-600' },
  abierto:    { bg: 'bg-amber-50',      text: 'text-amber-600' },
  respondido: { bg: 'bg-emerald-50',    text: 'text-emerald-600' },
  rebotado:   { bg: 'bg-red-50',        text: 'text-red-500' },
  error:      { bg: 'bg-red-50',        text: 'text-red-500' },
}

const DECISION_MAKER_KEYWORDS = [
  'ceo', 'coo', 'cto', 'cmo', 'cfo', 'cso', 'founder', 'co-founder',
  'director', 'directora', 'president', 'owner', 'partner', 'vp ', 'vice president',
  'head of', 'chief', 'gerente', 'manager', 'socio', 'managing',
]
const GENERIC_PREFIXES = [
  'info', 'contact', 'hello', 'hola', 'admin', 'mail', 'email',
  'office', 'team', 'sales', 'support', 'help', 'press', 'media',
  'marketing', 'hr', 'jobs', 'career', 'noreply', 'no-reply',
]

function esDecisionMaker(c: Contacto): boolean {
  const cargo = (c.cargo || '').toLowerCase()
  return DECISION_MAKER_KEYWORDS.some((kw) => cargo.includes(kw))
}

function esGenerico(c: Contacto): boolean {
  const local = c.email.split('@')[0].toLowerCase()
  return GENERIC_PREFIXES.some((p) => local === p || local.startsWith(p + '.') || local.startsWith(p + '_'))
}

type Tab = 'todos' | 'decisores' | 'genericos'

const PAGE_SIZE = 50

function descargarCSV(contactos: Contacto[]) {
  const cabecera = ['Empresa', 'Nombre', 'Apellido', 'Cargo', 'Email', 'Dominio', 'LinkedIn', 'Estado']
  const filas = contactos.map((c) => [
    c.empresa || '', c.nombre || '', c.apellido || '',
    c.cargo || '', c.email, c.dominio || '', c.linkedin_url || '', c.estado,
  ])
  const csv = [cabecera, ...filas]
    .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contactos-nextlead-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TablaContactos({ contactos, onExcluir, onRegenerar }: TablaContactosProps) {
  const [contactoSeleccionado, setContactoSeleccionado] = useState<Contacto | null>(null)
  const [tab, setTab] = useState<Tab>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)

  const decisores = useMemo(() => contactos.filter(esDecisionMaker), [contactos])
  const genericos = useMemo(() => contactos.filter(esGenerico), [contactos])

  const baseTab = tab === 'decisores' ? decisores : tab === 'genericos' ? genericos : contactos

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return baseTab
    const q = busqueda.toLowerCase()
    return baseTab.filter((c) =>
      [c.nombre, c.apellido, c.empresa, c.cargo, c.email]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [baseTab, busqueda])

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginaActual = Math.min(pagina, Math.max(0, totalPaginas - 1))
  const contactosPagina = filtrados.slice(paginaActual * PAGE_SIZE, (paginaActual + 1) * PAGE_SIZE)
  const inicio = paginaActual * PAGE_SIZE + 1
  const fin = Math.min((paginaActual + 1) * PAGE_SIZE, filtrados.length)

  const cambiarTab = (t: Tab) => { setTab(t); setPagina(0) }
  const cambiarBusqueda = (v: string) => { setBusqueda(v); setPagina(0) }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-3">
        {/* Tabs + CSV */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
            {([
              ['todos',    `Todos · ${contactos.length}`],
              ['decisores', `Decision Makers · ${decisores.length}`],
              ['genericos', `Genéricos · ${genericos.length}`],
            ] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => cambiarTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  tab === t
                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => descargarCSV(filtrados)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white/[0.04] hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar CSV
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, cargo o email..."
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400/40 focus:border-orange-400/40 transition-all duration-150"
          />
          {busqueda && (
            <button onClick={() => cambiarBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {filtrados.length > 0 && (
          <p className="text-xs text-gray-400">
            {filtrados.length > PAGE_SIZE ? `${inicio}–${fin} de ${filtrados.length} contactos` : `${filtrados.length} contacto${filtrados.length !== 1 ? 's' : ''}`}
            {busqueda && <span className="ml-1">para "{busqueda}"</span>}
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Empresa</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Cargo</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {contactosPagina.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-gray-400 text-sm">
                  {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay contactos en esta categoría'}
                </td>
              </tr>
            )}
            {contactosPagina.map((c) => {
              const badge = estadoStyles[c.estado] || estadoStyles.pendiente
              const decisor = esDecisionMaker(c)
              return (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100 group">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{c.empresa || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      {[c.nombre, c.apellido].filter(Boolean).join(' ') || '—'}
                      {decisor && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          DM
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{c.cargo || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-gray-500">{c.email}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {c.email_generado ? (
                        <button
                          onClick={() => setContactoSeleccionado(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Ver email
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 text-xs text-gray-300">—</span>
                      )}
                      {onExcluir && (
                        <button onClick={() => onExcluir(c.id)} className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">Página {paginaActual + 1} de {totalPaginas}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(0)} disabled={paginaActual === 0} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors">«</button>
            <button onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={paginaActual === 0} className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹ Anterior</button>
            {Array.from({ length: totalPaginas }, (_, i) => i).filter((i) => Math.abs(i - paginaActual) <= 2).map((i) => (
              <button key={i} onClick={() => setPagina(i)} className={`w-8 h-7 text-xs rounded transition-colors ${i === paginaActual ? 'bg-orange-50 border border-orange-200 text-orange-600 font-medium' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))} disabled={paginaActual >= totalPaginas - 1} className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Siguiente ›</button>
            <button onClick={() => setPagina(totalPaginas - 1)} disabled={paginaActual >= totalPaginas - 1} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors">»</button>
          </div>
        </div>
      )}

      {contactoSeleccionado && (
        <ModalEmail
          contacto={contactoSeleccionado}
          onClose={() => setContactoSeleccionado(null)}
          onRegenerar={onRegenerar ? () => { onRegenerar(contactoSeleccionado.id); setContactoSeleccionado(null) } : undefined}
        />
      )}
    </>
  )
}
