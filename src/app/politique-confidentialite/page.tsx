import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Politique de confidentialité — Orlyo',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A23] mb-3">{title}</h2>
      <div className="text-[#374151] leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span className="font-semibold text-[#1A1A23]">Politique de confidentialité</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-[#6B7280] text-sm mb-8">Dernière mise à jour : janvier 2025</p>

        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données personnelles collectées via Orlyo est :
          </p>
          <div className="bg-white rounded-xl p-4 text-sm font-mono">
            <p>Orlyo SAS</p>
            <p>Contact : <a href="mailto:dpo@getorlyo.com" className="text-[#2D4A8A] hover:underline">dpo@getorlyo.com</a></p>
          </div>
        </Section>

        <Section title="2. Données collectées">
          <p>Orlyo collecte les catégories de données suivantes :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Données d&apos;identité :</strong> nom, adresse email</li>
            <li><strong>Données de fidélité :</strong> nombre de points cumulés, historique des visites, récompenses obtenues</li>
            <li><strong>Données techniques :</strong> identifiant unique QR code, date d&apos;inscription, date de dernière visite</li>
            <li><strong>Données commerçants :</strong> nom du commerce, secteur d&apos;activité, paramètres du programme de fidélité</li>
          </ul>
          <p className="mt-2 text-sm text-[#6B7280]">
            Nous ne collectons pas de données sensibles (santé, opinions politiques, etc.), ni de données de paiement.
          </p>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont traitées pour les finalités suivantes :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Gestion et fonctionnement du programme de fidélité</li>
            <li>Attribution et suivi des points de fidélité</li>
            <li>Déclenchement et remise des récompenses</li>
            <li>Identification du client via son QR code personnel</li>
            <li>Communication entre commerçants et clients (avec consentement)</li>
          </ul>
          <p className="mt-3">
            <strong>Base légale :</strong> Exécution du contrat (programme de fidélité) et consentement explicite recueilli lors de l&apos;inscription.
          </p>
        </Section>

        <Section title="4. Durée de conservation">
          <p>Vos données sont conservées selon les durées suivantes :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Données clients actifs :</strong> pendant toute la durée de la relation commerciale, puis 3 ans après la dernière activité</li>
            <li><strong>Historique des scans :</strong> 3 ans à compter de la date du scan</li>
            <li><strong>Données commerçants :</strong> pendant la durée de l&apos;abonnement, puis 5 ans pour les obligations comptables</li>
          </ul>
          <p className="mt-2 text-sm text-[#6B7280]">
            À l&apos;expiration de ces délais, vos données sont supprimées ou anonymisées.
          </p>
        </Section>

        <Section title="5. Destinataires des données">
          <p>Vos données sont accessibles aux destinataires suivants :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Le commerçant concerné</strong> — peut consulter votre nom, email et historique de points dans son espace de gestion</li>
            <li><strong>Supabase (sous-traitant)</strong> — hébergement de la base de données, serveurs en Europe (UE)</li>
            <li><strong>Vercel (sous-traitant)</strong> — hébergement de l&apos;application, conforme au RGPD</li>
          </ul>
          <p className="mt-2">Vos données ne sont jamais vendues à des tiers.</p>
        </Section>

        <Section title="6. Vos droits">
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Droit d&apos;accès</strong> — obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification</strong> — corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit à l&apos;effacement</strong> — demander la suppression de vos données (&quot;droit à l&apos;oubli&quot;)</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible</li>
            <li><strong>Droit d&apos;opposition</strong> — vous opposer à certains traitements</li>
            <li><strong>Droit à la limitation</strong> — limiter le traitement de vos données</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez notre DPO à{' '}
            <a href="mailto:dpo@getorlyo.com" className="text-[#2D4A8A] hover:underline">dpo@getorlyo.com</a>.
            Nous répondrons dans un délai maximum de 30 jours.
          </p>
          <p className="mt-2">
            Vous pouvez également introduire une réclamation auprès de la{' '}
            <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :{' '}
            <span className="text-[#2D4A8A]">www.cnil.fr</span>.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            Orlyo utilise uniquement des cookies strictement nécessaires au fonctionnement de l&apos;application
            (session d&apos;authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            chiffrement des communications (HTTPS), authentification sécurisée, contrôle d&apos;accès par rôle (RLS Supabase),
            et hébergement chez des prestataires certifiés ISO 27001.
          </p>
        </Section>

        <Section title="9. Modifications">
          <p>
            Cette politique peut être mise à jour. En cas de modification substantielle, nous vous en informerons
            par email ou via l&apos;interface de l&apos;application. La version en vigueur est toujours disponible sur cette page.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
