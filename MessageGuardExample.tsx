import React, { useState } from 'react';
import { MessageGuard, AnalysisResult } from './MessageGuard';
import { Toaster, toast } from 'sonner';

/**
 * Esempio di utilizzo del componente MessageGuard
 * in un'applicazione di chat scolastica
 */
export const MessageGuardExample: React.FC = () => {
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  // Callback quando il messaggio è sicuro
  const handleSafeMessage = (message: string) => {
    toast.success('Messaggio inviato!', {
      description: 'Il tuo messaggio è stato analizzato ed è sicuro.',
    });
    setSentMessages(prev => [...prev, message]);
  };

  // Callback quando l'utente conferma nonostante l'avviso
  const handleConfirmSend = (message: string, analysis: AnalysisResult) => {
    toast.warning('Messaggio inviato con avviso', {
      description: `Hai scelto di inviare comunque. Livello rischio: ${analysis.riskLevel}`,
    });
    setSentMessages(prev => [...prev, message]);
  };

  // Callback quando il messaggio è bloccato
  const handleBlocked = (message: string, analysis: AnalysisResult) => {
    toast.error('Messaggio bloccato', {
      description: 'Questo messaggio è stato bloccato per la tua sicurezza.',
    });
  };

  // Callback quando l'analisi cambia
  const handleAnalysisChange = (analysis: AnalysisResult | null) => {
    if (analysis) {
      console.log('Analisi:', analysis);
    }
  };

  return (
    <div className="message-guard-example">
      <Toaster position="top-right" />
      
      <header className="example-header">
        <h1>🏫 Chat Sicura - Classe 3A</h1>
        <p>I tuoi messaggi sono analizzati per garantire un ambiente sicuro</p>
      </header>

      <main className="example-main">
        {/* Area messaggi inviati */}
        <div className="messages-area">
          <h2>Messaggi</h2>
          {sentMessages.length === 0 ? (
            <p className="no-messages">Nessun messaggio. Inizia a scrivere!</p>
          ) : (
            <ul className="messages-list">
              {sentMessages.map((msg, idx) => (
                <li key={idx} className="message-item">
                  <span className="message-author">Tu:</span>
                  <span className="message-text">{msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Componente MessageGuard */}
        <div className="input-area">
          <MessageGuard
            userId="student-123"
            schoolId="school-456"
            classId="class-789"
            contextType="chat"
            apiUrl="http://localhost:3000"
            debounceMs={500}
            showAnalysisIndicator={true}
            onSafeMessage={handleSafeMessage}
            onConfirmSend={handleConfirmSend}
            onBlocked={handleBlocked}
            onAnalysisChange={handleAnalysisChange}
            placeholder="Scrivi un messaggio alla classe..."
            maxLength={500}
          />
        </div>
      </main>

      {/* Info box */}
      <aside className="example-info">
        <h3>ℹ️ Come funziona</h3>
        <ul>
          <li>I messaggi sono analizzati in tempo reale</li>
          <li>Se viene rilevato contenuto rischioso, vedrai un avviso</li>
          <li>Puoi scegliere di modificare o inviare comunque</li>
          <li>I messaggi critici sono bloccati automaticamente</li>
          <li>I genitori sono notificati per rischi elevati</li>
        </ul>
      </aside>

      <style>{`
        .message-guard-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .example-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .example-header h1 {
          margin: 0 0 10px 0;
          color: #1f2937;
        }

        .example-header p {
          margin: 0;
          color: #6b7280;
        }

        .example-main {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .messages-area {
          padding: 20px;
          min-height: 300px;
          max-height: 400px;
          overflow-y: auto;
          background: #f9fafb;
        }

        .messages-area h2 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #6b7280;
        }

        .no-messages {
          text-align: center;
          color: #9ca3af;
          padding: 40px;
        }

        .messages-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .message-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 12px;
          margin-bottom: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .message-author {
          font-weight: 600;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .message-text {
          color: #374151;
        }

        .input-area {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .example-info {
          margin-top: 30px;
          padding: 20px;
          background: #eff6ff;
          border-radius: 12px;
        }

        .example-info h3 {
          margin: 0 0 12px 0;
          color: #1e40af;
        }

        .example-info ul {
          margin: 0;
          padding-left: 20px;
          color: #1e40af;
        }

        .example-info li {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default MessageGuardExample;
