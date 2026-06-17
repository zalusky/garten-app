import { useState, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, X, Move, BookOpen, List } from 'lucide-react'

const TYPE_ICONS = { baum: '🌳', gebäude: '🏡', beet: '🥕' }

function GridCanvas() {
  return (
    <div className="w-full h-72 relative" style={{ background: '#f0f7e6' }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c6dfb0" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid10" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect width="200" height="200" fill="url(#grid)"/>
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#a3c47a" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid10)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-green-700 text-sm font-medium">Kein Luftbild vorhanden</p>
          <p className="text-green-600 text-xs mt-1">Lade ein Luftbild hoch oder setze POIs direkt auf diesem Raster</p>
        </div>
      </div>
    </div>
  )
}

export default function GardenMap({ onOpenLog }) {
  const [mapImg, setMapImg] = useState(() => localStorage.getItem('gartenMapImg') || null)
  const [addMode, setAddMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [showList, setShowList] = useState(false)
  const [newPoi, setNewPoi] = useState(null)
  const [selected, setSelected] = useState(null)
  const [crosshair, setCrosshair] = useState({ x: 50, y: 50, visible: false })
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

  function handleMouseMove(e) {
    const rect = mapRef.current.getBoundingClientRect()
    setCrosshair({
      x: ((e.clientX - rect.left) / rect.width * 100),
      y: ((e.clientY - rect.top) / rect.height * 100),
      visible: true,
    })
  }

  function handleMapClick(e) {
    if (moveMode) return
    if (!addMode) return
    const { x, y } = getRelativePos(e)
    setNewPoi({ x, y })
    setAddMode(false)
  }

  async function savePoi(name, type, abbreviation, size) {
    if (!name.trim()) return
    await db.pois.add({ name, type, abbreviation: abbreviation || '', size: size || 28, x_position: newPoi.x, y_position: newPoi.y, parent_id: null })
    setNewPoi(null)
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { localStorage.setItem('gartenMapImg', ev.target.result); setMapImg(ev.target.result) }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Toolbar */}
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
        <button
          onClick={() => setShowList(v => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${showList ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
        >
          <List size={14} /> POI-Liste
        </button>
        {addMode && <span className="text-orange-600 text-sm font-medium">Fadenkreuz auf gewünschte Stelle → klicken</span>}
        {moveMode && <span className="text-blue-600 text-sm font-medium">POI anklicken & ziehen</span>}
      </div>

      <div className="flex gap-4">
        {/* Karte */}
        <div className="flex-1 relative">
          <div
            ref={mapRef}
            onClick={handleMapClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCrosshair(c => ({ ...c, visible: false }))}
            className={`relative w-full rounded-xl overflow-hidden border-2 select-none
              ${addMode ? 'border-orange-400' : moveMode ? 'border-blue-400' : 'border-green-200'}
              cursor-none`}
            style={{ minHeight: 340, background: '#d4edba' }}
          >
            {mapImg
              ? <img src={mapImg} className="w-full h-full object-cover" alt="Gartenkarte" draggable={false} />
              : <GridCanvas />
            }

            {/* Fadenkreuz — immer sichtbar beim Hovern */}
            {crosshair.visible && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                {/* horizontale Linie */}
                <div className="absolute w-full" style={{
                  top: `${crosshair.y}%`,
                  height: '1px',
                  background: addMode ? 'rgba(249,115,22,0.7)' : 'rgba(22,163,74,0.5)',
                }} />
                {/* vertikale Linie */}
                <div className="absolute h-full" style={{
                  left: `${crosshair.x}%`,
                  width: '1px',
                  background: addMode ? 'rgba(249,115,22,0.7)' : 'rgba(22,163,74,0.5)',
                }} />
                {/* Mittelpunkt */}
                <div className="absolute rounded-full border-2" style={{
                  left: `${crosshair.x}%`,
                  top: `${crosshair.y}%`,
                  width: 10, height: 10,
                  transform: 'translate(-50%, -50%)',
                  borderColor: addMode ? 'rgba(249,115,22,0.9)' : 'rgba(22,163,74,0.7)',
                  background: 'transparent',
                }} />
                {/* Koordinaten-Anzeige */}
                <div className="absolute text-xs font-mono px-1 rounded" style={{
                  left: `${crosshair.x}%`,
                  top: `${crosshair.y}%`,
                  transform: 'translate(8px, -20px)',
                  color: addMode ? 'rgb(194,65,12)' : 'rgb(22,101,52)',
                  background: 'rgba(255,255,255,0.8)',
                }}>
                  {crosshair.x.toFixed(0)}% / {crosshair.y.toFixed(0)}%
                </div>
              </div>
            )}

            {/* POI Marker */}
            {pois?.map(poi => (
              <PoiMarker
                key={poi.id}
                poi={poi}
                moveMode={moveMode}
                isSelected={selected?.id === poi.id}
                onSelect={() => { if (!moveMode) setSelected(poi) }}
                onDragMove={async (x, y) => db.pois.update(poi.id, { x_position: x, y_position: y })}
                mapRef={mapRef}
              />
            ))}
          </div>

          {/* Neuer POI Form */}
          {newPoi && <NewPoiForm onSave={savePoi} onCancel={() => setNewPoi(null)} />}
        </div>

        {/* POI-Liste Sidebar */}
        {showList && (
          <div className="w-48 bg-white border border-green-200 rounded-xl p-3 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 400 }}>
            <p className="font-semibold text-green-800 text-sm mb-1">Alle POIs</p>
            {pois?.length === 0 && <p className="text-gray-400 text-xs">Noch keine POIs</p>}
            {pois?.map(poi => (
              <button
                key={poi.id}
                onClick={() => setSelected(poi)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-colors
                  ${selected?.id === poi.id ? 'bg-green-100 text-green-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <span style={{ fontSize: (poi.size || 28) * 0.6 + 'px' }}>{TYPE_ICONS[poi.type] || '📍'}</span>
                <span className="flex-1 truncate">{poi.name}</span>
                {poi.abbreviation && <span className="text-xs text-green-600 font-mono">{poi.abbreviation}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POI Detailansicht als Panel */}
      {selected && (
        <PoiDetail
          poi={selected}
          onClose={() => setSelected(null)}
          onOpenLog={onOpenLog}
        />
      )}
    </div>
  )
}

function PoiMarker({ poi, moveMode, isSelected, onSelect, onDragMove, mapRef }) {
  const dragRef = useRef(false)
  const size = poi.size || 28

  function handleMouseDown(e) {
    if (!moveMode) return
    e.preventDefault()
    e.stopPropagation()
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

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${poi.x_position}%`,
        top: `${poi.y_position}%`,
        transform: 'translate(-50%, -50%)',
        cursor: moveMode ? 'grab' : 'pointer',
        userSelect: 'none',
        zIndex: isSelected ? 15 : 10,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onClick={e => { e.stopPropagation(); if (!moveMode) onSelect() }}
    >
      {poi.abbreviation && (
        <span
          className="bg-white/90 text-green-900 font-bold rounded px-1 leading-tight mb-0.5 shadow-sm"
          style={{ fontSize: Math.max(9, size * 0.4) + 'px' }}
        >
          {poi.abbreviation}
        </span>
      )}
      <span
        style={{ fontSize: size + 'px', lineHeight: 1 }}
        className={`drop-shadow-md transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
        title={poi.name}
      >
        {TYPE_ICONS[poi.type] || '📍'}
      </span>
      {isSelected && (
        <div className="absolute inset-0 rounded-full ring-2 ring-orange-400 ring-offset-1 pointer-events-none"
          style={{ transform: 'scale(1.5)' }} />
      )}
    </div>
  )
}

function NewPoiForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('baum')
  const [abbreviation, setAbbreviation] = useState('')
  const [size, setSize] = useState(28)

  return (
    <div className="mt-3 bg-white rounded-xl border border-orange-200 p-4 flex flex-col gap-3">
      <p className="font-semibold text-orange-700">📍 Neuer POI — Position gewählt</p>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-3 py-1.5 text-sm col-span-2" placeholder="Name (z.B. Olivenbaum Nord)" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <select className="border rounded px-3 py-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
          <option value="baum">🌳 Baum</option>
          <option value="gebäude">🏡 Gebäude</option>
          <option value="beet">🥕 Beet</option>
        </select>
        <input className="border rounded px-3 py-1.5 text-sm" placeholder="Kürzel z.B. OB1, GH" maxLength={5} value={abbreviation} onChange={e => setAbbreviation(e.target.value.toUpperCase())} />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 whitespace-nowrap">Symbolgröße:</label>
        <input type="range" min={16} max={56} value={size} onChange={e => setSize(Number(e.target.value))} className="flex-1" />
        <span style={{ fontSize: size + 'px', lineHeight: 1 }}>{TYPE_ICONS[type] || '📍'}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(name, type, abbreviation, size)} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm hover:bg-green-800">Speichern</button>
        <button onClick={onCancel} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
      </div>
    </div>
  )
}

function PoiDetail({ poi, onClose, onOpenLog }) {
  const cultures = useLiveQuery(() => db.cultures.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const photos = useLiveQuery(() => db.photos.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const logs = useLiveQuery(() => db.logs.where('poi_id').equals(poi.id).reverse().sortBy('date'), [poi.id])

  const [showAddCulture, setShowAddCulture] = useState(false)
  const [cultureForm, setCultureForm] = useState({ plant_name: '', variety: '', status: 'gepflanzt', planting_date: new Date().toISOString().slice(0,10) })
  const [editSize, setEditSize] = useState(poi.size || 28)
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0,10))

  async function addCulture() {
    if (!cultureForm.plant_name.trim()) return
    await db.cultures.add({ poi_id: poi.id, ...cultureForm, notes: '' })
    setCultureForm({ plant_name: '', variety: '', status: 'gepflanzt', planting_date: new Date().toISOString().slice(0,10) })
    setShowAddCulture(false)
  }

  async function addPhoto(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => await db.photos.add({ poi_id: poi.id, culture_id: null, date: photoDate, image_data: ev.target.result })
    reader.readAsDataURL(file)
  }

  async function deletePoi() {
    if (!confirm(`"${poi.name}" wirklich löschen?`)) return
    await db.pois.delete(poi.id); onClose()
  }

  return (
    <div className="bg-white rounded-xl border-2 border-green-300 p-4 flex flex-col gap-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: editSize + 'px' }}>{TYPE_ICONS[poi.type]}</span>
          <div>
            <h2 className="font-bold text-green-800 text-base leading-tight">{poi.name}</h2>
            {poi.abbreviation && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">{poi.abbreviation}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenLog && onOpenLog(poi)}
            className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm hover:bg-green-800"
          >
            <BookOpen size={14} /> Logbuch
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      </div>

      {/* Größe */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
        <label className="text-xs text-gray-500 whitespace-nowrap">Symbolgröße:</label>
        <input type="range" min={16} max={56} value={editSize}
          onChange={e => { setEditSize(Number(e.target.value)); db.pois.update(poi.id, { size: Number(e.target.value) }) }}
          className="flex-1" />
        <span style={{ fontSize: editSize + 'px' }}>{TYPE_ICONS[poi.type]}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Kulturen */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm text-gray-600">Kulturen</p>
            <button onClick={() => setShowAddCulture(v => !v)} className="text-green-700 text-xs border border-green-300 px-2 py-0.5 rounded">+</button>
          </div>
          {showAddCulture && (
            <div className="flex flex-col gap-1 mb-2 bg-gray-50 rounded-lg p-2">
              <input className="border rounded px-2 py-1 text-xs" placeholder="Pflanze (z.B. Tomate San Marzano)" value={cultureForm.plant_name} onChange={e => setCultureForm(f => ({...f, plant_name: e.target.value}))} />
              <input className="border rounded px-2 py-1 text-xs" placeholder="Sorte (optional)" value={cultureForm.variety} onChange={e => setCultureForm(f => ({...f, variety: e.target.value}))} />
              <div className="flex gap-1">
                <select className="border rounded px-2 py-1 text-xs flex-1" value={cultureForm.status} onChange={e => setCultureForm(f => ({...f, status: e.target.value}))}>
                  <option value="geplant">🗓 Geplant</option>
                  <option value="gepflanzt">🌱 Gepflanzt</option>
                  <option value="geerntet">🧺 Geerntet</option>
                  <option value="entfernt">❌ Entfernt</option>
                </select>
                <input type="date" className="border rounded px-2 py-1 text-xs flex-1" value={cultureForm.planting_date} onChange={e => setCultureForm(f => ({...f, planting_date: e.target.value}))} />
              </div>
              <button onClick={addCulture} className="bg-green-700 text-white px-2 py-1 rounded text-xs">Speichern</button>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {cultures?.map(c => (
              <div key={c.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg">
                <span className="font-medium">{c.plant_name}</span>
                {c.variety && <span className="text-green-600"> ({c.variety})</span>}
                <span className="text-green-500 ml-1">· {c.status} {c.planting_date && `· ${c.planting_date}`}</span>
              </div>
            ))}
            {!cultures?.length && <span className="text-gray-400 text-xs">Noch keine</span>}
          </div>
        </section>

        {/* Letzte Log-Einträge */}
        <section>
          <p className="font-semibold text-sm text-gray-600 mb-2">Letzte Aktivitäten</p>
          <div className="flex flex-col gap-1">
            {logs?.slice(0, 3).map(l => (
              <div key={l.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-400">{l.date}</span> · {l.action_type}
              </div>
            ))}
            {!logs?.length && <span className="text-gray-400 text-xs">Noch keine Einträge</span>}
          </div>
        </section>
      </div>

      {/* Fotos chronologisch */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm text-gray-600">Fotos (chronologisch)</p>
          <div className="flex items-center gap-2">
            <input type="date" className="border rounded px-2 py-0.5 text-xs" value={photoDate} onChange={e => setPhotoDate(e.target.value)} title="Datum des Fotos" />
            <label className="text-green-700 text-xs border border-green-300 px-2 py-0.5 rounded cursor-pointer">
              + Foto <input type="file" accept="image/*" className="hidden" onChange={addPhoto} />
            </label>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[...(photos || [])].sort((a,b) => a.date?.localeCompare(b.date)).map(p => (
            <div key={p.id} className="flex flex-col items-center flex-shrink-0">
              <img src={p.image_data} alt={p.date} className="h-20 w-20 object-cover rounded-lg border" />
              <span className="text-xs text-gray-400 mt-1">{p.date}</span>
            </div>
          ))}
          {!photos?.length && <span className="text-gray-400 text-sm">Noch keine Fotos</span>}
        </div>
      </section>

      <button onClick={deletePoi} className="text-red-500 text-xs self-start hover:underline">POI löschen</button>
    </div>
  )
}
