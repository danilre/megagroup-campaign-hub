import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BRAND } from '@/lib/brand'

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'done' | 'error'

function UnsubscribePage() {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const token = React.useMemo(
    () => new URLSearchParams(search).get('token') || '',
    [search],
  )

  const [status, setStatus] = React.useState<Status>('loading')
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/email/unsubscribe?token=${encodeURIComponent(token)}`,
        )
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setStatus('invalid')
        } else if (data.valid) {
          setStatus('valid')
        } else if (data.reason === 'already_unsubscribed') {
          setStatus('already')
        } else {
          setStatus('invalid')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="font-display text-lg tracking-tight">
            {BRAND.name}
          </span>
        </div>

        {status === 'loading' && (
          <>
            <h1 className="font-display text-2xl tracking-tight mb-2">
              Проверяем вашу ссылку…
            </h1>
            <p className="text-muted-foreground text-sm">Один момент.</p>
          </>
        )}

        {status === 'valid' && (
          <>
            <h1 className="font-display text-2xl tracking-tight mb-3">
              Отписаться от писем {BRAND.name}?
            </h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              вы перестанете получать от нас уведомления на этот
              адрес. Важные письма об аккаунте (уведомления безопасности, сброс
              пароля) по-прежнему будут доставляться.
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 px-4 transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Отписываем…' : 'Подтвердить отписку'}
            </button>
          </>
        )}

        {status === 'already' && (
          <>
            <h1 className="font-display text-2xl tracking-tight mb-2">
              вы уже отписаны
            </h1>
            <p className="text-muted-foreground text-sm">
              Ничего делать не нужно — этот адрес не будет получать
              уведомления от {BRAND.name}.
            </p>
          </>
        )}

        {status === 'done' && (
          <>
            <h1 className="font-display text-2xl tracking-tight mb-2">
              вы отписаны
            </h1>
            <p className="text-muted-foreground text-sm">
              Спасибо — мы больше не будем отправлять уведомления
              на этот адрес.
            </p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="font-display text-2xl tracking-tight mb-2">
              Эта ссылка недействительна
            </h1>
            <p className="text-muted-foreground text-sm">
              Ссылка для отписки истекла или неверна. Если вы продолжаете
              получать нежелательные письма, обратитесь в поддержку.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="font-display text-2xl tracking-tight mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-muted-foreground text-sm">
              Пожалуйста, повторите попытку через момент.
            </p>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">
            ← Назад к {BRAND.name}
          </Link>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})
