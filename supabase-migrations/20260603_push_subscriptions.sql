-- Migration : table des abonnements push PWA
-- À exécuter dans l'éditeur SQL Supabase

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT       NOT NULL,
  endpoint    TEXT        NOT NULL UNIQUE,
  keys        JSONB       NOT NULL,           -- { p256dh, auth }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour lookup rapide par email client
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email
  ON push_subscriptions (client_email);

-- RLS : uniquement le service role (admin) peut lire/écrire
-- Les opérations passent toutes par les API routes (createAdminClient)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON push_subscriptions
  USING (false)
  WITH CHECK (false);
