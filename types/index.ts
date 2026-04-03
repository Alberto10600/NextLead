export type Plan = 'free' | 'starter' | 'pro' | 'business'
export type EstadoCampana = 'borrador' | 'procesando' | 'activa' | 'pausada' | 'completada'
export type Tono = 'cercano' | 'formal' | 'millennial' | 'tecnico'
export type EstadoContacto = 'pendiente' | 'enviado' | 'abierto' | 'respondido' | 'rebotado' | 'error' | 'no_contactar'
export type EtapaPipeline = 'respondio' | 'call_agendada' | 'propuesta_enviada' | 'negociando' | 'cerrado_ganado' | 'cerrado_perdido'

// Valores exactos de la API de Hunter.io
export type HunterDepartamento =
  | 'executive' | 'it' | 'finance' | 'management' | 'sales'
  | 'legal' | 'support' | 'hr' | 'marketing' | 'communication'
  | 'education' | 'design' | 'health' | 'operations'

export type HunterSeniority = 'junior' | 'senior' | 'executive'

export type HunterTamanoEmpresa =
  | '1-10' | '11-50' | '51-200' | '201-500'
  | '501-1000' | '1001-5000' | '5001-10000' | '10001+'

export interface FiltrosHunter {
  sector: string              // industria en formato LinkedIn
  pais: string                // código ISO (ES, MX, AR...)
  tamanos: HunterTamanoEmpresa[]
  departamentos: HunterDepartamento[]
  seniority: HunterSeniority[]
}

export interface Perfil {
  id: string
  email: string
  nombre?: string
  agencia?: string
  plan: Plan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  creditos_restantes: number
  created_at: string
}

export interface BusquedaHistorial {
  fecha: string
  dominios: string[]
  encontrados: number
  guardados: number
  filtro_cargo?: string
}

export interface PerfilApollo {
  id: string
  label: string
  titulos: string[]
  seniorities: string[]
  industrias: string[]
}

export interface PreferenciasBusqueda {
  max_por_dominio?: number
  filtro_cargo?: string
  historial?: BusquedaHistorial[]
  objetivo_contactos?: number
  perfil_apollo?: PerfilApollo
}

export interface Campana {
  id: string
  user_id: string
  nombre: string
  sector: string
  pais: string
  descripcion_agencia: string
  cargos_objetivo: string[]
  dominios?: string[]
  filtros_hunter?: FiltrosHunter
  preferencias_busqueda?: PreferenciasBusqueda
  estado: EstadoCampana
  total_contactos: number
  total_enviados: number
  total_abiertos: number
  total_respondidos: number
  tono?: Tono
  dias_seguimiento?: number[]
  limite_diario?: number
  created_at: string
  updated_at: string
}

export interface Plantilla {
  id: string
  user_id: string
  nombre: string
  sector: string
  descripcion: string
  tono: Tono
  created_at: string
}

export interface Contacto {
  id: string
  user_id: string
  campana_id: string
  nombre?: string
  apellido?: string
  cargo?: string
  email: string
  empresa?: string
  dominio?: string
  linkedin_url?: string
  contexto_web?: string
  analisis_empresa?: { actividad?: string; tamano?: string; dolor?: string; resumen?: string } | null
  asunto_generado?: string
  email_generado?: string
  error_detalle?: string | null
  estado: EstadoContacto
  fecha_envio?: string
  fecha_apertura?: string
  fecha_respuesta?: string
  numero_seguimiento: number
  total_aperturas?: number
  es_lead_caliente?: boolean
  notas?: string
  etapa_pipeline?: EtapaPipeline | null
  created_at?: string
  // campo virtual: viene del join con campanas en /dashboard/contactos
  sector?: string
}

export interface EventoApertura {
  id: string
  contacto_id: string
  campana_id: string
  user_id: string
  created_at: string
}

export interface Seguimiento {
  id: string
  contacto_id: string
  campana_id: string
  user_id: string
  numero_seguimiento: number
  asunto?: string
  cuerpo?: string
  estado: 'pendiente' | 'enviado' | 'cancelado'
  fecha_programada: string
  fecha_enviado?: string
  created_at?: string
}

export interface HistorialContacto {
  id: string
  user_id: string
  email: string
  dominio: string
  fecha_ultimo_contacto: string
  total_contactos: number
}

export interface Equipo {
  id: string
  nombre: string
  owner_id: string
  created_at: string
}

export interface MiembroEquipo {
  id: string
  equipo_id: string
  user_id: string | null
  email: string
  rol: 'admin' | 'miembro'
  estado: 'pendiente' | 'activo'
  token: string
  invited_by: string | null
  created_at: string
}

export const LIMITES_PLAN: Record<Plan, { precio_mensual: number; contactos_mes: number; campanas_activas: number; seguimientos: number }> = {
  free:     { precio_mensual: 0,   contactos_mes: 100,   campanas_activas: 1,   seguimientos: 0 },
  starter:  { precio_mensual: 29,  contactos_mes: 500,   campanas_activas: 3,   seguimientos: 1 },
  pro:      { precio_mensual: 79,  contactos_mes: 2000,  campanas_activas: 10,  seguimientos: 3 },
  business: { precio_mensual: 199, contactos_mes: 10000, campanas_activas: 999, seguimientos: 5 },
}

// Etiquetas en español para los valores de Hunter
export const DEPARTAMENTOS_HUNTER: Record<HunterDepartamento, string> = {
  executive:     'Dirección / C-Suite',
  management:    'Management',
  sales:         'Ventas',
  marketing:     'Marketing',
  it:            'IT / Tecnología',
  finance:       'Finanzas',
  hr:            'Recursos Humanos',
  operations:    'Operaciones',
  support:       'Soporte / Atención cliente',
  legal:         'Legal',
  communication: 'Comunicación',
  design:        'Diseño',
  education:     'Educación',
  health:        'Salud',
}

export const SENIORITY_HUNTER: Record<HunterSeniority, string> = {
  executive: 'Dirección (C-level, VP, Director)',
  senior:    'Senior (Manager, Lead)',
  junior:    'Junior',
}

export const TAMANOS_EMPRESA: Record<HunterTamanoEmpresa, string> = {
  '1-10':       '1–10 empleados',
  '11-50':      '11–50 empleados',
  '51-200':     '51–200 empleados',
  '201-500':    '201–500 empleados',
  '501-1000':   '501–1000 empleados',
  '1001-5000':  '1.001–5.000 empleados',
  '5001-10000': '5.001–10.000 empleados',
  '10001+':     'Más de 10.000 empleados',
}

// Sectores más comunes en España/LATAM con el valor exacto para Hunter
export const SECTORES_HUNTER: { label: string; value: string }[] = [
  { label: 'Ecommerce / Retail Online',         value: 'Retail' },
  { label: 'Software / SaaS',                   value: 'Software Development' },
  { label: 'Agencia de Marketing / Publicidad', value: 'Advertising Services' },
  { label: 'Consultoría',                       value: 'Business Consulting and Services' },
  { label: 'Servicios Financieros',             value: 'Financial Services' },
  { label: 'Inmobiliario',                      value: 'Real Estate' },
  { label: 'Educación / Formación',             value: 'Education' },
  { label: 'Salud / Clínicas',                  value: 'Hospitals and Health Care' },
  { label: 'Hostelería / Turismo',              value: 'Hospitality' },
  { label: 'Construcción',                      value: 'Construction' },
  { label: 'Logística / Transporte',            value: 'Transportation, Logistics, Supply Chain and Storage' },
  { label: 'Manufactura / Industria',           value: 'Manufacturing' },
  { label: 'Medios / Comunicación',             value: 'Media Production' },
  { label: 'Recursos Humanos / Selección',      value: 'Staffing and Recruiting' },
  { label: 'Legal / Asesoría Jurídica',         value: 'Law Practice' },
  { label: 'Tecnología / IT',                   value: 'IT Services and IT Consulting' },
  { label: 'Restauración / Alimentación',       value: 'Food and Beverage Services' },
  { label: 'Moda / Textil',                     value: 'Apparel and Fashion' },
  { label: 'Automoción',                        value: 'Motor Vehicle Manufacturing' },
  { label: 'Energía',                           value: 'Renewable Energy Semiconductor Manufacturing' },
]

export const PAISES_HUNTER: { label: string; value: string }[] = [
  { label: 'España',          value: 'ES' },
  { label: 'México',          value: 'MX' },
  { label: 'Argentina',       value: 'AR' },
  { label: 'Colombia',        value: 'CO' },
  { label: 'Chile',           value: 'CL' },
  { label: 'Perú',            value: 'PE' },
  { label: 'Estados Unidos',  value: 'US' },
  { label: 'Reino Unido',     value: 'GB' },
  { label: 'Francia',         value: 'FR' },
  { label: 'Alemania',        value: 'DE' },
  { label: 'Italia',          value: 'IT' },
  { label: 'Portugal',        value: 'PT' },
  { label: 'Países Bajos',    value: 'NL' },
  { label: 'Bélgica',         value: 'BE' },
  { label: 'Suiza',           value: 'CH' },
  { label: 'Polonia',         value: 'PL' },
  { label: 'Brasil',          value: 'BR' },
]
