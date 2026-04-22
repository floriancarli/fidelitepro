-- ============================================
-- FidèlePro — Schema Supabase (PostgreSQL)
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Table commercants
CREATE TABLE commercants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_commerce TEXT NOT NULL,
  secteur_activite TEXT NOT NULL DEFAULT '',
  qr_code_id TEXT UNIQUE NOT NULL,
  points_par_visite INT NOT NULL DEFAULT 1,
  points_pour_recompense INT NOT NULL DEFAULT 10,
  libelle_recompense TEXT NOT NULL DEFAULT 'Récompense offerte',
  couleur_principale TEXT NOT NULL DEFAULT '#534AB7',
  logo_url TEXT,
  abonnement_actif BOOLEAN NOT NULL DEFAULT false,
  nom_programme TEXT NOT NULL DEFAULT 'Programme de fidélité',
  message_bienvenue TEXT NOT NULL DEFAULT '',
  paliers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table clients (inscription unique, QR code personnel)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL DEFAULT '',
  qr_code_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table cartes_fidelite
CREATE TABLE cartes_fidelite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_email TEXT NOT NULL,
  client_nom TEXT NOT NULL DEFAULT '',
  nombre_points INT NOT NULL DEFAULT 0,
  points_cumules_total INT NOT NULL DEFAULT 0,
  derniere_visite TIMESTAMPTZ NOT NULL DEFAULT now(),
  recompenses_obtenues INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (commercant_id, client_email)
);

-- Table scans
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carte_fidelite_id UUID NOT NULL REFERENCES cartes_fidelite(id) ON DELETE CASCADE,
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  points_ajoutes INT NOT NULL DEFAULT 1,
  points_apres_scan INT NOT NULL DEFAULT 0,
  recompense_declenchee BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table recompenses
CREATE TABLE recompenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carte_fidelite_id UUID NOT NULL REFERENCES cartes_fidelite(id) ON DELETE CASCADE,
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  utilisee BOOLEAN NOT NULL DEFAULT false,
  date_obtention TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_utilisation TIMESTAMPTZ
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE commercants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartes_fidelite ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompenses ENABLE ROW LEVEL SECURITY;

-- Commercants
CREATE POLICY "commercant_select_public" ON commercants FOR SELECT USING (true);
CREATE POLICY "commercant_insert_own" ON commercants FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "commercant_update_own" ON commercants FOR UPDATE USING (auth.uid() = id);

-- Clients : lecture/écriture publique (pas d'auth côté client)
CREATE POLICY "clients_select_public" ON clients FOR SELECT USING (true);
CREATE POLICY "clients_insert_public" ON clients FOR INSERT WITH CHECK (true);

-- Cartes fidélité : lecture/écriture pour commerçants authentifiés + lecture publique par client_id
CREATE POLICY "cartes_select" ON cartes_fidelite FOR SELECT USING (true);
CREATE POLICY "cartes_insert_auth" ON cartes_fidelite FOR INSERT WITH CHECK (auth.uid() = commercant_id);
CREATE POLICY "cartes_update_auth" ON cartes_fidelite FOR UPDATE USING (auth.uid() = commercant_id);

-- Scans : insertion et lecture par commerçant authentifié
CREATE POLICY "scans_insert_auth" ON scans FOR INSERT WITH CHECK (auth.uid() = commercant_id);
CREATE POLICY "scans_select" ON scans FOR SELECT USING (
  auth.uid() = commercant_id
  OR EXISTS (SELECT 1 FROM cartes_fidelite cf WHERE cf.id = scans.carte_fidelite_id)
);

-- Récompenses : gestion par commerçant authentifié
CREATE POLICY "recompenses_insert_auth" ON recompenses FOR INSERT WITH CHECK (auth.uid() = commercant_id);
CREATE POLICY "recompenses_select" ON recompenses FOR SELECT USING (
  auth.uid() = commercant_id
  OR EXISTS (SELECT 1 FROM cartes_fidelite cf WHERE cf.id = recompenses.carte_fidelite_id)
);
CREATE POLICY "recompenses_update_own" ON recompenses FOR UPDATE USING (auth.uid() = commercant_id);

-- ============================================
-- Storage bucket pour les logos
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "logos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "logos_select" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "logos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

-- ============================================
-- Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE cartes_fidelite;
ALTER PUBLICATION supabase_realtime ADD TABLE scans;
