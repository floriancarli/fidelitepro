-- ============================================================
-- Migration 001 — Correction des policies RLS trop permissives
-- ============================================================
-- À exécuter dans l'éditeur SQL de Supabase (Production)
-- TESTER D'ABORD sur une instance de dev/staging.
--
-- Contexte : les policies précédentes utilisaient USING (true)
-- permettant à n'importe qui avec la clé anon de lire toute la base.
-- ============================================================


-- ============================================================
-- TABLE : clients
-- ============================================================
-- Avant : SELECT USING (true) — lecture anonyme de tous les clients
-- Après : un client ne peut lire que son propre enregistrement
--         (email = auth.email() depuis sa session Supabase Auth)

DROP POLICY IF EXISTS "clients_select_public" ON clients;

CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (email = auth.email());

-- INSERT reste accessible à tout utilisateur authentifié.
-- La route /join fait le signUp puis l'insert dans la même session.
-- Note : WITH CHECK (email = auth.email()) serait plus strict mais
-- nécessite de confirmer que la session est toujours active au moment
-- de l'insert (edge case email-confirmation).
-- TODO : restreindre à WITH CHECK (email = auth.email()) une fois confirmé.


-- ============================================================
-- TABLE : cartes_fidelite
-- ============================================================
-- Avant : SELECT USING (true) — lecture anonyme de toutes les cartes
-- Après :
--   • un commerçant voit ses propres cartes (auth.uid() = commercant_id)
--   • un client voit ses propres cartes (client_email = auth.email())

DROP POLICY IF EXISTS "cartes_select" ON cartes_fidelite;

CREATE POLICY "cartes_fidelite_select_own" ON cartes_fidelite
  FOR SELECT USING (
    auth.uid() = commercant_id
    OR client_email = auth.email()
  );


-- ============================================================
-- TABLE : scans
-- ============================================================
-- Avant : SELECT avec OR EXISTS sur cartes_fidelite — toujours vrai
--         car la sous-requête ne filtre pas par commercant_id
-- Après : seul le commerçant qui a créé le scan peut le lire

DROP POLICY IF EXISTS "scans_select" ON scans;

CREATE POLICY "scans_select_own" ON scans
  FOR SELECT USING (auth.uid() = commercant_id);


-- ============================================================
-- TABLE : recompenses
-- ============================================================
-- Avant : SELECT avec OR EXISTS — même problème que scans
-- Après : seul le commerçant propriétaire peut lire ses récompenses

DROP POLICY IF EXISTS "recompenses_select" ON recompenses;

CREATE POLICY "recompenses_select_own" ON recompenses
  FOR SELECT USING (auth.uid() = commercant_id);


-- ============================================================
-- TABLE : commercants
-- ============================================================
-- INCHANGÉ — la policy "commercant_select_public" (USING (true)) est
-- intentionnellement maintenue pour permettre aux visiteurs non connectés
-- de voir le nom, le logo et les paliers du commerçant sur la page /join.
-- Les champs sensibles (abonnement_actif) sont acceptable à ce stade.
-- Amélioration future : créer une vue commercants_public_info avec
-- uniquement les champs nécessaires à /join.


-- ============================================================
-- VÉRIFICATION
-- ============================================================
-- Après exécution, tester :
-- 1. Connexion commerçant → dashboard fonctionne (cartes, scans, analytics)
-- 2. Connexion client → /mon-qr-code affiche bien ses propres cartes
-- 3. Appel anon : supabase.from('cartes_fidelite').select('*')
--    → doit retourner [] (aucune donnée sans session)
-- 4. Appel anon : supabase.from('clients').select('*')
--    → doit retourner [] (aucune donnée sans session)
-- 5. Route /join → inscription client fonctionne toujours
-- 6. Route /api/scan → scan commerçant fonctionne toujours
-- 7. PWA manifest /api/pwa/[id] → renvoie le bon manifest
-- 8. Crons → ne pas tester en prod (utiliser les logs Vercel)
