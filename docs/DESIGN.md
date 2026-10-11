# Hollow — direction artistique

**Statut : direction fournie par le client le 28 août 2026, reprise à l'identique.**

Ce document ne propose plus rien : il décrit ce qui est en place et note les rares
endroits où je me suis écarté de la maquette, avec la raison. La proposition
précédente — encre et papier, tranche de grimoire, Fraunces et Alegreya Sans — est
abandonnée ; elle reste consultable dans l'historique git.

---

## 1. Le concept

Un seul écran. Une illustration plein cadre en panoramique lent, un orage rouge qui
bat au loin, des braises qui montent, et au centre le mot-symbole de Hollow, la
baseline calée sous sa moitié droite, une seule action.

Rien d'autre. Pas de sections, pas de défilement, pas de sommaire.

---

## 2. Palette

Le noir domine, le rouge est la seule couleur, et il vient du mot-symbole : le trèfle
du logo, l'orage, les braises, le grimoire ouvert. Il n'y a pas de seconde teinte.

| Token                   | Valeur                 | Rôle                                                  |
| ----------------------- | ---------------------- | ----------------------------------------------------- |
| `--color-encre`         | `#0a0809`              | Fond de page.                                         |
| `--color-voile`         | `#060507`              | Le noir des quatre dégradés posés sur l'illustration. |
| `--color-parchemin`     | `oklch(0.93 0.012 85)` | Texte principal.                                      |
| `--color-parchemin-vif` | `oklch(0.98 0.01 85)`  | Survol, texte de l'action primaire.                   |
| `--color-estompe-clair` | `oklch(0.86 0.012 85)` | Liens de la barre haute.                              |
| `--color-estompe`       | `oklch(0.6 0.01 80)`   | Mentions légales, libellés discrets.                  |
| `--color-braise`        | `oklch(0.62 0.2 25)`   | Accent : bordure au survol, orage, anneau de focus.   |
| `--color-braise-vif`    | `oklch(0.68 0.2 27)`   | Les particules qui montent.                           |
| `--color-braise-sombre` | `oklch(0.55 0.2 25)`   | Séparateurs, sélection de texte.                      |

Les valeurs sont en OKLCH parce que la maquette l'est : les convertir en hexadécimal
aurait introduit un écart invisible dans un document et bien visible à l'écran.
`lib/tokens/contraste.ts` sait lire les deux notations, et `palette.test.ts` recalcule
chaque couple à chaque build.

**L'anneau de focus est un ajout.** La maquette n'en prévoyait aucun. Le rouge d'accent
est le seul choix cohérent et il tient le seuil de 3:1 sur l'encre.

---

## 3. Typographie

| Rôle    | Famille               | Où                                          |
| ------- | --------------------- | ------------------------------------------- |
| Display | **Clash Display** 400 | La baseline, les titres des pages de texte. |
| Corps   | **Satoshi** 400 / 500 | Actions, libellés, mentions.                |

Le mot-symbole est une **image**, pas du texte : aucune graisse d'affichage n'est
nécessaire pour le titre. Trois fichiers, 66 Ko au total.

### Licence — à connaître avant de toucher aux fontes

Clash Display et Satoshi appartiennent à l'Indian Type Foundry, sous **ITF Free Font
License**. Usage commercial et auto-hébergement autorisés ; **redistribution des
fichiers interdite**.

Conséquence concrète : les `.woff2` **ne sont pas versionnés**. `pnpm fonts` les
récupère depuis l'API Fontshare et les dépose dans `assets/fonts/`, ignoré par git.
Ils sont ensuite servis depuis notre domaine — aucun appel à un tiers au chargement de
la page, et la CSP reste en `font-src 'self'`.

---

## 4. Composition

De l'arrière vers l'avant :

```
┌──────────────────────────────────────────────────────────────┐
│                                                    DISCORD   │  barre haute
│                                                              │
│   ╔═══════════════════════════════╗                          │
│   ║      H O L L O W  (image)     ║                          │  mot-symbole
│   ╚═══════════════════════════════╝                          │
│              Le grimoire est vierge. Écris-le.               │  baseline, décalée
│                                                              │
│         [  REJOINDRE LE DISCORD  ]                           │  action unique
│                                                              │
│           CONDITIONS D'UTILISATION  ·  CONFIDENTIALITÉ       │
└──────────────────────────────────────────────────────────────┘
   fond → voile latéral → voile vertical → vignette
   → grain → orage → braises → contenu
```

La colonne de texte ne reçoit **aucune marge automatique** : elle est calée au bord
gauche, sur 62 % de la largeur, et son contenu est centré à l'intérieur. C'est ce qui
donne la composition en deux temps — le texte à gauche, la scène qui respire à droite.

Le décalage de la baseline sous la moitié droite du mot-symbole est le geste qui tient
la composition : sans lui, l'ensemble redevient un logo centré au-dessus d'un
sous-titre centré, c'est-à-dire n'importe quel site de jeu.

### Mouvement

| Effet               | Durée                                | Détail                                                   |
| ------------------- | ------------------------------------ | -------------------------------------------------------- |
| Panoramique         | 34 s, alterné                        | L'illustration passe de `scale(1.06)` à `scale(1.14)`.   |
| Apparitions         | 0,9–1 s, décalées de 0,15 s à 0,75 s | Barre haute, mot-symbole, baseline, action, mentions.    |
| Halo du mot-symbole | 6,5 s                                | Deux ombres portées rouges qui respirent.                |
| Orage               | 11 s                                 | Deux éclats rapprochés à 87 % et 90 %, puis le silence.  |
| Braises             | 7–16 s, décalées                     | 22 points remontent de 190 px en s'éteignant.            |
| Reflet de l'action  | 7 s                                  | Une bande claire traverse le bouton.                     |
| Parallaxe           | —                                    | L'illustration recule de 26 px, le texte avance de 9 px. |

Tout est en CSS. Le seul JavaScript est un composant client qui pose deux variables
sur la section au déplacement du curseur ; aucune boucle d'animation n'est ouverte.

**`prefers-reduced-motion` coupe tout**, et les braises disparaissent — un point qui ne
va nulle part n'a pas de raison d'être affiché. La maquette ne le prévoyait pas.

---

## 5. Ce que j'ai changé, et pourquoi

Trois écarts seulement, et aucun n'est visible sur un écran normal.

| Écart                                    | Raison                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Le défilement n'est pas bloqué**       | La maquette posait `overflow:hidden` sur `body`. À 320 px de large ou à 200 % de zoom, le contenu devenait inatteignable. La section fait `h-svh` avec un plancher de 40 rem : au-dessus, rien ne change. |
| **Un anneau de focus existe**            | La maquette n'en prévoyait aucun. Le rouge d'accent est le seul choix cohérent, et il tient le seuil de 3:1 sur l'encre.                                                                                  |
| **`prefers-reduced-motion` arrête tout** | Panoramique, orage, halo, reflet, parallaxe et braises. Un point qui ne va nulle part n'a pas de raison d'être affiché.                                                                    |

Sous 768 px, la composition est adaptée : le bloc passe de 62 % à 88 % de large et la
baseline se centre sous le mot-symbole au lieu d'être décalée. À 375 px, le décalage
faisait chevaucher la phrase et le logo, et l'action tombait sur deux lignes. La
maquette est dessinée pour un écran large ; le public arrive de Discord, sur téléphone.

Les deux liens du pied de page pointaient sur des ancres vides. Ils mènent maintenant
à `/conditions-utilisation` et `/confidentialite` — deux pages sobres, avec le texte
réellement établi et rien d'inventé. **Le démenti d'affiliation à Black Clover y
figure**, dans les conditions d'utilisation ; il n'apparaît pas sur la page d'accueil,
conformément à la maquette.

Détail de structure invisible à l'écran mais pas au lecteur d'écran : la barre haute et
le pied de page sont sortis du `<main>`. Imbriqués dans la `<section>` du hero, ils ne
portaient aucun rôle de bannière ni de pied de page, et la page n'exposait aucun repère
de navigation.

### Ce qui n'est pas là

- **Aucune bascule de langue.** Le site reste bilingue et `/en` est servie normalement,
  mais rien ne l'indique à l'écran. La remettre est une ligne dans la barre haute.
- **Aucune action « Installer nanos world »**, aucune mention de l'état du serveur. Le
  visiteur n'apprend pas sur cette page que le serveur n'est pas encore ouvert.
- **Aucune tranche de grimoire** — l'élément signature de la proposition précédente,
  supprimé avec elle.

## 6. Deux réserves

**Le rouge occupe tout.** La palette précédente réservait la couleur aux royaumes ;
ici le hero est intégralement cramoisi. Quand les quatre royaumes arriveront — vert
Clover, bleu Diamond, violet Spade, rose Heart — aucun ne tiendra à côté de cette page.
Il faudra soit une illustration plus neutre sur les pages de royaume, soit assumer le
rouge comme couleur de marque et redessiner les quatre teintes autour. Les valeurs
actuelles restent dans `palette.ts`, testées, en attendant l'arbitrage.

**L'illustration reste un placeholder.** Le contraste du texte est tenu par les quatre
voiles, pas par l'image. Une illustration plus claire au centre demanderait de
revérifier la lisibilité de la baseline — c'est la zone la plus exposée.
