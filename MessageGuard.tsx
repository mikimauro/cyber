import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AlertTriangle, Shield, X, CheckCircle, Info } from 'lucide-react';
import './MessageGuard.css';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskCategory {
  category: string;
  score: number;
  keywords: string[];
}

export interface AnalysisResult {
  id?: string;
  messageHash: string;
  riskScore: number;
  riskLevel: RiskLevel;
  isBlocked: boolean;
  showWarning: boolean;
  warningMessage: string;
  categories: RiskCategory[];
}

export interface MessageGuardProps {
  /** ID utente che sta scrivendo */
  userId?: string;
  /** ID scuola */
  schoolId?: string;
  /** ID classe */
  classId?: string;
  /** Tipo di contesto: 'chat', 'forum', 'comment' */
  contextType?: string;
  /** URL del backend API */
  apiUrl?: string;
  /** Debounce time in ms per l'analisi */
  debounceMs?: number;
  /** Se mostrare l'indicatore di analisi */
  showAnalysisIndicator?: boolean;
  /** Callback quando il messaggio è sicuro */
  onSafeMessage?: (message: string) => void;
  /** Callback quando l'utente conferma nonostante l'avviso */
  onConfirmSend?: (message: string, analysis: AnalysisResult) => void;
  /** Callback quando il messaggio è bloccato */
  onBlocked?: (message: string, analysis: AnalysisResult) => void;
  /** Callback quando l'analisi cambia */
  onAnalysisChange?: (analysis: AnalysisResult | null) => void;
  /** Stile personalizzato */
  className?: string;
  /** Placeholder input */
  placeholder?: string;
  /** Se l'input è disabilitato */
  disabled?: boolean;
  /** Lunghezza massima messaggio */
  maxLength?: number;
}

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysis: AnalysisResult;
  message: string;
}

const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  analysis,
  message,
}) => {
  if (!isOpen) return null;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
    }
  };

  const getRiskLabel = (level: RiskLevel) => {
    switch (level) {
      case 'low': return 'Basso';
      case 'medium': return 'Medio';
      case 'high': return 'Alto';
      case 'critical': return 'Critico';
    }
  };

  const categoryLabels: Record<string, string> = {
    offensive_language: 'Linguaggio offensivo',
    bullying: 'Bullismo',
    threats: 'Minacce',
    self_harm: 'Autolesionismo',
    grooming: 'Adescamento',
    hate_speech: 'Linguaggio di odio',
    normal: 'Normale',
  };

  return (
    <div className="message-guard-modal-overlay">
      <div className="message-guard-modal">
        <div className="message-guard-modal-header" style={{ backgroundColor: getRiskColor(analysis.riskLevel) }}>
          <AlertTriangle size={28} />
          <h3>⚠️ Attenzione</h3>
          <button className="message-guard-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="message-guard-modal-body">
          <p className="message-guard-warning-text">
            {analysis.warningMessage || 'Questo messaggio potrebbe essere inappropriato.'}
          </p>

          <div className="message-guard-risk-indicator">
            <div className="message-guard-risk-score">
              <span className="message-guard-score-value">{analysis.riskScore}</span>
              <span className="message-guard-score-label">/100</span>
            </div>
            <div className="message-guard-risk-level" style={{ color: getRiskColor(analysis.riskLevel) }}>
              Livello di rischio: <strong>{getRiskLabel(analysis.riskLevel)}</strong>
            </div>
          </div>

          {analysis.categories.length > 0 && (
            <div className="message-guard-categories">
              <h4>Categorie rilevate:</h4>
              <ul>
                {analysis.categories
                  .filter(c => c.category !== 'normal')
                  .map((cat, idx) => (
                    <li key={idx}>
                      <span className="message-guard-category-name">
                        {categoryLabels[cat.category] || cat.category}
                      </span>
                      <span className="message-guard-category-score">
                        {Math.round(cat.score * 100)}%
                      </span>
                      {cat.keywords.length > 0 && (
                        <span className="message-guard-keywords">
                          ({cat.keywords.join(', ')})
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="message-guard-message-preview">
            <h4>Il tuo messaggio:</h4>
            <blockquote>"{message}"</blockquote>
          </div>

          <div className="message-guard-suggestions">
            <Info size={16} />
            <p>
              <strong>Suggerimento:</strong> Rileggi il tuo messaggio prima di inviarlo. 
              Se qualcuno ti sta facendo del male, parla con un adulto di fiducia.
            </p>
          </div>
        </div>

        <div className="message-guard-modal-footer">
          <button className="message-guard-btn-secondary" onClick={onClose}>
            <X size={18} />
            Modifica messaggio
          </button>
          <button className="message-guard-btn-primary" onClick={onConfirm}>
            <CheckCircle size={18} />
            Invia comunque
          </button>
        </div>
      </div>
    </div>
  );
};

export const MessageGuard: React.FC<MessageGuardProps> = ({
  userId,
  schoolId,
  classId,
  contextType = 'chat',
  apiUrl = 'http://localhost:3000',
  debounceMs = 500,
  showAnalysisIndicator = true,
  onSafeMessage,
  onConfirmSend,
  onBlocked,
  onAnalysisChange,
  className = '',
  placeholder = 'Scrivi un messaggio...',
  disabled = false,
  maxLength = 2000,
}) => {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Analisi del messaggio
  const analyzeMessage = useCallback(async (text: string) => {
    if (!text.trim()) {
      setAnalysis(null);
      onAnalysisChange?.(null);
      return;
    }

    // Annulla richiesta precedente
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsAnalyzing(true);

    try {
      const response = await fetch(`${apiUrl}/api/v1/messages/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          userId,
          schoolId,
          classId,
          contextType,
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error('Errore analisi');
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
      onAnalysisChange?.(result);

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Richiesta annullata, ignora
      }
      console.error('Errore analisi messaggio:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiUrl, userId, schoolId, classId, contextType, onAnalysisChange]);

  // Debounce per l'analisi
  const handleMessageChange = useCallback((text: string) => {
    setMessage(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      analyzeMessage(text);
    }, debounceMs);
  }, [analyzeMessage, debounceMs]);

  // Invio messaggio
  const handleSend = useCallback(async () => {
    if (!message.trim()) return;

    // Se non c'è analisi o è in corso, invia diretto
    if (!analysis || isAnalyzing) {
      onSafeMessage?.(message);
      setMessage('');
      return;
    }

    // Se il messaggio è bloccato
    if (analysis.isBlocked) {
      onBlocked?.(message, analysis);
      setShowWarning(true);
      setPendingMessage(message);
      return;
    }

    // Se mostrare warning
    if (analysis.showWarning) {
      setShowWarning(true);
      setPendingMessage(message);
      return;
    }

    // Messaggio sicuro
    onSafeMessage?.(message);
    setMessage('');
    setAnalysis(null);
  }, [message, analysis, isAnalyzing, onSafeMessage, onBlocked]);

  // Conferma invio nonostante avviso
  const handleConfirmSend = useCallback(async () => {
    if (!pendingMessage || !analysis?.id) return;

    try {
      // Notifica backend della conferma
      await fetch(`${apiUrl}/api/v1/messages/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: analysis.id,
          userId,
        }),
      });
    } catch (error) {
      console.error('Errore conferma invio:', error);
    }

    onConfirmSend?.(pendingMessage, analysis);
    setMessage('');
    setPendingMessage('');
    setShowWarning(false);
    setAnalysis(null);
  }, [pendingMessage, analysis, apiUrl, userId, onConfirmSend]);

  // Chiudi warning
  const handleCloseWarning = useCallback(() => {
    setShowWarning(false);
    setPendingMessage('');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Calcola colore indicatore rischio
  const getRiskIndicatorColor = () => {
    if (!analysis) return '#e5e7eb';
    switch (analysis.riskLevel) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
    }
  };

  return (
    <div className={`message-guard-container ${className}`}>
      <div className="message-guard-input-wrapper">
        <textarea
          className="message-guard-input"
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
        />
        
        {showAnalysisIndicator && (
          <div className="message-guard-indicators">
            {isAnalyzing && (
              <span className="message-guard-analyzing">
                <Shield size={14} className="message-guard-spin" />
                Analisi...
              </span>
            )}
            
            {analysis && !isAnalyzing && (
              <div 
                className="message-guard-risk-dot"
                style={{ backgroundColor: getRiskIndicatorColor() }}
                title={`Rischio: ${analysis.riskLevel} (${analysis.riskScore}/100)`}
              />
            )}
            
            <span className="message-guard-char-count">
              {message.length}/{maxLength}
            </span>
          </div>
        )}
      </div>

      <div className="message-guard-actions">
        <button
          className="message-guard-send-btn"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
        >
          Invia
        </button>
      </div>

      {/* Modal warning */}
      {analysis && (
        <WarningModal
          isOpen={showWarning}
          onClose={handleCloseWarning}
          onConfirm={handleConfirmSend}
          analysis={analysis}
          message={pendingMessage || message}
        />
      )}
    </div>
  );
};

export default MessageGuard;
