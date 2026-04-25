import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0d0f12',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-label="Money Manager logo"
            role="img"
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundImage: "url('/favicon.ico')",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '220%',
            }}
          />
          <span style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>Money Manager</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/login" style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#8a909e', textDecoration: 'none', fontSize: 13.5,
            padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            transition: 'all 0.13s',
          }}>Sign in</Link>
          <Link href="/login" style={{
            fontFamily: "'DM Sans', sans-serif",
            background: '#16a34a', color: '#fff', textDecoration: 'none',
            fontSize: 13.5, fontWeight: 500,
            padding: '8px 16px', borderRadius: 8,
          }}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px 64px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute',
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(22,163,74,0.1)',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: 99,
          padding: '5px 14px',
          marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#4ade80', fontWeight: 500 }}>Personal finance, made practical</span>
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          maxWidth: 700,
          marginBottom: 20,
        }}>
          Control every euro.<br />
          <span style={{ color: '#4ade80' }}>Clearly.</span>
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: '#6b7280',
          maxWidth: 520,
          lineHeight: 1.7,
          marginBottom: 36,
        }}>
          Set a monthly budget, log expenses in seconds, and watch your spending patterns emerge in real time — no spreadsheets required.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
          <Link href="/login" style={{
            fontFamily: "'DM Sans', sans-serif",
            background: '#ffffff', color: '#0d0f12',
            textDecoration: 'none',
            padding: '12px 24px', borderRadius: 10,
            fontWeight: 600, fontSize: 14,
          }}>Start for free →</Link>
          <Link href="/login" style={{
            fontFamily: "'DM Sans', sans-serif",
            background: 'transparent', color: '#8a909e',
            textDecoration: 'none',
            padding: '12px 24px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            fontWeight: 400, fontSize: 14,
          }}>View dashboard</Link>
        </div>

        {/* Mock dashboard preview */}
        <div style={{
          width: '100%', maxWidth: 820,
          background: '#14171d',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Window chrome */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 12px', fontSize: 11, color: '#4a5162' }}>April 2026 — Expenses</div>
          </div>
          {/* Mock content */}
          <div style={{ display: 'flex' }}>
            {/* Fake sidebar */}
            <div style={{ width: 160, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px', flexShrink: 0 }}>
              {['Dashboard','Expenses','Analytics'].map((item, i) => (
                <div key={item} style={{
                  padding: '7px 10px', borderRadius: 5, marginBottom: 2,
                  background: i === 1 ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: i === 1 ? '#fff' : '#4a5162',
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{item}</div>
              ))}
            </div>
            {/* Fake main */}
            <div style={{ flex: 1, padding: '20px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Budget', val: '€2,400', color: '#fff' },
                  { label: 'Spent', val: '€1,640', color: '#f59e0b' },
                  { label: 'Remaining', val: '€760', color: '#4ade80' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: '#4a5162', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {/* Fake bars */}
              {[
                { cat: 'Groceries', pct: 72, color: '#3b82f6' },
                { cat: 'Utilities', pct: 88, color: '#ef4444' },
                { cat: 'Dining out', pct: 55, color: '#f59e0b' },
                { cat: 'Transport', pct: 38, color: '#8b5cf6' },
              ].map(b => (
                <div key={b.cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 70, fontSize: 11, color: '#6b7280', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{b.cat}</div>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', borderRadius: 99, background: b.color }} />
                  </div>
                  <div style={{ width: 32, textAlign: 'right', fontSize: 11, color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>{b.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 32,
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }}>
        {[
          { title: 'Smart categories', desc: 'Groceries, transport, bills and more — auto-organised with per-category insights.' },
          { title: 'Budget vs reality', desc: 'See instantly how much remains of your monthly budget, updated as you log.' },
          { title: 'Visual analytics', desc: 'Charts and breakdowns surface patterns before overspending becomes a habit.' },
          { title: 'Auto-saved to cloud', desc: 'Your data syncs via Supabase — no export, no manual backup, no friction.' },
        ].map(f => (
          <div key={f.title}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2v10" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginBottom: 6 }}>{f.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4a5162', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#3d4352' }}>© 2026 Money Manager. All rights reserved.</span>
        <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#3d4352', textDecoration: 'none' }}>Sign in →</Link>
      </footer>
    </main>
  )
}
