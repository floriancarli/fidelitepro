import Link from 'next/link'
import { QrCode, BarChart3, Gift, Mail, Check, ArrowRight, Star } from 'lucide-react'
import Logo from '@/components/Logo'

const avantages = [
  {
    icon: QrCode,
    titre: 'QR Code personnel',
    desc: 'Chaque client obtient son QR code unique. Le commerçant scanne en caisse en moins de 3 secondes.',
  },
  {
    icon: BarChart3,
    titre: 'Dashboard temps réel',
    desc: 'Suivez vos clients fidèles, les points distribués et les visites en direct.',
  },
  {
    icon: Gift,
    titre: 'Récompenses sur mesure',
    desc: 'Définissez vos propres paliers et récompenses selon votre activité.',
  },
  {
    icon: Mail,
    titre: 'Contact direct clients',
    desc: 'Exportez les emails de vos clients pour communiquer directement avec eux.',
  },
]

const pricing = [
  {
    nom: 'Starter',
    prix: '29',
    desc: 'Idéal pour démarrer',
    features: ['1 commerce', '200 clients max', 'QR code basique', 'Dashboard simple'],
    cta: 'Commencer',
    highlight: false,
  },
  {
    nom: 'Pro',
    prix: '49',
    desc: 'Le plus populaire',
    features: [
      'Personnalisation couleurs + logo',
      'Clients illimités',
      'Export emails',
      'Support email prioritaire',
    ],
    cta: 'Choisir Pro',
    highlight: true,
  },
  {
    nom: 'Premium',
    prix: '79',
    desc: 'Pour les multi-sites',
    features: [
      'Multi-sites',
      'Stats avancées',
      'Support prioritaire 24/7',
      'API access',
    ],
    cta: 'Contacter',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link href="/register" className="text-sm font-medium text-gray-600 hover:text-[#534AB7] transition-colors">
              Espace clients
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#534AB7] transition-colors">
              Commerçants
            </Link>
            <Link
              href="/inscription"
              className="bg-[#534AB7] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#3C3489] transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#534AB7] to-[#3C3489] text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Star size={14} className="text-yellow-300" fill="currentColor" />
            La solution fidélité n°1 pour les commerçants
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Fidélisez vos clients,<br />simplement.
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Un QR code unique affiché en caisse. Vos clients scannent, accumulent des points et reviennent pour leurs récompenses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/inscription"
              className="bg-white text-[#534AB7] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight size={18} />
            </Link>
            <a
              href="#comment"
              className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              Voir comment ça marche
            </a>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="py-20 px-6 bg-[#F9F9FB]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
          <p className="text-[#6B7280] mb-12">En 3 étapes simples</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', titre: 'Inscrivez-vous', desc: 'Créez votre compte commerçant en 2 minutes et recevez votre QR code unique.' },
              { num: '2', titre: 'Affichez votre QR code', desc: 'Imprimez ou affichez votre QR code en caisse. Vos clients le scannent avec leur téléphone.' },
              { num: '3', titre: 'Fidélisez vos clients', desc: 'Vos clients accumulent des points et reviennent pour débloquer leurs récompenses.' },
            ].map(({ num, titre, desc }) => (
              <div key={num} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#534AB7] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {num}
                </div>
                <h3 className="font-semibold text-lg mb-2">{titre}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-[#6B7280]">Des outils pensés pour les commerçants</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map(({ icon: Icon, titre, desc }) => (
              <div key={titre} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#534AB7]/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#534AB7]" />
                </div>
                <h3 className="font-semibold mb-2">{titre}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-[#F9F9FB]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p className="text-[#6B7280]">Sans engagement, sans frais cachés</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {pricing.map(({ nom, prix, desc, features, cta, highlight }) => (
              <div
                key={nom}
                className={`rounded-2xl p-8 relative ${
                  highlight
                    ? 'bg-[#534AB7] text-white shadow-xl'
                    : 'bg-white border border-gray-100 shadow-sm'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    ⭐ Le plus populaire
                  </div>
                )}
                <h3 className={`font-bold text-xl mb-1 ${highlight ? 'text-white' : ''}`}>{nom}</h3>
                <p className={`text-sm mb-4 ${highlight ? 'text-white/70' : 'text-[#6B7280]'}`}>{desc}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-bold ${highlight ? 'text-white' : 'text-[#1A1A23]'}`}>{prix}€</span>
                  <span className={`text-sm pb-1 ${highlight ? 'text-white/70' : 'text-[#6B7280]'}`}>/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${highlight ? 'text-white/90' : 'text-[#6B7280]'}`}>
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${highlight ? 'text-green-300' : 'text-[#0F6E56]'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/inscription"
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors ${
                    highlight
                      ? 'bg-white text-[#534AB7] hover:bg-gray-50'
                      : 'bg-[#534AB7] text-white hover:bg-[#3C3489]'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 bg-[#534AB7] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Prêt à fidéliser vos clients ?</h2>
          <p className="text-white/80 mb-8">Rejoignez des centaines de commerçants qui font confiance à FidèlePro.</p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-white text-[#534AB7] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Créer mon compte gratuitement
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-[#6B7280] text-sm">© 2025 FidèlePro SAS. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm text-[#6B7280]">
            <Link href="/mentions-legales" className="hover:text-[#534AB7]">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-[#534AB7]">Confidentialité</Link>
            <a href="mailto:contact@fidelepro.fr" className="hover:text-[#534AB7]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
