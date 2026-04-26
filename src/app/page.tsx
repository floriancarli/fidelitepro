import Link from 'next/link'
import { QrCode, BarChart3, Gift, Mail, Check, ArrowRight, Star, ChevronDown } from 'lucide-react'
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
    titre: 'Notifications automatiques',
    desc: 'Relances email automatiques pour fidéliser vos clients et les faire revenir.',
  },
]

const pricing = [
  {
    nom: 'Mensuel',
    prix: '39',
    desc: 'Sans engagement',
    badge: 'Le plus populaire',
    badgeStyle: 'popular',
    features: ['Clients illimités', '1 programme de fidélité', 'Notifications email', 'Support email'],
    cta: 'Commencer',
    highlight: true,
  },
  {
    nom: 'Annuel',
    prix: '29',
    desc: 'Économisez 120€/an',
    badge: 'Meilleure valeur',
    badgeStyle: 'value',
    facturation: 'Facturé 348€/an',
    features: ['Clients illimités', 'Programmes multiples', 'Notifications email', 'Analytics avancés', 'Export CSV', 'Support prioritaire', '🔜 Apple Wallet & Google Wallet — Bientôt disponible'],
    cta: 'Commencer',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#2D4A8A] transition-colors">
              Connexion
            </Link>
            <Link
              href="/pricing"
              className="bg-[#2D4A8A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1e3a6e] transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D4A8A] to-[#1e3a6e] text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Texte */}
            <div className="flex-1 lg:max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
                <Star size={14} className="text-yellow-300" fill="currentColor" />
                La carte de fidélité digitale pour les commerçants indépendants
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                Fidélisez vos clients,<br />simplement.
              </h1>
              <p className="text-xl text-white/80 mb-10">
                Un QR code unique affiché en caisse. Vos clients scannent, accumulent des points et reviennent pour leurs récompenses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/demo"
                  className="bg-[#F59E0B] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#e08900] transition-colors flex items-center justify-center gap-2"
                >
                  Voir la démo
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Mockup dashboard */}
            <div className="flex-1 w-full lg:max-w-lg">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden text-[#1A1A23] ring-1 ring-white/10">

                {/* Barre supérieure */}
                <div className="bg-[#F9FAFB] border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#2D4A8A]/10 flex items-center justify-center">
                      <BarChart3 size={12} className="text-[#2D4A8A]" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A23]">Dashboard — CroustyBrawl</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F59E0B] text-[#1B2B4B] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    <QrCode size={10} />
                    Scanner un client
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 p-3">
                  {[
                    { label: 'Clients fidèles', value: '47', colorText: 'text-[#2D4A8A]', colorBg: 'bg-[#2D4A8A]/8' },
                    { label: 'Scans ce mois', value: '128', colorText: 'text-[#0F6E56]', colorBg: 'bg-[#0F6E56]/8' },
                    { label: 'Points distribués', value: '892', colorText: 'text-yellow-600', colorBg: 'bg-yellow-50' },
                  ].map(({ label, value, colorText, colorBg }) => (
                    <div key={label} className={`${colorBg} rounded-xl p-2.5`}>
                      <p className={`text-base font-bold ${colorText}`}>{value}</p>
                      <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Liste clients */}
                <div className="px-3 pb-3">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Mes clients fidèles</p>
                  <div className="space-y-1.5">
                    {[
                      { nom: 'Marie Dupont', pts: 9, max: 10, pct: 90 },
                      { nom: 'Thomas Bernard', pts: 5, max: 10, pct: 50 },
                      { nom: 'Sophie Leclerc', pts: 3, max: 10, pct: 30 },
                      { nom: 'Julien Martin', pts: 7, max: 10, pct: 70 },
                    ].map(({ nom, pts, max, pct }) => (
                      <div key={nom} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="w-6 h-6 rounded-full bg-[#2D4A8A]/10 text-[#2D4A8A] text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {nom.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{nom}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 bg-gray-100 rounded-full h-1">
                              <div className="h-1 rounded-full bg-[#2D4A8A] transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] text-[#9CA3AF] whitespace-nowrap tabular-nums">{pts}/{max}</span>
                          </div>
                        </div>
                        <Star size={10} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
          <p className="text-[#6B7280] mb-12">En 3 étapes simples</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', titre: 'Inscrivez-vous', desc: 'Créez votre compte commerçant en 2 minutes et recevez votre QR code unique.' },
              { num: '2', titre: 'Affichez votre QR code', desc: 'Imprimez ou affichez votre QR code en caisse. Vos clients le scannent avec leur téléphone.' },
              { num: '3', titre: 'Fidélisez vos clients', desc: 'Vos clients accumulent des points et reviennent pour débloquer leurs récompenses.' },
            ].map(({ num, titre, desc }) => (
              <div key={num} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#2D4A8A] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
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
              <div key={titre} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#2D4A8A]/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#2D4A8A]" />
                </div>
                <h3 className="font-semibold mb-2">{titre}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p className="text-[#6B7280]">Sans frais cachés. Annulable à tout moment.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {pricing.map((p) => (
              <div
                key={p.nom}
                className={`rounded-2xl p-8 relative flex flex-col ${
                  p.highlight
                    ? 'bg-[#2D4A8A] text-white shadow-xl ring-2 ring-[#2D4A8A]'
                    : 'bg-white border-2 border-[#F59E0B] shadow-sm'
                }`}
              >
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap ${
                  p.badgeStyle === 'popular'
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-[#F59E0B] text-white'
                }`}>
                  ⭐ {p.badge}
                </div>
                <h3 className={`font-bold text-xl mb-1 ${p.highlight ? 'text-white' : 'text-[#1A1A23]'}`}>{p.nom}</h3>
                <p className={`text-sm mb-4 ${p.highlight ? 'text-white/70' : 'text-[#F59E0B] font-medium'}`}>
                  {p.desc}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-[#1A1A23]'}`}>{p.prix}€</span>
                  <span className={`text-sm pb-1 ${p.highlight ? 'text-white/70' : 'text-[#6B7280]'}`}>/mois</span>
                </div>
                {'facturation' in p && p.facturation && (
                  <p className={`text-xs mb-5 ${p.highlight ? 'text-white/60' : 'text-[#6B7280]'}`}>{p.facturation}</p>
                )}
                <ul className={`space-y-3 mb-8 flex-1 ${'facturation' in p && p.facturation ? '' : 'mt-5'}`}>
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-white/90' : 'text-[#6B7280]'}`}>
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${p.highlight ? 'text-green-300' : 'text-[#0F6E56]'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors ${
                    p.highlight
                      ? 'bg-white text-[#2D4A8A] hover:bg-gray-50'
                      : 'bg-[#F59E0B] text-[#1B2B4B] hover:bg-[#e08900]'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center mt-6 text-sm text-[#6B7280]">
            Paiement sécurisé par <span className="font-semibold text-[#635BFF]">Stripe</span>
          </p>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ils nous font confiance</h2>
            <p className="text-[#6B7280]">Des commerçants qui ont adopté Orlyo</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                commerce: 'Une boulangerie en Moselle',
                citation: 'En trois semaines on avait une quarantaine de clients inscrits. La mise en place a pris dix minutes, pas plus.',
                icone: '🥖',
              },
              {
                commerce: 'Un salon de coiffure à Lyon',
                citation: 'Avant j\'offrais des coupes à l\'œil. Maintenant tout est automatique et traçable. Les clients reviennent plus souvent.',
                icone: '✂️',
              },
              {
                commerce: 'Un restaurant à Bordeaux',
                citation: 'Le QR code est posé à l\'entrée. Les clients s\'inscrivent en attendant leur table. Simple et vraiment efficace.',
                icone: '🍽️',
              },
            ].map(({ commerce, citation, icone }) => (
              <div key={commerce} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
                <p className="text-[#374151] text-sm leading-relaxed flex-1">« {citation} »</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-[#2D4A8A]/10 flex items-center justify-center flex-shrink-0 text-xl">
                    {icone}
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A23]">{commerce}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Questions fréquentes</h2>
            <p className="text-[#6B7280]">Tout ce que vous devez savoir avant de commencer</p>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Est-ce que mes clients ont besoin d\'une application ?',
                r: 'Non. Vos clients scannent votre QR code avec l\'appareil photo de leur téléphone, s\'inscrivent en 30 secondes via leur navigateur, et reçoivent leur QR code personnel par email. Aucune app à télécharger.',
              },
              {
                q: 'Puis-je personnaliser mes récompenses ?',
                r: 'Oui, entièrement. Vous définissez vos propres paliers (ex : 5 points → café offert, 10 points → viennoiserie) et pouvez les modifier à tout moment depuis votre dashboard.',
              },
              {
                q: 'Comment mes clients accumulent-ils des points ?',
                r: 'À chaque visite, vous scannez leur QR code depuis votre dashboard. Un point (ou le nombre configuré) est automatiquement crédité. C\'est rapide : moins de 3 secondes en caisse.',
              },
              {
                q: 'Puis-je annuler à tout moment ?',
                r: 'Oui. L\'abonnement mensuel est sans engagement. L\'abonnement annuel peut être résilié à tout moment ; les mois restants ne sont pas remboursés mais votre accès reste actif jusqu\'à la fin de la période.',
              },
              {
                q: 'Mes données sont-elles sécurisées ?',
                r: 'Toutes les données sont hébergées en Europe (Irlande) chez Supabase, certifié SOC 2 Type II. Les connexions sont chiffrées en TLS. Nous ne revendons aucune donnée à des tiers.',
              },
            ].map(({ q, r }) => (
              <details key={q} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-medium text-[#1A1A23] list-none hover:bg-gray-50 transition-colors">
                  {q}
                  <ChevronDown size={18} className="flex-shrink-0 text-[#6B7280] transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-5 text-sm text-[#6B7280] leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 bg-[#2D4A8A] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Prêt à fidéliser vos clients ?</h2>
          <p className="text-white/80 mb-8">Rejoignez les premiers commerçants qui font confiance à Orlyo.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-white text-[#2D4A8A] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Voir les tarifs
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-[#6B7280] text-sm">© 2026 Orlyo. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm text-[#6B7280]">
            <Link href="/mentions-legales" className="hover:text-[#2D4A8A]">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-[#2D4A8A]">Confidentialité</Link>
            <a href="mailto:contact@getorlyo.com" className="hover:text-[#2D4A8A]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
