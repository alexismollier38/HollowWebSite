# Images sources

Ces fichiers sont importés statiquement par les composants — Next en dérive les
formats AVIF/WebP, les tailles et l'aperçu flouté. Ils ne sont pas servis tels quels ;
`public/` reste réservé aux fichiers accessibles par URL directe.

| Fichier                       | Origine                                                                                                          | Statut                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `placeholder-hero-poster.png` | Première image de la vidéo du hero, extraite au build. Illustration générée, fournie par le client le 07/09/2026 | **Placeholder** — à remplacer par une capture in-game ou une illustration originale commandée |
| `logo-hollow.png`             | Mot-symbole de Hollow, fourni par le client le 28/08/2026                                                        | **Définitif** — c'est la marque. Le trèfle qui forme le « O » est une création originale.     |

Aucun asset sous licence tierce ne doit entrer ici : ni logo, ni capture d'anime, ni
artwork extrait d'une œuvre publiée. Tout fichier dont l'origine n'est pas établie et
notée dans ce tableau doit être retiré.

## Note de format

Le PNG source pèse 1,9 Mo. Il est conservé tel que livré — c'est la source, pas ce qui
part sur le réseau : l'optimiseur de Next en tire des AVIF de quelques dizaines de
kilo-octets. Une image de remplacement peut arriver en n'importe quel format matriciel ;
inutile de la compresser à la main.

## La vidéo du hero

Le fond du hero est une vidéo en boucle, animation de la même illustration. Elle vit
dans `public/video/`, servie par URL et non importée — un `<video>` ne se rattache pas
comme une image.

La source livrée par le client fait 3836 × 2160, 24 i/s, 5,04 s, 20,5 Mo à 34 Mb/s.
Elle **n'est pas versionnée** : seuls les deux rendus le sont.

### La boucle passe par un fondu au noir

Une lecture en boucle de la source telle quelle donne une coupure franche : la dernière
image est le pic d'action, la première le calme. Le montage **ouvre et ferme donc sur du
noir**, 0,9 s de chaque côté, au ton exact du fond du site (`#0a0809`, le token
`--color-encre`). Les deux extrémités se rejoignent dans l'obscurité.

Résultat mesuré, en écart moyen par canal sur 0–255 :

|                                           | Écart   |
| ----------------------------------------- | ------- |
| Deux images consécutives, lecture normale | 1,4     |
| **Le raccord de boucle**                  | **1,7** |
| Le fondu croisé, essayé avant             | 6,6     |
| La coupure d'origine                      | 17,7    |

Le raccord est au niveau du bruit d'encodage. `loop` suffit, aucun JavaScript ne pilote
la boucle.

⚠️ **Le poster n'est pas l'image zéro** — elle est noire. C'est l'image à la fin du
fondu d'ouverture, à `t = 0,9 s`. `components/hero/FondAnime.tsx` saute à cette même
position au démarrage, et un test le vérifie : les deux doivent rester d'accord, sinon
la page cligne au moment où la vidéo se pose.

### Qualité : le choix et ce qu'il coûte

Mesures faites sur la source, montage sans pause :

|               | AV1                                 | H.264            |
| ------------- | ----------------------------------- | ---------------- |
| 1920 px       | 2,03 Mo (crf 28) · 2,61 Mo (crf 24) | 4,90 Mo (crf 20) |
| **2560 px**   | **2,71 Mo (crf 28)**                | 7,71 Mo (crf 20) |
| 3836 px natif | —                                   | 13,63 Mo         |

**AV1 en 2560 px** : à poids égal avec du 1920 en très haute qualité, on gagne de la
définition sur les grands écrans et les affichages à forte densité. C'est ce que reçoit
la quasi-totalité des visiteurs.

**H.264 en 1920 px, crf 21** : le repli ne concerne que les navigateurs sans AV1 — pour
l'essentiel Safari antérieur à la version 17, puisque le mobile ne reçoit jamais la
vidéo. Le monter en 2560 aurait coûté 7,7 Mo pour une poignée de visiteurs.

### Régénérer depuis une nouvelle source

Deux valeurs dépendent de la source : `0.9`, la durée des deux fondus, et `4.14` qui
vaut `durée − 0,9`. Si le fondu change, `DEBUT_VISIBLE` dans `FondAnime.tsx` et le seuil
du test doivent suivre.

```bash
FONDUS="fade=t=in:st=0:d=0.9:color=0x0a0809,fade=t=out:st=4.14:d=0.9:color=0x0a0809"

# Poster : première image pleinement visible, en 2560
ffmpeg -i source.mp4 -vf "scale=2560:-2,$FONDUS,select=gte(t\,0.9)" -frames:v 1   assets/images/placeholder-hero-poster.png

# AV1 — 2,71 Mo. Servi en premier, pris par tous les navigateurs récents
ffmpeg -i source.mp4 -vf "scale=2560:-2,$FONDUS" -an   -c:v libaom-av1 -crf 28 -b:v 0 -cpu-used 5 -row-mt 1 -g 48 -pix_fmt yuv420p   public/video/hero.webm

# H.264 — 4,25 Mo. Le repli
ffmpeg -i source.mp4 -vf "scale=1920:-2,$FONDUS" -an   -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p   -movflags +faststart public/video/hero.mp4
```

Aucune piste audio — le site n'en joue aucune.
