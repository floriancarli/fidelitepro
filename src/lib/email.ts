import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getorlyo.com'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function fromAddress(nomCommerce: string) {
  return `${nomCommerce} <noreply@getorlyo.com>`
}

function baseTemplate(color: string, body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Fidélité</title>
</head>
<body style="margin:0;padding:0;background:#F9F9FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9FB;padding:32px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E5E7EB">
        <tr>
          <td style="background:${color};padding:28px 32px">
            <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.05em;text-transform:uppercase">Programme de fidélité</p>
          </td>
        </tr>
        <tr><td style="padding:32px">${body}</td></tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #F3F4F6;background:#FAFAFA">
            <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center">
              Vous recevez cet email car vous êtes inscrit(e) au programme de fidélité.<br/>
              <a href="${APP_URL}/register" style="color:#9CA3AF">Gérer mes préférences</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string, color: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;background:${color};color:#fff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:12px;text-decoration:none">${label}</a>`
}

// ── Presque là ────────────────────────────────────────────────────────────────

type AlmostThereParams = {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
  pointsActuels: number
  pointsManquants: number
  libelleProchainPalier: string
  pointsProchainPalier: number
}

export async function sendAlmostThereEmail(p: AlmostThereParams) {
  const pct = Math.round((p.pointsActuels / p.pointsProchainPalier) * 100)
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A23">
      Tu es presque là, ${p.clientNom}&nbsp;! 🎁
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.5">
      Il ne te manque que <strong style="color:#1A1A23">${p.pointsManquants} point${p.pointsManquants > 1 ? 's' : ''}</strong>
      pour débloquer&nbsp;:
    </p>

    <div style="background:#F9F9FB;border-radius:14px;padding:20px 24px;border:1px solid #E5E7EB">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em">Prochaine récompense</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1A1A23">${p.libelleProchainPalier}</p>
      <p style="margin:4px 0 16px;font-size:13px;color:#6B7280">chez ${p.nomCommerce}</p>

      <div style="background:#E5E7EB;border-radius:999px;height:10px;overflow:hidden">
        <div style="background:${p.couleur};width:${pct}%;height:100%;border-radius:999px"></div>
      </div>
      <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;text-align:right">
        ${p.pointsActuels} / ${p.pointsProchainPalier} pts
      </p>
    </div>

    ${ctaButton(`${APP_URL}/mon-qr-code/${p.clientQrCodeId}`, 'Voir ma carte', p.couleur)}
  `

  return getResend().emails.send({
    from: fromAddress(p.nomCommerce),
    to: p.clientEmail,
    subject: `Plus que ${p.pointsManquants} point${p.pointsManquants > 1 ? 's' : ''} pour ta récompense chez ${p.nomCommerce} 🎁`,
    html: baseTemplate(p.couleur, body),
  })
}

// ── Relance J+7 "toujours presque là" ────────────────────────────────────────

type RelanceJ7Params = {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
  pointsActuels: number
  pointsManquants: number
  libelleProchainPalier: string
  pointsProchainPalier: number
}

export async function sendRelanceJ7Email(p: RelanceJ7Params) {
  const pct = Math.round((p.pointsActuels / p.pointsProchainPalier) * 100)
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A23">
      Tu es toujours à ${p.pointsManquants} point${p.pointsManquants > 1 ? 's' : ''} de ta récompense&nbsp;🎁
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.5">
      Reviens nous voir chez <strong style="color:#1A1A23">${p.nomCommerce}</strong> pour la débloquer&nbsp;!
    </p>

    <div style="background:#F9F9FB;border-radius:14px;padding:20px 24px;border:1px solid #E5E7EB">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em">Ta récompense t'attend</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1A1A23">${p.libelleProchainPalier}</p>
      <p style="margin:4px 0 16px;font-size:13px;color:#6B7280">chez ${p.nomCommerce}</p>

      <div style="background:#E5E7EB;border-radius:999px;height:10px;overflow:hidden">
        <div style="background:${p.couleur};width:${pct}%;height:100%;border-radius:999px"></div>
      </div>
      <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;text-align:right">
        ${p.pointsActuels} / ${p.pointsProchainPalier} pts
      </p>
    </div>

    ${ctaButton(`${APP_URL}/mon-qr-code/${p.clientQrCodeId}`, 'Voir ma carte', p.couleur)}
  `

  return getResend().emails.send({
    from: fromAddress(p.nomCommerce),
    to: p.clientEmail,
    subject: `Tu es toujours à ${p.pointsManquants} point${p.pointsManquants > 1 ? 's' : ''} de "${p.libelleProchainPalier}" chez ${p.nomCommerce} 🎁`,
    html: baseTemplate(p.couleur, body),
  })
}

// ── Relance inactivité ────────────────────────────────────────────────────────

type RelanceParams = {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
  nombrePoints: number
  joursInactif: number
  libelleProchainPalier: string | null
  pointsManquants: number | null
}

export async function sendRelanceEmail(p: RelanceParams) {
  const motivationBlock = p.libelleProchainPalier && p.pointsManquants !== null
    ? `<div style="background:#F9F9FB;border-radius:14px;padding:20px 24px;margin:20px 0;border:1px solid #E5E7EB">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em">Ta prochaine récompense</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1A1A23">${p.libelleProchainPalier}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6B7280">
          Plus que <strong style="color:#1A1A23">${p.pointsManquants} point${p.pointsManquants > 1 ? 's' : ''}</strong> chez ${p.nomCommerce}
        </p>
      </div>`
    : ''

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A23">
      On ne t'a pas vu depuis un moment, ${p.clientNom}&nbsp;👋
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:#6B7280;line-height:1.5">
      Cela fait <strong style="color:#1A1A23">${p.joursInactif} jours</strong> que tu n'es pas passé(e) chez
      <strong style="color:#1A1A23">${p.nomCommerce}</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B7280">
      Tu as <strong style="color:#1A1A23">${p.nombrePoints} point${p.nombrePoints > 1 ? 's' : ''}</strong> en attente sur ta carte.
    </p>
    ${motivationBlock}
    ${ctaButton(`${APP_URL}/mon-qr-code/${p.clientQrCodeId}`, 'Voir ma carte de fidélité', p.couleur)}
  `

  return getResend().emails.send({
    from: fromAddress(p.nomCommerce),
    to: p.clientEmail,
    subject: `${p.nomCommerce} vous manque ! Vos ${p.nombrePoints} points vous attendent 👋`,
    html: baseTemplate(p.couleur, body),
  })
}

// ── Suppression compte commerçant (RGPD Art. 17) ─────────────────────────────

export async function sendAccountDeletedMerchantEmail({
  to,
  nomCommerce,
}: {
  to: string
  nomCommerce: string
}) {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1A1A23">
      Votre compte Orlyo a été supprimé
    </h1>
    <p style="margin:0 0 12px;font-size:15px;color:#6B7280;line-height:1.6">
      Bonjour,<br/>
      Votre compte <strong style="color:#1A1A23">${nomCommerce}</strong> sur Orlyo a bien été supprimé conformément au RGPD Article 17 (droit à l'effacement).
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#6B7280;line-height:1.6">
      Votre abonnement Stripe a été résilié. Vos données personnelles ont été effacées de notre base de production.
    </p>
    <div style="background:#F9F9FB;border-radius:14px;padding:16px 20px;border:1px solid #E5E7EB;margin:0 0 16px">
      <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6">
        Conformément à l'article L123-22 du Code de commerce, vos factures sont conservées chez Stripe pendant 10 ans.<br/>
        Vos données ont été supprimées de notre base de production. Les sauvegardes seront purgées sous 30 jours conformément au RGPD.
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6">
      Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement à
      <a href="mailto:contact@orlyo.fr" style="color:#2D4A8A">contact@orlyo.fr</a>.
    </p>
  `
  return getResend().emails.send({
    from: 'Orlyo <noreply@getorlyo.com>',
    to,
    subject: 'Confirmation de suppression de votre compte Orlyo',
    html: baseTemplate('#2D4A8A', body),
  })
}

// ── Suppression compte client (RGPD Art. 17) ──────────────────────────────────

export async function sendAccountDeletedClientEmail({ to }: { to: string }) {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1A1A23">
      Votre compte Orlyo a été supprimé
    </h1>
    <p style="margin:0 0 12px;font-size:15px;color:#6B7280;line-height:1.6">
      Bonjour,<br/>
      Votre compte Orlyo a bien été supprimé conformément au RGPD Article 17 (droit à l'effacement).
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#6B7280;line-height:1.6">
      Vos données de fidélité ont été anonymisées chez tous vos commerçants.
    </p>
    <div style="background:#F9F9FB;border-radius:14px;padding:16px 20px;border:1px solid #E5E7EB;margin:0 0 16px">
      <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6">
        Vos données ont été supprimées de notre base de production. Les sauvegardes seront purgées sous 30 jours conformément au RGPD.
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6">
      Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement à
      <a href="mailto:contact@orlyo.fr" style="color:#2D4A8A">contact@orlyo.fr</a>.
    </p>
  `
  return getResend().emails.send({
    from: 'Orlyo <noreply@getorlyo.com>',
    to,
    subject: 'Confirmation de suppression de votre compte Orlyo',
    html: baseTemplate('#2D4A8A', body),
  })
}
