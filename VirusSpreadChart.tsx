import { useState, useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Globe, Share2 } from 'lucide-react';
import type { DiffusionPoint } from '@/types';
import { generateVirusSpreadData } from '@/lib/viralTracking';

interface VirusSpreadChartProps {
  diffusionData: DiffusionPoint[];
}

export function VirusSpreadChart({ diffusionData }: VirusSpreadChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  
  const virusData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    return generateVirusSpreadData(days);
  }, [timeRange]);

  // Dati per grafico a torta delle piattaforme
  const platformData = useMemo(() => {
    if (!diffusionData) return [];
    const counts: Record<string, number> = {};
    diffusionData.forEach(d => {
      counts[d.platform] = (counts[d.platform] || 0) + d.shares;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [diffusionData]);

  // Dati per grafico geografico
  const geoData = useMemo(() => {
    if (!diffusionData) return [];
    return diffusionData
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 10)
      .map(d => ({
        country: d.country,
        shares: d.shares,
        intensity: d.intensity
      }));
  }, [diffusionData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-red-500" />
              Diffusione Virale nel Tempo
            </CardTitle>
            <div className="flex gap-2">
              {(['7d', '14d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    timeRange === range 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range === '7d' ? '7 giorni' : range === '14d' ? '14 giorni' : '30 giorni'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={virusData}>
                <defs>
                  <linearGradient id="colorInfections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  tickFormatter={(v) => `Giorno ${v}`}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'Infezioni']}
                  labelFormatter={(label) => `Giorno ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="infections" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorInfections)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Metriche R0 */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                R₀ {virusData[virusData.length - 1]?.r0.toFixed(2) || 0}
              </div>
              <div className="text-xs text-red-600/70">Tasso riproduzione</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {virusData[virusData.length - 1]?.locations || 0}
              </div>
              <div className="text-xs text-orange-600/70">Paesi colpiti</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(virusData[virusData.length - 1]?.infections || 0).toLocaleString()}
              </div>
              <div className="text-xs text-blue-600/70">Condivisioni totali</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuzione geografica */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-blue-500" />
              Top Paesi per Condivisioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                  <YAxis 
                    dataKey="country" 
                    type="category" 
                    stroke="#9ca3af" 
                    fontSize={11}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'Condivisioni']}
                  />
                  <Bar dataKey="shares" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuzione per piattaforma */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="w-5 h-5 text-purple-500" />
              Distribuzione per Piattaforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platformData.map((platform) => {
                const total = platformData.reduce((sum, p) => sum + p.value, 0);
                const percentage = total > 0 ? (platform.value / total) * 100 : 0;
                
                return (
                  <div key={platform.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{platform.name}</span>
                      <span className="text-sm text-gray-500">
                        {percentage.toFixed(1)}% ({platform.value.toLocaleString()})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
