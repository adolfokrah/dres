import type { Payload } from 'payload'

// Ghana's 16 Regions with major cities
const ghanaRegionsAndCities = [
  {
    name: 'Greater Accra',
    cities: ['Accra', 'Tema', 'Madina', 'Ashaiman', 'Teshie', 'Nungua', 'Dansoman', 'Achimota', 'Adenta', 'Lashibi', 'Spintex', 'East Legon', 'Airport Residential', 'Osu', 'Labadi', 'Cantonments', 'Dzorwulu', 'Labone'],
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

// Nigeria's States with major cities
const nigeriaStatesAndCities = [
  {
    name: 'Lagos',
    cities: ['Lagos Island', 'Victoria Island', 'Ikeja', 'Lekki', 'Surulere', 'Yaba', 'Ikoyi', 'Ajah', 'Festac', 'Oshodi', 'Mushin', 'Agege', 'Apapa', 'Maryland', 'Gbagada', 'Ogudu', 'Magodo', 'Ilupeju', 'Ojota'],
  },
  {
    name: 'Abuja FCT',
    cities: ['Abuja', 'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Lugbe', 'Nyanya', 'Karu', 'Jabi', 'Utako', 'Life Camp'],
  },
  {
    name: 'Rivers',
    cities: ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Bonny', 'Okrika', 'Oyigbo', 'Omoku', 'Ahoada'],
  },
  {
    name: 'Kano',
    cities: ['Kano', 'Fagge', 'Nassarawa', 'Tarauni', 'Ungogo', 'Dala', 'Gwale', 'Kumbotso'],
  },
  {
    name: 'Oyo',
    cities: ['Ibadan', 'Ogbomosho', 'Oyo', 'Iseyin', 'Saki', 'Eruwa', 'Igboho'],
  },
  {
    name: 'Kaduna',
    cities: ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Kachia'],
  },
  {
    name: 'Delta',
    cities: ['Warri', 'Asaba', 'Sapele', 'Ughelli', 'Agbor', 'Ozoro', 'Effurun'],
  },
  {
    name: 'Ogun',
    cities: ['Abeokuta', 'Sagamu', 'Ijebu Ode', 'Ota', 'Ilaro', 'Ifo'],
  },
  {
    name: 'Anambra',
    cities: ['Onitsha', 'Awka', 'Nnewi', 'Ekwulobia', 'Ihiala', 'Ogidi'],
  },
  {
    name: 'Enugu',
    cities: ['Enugu', 'Nsukka', 'Agbani', 'Oji River', 'Udi'],
  },
  {
    name: 'Edo',
    cities: ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua'],
  },
  {
    name: 'Imo',
    cities: ['Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise'],
  },
  {
    name: 'Kwara',
    cities: ['Ilorin', 'Offa', 'Jebba', 'Omu-Aran', 'Lafiagi'],
  },
  {
    name: 'Osun',
    cities: ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Ikirun', 'Iwo'],
  },
  {
    name: 'Ondo',
    cities: ['Akure', 'Ondo', 'Owo', 'Ikare', 'Okitipupa'],
  },
  {
    name: 'Ekiti',
    cities: ['Ado Ekiti', 'Ikere', 'Ijero', 'Iyin', 'Omuo'],
  },
  {
    name: 'Cross River',
    cities: ['Calabar', 'Ikom', 'Ogoja', 'Obudu', 'Ugep'],
  },
  {
    name: 'Akwa Ibom',
    cities: ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak'],
  },
]

async function seedCountryLocations(
  payload: Payload,
  countryName: string,
  regionsData: { name: string; cities: string[] }[]
): Promise<void> {
  // Get country ID
  const countryResult = await payload.find({
    collection: 'countries',
    where: {
      name: { equals: countryName },
    },
    limit: 1,
  })

  if (countryResult.docs.length === 0) {
    payload.logger.warn(`${countryName} country not found! Skipping...`)
    return
  }

  const countryId = countryResult.docs[0].id
  payload.logger.info(`Seeding ${countryName} regions and cities...`)

  for (const regionData of regionsData) {
    // Check if region already exists
    const existingRegion = await payload.find({
      collection: 'regions',
      where: {
        name: { equals: regionData.name },
        country: { equals: countryId },
      },
      limit: 1,
    })

    let regionId: string

    if (existingRegion.docs.length > 0) {
      payload.logger.info(`Region already exists: ${regionData.name}`)
      regionId = existingRegion.docs[0].id
    } else {
      // Create region
      const createdRegion = await payload.create({
        collection: 'regions',
        data: {
          name: regionData.name,
          country: countryId,
        },
      })
      payload.logger.info(`Created region: ${regionData.name}`)
      regionId = createdRegion.id
    }

    // Create cities with country and region references
    for (const cityName of regionData.cities) {
      // Check if city already exists in this region
      const existingCity = await payload.find({
        collection: 'cities',
        where: {
          name: { equals: cityName },
          region: { equals: regionId },
        },
        limit: 1,
      })

      if (existingCity.docs.length === 0) {
        await payload.create({
          collection: 'cities',
          data: {
            name: cityName,
            country: countryId,
            region: regionId,
          },
        })
        payload.logger.info(`  Created city: ${cityName}`)
      }
    }
  }

  payload.logger.info(`${countryName} regions and cities seeding complete!`)
}

export const seedRegionsAndCities = async (payload: Payload): Promise<void> => {
  // Seed Ghana locations
  await seedCountryLocations(payload, 'Ghana', ghanaRegionsAndCities)
  
  // Seed Nigeria locations
  await seedCountryLocations(payload, 'Nigeria', nigeriaStatesAndCities)
  
  payload.logger.info('All regions and cities seeding complete!')
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
