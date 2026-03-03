// Componente AnalysisDashboard
import { 
  AlertTriangle, CheckCircle, Brain, Eye, MapPin, 
  Share2, UserX, Calendar, Camera, FileCode, Globe,
  Shield, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AnalysisResult } from '@/types';
import { DiffusionMap } from './DiffusionMap';
import { VirusSpreadChart } from './VirusSpreadChart';
import { TimelineView } from './TimelineView';

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

export function AnalysisDashboard({ result }: AnalysisDashboardProps) {

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 70) return 'Alto Rischio';
    if (score >= 40) return 'Rischio Medio';
    return 'Basso Rischio';
  };

  return (
    <div className="space-y-6">
      {/* Header con punteggio complessivo */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Risultati Analisi Forense</h2>
            <p className="text-blue-100">{result.fileName}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {Math.round(result.scores.authentic)}%
            </div>
            <div className="text-sm text-blue-100">Autenticità</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{result.scores.aiGenerated}%</div>
            <div className="text-xs text-blue-100">AI Generata</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{result.scores.manipulated}%</div>
            <div className="text-xs text-blue-100">Manipolata</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{result.scores.deepfake}%</div>
            <div className="text-xs text-blue-100">Deepfake</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{result.diffusionMap?.length || 0}</div>
            <div className="text-xs text-blue-100">Paesi Colpiti</div>
          </div>
        </div>
      </div>

      {/* Tabs principali */}
      <Tabs defaultValue="authenticity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="authenticity">
            <Shield className="w-4 h-4 mr-2" />
            Autenticità
          </TabsTrigger>
          <TabsTrigger value="origin">
            <MapPin className="w-4 h-4 mr-2" />
            Origine
          </TabsTrigger>
          <TabsTrigger value="diffusion">
            <Share2 className="w-4 h-4 mr-2" />
            Diffusione
          </TabsTrigger>
          <TabsTrigger value="metadata">
            <FileCode className="w-4 h-4 mr-2" />
            Metadati
          </TabsTrigger>
        </TabsList>

        {/* Tab Autenticità */}
        <TabsContent value="authenticity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score AI */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Probabilità AI Generata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{result.scores.aiGenerated}%</span>
                  <Badge className={getScoreColor(result.scores.aiGenerated)}>
                    {getScoreLabel(result.scores.aiGenerated)}
                  </Badge>
                </div>
                <Progress value={result.scores.aiGenerated} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Analisi basata su pattern, simmetria e consistenza del rumore
                </p>
              </CardContent>
            </Card>

            {/* Score Manipolazione */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Probabilità Manipolazione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{result.scores.manipulated}%</span>
                  <Badge className={getScoreColor(result.scores.manipulated)}>
                    {getScoreLabel(result.scores.manipulated)}
                  </Badge>
                </div>
                <Progress value={result.scores.manipulated} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Analisi Error Level (ELA) per rilevare aree modificate
                </p>
              </CardContent>
            </Card>

            {/* Score Deepfake */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserX className="w-4 h-4" />
                  Probabilità Deepfake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{result.scores.deepfake}%</span>
                  <Badge className={getScoreColor(result.scores.deepfake)}>
                    {getScoreLabel(result.scores.deepfake)}
                  </Badge>
                </div>
                <Progress value={result.scores.deepfake} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Analisi facciale per rilevare manipolazioni AI
                </p>
              </CardContent>
            </Card>

            {/* Score Autenticità */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Probabilità Autentica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{result.scores.authentic}%</span>
                  <Badge className={result.scores.authentic >= 70 ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}>
                    {result.scores.authentic >= 70 ? 'Verosimile' : 'Sospetta'}
                  </Badge>
                </div>
                <Progress value={result.scores.authentic} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Probabilità complessiva di autenticità
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alert se alto rischio */}
          {(result.scores.aiGenerated > 70 || result.scores.manipulated > 70) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Contenuto Sospetto Rilevato</h4>
                <p className="text-sm text-red-700 mt-1">
                  Questo file presenta caratteristiche di un contenuto generato o manipolato da AI. 
                  Ti consigliamo di verificare attentamente la fonte prima di condividerlo.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab Origine */}
        <TabsContent value="origin" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paziente Zero */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Paziente Zero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.patientZero ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Username</span>
                      <span className="font-mono">{result.patientZero.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Piattaforma</span>
                      <Badge>{result.patientZero.platform}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Data Upload</span>
                      <span>{result.patientZero.uploadDate.toLocaleDateString('it-IT')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Località</span>
                      <span>{result.patientZero.location?.city}, {result.patientZero.location?.country}</span>
                    </div>
                    {result.patientZero.deviceInfo && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Dispositivo</span>
                        <span className="text-sm">{result.patientZero.deviceInfo}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">Dati non disponibili</p>
                )}
              </CardContent>
            </Card>

            {/* Geolocalizzazione */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Origine Geografica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.geoData?.origin ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Paese</span>
                      <span className="font-semibold">{result.geoData.origin.country}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Città</span>
                      <span>{result.geoData.origin.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Precisione</span>
                      <Badge variant="outline">{result.geoData.origin.accuracy}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Coordinate</span>
                      <span className="font-mono text-sm">
                        {result.geoData.origin.coordinates[0].toFixed(4)}, {result.geoData.origin.coordinates[1].toFixed(4)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">Dati GPS non disponibili</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mappa diffusione */}
          <Card>
            <CardHeader>
              <CardTitle>Mappa di Diffusione Globale</CardTitle>
            </CardHeader>
            <CardContent>
              <DiffusionMap diffusionPoints={result.diffusionMap} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Diffusione */}
        <TabsContent value="diffusion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <VirusSpreadChart diffusionData={result.diffusionMap} />
            <TimelineView timeline={generateTimelineFromDiffusion(result.diffusionMap)} />
          </div>

          {/* Statistiche */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiche di Diffusione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">
                    {result.diffusionMap?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Paesi</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600">
                    {result.diffusionMap?.reduce((sum, d) => sum + d.shares, 0).toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-500">Condivisioni Totali</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">
                    {[...new Set(result.diffusionMap?.map(d => d.platform) || [])].length}
                  </div>
                  <div className="text-sm text-gray-500">Piattaforme</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.max(...result.diffusionMap?.map(d => d.shares) || [0]).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Picco Condivisioni</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Metadati */}
        <TabsContent value="metadata" className="space-y-4">
          {result.metadata ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Informazioni Dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.metadata.camera && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Camera</span>
                      <span>{result.metadata.camera}</span>
                    </div>
                  )}
                  {result.metadata.software && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Software</span>
                      <span>{result.metadata.software}</span>
                    </div>
                  )}
                  {result.metadata.editingSoftware && result.metadata.editingSoftware.length > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Software rilevati:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.metadata.editingSoftware.map((sw, i) => (
                          <Badge key={i} variant="secondary">{sw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.metadata.hasAIsignature && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Firma AI rilevata nei metadati
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Date e Timestamp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.metadata.dateTaken && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data Scatto</span>
                      <span>{result.metadata.dateTaken}</span>
                    </div>
                  )}
                  {result.metadata.dateModified && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data Modifica</span>
                      <span>{result.metadata.dateModified}</span>
                    </div>
                  )}
                  {result.metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dimensioni</span>
                      <span>{result.metadata.dimensions.width} x {result.metadata.dimensions.height}</span>
                    </div>
                  )}
                  {result.metadata.compression && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Compressione</span>
                      <span>{result.metadata.compression}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {result.metadata.gps && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Coordinate GPS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-sm text-gray-500">Latitudine</div>
                        <div className="font-mono text-lg">{result.metadata.gps.latitude.toFixed(6)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Longitudine</div>
                        <div className="font-mono text-lg">{result.metadata.gps.longitude.toFixed(6)}</div>
                      </div>
                      {result.metadata.gps.altitude && (
                        <div>
                          <div className="text-sm text-gray-500">Altitudine</div>
                          <div className="font-mono text-lg">{result.metadata.gps.altitude.toFixed(1)} m</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nessun metadato EXIF trovato</p>
              <p className="text-sm text-gray-400 mt-1">
                Il file potrebbe essere stato elaborato o i metadati sono stati rimossi
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper per generare timeline
function generateTimelineFromDiffusion(diffusionMap: any[]): any[] {
  if (!diffusionMap || diffusionMap.length === 0) return [];
  
  return diffusionMap.map((point, idx) => ({
    date: point.firstAppearance,
    title: idx === 0 ? 'Primo Upload' : `Diffusione in ${point.country}`,
    description: `Il contenuto appare su ${point.platform}`,
    location: {
      country: point.country,
      city: point.city,
      coordinates: point.coordinates
    },
    platform: point.platform,
    shares: point.shares,
    type: idx === 0 ? 'upload' : idx === diffusionMap.length - 1 ? 'peak' : 'share'
  }));
}
