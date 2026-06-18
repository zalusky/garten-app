import { useState, useEffect } from 'react'
import GardenMap from './components/GardenMap'
import LogBook from './components/LogBook'
import RecipeBook from './components/RecipeBook'
import SeedInventory from './components/SeedInventory'
import CalendarView from './components/CalendarView'
import BackupRestore from './components/BackupRestore'
import SoilTracker from './components/SoilTracker'
import StatsView from './components/StatsView'
import { Map, BookOpen, FlaskConical, Sprout, CalendarDays, HardDrive, TestTube, BarChart2, X } from 'lucide-react'

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
        {/* Header */}
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

          {/* Übersicht */}
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-800">
            Die GartenApp hilft Selbstversorgern beim Verwalten ihres Gartens: Grundstückskarte mit Points of Interest (POIs), Kulturführung, Logbuch, Rezepte, Saatgut, Bodenanalyse und Ernte-Statistiken — alles offline und datenschutzfreundlich im Browser gespeichert.
          </div>

          <HelpSection title="🗺️ Karte">
            <HelpItem icon="📸">
              <strong>Luftbild hochladen:</strong> Tippe auf „+ Luftbild" und wähle ein Foto deines Grundstücks. Es erscheint eine Vorschau — vergib einen Namen (z.B. „Sommer 2025") und bestätige mit dem grünen Button.
            </HelpItem>
            <HelpItem icon="📍">
              <strong>POI setzen:</strong> Klicke auf „POI setzen" (orange), bewege das Fadenkreuz auf die gewünschte Stelle und klicke. Im Formular gibst du Name, Typ (Baum 🌳 / Gebäude 🏡 / Beet 🥕), optionales Kürzel und Symbolgröße ein.
            </HelpItem>
            <HelpItem icon="✋">
              <strong>POI verschieben:</strong> Aktiviere „Verschieben" (blau), dann ziehe POIs per Drag &amp; Drop an die richtige Position.
            </HelpItem>
            <HelpItem icon="✏️">
              <strong>POI-Name ändern:</strong> Im Eigenschaften-Panel einfach auf den Namen klicken — er wird sofort editierbar. Enter oder Klick außerhalb speichert.
            </HelpItem>
            <HelpItem icon="🏠">
              <strong>Innenansicht (Gebäude/Beet):</strong> Klicke auf ein Gebäude oder Beet, dann auf „Innenansicht". Du gelangst in eine eigene Kartenebene. Dort kannst du weitere POIs und eigene Fotos hinzufügen.
            </HelpItem>
            <HelpItem icon="🖼️">
              <strong>Mehrere Innenansichten:</strong> Lade beliebig viele Fotos pro Ebene hoch (z.B. Erdgeschoss, Obergeschoss, Lagerraum). Die Tabs über der Karte wechseln zwischen Ansichten; das Papierkorb-Icon löscht die aktive Ansicht.
            </HelpItem>
            <HelpItem icon="🔀">
              <strong>Navigation:</strong> Die grüne Leiste oben zeigt den Pfad. „Hauptkarte" bringt dich immer zurück. Klicke auf einen Eintrag im Pfad um direkt dorthin zu springen.
            </HelpItem>
          </HelpSection>

          <HelpSection title="📂 Explorer">
            <HelpItem icon="▶">
              Den Explorer öffnest du mit dem Button „Explorer" oben rechts in der grünen Navigationsleiste.
            </HelpItem>
            <HelpItem icon="🌲">
              Der Explorer zeigt alle POIs als Baum — mit Sub-POIs (einrückbar über den Pfeil) und Kulturen als Blätter.
            </HelpItem>
            <HelpItem icon="🖱️">
              <strong>Anklicken eines POI:</strong> Navigiert automatisch zur richtigen Kartenebene, markiert das Objekt mit einem pulsierenden Ring und öffnet gleichzeitig das Eigenschaften-Panel.
            </HelpItem>
            <HelpItem icon="📋">
              Unten im Explorer erscheinen die Eigenschaften des gewählten Objekts: Kulturen und vorhandene Innenansichts-Fotos.
            </HelpItem>
            <HelpItem icon="📜">
              Karte und Explorer haben getrennte Scrollleisten — der Explorer bleibt beim Scrollen der Karte immer sichtbar.
            </HelpItem>
          </HelpSection>

          <HelpSection title="📖 Logbuch">
            <HelpItem icon="➕">
              Tippe auf „+ Eintrag" um eine Aktion zu dokumentieren: Pflanzung, Gießen, Düngung, Ernte, Behandlung, etc.
            </HelpItem>
            <HelpItem icon="🧺">
              Bei Ernteeinträgen kannst du Menge (kg) und Qualität (1–5 Sterne) eintragen — diese Daten fließen in die Charts ein.
            </HelpItem>
            <HelpItem icon="🔗">
              Aus dem Karten-Eigenschaften-Panel: Klick auf „Logbuch" filtert direkt auf den jeweiligen POI.
            </HelpItem>
          </HelpSection>

          <HelpSection title="🍳 Rezepte">
            <HelpItem icon="➕">Neues Rezept anlegen mit Titel, Zutaten und Zubereitungsschritten.</HelpItem>
            <HelpItem icon="🔗">Rezepte können im Logbuch mit Ernteeinträgen verknüpft werden.</HelpItem>
          </HelpSection>

          <HelpSection title="🌱 Saatgut">
            <HelpItem icon="📦">
              Saatgut-Inventar mit Pflanze, Sorte, Sammeldatum, Haltbarkeitsdatum und Restmenge verwalten.
            </HelpItem>
            <HelpItem icon="⚠️">
              <strong>Ablaufwarnung:</strong> Saatgut das in weniger als 60 Tagen abläuft wird orange hervorgehoben.
            </HelpItem>
            <HelpItem icon="🔄">
              <strong>Fruchtfolge-Warnung:</strong> Die App erkennt automatisch wenn Starkzehrer (Tomate, Gurke, Zucchini …) zwei Jahre in Folge auf demselben Beet wachsen und warnt dich.
            </HelpItem>
          </HelpSection>

          <HelpSection title="🧪 Boden">
            <HelpItem icon="📏">
              Bodenproben pro POI dokumentieren: pH-Wert, Stickstoff (N), Phosphor (P) und Kalium (K).
            </HelpItem>
            <HelpItem icon="🎨">
              Der pH-Wert wird farblich eingestuft: Rot (zu sauer &lt;5.5), Gelb (leicht sauer 5.5–6.5), Grün (optimal 6.5–7.5), Blau (basisch &gt;7.5).
            </HelpItem>
          </HelpSection>

          <HelpSection title="📊 Charts">
            <HelpItem icon="📈">Gesamternte pro POI als Balkendiagramm.</HelpItem>
            <HelpItem icon="📉">Ernte-Entwicklung über die Jahre als Liniendiagramm.</HelpItem>
            <HelpItem icon="🧪">pH-Verlauf der Bodenproben als Liniendiagramm.</HelpItem>
            <HelpItem icon="ℹ️">Daten kommen aus dem Logbuch — je mehr Ernteeinträge, desto aussagekräftiger die Charts.</HelpItem>
          </HelpSection>

          <HelpSection title="📅 Kalender">
            <HelpItem icon="📆">Zeigt alle Logbuch-Einträge und geplante Kulturen im Monatskalender.</HelpItem>
            <HelpItem icon="◀▶">Mit den Pfeilen durch die Monate navigieren.</HelpItem>
          </HelpSection>

          <HelpSection title="💾 Backup &amp; Restore">
            <HelpItem icon="⬇️">
              <strong>Export:</strong> Alle Daten als JSON-Datei herunterladen — als Sicherungskopie oder zum Übertragen auf ein anderes Gerät.
            </HelpItem>
            <HelpItem icon="⬆️">
              <strong>Import:</strong> Eine gespeicherte JSON-Datei zurückladen. Achtung: überschreibt alle vorhandenen Daten!
            </HelpItem>
            <HelpItem icon="🔒">
              Alle Daten bleiben ausschließlich lokal im Browser (IndexedDB). Es werden keine Daten in die Cloud übertragen.
            </HelpItem>
          </HelpSection>

          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 mt-2">
            <strong>Technische Info:</strong> Die GartenApp ist eine Progressive Web App (PWA) — sie funktioniert vollständig offline. Karten-Hintergrundbilder werden im lokalen Browser-Speicher (localStorage) abgelegt, alle anderen Daten in IndexedDB (Dexie.js). Quellcode: <a href="https://github.com/zalusky/garten-app" target="_blank" rel="noreferrer" className="text-green-700 underline">github.com/zalusky/garten-app</a>
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

  // Tab-Wechsel mit History-Eintrag damit Zurück-Button zwischen Tabs navigiert
  function switchTab(newTab) {
    if (newTab !== 'log') setLogFilterPoi(null)
    setTab(newTab)
    history.pushState({ gartenTab: newTab }, '')
  }

  function openLogForPoi(poi) {
    setLogFilterPoi(poi)
    switchTab('log')
  }

  // Zurück-Button: Tab aus History-State wiederherstellen
  useEffect(() => {
    function onPop() {
      const state = history.state
      if (state?.gartenTab) setTab(state.gartenTab)
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
        {tab === 'map'     && <GardenMap onOpenLog={openLogForPoi} />}
        {tab === 'log'     && <LogBook filterPoi={logFilterPoi} onClearFilter={() => setLogFilterPoi(null)} />}
        {tab === 'recipes' && <RecipeBook />}
        {tab === 'seeds'   && <SeedInventory />}
        {tab === 'soil'    && <SoilTracker />}
        {tab === 'stats'   && <StatsView />}
        {tab === 'cal'     && <CalendarView />}
        {tab === 'backup'  && <BackupRestore />}
      </main>

      <nav className="bg-white border-t border-green-200 flex sticky bottom-0 overflow-x-auto flex-shrink-0">
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
      </nav>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
