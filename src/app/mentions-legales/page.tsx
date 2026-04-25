import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Mentions légales — Orlyo',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A23] mb-3">{title}</h2>
      <div className="text-[#374151] leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-200 last:border-0">
      <span className="text-[#6B7280] text-sm w-40 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span className="font-semibold text-[#1A1A23]">Mentions légales</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Mentions légales</h1>
        <p className="text-[#6B7280] text-sm mb-8">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique.</p>

        <Section title="1. Éditeur du site">
          <div className="bg-white rounded-xl p-4">
            <InfoRow label="Raison sociale" value="Orlyo SAS" />
            <InfoRow label="Forme juridique" value="Société par Actions Simplifiée (SAS)" />
            <InfoRow label="Capital social" value="À compléter" />
            <InfoRow label="Siège social" value="À compléter" />
            <InfoRow label="SIRET" value="À compléter" />
            <InfoRow label="Email" value="contact@getorlyo.com" />
            <InfoRow label="Directeur de publication" value="À compléter" />
          </div>
        </Section>

        <Section title="2. Hébergement de l'application">
          <p>L&apos;application Orlyo est hébergée par :</p>
          <div className="bg-white rounded-xl p-4 mt-2">
            <InfoRow label="Société" value="Vercel Inc." />
            <InfoRow label="Adresse" value="440 N Barranca Ave #4133, Covina, CA 91723, États-Unis" />
            <InfoRow label="Site web" value="vercel.com" />
            <InfoRow label="Conformité RGPD" value="Data Processing Agreement disponible" />
          </div>
          <p className="text-sm text-[#6B7280] mt-2">
            Vercel est soumis au mécanisme de transfert Trans-Atlantique Data Privacy Framework approuvé par la Commission européenne.
          </p>
        </Section>

        <Section title="3. Hébergement de la base de données">
          <p>Les données sont stockées chez :</p>
          <div className="bg-white rounded-xl p-4 mt-2">
            <InfoRow label="Société" value="Supabase Inc." />
            <InfoRow label="Adresse" value="970 Toa Payoh North, #07-04, Singapour" />
            <InfoRow label="Région des données" value="Europe (eu-west-1 — Irlande)" />
            <InfoRow label="Site web" value="supabase.com" />
            <InfoRow label="Conformité RGPD" value="SOC 2 Type II, Data Processing Agreement disponible" />
          </div>
        </Section>

        <Section title="4. Propriété intellectuelle">
          <p>
            L&apos;ensemble du contenu de ce site (textes, images, logotypes, structure) est la propriété exclusive de
            Orlyo SAS et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification ou exploitation, totale ou partielle, du contenu de ce site
            est interdite sans autorisation écrite préalable de Orlyo SAS.
          </p>
        </Section>

        <Section title="5. Données personnelles">
          <p>
            Le traitement des données personnelles collectées via Orlyo est décrit dans notre{' '}
            <Link href="/politique-confidentialite" className="text-[#2D4A8A] hover:underline font-medium">
              Politique de confidentialité
            </Link>.
          </p>
          <p>
            Responsable du traitement : Orlyo SAS —{' '}
            <a href="mailto:dpo@getorlyo.com" className="text-[#2D4A8A] hover:underline">dpo@getorlyo.com</a>
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            Ce site utilise uniquement des cookies fonctionnels nécessaires au maintien de la session utilisateur.
            Aucun cookie publicitaire ou de mesure d&apos;audience tiers n&apos;est déposé sans consentement préalable.
          </p>
        </Section>

        <Section title="7. Limitation de responsabilité">
          <p>
            Orlyo SAS s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site.
            Toutefois, Orlyo SAS ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations
            mises à disposition sur ce site.
          </p>
          <p>
            Orlyo SAS décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur
            des informations disponibles sur ce site.
          </p>
        </Section>

        <Section title="8. Droit applicable">
          <p>
            Les présentes mentions légales sont soumises au droit français. Tout litige relatif à l&apos;utilisation
            du site sera soumis à la compétence exclusive des tribunaux français.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
