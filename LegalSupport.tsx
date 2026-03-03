import { useState } from 'react';
import { 
  Scale, Phone, Mail, Globe, 
  ChevronRight, Shield, AlertTriangle, FileText,
  User, Users, BookOpen, Heart, ExternalLink,
  CheckCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  emergencyContacts, 
  getLegalActionsByCountry,
  getResourcesByCategory 
} from '@/lib/legalSupport';

export function LegalSupport() {
  const [selectedCountry, setSelectedCountry] = useState('Italia');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const countries = ['Italia', 'UE', 'USA', 'UK'];
  const actions = getLegalActionsByCountry(selectedCountry);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'bg-red-100 text-red-700 border-red-200';
      case '24h':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case '72h':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'IMMEDIATA';
      case '24h':
        return 'Entro 24h';
      case '72h':
        return 'Entro 72h';
      default:
        return 'Quando possibile';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Supporto Legale</h2>
            <p className="text-indigo-100">Conosci i tuoi diritti e le azioni possibili</p>
          </div>
        </div>
        
        <Alert className="bg-white/10 border-white/20 text-white">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Queste informazioni hanno scopo informativo. Per casi specifici, consulta sempre un avvocato.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs principali */}
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="actions">
            <Scale className="w-4 h-4 mr-2" />
            Azioni Legali
          </TabsTrigger>
          <TabsTrigger value="emergency">
            <Phone className="w-4 h-4 mr-2" />
            Emergenza
          </TabsTrigger>
          <TabsTrigger value="resources">
            <BookOpen className="w-4 h-4 mr-2" />
            Risorse
          </TabsTrigger>
          <TabsTrigger value="rights">
            <Shield className="w-4 h-4 mr-2" />
            I Tuoi Diritti
          </TabsTrigger>
        </TabsList>

        {/* Azioni Legali */}
        <TabsContent value="actions" className="space-y-4">
          {/* Selezione paese */}
          <div className="flex gap-2">
            {countries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCountry === country
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {country}
              </button>
            ))}
          </div>

          {/* Lista azioni */}
          <div className="space-y-3">
            {actions.map((action) => (
              <Card 
                key={action.id}
                className={`cursor-pointer transition-all ${
                  expandedAction === action.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
              >
                <CardHeader 
                  className="pb-3"
                  onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getUrgencyColor(action.urgency)}>
                          {getUrgencyLabel(action.urgency)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Valido in: {action.applicableIn.join(', ')}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedAction === action.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </CardHeader>

                {expandedAction === action.id && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4 space-y-4">
                      {/* Steps */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Passaggi da seguire
                        </h4>
                        <ol className="space-y-2">
                          {action.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Contatti */}
                      {action.contacts.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-600" />
                            Contatti utili
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {action.contacts.map((contact, idx) => (
                              <div 
                                key={idx}
                                className="bg-gray-50 rounded-lg p-3 text-sm"
                              >
                                <div className="font-medium">{contact.name}</div>
                                {contact.phone && (
                                  <div className="text-gray-600 flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {contact.phone}
                                  </div>
                                )}
                                {contact.email && (
                                  <div className="text-gray-600 flex items-center gap-1 mt-1">
                                    <Mail className="w-3 h-3" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.website && (
                                  <a 
                                    href={contact.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 flex items-center gap-1 mt-1 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Sito web
                                  </a>
                                )}
                                {contact.description && (
                                  <div className="text-gray-500 text-xs mt-2">
                                    {contact.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Emergenza */}
        <TabsContent value="emergency" className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              In caso di pericolo immediato, chiama il <strong>112</strong> (Emergenze) o il <strong>113</strong> (Polizia).
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{contact.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
                    </div>
                    {contact.hours === '24/7' && (
                      <Badge className="bg-red-100 text-red-700">24/7</Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {contact.phone && (
                      <a 
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-lg font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="w-5 h-5" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a 
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                    {contact.website && (
                      <a 
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        Sito web
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Risorse */}
        <TabsContent value="resources" className="space-y-4">
          <Tabs defaultValue="minor" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="minor">
                <User className="w-4 h-4 mr-2" />
                Per Ragazzi
              </TabsTrigger>
              <TabsTrigger value="parent">
                <Users className="w-4 h-4 mr-2" />
                Per Genitori
              </TabsTrigger>
              <TabsTrigger value="educator">
                <BookOpen className="w-4 h-4 mr-2" />
                Per Educatori
              </TabsTrigger>
              <TabsTrigger value="victim">
                <Heart className="w-4 h-4 mr-2" />
                Vittime
              </TabsTrigger>
            </TabsList>

            {(['minor', 'parent', 'educator', 'victim'] as const).map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {getResourcesByCategory(category).map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <CardTitle>{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{resource.description}</p>
                      
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-line">
                          {resource.content}
                        </div>
                      </div>

                      {resource.checklist && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-3">Checklist</h4>
                          <div className="space-y-2">
                            {resource.checklist.map((item, idx) => (
                              <label 
                                key={idx}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                              >
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {resource.contacts && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium text-sm mb-3">Contatti utili</h4>
                          <div className="flex flex-wrap gap-2">
                            {resource.contacts.map((contact, idx) => (
                              <Badge key={idx} variant="secondary">
                                {contact.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Diritti */}
        <TabsContent value="rights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                I Tuoi Diritti Fondamentali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">Diritto alla Rimozione</h4>
                  <p className="text-sm text-blue-800">
                    Hai il diritto di richiedere la rimozione immediata di contenuti che ti danneggiano.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="font-semibold text-green-900 mb-2">Diritto alla Privacy</h4>
                  <p className="text-sm text-green-800">
                    I tuoi dati personali sono protetti dal GDPR. Puoi richiedere la loro cancellazione.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-2">Diritto alla Difesa</h4>
                  <p className="text-sm text-purple-800">
                    Puoi denunciare chi ti bullizza alle autorità competenti.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <h4 className="font-semibold text-orange-900 mb-2">Diritto al Risarcimento</h4>
                  <p className="text-sm text-orange-800">
                    Se hai subito danni, puoi richiedere un risarcimento.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold mb-3">Normativa di Riferimento (Italia)</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span><strong>Legge 71/2017</strong> - Disposizioni a tutela dei minori per la prevenzione e il contrasto del fenomeno del cyberbullismo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span><strong>Art. 612-bis CP</strong> - Diffamazione aggravata</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span><strong>Art. 595 CP</strong> - Ingiuria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span><strong>GDPR 2016/679</strong> - Regolamento generale sulla protezione dei dati</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
