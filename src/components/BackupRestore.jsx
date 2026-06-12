import { db } from '../db'
import { Download, Upload } from 'lucide-react'

export default function BackupRestore() {
  async function exportBackup() {
    const data = {
      version: 1,
      exported: new Date().toISOString(),
      pois:     await db.pois.toArray(),
      cultures: await db.cultures.toArray(),
      photos:   await db.photos.toArray(),
      recipes:  await db.recipes.toArray(),
      logs:     await db.logs.toArray(),
      seeds:    await db.seeds.toArray(),
      soil:     await db.soil.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `garten-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importBackup(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('Achtung: Import überschreibt ALLE vorhandenen Daten. Fortfahren?')) return
    const text = await file.text()
    const data = JSON.parse(text)
    await db.transaction('rw', db.pois, db.cultures, db.photos, db.recipes, db.logs, db.seeds, db.soil, async () => {
      await db.pois.clear();     if (data.pois?.length)     await db.pois.bulkAdd(data.pois)
      await db.cultures.clear(); if (data.cultures?.length) await db.cultures.bulkAdd(data.cultures)
      await db.photos.clear();   if (data.photos?.length)   await db.photos.bulkAdd(data.photos)
      await db.recipes.clear();  if (data.recipes?.length)  await db.recipes.bulkAdd(data.recipes)
      await db.logs.clear();     if (data.logs?.length)     await db.logs.bulkAdd(data.logs)
      await db.seeds.clear();    if (data.seeds?.length)    await db.seeds.bulkAdd(data.seeds)
      await db.soil.clear();     if (data.soil?.length)     await db.soil.bulkAdd(data.soil)
    })
    alert('Import erfolgreich!')
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <h2 className="font-bold text-green-800 text-lg">💾 Daten-Autarkie</h2>
      <p className="text-sm text-gray-600">Alle Daten leben ausschließlich auf deinem Gerät (IndexedDB). Sichere sie regelmäßig als JSON-Datei auf USB-Stick oder Festplatte.</p>

      <button
        onClick={exportBackup}
        className="flex items-center justify-center gap-3 bg-green-700 text-white py-4 rounded-xl text-base font-semibold hover:bg-green-800 transition-colors"
      >
        <Download size={22} />
        Daten-Backup exportieren
      </button>

      <label className="flex items-center justify-center gap-3 border-2 border-dashed border-green-300 text-green-700 py-4 rounded-xl text-base font-semibold cursor-pointer hover:bg-green-50 transition-colors">
        <Upload size={22} />
        Backup importieren
        <input type="file" accept=".json" className="hidden" onChange={importBackup} />
      </label>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>Hinweis:</strong> Fotos werden als Base64 in der Backup-Datei gespeichert. Bei vielen Fotos kann die Datei groß werden.
      </div>
    </div>
  )
}
