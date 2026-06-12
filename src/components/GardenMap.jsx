import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, X, Info } from 'lucide-react'

const TYPE_COLORS = {
  baum:     'bg-green-600',
  gebäude:  'bg-amber-600',
  beet:     'bg-lime-600',
}

const TYPE_ICONS = {
  baum:    '🌳',
  gebäude: '🏡',
  beet:    '🥕',
}

export default function GardenMap() {
  const [mapImg, setMapImg] = useState(() => localStorage.getItem('gartenMapImg') || null)
  const [dragging, setDragging] = useState(null)
  const [addMode, setAddMode] = useState(false)
  const [newPoi, setNewPoi] = useState(null)
  const [selected, setSelected] = useState(null)
  const mapRef = useRef()

  const pois = useLiveQuery(() => db.pois.toArray(), [])

  function handleMapClick(e) {
    if (!addMode) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1)
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1)
    setNewPoi({ x, y })
    setAddMode(false)
  }

  async function savePoi(name, type) {
    if (!name.trim()) return
    await db.pois.add({ name, type, x_position: newPoi.x, y_position: newPoi.y, parent_id: null })
    setNewPoi(null)
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      localStorage.setItem('gartenMapImg', ev.target.result)
      setMapImg(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <label className="cursor-pointer bg-green-700 text-white px-3 py-1.5 rounded text-sm hover:bg-green-800">
          Luftbild hochladen
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <button
          onClick={() => setAddMode(v => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${addMode ? 'bg-orange-500 text-white' : 'bg-white border border-green-300 text-green-700'}`}
        >
          <Plus size={14} /> POI setzen
        </button>
        {addMode && <span className="text-orange-600 text-sm">Klick auf die Karte…</span>}
      </div>

      <div
        ref={mapRef}
        onClick={handleMapClick}
        className={`relative w-full rounded-xl overflow-hidden border-2 ${addMode ? 'border-orange-400 cursor-crosshair' : 'border-green-200'}`}
        style={{ minHeight: 340, background: '#d4edba' }}
      >
        {mapImg
          ? <img src={mapImg} className="w-full h-full object-cover" alt="Gartenkarte" />
          : <div className="flex items-center justify-center h-72 text-green-700 text-sm">Kein Luftbild — lade eines hoch oder klicke, um POIs zu setzen</div>
        }

        {pois?.map(poi => (
          <button
            key={poi.id}
            onClick={e => { e.stopPropagation(); setSelected(poi) }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 text-xl drop-shadow hover:scale-125 transition-transform`}
            style={{ left: `${poi.x_position}%`, top: `${poi.y_position}%` }}
            title={poi.name}
          >
            {TYPE_ICONS[poi.type] || '📍'}
          </button>
        ))}
      </div>

      {newPoi && <NewPoiForm onSave={savePoi} onCancel={() => setNewPoi(null)} />}

      {selected && (
        <PoiDetail poi={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function NewPoiForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('baum')
  return (
    <div className="bg-white rounded-xl border border-green-200 p-4 flex flex-col gap-3">
      <p className="font-semibold text-green-800">Neuer POI</p>
      <input className="border rounded px-3 py-1.5 text-sm" placeholder="Name (z.B. Olivenbaum Nord)" value={name} onChange={e => setName(e.target.value)} />
      <select className="border rounded px-3 py-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
        <option value="baum">🌳 Baum</option>
        <option value="gebäude">🏡 Gebäude</option>
        <option value="beet">🥕 Beet</option>
      </select>
      <div className="flex gap-2">
        <button onClick={() => onSave(name, type)} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm hover:bg-green-800">Speichern</button>
        <button onClick={onCancel} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
      </div>
    </div>
  )
}

function PoiDetail({ poi, onClose }) {
  const cultures = useLiveQuery(() => db.cultures.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const photos = useLiveQuery(() => db.photos.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const logs = useLiveQuery(() => db.logs.where('poi_id').equals(poi.id).reverse().sortBy('date'), [poi.id])

  const [showAddCulture, setShowAddCulture] = useState(false)
  const [cultureName, setCultureName] = useState('')

  async function addCulture() {
    if (!cultureName.trim()) return
    await db.cultures.add({ poi_id: poi.id, plant_name: cultureName, status: 'gepflanzt', planting_date: new Date().toISOString().slice(0, 10), notes: '' })
    setCultureName('')
    setShowAddCulture(false)
  }

  async function addPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      await db.photos.add({ poi_id: poi.id, culture_id: null, date: new Date().toISOString().slice(0, 10), image_data: ev.target.result })
    }
    reader.readAsDataURL(file)
  }

  async function deletePoi() {
    if (!confirm(`"${poi.name}" wirklich löschen?`)) return
    await db.pois.delete(poi.id)
    onClose()
  }

  return (
    <div className="bg-white rounded-xl border border-green-200 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-green-800 text-lg">{TYPE_ICONS[poi.type]} {poi.name}</h2>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm text-gray-600">Kulturen</p>
          <button onClick={() => setShowAddCulture(v => !v)} className="text-green-700 text-xs border border-green-300 px-2 py-0.5 rounded">+ Hinzufügen</button>
        </div>
        {showAddCulture && (
          <div className="flex gap-2 mb-2">
            <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="Pflanze (z.B. Tomate San Marzano)" value={cultureName} onChange={e => setCultureName(e.target.value)} />
            <button onClick={addCulture} className="bg-green-700 text-white px-3 py-1 rounded text-sm">OK</button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {cultures?.map(c => (
            <span key={c.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{c.plant_name} · {c.status}</span>
          ))}
          {!cultures?.length && <span className="text-gray-400 text-sm">Noch keine Kulturen</span>}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm text-gray-600">Fotos</p>
          <label className="text-green-700 text-xs border border-green-300 px-2 py-0.5 rounded cursor-pointer">
            + Foto <input type="file" accept="image/*" className="hidden" onChange={addPhoto} />
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {photos?.map(p => (
            <img key={p.id} src={p.image_data} alt={p.date} className="h-20 w-20 object-cover rounded-lg border flex-shrink-0" />
          ))}
          {!photos?.length && <span className="text-gray-400 text-sm">Noch keine Fotos</span>}
        </div>
      </section>

      <button onClick={deletePoi} className="text-red-500 text-xs self-start hover:underline">POI löschen</button>
    </div>
  )
}
