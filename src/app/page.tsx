import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function getUsername(user: {
  email?: string;
  user_metadata?: { username?: string; name?: string; full_name?: string };
}) {
  const fromMetadata =
    user.user_metadata?.username ??
    user.user_metadata?.name ??
    user.user_metadata?.full_name;

  if (fromMetadata && fromMetadata.trim().length > 0) return fromMetadata;
  if (user.email && user.email.includes('@')) return user.email.split('@')[0];
  return 'there';
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username = user
    ? getUsername({
        email: user.email,
        user_metadata: {
          username: user.user_metadata?.username,
          name: user.user_metadata?.name,
          full_name: user.user_metadata?.full_name,
        },
      })
    : null;

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
        flexWrap: 'wrap', rowGap: 10,
        padding: 'clamp(12px, 3vw, 20px) clamp(10px, 5vw, 48px)',
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
        {user ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#8a909e',
              fontSize: 'clamp(11px, 3.4vw, 13.5px)',
            }}>
              Signed in as {username}
            </span>
            <Link href="/dashboard" style={{
              fontFamily: "'DM Sans', sans-serif",
              background: '#16a34a', color: '#fff', textDecoration: 'none',
              fontSize: 'clamp(12px, 3.4vw, 13.5px)', fontWeight: 500,
              padding: '8px 16px', borderRadius: 8,
            }}>Open dashboard</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/login" style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#8a909e', textDecoration: 'none', fontSize: 'clamp(12px, 3.4vw, 13.5px)',
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              transition: 'all 0.13s',
            }}>Sign in</Link>
            <Link href="/login" style={{
              fontFamily: "'DM Sans', sans-serif",
              background: '#16a34a', color: '#fff', textDecoration: 'none',
              fontSize: 'clamp(12px, 3.4vw, 13.5px)', fontWeight: 500,
              padding: '8px 16px', borderRadius: 8,
            }}>Get started</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(28px, 8vw, 80px) clamp(10px, 4vw, 24px) clamp(18px, 7vw, 64px)',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute',
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 'min(600px, 92vw)', height: 'min(300px, 48vw)',
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(22,163,74,0.1)',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: 99,
          padding: '5px clamp(8px, 2vw, 14px)',
          marginBottom: 'clamp(14px, 4vw, 28px)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(10.5px, 2.8vw, 12px)', color: '#4ade80', fontWeight: 500 }}>Personal finance, made practical</span>
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          maxWidth: 700,
          marginBottom: 'clamp(10px, 3vw, 20px)',
        }}>
          Control every currency.<br />
          <span style={{ color: '#4ade80' }}>Clearly.</span>
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(13px, 3.8vw, 16px)',
          color: '#6b7280',
          maxWidth: 520,
          lineHeight: 1.7,
          marginBottom: 'clamp(18px, 5vw, 36px)',
        }}>
          Set a monthly budget, log expenses in seconds, and watch your spending patterns emerge in real time — no spreadsheets required.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'clamp(24px, 8vw, 64px)', width: '100%', maxWidth: 520 }}>
          <Link href="/login" style={{
            fontFamily: "'DM Sans', sans-serif",
            background: '#ffffff', color: '#0d0f12',
            textDecoration: 'none',
            padding: '10px 18px', borderRadius: 10,
            fontWeight: 600, fontSize: 'clamp(12px, 3.4vw, 14px)',
            flex: '1 1 180px',
          }}>Start for free →</Link>
          <Link href="/login" style={{
            fontFamily: "'DM Sans', sans-serif",
            background: 'transparent', color: '#8a909e',
            textDecoration: 'none',
            padding: '10px 18px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            fontWeight: 400, fontSize: 'clamp(12px, 3.4vw, 14px)',
            flex: '1 1 180px',
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
          <div style={{ padding: '10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 8px', fontSize: 'clamp(9px, 2.7vw, 11px)', color: '#4a5162', whiteSpace: 'nowrap' }}>April 2026</div>
          </div>
          {/* Mock content */}
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Fake sidebar */}
            <div style={{ width: 'min(160px, 100%)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '10px 8px', flexShrink: 0 }}>
              {['Dashboard','Expenses','Analytics'].map((item, i) => (
                <div key={item} style={{
                  padding: '7px 10px', borderRadius: 5, marginBottom: 2,
                  background: i === 1 ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: i === 1 ? '#fff' : '#4a5162',
                  fontSize: 'clamp(10px, 2.8vw, 12px)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>{item}</div>
              ))}
            </div>
            {/* Fake main */}
            <div style={{ flex: 1, padding: '12px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Budget', val: '€2,400', color: '#fff' },
                  { label: 'Spent', val: '€1,640', color: '#f59e0b' },
                  { label: 'Remaining', val: '€760', color: '#4ade80' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '9px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 'clamp(9px, 2.4vw, 10px)', color: '#4a5162', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 'clamp(12px, 3.8vw, 18px)', fontWeight: 600, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.val}</div>
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
                <div key={b.cat} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 'clamp(48px, 20vw, 70px)', fontSize: 'clamp(9px, 2.8vw, 11px)', color: '#6b7280', fontFamily: "'DM Sans', sans-serif", flexShrink: 0, textAlign: 'left' }}>{b.cat}</div>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', borderRadius: 99, background: b.color }} />
                  </div>
                  <div style={{ width: 26, textAlign: 'right', fontSize: 'clamp(9px, 2.6vw, 11px)', color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>{b.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(16px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'clamp(12px, 3vw, 32px)',
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
        padding: '12px clamp(10px, 5vw, 48px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#3d4352' }}>© 2026 Money Manager. All rights reserved.</span>
        <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#3d4352', textDecoration: 'none' }}>Sign in →</Link>
      </footer>
    </main>
  )
}
