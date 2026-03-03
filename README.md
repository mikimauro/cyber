# 🛡️ SafeChat AI - Modulo di Analisi Messaggi in Tempo Reale

Sistema di intelligenza artificiale per l'analisi in tempo reale dei messaggi scolastici, con rilevamento di linguaggio offensivo, bullismo, minacce, autolesionismo e grooming.

## 🎯 Funzionalità

### Analisi in Tempo Reale
- **Monitoraggio attivo** durante la digitazione del messaggio
- **Debounce intelligente** (default 500ms) per bilanciare performance e reattività
- **Analisi asincrona** non bloccante per l'utente

### Rilevamento Contenuti
| Categoria | Descrizione | Modello AI |
|-----------|-------------|------------|
| 🗣️ Linguaggio Offensivo | Insulti, volgarità, linguaggio scurrile | BERT-it Toxicity |
| 👥 Bullismo | Pattern di bullismo, esclusione, derisione | Pattern + NLP |
| ⚠️ Minacce | Minacce verbali, intimidazioni | Pattern Matching |
| 💔 Autolesionismo | Contenuti autolesionistici, ideazione suicida | Pattern + NLP |
| 👤 Grooming | Adescamento online, pattern predatori | Pattern Matching |
| 🚫 Hate Speech | Discriminazione, odio, razzismo | BERT-it Hate Speech |

### Sistema di Scoring
```
Score 0-25:   🟢 BASSO    - Nessun intervento
Score 26-50:  🟡 MEDIO    - Mostra popup avviso
Score 51-75:  🟠 ALTO     - Popup + Notifica genitori
Score 76-100: 🔴 CRITICO  - Blocco + Notifica scuola + Genitori
```

### Popup Interattivo
- Messaggio personalizzato in base alle categorie rilevate
- Score rischio visibile (0-100)
- Dettaglio categorie rilevate con keywords
- Preview del messaggio
- Suggerimenti per comportamenti appropriati
- Possibilità di modificare o inviare comunque

### Logging Crittografato
- **AES-256-GCM** per cifratura contenuti
- **SHA-256** per hashing anonimo utenti/messaggi
- **Retention policy** configurabile per livello rischio
- **GDPR compliant** con possibilità di anonimizzazione

### Notifiche
- **Email** ai genitori per rischi alto/critico
- **SMS** (opzionale) per casi urgenti
- **Dashboard scuola** in tempo reale
- **WebSocket** per alert istantanei

### Toggle Monitoraggio
- Attivazione/disattivazione per scuola
- Configurazione per classe
- Impostazioni granulari (canali, categorie, threshold)
- Orari di monitoraggio configurabili

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MessageGuard Component (React)                     │   │
│  │  - Input con analisi in tempo reale                 │   │
│  │  - Popup di avviso interattivo                      │   │
│  │  - Indicatori di rischio visivi                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SchoolAlertsPanel Component                        │   │
│  │  - Dashboard statistiche                            │   │
│  │  - Tabella alert con filtri                         │   │
│  │  - Modal dettaglio e revisione                      │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴──────────────────────────────────┐
│                      BACKEND (NestJS)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Message     │  │  Encryption  │  │  Notification│       │
│  │  Analysis    │  │  Service     │  │  Service     │       │
│  │  Service     │  │  (AES-256)   │  │  (Email/SMS) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  School      │  │  Monitoring  │  │  Statistics  │       │
│  │  Panel       │  │  Settings    │  │  Service     │       │
│  │  Service     │  │  Service     │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────┴──────────────────────────────────┐
│                    AI SERVICE (Python)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FastAPI + Transformers (HuggingFace)               │   │
│  │  - BERT-it Hate Speech Detection                    │   │
│  │  - RoBERTa Toxicity Classification                  │   │
│  │  - Emotion Analysis                                 │   │
│  │  - Pattern Matching (grooming, bullismo, etc.)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Struttura Progetto

```
safechat-ai/
├── ai-service/                 # Microservizio Python AI
│   ├── main.py                  # FastAPI app con modelli NLP
│   └── requirements.txt         # Dipendenze Python
│
├── backend/                     # Backend NestJS
│   ├── src/
│   │   ├── message-analysis/    # Modulo analisi messaggi
│   │   │   ├── entities/
│   │   │   │   ├── analyzed-message.entity.ts
│   │   │   │   └── monitoring-settings.entity.ts
│   │   │   ├── message-analysis.service.ts
│   │   │   ├── message-analysis.controller.ts
│   │   │   └── message-analysis.module.ts
│   │   ├── encryption/          # Modulo crittografia
│   │   │   ├── encryption.service.ts
│   │   │   └── encryption.module.ts
│   │   ├── notification/        # Modulo notifiche
│   │   │   ├── notification.service.ts
│   │   │   └── notification.module.ts
│   │   ├── school-panel/        # Modulo pannello scuola
│   │   │   ├── school-panel.service.ts
│   │   │   ├── school-panel.controller.ts
│   │   │   └── school-panel.module.ts
│   │   └── app.module.ts
│   └── package.json
│
├── frontend/                    # Frontend React
│   └── src/
│       └── components/
│           ├── MessageGuard/    # Componente input messaggi
│           │   ├── MessageGuard.tsx
│           │   ├── MessageGuard.css
│           │   └── MessageGuardExample.tsx
│           └── SchoolPanel/     # Componente pannello scuola
│               ├── SchoolAlertsPanel.tsx
│               └── SchoolAlertsPanel.css
│
└── database/                    # Schema database
    └── schema.sql
```

## 🚀 Installazione

### 1. AI Service (Python)

```bash
cd ai-service

# Crea virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installa dipendenze
pip install -r requirements.txt

# Avvia servizio
python main.py
# oppure
uvicorn main:app --reload --port 8000
```

### 2. Backend (NestJS)

```bash
cd backend

# Installa dipendenze
npm install

# Configura variabili ambiente
cp .env.example .env
# Modifica .env con i tuoi valori

# Avvia in development
npm run start:dev

# Build production
npm run build
npm run start:prod
```

**Variabili ambiente richieste (.env):**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=safechat
DB_PASSWORD=your_password
DB_NAME=safechat_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Encryption (genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_32_byte_hex_key

# SMTP (per notifiche email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=SafeChat AI <alerts@safechat.edu>

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
```

### 3. Frontend (React)

```bash
cd frontend

# Installa dipendenze
npm install

# Avvia development server
npm start

# Build production
npm run build
```

## 📊 Database Schema

### Tabelle Principali

#### `analyzed_messages`
- Memorizza tutti i messaggi analizzati
- Contenuto crittografato con AES-256-GCM
- Hash anonimi per utenti e messaggi
- Retention policy automatica

#### `monitoring_settings`
- Configurazione monitoraggio per scuola/classe
- Toggle attivazione/disattivazione
- Threshold personalizzabili
- Orari e canali di notifica

## 🔌 API Endpoints

### Analisi Messaggi
```
POST /api/v1/messages/analyze
Body: { message, userId?, schoolId?, classId?, contextType? }
Response: { id, messageHash, riskScore, riskLevel, isBlocked, showWarning, warningMessage, categories }

POST /api/v1/messages/confirm
Body: { messageId, userId }
Description: Conferma invio nonostante avviso

POST /api/v1/messages/monitoring/toggle
Body: { schoolId, classId?, isActive, updatedBy }
```

### Pannello Scuola
```
GET /api/v1/school-panel/alerts?schoolId=&riskLevel=&reviewed=&page=&limit=
GET /api/v1/school-panel/alerts/:id?schoolId=
POST /api/v1/school-panel/alerts/:id/review?schoolId=
GET /api/v1/school-panel/dashboard/:schoolId
GET /api/v1/school-panel/critical/:schoolId
```

### AI Service
```
POST /analyze
Body: { message, userId?, schoolId?, context? }
Response: { message_hash, overall_risk_score, risk_level, is_blocked, categories, processing_time_ms }

GET /health
GET /models/info
```

## 💻 Utilizzo Componente React

```tsx
import { MessageGuard } from './components/MessageGuard/MessageGuard';

function ChatApp() {
  return (
    <MessageGuard
      userId="student-123"
      schoolId="school-456"
      classId="class-789"
      contextType="chat"
      apiUrl="http://localhost:3000"
      debounceMs={500}
      showAnalysisIndicator={true}
      onSafeMessage={(msg) => console.log('Messaggio sicuro:', msg)}
      onConfirmSend={(msg, analysis) => console.log('Inviato con avviso:', msg, analysis)}
      onBlocked={(msg, analysis) => console.log('Bloccato:', msg, analysis)}
      placeholder="Scrivi un messaggio..."
      maxLength={500}
    />
  );
}
```

## 🎨 Personalizzazione

### Messaggio Avviso Personalizzato
```typescript
// Nel backend, nelle MonitoringSettings
{
  customWarningMessage: "Attenzione: questo messaggio potrebbe ferire qualcuno. Rileggi prima di inviare."
}
```

### Threshold Personalizzato
```typescript
{
  customThreshold: 40,  // Default: usa scoring AI
  parentNotificationLevel: 'high',  // 'medium' | 'high' | 'critical'
  schoolNotificationLevel: 'medium'
}
```

### Canali Notifica
```typescript
{
  notificationChannels: ['email', 'sms', 'push']
}
```

## 🔒 Sicurezza

### Crittografia
- **AES-256-GCM** per cifratura contenuti
- **SHA-256** per hashing
- **PBKDF2** per password (100k iterations)
- **Key rotation** supportato

### Privacy (GDPR)
- Dati anonimizzati con hash
- Retention policy automatica
- Possibilità di esportazione dati
- Consenso informato configurabile

### Rate Limiting
- 100 richieste/minuto per IP
- 60 richieste/minuto per analisi messaggi

## 📈 Performance

| Metrica | Target |
|---------|--------|
| Latenza analisi | < 200ms (p95) |
| Throughput | 1000 msg/sec |
| Disponibilità | 99.9% |
| Accuratezza | > 90% |

## 🧪 Testing

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# AI Service
cd ai-service
pytest tests/

# Frontend
cd frontend
npm test
```

## 📝 License

MIT License - SafeChat AI Team

## 🤝 Contributing

1. Fork il repository
2. Crea un branch (`git checkout -b feature/amazing-feature`)
3. Commit le modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📧 Supporto

Per supporto tecnico: support@safechat.edu
