import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { X, BookOpen, ChevronRight, Home, FolderOpen } from 'lucide-react'
import ExplorerPanel from './ExplorerPanel'

const TYPE_ICONS = { baum: '🌳', gebäude: '🏡', beet: '🥕' }

function loadViews(imgKey) {
  try {
    const raw = localStorage.getItem(imgKey)
    if (!raw) return []
    if (raw.startsWith('[')) return JSON.parse(raw)
    return [{ name: 'Ansicht 1', data: raw }]
  } catch { return [] }
}

function saveViews(imgKey, views) {
  try {
    if (views.length === 0) { localStorage.removeItem(imgKey); return true }
    localStorage.setItem(imgKey, JSON.stringify(views))
    return true
  } catch { return false }
}

function GridCanvas({ label }) {
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
          <p className="text-green-700 text-sm font-medium">{label || 'Kein Bild vorhanden'}</p>
          <p className="text-green-600 text-xs mt-1">Foto hochladen oder POIs direkt auf dem Raster setzen</p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// GardenMap — Toolbar-State kommt als Props aus App.jsx (sticky bottom nav)
// =============================================================================
export default function GardenMap({
  onOpenLog,
  addMode, setAddMode,
  moveMode, setMoveMode,
  showList,
  views, setViews,
  activeViewIdx, setActiveViewIdx,
  uploadRef,
}) {
  const [navStack, setNavStack] = useState([])
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [highlightedPoiId, setHighlightedPoiId] = useState(null)
  const [openedPoiId, setOpenedPoiId] = useState(null)
  const [explorerWidth, setExplorerWidth] = useState(272)
  const highlightTimer = useRef(null)
  const resizeDragRef = useRef(false)

  const [pendingImg, setPendingImg] = useState(null)
  const [pendingName, setPendingName] = useState('')
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef()

  const allPois = useLiveQuery(() => db.pois.toArray(), [])

  const currentParentId = navStack.length > 0 ? navStack[navStack.length - 1] : null
  const currentParentPoi = allPois?.find(p => p.id === currentParentId) || null
  const breadcrumb = navStack.map(id => allPois?.find(p => p.id === id)).filter(Boolean)
  const imgKey = currentParentId ? `gartenMapImg_poi_${currentParentId}` : 'gartenMapImg'
  const mapImg = views[Math.min(activeViewIdx, views.length - 1)]?.data || null

  // Beim Navigationswechsel: Views neu laden, Modi zurücksetzen
  useEffect(() => {
    setViews(loadViews(imgKey))
    setActiveViewIdx(0)
    setAddMode(false)
    setMoveMode(false)
    setPendingImg(null)
    setPendingName('')
    setUploadError(null)
  }, [imgKey])

  // Upload-Trigger für App.jsx registrieren
  useEffect(() => {
    if (uploadRef) uploadRef.current = () => fileInputRef.current?.click()
    return () => { if (uploadRef) uploadRef.current = null }
  }, [uploadRef])

  // History / Back-Button
  useEffect(() => {
    history.replaceState({ gartenSentinel: true }, '')
    history.pushState({ gartenStack: [] }, '')
    function onPop() {
      if (history.state?.gartenSentinel) {
        history.pushState({ gartenStack: [] }, '')
        setNavStack([])
        return
      }
      setNavStack(history.state?.gartenStack ?? [])
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function goTo(newStack) {
    setNavStack(newStack)
    history.pushState({ gartenStack: newStack }, '')
  }
  function drillInto(poi) { goTo([...navStack, poi.id]) }
  function navigateTo(index) { goTo(navStack.slice(0, index)) }

  function handleExplorerNavigate(stack, poiId) {
    goTo(stack)
    setOpenedPoiId(poiId)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    setHighlightedPoiId(poiId)
    highlightTimer.current = setTimeout(() => setHighlightedPoiId(null), 3000)
  }

  function startResize(e) {
    e.preventDefault()
    resizeDragRef.current = true
    function onMove(ev) {
      if (!resizeDragRef.current) return
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      setExplorerWidth(Math.min(480, Math.max(160, window.innerWidth - clientX)))
    }
    function onUp() {
      resizeDragRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = ev => {
      setPendingImg(ev.target.result)
      setPendingName(`Ansicht ${views.length + 1}`)
    }
    reader.onerror = () => setUploadError('Datei konnte nicht gelesen werden.')
    reader.readAsDataURL(file)
  }

  function confirmImage() {
    const name = pendingName.trim() || `Ansicht ${views.length + 1}`
    const newViews = [...views, { name, data: pendingImg }]
    if (!saveViews(imgKey, newViews)) {
      setUploadError('Speichern fehlgeschlagen: Bild zu groß.')
      return
    }
    setViews(newViews)
    setActiveViewIdx(newViews.length - 1)
    setPendingImg(null)
    setPendingName('')
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 112px)' }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

        {/* ── Breadcrumb-Leiste (bleibt als schmale grüne Leiste oben) ── */}
        <div className="flex items-center bg-green-800 text-white text-sm px-3 py-2 gap-1 flex-shrink-0 sticky top-0 z-10">
          {navStack.length > 0 ? (
            <>
              <button onClick={() => goTo([])} className="flex items-center gap-1 hover:text-green-300 flex-shrink-0">
                <Home size={13} />
              </button>
              {breadcrumb.map((poi, i) => (
                <span key={poi.id} className="flex items-center gap-0.5 flex-shrink-0">
                  <ChevronRight size={13} className="text-green-500" />
                  <button
                    onClick={() => navigateTo(i + 1)}
                    className={`hover:text-green-300 max-w-32 truncate text-xs ${i === breadcrumb.length - 1 ? 'text-white font-semibold' : 'text-green-300'}`}
                  >
                    {TYPE_ICONS[poi.type]} {poi.name}
                  </button>
                </span>
              ))}
            </>
          ) : (
            <span className="flex items-center gap-1 text-green-300 text-xs"><Home size={13} /> Hauptkarte</span>
          )}
          <button
            onClick={() => setExplorerOpen(v => !v)}
            className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-xs flex-shrink-0 ${explorerOpen ? 'bg-green-600' : 'hover:bg-green-700'}`}
          >
            <FolderOpen size={13} /> Explorer
          </button>
        </div>

        {/* Fehlermeldung */}
        {uploadError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between gap-2 flex-shrink-0">
            <span className="text-red-700 text-xs">⚠️ {uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        {/* Bild-Vorschau */}
        {pendingImg && (
          <div className="bg-amber-50 border-b border-amber-300 p-3 flex flex-col gap-2 flex-shrink-0">
            <input
              className="border rounded px-3 py-1.5 text-sm"
              placeholder="Name der Ansicht z.B. Erdgeschoss"
              value={pendingName}
              onChange={e => setPendingName(e.target.value)}
            />
            <img src={pendingImg} alt="Vorschau" className="w-full max-h-40 object-contain rounded border border-amber-200" />
            <div className="flex gap-2">
              <button onClick={confirmImage} className="flex-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold">
                ✓ Bestätigen &amp; speichern
              </button>
              <button onClick={() => setPendingImg(null)} className="flex-1 border px-3 py-1.5 rounded text-sm">
                ✗ Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <MapLevel
            key={currentParentId ?? 'root'}
            parentId={currentParentId}
            parentPoi={currentParentPoi}
            allPois={allPois}
            mapImg={mapImg}
            activeViewIdx={activeViewIdx}
            addMode={addMode}
            setAddMode={setAddMode}
            moveMode={moveMode}
            showList={showList}
            onDrillInto={drillInto}
            onOpenLog={onOpenLog}
            highlightedPoiId={highlightedPoiId}
            openedPoiId={openedPoiId}
            onOpenedPoiHandled={() => setOpenedPoiId(null)}
          />
        </div>
      </div>

      {/* Explorer-Panel */}
      {explorerOpen && (
        <div className="flex-shrink-0 flex min-h-0" style={{ width: explorerWidth, borderLeft: '1px solid #bbf7d0' }}>
          <div
            className="flex-shrink-0 w-2 cursor-col-resize hover:bg-green-300 active:bg-green-400 transition-colors"
            onMouseDown={startResize}
            onTouchStart={startResize}
          />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <ExplorerPanel onClose={() => setExplorerOpen(false)} onNavigate={handleExplorerNavigate} />
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MapLevel
// =============================================================================
function MapLevel({ parentId, parentPoi, allPois, mapImg, activeViewIdx, addMode, setAddMode, moveMode, showList, onDrillInto, onOpenLog, highlightedPoiId, openedPoiId, onOpenedPoiHandled }) {
  const [newPoi, setNewPoi] = useState(null)
  const [selected, setSelected] = useState(null)
  const [crosshair, setCrosshair] = useState({ x: 50, y: 50, visible: false })
  const mapRef = useRef()

  const pois = allPois?.filter(p => {
    const matchParent = parentId === null
      ? (p.parent_id === null || p.parent_id === undefined)
      : p.parent_id === parentId
    const matchView = (p.view_index ?? 0) === activeViewIdx
    return matchParent && matchView
  })

  useEffect(() => {
    if (!openedPoiId || !pois) return
    const poi = pois.find(p => p.id === openedPoiId)
    if (poi) { setSelected(poi); onOpenedPoiHandled?.() }
  }, [openedPoiId, pois])

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
    setCrosshair({ x: (e.clientX - rect.left) / rect.width * 100, y: (e.clientY - rect.top) / rect.height * 100, visible: true })
  }

  function handleMapClick(e) {
    if (moveMode || !addMode) return
    const { x, y } = getRelativePos(e)
    setNewPoi({ x, y })
    setAddMode(false)
  }

  async function savePoi(name, type, abbreviation, size) {
    if (!name.trim()) return
    await db.pois.add({
      name, type,
      abbreviation: abbreviation || '',
      size: size || 28,
      x_position: newPoi.x,
      y_position: newPoi.y,
      parent_id: parentId,
      view_index: activeViewIdx,
    })
    setNewPoi(null)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {parentPoi && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-amber-800 text-sm">
            <span className="text-lg mr-2">{TYPE_ICONS[parentPoi.type]}</span>
            Innenansicht: <strong>{parentPoi.name}</strong>
            {parentPoi.abbreviation && <span className="ml-1 text-amber-600">({parentPoi.abbreviation})</span>}
          </span>
          <span className="text-xs text-amber-600">Sub-Elemente dieses Objekts</span>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <div
            ref={mapRef}
            onClick={handleMapClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCrosshair(c => ({ ...c, visible: false }))}
            className={`relative w-full rounded-xl overflow-hidden border-2 select-none cursor-none
              ${addMode ? 'border-orange-400' : moveMode ? 'border-blue-400' : 'border-green-200'}`}
            style={{ minHeight: 340, background: '#d4edba' }}
          >
            {mapImg
              ? <img src={mapImg} className="w-full h-full object-cover" alt="Karte" draggable={false} />
              : <GridCanvas label={parentPoi ? `Kein Foto für "${parentPoi.name}"` : undefined} />
            }

            {crosshair.visible && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                <div className="absolute w-full" style={{ top: `${crosshair.y}%`, height: '1px', background: addMode ? 'rgba(249,115,22,0.7)' : 'rgba(22,163,74,0.5)' }} />
                <div className="absolute h-full" style={{ left: `${crosshair.x}%`, width: '1px', background: addMode ? 'rgba(249,115,22,0.7)' : 'rgba(22,163,74,0.5)' }} />
                <div className="absolute rounded-full border-2" style={{ left: `${crosshair.x}%`, top: `${crosshair.y}%`, width: 10, height: 10, transform: 'translate(-50%,-50%)', borderColor: addMode ? 'rgba(249,115,22,0.9)' : 'rgba(22,163,74,0.7)' }} />
                <div className="absolute text-xs font-mono px-1 rounded" style={{ left: `${crosshair.x}%`, top: `${crosshair.y}%`, transform: 'translate(8px,-20px)', color: addMode ? 'rgb(194,65,12)' : 'rgb(22,101,52)', background: 'rgba(255,255,255,0.8)' }}>
                  {Math.round(crosshair.x)}% / {Math.round(crosshair.y)}%
                </div>
              </div>
            )}

            {pois?.map(poi => (
              <PoiMarker
                key={poi.id}
                poi={poi}
                moveMode={moveMode}
                isSelected={selected?.id === poi.id}
                isHighlighted={highlightedPoiId === poi.id}
                onSelect={() => { if (!moveMode) setSelected(poi) }}
                onDragMove={async (x, y) => db.pois.update(poi.id, { x_position: x, y_position: y })}
                mapRef={mapRef}
              />
            ))}
          </div>

          {newPoi && <NewPoiForm onSave={savePoi} onCancel={() => setNewPoi(null)} parentPoi={parentPoi} />}
        </div>

        {showList && (
          <div className="w-44 bg-white border border-green-200 rounded-xl p-3 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 400 }}>
            <p className="font-semibold text-green-800 text-sm mb-1">{parentPoi ? `In: ${parentPoi.name}` : 'POIs'}</p>
            {!pois?.length && <p className="text-gray-400 text-xs">Noch keine POIs</p>}
            {pois?.map(poi => (
              <button key={poi.id} onClick={() => setSelected(poi)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm
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

      {selected && (
        <PoiDetail
          poi={selected}
          onClose={() => setSelected(null)}
          onOpenLog={onOpenLog}
          onDrillInto={() => { setSelected(null); onDrillInto(selected) }}
          canDrillInto={selected.type === 'gebäude' || selected.type === 'beet'}
        />
      )}
    </div>
  )
}

// =============================================================================
// PoiMarker
// =============================================================================
function PoiMarker({ poi, moveMode, isSelected, isHighlighted, onSelect, onDragMove, mapRef }) {
  const dragRef = useRef(false)
  const size = poi.size || 28

  function handleMouseDown(e) {
    if (!moveMode) return
    e.preventDefault(); e.stopPropagation()
    dragRef.current = true
    function onMove(ev) {
      if (!dragRef.current) return
      const rect = mapRef.current.getBoundingClientRect()
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      onDragMove(
        Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width * 100))).toFixed(1),
        Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height * 100))).toFixed(1)
      )
    }
    function onUp() {
      dragRef.current = false
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true }); window.addEventListener('touchend', onUp)
  }

  return (
    <div
      className="absolute"
      style={{ left: `${poi.x_position}%`, top: `${poi.y_position}%`, transform: 'translate(-50%,-50%)', cursor: moveMode ? 'grab' : 'pointer', userSelect: 'none', zIndex: isSelected || isHighlighted ? 15 : 10, width: size + 'px', height: size + 'px' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onClick={e => { e.stopPropagation(); if (!moveMode) onSelect() }}
    >
      <span style={{ fontSize: size + 'px', lineHeight: 1, display: 'block' }}
        className={`drop-shadow-md transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
        title={poi.name}>
        {TYPE_ICONS[poi.type] || '📍'}
      </span>
      {poi.abbreviation && (
        <span className="absolute inset-0 flex items-center justify-center font-bold text-white pointer-events-none select-none"
          style={{ fontSize: Math.max(8, size * 0.38) + 'px', textShadow: '0 0 3px #000, 0 0 3px #000', lineHeight: 1 }}>
          {poi.abbreviation}
        </span>
      )}
      {(poi.type === 'gebäude' || poi.type === 'beet') && (
        <span className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full flex items-center justify-center pointer-events-none"
          style={{ width: Math.max(10, size * 0.32) + 'px', height: Math.max(10, size * 0.32) + 'px', fontSize: Math.max(7, size * 0.22) + 'px' }}>
          ↗
        </span>
      )}
      {isSelected && <div className="absolute inset-0 rounded-full ring-2 ring-orange-400 ring-offset-1 pointer-events-none" style={{ transform: 'scale(1.4)' }} />}
      {isHighlighted && !isSelected && <div className="absolute inset-0 rounded-full ring-2 ring-green-400 ring-offset-1 pointer-events-none animate-pulse" style={{ transform: 'scale(1.6)' }} />}
    </div>
  )
}

// =============================================================================
// NewPoiForm
// =============================================================================
function NewPoiForm({ onSave, onCancel, parentPoi }) {
  const [name, setName] = useState('')
  const [type, setType] = useState(parentPoi?.type === 'gebäude' ? 'beet' : 'baum')
  const [abbreviation, setAbbreviation] = useState('')
  const [size, setSize] = useState(28)

  return (
    <div className="mt-3 bg-white rounded-xl border border-orange-200 p-4 flex flex-col gap-3">
      <p className="font-semibold text-orange-700">📍 Neuer POI {parentPoi ? `in "${parentPoi.name}"` : '— Hauptkarte'}</p>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-3 py-1.5 text-sm col-span-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <select className="border rounded px-3 py-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
          <option value="baum">🌳 Baum</option>
          <option value="gebäude">🏡 Gebäude</option>
          <option value="beet">🥕 Beet</option>
        </select>
        <input className="border rounded px-3 py-1.5 text-sm" placeholder="Kürzel z.B. GH1" maxLength={5} value={abbreviation} onChange={e => setAbbreviation(e.target.value.toUpperCase())} />
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

// =============================================================================
// PoiDetail
// =============================================================================
function PoiDetail({ poi, onClose, onOpenLog, onDrillInto, canDrillInto }) {
  const cultures = useLiveQuery(() => db.cultures.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const photos = useLiveQuery(() => db.photos.where('poi_id').equals(poi.id).toArray(), [poi.id])
  const logs = useLiveQuery(() => db.logs.where('poi_id').equals(poi.id).reverse().sortBy('date'), [poi.id])
  const subPois = useLiveQuery(() => db.pois.where('parent_id').equals(poi.id).toArray(), [poi.id])

  const [showAddCulture, setShowAddCulture] = useState(false)
  const [cultureForm, setCultureForm] = useState({ plant_name: '', variety: '', status: 'gepflanzt', planting_date: new Date().toISOString().slice(0, 10) })
  const [editSize, setEditSize] = useState(poi.size || 28)
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0, 10))
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(poi.name)

  async function saveName() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== poi.name) await db.pois.update(poi.id, { name: trimmed })
    setEditingName(false)
  }

  async function addCulture() {
    if (!cultureForm.plant_name.trim()) return
    await db.cultures.add({ poi_id: poi.id, ...cultureForm, notes: '' })
    setCultureForm({ plant_name: '', variety: '', status: 'gepflanzt', planting_date: new Date().toISOString().slice(0, 10) })
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: editSize + 'px' }}>{TYPE_ICONS[poi.type]}</span>
          <div>
            {editingName ? (
              <input className="border-b-2 border-green-500 bg-transparent font-bold text-green-800 text-base leading-tight outline-none w-full"
                value={nameValue} onChange={e => setNameValue(e.target.value)}
                onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }} autoFocus />
            ) : (
              <h2 className="font-bold text-green-800 text-base leading-tight cursor-pointer hover:underline hover:text-green-600"
                onClick={() => setEditingName(true)} title="Klicken zum Bearbeiten">
                {poi.name} <span className="text-gray-300 text-xs font-normal">✏</span>
              </h2>
            )}
            {poi.abbreviation && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">{poi.abbreviation}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDrillInto && (
            <button onClick={onDrillInto} className="flex items-center gap-1 bg-amber-600 text-white px-3 py-1.5 rounded text-sm hover:bg-amber-700">
              🏠 Innenansicht
            </button>
          )}
          <button onClick={() => onOpenLog && onOpenLog(poi)} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm hover:bg-green-800">
            <BookOpen size={14} /> Logbuch
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      </div>

      {subPois?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-amber-700 mb-1">Sub-Elemente ({subPois.length})</p>
          <div className="flex flex-wrap gap-1">
            {subPois.map(s => (
              <span key={s.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {TYPE_ICONS[s.type]} {s.name} {s.abbreviation && `(${s.abbreviation})`}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
        <label className="text-xs text-gray-500 whitespace-nowrap">Symbolgröße:</label>
        <input type="range" min={16} max={56} value={editSize}
          onChange={e => { setEditSize(Number(e.target.value)); db.pois.update(poi.id, { size: Number(e.target.value) }) }} className="flex-1" />
        <span style={{ fontSize: editSize + 'px' }}>{TYPE_ICONS[poi.type]}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm text-gray-600">Kulturen</p>
            <button onClick={() => setShowAddCulture(v => !v)} className="text-green-700 text-xs border border-green-300 px-2 py-0.5 rounded">+</button>
          </div>
          {showAddCulture && (
            <div className="flex flex-col gap-1 mb-2 bg-gray-50 rounded-lg p-2">
              <input className="border rounded px-2 py-1 text-xs" placeholder="Pflanze" value={cultureForm.plant_name} onChange={e => setCultureForm(f => ({...f, plant_name: e.target.value}))} />
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
                <span className="text-green-500 ml-1">· {c.status}</span>
              </div>
            ))}
            {!cultures?.length && <span className="text-gray-400 text-xs">Noch keine</span>}
          </div>
        </section>

        <section>
          <p className="font-semibold text-sm text-gray-600 mb-2">Letzte Aktivitäten</p>
          <div className="flex flex-col gap-1">
            {logs?.slice(0, 4).map(l => (
              <div key={l.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-400">{l.date}</span> · {l.action_type}
              </div>
            ))}
            {!logs?.length && <span className="text-gray-400 text-xs">Noch keine Einträge</span>}
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm text-gray-600">Fotos (chronologisch)</p>
          <div className="flex items-center gap-2">
            <input type="date" className="border rounded px-2 py-0.5 text-xs" value={photoDate} onChange={e => setPhotoDate(e.target.value)} />
            <label className="text-green-700 text-xs border border-green-300 px-2 py-0.5 rounded cursor-pointer">
              + Foto <input type="file" accept="image/*" className="hidden" onChange={addPhoto} />
            </label>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[...(photos || [])].sort((a, b) => a.date?.localeCompare(b.date)).map(p => (
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
