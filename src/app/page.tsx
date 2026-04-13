import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 34, marginBottom: 12 }}>Money Manager That Stays Simple</h1>
        <p style={{ color: '#4b5563', marginBottom: 24 }}>
          Set your monthly budget, track spending by category, and see what is left instantly.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            background: '#111827',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 10,
            padding: '12px 22px',
            fontWeight: 600,
          }}
        >
          Start Tracking Now
        </Link>
      </section>
    </main>
  )
}
