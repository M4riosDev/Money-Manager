'use client'

import { useEffect, useMemo, useState } from 'react'

type Expense = {
  id: string
  name: string
  amount: number
}

const STORAGE_KEY = 'money-manager-expenses'

export default function DashboardPage() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Expense[]
      if (Array.isArray(parsed)) setExpenses(parsed)
    } catch {
      setExpenses([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }, [expenses])

  const total = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0)
  }, [expenses])

  function addExpense(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!name.trim() || !Number.isFinite(value) || value <= 0) return

    setExpenses((prev) => [
      { id: crypto.randomUUID(), name: name.trim(), amount: value },
      ...prev,
    ])
    setName('')
    setAmount('')
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        maxWidth: 760,
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Local only. Data stays in your browser.
      </p>

      <section
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '1rem',
          marginBottom: 16,
        }}
      >
        <form onSubmit={addExpense} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Expense name"
            style={{ flex: 1, minWidth: 180 }}
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            style={{ width: 140 }}
          />
          <button
            type="submit"
            style={{
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </form>
      </section>

      <section
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '1rem',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 12 }}>
          Total: ${total.toFixed(2)}
        </div>

        {expenses.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No expenses yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {expenses.map((item) => (
              <li
                key={item.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span>
                  {item.name} - ${item.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => removeExpense(item.id)}
                  style={{
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
