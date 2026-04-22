export interface Palier {
  points: number
  libelle: string
}

export interface Commercant {
  id: string
  nom_commerce: string
  secteur_activite: string
  qr_code_id: string
  points_par_visite: number
  points_pour_recompense: number
  libelle_recompense: string
  couleur_principale: string
  logo_url: string | null
  abonnement_actif: boolean
  nom_programme: string
  message_bienvenue: string
  paliers: Palier[]
  created_at: string
}

export interface Client {
  id: string
  email: string
  nom: string
  qr_code_id: string
  created_at: string
}

export interface CarteFidelite {
  id: string
  commercant_id: string
  client_id: string
  client_email: string
  client_nom: string
  nombre_points: number
  points_cumules_total: number
  derniere_visite: string
  recompenses_obtenues: number
  created_at: string
}

export interface Scan {
  id: string
  carte_fidelite_id: string
  commercant_id: string
  points_ajoutes: number
  points_apres_scan: number
  recompense_declenchee: boolean
  created_at: string
}

export interface Recompense {
  id: string
  carte_fidelite_id: string
  commercant_id: string
  libelle: string
  utilisee: boolean
  date_obtention: string
  date_utilisation: string | null
}

export interface ScanResult {
  client: Client
  carte: CarteFidelite
  pointsAjoutes: number
  recompenseDeclenchee: boolean
  libelleRecompense: string
  pointsPourRecompense: number
  paliers: Palier[]
}
