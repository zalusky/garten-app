import { useState, useEffect, useRef } from 'react'
import GardenMap from './components/GardenMap'
import LogBook from './components/LogBook'
import RecipeBook from './components/RecipeBook'
import SeedInventory from './components/SeedInventory'
import CalendarView from './components/CalendarView'
import BackupRestore from './components/BackupRestore'
import SoilTracker from './components/SoilTracker'
import StatsView from './components/StatsView'
import { Map, BookOpen, FlaskConical, Sprout, CalendarDays, HardDrive, TestTube, BarChart2, X, Camera, Plus, Move, List, Trash2 } from 'lucide-react'

const TABS = [
  { id: 'map',     label: 'Karte',     icon: Map },
  { id: 'log',     label: 'Logbuch',   icon: BookOpen },
  { id: 'recipes', label: 'Rezepte',   icon: FlaskConical },
  { id: 'seeds',   label: 'Saatgut',   icon: Sprout },
  { id: 'soil',    label: 'Boden',     icon: TestTube },
  { id: 'stats',   label: 'Charts',    icon: BarChart2 },
  { id: 'cal',     label: 'Kalender',  icon: CalendarDays },
  { id: 'backup',  label: 'Backup',    icon: HardDrive },
]

function HelpSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="font-bold text-green-800 text-base mb-2 border-b border-green-100 pb-1">{title}</h3>
      <div className="text-sm text-gray-700 flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function HelpItem({ icon, children }) {
  return (
    <div className="flex gap-2">
      <span className="flex-shrink-0 text-green-600 mt-0.5">{icon || '→'}</span>
      <span>{children}</span>
    </div>
  )
}

function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-green-800 text-white rounded-t-2xl sticky top-0">
          <div>
            <h2 className="text-lg font-bold">🌿 GartenApp — Benutzerhandbuch</h2>
            <p className="text-green-300 text-xs mt-0.5">Offline · Privat · Alle Daten bleiben auf deinem Gerät</p>
          </div>
          <button onClick={onClose} className="text-green-300 hover:text-white ml-4 flex-shrink-0">
            <X size={22} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-800">
            Die GartenApp hilft Selbstversorgern beim Verwalten ihres Gartens: Grundstückskarte mit Points of Interest (POIs), Kulturführung, Logbuch, Rezepte, Saatgut, Bodenanalyse und Ernte-Statistiken — alles offline und datenschutzfreundlich im Browser gespeichert.
          </div>
          <HelpSection title="🗺️ Karte">
            <HelpItem icon="📸"><strong>Luftbild hochladen:</strong> Tippe auf das Kamera-Icon unten in der Leiste. Es erscheint eine Vorschau — vergib einen Namen und bestätige.</HelpItem>
            <HelpItem icon="📍"><strong>POI setzen:</strong> Klicke auf „+ POI" (orange), bewege das Fadenkreuz und klicke. Im Formular gibst du Name, Typ, Kürzel und Größe ein.</HelpItem>
            <HelpItem icon="✋"><strong>POI verschieben:</strong> Aktiviere „Verschieben" (blau), dann ziehe POIs per Drag &amp; Drop.</HelpItem>
            <HelpItem icon="✏️"><strong>POI-Name ändern:</strong> Im Eigenschaften-Panel auf den Namen klicken — Enter oder Klick außerhalb speichert.</HelpItem>
            <HelpItem icon="🏠"><strong>Innenansicht:</strong> Klicke auf ein Gebäude/Beet → „Innenansicht". Eigene Kartenebene mit POIs und Fotos.</HelpItem>
            <HelpItem icon="🖼️"><strong>Mehrere Ansichten:</strong> Mehrere Fotos pro Ebene hochladen. Tabs in der unteren Leiste wechseln zwischen Ansichten.</HelpItem>
            <HelpItem icon="🔀"><strong>Navigation:</strong> Grüne Leiste oben zeigt den Pfad. Klick auf Eintrag springt direkt dorthin.</HelpItem>
          </HelpSection>
          <HelpSection title="📂 Explorer">
            <HelpItem icon="▶">Den Explorer öffnest du mit dem Button in der grünen Navigationsleiste oben rechts.</HelpItem>
            <HelpItem icon="🌲">Der Explorer zeigt alle POIs als Baum mit Sub-POIs und Kulturen als Blätter.</HelpItem>
            <HelpItem icon="🖱️"><strong>Anklicken eines POI:</strong> Navigiert zur Kartenebene, markiert das Objekt und öffnet das Eigenschaften-Panel.</HelpItem>
          </HelpSection>
          <HelpSection title="📖 Logbuch">
            <HelpItem icon="➕">„+ Eintrag" für Aktionen: Pflanzung, Gießen, Düngung, Ernte, Behandlung.</HelpItem>
            <HelpItem icon="🧺">Bei Ernte: Menge (kg) und Qualität (1–5 Sterne) → fließt in Charts ein.</HelpItem>
          </HelpSection>
          <HelpSection title="🍳 Rezepte">
            <HelpItem icon="➕">Neues Rezept mit Titel, Zutaten und Zubereitungsschritten.</HelpItem>
          </HelpSection>
          <HelpSection title="🌱 Saatgut">
            <HelpItem icon="📦">Inventar mit Sorte, Sammeldatum, Haltbarkeit und Restmenge.</HelpItem>
            <HelpItem icon="⚠️"><strong>Ablaufwarnung:</strong> Saatgut &lt;60 Tage wird orange hervorgehoben.</HelpItem>
            <HelpItem icon="🔄"><strong>Fruchtfolge-Warnung:</strong> Starkzehrer 2 Jahre in Folge auf demselben Beet → Warnung.</HelpItem>
          </HelpSection>
          <HelpSection title="🧪 Boden">
            <HelpItem icon="📏">pH, N, P, K pro POI dokumentieren.</HelpItem>
            <HelpItem icon="🎨">pH farblich: Rot &lt;5.5, Gelb 5.5–6.5, Grün 6.5–7.5, Blau &gt;7.5.</HelpItem>
          </HelpSection>
          <HelpSection title="📊 Charts">
            <HelpItem icon="📈">Gesamternte pro POI, Ernte-Entwicklung über Jahre, pH-Verlauf.</HelpItem>
          </HelpSection>
          <HelpSection title="📅 Kalender">
            <HelpItem icon="📆">Logbuch-Einträge und geplante Kulturen im Monatskalender.</HelpItem>
          </HelpSection>
          <HelpSection title="💾 Backup &amp; Restore">
            <HelpItem icon="⬇️"><strong>Export:</strong> Alle Daten als JSON-Datei herunterladen.</HelpItem>
            <HelpItem icon="⬆️"><strong>Import:</strong> JSON zurückladen — überschreibt alle vorhandenen Daten!</HelpItem>
            <HelpItem icon="🔒">Alle Daten bleiben lokal im Browser (IndexedDB). Keine Cloud.</HelpItem>
          </HelpSection>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 mt-2">
            <strong>Technische Info:</strong> PWA, funktioniert vollständig offline. Quellcode: <a href="https://github.com/zalusky/garten-app" target="_blank" rel="noreferrer" className="text-green-700 underline">github.com/zalusky/garten-app</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('map')
  const [logFilterPoi, setLogFilterPoi] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  // ── Karten-Toolbar-State (hier, damit er in der sticky Nav gerendert werden kann) ──
  const [mapAddMode, setMapAddMode] = useState(false)
  const [mapMoveMode, setMapMoveMode] = useState(false)
  const [mapShowList, setMapShowList] = useState(false)
  const [mapViews, setMapViews] = useState([])
  const [mapActiveViewIdx, setMapActiveViewIdx] = useState(0)
  const mapUploadRef = useRef(null) // GardenMap setzt diese Funktion beim Mount

  function switchTab(newTab) {
    if (newTab !== 'log') setLogFilterPoi(null)
    setTab(newTab)
    history.pushState({ gartenTab: newTab }, '')
  }

  function openLogForPoi(poi) {
    setLogFilterPoi(poi)
    switchTab('log')
  }

  useEffect(() => {
    function onPop() {
      const state = history.state
      if (!state || state.gartenSentinel) return
      if (state.gartenTab) setTab(state.gartenTab)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-green-50">
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <span className="text-2xl">🌿</span>
        <h1 className="text-xl font-bold tracking-tight">GartenApp</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="ml-1 w-6 h-6 rounded-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
          title="Hilfe / Benutzerhandbuch"
        >
          ?
        </button>
        <span className="ml-auto text-green-300 text-sm">Offline · Privat · Autark</span>
      </header>

      <main className="flex-1 overflow-auto min-h-0">
        {tab === 'map'     && (
          <GardenMap
            onOpenLog={openLogForPoi}
            addMode={mapAddMode} setAddMode={setMapAddMode}
            moveMode={mapMoveMode} setMoveMode={setMapMoveMode}
            showList={mapShowList}
            views={mapViews} setViews={setMapViews}
            activeViewIdx={mapActiveViewIdx} setActiveViewIdx={setMapActiveViewIdx}
            uploadRef={mapUploadRef}
          />
        )}
        {tab === 'log'     && <LogBook filterPoi={logFilterPoi} onClearFilter={() => setLogFilterPoi(null)} />}
        {tab === 'recipes' && <RecipeBook />}
        {tab === 'seeds'   && <SeedInventory />}
        {tab === 'soil'    && <SoilTracker />}
        {tab === 'stats'   && <StatsView />}
        {tab === 'cal'     && <CalendarView />}
        {tab === 'backup'  && <BackupRestore />}
      </main>

      <nav className="bg-white border-t border-green-200 flex sticky bottom-0 overflow-x-auto flex-shrink-0">
        {/* Standard-Tabs */}
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex-shrink-0 flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors
              ${tab === id ? 'text-green-700 font-semibold' : 'text-gray-500 hover:text-green-600'}`}
          >
            <Icon size={18} />
            {label}
            {id === 'log' && logFilterPoi && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
          </button>
        ))}

        {/* ── Karten-Toolbar (nur sichtbar wenn Karte aktiv) ── */}
        {tab === 'map' && (
          <>
            <div className="w-px bg-green-200 my-1 flex-shrink-0" />

            {/* Foto hochladen */}
            <button
              onClick={() => mapUploadRef.current?.()}
              className="flex-shrink-0 flex flex-col items-center py-2 px-3 text-xs gap-1 text-gray-500 hover:text-green-600"
            >
              <Camera size={18} />
              Foto
            </button>

            {/* Ansicht-Tabs */}
            {mapViews.map((v, i) => (
              <button
                key={i}
                onClick={() => setMapActiveViewIdx(i)}
                className={`flex-shrink-0 flex flex-col items-center py-2 px-2 text-xs gap-1 transition-colors
                  ${mapActiveViewIdx === i ? 'text-green-700 font-semibold border-t-2 border-green-600' : 'text-gray-400 hover:text-green-600'}`}
              >
                <span className="text-base leading-none">🖼️</span>
                {v.name}
              </button>
            ))}

            {/* Ansicht löschen */}
            {mapViews.length > 1 && (
              <button
                onClick={() => {
                  const v = mapViews[mapActiveViewIdx]
                  if (!v || !confirm(`Ansicht "${v.name}" löschen?`)) return
                  const next = mapViews.filter((_, i) => i !== mapActiveViewIdx)
                  setMapViews(next)
                  setMapActiveViewIdx(Math.max(0, mapActiveViewIdx - 1))
                }}
                className="flex-shrink-0 flex flex-col items-center py-2 px-2 text-xs gap-1 text-red-400 hover:text-red-600"
              >
                <Trash2 size={18} />
                Löschen
              </button>
            )}

            <div className="w-px bg-green-200 my-1 flex-shrink-0" />

            {/* POI setzen */}
            <button
              onClick={() => { setMapAddMode(v => !v); setMapMoveMode(false) }}
              className={`flex-shrink-0 flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors
                ${mapAddMode ? 'text-orange-600 font-semibold' : 'text-gray-500 hover:text-green-600'}`}
            >
              <Plus size={18} />
              POI
            </button>

            {/* Verschieben */}
            <button
              onClick={() => { setMapMoveMode(v => !v); setMapAddMode(false) }}
              className={`flex-shrink-0 flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors
                ${mapMoveMode ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-green-600'}`}
            >
              <Move size={18} />
              Verschieben
            </button>

            {/* Liste */}
            <button
              onClick={() => setMapShowList(v => !v)}
              className={`flex-shrink-0 flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors
                ${mapShowList ? 'text-green-700 font-semibold' : 'text-gray-500 hover:text-green-600'}`}
            >
              <List size={18} />
              Liste
            </button>
          </>
        )}
      </nav>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
