-- Migration 006 : index pour optimiser les policies RLS (Auth RLS Initialization Plan)
-- Ces index permettent à Postgres d'évaluer auth.uid() une seule fois par requête
-- en mappant directement la colonne d'identité sans full scan.

CREATE INDEX IF NOT EXISTS idx_commercants_auth ON public.commercants(id);
CREATE INDEX IF NOT EXISTS idx_clients_auth ON public.clients(id);
CREATE INDEX IF NOT EXISTS idx_cartes_fidelite_auth ON public.cartes_fidelite(client_id, commercant_id);
CREATE INDEX IF NOT EXISTS idx_scans_auth ON public.scans(commercant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_recompenses_auth ON public.recompenses(commercant_id);
