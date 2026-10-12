/**
 * Philippine Standard Geographic Code (PSGC) - Official Hierarchy & Reference Types
 * Developed in compliance with the Philippine Statistics Authority (PSA) Standard Classification.
 */

export interface PSGCRegion {
  code: string;
  name: string;
  designation: string;
}

export interface PSGCProvince {
  code: string;
  regionCode: string;
  name: string;
}

export interface PSGCCityMunicipality {
  code: string;
  provinceCode: string;
  regionCode: string;
  name: string;
  isCity: boolean;
  defaultPostalCode?: string;
}

export interface PSGCBarangay {
  code: string;
  cityMunicipalityCode: string;
  name: string;
}

export interface PSGCAddress {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityMunicipalityCode: string;
  cityMunicipalityName: string;
  barangayCode: string;
  barangayName: string;
  streetAddress: string; // House/Lot No., Building, Street Name, Subdivision/Village
  postalCode: string;
  psgcCode?: string; // Standard 9/10-digit PSGC Code for the Barangay
  formattedAddress: string;
}

// 1. ALL 17 PHILIPPINE ADMINISTRATIVE REGIONS
export const PSGC_REGIONS: PSGCRegion[] = [
  { code: '130000000', name: 'National Capital Region', designation: 'NCR' },
  { code: '010000000', name: 'Region I (Ilocos Region)', designation: 'Region I' },
  { code: '020000000', name: 'Region II (Cagayan Valley)', designation: 'Region II' },
  { code: '030000000', name: 'Region III (Central Luzon)', designation: 'Region III' },
  { code: '040000000', name: 'Region IV-A (CALABARZON)', designation: 'Region IV-A' },
  { code: '170000000', name: 'MIMAROPA Region', designation: 'MIMAROPA' },
  { code: '050000000', name: 'Region V (Bicol Region)', designation: 'Region V' },
  { code: '060000000', name: 'Region VI (Western Visayas)', designation: 'Region VI' },
  { code: '070000000', name: 'Region VII (Central Visayas)', designation: 'Region VII' },
  { code: '080000000', name: 'Region VIII (Eastern Visayas)', designation: 'Region VIII' },
  { code: '090000000', name: 'Region IX (Zamboanga Peninsula)', designation: 'Region IX' },
  { code: '100000000', name: 'Region X (Northern Mindanao)', designation: 'Region X' },
  { code: '110000000', name: 'Region XI (Davao Region)', designation: 'Region XI' },
  { code: '120000000', name: 'Region XII (SOCCSKSARGEN)', designation: 'Region XII' },
  { code: '160000000', name: 'Region XIII (Caraga)', designation: 'Region XIII' },
  { code: '140000000', name: 'Cordillera Administrative Region', designation: 'CAR' },
  { code: '190000000', name: 'Bangsamoro Autonomous Region in Muslim Mindanao', designation: 'BARMM' },
];

// 2. PROVINCES & METRO MANILA DISTRICTS
export const PSGC_PROVINCES: PSGCProvince[] = [
  // NCR Districts
  { code: '133900000', regionCode: '130000000', name: 'Metro Manila - 1st District (City of Manila)' },
  { code: '137400000', regionCode: '130000000', name: 'Metro Manila - 2nd District (QC, Pasig, Marikina, Mandaluyong, San Juan)' },
  { code: '137500000', regionCode: '130000000', name: 'Metro Manila - 3rd District (Caloocan, Malabon, Navotas, Valenzuela)' },
  { code: '137600000', regionCode: '130000000', name: 'Metro Manila - 4th District (Makati, Taguig, Pasay, Parañaque, Las Piñas, Muntinlupa)' },

  // Region III (Central Luzon)
  { code: '034900000', regionCode: '030000000', name: 'Nueva Ecija' },
  { code: '031400000', regionCode: '030000000', name: 'Bulacan' },
  { code: '035400000', regionCode: '030000000', name: 'Pampanga' },
  { code: '036900000', regionCode: '030000000', name: 'Tarlac' },
  { code: '030800000', regionCode: '030000000', name: 'Bataan' },
  { code: '037100000', regionCode: '030000000', name: 'Zambales' },
  { code: '037700000', regionCode: '030000000', name: 'Aurora' },

  // Region IV-A (CALABARZON)
  { code: '042100000', regionCode: '040000000', name: 'Cavite' },
  { code: '043400000', regionCode: '040000000', name: 'Laguna' },
  { code: '041000000', regionCode: '040000000', name: 'Batangas' },
  { code: '045800000', regionCode: '040000000', name: 'Rizal' },
  { code: '045600000', regionCode: '040000000', name: 'Quezon' },

  // Region I (Ilocos)
  { code: '015500000', regionCode: '010000000', name: 'Pangasinan' },
  { code: '013300000', regionCode: '010000000', name: 'La Union' },
  { code: '012900000', regionCode: '010000000', name: 'Ilocos Sur' },
  { code: '012800000', regionCode: '010000000', name: 'Ilocos Norte' },

  // Region II (Cagayan Valley)
  { code: '023100000', regionCode: '020000000', name: 'Isabela' },
  { code: '021500000', regionCode: '020000000', name: 'Cagayan' },
  { code: '025000000', regionCode: '020000000', name: 'Nueva Vizcaya' },

  // Region V (Bicol)
  { code: '050500000', regionCode: '050000000', name: 'Albay' },
  { code: '051700000', regionCode: '050000000', name: 'Camarines Sur' },

  // Region VI (Western Visayas)
  { code: '063000000', regionCode: '060000000', name: 'Iloilo' },
  { code: '064500000', regionCode: '060000000', name: 'Negros Occidental' },

  // Region VII (Central Visayas)
  { code: '072200000', regionCode: '070000000', name: 'Cebu' },
  { code: '071200000', regionCode: '070000000', name: 'Bohol' },
  { code: '074600000', regionCode: '070000000', name: 'Negros Oriental' },

  // Region VIII (Eastern Visayas)
  { code: '083700000', regionCode: '080000000', name: 'Leyte' },
  { code: '086000000', regionCode: '080000000', name: 'Samar (Western Samar)' },

  // Region IX (Zamboanga Peninsula)
  { code: '097300000', regionCode: '090000000', name: 'Zamboanga del Sur' },
  { code: '097200000', regionCode: '090000000', name: 'Zamboanga del Norte' },

  // Region X (Northern Mindanao)
  { code: '104300000', regionCode: '100000000', name: 'Misamis Oriental' },
  { code: '101300000', regionCode: '100000000', name: 'Bukidnon' },

  // Region XI (Davao Region)
  { code: '112400000', regionCode: '110000000', name: 'Davao del Sur' },
  { code: '112300000', regionCode: '110000000', name: 'Davao del Norte' },

  // Region XII (SOCCSKSARGEN)
  { code: '126300000', regionCode: '120000000', name: 'South Cotabato' },
  { code: '124700000', regionCode: '120000000', name: 'Cotabato (North Cotabato)' },

  // Region XIII (Caraga)
  { code: '160200000', regionCode: '160000000', name: 'Agusan del Norte' },
  { code: '166700000', regionCode: '160000000', name: 'Surigao del Norte' },

  // CAR (Cordillera)
  { code: '141100000', regionCode: '140000000', name: 'Benguet' },

  // MIMAROPA
  { code: '175300000', regionCode: '170000000', name: 'Palawan' },
  { code: '175200000', regionCode: '170000000', name: 'Oriental Mindoro' },

  // BARMM
  { code: '193800000', regionCode: '190000000', name: 'Maguindanao del Norte' },
];

// 3. CITIES & MUNICIPALITIES
export const PSGC_CITIES_MUNICIPALITIES: PSGCCityMunicipality[] = [
  // Metro Manila
  { code: '133900000', provinceCode: '133900000', regionCode: '130000000', name: 'City of Manila', isCity: true, defaultPostalCode: '1000' },
  { code: '137404000', provinceCode: '137400000', regionCode: '130000000', name: 'Quezon City', isCity: true, defaultPostalCode: '1100' },
  { code: '137403000', provinceCode: '137400000', regionCode: '130000000', name: 'City of Pasig', isCity: true, defaultPostalCode: '1600' },
  { code: '137401000', provinceCode: '137400000', regionCode: '130000000', name: 'City of Mandaluyong', isCity: true, defaultPostalCode: '1550' },
  { code: '137402000', provinceCode: '137400000', regionCode: '130000000', name: 'City of Marikina', isCity: true, defaultPostalCode: '1800' },
  { code: '137405000', provinceCode: '137400000', regionCode: '130000000', name: 'City of San Juan', isCity: true, defaultPostalCode: '1500' },
  { code: '137501000', provinceCode: '137500000', regionCode: '130000000', name: 'Caloocan City', isCity: true, defaultPostalCode: '1400' },
  { code: '137504000', provinceCode: '137500000', regionCode: '130000000', name: 'City of Valenzuela', isCity: true, defaultPostalCode: '1440' },
  { code: '137502000', provinceCode: '137500000', regionCode: '130000000', name: 'City of Malabon', isCity: true, defaultPostalCode: '1470' },
  { code: '137503000', provinceCode: '137500000', regionCode: '130000000', name: 'City of Navotas', isCity: true, defaultPostalCode: '1485' },
  { code: '137602000', provinceCode: '137600000', regionCode: '130000000', name: 'City of Makati', isCity: true, defaultPostalCode: '1200' },
  { code: '137607000', provinceCode: '137600000', regionCode: '130000000', name: 'City of Taguig', isCity: true, defaultPostalCode: '1630' },
  { code: '137605000', provinceCode: '137600000', regionCode: '130000000', name: 'Pasay City', isCity: true, defaultPostalCode: '1300' },
  { code: '137604000', provinceCode: '137600000', regionCode: '130000000', name: 'City of Parañaque', isCity: true, defaultPostalCode: '1700' },
  { code: '137601000', provinceCode: '137600000', regionCode: '130000000', name: 'City of Las Piñas', isCity: true, defaultPostalCode: '1740' },
  { code: '137603000', provinceCode: '137600000', regionCode: '130000000', name: 'City of Muntinlupa', isCity: true, defaultPostalCode: '1770' },

  // Nueva Ecija (Region III)
  { code: '034919000', provinceCode: '034900000', regionCode: '030000000', name: 'City of San Jose', isCity: true, defaultPostalCode: '3121' },
  { code: '034903000', provinceCode: '034900000', regionCode: '030000000', name: 'Cabanatuan City', isCity: true, defaultPostalCode: '3100' },
  { code: '034907000', provinceCode: '034900000', regionCode: '030000000', name: 'Gapan City', isCity: true, defaultPostalCode: '3105' },
  { code: '034914000', provinceCode: '034900000', regionCode: '030000000', name: 'Science City of Muñoz', isCity: true, defaultPostalCode: '3119' },
  { code: '034916000', provinceCode: '034900000', regionCode: '030000000', name: 'Palayan City', isCity: true, defaultPostalCode: '3132' },
  { code: '034908000', provinceCode: '034900000', regionCode: '030000000', name: 'Guimba', isCity: false, defaultPostalCode: '3115' },
  { code: '034927000', provinceCode: '034900000', regionCode: '030000000', name: 'Talavera', isCity: false, defaultPostalCode: '3114' },

  // Pampanga (Region III)
  { code: '035416000', provinceCode: '035400000', regionCode: '030000000', name: 'City of San Fernando', isCity: true, defaultPostalCode: '2000' },
  { code: '035401000', provinceCode: '035400000', regionCode: '030000000', name: 'Angeles City', isCity: true, defaultPostalCode: '2009' },
  { code: '035410000', provinceCode: '035400000', regionCode: '030000000', name: 'Mabalacat City', isCity: true, defaultPostalCode: '2010' },
  { code: '035406000', provinceCode: '035400000', regionCode: '030000000', name: 'Guagua', isCity: false, defaultPostalCode: '2003' },

  // Bulacan (Region III)
  { code: '031410000', provinceCode: '031400000', regionCode: '030000000', name: 'City of Malolos', isCity: true, defaultPostalCode: '3000' },
  { code: '031420000', provinceCode: '031400000', regionCode: '030000000', name: 'City of San Jose del Monte', isCity: true, defaultPostalCode: '3023' },
  { code: '031412000', provinceCode: '031400000', regionCode: '030000000', name: 'City of Meycauayan', isCity: true, defaultPostalCode: '3020' },
  { code: '031403000', provinceCode: '031400000', regionCode: '030000000', name: 'Baliuag City', isCity: true, defaultPostalCode: '3006' },

  // Tarlac (Region III)
  { code: '036916000', provinceCode: '036900000', regionCode: '030000000', name: 'City of Tarlac', isCity: true, defaultPostalCode: '2300' },
  { code: '036903000', provinceCode: '036900000', regionCode: '030000000', name: 'Capas', isCity: false, defaultPostalCode: '2315' },

  // Cavite (Region IV-A)
  { code: '042103000', provinceCode: '042100000', regionCode: '040000000', name: 'City of Bacoor', isCity: true, defaultPostalCode: '4102' },
  { code: '042109000', provinceCode: '042100000', regionCode: '040000000', name: 'City of Imus', isCity: true, defaultPostalCode: '4103' },
  { code: '042106000', provinceCode: '042100000', regionCode: '040000000', name: 'City of Dasmariñas', isCity: true, defaultPostalCode: '4114' },
  { code: '042108000', provinceCode: '042100000', regionCode: '040000000', name: 'City of General Trias', isCity: true, defaultPostalCode: '4107' },
  { code: '042119000', provinceCode: '042100000', regionCode: '040000000', name: 'Tagaytay City', isCity: true, defaultPostalCode: '4120' },

  // Laguna (Region IV-A)
  { code: '043428000', provinceCode: '043400000', regionCode: '040000000', name: 'City of Santa Rosa', isCity: true, defaultPostalCode: '4026' },
  { code: '043405000', provinceCode: '043400000', regionCode: '040000000', name: 'City of Calamba', isCity: true, defaultPostalCode: '4027' },
  { code: '043403000', provinceCode: '043400000', regionCode: '040000000', name: 'City of Biñan', isCity: true, defaultPostalCode: '4024' },
  { code: '043425000', provinceCode: '043400000', regionCode: '040000000', name: 'City of San Pedro', isCity: true, defaultPostalCode: '4023' },

  // Batangas (Region IV-A)
  { code: '041005000', provinceCode: '041000000', regionCode: '040000000', name: 'Batangas City', isCity: true, defaultPostalCode: '4200' },
  { code: '041014000', provinceCode: '041000000', regionCode: '040000000', name: 'Lipa City', isCity: true, defaultPostalCode: '4217' },

  // Rizal (Region IV-A)
  { code: '045802000', provinceCode: '045800000', regionCode: '040000000', name: 'City of Antipolo', isCity: true, defaultPostalCode: '1870' },
  { code: '045804000', provinceCode: '045800000', regionCode: '040000000', name: 'Cainta', isCity: false, defaultPostalCode: '1900' },

  // Pangasinan (Region I)
  { code: '015518000', provinceCode: '015500000', regionCode: '010000000', name: 'City of Dagupan', isCity: true, defaultPostalCode: '2400' },
  { code: '015546000', provinceCode: '015500000', regionCode: '010000000', name: 'City of Urdaneta', isCity: true, defaultPostalCode: '2428' },

  // Cebu (Region VII)
  { code: '072217000', provinceCode: '072200000', regionCode: '070000000', name: 'Cebu City', isCity: true, defaultPostalCode: '6000' },
  { code: '072230000', provinceCode: '072200000', regionCode: '070000000', name: 'City of Mandaue', isCity: true, defaultPostalCode: '6014' },
  { code: '072226000', provinceCode: '072200000', regionCode: '070000000', name: 'City of Lapu-Lapu', isCity: true, defaultPostalCode: '6015' },
  { code: '072250000', provinceCode: '072200000', regionCode: '070000000', name: 'City of Talisay', isCity: true, defaultPostalCode: '6045' },

  // Iloilo (Region VI)
  { code: '063022000', provinceCode: '063000000', regionCode: '060000000', name: 'Iloilo City', isCity: true, defaultPostalCode: '5000' },

  // Negros Occidental (Region VI)
  { code: '064501000', provinceCode: '064500000', regionCode: '060000000', name: 'Bacolod City', isCity: true, defaultPostalCode: '6100' },

  // Davao del Sur (Region XI)
  { code: '112402000', provinceCode: '112400000', regionCode: '110000000', name: 'Davao City', isCity: true, defaultPostalCode: '8000' },
  { code: '112403000', provinceCode: '112400000', regionCode: '110000000', name: 'City of Digos', isCity: true, defaultPostalCode: '8002' },

  // Benguet (CAR)
  { code: '141102000', provinceCode: '141100000', regionCode: '140000000', name: 'Baguio City', isCity: true, defaultPostalCode: '2600' },
  { code: '141106000', provinceCode: '141100000', regionCode: '140000000', name: 'La Trinidad', isCity: false, defaultPostalCode: '2601' },
];

// 4. BARANGAYS
export const PSGC_BARANGAYS: PSGCBarangay[] = [
  // City of San Jose (Nueva Ecija) - 034919000
  { code: '034919001', cityMunicipalityCode: '034919000', name: 'Abar 1st' },
  { code: '034919002', cityMunicipalityCode: '034919000', name: 'Abar 2nd' },
  { code: '034919018', cityMunicipalityCode: '034919000', name: 'Malasin' },
  { code: '034919027', cityMunicipalityCode: '034919000', name: 'Rafael Rueda, Sr. (Poblacion)' },
  { code: '034919033', cityMunicipalityCode: '034919000', name: 'Santo Niño 1st' },
  { code: '034919034', cityMunicipalityCode: '034919000', name: 'Santo Niño 2nd' },
  { code: '034919006', cityMunicipalityCode: '034919000', name: 'Caanawan' },
  { code: '034919015', cityMunicipalityCode: '034919000', name: 'Kaliwanagan' },
  { code: '034919032', cityMunicipalityCode: '034919000', name: 'Sibut' },
  { code: '034919024', cityMunicipalityCode: '034919000', name: 'Pinili' },
  { code: '034919037', cityMunicipalityCode: '034919000', name: 'Tayabo' },

  // Cabanatuan City (Nueva Ecija) - 034903000
  { code: '034903005', cityMunicipalityCode: '034903000', name: 'Bantug Bulalo' },
  { code: '034903010', cityMunicipalityCode: '034903000', name: 'Kapitan Pepe' },
  { code: '034903018', cityMunicipalityCode: '034903000', name: 'Mabini Homesite' },
  { code: '034903028', cityMunicipalityCode: '034903000', name: 'San Josef Norte' },
  { code: '034903029', cityMunicipalityCode: '034903000', name: 'San Josef Sur' },
  { code: '034903045', cityMunicipalityCode: '034903000', name: 'Zulueta' },

  // Pasig City (NCR) - 137403000
  { code: '137403023', cityMunicipalityCode: '137403000', name: 'San Antonio' },
  { code: '137403013', cityMunicipalityCode: '137403000', name: 'Kapitolyo' },
  { code: '137403019', cityMunicipalityCode: '137403000', name: 'Oranbo' },
  { code: '137403030', cityMunicipalityCode: '137403000', name: 'Ugong' },
  { code: '137403022', cityMunicipalityCode: '137403000', name: 'Rosario' },
  { code: '137403007', cityMunicipalityCode: '137403000', name: 'Caniogan' },
  { code: '137403002', cityMunicipalityCode: '137403000', name: 'Bagong Ilog' },
  { code: '137403020', cityMunicipalityCode: '137403000', name: 'Pinagbuhatan' },

  // Quezon City (NCR) - 137404000
  { code: '137404018', cityMunicipalityCode: '137404000', name: 'Central' },
  { code: '137404008', cityMunicipalityCode: '137404000', name: 'Batasan Hills' },
  { code: '137404022', cityMunicipalityCode: '137404000', name: 'Commonwealth' },
  { code: '137404128', cityMunicipalityCode: '137404000', name: 'U.P. Campus (Diliman)' },
  { code: '137404033', cityMunicipalityCode: '137404000', name: 'Fairview' },
  { code: '137404060', cityMunicipalityCode: '137404000', name: 'Loyola Heights' },
  { code: '137404118', cityMunicipalityCode: '137404000', name: 'South Triangle' },
  { code: '137404121', cityMunicipalityCode: '137404000', name: 'Tandang Sora' },

  // Makati City (NCR) - 137602000
  { code: '137602004', cityMunicipalityCode: '137602000', name: 'Bel-Air' },
  { code: '137602022', cityMunicipalityCode: '137602000', name: 'Poblacion' },
  { code: '137602026', cityMunicipalityCode: '137602000', name: 'San Lorenzo' },
  { code: '137602025', cityMunicipalityCode: '137602000', name: 'San Antonio' },
  { code: '137602021', cityMunicipalityCode: '137602000', name: 'Pio del Pilar' },
  { code: '137602002', cityMunicipalityCode: '137602000', name: 'Bangkal' },

  // City of Manila - 133900000
  { code: '133900001', cityMunicipalityCode: '133900000', name: 'Barangay 659-A (Ermita)' },
  { code: '133900002', cityMunicipalityCode: '133900000', name: 'Barangay 660 (Intramuros)' },
  { code: '133900003', cityMunicipalityCode: '133900000', name: 'Barangay 720 (Malate)' },
  { code: '133900004', cityMunicipalityCode: '133900000', name: 'Barangay 395 (Sampaloc)' },
  { code: '133900005', cityMunicipalityCode: '133900000', name: 'Barangay 281 (Binondo)' },

  // Cebu City (Region VII) - 072217000
  { code: '072217041', cityMunicipalityCode: '072217000', name: 'Lahug' },
  { code: '072217046', cityMunicipalityCode: '072217000', name: 'Mabolo' },
  { code: '072217032', cityMunicipalityCode: '072217000', name: 'Guadalupe' },
  { code: '072217009', cityMunicipalityCode: '072217000', name: 'Banilad' },
  { code: '072217006', cityMunicipalityCode: '072217000', name: 'Apas' },
  { code: '072217019', cityMunicipalityCode: '072217000', name: 'Capitol Site' },

  // Davao City (Region XI) - 112402000
  { code: '112402001', cityMunicipalityCode: '112402000', name: 'Poblacion' },
  { code: '112402098', cityMunicipalityCode: '112402000', name: 'Matina Crossing' },
  { code: '112402029', cityMunicipalityCode: '112402000', name: 'Buhangin' },
  { code: '112402035', cityMunicipalityCode: '112402000', name: 'Catalunan Grande' },
  { code: '112402148', cityMunicipalityCode: '112402000', name: 'Sasa' },

  // Baguio City (CAR) - 141102000
  { code: '141102001', cityMunicipalityCode: '141102000', name: 'Session Road (Malcolm Square)' },
  { code: '141102015', cityMunicipalityCode: '141102000', name: 'Camp 7' },
  { code: '141102045', cityMunicipalityCode: '141102000', name: 'Loakan Proper' },
  { code: '141102068', cityMunicipalityCode: '141102000', name: 'Pacdal' },
];

/**
 * PSGC Helper Functions
 */
export function getProvincesByRegion(regionCode: string): PSGCProvince[] {
  return PSGC_PROVINCES.filter((p) => p.regionCode === regionCode);
}

export function getCitiesByProvince(provinceCode: string): PSGCCityMunicipality[] {
  return PSGC_CITIES_MUNICIPALITIES.filter((c) => c.provinceCode === provinceCode);
}

export function getCitiesByRegion(regionCode: string): PSGCCityMunicipality[] {
  return PSGC_CITIES_MUNICIPALITIES.filter((c) => c.regionCode === regionCode);
}

export function getBarangaysByCity(cityMunicipalityCode: string): PSGCBarangay[] {
  return PSGC_BARANGAYS.filter((b) => b.cityMunicipalityCode === cityMunicipalityCode);
}

export function formatPSGCAddress(addr: {
  streetAddress?: string;
  barangayName?: string;
  cityMunicipalityName?: string;
  provinceName?: string;
  regionName?: string;
  postalCode?: string;
}): string {
  const parts = [
    addr.streetAddress?.trim(),
    addr.barangayName ? `Brgy. ${addr.barangayName.trim()}` : '',
    addr.cityMunicipalityName?.trim(),
    addr.provinceName && addr.provinceName !== addr.cityMunicipalityName ? addr.provinceName.trim() : '',
    addr.postalCode?.trim(),
    addr.regionName?.trim(),
  ].filter(Boolean);

  return parts.join(', ');
}

export function validatePSGCAddress(addr: Partial<PSGCAddress>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!addr.regionCode || !addr.regionName) {
    errors.push('Region selection is required according to PSGC standard.');
  }
  if (!addr.provinceCode || !addr.provinceName) {
    errors.push('Province / District selection is required.');
  }
  if (!addr.cityMunicipalityCode || !addr.cityMunicipalityName) {
    errors.push('City / Municipality selection is required.');
  }
  if (!addr.barangayName?.trim()) {
    errors.push('Barangay selection or name is required.');
  }
  if (!addr.streetAddress?.trim()) {
    errors.push('House/Unit/Street Address is required.');
  }
  if (!addr.postalCode?.trim() || !/^\d{4}$/.test(addr.postalCode.trim())) {
    errors.push('Valid 4-digit Philippine Postal (ZIP) Code is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
