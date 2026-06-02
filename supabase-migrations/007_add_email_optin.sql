-- Migration 007 : opt-in email (lien de désinscription RGPD)
-- true par défaut — le client/commerçant peut se désinscrire via le lien dans les emails.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS email_optin BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.commercants
  ADD COLUMN IF NOT EXISTS email_optin BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.clients.email_optin IS 'Consentement emails marketing (relances). Modifiable via /api/unsubscribe.';
COMMENT ON COLUMN public.commercants.email_optin IS 'Consentement emails (résumé hebdo). Modifiable via /api/unsubscribe.';
