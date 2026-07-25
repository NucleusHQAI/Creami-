import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'

export default function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-panel border border-line bg-paper p-8">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-berrydk">
          CREAMi Deluxe
        </p>
        <h1 className="mb-6 font-display text-[32px] leading-[1.05] tracking-[-0.04em] text-ink">
          Sign in
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-[13px] text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? true : undefined}
              className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-[13px] text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? true : undefined}
              className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="text-[13px] text-berry">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-pill bg-ink text-[15px] font-medium text-cream disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
