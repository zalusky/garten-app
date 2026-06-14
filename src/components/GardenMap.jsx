import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, X, Move } from 'lucide-react'

const TYPE_ICONS = {
  baum:    '🌳',
  gebäude: '🏡',
  beet:    '🥕',
}

export default function GardenMap() {
  const [mapImg, setMapImg] = useState(() => localStorage.getItem('gartenMapImg') || null)
  const [addMode, setAddMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [newPoi, setNewPoi] = useState(null)
  const [selected, setSelected] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const mapRef = useRef()

  const pois = useLiveQuery(() => db.pois.toArray(), [])

  function getRelativePos(e) {
    const rect = mapRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width * 100))).toFixed(1),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height * 100))).toFixed(1),
    }
  }

  function handleMapClick(e) {
    if (moveMode || draggingId) return
    if (!addMode) return
    const { x, y } = getRelativePos(e)
    setNewPoi({ x, y })
    setAddMode(false)
  }

  async function handlePoiDrop(e) {
    if (!draggingId) return
    e.preventDefault()
    const { x, y } = getRelativePos(e)
    await db.pois.update(draggingId, { x_position: x, y_position: y })
    setDraggingId(null)
  }

  async function savePoi(name, type, abbreviation, size) {
    if (!name.trim()) return
    await db.pois.add({
      name,
      type,
      abbreviation: abbreviation || '',
      size: size || 28,
      x_position: newPoi.x,
      y_position: newPoi.y,
      parent_id: null,
    })
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
      <div className="flex gap-2 items-center flex-wrap">
        <label className="cursor-pointer bg-green-700 text-white px-3 py-1.5 rounded text-sm hover:bg-green-800">
          Luftbild hochladen
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <button
          onClick={() => { setAddMode(v => !v); setMoveMode(false) }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${addMode ? 'bg-orange-500 text-white' : 'bg-white border border-green-300 text-green-700'}`}
        >
          <Plus size={14} /> POI setzen
        </button>
        <button
          onClick={() => { setMoveMode(v => !v); setAddMode(false) }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${moveMode ? 'bg-blue-500 text-white' : 'bg-white border border-blue-300 text-blue-700'}`}
        >
          <Move size={14} /> Verschieben
        </button>
        {addMode && <span className="text-orange-600 text-sm font-medium">↓ Klick auf die Karte um POI zu platzieren</span>}
        {moveMode && <span className="text-blue-600 text-sm font-medium">↓ POI anklicken & ziehen</span>}
      </div>

      {/* Karte */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        onMouseUp={handlePoiDrop}
        onTouchEnd={handlePoiDrop}
        className={`relative w-full rounded-xl overflow-hidden border-2 select-none
          ${addMode ? 'border-orange-400' : moveMode ? 'border-blue-400' : 'border-green-200'}
          ${addMode ? 'cursor-crosshair' : moveMode ? 'cursor-move' : 'cursor-default'}`}
        style={{ minHeight: 340, background: '#d4edba' }}
      >
        {/* Fadenkreuz beim Hinzufügen */}
        {addMode && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative w-8 h-8">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-orange-400 opacity-50" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-orange-400 opacity-50" />
            </div>
          </div>
        )}

        {mapImg
          ? <img src={mapImg} className="w-full h-full object-cover" alt="Gartenkarte" draggable={false} />
          : <div className="flex items-center justify-center h-72 text-green-700 text-sm">Kein Luftbild — lade eines hoch oder klicke, um POIs zu setzen</div>
        }

        {pois?.map(poi => (
          <PoiMarker
            key={poi.id}
            poi={poi}
            moveMode={moveMode}
            onSelect={() => { if (!moveMode) setSelected(poi) }}
            onDragStart={() => setDraggingId(poi.id)}
            onDragMove={async (x, y) => {
              await db.pois.update(poi.id, { x_position: x, y_position: y })
            }}
            mapRef={mapRef}
          />
        ))}
      </div>

      {newPoi && <NewPoiForm onSave={savePoi} onCancel={() => setNewPoi(null)} />}

      {selected && (
        <PoiDetail poi={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function PoiMarker({ poi, moveMode, onSelect, onDragMove, mapRef }) {
  const dragRef = useRef(false)

  function handleMouseDown(e) {
    if (!moveMode) return
    e.preventDefault()
    dragRef.current = true

    function onMove(ev) {
      if (!dragRef.current) return
      const rect = mapRef.current.getBoundingClientRect()
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width * 100))).toFixed(1)
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height * 100))).toFixed(1)
      onDragMove(x, y)
    }

    function onUp() {
      dragRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
  }

  const size = poi.size || 28

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${poi.x_position}%`,
        top: `${poi.y_position}%`,
        transform: 'translate(-50%, -50%)',
        cursor: moveMode ? 'grab' : 'pointer',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onClick={e => { e.stopPropagation(); if (!moveMode) onSelect() }}
    >
      {/* Kürzel über dem Symbol */}
      {poi.abbreviation && (
        <span
          className="bg-white/90 text-green-900 font-bold rounded px-1 leading-tight mb-0.5 shadow"
          style={{ fontSize: Math.max(9, size * 0.4) + 'px' }}
        >
          {poi.abbreviation}
        </span>
      )}
      {/* Symbol */}
      <span
        className={`drop-shadow transition-transform ${moveMode ? 'hover:scale-110' : 'hover:scale-125'}`}
        style={{ fontSize: size + 'px', lineHeight: 1 }}
        title={poi.name}
      >
        {TYPE_ICONS[poi.type] || '📍'}
      </span>
    </div>
  )
}

function NewPoiForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('baum')
  const [abbreviation, setAbbreviation] = useState('')
  const [size, setSize] = useState(28)

  return (
    <div className="bg-white rounded-xl border border-green-200 p-4 flex flex-col gap-3">
      <p className="font-semibold text-green-800">Neuer POI</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border rounded px-3 py-1.5 text-sm col-span-2"
          placeholder="Name (z.B. Olivenbaum Nord)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select className="border rounded px-3 py-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
          <option value="baum">🌳 Baum</option>
          <option value="gebäude">🏡 Gebäude</option>
          <option value="beet">🥕 Beet</option>
        </select>
        <input
          className="border rounded px-3 py-1.5 text-sm"
          placeholder="Kürzel (z.B. OB1, GH)"
          maxLength={5}
          value={abbreviation}
          onChange={e => setAbbreviation(e.target.value.toUpperCase())}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 whitespace-nowrap">Symbolgröße:</label>
        <input
          type="range" min={16} max={56} value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="flex-1"
        />
        <span style={{ fontSize: size + 'px', lineHeight: 1 }}>{TYPE_ICONS[type] || '📍'}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(name, type, abbreviation, size)} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm hover:bg-green-800">Speichern</button>
        <button onClick={onCancel} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
      </div>
    </div>
  )
}

function PoiDetail({ poi, onClose }) {
  const cultures = useLiveQuery(() => db.cultures.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const photos = useLiveQuery(() => db.photos.where('poi_id').equals(poi.id).toArray(), [poi.id])

  const [showAddCulture, setShowAddCulture] = useState(false)
  const [cultureName, setCultureName] = useState('')
  const [editSize, setEditSize] = useState(poi.size || 28)

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

  async function updateSize(s) {
    setEditSize(s)
    await db.pois.update(poi.id, { size: s })
  }

  async function deletePoi() {
    if (!confirm(`"${poi.name}" wirklich löschen?`)) return
    await db.pois.delete(poi.id)
    onClose()
  }

  return (
    <div className="bg-white rounded-xl border border-green-200 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-green-800 text-lg">
          <span style={{ fontSize: editSize + 'px' }}>{TYPE_ICONS[poi.type]}</span> {poi.name}
          {poi.abbreviation && <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded font-mono">{poi.abbreviation}</span>}
        </h2>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      {/* Größe anpassen */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
        <label className="text-xs text-gray-500 whitespace-nowrap">Symbolgröße:</label>
        <input type="range" min={16} max={56} value={editSize} onChange={e => updateSize(Number(e.target.value))} className="flex-1" />
        <span style={{ fontSize: editSize + 'px', lineHeight: 1 }}>{TYPE_ICONS[poi.type]}</span>
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
