/**
 * Les braises qui montent devant l'illustration.
 *
 * Vingt-deux points, placés par une suite déterministe plutôt qu'au hasard : le rendu
 * serveur et le rendu client doivent tomber sur les mêmes coordonnées, sinon React
 * signale une divergence d'hydratation. C'est aussi ce qui permet de les calculer une
 * fois pour toutes, au chargement du module.
 *
 * Aucun JavaScript n'est envoyé au navigateur : ce sont vingt-deux `<span>` et une
 * animation CSS. `data-braise` permet à la règle « mouvement réduit » de les retirer.
 */
const NOMBRE = 22

const braises = Array.from({length: NOMBRE}, (_, index) => {
  const graine = (((index * 9301 + 49297) % 233280) / 233280) as number
  const graineBis = (((index * 4931 + 7919) % 104729) / 104729) as number

  return {
    gauche: `${(6 + graine * 88).toFixed(2)}%`,
    bas: `${(2 + graineBis * 34).toFixed(2)}%`,
    taille: graineBis > 0.7 ? 3 : 2,
    duree: `${(7 + graine * 9).toFixed(1)}s`,
    retard: `${(graineBis * 8).toFixed(1)}s`,
  }
})

export function Braises() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {braises.map((braise, index) => (
        <span
          key={index}
          data-braise=""
          className="absolute rounded-full bg-braise-vif opacity-0 shadow-[0_0_8px_var(--color-braise-vif)]"
          style={{
            left: braise.gauche,
            bottom: braise.bas,
            width: braise.taille,
            height: braise.taille,
            animation: `braise-monte ${braise.duree} linear ${braise.retard} infinite`,
          }}
        />
      ))}
    </div>
  )
}
