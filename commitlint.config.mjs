/**
 * Commits conventionnels. Les types restent en anglais — c'est la convention
 * outillée — mais le sujet s'écrit en français, comme le reste du dépôt.
 *
 * Exemple : `feat(tranche): afficher le libellé de section au survol`
 */
const configuration = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Un sujet français commence souvent par une majuscule ou un article : on ne
    // force pas la casse, on force la longueur et la présence d'un type.
    'subject-case': [0],
    'header-max-length': [2, 'always', 90],
  },
}

export default configuration
