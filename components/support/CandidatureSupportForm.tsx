'use client'

import Image from 'next/image'
import {useState} from 'react'
import type {FormEvent} from 'react'
import captureDiscord from '@/assets/images/support-discord-id.png'
import logoSupport from '@/assets/images/logo-support.png'

type FormState = 'idle' | 'sending' | 'success' | 'error'

const champsVides = {
  discordId: '',
  age: '',
  birthDate: '',
  presentation: '',
  motivations: '',
  contribution: '',
}

export function CandidatureSupportForm({
  discordHelp,
  successMessage,
}: {
  discordHelp: string
  successMessage: string
}) {
  const [values, setValues] = useState(champsVides)
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof typeof champsVides, string>>
  >({})

  const update = (field: keyof typeof champsVides, value: string) => {
    setValues((current) => ({...current, [field]: value}))
    setFieldErrors((current) => ({...current, [field]: undefined}))
    if (state !== 'idle') {
      setState('idle')
      setErrorMessage('')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setErrorMessage('')
    setFieldErrors({})

    try {
      const response = await fetch('/api/support-application', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      })
      const result = (await response.json()) as {
        message?: string
        fields?: Partial<Record<keyof typeof champsVides, string>>
      }

      if (!response.ok) {
        setFieldErrors(result.fields ?? {})
        throw new Error(result.message || 'Impossible d’envoyer la candidature.')
      }

      setState('success')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’envoyer la candidature. Réessaie plus tard.',
      )
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <section className="support-panel space-y-6 text-center" aria-live="polite">
        <Image
          src={logoSupport}
          alt="Hollow Recrutement Support"
          width={220}
          className="mx-auto h-auto w-44"
        />
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-support-or-clair">
            Formulaire envoyé
          </h2>
          <p className="text-support-or/80">{successMessage}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setValues(champsVides)
            setErrorMessage('')
            setState('idle')
          }}
          className="action rounded-md border border-support-or/60 px-6 py-3 text-support-or-clair transition-colors hover:bg-support-or/10"
        >
          Envoyer une autre candidature
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {state === 'error' && (
        <p role="alert" className="rounded-md border border-red-400/50 p-4 text-red-200">
          {errorMessage}
        </p>
      )}
      <Question label="Quel est ton identifiant Discord ?" required>
        <input
          required
          pattern="[0-9]{17,20}"
          maxLength={20}
          title="L’identifiant Discord doit contenir 17 à 20 chiffres"
          value={values.discordId}
          onChange={(event) => update('discordId', event.target.value)}
          aria-invalid={Boolean(fieldErrors.discordId)}
          inputMode="numeric"
          placeholder="Ex. 742482884069294211"
          className="champ-candidature placeholder:text-support-or/45 hover:border-support-or/70 focus:border-support-or focus:bg-support-or/10"
        />
        <FieldError message={fieldErrors.discordId} />
        <figure className="mt-5 overflow-hidden rounded-xl border border-support-or/30 bg-black/50 p-1">
          <Image
            src={captureDiscord}
            alt="Menu Discord montrant où copier l’identifiant utilisateur"
            sizes="(max-width: 700px) 100vw, 650px"
            className="h-auto w-full"
          />
        </figure>
        <p className="mt-3 text-sm text-support-or/75">{discordHelp}</p>
      </Question>

      <Question label="Tu as quel âge ?" required>
        <input
          required
          type="number"
          min="13"
          max="99"
          value={values.age}
          onChange={(event) => update('age', event.target.value)}
          aria-invalid={Boolean(fieldErrors.age)}
          placeholder="Ton âge"
          className="champ-candidature max-w-[12rem] placeholder:text-support-or/45 hover:border-support-or/70 focus:border-support-or focus:bg-support-or/10"
        />
        <FieldError message={fieldErrors.age} />
      </Question>

      <Question label="Ta date de naissance ?" required hint="jj/mm/aaaa">
        <input
          required
          value={values.birthDate}
          onChange={(event) => update('birthDate', event.target.value)}
          aria-invalid={Boolean(fieldErrors.birthDate)}
          placeholder="jj/mm/aaaa"
          pattern="(?:0[1-9]|[12][0-9]|3[01])/(?:0[1-9]|1[0-2])/[0-9]{4}"
          title="Utilise le format jj/mm/aaaa"
          className="champ-candidature max-w-[16rem] placeholder:text-support-or/45 hover:border-support-or/70 focus:border-support-or focus:bg-support-or/10"
        />
        <FieldError message={fieldErrors.birthDate} />
      </Question>

      <Question
        label="Présente-toi en quelques phrases !"
        hint="Métier, études ou passions · 10 caractères minimum"
      >
        <textarea
          required
          minLength={10}
          maxLength={4000}
          value={values.presentation}
          onChange={(event) => update('presentation', event.target.value)}
          aria-invalid={Boolean(fieldErrors.presentation)}
          placeholder="Parle-nous un peu de toi..."
          rows={5}
          className="champ-candidature resize-y placeholder:text-support-or/45 hover:border-support-or/70 focus:border-support-or focus:bg-support-or/10"
        />
        <FieldError message={fieldErrors.presentation} />
      </Question>

      <Question label="Quelles sont tes motivations ?" hint="10 caractères minimum">
        <textarea
          required
          minLength={10}
          maxLength={4000}
          value={values.motivations}
          onChange={(event) => update('motivations', event.target.value)}
          aria-invalid={Boolean(fieldErrors.motivations)}
          placeholder="Pourquoi souhaites-tu rejoindre l’équipe support ?"
          rows={5}
          className="champ-candidature resize-y placeholder:text-support-or/45 hover:border-support-or/70 focus:border-support-or focus:bg-support-or/10"
        />
        <FieldError message={fieldErrors.motivations} />
      </Question>

      <Question
        label="Qu’est-ce que tu aimerais apporter sur le serveur ?"
        hint="10 caractères minimum"
      >
        <textarea
          required
          minLength={10}
          maxLength={4000}
          value={values.contribution}
          onChange={(event) => update('contribution', event.target.value)}
          aria-invalid={Boolean(fieldErrors.contribution)}
          placeholder="Tes idées, ton expérience et ta façon d’aider la communauté..."
          rows={5}
          className="champ-candidature resize-y placeholder:text-support-or/45 hover:border-support-or/70 focus:border-support-or focus:bg-support-or/10"
        />
        <FieldError message={fieldErrors.contribution} />
      </Question>

      <div className="flex flex-col gap-4 pt-2">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="action w-fit rounded-md bg-support-or px-7 py-4 text-black transition-colors hover:bg-support-or-clair disabled:cursor-wait disabled:opacity-60"
        >
          {state === 'sending' ? 'Envoi en cours...' : 'Envoyer ma candidature'}
        </button>
      </div>
    </form>
  )
}

function FieldError({message}: {message: string | undefined}) {
  return message ? <p className="mt-2 text-sm text-red-200">{message}</p> : null
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
    <fieldset className="support-question">
      <label className="text-lg font-medium text-support-or-clair">
        {label} {required && <span aria-hidden="true">*</span>}
        {hint && (
          <span className="mt-1 block text-sm font-normal text-support-or/65">
            {hint}
          </span>
        )}
      </label>
      {children}
    </fieldset>
  )
}
