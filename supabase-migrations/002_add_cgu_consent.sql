-- Ajout des colonnes de preuve de consentement RGPD sur la table clients
-- cgu_accepted_at  : horodatage ISO 8601 du consentement (nullable pour les anciens comptes)
-- cgu_accepted_version : version des CGU/politique acceptée ("v1.0", "v1.1"…)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cgu_accepted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cgu_accepted_version TEXT;
