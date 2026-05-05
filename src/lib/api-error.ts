import { NextResponse } from 'next/server'

interface ApiErrorOptions {
  status?: number
  fallback?: string
}

function pgCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const c = (err as Record<string, unknown>).code
    return typeof c === 'string' ? c : undefined
  }
}

export function apiError(err: unknown, options: ApiErrorOptions = {}): NextResponse {
  console.error('[API Error]', err)

  const code = pgCode(err)
  let status = options.status ?? 500
  let fallback = options.fallback ?? 'Une erreur est survenue, veuillez réessayer.'

  if (!options.status) {
    if (code === '23505') {
      status = 409
      fallback = options.fallback ?? 'Cette donnée existe déjà.'
    } else if (code === '23503') {
      status = 400
      fallback = options.fallback ?? 'Référence invalide.'
    } else if (code === '42501' || code === 'PGRST301') {
      status = 403
      fallback = options.fallback ?? 'Accès non autorisé.'
    }
  }

  return NextResponse.json({ error: fallback }, { status })
}
