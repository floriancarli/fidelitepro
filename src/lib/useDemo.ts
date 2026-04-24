const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@fidelitepro.com'

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && email === DEMO_EMAIL
}
