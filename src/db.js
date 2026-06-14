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
  soil:      '++id, poi_id, date',
}).upgrade(tx => {
  return tx.pois.toCollection().modify(poi => {
    if (poi.abbreviation === undefined) poi.abbreviation = ''
    if (poi.size === undefined) poi.size = 28
  })
})
