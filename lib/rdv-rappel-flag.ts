/* Marquage « rappel Discord déjà envoyé » des rendez-vous.
   Les agendas sont enregistrés par les navigateurs sous forme de liste complète : un navigateur qui enregistre avec
   une liste plus ancienne ne doit pas effacer le marquage posé côté serveur (le rappel serait renvoyé).
   Si la date, l'heure ou le(s) soignant(s) d'un rendez-vous change, le rappel est réarmé. */

interface RdvLike {
  id: string; date: string; heure: string;
  medecin?: string; medecinDiscordId?: string; medecinsSup?: { discord_id: string }[]; rappelEnvoye?: boolean;
}

function signature(r: RdvLike): string {
  return [r.date, r.heure, r.medecin ?? '', r.medecinDiscordId ?? '', ...(r.medecinsSup ?? []).map(s => s.discord_id).sort()].join('|');
}

export function keepRappelFlag<T extends RdvLike>(before: T[], incoming: T[]): T[] {
  return incoming.map(r => {
    const old = before.find(x => x.id === r.id);
    if (old && old.rappelEnvoye && signature(old) === signature(r)) return { ...r, rappelEnvoye: true };
    const { rappelEnvoye, ...reste } = r;
    return reste as T;
  });
}
