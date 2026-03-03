import { useState, useCallback } from 'react';
import { 
  Shield, Scale, BookOpen, Phone, 
  Menu, X, ChevronRight, AlertTriangle,
  CheckCircle, Brain, Users, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/FileUploader';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { LegalSupport } from '@/components/LegalSupport';
import type { AnalysisResult } from '@/types';
import { analyzeFile } from '@/lib/forensics';
import { 
  performReverseSearch, 
  getGeoLocationData, 
  generateDiffusionData,
  identifyPatientZero 
} from '@/lib/viralTracking';

function App() {
  const [activeSection, setActiveSection] = useState<'home' | 'analyze' | 'legal' | 'resources' | 'contact'>('home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileSelected = useCallback((file: File | null) => {
    setSelectedFile(file);
    setAnalysisResult(null);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simula progresso
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Esegui analisi
      const [forensicsResult, reverseSearch, geoData] = await Promise.all([
        analyzeFile(selectedFile),
        performReverseSearch(selectedFile),
        getGeoLocationData(selectedFile, null)
      ]);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // Genera dati diffusione
      const diffusionData = generateDiffusionData();
      const patientZero = identifyPatientZero(diffusionData);

      // Costruisci risultato completo
      const completeResult: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        uploadDate: new Date(),
        scores: forensicsResult.scores || {
          aiGenerated: 0,
          manipulated: 0,
          deepfake: 0,
          authentic: 100
        },
        metadata: forensicsResult.metadata || null,
        elaAnalysis: forensicsResult.elaAnalysis || null,
        reverseSearch: reverseSearch,
        geoData: geoData,
        diffusionMap: diffusionData,
        patientZero: patientZero
      };

      setAnalysisResult(completeResult);
    } catch (error) {
      console.error('Errore analisi:', error);
      alert('Si è verificato un errore durante l\'analisi. Riprova.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollToSection = (section: typeof activeSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => scrollToSection('home')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl hidden sm:block">CyberShield</span>
            </div>

            {/* Nav Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'home', label: 'Home', icon: Shield },
                { id: 'analyze', label: 'Analisi', icon: Brain },
                { id: 'legal', label: 'Supporto Legale', icon: Scale },
                { id: 'resources', label: 'Risorse', icon: BookOpen },
                { id: 'contact', label: 'Contatti', icon: Phone },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id as typeof activeSection)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-4 py-2 space-y-1">
              {[
                { id: 'home', label: 'Home', icon: Shield },
                { id: 'analyze', label: 'Analisi', icon: Brain },
                { id: 'legal', label: 'Supporto Legale', icon: Scale },
                { id: 'resources', label: 'Risorse', icon: BookOpen },
                { id: 'contact', label: 'Contatti', icon: Phone },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id as typeof activeSection)}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Home Section */}
        {activeSection === 'home' && (
          <div className="space-y-12">
            {/* Hero */}
            <section className="text-center py-12 md:py-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Proteggiti dal Cyberbullismo
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Difendi la tua{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  identità digitale
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                Analizza immagini e video per rilevare manipolazioni AI, traccia la diffusione dei contenuti 
                e ottieni supporto legale per difenderti dal cyberbullismo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => scrollToSection('analyze')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Inizia Analisi
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('legal')}
                >
                  <Scale className="w-5 h-5 mr-2" />
                  Supporto Legale
                </Button>
              </div>
            </section>

            {/* Features */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analisi AI Avanzata</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Rileva contenuti generati o manipolati da intelligenza artificiale con precisione.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tracciamento Globale</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Segui la diffusione dei contenuti in tempo reale su mappa mondiale.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Supporto Legale</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Guide pratiche e contatti per difendere i tuoi diritti legalmente.
                </p>
              </div>
            </section>

            {/* Stats */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold">98%</div>
                  <div className="text-blue-100">Precisione rilevamento</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">50+</div>
                  <div className="text-blue-100">Paesi tracciati</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">24/7</div>
                  <div className="text-blue-100">Supporto disponibile</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">100%</div>
                  <div className="text-blue-100">Gratuito</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Analyze Section */}
        {activeSection === 'analyze' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Analisi Forense Contenuti
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Carica un'immagine o un video per analizzarne l'autenticità e tracciarne la diffusione.
              </p>
            </div>

            <FileUploader
              onFileSelected={handleFileSelected}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              progress={analysisProgress}
              selectedFile={selectedFile}
            />

            {isAnalyzing && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Analisi in corso...
                </div>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div className="mt-8">
                <AnalysisDashboard result={analysisResult} />
              </div>
            )}

            {/* Info box */}
            {!analysisResult && !isAnalyzing && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Cosa analizziamo
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• Metadati EXIF (GPS, dispositivo, software)</li>
                    <li>• Error Level Analysis (ELA)</li>
                    <li>• Pattern di generazione AI</li>
                    <li>• Deepfake detection</li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Tracciamento
                  </h4>
                  <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                    <li>• Reverse image search</li>
                    <li>• Identificazione "paziente zero"</li>
                    <li>• Mappa di diffusione globale</li>
                    <li>• Timeline di propagazione</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal Section */}
        {activeSection === 'legal' && <LegalSupport />}

        {/* Resources Section */}
        {activeSection === 'resources' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Risorse e Guide
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Informazioni utili per ragazzi, genitori ed educatori.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <Users className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Per i Genitori</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Come riconoscere i segni del cyberbullismo e supportare tuo figlio.
                </p>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    Segnali di allarme
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    Come parlarne
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    Azioni pratiche
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <Shield className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Per i Ragazzi</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Cosa fare se sei vittima di cyberbullismo o se ne sei testimone.
                </p>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                    Non sei solo
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                    Chi chiamare
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                    Come difendersi
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <BookOpen className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Per le Scuole</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Protocolli e risorse per prevenire e gestire il cyberbullismo.
                </p>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-green-600" />
                    Protocollo antibullismo
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-green-600" />
                    Formazione docenti
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-green-600" />
                    Attività studenti
                  </li>
                </ul>
              </div>
            </div>

            {/* Educational content */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mt-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-12 h-12 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Riconosci il Cyberbullismo</h3>
                  <p className="text-orange-100 mb-4">
                    Il cyberbullismo include messaggi minacciosi, diffusione di foto/video senza consenso, 
                    esclusione dai gruppi online, creazione di profili falsi per diffamare.
                  </p>
                  <Button 
                    variant="secondary"
                    onClick={() => scrollToSection('legal')}
                  >
                    Scopri cosa puoi fare
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Contatti di Emergenza
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Non esitare a chiedere aiuto. Questi numeri sono attivi 24/7.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-red-900 dark:text-red-300">Polizia Postale</h3>
                    <p className="text-red-700 dark:text-red-400">Specializzati in reati informatici</p>
                  </div>
                  <a 
                    href="tel:117"
                    className="text-3xl font-bold text-red-600 hover:text-red-700"
                  >
                    117
                  </a>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">Telefono Azzurro</h3>
                    <p className="text-blue-700 dark:text-blue-400">Supporto per minori</p>
                  </div>
                  <a 
                    href="tel:19696"
                    className="text-3xl font-bold text-blue-600 hover:text-blue-700"
                  >
                    1.96.96
                  </a>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-300">Carabinieri</h3>
                    <p className="text-green-700 dark:text-green-400">Emergenze e denunce</p>
                  </div>
                  <a 
                    href="tel:112"
                    className="text-3xl font-bold text-green-600 hover:text-green-700"
                  >
                    112
                  </a>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded-r-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300">Telefono Amico</h3>
                    <p className="text-purple-700 dark:text-purple-400">Supporto emotivo</p>
                  </div>
                  <a 
                    href="tel:800860022"
                    className="text-2xl font-bold text-purple-600 hover:text-purple-700"
                  >
                    800 86 00 22
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <h4 className="font-semibold mb-4">Altri Contatti Utili</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Garante per l'Infanzia</strong>
                  <p className="text-gray-600">06 67791 - www.garanteinfanzia.org</p>
                </div>
                <div>
                  <strong>Safer Internet Center</strong>
                  <p className="text-gray-600">06 4201 6297 - www.saferinternet.it</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">CyberShield</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Proteggiamo le persone dal cyberbullismo attraverso tecnologia avanzata e supporto legale.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navigazione</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('home')} className="text-gray-600 hover:text-gray-900">Home</button></li>
                <li><button onClick={() => scrollToSection('analyze')} className="text-gray-600 hover:text-gray-900">Analisi</button></li>
                <li><button onClick={() => scrollToSection('legal')} className="text-gray-600 hover:text-gray-900">Supporto Legale</button></li>
                <li><button onClick={() => scrollToSection('resources')} className="text-gray-600 hover:text-gray-900">Risorse</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Risorse</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Guide per genitori</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Supporto per ragazzi</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Protocolli scolastici</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Normativa</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Emergenza</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-red-600 font-medium">Polizia Postale: 117</li>
                <li className="text-blue-600 font-medium">Telefono Azzurro: 1.96.96</li>
                <li className="text-green-600 font-medium">Carabinieri: 112</li>
                <li><button onClick={() => scrollToSection('contact')} className="text-blue-600 hover:underline">Tutti i contatti</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2024 CyberShield. Tutti i diritti riservati. | Questo servizio è gratuito e senza scopo di lucro.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
