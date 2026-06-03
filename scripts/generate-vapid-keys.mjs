// Génère les clés VAPID nécessaires pour les notifications push PWA.
// Exécuter une seule fois : node scripts/generate-vapid-keys.mjs
// Puis copier les valeurs dans .env.local et dans les variables d'env Vercel.

import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('\n✅ Clés VAPID générées — à ajouter dans .env.local et Vercel :\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('\n⚠️  Ne jamais committer VAPID_PRIVATE_KEY. NEXT_PUBLIC_VAPID_PUBLIC_KEY est publique.\n')
