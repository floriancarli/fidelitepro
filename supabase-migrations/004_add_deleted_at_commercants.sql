-- Migration 004 — Ajout du champ deleted_at sur la table commercants
-- Permet de tracer la date d'anonymisation RGPD Art. 17 pour audit et support.
-- La FK commercants.id → auth.users(id) a été supprimée en migration 003.
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
