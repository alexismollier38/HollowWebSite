# Déploiement

Cible unique : **auto-hébergement**, image Docker `output: 'standalone'` derrière un
reverse proxy. Vercel n'est pas configuré (décision du client, voir [PLAN.md](PLAN.md)).

## Variables d'environnement

Elles sont validées au build par `lib/env.ts` : **une variable requise absente fait
échouer `pnpm build`**. C'est voulu, et la CI le vérifie explicitement dans le job
« Une variable manquante casse le build ».

| Variable                      | Requise | Rôle                                                                                                                                   |
| ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_URL_SITE`        | oui     | Origine publique, sans barre oblique finale. Canoniques et sitemap.                                                                    |
| `NEXT_PUBLIC_URL_DISCORD`     | oui     | Invitation Discord : l'action primaire du site.                                                                                        |
| `NEXT_PUBLIC_URL_LAUNCHER`    | oui     | URL publique de téléchargement du launcher Hollow.                                                                                     |
| `NEXT_PUBLIC_ADRESSE_SERVEUR` | non     | `hôte:port`. Vide tant que le serveur n'est pas ouvert : le bloc d'adresse reste alors masqué au lieu d'afficher une adresse inventée. |

⚠️ Ces variables sont **figées dans le bundle au moment du build**. Les changer impose
de reconstruire l'image ; les passer au `docker run` n'aura aucun effet.

## Construire et lancer

```bash
docker build \
  --build-arg NEXT_PUBLIC_URL_SITE=https://hollow.example \
  --build-arg NEXT_PUBLIC_URL_DISCORD=https://discord.gg/votre-invitation \
  --build-arg NEXT_PUBLIC_URL_LAUNCHER=https://hollow.example/launcher \
  -t hollow-site:latest .
```

```bash
docker run -d --name hollow-site -p 127.0.0.1:3000:3000 hollow-site:latest
```

Le conteneur tourne sous un utilisateur non privilégié (`hollow`, uid 1001) et n'expose
que le port 3000. Publiez-le sur `127.0.0.1` : c'est le reverse proxy qui fait face à
Internet.

## Reverse proxy

Deux en-têtes doivent être transmis, sinon le site se trompe sur son propre contexte :

- `X-Forwarded-Proto` — sans lui, la directive `upgrade-insecure-requests` de la CSP
  n'est pas posée, parce que le site croit être servi en HTTP.
- `X-Forwarded-Host` et `X-Forwarded-For` — pour les journaux et les URL absolues.

Exemple minimal, nginx :

```nginx
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   X-Forwarded-Host  $host;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";
}
```

Le reverse proxy **ne doit pas** réécrire la `Content-Security-Policy` : elle est
composée par requête à partir des empreintes des scripts de la page servie (voir
[ARCHITECTURE.md](ARCHITECTURE.md)). L'écraser casserait tous les scripts du site.

HSTS est déjà émis par l'application. Ne le doublez pas dans nginx : deux en-têtes
identiques valent mieux qu'un seul mal réglé, mais deux en-têtes divergents sont un
bogue difficile à voir.

## Le piège de l'écoute réseau

L'image fixe `HOSTNAME="::"`, écoute en double pile. **Ne le remplacez pas par
`127.0.0.1` ni par `0.0.0.0`.**

Le routage de langue réécrit « / » vers « /fr », et Next construit cette réécriture
avec l'hôte `localhost`. Si le serveur n'écoute qu'en IPv4, `localhost` se résout
d'abord en `::1`, Next ne se reconnaît pas comme destinataire, croit à une cible
externe, tente de relayer la requête, échoue — et « / » se redirige indéfiniment sur
lui-même. Le message d'erreur ne parle que de connexion refusée : on peut y passer une
soirée.

## Vérifier un déploiement

```bash
curl -sI https://hollow.example/ | grep -i "content-security-policy\|strict-transport"
```

La politique doit contenir `script-src 'self' 'sha256-…'`, et **ni `unsafe-inline`, ni
`unsafe-eval`**. Si les empreintes manquent, c'est que `.next/csp-hashes.json` n'a pas
été copié dans l'image : le site s'affichera mais rien ne s'hydratera.

## Ce qui n'est pas encore fait

Analytics auto-hébergées (Umami ou Plausible), sauvegardes, supervision. Prévu au lot 6.
