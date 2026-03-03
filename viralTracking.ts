// Simulazione di tracciamento virale e reverse image search

import type { 
  ReverseSearchResult, 
  GeoLocationData, 
  DiffusionPoint, 
  PatientZeroInfo,
  TimelineEvent,
  VirusSpreadData 
} from '@/types';

// Simula reverse image search
export async function performReverseSearch(_file: File): Promise<ReverseSearchResult[]> {
  // In produzione, qui si chiamerebbero API reali come SerpAPI, TinEye, etc.
  // Per demo, simuliamo risultati realistici
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simula latenza
  
  const results: ReverseSearchResult[] = [
    {
      engine: 'Google Images',
      url: 'https://images.google.com/search?q=similar',
      title: 'Prima apparizione - Social Media',
      source: 'twitter.com',
      firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      engine: 'TinEye',
      url: 'https://tineye.com/search',
      title: 'Match trovato - Forum',
      source: 'reddit.com',
      firstSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      engine: 'Bing Visual',
      url: 'https://www.bing.com/visualsearch',
      title: 'Immagine simile - Blog',
      source: 'medium.com',
      firstSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    }
  ];
  
  return results;
}

// Geolocalizzazione da IP/metadata
export async function getGeoLocationData(_file: File, metadata?: any): Promise<GeoLocationData> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Se ci sono metadati GPS, usali
  if (metadata?.gps) {
    return {
      origin: {
        country: 'Italia',
        city: 'Roma',
        coordinates: [metadata.gps.latitude, metadata.gps.longitude],
        accuracy: 'Alta (GPS)'
      },
      firstUpload: {
        platform: 'Instagram',
        url: 'https://instagram.com/p/...',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        uploader: '@user_anonymous'
      }
    };
  }
  
  // Altrimenti simula geolocalizzazione
  return {
    origin: {
      country: 'Stati Uniti',
      city: 'New York',
      coordinates: [40.7128, -74.0060],
      accuracy: 'Media (IP)'
    },
    firstUpload: {
      platform: 'TikTok',
      url: 'https://tiktok.com/@user/video/...',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      uploader: '@cyberbully_123'
    }
  };
}

// Genera dati di diffusione virale
export function generateDiffusionData(): DiffusionPoint[] {
  const platforms = ['Instagram', 'TikTok', 'Twitter', 'Facebook', 'Reddit', 'Telegram', 'WhatsApp'];
  const countries = [
    { name: 'Italia', city: 'Roma', coords: [41.9028, 12.4964] as [number, number] },
    { name: 'Stati Uniti', city: 'New York', coords: [40.7128, -74.0060] as [number, number] },
    { name: 'Regno Unito', city: 'Londra', coords: [51.5074, -0.1278] as [number, number] },
    { name: 'Francia', city: 'Parigi', coords: [48.8566, 2.3522] as [number, number] },
    { name: 'Germania', city: 'Berlino', coords: [52.5200, 13.4050] as [number, number] },
    { name: 'Spagna', city: 'Madrid', coords: [40.4168, -3.7038] as [number, number] },
    { name: 'Brasile', city: 'San Paolo', coords: [-23.5505, -46.6333] as [number, number] },
    { name: 'India', city: 'Mumbai', coords: [19.0760, 72.8777] as [number, number] },
    { name: 'Giappone', city: 'Tokyo', coords: [35.6762, 139.6503] as [number, number] },
    { name: 'Australia', city: 'Sydney', coords: [-33.8688, 151.2093] as [number, number] },
  ];
  
  const diffusionPoints: DiffusionPoint[] = [];
  const baseDate = Date.now() - 14 * 24 * 60 * 60 * 1000; // 2 settimane fa
  
  countries.forEach((country, idx) => {
    const dayOffset = idx * 1.5;
    const connections: string[] = [];
    
    // Crea connessioni con punti precedenti
    for (let i = 0; i < idx; i++) {
      if (Math.random() > 0.3) {
        connections.push(`diff-${i}`);
      }
    }
    
    diffusionPoints.push({
      id: `diff-${idx}`,
      coordinates: country.coords,
      country: country.name,
      city: country.city,
      firstAppearance: new Date(baseDate + dayOffset * 24 * 60 * 60 * 1000),
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      url: `https://${platforms[Math.floor(Math.random() * platforms.length)].toLowerCase()}.com/p/${Math.random().toString(36).substr(2, 9)}`,
      shares: Math.floor(Math.random() * 50000) + 1000,
      intensity: Math.random() * 0.8 + 0.2,
      connections
    });
  });
  
  return diffusionPoints;
}

// Identifica "paziente zero"
export function identifyPatientZero(diffusionData: DiffusionPoint[]): PatientZeroInfo {
  // Trova il punto con data più antica
  const oldest = diffusionData.reduce((prev, curr) => 
    curr.firstAppearance < prev.firstAppearance ? curr : prev
  );
  
  return {
    username: '@anonymous_bully',
    platform: oldest.platform,
    profileUrl: `https://${oldest.platform.toLowerCase()}.com/@anonymous_bully`,
    uploadDate: oldest.firstAppearance,
    location: {
      country: oldest.country,
      city: oldest.city,
      coordinates: oldest.coordinates
    },
    deviceInfo: 'iPhone 14 Pro - iOS 17.1',
    ipLocation: oldest.city
  };
}

// Genera timeline eventi
export function generateTimeline(diffusionData: DiffusionPoint[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // Evento iniziale - upload
  const patientZero = diffusionData.reduce((prev, curr) => 
    curr.firstAppearance < prev.firstAppearance ? curr : prev
  );
  
  events.push({
    date: patientZero.firstAppearance,
    title: 'Primo Upload (Paziente Zero)',
    description: `Il contenuto viene caricato per la prima volta su ${patientZero.platform} da @anonymous_bully`,
    location: {
      country: patientZero.country,
      city: patientZero.city,
      coordinates: patientZero.coordinates
    },
    platform: patientZero.platform,
    shares: patientZero.shares,
    type: 'upload'
  });
  
  // Eventi di condivisione
  diffusionData.slice(1).forEach((point, idx) => {
    const eventTypes: Array<'share' | 'viral' | 'peak'> = ['share', 'share', 'viral', 'share', 'peak'];
    events.push({
      date: point.firstAppearance,
      title: point.shares > 30000 ? 'Picco Virale' : 'Diffusione',
      description: `Il contenuto si diffonde in ${point.country} tramite ${point.platform}`,
      location: {
        country: point.country,
        city: point.city,
        coordinates: point.coordinates
      },
      platform: point.platform,
      shares: point.shares,
      type: eventTypes[idx % eventTypes.length]
    });
  });
  
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Genera dati spread tipo "virus"
export function generateVirusSpreadData(days: number = 14): VirusSpreadData[] {
  const data: VirusSpreadData[] = [];
  let infections = 100;
  let locations = 1;
  let r0 = 2.5;
  
  const countries = [
    { country: 'Italia', coords: [41.9028, 12.4964] as [number, number] },
    { country: 'Stati Uniti', coords: [40.7128, -74.0060] as [number, number] },
    { country: 'Regno Unito', coords: [51.5074, -0.1278] as [number, number] },
    { country: 'Francia', coords: [48.8566, 2.3522] as [number, number] },
    { country: 'Germania', coords: [52.5200, 13.4050] as [number, number] },
    { country: 'Spagna', coords: [40.4168, -3.7038] as [number, number] },
    { country: 'Brasile', coords: [-23.5505, -46.6333] as [number, number] },
    { country: 'India', coords: [19.0760, 72.8777] as [number, number] },
    { country: 'Giappone', coords: [35.6762, 139.6503] as [number, number] },
    { country: 'Australia', coords: [-33.8688, 151.2093] as [number, number] },
  ];
  
  for (let day = 0; day < days; day++) {
    // Modello di crescita virale
    const growthFactor = 1 + (r0 * 0.15 * (1 - infections / 1000000));
    infections = Math.floor(infections * growthFactor);
    locations = Math.min(countries.length, Math.floor(day / 1.5) + 1);
    r0 = Math.max(0.5, r0 - 0.05);
    
    const hotspots = countries.slice(0, locations).map(c => ({
      country: c.country,
      coordinates: c.coords,
      cases: Math.floor(infections / locations * (0.5 + Math.random()))
    }));
    
    data.push({
      day,
      infections,
      locations,
      r0: Math.round(r0 * 100) / 100,
      hotspots
    });
  }
  
  return data;
}

// Calcola statistiche di diffusione
export function calculateDiffusionStats(diffusionData: DiffusionPoint[]) {
  const totalShares = diffusionData.reduce((sum, d) => sum + d.shares, 0);
  const avgShares = Math.floor(totalShares / diffusionData.length);
  const maxShares = Math.max(...diffusionData.map(d => d.shares));
  const platforms = [...new Set(diffusionData.map(d => d.platform))];
  const countries = [...new Set(diffusionData.map(d => d.country))];
  
  return {
    totalShares,
    avgShares,
    maxShares,
    platformCount: platforms.length,
    countryCount: countries.length,
    platforms,
    countries
  };
}
