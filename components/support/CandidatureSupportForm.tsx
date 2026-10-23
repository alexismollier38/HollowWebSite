'use client'

import Image from 'next/image'
import {useState} from 'react'
import type {FormEvent} from 'react'
import captureDiscord from '@/assets/images/support-discord-id.png'

type FormState = 'idle' | 'sending' | 'success' | 'error'

const champsVides = {
  discordId: '',
  age: '',
  birthDate: '',
  presentation: '',
  motivations: '',
  contribution: '',
}

export function CandidatureSupportForm() {
  const [values, setValues] = useState(champsVides)
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')

  const update = (field: keyof typeof champsVides, value: string) => {
    setValues((current) => ({...current, [field]: value}))
    if (state !== 'idle') {
      setState('idle')
      setMessage('')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setMessage('')

    try {
      const response = await fetch('/api/support-application', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      })
      const result = (await response.json()) as {message?: string}

      if (!response.ok) {
        throw new Error(result.message || 'Impossible d’envoyer la candidature.')
      }

      setValues(champsVides)
      setState('success')
      setMessage('Merci ! Ta candidature a bien été envoyée à l’équipe Hollow.')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Question label="Quel est ton identifiant Discord ?" required>
        <input
          required
          value={values.discordId}
          onChange={(event) => update('discordId', event.target.value)}
          inputMode="numeric"
          placeholder="Ex. 742482884069294211"
          className="champ-candidature placeholder:text-estompe hover:border-white/30 focus:border-parchemin focus:bg-white/10"
        />
        <figure className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <Image
            src={captureDiscord}
            alt="Menu Discord montrant où copier l’identifiant utilisateur"
            sizes="(max-width: 700px) 100vw, 650px"
            className="h-auto w-full"
          />
        </figure>
        <p className="mt-3 text-sm text-estompe-clair">
          Clic droit sur ton pseudo + copier l’ID de l’utilisateur
        </p>
      </Question>

      <Question label="Tu as quel âge ?" required>
        <input
          required
          type="number"
          min="13"
          max="99"
          value={values.age}
          onChange={(event) => update('age', event.target.value)}
          placeholder="Ton âge"
          className="champ-candidature max-w-[12rem] placeholder:text-estompe hover:border-white/30 focus:border-parchemin focus:bg-white/10"
        />
      </Question>

      <Question label="Ta date de naissance ?" required hint="jj/mm/aaaa">
        <input
          required
          value={values.birthDate}
          onChange={(event) => update('birthDate', event.target.value)}
          placeholder="jj/mm/aaaa"
          pattern="(?:0[1-9]|[12][0-9]|3[01])/(?:0[1-9]|1[0-2])/[0-9]{4}"
          title="Utilise le format jj/mm/aaaa"
          className="champ-candidature max-w-[16rem] placeholder:text-estompe hover:border-white/30 focus:border-parchemin focus:bg-white/10"
        />
      </Question>

      <Question
        label="Présente-toi en quelques phrases !"
        hint="Métier, études ou passions"
      >
        <textarea
          required
          value={values.presentation}
          onChange={(event) => update('presentation', event.target.value)}
          placeholder="Parle-nous un peu de toi..."
          rows={5}
          className="champ-candidature resize-y placeholder:text-estompe hover:border-white/30 focus:border-parchemin focus:bg-white/10"
        />
      </Question>

      <Question label="Quelles sont tes motivations ?">
        <textarea
          required
          value={values.motivations}
          onChange={(event) => update('motivations', event.target.value)}
          placeholder="Pourquoi souhaites-tu rejoindre l’équipe support ?"
          rows={5}
          className="champ-candidature resize-y placeholder:text-estompe hover:border-white/30 focus:border-parchemin focus:bg-white/10"
        />
      </Question>

      <Question label="Qu’est-ce que tu aimerais apporter sur le serveur ?">
        <textarea
          required
          value={values.contribution}
          onChange={(event) => update('contribution', event.target.value)}
          placeholder="Tes idées, ton expérience et ta façon d’aider la communauté..."
          rows={5}
          className="champ-candidature resize-y placeholder:text-estompe hover:border-white/30 focus:border-parchemin focus:bg-white/10"
        />
      </Question>

      <div className="flex flex-col gap-4 pt-2">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="action w-fit rounded-md bg-parchemin px-7 py-4 text-encre transition-colors hover:bg-parchemin-vif disabled:cursor-wait disabled:opacity-60"
        >
          {state === 'sending' ? 'Envoi en cours...' : 'Envoyer ma candidature'}
        </button>
        <p
          aria-live="polite"
          className={`text-sm ${state === 'error' ? 'text-estompe-clair' : 'text-parchemin'}`}
        >
          {message}
        </p>
      </div>
    </form>
  )
}

function Question({
  label,
  required = false,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-b border-white/10 pb-6 last:border-0">
      <label className="text-lg font-medium text-parchemin">
        {label} {required && <span aria-hidden="true">*</span>}
        {hint && (
          <span className="mt-1 block text-sm font-normal text-estompe">{hint}</span>
        )}
      </label>
      {children}
    </fieldset>
  )
}
