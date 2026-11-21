/**
 * Rapprochement des patients du Cabinet par nom et prénom.
 * La clé ignore la casse, les accents, la ponctuation et l'ordre (« Jean Dupont » = « DUPONT jean »).
 */
export function cleNom(prenom: unknown, nom: unknown): string {
  const brut = `${prenom ?? ''} ${nom ?? ''}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!brut) return '';
  return brut.split(' ').filter(Boolean).sort().join(' ');
}

/** Retire le HTML d'un document riche pour en lire le texte brut. */
export function texteBrut(html: unknown): string {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/**
 * Lit « Nom et prénom : Jean Dupont » dans un document (prescription, synthèse…).
 * Retourne null si la ligne est absente, vide ou encore à l'état de modèle « [Nom du patient] ».
 */
export function nomDansDocument(contenu: unknown): { prenom: string; nom: string } | null {
  const m = texteBrut(contenu).match(/Nom\s+et\s+pr[ée]nom\s*:\s*([^\n\r]+)/i);
  if (!m) return null;
  const val = m[1].trim();
  if (!val || /[\[\]]/.test(val) || val.length > 80) return null;
  const mots = val.split(/\s+/);
  if (mots.length < 2) return null;
  // Convention du site : « Prénom Nom » → le premier mot est le prénom, le reste le nom.
  return { prenom: mots[0], nom: mots.slice(1).join(' ') };
}
