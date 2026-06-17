import { useState } from 'react'
import GardenMap from './components/GardenMap'
import LogBook from './components/LogBook'
import RecipeBook from './components/RecipeBook'
import SeedInventory from './components/SeedInventory'
import CalendarView from './components/CalendarView'
import BackupRestore from './components/BackupRestore'
import SoilTracker from './components/SoilTracker'
import StatsView from './components/StatsView'
import { Map, BookOpen, FlaskConical, Sprout, CalendarDays, HardDrive, TestTube, BarChart2 } from 'lucide-react'

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

export default function App() {
  const [tab, setTab] = useState('map')
  const [logFilterPoi, setLogFilterPoi] = useState(null)

  function openLogForPoi(poi) {
    setLogFilterPoi(poi)
    setTab('log')
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🌿</span>
        <h1 className="text-xl font-bold tracking-tight">GartenApp</h1>
        <span className="ml-auto text-green-300 text-sm">Offline · Privat · Autark</span>
      </header>

      <main className="flex-1 overflow-auto">
        {tab === 'map'     && <GardenMap onOpenLog={openLogForPoi} />}
        {tab === 'log'     && <LogBook filterPoi={logFilterPoi} onClearFilter={() => setLogFilterPoi(null)} />}
        {tab === 'recipes' && <RecipeBook />}
        {tab === 'seeds'   && <SeedInventory />}
        {tab === 'soil'    && <SoilTracker />}
        {tab === 'stats'   && <StatsView />}
        {tab === 'cal'     && <CalendarView />}
        {tab === 'backup'  && <BackupRestore />}
      </main>

      <nav className="bg-white border-t border-green-200 flex sticky bottom-0 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); if (id !== 'log') setLogFilterPoi(null) }}
            className={`flex-shrink-0 flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors
              ${tab === id ? 'text-green-700 font-semibold' : 'text-gray-500 hover:text-green-600'}`}
          >
            <Icon size={18} />
            {label}
            {id === 'log' && logFilterPoi && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
