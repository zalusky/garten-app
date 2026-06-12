import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, Trash2 } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

export default function CalendarView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: today.toISOString().slice(0,10), title: '', done: false })

  const tasks = useLiveQuery(() => db.logs.where('action_type').equals('aufgabe').toArray(), [])

  async function save() {
    if (!form.title.trim()) return
    await db.logs.add({ date: form.date, action_type: 'aufgabe', notes: form.title, poi_id: null, culture_id: null })
    setForm(f => ({ ...f, title: '' }))
    setShowForm(false)
  }

  async function remove(id) { await db.logs.delete(id) }

  const monthTasks = tasks?.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === month
  }) || []

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-green-800 text-lg">📅 Kalender</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm">
          <Plus size={14} /> Aufgabe
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }} className="border rounded px-2 py-1 text-sm">‹</button>
        <span className="font-semibold text-green-800 flex-1 text-center">{MONTHS[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }} className="border rounded px-2 py-1 text-sm">›</button>
      </div>

      {showForm && (
        <div className="bg-white border border-green-200 rounded-xl p-4 flex flex-col gap-3">
          <input type="date" className="border rounded px-2 py-1.5 text-sm" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
          <input className="border rounded px-2 py-1.5 text-sm" placeholder="Aufgabe (z.B. Tomaten düngen)" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          <div className="flex gap-2">
            <button onClick={save} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm">Speichern</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {monthTasks.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Keine Aufgaben für {MONTHS[month]} {year}</p>}
        {monthTasks.sort((a,b) => a.date.localeCompare(b.date)).map(t => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-green-700 font-mono text-sm w-8">{new Date(t.date).getDate()}.</span>
            <span className="flex-1 text-sm">{t.notes}</span>
            <button onClick={() => remove(t.id)} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
