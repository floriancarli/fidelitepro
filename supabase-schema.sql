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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table cartes_fidelite
CREATE TABLE cartes_fidelite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  client_prenom TEXT NOT NULL DEFAULT '',
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
ALTER TABLE cartes_fidelite ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompenses ENABLE ROW LEVEL SECURITY;

-- Commercants : lecture et modification par le propriétaire
CREATE POLICY "commercant_select_own" ON commercants
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "commercant_insert_own" ON commercants
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "commercant_update_own" ON commercants
  FOR UPDATE USING (auth.uid() = id);

-- Lecture publique pour les pages /scan (par qr_code_id)
CREATE POLICY "commercant_public_read_by_qr" ON commercants
  FOR SELECT USING (true);

-- Cartes fidélité : lecture/écriture publique (le client n'est pas connecté)
-- La sécurité est assurée par la logique applicative + unicité email+commercant
CREATE POLICY "cartes_insert_public" ON cartes_fidelite
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cartes_select_public" ON cartes_fidelite
  FOR SELECT USING (true);

CREATE POLICY "cartes_update_public" ON cartes_fidelite
  FOR UPDATE USING (true);

-- Le commerçant peut voir ses propres cartes (vue dashboard)
-- (couvert par la politique publique ci-dessus)

-- Scans : insertion publique, lecture par commerçant
CREATE POLICY "scans_insert_public" ON scans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "scans_select_own" ON scans
  FOR SELECT USING (
    auth.uid() = commercant_id
    OR EXISTS (
      SELECT 1 FROM cartes_fidelite cf
      WHERE cf.id = scans.carte_fidelite_id
    )
  );

-- Récompenses : insertion publique, lecture/mise à jour par commerçant
CREATE POLICY "recompenses_insert_public" ON recompenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "recompenses_select" ON recompenses
  FOR SELECT USING (
    auth.uid() = commercant_id
    OR EXISTS (
      SELECT 1 FROM cartes_fidelite cf
      WHERE cf.id = recompenses.carte_fidelite_id
    )
  );

CREATE POLICY "recompenses_update_own" ON recompenses
  FOR UPDATE USING (auth.uid() = commercant_id);

-- ============================================
-- Storage bucket pour les logos
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

-- ============================================
-- Activer Realtime sur les tables dashboard
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE cartes_fidelite;
ALTER PUBLICATION supabase_realtime ADD TABLE scans;
