// app/page.tsx
'use client'

import React, { useEffect, useState } from 'react'

type Task = {
  id: string
  title?: string
  description?: string
  priority?: string
  status?: string
  deadline?: string
  assignedTo?: string
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // change this to the email you want to debug with locally / on prod
  const debugEmail = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('email') ?? '') : ''

  useEffect(() => {
    async function loadTasks() {
      setLoading(true)
      setError(null)
      try {
        const emailParam = debugEmail ? `?email=${encodeURIComponent(debugEmail)}` : ''
        const response = await fetch(`/api/tasks${emailParam}`)
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        setTasks(Array.isArray(data.tasks) ? data.tasks : [])
      } catch (err: unknown) {
        console.error('Failed to load tasks:', err)
        if (err instanceof Error) {
          setError(`Failed to load tasks: ${err.message}`)
        } else {
          setError(`Failed to load tasks: ${String(err)}`)
        }
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugEmail])

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Thaiba Media — Dashboard</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <span>Env: client</span>
        </div>
      </header>

      <section style={{ marginBottom: 20 }}>
        <strong>Quick test</strong>
        <p style={{ marginTop: 8 }}>
          To fetch for a specific user append <code>?email=member1@your.org</code> to the URL.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Tasks</strong>
        </div>

        {loading && <div>Loading tasks…</div>}
        {error && (
          <div style={{ color: 'crimson', background: '#fff5f5', padding: 10, borderRadius: 6 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && tasks.length === 0 && <div>No tasks found.</div>}

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginTop: 12 }}>
          {tasks.map((t) => (
            <article key={t.id} style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{t.title || t.id}</h3>
                <small style={{ color: '#666' }}>{t.priority ?? '—'}</small>
              </div>
              <p style={{ margin: '6px 0', color: '#333' }}>{t.description ?? 'No description'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
                <span>Assigned: {t.assignedTo ?? '—'}</span>
                <span>Status: {t.status ?? '—'}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#777' }}>
                Deadline: {t.deadline ? new Date(t.deadline).toLocaleString() : '—'}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: 28, color: '#888', fontSize: 13 }}>
        <div>Deployment test UI — minimal. Replace with your full dashboard UI later.</div>
      </footer>
    </div>
  )
}
