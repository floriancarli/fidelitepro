'use client'

import { useEffect, useState, useCallback } from 'react'
import { PlusSquare, Smartphone, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Status =
  | 'loading'
  | 'installed'
  | 'ios'
  | 'android-ready'   // beforeinstallprompt capturé → un clic suffit
  | 'android-manual'  // Android mais prompt non disponible → instructions Chrome
  | 'desktop'

export default function InstallPrompt() {
  const [status, setStatus] = useState<Status>('loading')
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  useEffect(() => {
    // Déjà installée en mode standalone ?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true

    if (standalone) { setStatus('installed'); return }

    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    const isAndroid = /Android/i.test(ua)

    if (isIOS) {
      setStatus('ios')
    } else if (isAndroid) {
      setStatus('android-manual') // sera éventuellement upgradé si le prompt arrive
    } else {
      setStatus('desktop')
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setStatus('android-ready')
    }
    const onInstalled = () => {
      setStatus('installed')
      setPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleAndroidInstall = useCallback(async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setJustInstalled(true)
      setStatus('installed')
    }
    setPrompt(null)
  }, [prompt])

  /* ── Déjà installée ─────────────────────────────────────── */
  if (status === 'installed') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-[#0F6E56] text-sm">
        <CheckCircle size={16} />
        <span className="font-medium">
          {justInstalled ? 'Application installée !' : 'Déjà installée sur votre écran d\'accueil'}
        </span>
      </div>
    )
  }

  /* ── Android : un clic ──────────────────────────────────── */
  if (status === 'android-ready') {
    return (
      <button
        onClick={handleAndroidInstall}
        className="w-full flex items-center gap-3 bg-[#534AB7] text-white rounded-2xl px-5 py-4 hover:bg-[#3C3489] transition-colors shadow-md shadow-[#534AB7]/20"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Smartphone size={20} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">Ajouter à l&apos;écran d&apos;accueil</p>
          <p className="text-xs text-white/70">Accès direct en un clic, sans navigateur</p>
        </div>
        <PlusSquare size={20} className="opacity-70 flex-shrink-0" />
      </button>
    )
  }

  /* ── iOS ou Android manuel : instructions ───────────────── */
  if (status === 'ios' || status === 'android-manual') {
    const isIOS = status === 'ios'

    const steps = isIOS
      ? [
          {
            icon: <ShareIcon />,
            text: (
              <>
                Appuyez sur le bouton{' '}
                <strong>Partager</strong> (⬆) en bas de Safari
              </>
            ),
          },
          {
            icon: <span className="text-base">➕</span>,
            text: (
              <>
                Faites défiler et sélectionnez{' '}
                <strong>« Sur l&apos;écran d&apos;accueil »</strong>
              </>
            ),
          },
          {
            icon: <span className="text-base">✓</span>,
            text: (
              <>
                Appuyez sur <strong>« Ajouter »</strong> pour confirmer
              </>
            ),
          },
        ]
      : [
          {
            icon: <span className="text-base font-bold">⋮</span>,
            text: (
              <>
                Appuyez sur le menu <strong>⋮</strong> en haut à droite de Chrome
              </>
            ),
          },
          {
            icon: <span className="text-base">➕</span>,
            text: (
              <>
                Sélectionnez{' '}
                <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>
              </>
            ),
          },
          {
            icon: <span className="text-base">✓</span>,
            text: <>Confirmez l&apos;installation</>
          },
        ]

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#534AB7]/10 flex items-center justify-center flex-shrink-0">
            <Smartphone size={20} className="text-[#534AB7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[#1A1A23]">Ajouter à l&apos;écran d&apos;accueil</p>
            <p className="text-xs text-[#6B7280]">
              Accès rapide sans ouvrir {isIOS ? 'Safari' : 'Chrome'}
            </p>
          </div>
          {open
            ? <ChevronUp size={18} className="text-[#6B7280] flex-shrink-0" />
            : <ChevronDown size={18} className="text-[#6B7280] flex-shrink-0" />
          }
        </button>

        {open && (
          <div className="px-5 pb-5 border-t border-gray-50">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mt-4 mb-3">
              {isIOS ? 'Sur Safari (iPhone / iPad)' : 'Sur Chrome Android'}
            </p>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#534AB7]/10 flex items-center justify-center flex-shrink-0 text-[#534AB7]">
                    {step.icon}
                  </div>
                  <p className="text-sm text-[#6B7280] leading-snug pt-0.5">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    )
  }

  // Desktop ou loading : rien d'affiché
  return null
}

// Icône de partage iOS inline (plus fidèle visuellement que la police)
function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#534AB7]"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}
