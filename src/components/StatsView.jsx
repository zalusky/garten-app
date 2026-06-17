import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'

export default function StatsView() {
  const pois = useLiveQuery(() => db.pois.toArray(), [])
  const logs = useLiveQuery(() => db.logs.where('action_type').equals('ernte').toArray(), [])
  const soilSamples = useLiveQuery(() => db.soil.toArray(), [])

  if (!logs || !pois) return <div className="p-8 text-center text-gray-400">Lade Daten…</div>

  const harvestLogs = logs.filter(l => l.harvest_qty)

  // Ernte pro POI (gesamt)
  const byPoi = {}
  harvestLogs.forEach(l => {
    const poi = pois.find(p => p.id === l.poi_id)
    const name = poi?.name || 'Unbekannt'
    byPoi[name] = (byPoi[name] || 0) + Number(l.harvest_qty)
  })
  const poiData = Object.entries(byPoi).map(([name, kg]) => ({ name, kg: +kg.toFixed(2) })).sort((a,b) => b.kg - a.kg)

  // Ernte pro Jahr
  const byYear = {}
  harvestLogs.forEach(l => {
    const year = l.date?.slice(0, 4) || 'Unbekannt'
    byYear[year] = (byYear[year] || 0) + Number(l.harvest_qty)
  })
  const yearData = Object.entries(byYear).sort().map(([year, kg]) => ({ year, kg: +kg.toFixed(2) }))

  // Qualitäts-Übersicht
  const qualityLogs = harvestLogs.filter(l => l.harvest_quality)
  const qualityByPoi = {}
  qualityLogs.forEach(l => {
    const poi = pois.find(p => p.id === l.poi_id)
    const name = poi?.name || 'Unbekannt'
    if (!qualityByPoi[name]) qualityByPoi[name] = []
    qualityByPoi[name].push(l.harvest_quality)
  })

  // Gesamtstatistiken
  const totalKg = harvestLogs.reduce((s, l) => s + Number(l.harvest_qty), 0)
  const totalEntries = logs.length
  const activePois = new Set(harvestLogs.map(l => l.poi_id)).size

  return (
    <div className="p-4 flex flex-col gap-6">
      <h2 className="font-bold text-green-800 text-lg">📊 Statistiken</h2>

      {/* Kennzahlen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gesamternte', value: totalKg.toFixed(1) + ' kg' },
          { label: 'Ernte-Einträge', value: totalEntries },
          { label: 'Aktive POIs', value: activePois },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl px-3 py-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-green-800">{value}</p>
          </div>
        ))}
      </div>

      {harvestLogs.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
          Noch keine Ernte-Einträge im Logbuch — trage erste Ernten ein um Charts zu sehen
        </div>
      ) : (
        <>
          {/* Ernte pro POI */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-600 mb-3">Gesamternte pro Element (kg)</p>
            <ResponsiveContainer width="100%" height={Math.max(200, poiData.length * 40)}>
              <BarChart data={poiData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" kg" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={v => [v + ' kg', 'Ernte']} />
                <Bar dataKey="kg" fill="#4ade80" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ernte pro Jahr */}
          {yearData.length > 1 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-600 mb-3">Ernte-Entwicklung über die Jahre (kg)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                  <Tooltip formatter={v => [v + ' kg', 'Ernte']} />
                  <Line type="monotone" dataKey="kg" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Bodenproben Übersicht */}
      {soilSamples?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm text-gray-600 mb-3">pH-Verlauf Bodenproben</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={soilSamples.filter(s => s.ph).sort((a,b) => a.date?.localeCompare(b.date)).map(s => ({
              date: s.date,
              ph: s.ph,
              name: pois?.find(p => p.id === s.poi_id)?.name || '?'
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[4, 9]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, _, p) => [v, p.payload.name]} />
              <Line type="monotone" dataKey="ph" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="text-red-500">■ &lt;5.5 zu sauer</span>
            <span className="text-amber-500">■ 5.5–6.5 leicht sauer</span>
            <span className="text-green-600">■ 6.5–7.5 optimal</span>
            <span className="text-blue-500">■ &gt;7.5 basisch</span>
          </div>
        </div>
      )}
    </div>
  )
}
