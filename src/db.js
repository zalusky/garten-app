import Dexie from 'dexie'

export const db = new Dexie('GartenApp')

db.version(1).stores({
  pois:      '++id, name, type, parent_id',
  cultures:  '++id, poi_id, plant_name, status, planting_date',
  photos:    '++id, poi_id, culture_id, date',
  recipes:   '++id, title',
  logs:      '++id, poi_id, culture_id, date, action_type, recipe_id',
  seeds:     '++id, plant_name, variety, expiry_date',
  soil:      '++id, poi_id, date',
})

db.version(2).stores({
  pois:      '++id, name, type, parent_id',
  cultures:  '++id, poi_id, plant_name, status, planting_date',
  photos:    '++id, poi_id, culture_id, date',
  recipes:   '++id, title',
  logs:      '++id, poi_id, culture_id, date, action_type, recipe_id',
  seeds:     '++id, plant_name, variety, expiry_date',
  soil:      '++id, poi_id, date, ph, nitrogen, phosphorus, potassium',
}).upgrade(tx => {
  return tx.pois.toCollection().modify(poi => {
    if (poi.abbreviation === undefined) poi.abbreviation = ''
    if (poi.size === undefined) poi.size = 28
  })
})

// Version 3: POIs an Layer (view_index) binden
// Bestehende POIs bekommen view_index=0 (gehören zur ersten Ansicht)
db.version(3).stores({
  pois:      '++id, name, type, parent_id, view_index',
  cultures:  '++id, poi_id, plant_name, status, planting_date',
  photos:    '++id, poi_id, culture_id, date',
  recipes:   '++id, title',
  logs:      '++id, poi_id, culture_id, date, action_type, recipe_id',
  seeds:     '++id, plant_name, variety, expiry_date',
  soil:      '++id, poi_id, date, ph, nitrogen, phosphorus, potassium',
}).upgrade(tx => {
  return tx.pois.toCollection().modify(poi => {
    if (poi.view_index === undefined) poi.view_index = 0
  })
})
