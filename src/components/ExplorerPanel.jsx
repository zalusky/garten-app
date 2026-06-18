import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { ChevronRight, ChevronDown, X } from 'lucide-react'

const TYPE_ICONS = { baum: '🌳', gebäude: '🏡', beet: '🥕' }

function getAncestorStack(poiId, allPois) {
  const stack = []
  let p = allPois.find(x => x.id === poiId)
  while (p?.parent_id) {
    stack.unshift(p.parent_id)
    p = allPois.find(x => x.id === p.parent_id)
  }
  return stack
}

function loadInnerViews(poiId) {
  const raw = localStorage.getItem(`gartenMapImg_poi_${poiId}`)
  if (!raw) return []
  if (raw.startsWith('[')) { try { return JSON.parse(raw) } catch { return [] } }
  return [{ name: 'Ansicht 1', data: raw }]
}

function PoiTreeNode({ poi, allPois, allCultures, depth, selectedId, onSelect, expanded, onToggle }) {
  const children = allPois.filter(p => p.parent_id === poi.id)
  const cultures = allCultures?.filter(c => c.poi_id === poi.id) || []
  const hasChildren = children.length > 0 || cultures.length > 0
  const isExpanded = expanded.has(poi.id)

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 rounded cursor-pointer text-sm
          ${selectedId === poi.id ? 'bg-green-100 text-green-900 font-semibold' : 'text-gray-700 hover:bg-green-50'}`}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: 8 }}
        onClick={() => onSelect(poi)}
      >
        <span
          className="flex-shrink-0 w-4 flex items-center justify-center text-gray-400"
          onClick={e => { if (hasChildren) { e.stopPropagation(); onToggle(poi.id) } }}
        >
          {hasChildren ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
        </span>
        <span className="flex-shrink-0">{TYPE_ICONS[poi.type] || '📍'}</span>
        <span className="truncate flex-1 ml-1">{poi.name}</span>
        {poi.abbreviation && (
          <span className="text-xs text-green-600 font-mono flex-shrink-0">({poi.abbreviation})</span>
        )}
      </div>

      {isExpanded && (
        <div>
          {children.map(child => (
            <PoiTreeNode
              key={child.id}
              poi={child}
              allPois={allPois}
              allCultures={allCultures}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
          {cultures.map(c => (
            <div
              key={`c-${c.id}`}
              className="flex items-center gap-1 text-xs text-gray-500 py-0.5"
              style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
            >
              <span className="w-4 flex-shrink-0" />
              <span>🌱</span>
              <span className="truncate">{c.plant_name}{c.variety ? ` (${c.variety})` : ''}</span>
              <span className="text-gray-400 flex-shrink-0 ml-1">· {c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExplorerPanel({ onClose, onNavigate }) {
  const allPois = useLiveQuery(() => db.pois.toArray(), [])
  const allCultures = useLiveQuery(() => db.cultures.toArray(), [])
  const [selectedId, setSelectedId] = useState(null)
  const [expanded, setExpanded] = useState(new Set())

  const rootPois = allPois?.filter(p => !p.parent_id) || []

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelect(poi) {
    setSelectedId(poi.id)
    if (allPois) {
      const stack = getAncestorStack(poi.id, allPois)
      onNavigate(stack, poi.id)
    }
  }

  const selectedPoi = allPois?.find(p => p.id === selectedId)
  const selectedCultures = allCultures?.filter(c => c.poi_id === selectedId) || []
  const innerViews = selectedPoi ? loadInnerViews(selectedPoi.id) : []

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-green-800 text-white flex-shrink-0">
        <span className="font-semibold text-sm">📂 Explorer</span>
        <button onClick={onClose} className="text-green-300 hover:text-white"><X size={16} /></button>
      </div>

      {/* Tree */}
      <div className="py-1">
        {rootPois.length === 0 && (
          <p className="text-gray-400 text-xs px-4 py-6 text-center">
            Noch keine POIs angelegt.<br />Wechsle zur Karte und setze POIs.
          </p>
        )}
        {rootPois.map(poi => (
          <PoiTreeNode
            key={poi.id}
            poi={poi}
            allPois={allPois || []}
            allCultures={allCultures}
            depth={0}
            selectedId={selectedId}
            onSelect={handleSelect}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        ))}
      </div>

      {/* Eigenschaften-Panel */}
      {selectedPoi ? (
        <div className="border-t border-green-200 bg-green-50 p-3 sticky bottom-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl leading-none">{TYPE_ICONS[selectedPoi.type] || '📍'}</span>
            <div>
              <p className="font-bold text-green-800 text-sm leading-tight">{selectedPoi.name}</p>
              {selectedPoi.abbreviation && (
                <p className="text-xs text-green-600">Kürzel: {selectedPoi.abbreviation}</p>
              )}
              <p className="text-xs text-gray-500 capitalize">{selectedPoi.type}</p>
            </div>
          </div>

          {selectedCultures.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Kulturen ({selectedCultures.length})
              </p>
              <div className="flex flex-col gap-0.5">
                {selectedCultures.map(c => (
                  <span key={c.id} className="text-xs bg-white border border-gray-100 rounded px-2 py-0.5">
                    🌱 {c.plant_name}{c.variety ? ` (${c.variety})` : ''}{' '}
                    <span className="text-gray-400">· {c.status}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {innerViews.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Innenansichten ({innerViews.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {innerViews.map((v, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-0.5">
                    <img
                      src={v.data}
                      alt={v.name}
                      className="h-14 w-20 object-cover rounded border border-gray-200"
                    />
                    <span className="text-xs text-gray-500">{v.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCultures.length === 0 && innerViews.length === 0 && (
            <p className="text-xs text-gray-400">Keine weiteren Daten vorhanden.</p>
          )}
        </div>
      ) : (
        <div className="border-t border-green-200 p-3 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Element anklicken für Eigenschaften
          </p>
        </div>
      )}
    </div>
  )
}
