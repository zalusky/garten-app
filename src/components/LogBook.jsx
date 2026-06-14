import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, X } from 'lucide-react'

const ACTION_LABELS = {
  düngung:  '🌱 Düngung',
  schnitt:  '✂️ Schnitt',
  ernte:    '🧺 Ernte',
  krankheit:'🐛 Krankheit',
  sonstiges:'📝 Sonstiges',
}

export default function LogBook({ filterPoi, onClearFilter }) {
  const pois = useLiveQuery(() => db.pois.toArray(), [])
  const recipes = useLiveQuery(() => db.recipes.toArray(), [])
  const allLogs = useLiveQuery(() => db.logs.orderBy('date').reverse().toArray(), [])

  const logs = filterPoi
    ? allLogs?.filter(l => l.poi_id === filterPoi.id)
    : allLogs

  const [form, setForm] = useState({
    open: false, poi_id: '', action_type: 'düngung',
    date: new Date().toISOString().slice(0,10),
    recipe_id: '', harvest_qty: '', harvest_quality: '',
    sick_type: '', treatment: '', success: '', notes: ''
  })

  useEffect(() => {
    if (filterPoi) setForm(f => ({ ...f, poi_id: String(filterPoi.id) }))
  }, [filterPoi])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    await db.logs.add({
      poi_id: Number(form.poi_id) || null,
      culture_id: null,
      date: form.date,
      action_type: form.action_type,
      recipe_id: Number(form.recipe_id) || null,
      harvest_qty: form.harvest_qty ? Number(form.harvest_qty) : null,
      harvest_quality: form.harvest_quality || null,
      sick_type: form.sick_type || null,
      treatment: form.treatment || null,
      success: form.success || null,
      notes: form.notes || null,
    })
    setForm(f => ({ ...f, open: false }))
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-green-800 text-lg">Logbuch</h2>
          {filterPoi && (
            <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
              {filterPoi.name}
              <button onClick={onClearFilter}><X size={12} /></button>
            </span>
          )}
        </div>
        <button onClick={() => set('open', true)} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm">
          <Plus size={14} /> Eintrag
        </button>
      </div>

      {form.open && (
        <div className="bg-white border border-green-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded px-2 py-1.5 text-sm col-span-2" value={form.poi_id} onChange={e => set('poi_id', e.target.value)}>
              <option value="">— POI wählen —</option>
              {pois?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm" value={form.action_type} onChange={e => set('action_type', e.target.value)}>
              {Object.entries(ACTION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          {form.action_type === 'düngung' && (
            <select className="border rounded px-2 py-1.5 text-sm" value={form.recipe_id} onChange={e => set('recipe_id', e.target.value)}>
              <option value="">— Rezept (optional) —</option>
              {recipes?.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          )}
          {form.action_type === 'ernte' && (
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded px-2 py-1.5 text-sm" placeholder="Ertrag (kg)" type="number" value={form.harvest_qty} onChange={e => set('harvest_qty', e.target.value)} />
              <input className="border rounded px-2 py-1.5 text-sm" placeholder="Qualität / Säuregrad" value={form.harvest_quality} onChange={e => set('harvest_quality', e.target.value)} />
            </div>
          )}
          {form.action_type === 'krankheit' && (
            <div className="flex flex-col gap-2">
              <input className="border rounded px-2 py-1.5 text-sm" placeholder="Schädling / Krankheit" value={form.sick_type} onChange={e => set('sick_type', e.target.value)} />
              <input className="border rounded px-2 py-1.5 text-sm" placeholder="Behandlung" value={form.treatment} onChange={e => set('treatment', e.target.value)} />
              <select className="border rounded px-2 py-1.5 text-sm" value={form.success} onChange={e => set('success', e.target.value)}>
                <option value="">Erfolg?</option>
                <option value="ja">✅ Ja</option>
                <option value="nein">❌ Nein</option>
              </select>
            </div>
          )}
          <textarea className="border rounded px-2 py-1.5 text-sm" rows={2} placeholder="Notizen…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          <div className="flex gap-2">
            <button onClick={save} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm">Speichern</button>
            <button onClick={() => set('open', false)} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {logs?.map(log => {
          const poi = pois?.find(p => p.id === log.poi_id)
          return (
            <div key={log.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{ACTION_LABELS[log.action_type] || log.action_type}</span>
                <span className="text-gray-400">{log.date}</span>
              </div>
              {poi && <span className="text-xs text-green-700">{poi.name}</span>}
              {log.harvest_qty && <span className="text-xs text-gray-600">Ertrag: {log.harvest_qty} kg · {log.harvest_quality}</span>}
              {log.sick_type && <span className="text-xs text-red-600">{log.sick_type} → {log.treatment} {log.success === 'ja' ? '✅' : log.success === 'nein' ? '❌' : ''}</span>}
              {log.notes && <span className="text-xs text-gray-500">{log.notes}</span>}
            </div>
          )
        })}
        {!logs?.length && (
          <p className="text-gray-400 text-sm text-center py-8">
            {filterPoi ? `Noch keine Einträge für "${filterPoi.name}"` : 'Noch keine Einträge'}
          </p>
        )}
      </div>
    </div>
  )
}
