// Tipi principali per CyberShield

export interface AnalysisResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  scores: {
    aiGenerated: number;
    manipulated: number;
    deepfake: number;
    authentic: number;
  };
  metadata: EXIFMetadata | null;
  elaAnalysis: ELAResult | null;
  reverseSearch: ReverseSearchResult[];
  geoData: GeoLocationData | null;
  diffusionMap: DiffusionPoint[];
  patientZero: PatientZeroInfo | null;
}

export interface EXIFMetadata {
  camera?: string;
  device?: string;
  software?: string;
  dateTaken?: string;
  dateModified?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  compression?: string;
  hasAIsignature?: boolean;
  editingSoftware?: string[];
}

export interface ELAResult {
  errorLevelScore: number;
  manipulationProbability: number;
  hotspots: Array<{
    x: number;
    y: number;
    intensity: number;
  }>;
  analysisImage?: string;
}

export interface ReverseSearchResult {
  engine: string;
  url: string;
  title?: string;
  source?: string;
  firstSeen?: Date;
  thumbnail?: string;
}

export interface GeoLocationData {
  origin?: {
    country: string;
    city: string;
    coordinates: [number, number];
    accuracy: string;
  };
  firstUpload?: {
    platform: string;
    url: string;
    date: Date;
    uploader?: string;
  };
}

export interface DiffusionPoint {
  id: string;
  coordinates: [number, number];
  country: string;
  city: string;
  firstAppearance: Date;
  platform: string;
  url: string;
  shares: number;
  intensity: number;
  connections: string[];
}

export interface PatientZeroInfo {
  username?: string;
  platform: string;
  profileUrl?: string;
  uploadDate: Date;
  location?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  deviceInfo?: string;
  ipLocation?: string;
}

export interface LegalAction {
  id: string;
  title: string;
  description: string;
  applicableIn: string[];
  steps: string[];
  contacts: LegalContact[];
  urgency: 'immediate' | '24h' | '72h' | 'whenever';
}

export interface LegalContact {
  name: string;
  type: 'police' | 'lawyer' | 'platform' | 'organization' | 'helpline';
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  hours?: string;
  description?: string;
}

export interface SupportResource {
  id: string;
  category: 'minor' | 'parent' | 'educator' | 'victim';
  title: string;
  description: string;
  content: string;
  contacts?: LegalContact[];
  checklist?: string[];
}

export interface TimelineEvent {
  date: Date;
  title: string;
  description: string;
  location: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  platform: string;
  shares: number;
  type: 'upload' | 'share' | 'viral' | 'peak' | 'takedown';
}

export interface VirusSpreadData {
  day: number;
  infections: number;
  locations: number;
  r0: number;
  hotspots: Array<{
    country: string;
    coordinates: [number, number];
    cases: number;
  }>;
}
