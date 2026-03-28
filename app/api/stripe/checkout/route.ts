import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Pagos no configurados aún. Contacta con soporte.' },
    { status: 503 }
  )
}
