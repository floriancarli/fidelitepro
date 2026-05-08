-- Migration 005 — Table de déduplication des événements Stripe
-- Empêche le double-traitement lors des retries Stripe (jusqu'à 3 jours sur 5xx/timeout).
-- Écrite uniquement par service_role via le webhook — pas de RLS nécessaire.
CREATE TABLE stripe_processed_events (
  event_id     TEXT        PRIMARY KEY,
  event_type   TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
