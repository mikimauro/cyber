import { useState } from 'react';
import { 
  MapPin, Share2, Upload, TrendingUp, 
  AlertCircle, ChevronRight, Calendar, Globe,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TimelineEvent } from '@/types';

interface TimelineViewProps {
  timeline: TimelineEvent[];
}

export function TimelineView({ timeline }: TimelineViewProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline della Diffusione</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Nessun dato temporale disponibile</p>
        </CardContent>
      </Card>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-5 h-5" />;
      case 'share':
        return <Share2 className="w-5 h-5" />;
      case 'viral':
        return <TrendingUp className="w-5 h-5" />;
      case 'peak':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'upload':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'share':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viral':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'peak':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventLabel = (type: string): string => {
    switch (type) {
      case 'upload':
        return 'Upload Iniziale';
      case 'share':
        return 'Condivisione';
      case 'viral':
        return 'Viral';
      case 'peak':
        return 'Picco';
      default:
        return 'Evento';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timeline della Diffusione
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linea verticale */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Eventi */}
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div 
                key={index}
                className="relative flex gap-4 group"
              >
                {/* Icona */}
                <div className={`
                  relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${getEventColor(event.type)}
                  ${expandedEvent === index ? 'ring-4 ring-offset-2 ring-blue-100' : ''}
                `}>
                  {getEventIcon(event.type)}
                </div>

                {/* Contenuto */}
                <div className="flex-1 pb-4">
                  <div 
                    className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedEvent(expandedEvent === index ? null : index)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getEventColor(event.type)}>
                            {getEventLabel(event.type)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {event.date.toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <ChevronRight 
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedEvent === index ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>

                    {/* Dettagli espansi */}
                    {expandedEvent === index && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{event.location.city}, {event.location.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Share2 className="w-4 h-4 text-gray-400" />
                          <span>Piattaforma: {event.platform}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span>Condivisioni: {event.shares.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-xs">
                            {event.location.coordinates[0].toFixed(4)}, {event.location.coordinates[1].toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riepilogo */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Periodo totale</p>
              <p className="text-2xl font-bold text-blue-900">
                {timeline.length} giorni
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700 font-medium">Condivisioni totali</p>
              <p className="text-2xl font-bold text-blue-900">
                {timeline.reduce((sum, e) => sum + e.shares, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
