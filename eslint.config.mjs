import {defineConfig, globalIgnores} from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import boundaries from 'eslint-plugin-boundaries'

/**
 * Règle maison : aucun texte rédactionnel en dur dans un composant.
 *
 * Le contenu vit dans `messages/*.json` et dans `content/`. Une phrase écrite
 * directement dans du JSX échappe à la traduction et à la validation de schéma —
 * c'est la porte d'entrée du « lorem » que le cahier des charges refuse.
 */
const hollow = {
  rules: {
    'pas-de-texte-en-dur': {
      meta: {
        type: 'problem',
        docs: {description: 'Interdit les phrases écrites en dur dans le JSX.'},
        schema: [
          {
            type: 'object',
            properties: {maximum: {type: 'number'}},
            additionalProperties: false,
          },
        ],
        messages: {
          enDur:
            'Texte en dur dans un composant ({{extrait}}…). Passe par messages/*.json ou content/.',
        },
      },
      create(context) {
        const maximum = context.options[0]?.maximum ?? 40

        return {
          JSXText(node) {
            const valeur = node.value.trim()

            // Une suite de mots, pas un caractère isolé ni un séparateur.
            if (valeur.length <= maximum || !/\s/.test(valeur)) {
              return
            }

            context.report({
              node,
              messageId: 'enDur',
              data: {extrait: valeur.slice(0, 30)},
            })
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'captures/**',
    'playwright-report/**',
    'test-results/**',
  ]),

  nextCoreWebVitals,
  nextTypeScript,

  {
    name: 'hollow/architecture',
    plugins: {boundaries},
    settings: {
      'boundaries/include': [
        'app/**',
        'components/**',
        'features/**',
        'lib/**',
        'i18n/**',
      ],
      'boundaries/elements': [
        {type: 'app', pattern: 'app/**'},
        {type: 'composants', pattern: 'components/**'},
        {type: 'feature', pattern: 'features/*/**', capture: ['domaine']},
        {type: 'lib', pattern: 'lib/**'},
        {type: 'i18n', pattern: 'i18n/**'},
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: [{element: {type: 'app'}}],
              allow: [
                {to: {element: {type: 'app'}}},
                {to: {element: {type: 'composants'}}},
                {to: {element: {type: 'feature'}}},
                {to: {element: {type: 'lib'}}},
                {to: {element: {type: 'i18n'}}},
              ],
            },
            {
              // Les composants ne connaissent aucun domaine métier.
              from: [{element: {type: 'composants'}}],
              allow: [
                {to: {element: {type: 'composants'}}},
                {to: {element: {type: 'lib'}}},
                {to: {element: {type: 'i18n'}}},
              ],
            },
            {
              // Une feature ne voit qu'elle-même : passer par lib/ pour se parler.
              from: [{element: {type: 'feature'}}],
              allow: [
                {
                  to: {
                    element: {type: 'feature', captured: {domaine: '{{from.domaine}}'}},
                  },
                },
                {to: {element: {type: 'composants'}}},
                {to: {element: {type: 'lib'}}},
                {to: {element: {type: 'i18n'}}},
              ],
            },
            {
              // lib/ est une feuille : utilitaires purs, schémas, clients.
              from: [{element: {type: 'lib'}}],
              allow: [{to: {element: {type: 'lib'}}}],
            },
            {
              from: [{element: {type: 'i18n'}}],
              allow: [{to: {element: {type: 'i18n'}}}, {to: {element: {type: 'lib'}}}],
            },
          ],
        },
      ],
    },
  },

  {
    name: 'hollow/navigation-localisee',
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'features/**/*.{ts,tsx}'],
    ignores: ['i18n/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                'Utilise Link depuis @/i18n/navigation, sinon la langue est perdue.',
            },
            {
              name: 'next/navigation',
              importNames: ['redirect', 'usePathname', 'useRouter'],
              message: 'Utilise les équivalents de @/i18n/navigation.',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'hollow/pas-de-texte-en-dur',
    files: ['components/**/*.tsx', 'features/**/*.tsx', 'app/**/*.tsx'],
    plugins: {hollow},
    rules: {
      'hollow/pas-de-texte-en-dur': ['error', {maximum: 40}],
    },
  },

  {
    name: 'hollow/rigueur',
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', {allow: ['warn', 'error']}],
    },
  },

  // En dernier : neutralise les règles de style qui doublonnent Prettier.
  prettier,
])
