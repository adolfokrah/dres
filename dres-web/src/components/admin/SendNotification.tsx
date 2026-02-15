'use client'

import { useState } from 'react'
import { Button, FieldLabel } from '@payloadcms/ui'

export default function SendNotificationPage() {
  const [title, setTitle] = useState('Introducing Dres AI 🤖➡️👕👗➡️🎉')
  const [body, setBody] = useState('Simply upload. We\'ll do the rest.')
  const [path, setPath] = useState('/auth')
  const [audience, setAudience] = useState<'anonymous' | 'registered'>('anonymous')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSend = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const endpoint = audience === 'anonymous'
        ? '/api/notifications/send-anonymous'
        : '/api/notifications/send-registered'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          data: { path },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Notification sent successfully to ${data.sent || 0} ${audience} users!`,
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send notification',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Send Push Notification
      </h1>

      {message && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <FieldLabel label="Audience" required />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              value="anonymous"
              checked={audience === 'anonymous'}
              onChange={(e) => setAudience(e.target.value as 'anonymous' | 'registered')}
            />
            <span>Anonymous Users</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              value="registered"
              checked={audience === 'registered'}
              onChange={(e) => setAudience(e.target.value as 'anonymous' | 'registered')}
            />
            <span>Registered Users</span>
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <FieldLabel label="Notification Title" required />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter notification title"
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginTop: '0.5rem',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <FieldLabel label="Notification Body" required />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter notification message"
          rows={4}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginTop: '0.5rem',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <FieldLabel label="Navigation Path" />
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/auth"
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginTop: '0.5rem',
          }}
        />
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
          App route to navigate when notification is tapped (e.g., /auth, /shop, /product/123)
        </p>
      </div>

      <Button
        onClick={handleSend}
        disabled={loading || !title || !body}
      >
        {loading ? 'Sending...' : 'Send Notification'}
      </Button>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Preview</h3>
        <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{title}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>{body}</div>
          {path && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>→ {path}</div>}
        </div>
      </div>
    </div>
  )
}
