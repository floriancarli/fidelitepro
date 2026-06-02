/**
 * Test d'envoi email via Resend.
 * Usage : RESEND_API_KEY=re_xxx node test-email.mjs
 * Ou     : charger .env.local manuellement avant d'exécuter.
 */
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Charge .env.local puis .env.vercel.local si présents
const __dirname = dirname(fileURLToPath(import.meta.url))
for (const envName of ['.env.local', '.env.vercel.local']) {
  try {
    const envFile = readFileSync(resolve(__dirname, envName), 'utf8')
    for (const line of envFile.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) process.env[match[1].trim()] ??= match[2].trim()
    }
  } catch { /* fichier absent, on continue */ }
}

const key = process.env.RESEND_API_KEY
if (!key) {
  console.error('❌  RESEND_API_KEY manquante.')
  console.error('    Ajoutez-la dans .env.local ou : RESEND_API_KEY=re_xxx node test-email.mjs')
  process.exit(1)
}

const resend = new Resend(key)

console.log('📧  Envoi en cours…')

const { data, error } = await resend.emails.send({
  from: 'Orlyo <noreply@getorlyo.com>',
  to: 'floriancarlipro@gmail.com',
  subject: 'Test Resend - Orlyo',
  text: 'Si tu reçois cet email, Resend fonctionne correctement.',
})

if (error) {
  console.error('❌  Échec :', error)
  process.exit(1)
}

console.log('✅  Email envoyé avec succès !')
console.log('    ID Resend :', data?.id)
