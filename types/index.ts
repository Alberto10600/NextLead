export type Plan = 'free' | 'starter' | 'pro' | 'business'
export type EstadoCampana = 'borrador' | 'procesando' | 'activa' | 'pausada' | 'completada'
export type EstadoContacto = 'pendiente' | 'enviado' | 'abierto' | 'respondido' | 'rebotado' | 'error'

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

export interface Campana {
  id: string
  user_id: string
  nombre: string
  sector: string
  pais: string
  descripcion_agencia: string
  cargos_objetivo: string[]
  estado: EstadoCampana
  total_contactos: number
  total_enviados: number
  total_abiertos: number
  total_respondidos: number
  created_at: string
  updated_at: string
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
  asunto_generado?: string
  email_generado?: string
  estado: EstadoContacto
  fecha_envio?: string
  fecha_apertura?: string
  fecha_respuesta?: string
  numero_seguimiento: number
  created_at?: string
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

export interface FormularioCampana {
  nombre: string
  sector: string
  pais: string
  descripcion_agencia: string
  cargos_objetivo: string[]
}

export interface ResultadoBusqueda {
  contactos: Contacto[]
  total_encontrados: number
  total_procesados: number
  duplicados_eliminados: number
  errores: string[]
}

export interface LimitePlan {
  contactos_mes: number
  campanas_activas: number
  seguimientos: number
  precio_mensual: number
}

export const LIMITES_PLAN: Record<Plan, LimitePlan> = {
  free:     { contactos_mes: 25,   campanas_activas: 1,   seguimientos: 0, precio_mensual: 0 },
  starter:  { contactos_mes: 600,  campanas_activas: 3,   seguimientos: 1, precio_mensual: 89 },
  pro:      { contactos_mes: 1500, campanas_activas: 10,  seguimientos: 3, precio_mensual: 149 },
  business: { contactos_mes: 3000, campanas_activas: 999, seguimientos: 5, precio_mensual: 279 },
}

export interface PrecioStripe {
  plan: Plan
  priceId: string
}
