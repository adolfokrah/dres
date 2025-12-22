import type { Payload } from 'payload'

// Ghana's 16 Regions with major cities
const ghanaRegionsAndCities = [
  {
    name: 'Greater Accra',
    cities: ['Accra', 'Tema', 'Madina', 'Ashaiman', 'Teshie', 'Nungua', 'Dansoman', 'Achimota', 'Adenta', 'Lashibi', 'Spintex', 'East Legon', 'Airport Residential', 'Osu', 'Labadi', 'Cantonments', 'Dzorwulu', 'Labone', 'Kasoa'],
  },
  {
    name: 'Ashanti',
    cities: ['Kumasi', 'Obuasi', 'Ejisu', 'Konongo', 'Mampong', 'Bekwai', 'Adum', 'Bantama', 'Atonsu', 'Tafo', 'Suame', 'Asokwa', 'Manhyia', 'Ahinsan', 'Kwadaso'],
  },
  {
    name: 'Western',
    cities: ['Sekondi-Takoradi', 'Tarkwa', 'Axim', 'Agona Nkwanta', 'Prestea', 'Sefwi Wiawso', 'Shama', 'Essikado'],
  },
  {
    name: 'Western North',
    cities: ['Sefwi Wiawso', 'Bibiani', 'Enchi', 'Juaboso', 'Akontombra'],
  },
  {
    name: 'Central',
    cities: ['Cape Coast', 'Winneba', 'Kasoa', 'Elmina', 'Saltpond', 'Swedru', 'Mankessim', 'Dunkwa-on-Offin', 'Anomabo'],
  },
  {
    name: 'Eastern',
    cities: ['Koforidua', 'Nkawkaw', 'Nsawam', 'Suhum', 'Akim Oda', 'Akosombo', 'Asamankese', 'Aburi', 'Kade', 'Begoro'],
  },
  {
    name: 'Volta',
    cities: ['Ho', 'Hohoe', 'Keta', 'Aflao', 'Kpando', 'Anloga', 'Denu', 'Sogakope'],
  },
  {
    name: 'Oti',
    cities: ['Dambai', 'Jasikan', 'Kadjebi', 'Nkwanta', 'Kete Krachi'],
  },
  {
    name: 'Northern',
    cities: ['Tamale', 'Yendi', 'Savelugu', 'Bimbilla', 'Salaga', 'Damongo', 'Tolon'],
  },
  {
    name: 'Savannah',
    cities: ['Damongo', 'Bole', 'Sawla', 'Buipe', 'Salaga'],
  },
  {
    name: 'North East',
    cities: ['Nalerigu', 'Gambaga', 'Walewale', 'Chereponi'],
  },
  {
    name: 'Upper East',
    cities: ['Bolgatanga', 'Navrongo', 'Bawku', 'Zebilla', 'Paga', 'Sandema'],
  },
  {
    name: 'Upper West',
    cities: ['Wa', 'Tumu', 'Lawra', 'Nandom', 'Jirapa', 'Nadowli'],
  },
  {
    name: 'Bono',
    cities: ['Sunyani', 'Berekum', 'Dormaa Ahenkro', 'Wenchi', 'Techiman'],
  },
  {
    name: 'Bono East',
    cities: ['Techiman', 'Nkoranza', 'Kintampo', 'Atebubu', 'Yeji'],
  },
  {
    name: 'Ahafo',
    cities: ['Goaso', 'Bechem', 'Duayaw Nkwanta', 'Kenyasi', 'Acherensua'],
  },
]

export const seedRegionsAndCities = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding Ghana regions and cities...')

  // Get Ghana country ID
  const ghanaResult = await payload.find({
    collection: 'countries',
    where: {
      name: {
        equals: 'Ghana',
      },
    },
    limit: 1,
  })

  if (ghanaResult.docs.length === 0) {
    payload.logger.error('Ghana country not found! Please seed countries first.')
    return
  }

  const ghanaId = ghanaResult.docs[0].id

  for (const regionData of ghanaRegionsAndCities) {
    // Check if region already exists
    const existingRegion = await payload.find({
      collection: 'regions',
      where: {
        name: {
          equals: regionData.name,
        },
      },
      limit: 1,
    })

    if (existingRegion.docs.length > 0) {
      payload.logger.info(`Region already exists: ${regionData.name}`)
      continue
    }

    // Create region first
    const createdRegion = await payload.create({
      collection: 'regions',
      data: {
        name: regionData.name,
        country: ghanaId,
      },
    })
    payload.logger.info(`Created region: ${regionData.name}`)

    // Create cities with country and region references
    for (const cityName of regionData.cities) {
      // Check if city already exists
      const existingCity = await payload.find({
        collection: 'cities',
        where: {
          name: {
            equals: cityName,
          },
        },
        limit: 1,
      })

      if (existingCity.docs.length === 0) {
        await payload.create({
          collection: 'cities',
          data: {
            name: cityName,
            country: ghanaId,
            region: createdRegion.id,
          },
        })
        payload.logger.info(`  Created city: ${cityName}`)
      }
    }
  }

  payload.logger.info('Ghana regions and cities seeding complete!')
}

// Helper to get city ID by name
export const getCityIdByName = async (payload: Payload, name: string): Promise<string | null> => {
  const result = await payload.find({
    collection: 'cities',
    where: {
      name: {
        equals: name,
      },
    },
    limit: 1,
  })

  return result.docs.length > 0 ? result.docs[0].id : null
}

// Helper to get region ID by name
export const getRegionIdByName = async (payload: Payload, name: string): Promise<string | null> => {
  const result = await payload.find({
    collection: 'regions',
    where: {
      name: {
        equals: name,
      },
    },
    limit: 1,
  })

  return result.docs.length > 0 ? result.docs[0].id : null
}
