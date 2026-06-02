import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getorlyo.com'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function fromAddress(nomCommerce: string) {
  return `${nomCommerce} <noreply@getorlyo.com>`
}

function unsubscribeLink(qrCodeId: string, type: 'client' | 'merchant') {
  return `${APP_URL}/api/unsubscribe?token=${qrCodeId}&type=${type}`
}

function baseTemplate(color: string, body: string, unsubUrl?: string) {
  const footerExtra = unsubUrl
    ? `<br/><a href="${unsubUrl}" style="color:#9CA3AF">Se désinscrire des emails</a>`
    : ''
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
              Vous recevez cet email car vous êtes inscrit(e) au programme de fidélité.${footerExtra}
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

// ── Bienvenue commerçant ──────────────────────────────────────────────────────

export async function sendWelcomeMerchantEmail({
  email,
  nomCommerce,
}: {
  email: string
  nomCommerce: string
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A23">
      Bienvenue sur Orlyo, ${nomCommerce}&nbsp;🎉
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.5">
      Votre compte est créé. Vous êtes à quelques minutes de fidéliser vos premiers clients.
    </p>

    <div style="background:#F9F9FB;border-radius:14px;padding:20px 24px;border:1px solid #E5E7EB;margin-bottom:24px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1A1A23;text-transform:uppercase;letter-spacing:0.05em">
        Pour démarrer en 3 étapes
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #E5E7EB">
            <span style="display:inline-block;width:22px;height:22px;background:#2D4A8A;color:#fff;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:22px;margin-right:10px">1</span>
            <span style="font-size:14px;color:#374151">Choisissez votre abonnement sur <strong>la page Tarifs</strong></span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #E5E7EB">
            <span style="display:inline-block;width:22px;height:22px;background:#2D4A8A;color:#fff;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:22px;margin-right:10px">2</span>
            <span style="font-size:14px;color:#374151">Configurez vos <strong>paliers de récompense</strong> dans le dashboard</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0">
            <span style="display:inline-block;width:22px;height:22px;background:#F59E0B;color:#fff;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:22px;margin-right:10px">3</span>
            <span style="font-size:14px;color:#374151">Imprimez ou affichez votre <strong>QR code d'inscription</strong> en caisse</span>
          </td>
        </tr>
      </table>
    </div>

    ${ctaButton(`${APP_URL}/dashboard`, 'Accéder au tableau de bord', '#2D4A8A')}

    <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF">
      Une question ? Répondez à cet email ou écrivez-nous à
      <a href="mailto:contact@getorlyo.com" style="color:#2D4A8A">contact@getorlyo.com</a>.
    </p>
  `
  return getResend().emails.send({
    from: 'Orlyo <noreply@getorlyo.com>',
    to: email,
    subject: `Bienvenue sur Orlyo, ${nomCommerce} 🎉`,
    html: baseTemplate('#2D4A8A', body),
  })
}

// ── Bienvenue client ──────────────────────────────────────────────────────────

export async function sendWelcomeClientEmail({
  clientEmail,
  clientNom,
  clientQrCodeId,
  nomCommerce,
  couleur,
}: {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A23">
      Ta carte est prête, ${clientNom}&nbsp;🎁
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.5">
      Tu es maintenant inscrit(e) au programme de fidélité de
      <strong style="color:#1A1A23">${nomCommerce}</strong>.
      Présente ton QR code à chaque passage en caisse pour cumuler des points.
    </p>

    <div style="background:#F9F9FB;border-radius:14px;padding:20px 24px;border:1px solid #E5E7EB;margin-bottom:24px;text-align:center">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em">
        Programme de fidélité
      </p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1A1A23">${nomCommerce}</p>
    </div>

    ${ctaButton(`${APP_URL}/mon-qr-code/${clientQrCodeId}`, 'Voir ma carte de fidélité', couleur)}
  `
  return getResend().emails.send({
    from: fromAddress(nomCommerce),
    to: clientEmail,
    subject: `Ta carte de fidélité ${nomCommerce} est prête 🎁`,
    html: baseTemplate(couleur, body, unsubscribeLink(clientQrCodeId, 'client')),
  })
}

// ── Récompense débloquée ──────────────────────────────────────────────────────

export async function sendRewardUnlockedEmail({
  clientEmail,
  clientNom,
  clientQrCodeId,
  nomCommerce,
  couleur,
  libelleRecompense,
}: {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
  libelleRecompense: string
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A23">
      Félicitations, ${clientNom}&nbsp;🎉
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.5">
      Tu as débloqué une récompense chez <strong style="color:#1A1A23">${nomCommerce}</strong>&nbsp;!
    </p>

    <div style="background:#F0FDF4;border-radius:14px;padding:20px 24px;border:2px solid #0F6E56;margin-bottom:24px;text-align:center">
      <p style="margin:0 0 4px;font-size:32px">🎁</p>
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0F6E56;text-transform:uppercase;letter-spacing:0.05em">
        Ta récompense
      </p>
      <p style="margin:0;font-size:22px;font-weight:700;color:#0F6E56">${libelleRecompense}</p>
    </div>

    <div style="background:#F9F9FB;border-radius:14px;padding:16px 20px;border:1px solid #E5E7EB;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">
        📍 <strong>Présente-toi en caisse</strong> chez ${nomCommerce} et montre cet email
        (ou ton QR code) pour bénéficier de ta récompense.
      </p>
    </div>

    ${ctaButton(`${APP_URL}/mon-qr-code/${clientQrCodeId}`, 'Voir mon QR code', couleur)}
  `
  return getResend().emails.send({
    from: fromAddress(nomCommerce),
    to: clientEmail,
    subject: `🎉 Tu as une récompense chez ${nomCommerce} !`,
    html: baseTemplate(couleur, body, unsubscribeLink(clientQrCodeId, 'client')),
  })
}

// ── Relance inactivité 15 jours ───────────────────────────────────────────────

export async function sendRelance15jEmail({
  clientEmail,
  clientNom,
  clientQrCodeId,
  nomCommerce,
  couleur,
  nombrePoints,
  libelleProchainPalier,
  pointsManquants,
}: {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
  nombrePoints: number
  libelleProchainPalier: string | null
  pointsManquants: number | null
}) {
  const motivationBlock = libelleProchainPalier && pointsManquants !== null
    ? `<div style="background:#F9F9FB;border-radius:14px;padding:16px 20px;border:1px solid #E5E7EB;margin:20px 0">
        <p style="margin:0 0 2px;font-size:13px;color:#6B7280">Prochaine récompense</p>
        <p style="margin:0;font-size:17px;font-weight:700;color:#1A1A23">${libelleProchainPalier}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6B7280">
          Plus que <strong style="color:#1A1A23">${pointsManquants} pt${pointsManquants > 1 ? 's' : ''}</strong> chez ${nomCommerce}
        </p>
      </div>`
    : ''

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A23">
      ${nomCommerce} a pensé à toi&nbsp;👋
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:#6B7280;line-height:1.5">
      Bonjour ${clientNom}, cela fait 2 semaines que tu n&apos;es pas passé(e) chez
      <strong style="color:#1A1A23">${nomCommerce}</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B7280">
      Tu as <strong style="color:#1A1A23">${nombrePoints} point${nombrePoints > 1 ? 's' : ''}</strong> en attente sur ta carte.
    </p>
    ${motivationBlock}
    ${ctaButton(`${APP_URL}/mon-qr-code/${clientQrCodeId}`, 'Voir ma carte', couleur)}
  `
  return getResend().emails.send({
    from: fromAddress(nomCommerce),
    to: clientEmail,
    subject: `${nomCommerce} a pensé à toi 👋`,
    html: baseTemplate(couleur, body, unsubscribeLink(clientQrCodeId, 'client')),
  })
}

// ── Relance inactivité 30 jours ───────────────────────────────────────────────

export async function sendRelance30jEmail({
  clientEmail,
  clientNom,
  clientQrCodeId,
  nomCommerce,
  couleur,
  nombrePoints,
  libelleProchainPalier,
  pointsManquants,
}: {
  clientEmail: string
  clientNom: string
  clientQrCodeId: string
  nomCommerce: string
  couleur: string
  nombrePoints: number
  libelleProchainPalier: string | null
  pointsManquants: number | null
}) {
  const motivationBlock = libelleProchainPalier && pointsManquants !== null
    ? `<div style="background:#FFF7ED;border-radius:14px;padding:16px 20px;border:1px solid #F59E0B40;margin:20px 0">
        <p style="margin:0 0 2px;font-size:13px;color:#92400e">Ta récompense t&apos;attend</p>
        <p style="margin:0;font-size:17px;font-weight:700;color:#1A1A23">${libelleProchainPalier}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#92400e">
          Encore <strong>${pointsManquants} pt${pointsManquants > 1 ? 's' : ''}</strong> et c&apos;est à toi&nbsp;!
        </p>
      </div>`
    : ''

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A23">
      Tu nous manques chez ${nomCommerce}&nbsp;😊
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:#6B7280;line-height:1.5">
      Bonjour ${clientNom}, cela fait un mois que tu n&apos;es pas passé(e).
      Tes <strong style="color:#1A1A23">${nombrePoints} point${nombrePoints > 1 ? 's' : ''}</strong> t&apos;attendent toujours&nbsp;!
    </p>
    ${motivationBlock}
    ${ctaButton(`${APP_URL}/mon-qr-code/${clientQrCodeId}`, 'Reprendre ma fidélité', couleur)}
  `
  return getResend().emails.send({
    from: fromAddress(nomCommerce),
    to: clientEmail,
    subject: `Tu nous manques chez ${nomCommerce} 😊`,
    html: baseTemplate(couleur, body, unsubscribeLink(clientQrCodeId, 'client')),
  })
}

// ── Résumé hebdomadaire commerçant ────────────────────────────────────────────

export async function sendWeeklySummaryEmail({
  email,
  nomCommerce,
  merchantQrCodeId,
  scansTotal,
  scansDelta,
  nouveauxClients,
  recompensesDebloquees,
  clientsInactifs,
}: {
  email: string
  nomCommerce: string
  merchantQrCodeId: string
  scansTotal: number
  scansDelta: number
  nouveauxClients: number
  recompensesDebloquees: number
  clientsInactifs: number
}) {
  const deltaSign = scansDelta >= 0 ? '+' : ''
  const deltaColor = scansDelta >= 0 ? '#0F6E56' : '#DC2626'

  const statBlock = (label: string, value: string | number, extra = '') => `
    <td style="padding:12px 16px;text-align:center">
      <p style="margin:0;font-size:26px;font-weight:800;color:#1A1A23">${value}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#6B7280">${label}</p>
      ${extra ? `<p style="margin:2px 0 0;font-size:11px;font-weight:600;color:${deltaColor}">${extra}</p>` : ''}
    </td>`

  const body = `
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1A1A23">
      Votre semaine chez ${nomCommerce}&nbsp;📊
    </h1>
    <p style="margin:0 0 24px;font-size:13px;color:#9CA3AF">
      Résumé du lundi au dimanche dernier
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9FB;border-radius:14px;border:1px solid #E5E7EB;margin-bottom:24px">
      <tr>
        ${statBlock('Scans cette semaine', scansTotal, `${deltaSign}${scansDelta} vs sem. préc.`)}
        <td style="width:1px;background:#E5E7EB"></td>
        ${statBlock('Nouveaux clients', nouveauxClients)}
        <td style="width:1px;background:#E5E7EB"></td>
        ${statBlock('Récompenses', recompensesDebloquees)}
      </tr>
    </table>

    ${clientsInactifs > 0 ? `
    <div style="background:#FFF7ED;border-radius:14px;padding:16px 20px;border:1px solid #F59E0B40;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#92400e;line-height:1.5">
        ⚠️ <strong>${clientsInactifs} client${clientsInactifs > 1 ? 's' : ''}</strong>
        n&apos;${clientsInactifs > 1 ? 'ont' : 'a'} pas été scanné${clientsInactifs > 1 ? 's' : ''} depuis plus de 30 jours.
        Des emails de relance automatiques leur ont été envoyés.
      </p>
    </div>` : `
    <div style="background:#F0FDF4;border-radius:14px;padding:16px 20px;border:1px solid #0F6E5640;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#0F6E56">
        ✅ Tous vos clients sont actifs cette semaine. Excellent&nbsp;!
      </p>
    </div>`}

    ${ctaButton(`${APP_URL}/dashboard/analytics`, 'Voir les analytics détaillés', '#2D4A8A')}
  `
  return getResend().emails.send({
    from: 'Orlyo <noreply@getorlyo.com>',
    to: email,
    subject: `Votre résumé de la semaine - Orlyo 📊`,
    html: baseTemplate('#2D4A8A', body, unsubscribeLink(merchantQrCodeId, 'merchant')),
  })
}
