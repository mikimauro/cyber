# 🛡️ PIATTAFORMA NAZIONALE PER LA SICUREZZA DIGITALE SCOLASTICA
## Architettura Tecnica Completa - Documento di Specifica

**Versione:** 1.0  
**Data:** 2024  
**Classificazione:** Documento Tecnico di Architettura Enterprise  
**Destinatari:** CTO, Architetti Software, DevOps, Security Officer, DPO

---

## 📋 INDICE

1. [Visione e Obiettivi](#1-visione-e-obiettivi)
2. [Architettura di Sistema](#2-architettura-di-sistema)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Struttura Database](#4-struttura-database)
5. [Moduli e Microservizi](#5-moduli-e-microservizi)
6. [Flussi Utente](#6-flussi-utente)
7. [Sistema Ruoli e Permessi](#7-sistema-ruoli-e-permessi)
8. [Schema API](#8-schema-api)
9. [Architettura AI](#9-architettura-ai)
10. [Sicurezza e GDPR](#10-sicurezza-e-gdpr)
11. [Deployment e DevOps](#11-deployment-e-devops)

---

## 1. VISIONE E OBIETTIVI

### 1.1 Missione
Creare una piattaforma nazionale integrata per la prevenzione, il rilevamento tempestivo e il contrasto del bullismo, cyberbullismo, adescamento online e manipolazione dei contenuti digitali nel contesto scolastico italiano.

### 1.2 Obiettivi Chiave

| Obiettivo | KPI Target |
|-----------|------------|
| Riduzione tempi di intervento | < 24h dalla segnalazione |
| Copertura scuole italiane | 100% entro 36 mesi |
| Accuratezza rilevamento AI | > 95% per contenuti pericolosi |
| Soddisfazione utenti | NPS > 50 |
| Disponibilità sistema | 99.99% uptime |

### 1.3 Utenti Target

```
┌─────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA UTENTI                        │
├─────────────────────────────────────────────────────────────┤
│  PRIMARI          │  SECONDARI        │  ISTITUZIONALI      │
├───────────────────┼───────────────────┼─────────────────────┤
│  • Studenti       │  • Genitori       │  • MIUR             │
│  • Docenti        │  • Psicologi      │  • Polizia Postale  │
│  • Dirigenti      │  • Ass. Genitori  │  • Garante Infanzia │
│  • DSAs           │  • Avvocati       │  • Regioni          │
└───────────────────┴───────────────────┴─────────────────────┘
```

---

## 2. ARCHITETTURA DI SISTEMA

### 2.1 Diagramma Architetturale High-Level

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Web App   │  │  Mobile App │  │  Dashboard  │  │  Portale Istituzioni │ │
│  │  (React)    │  │(React Native│  │   Admin     │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────────────┴────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      CDN + WAF (CloudFlare)  │
                    │    DDoS Protection, Caching  │
                    └──────────────┬──────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Kong/AWS API Gateway                                 │ │
│  │  • Rate Limiting • Auth JWT/OAuth2 • Request Validation • Logging      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────────┐
│                         MICROSERVICES LAYER (Kubernetes)                     │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Identity   │ │  Reporting   │ │    AI/ML     │ │ Notification │        │
│  │   Service    │ │   Service    │ │   Service    │ │   Service    │        │
│  │  (Auth/RBAC) │ │(Segnalazioni)│ │(Analisi NLP) │ │ (Email/SMS)  │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   School     │ │  Analytics   │ │   Content    │ │   Document   │        │
│  │   Service    │ │   Service    │ │   Moderation │ │   Service    │        │
│  │(Gestione Ist)│ │ (Dashboard)  │ │  (Media AI)  │ │  (Storage)   │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                        │
│  │   Chatbot    │ │  Workflow    │ │  Integration │                        │
│  │   Service    │ │   Engine     │ │   Service    │                        │
│  │  (NLP/LLM)   │ │(Automazione) │ │(Esterni/API) │                        │
│  └──────────────┘ └──────────────┘ └──────────────┘                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   PostgreSQL    │  │    MongoDB      │  │      Redis Cluster          │  │
│  │   (Primary DB)  │  │  (Logs/Events)  │  │   (Cache/Sessions)          │  │
│  │  Multi-AZ HA    │  │  Sharded        │  │   Pub/Sub                   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   S3/MinIO      │  │ Elasticsearch   │  │      Kafka/RabbitMQ         │  │
│  │ (File Storage)  │  │    (Search)     │  │    (Event Streaming)        │  │
│  │  Encrypted      │  │   Full-text     │  │    Async Processing         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────────┐
│                         AI/ML INFRASTRUCTURE                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    MLflow + Kubeflow Pipelines                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │ │
│  │  │  Text CLF   │ │  Image CLF  │ │  Deepfake   │ │  Toxicity NLP   │  │ │
│  │  │  (BERT)     │ │  (ResNet)   │ │  Detection  │ │  (RoBERTa)      │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Pattern Architetturali

| Pattern | Implementazione | Scopo |
|---------|-----------------|-------|
| **Microservices** | Kubernetes + Docker | Scalabilità indipendente |
| **Event-Driven** | Apache Kafka | Comunicazione asincrona |
| **CQRS** | Read/Write DB separati | Performance query |
| **Saga** | Orchestrazione workflow | Transazioni distribuite |
| **API Gateway** | Kong/AWS API GW | Centralizzazione accesso |
| **Circuit Breaker** | Resilience4j | Fault tolerance |

---

## 3. STACK TECNOLOGICO

### 3.1 Frontend

| Componente | Tecnologia | Versione | Note |
|------------|------------|----------|------|
| Framework | React 18+ | ^18.2.0 | Concurrent features |
| Language | TypeScript | ^5.0.0 | Strict mode |
| Styling | Tailwind CSS | ^3.4.0 | Design system custom |
| UI Components | shadcn/ui | latest | Accessibilità WCAG 2.1 |
| State Management | Zustand + TanStack Query | latest | Server state sync |
| Routing | React Router v6 | ^6.20.0 | Code splitting |
| Forms | React Hook Form + Zod | latest | Validazione type-safe |
| Charts | Recharts/D3.js | latest | Dashboard analytics |
| Maps | Leaflet/Mapbox GL | latest | Visualizzazione geografica |
| Build Tool | Vite | ^5.0.0 | HMR veloce |
| Testing | Vitest + Playwright | latest | E2E + Unit |

### 3.2 Backend

| Componente | Tecnologia | Versione | Note |
|------------|------------|----------|------|
| Runtime | Node.js | ^20 LTS | Performance |
| Framework | NestJS | ^10.0.0 | Enterprise patterns |
| Language | TypeScript | ^5.0.0 | Type safety |
| ORM | Prisma | ^5.0.0 | Type-safe queries |
| Validation | class-validator | latest | DTO validation |
| Documentation | Swagger/OpenAPI | latest | API docs auto |
| Authentication | Passport.js + JWT | latest | Multi-strategy |
| Authorization | CASL | latest | ABAC/RBAC |
| Rate Limiting | @nestjs/throttler | latest | DDoS protection |
| Caching | ioredis | latest | Redis client |
| Queue | BullMQ | latest | Job processing |
| Email | Nodemailer + SES | latest | Transactional |
| SMS | Twilio SDK | latest | 2FA/Alerts |

### 3.3 Database & Storage

| Componente | Tecnologia | Use Case |
|------------|------------|----------|
| Primary DB | PostgreSQL 15+ | Dati relazionali, ACID |
| Document Store | MongoDB 6+ | Logs, eventi, analytics |
| Cache | Redis 7+ Cluster | Sessioni, cache, rate limiting |
| Search | Elasticsearch 8+ | Full-text search, analytics |
| Object Storage | AWS S3 / MinIO | File, documenti, backup |
| Time Series | InfluxDB/TimescaleDB | Metriche, monitoring |

### 3.4 AI/ML Stack

| Componente | Tecnologia | Use Case |
|------------|------------|----------|
| ML Platform | MLflow + Kubeflow | MLOps, versioning |
| NLP Models | Hugging Face Transformers | BERT, RoBERTa Italiani |
| Computer Vision | PyTorch + OpenCV | Deepfake, image analysis |
| Vector DB | Pinecone/Weaviate | Semantic search |
| LLM | OpenAI API / LLaMA 2 | Chatbot, summarization |
| Training | AWS SageMaker / GCP Vertex | Model training |
| Inference | NVIDIA Triton / TorchServe | Model serving |

### 3.5 DevOps & Infrastructure

| Componente | Tecnologia | Scopo |
|------------|------------|-------|
| Cloud Provider | AWS / Azure / GCP | Multi-cloud ready |
| Container | Docker + containerd | Packaging |
| Orchestration | Kubernetes (EKS/GKE) | Scaling |
| Service Mesh | Istio | Traffic management |
| CI/CD | GitHub Actions + ArgoCD | Deployment |
| Monitoring | Prometheus + Grafana | Metrics |
| Logging | ELK Stack / Loki | Centralized logs |
| Tracing | Jaeger + OpenTelemetry | Distributed tracing |
| Secrets | HashiCorp Vault | Secret management |
| IaC | Terraform + Pulumi | Infrastructure |

---

## 4. STRUTTURA DATABASE

### 4.1 Schema Relazionale (PostgreSQL)

```sql
-- ============================================
-- CORE: UTENTI E AUTENTICAZIONE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- Soft delete per GDPR
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    language VARCHAR(5) DEFAULT 'it',
    timezone VARCHAR(50) DEFAULT 'Europe/Rome',
    privacy_consent BOOLEAN DEFAULT FALSE,
    privacy_consent_at TIMESTAMPTZ,
    marketing_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RBAC: RUOLI E PERMESSI
-- ============================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('system', 'school', 'class')),
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, role_id, school_id, class_id)
);

-- ============================================
-- ORGANIZZAZIONE: SCUOLE E CLASSI
-- ============================================

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Codice Ministeriale
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('elementary', 'middle', 'high', 'vocational')),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(2) NOT NULL,
    region VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'IT',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    geo_location GEOGRAPHY(POINT, 4326), -- PostGIS
    status VARCHAR(20) DEFAULT 'active',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE school_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('principal', 'vice_principal', 'dsa', 'psychologist', 'contact')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL,
    section VARCHAR(10),
    academic_year VARCHAR(9) NOT NULL, -- es: "2023/2024"
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name, academic_year)
);

CREATE TABLE class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    UNIQUE(class_id, student_id)
);

-- ============================================
-- SEGNALAZIONI E INCIDENTI
-- ============================================

CREATE TABLE incident_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('bullying', 'cyberbullying', 'grooming', 'deepfake', 'hate_speech', 'violence', 'other')),
    severity_level INTEGER NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    description TEXT,
    response_protocol JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(20) UNIQUE NOT NULL, -- AUTO-GENERATO: INC-2024-000001
    type_id UUID REFERENCES incident_types(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'under_investigation', 'resolved', 'closed', 'escalated')),
    severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
    
    -- Informazioni luogo e tempo
    school_id UUID REFERENCES schools(id),
    class_id UUID REFERENCES classes(id),
    location_type VARCHAR(50) CHECK (location_type IN ('classroom', 'corridor', 'cafeteria', 'playground', 'online', 'outside', 'other')),
    incident_date DATE NOT NULL,
    incident_time TIME,
    
    -- Descrizione
    description TEXT NOT NULL,
    evidence_description TEXT,
    
    -- Persone coinvolte
    reporter_id UUID REFERENCES users(id), -- Chi ha fatto la segnalazione
    reporter_is_anonymous BOOLEAN DEFAULT FALSE,
    reporter_relationship VARCHAR(50), -- student, teacher, parent, witness
    
    -- Contatori per aggregazione
    victims_count INTEGER DEFAULT 1,
    perpetrators_count INTEGER DEFAULT 1,
    witnesses_count INTEGER DEFAULT 0,
    
    -- AI Analysis
    ai_confidence_score DECIMAL(4,3), -- 0.000 - 1.000
    ai_analyzed_content JSONB,
    ai_risk_level VARCHAR(20),
    
    -- Workflow
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    resolution_type VARCHAR(50),
    
    -- GDPR
    data_retention_until TIMESTAMPTZ,
    anonymized_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE incident_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('victim', 'perpetrator', 'witness', 'bystander', 'reporter')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    pseudonym VARCHAR(50), -- Per GDPR, dati anonimizzati
    description TEXT,
    impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high', 'severe')),
    support_provided TEXT,
    parent_notified BOOLEAN DEFAULT FALSE,
    parent_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incident_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('text', 'image', 'video', 'audio', 'screenshot', 'document', 'link', 'other')),
    storage_path TEXT NOT NULL,
    original_filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    checksum VARCHAR(64), -- SHA-256 per integrità
    encryption_key_id UUID, -- Riferimento a chiave di cifratura
    
    -- AI Analysis
    ai_analysis_result JSONB,
    ai_detected_content TEXT[],
    ai_confidence DECIMAL(4,3),
    
    -- Metadati
    captured_at TIMESTAMPTZ,
    captured_by UUID REFERENCES users(id),
    device_info JSONB,
    geo_location GEOGRAPHY(POINT, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOW E TASK
-- ============================================

CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID UNIQUE REFERENCES incidents(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMUNICAZIONI
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('incident_created', 'incident_assigned', 'task_assigned', 'deadline_approaching', 'system', 'alert')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    channel VARCHAR(20)[] DEFAULT ARRAY['app'], -- app, email, sms, push
    
    -- Stato
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL, -- internal, external
    recipient_type VARCHAR(20)[] NOT NULL, -- victim, perpetrator, parent, school, authority
    
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    body_html TEXT,
    
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('app', 'email', 'sms', 'phone', 'meeting')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    
    -- Per email
    email_message_id VARCHAR(255),
    email_headers TEXT,
    
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT E COMPLIANCE
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- CREATE_INCIDENT, VIEW_REPORT, EXPORT_DATA, etc.
    entity_type VARCHAR(50) NOT NULL, -- incident, user, school, etc.
    entity_id UUID,
    
    -- Dettagli
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,
    
    -- Contesto
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gdpr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    description TEXT,
    
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    deadline_at TIMESTAMPTZ, -- 30 giorni dal GDPR
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    
    result_data JSONB,
    rejection_reason TEXT
);

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

CREATE INDEX idx_incidents_school ON incidents(school_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_date ON incidents(incident_date);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_assigned ON incidents(assigned_to);
CREATE INDEX idx_incidents_created ON incidents(created_at);

CREATE INDEX idx_incident_participants_incident ON incident_participants(incident_id);
CREATE INDEX idx_incident_participants_user ON incident_participants(user_id);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX idx_audit_user_action ON audit_logs(user_id, action, created_at);

-- ============================================
-- TRIGGER PER AUDIT AUTOMATICO
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values, changes_summary
    ) VALUES (
        current_setting('app.current_user_id')::UUID,
        TG_OP || '_' || upper(TG_TABLE_NAME),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD),
        to_jsonb(NEW),
        'Record ' || TG_OP || ' in ' || TG_TABLE_NAME
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Applicare trigger alle tabelle sensibili
CREATE TRIGGER incidents_audit
AFTER INSERT OR UPDATE OR DELETE ON incidents
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### 4.2 Schema Document (MongoDB)

```javascript
// ============================================
// COLLECTION: activity_logs
// ============================================
{
  _id: ObjectId,
  userId: UUID,
  sessionId: String,
  activity: String, // 'page_view', 'button_click', 'form_submit', etc.
  metadata: {
    page: String,
    element: String,
    action: String,
    data: Object
  },
  context: {
    ip: String,
    userAgent: String,
    device: Object, // { type, os, browser }
    geo: Object     // { country, region, city }
  },
  timestamp: ISODate,
  ttl: ISODate    // Per auto-expiration (90 giorni)
}

// ============================================
// COLLECTION: ai_analysis_results
// ============================================
{
  _id: ObjectId,
  incidentId: UUID,
  analysisType: String, // 'text_sentiment', 'image_classification', 'deepfake_detection'
  
  input: {
    contentType: String,
    contentHash: String, // SHA-256 del contenuto analizzato
    contentPreview: String // Troncato per privacy
  },
  
  results: {
    confidence: Number,      // 0.0 - 1.0
    predictions: [{
      label: String,         // 'bullying', 'grooming', 'deepfake', etc.
      score: Number,
      threshold: Number
    }],
    entities: [{             // Entità estratte (persone, luoghi)
      type: String,
      value: String,
      position: { start: Number, end: Number }
    }],
    sentiment: {
      overall: String,       // 'positive', 'negative', 'neutral'
      scores: {
        positive: Number,
        negative: Number,
        neutral: Number
      }
    },
    toxicity: {
      level: String,         // 'none', 'low', 'medium', 'high', 'severe'
      scores: {
        identity_attack: Number,
        insult: Number,
        profanity: Number,
        threat: Number
      }
    }
  },
  
  model: {
    name: String,
    version: String,
    provider: String // 'huggingface', 'openai', 'custom'
  },
  
  processingTime: Number, // millisecondi
  createdAt: ISODate
}

// ============================================
// COLLECTION: chatbot_conversations
// ============================================
{
  _id: ObjectId,
  sessionId: String,
  userId: UUID, // Nullable per anonimato
  isAnonymous: Boolean,
  
  messages: [{
    role: String,      // 'user', 'assistant', 'system'
    content: String,
    timestamp: ISODate,
    metadata: Object   // Intent rilevato, entities, etc.
  }],
  
  summary: String,     // Riassunto generato dall'AI
  detectedRisk: String, // 'none', 'low', 'medium', 'high'
  escalatedToHuman: Boolean,
  escalatedAt: ISODate,
  
  createdAt: ISODate,
  updatedAt: ISODate,
  endedAt: ISODate
}

// ============================================
// COLLECTION: analytics_aggregations
// ============================================
{
  _id: ObjectId,
  period: String,      // 'daily', 'weekly', 'monthly', 'yearly'
  date: ISODate,
  
  schoolId: UUID,      // Null per aggregati nazionali
  region: String,
  province: String,
  
  metrics: {
    incidents: {
      total: Number,
      byType: Object,    // { bullying: 10, cyberbullying: 5, ... }
      bySeverity: Object, // { 1: 5, 2: 10, ... }
      byStatus: Object   // { open: 3, resolved: 12, ... }
    },
    responseTime: {
      avgHours: Number,
      medianHours: Number,
      p95Hours: Number
    },
    users: {
      active: Number,
      new: Number
    },
    aiDetections: {
      total: Number,
      truePositives: Number,
      falsePositives: Number
    }
  },
  
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## 5. MODULI E MICROSERVIZI

### 5.1 Suddivisione Moduli

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULI APPLICATIVI                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    1. IDENTITY & ACCESS MANAGEMENT                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Auth       │ │  User Mgmt  │ │   RBAC      │ │   MFA       │   │   │
│  │  │  Service    │ │   Service   │ │  Service    │ │  Service    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    2. INCIDENT MANAGEMENT                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Reporting  │ │  Case Mgmt  │ │  Evidence   │ │  Workflow   │   │   │
│  │  │  Service    │ │   Service   │ │   Service   │ │   Engine    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    3. AI & CONTENT ANALYSIS                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Text NLP   │ │  Image AI   │ │  Deepfake   │ │  Toxicity   │   │   │
│  │  │  Service    │ │   Service   │ │  Detection  │ │  Detection  │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    4. COMMUNICATION & ENGAGEMENT                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │Notification │ │   Chatbot   │ │   Email     │ │    SMS      │   │   │
│  │  │   Service   │ │   Service   │ │   Service   │ │   Service   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    5. ANALYTICS & REPORTING                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Dashboard  │ │   Reports   │ │  KPI Engine │ │  Data Export│   │   │
│  │  │   Service   │ │   Service   │ │   Service   │ │   Service   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    6. INTEGRATION & EXTERNAL APIs                    │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   MIUR      │ │   SPID/CIE  │ │   PEC       │ │  Polizia    │   │   │
│  │  │   Sync      │ │   Auth      │ │   Gateway   │ │  Postale    │   │   │
│  │  │   Service   │ │   Service   │ │   Service   │ │   API       │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Specifiche Microservizi

#### Identity Service
```yaml
service: identity-service
port: 3001
database: PostgreSQL
redis: true
endpoints:
  - POST /auth/login
  - POST /auth/logout
  - POST /auth/refresh
  - POST /auth/mfa/verify
  - POST /auth/password/reset
  - GET /users/me
  - PUT /users/me
  - GET /users/{id}/roles
  - POST /users/{id}/roles
features:
  - JWT access + refresh tokens
  - OAuth2 integration (SPID/CIE)
  - MFA with TOTP/SMS
  - Password policy enforcement
  - Session management
  - Rate limiting
```

#### Incident Service
```yaml
service: incident-service
port: 3002
database: PostgreSQL
redis: true
kafka: true
endpoints:
  - POST /incidents
  - GET /incidents
  - GET /incidents/{id}
  - PUT /incidents/{id}
  - POST /incidents/{id}/participants
  - POST /incidents/{id}/evidence
  - POST /incidents/{id}/assign
  - POST /incidents/{id}/escalate
features:
  - CRUD segnalazioni
  - Workflow automation
  - File upload con cifratura
  - Event publishing (Kafka)
  - Full-text search
  - GDPR anonymization
```

#### AI Analysis Service
```yaml
service: ai-service
port: 3003
database: MongoDB
gpu: true
endpoints:
  - POST /analyze/text
  - POST /analyze/image
  - POST /analyze/video
  - POST /analyze/audio
  - GET /models
  - GET /models/{id}/metrics
features:
  - Text sentiment analysis (BERT-it)
  - Toxicity detection (RoBERTa)
  - Image classification (ResNet)
  - Deepfake detection (custom)
  - Model versioning (MLflow)
  - A/B testing
  - Batch processing
```

---

## 6. FLUSSI UTENTE

### 6.1 User Journey - Studente

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  LOGIN  │───▶│ DASHBOARD│───▶│ SEGNALA │───▶│  CHAT   │───▶│  FOLLOW │
│ SPID/CIE│    │ PERSONALE│    │ INCIDENT│    │ SUPPORTO│    │  UP     │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │              │
                    ▼              ▼              ▼              ▼
              ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
              │ Vedi    │    │ Anonima │    │ AI      │    │ Notifiche│
              │ storico │    │ opzione │    │ assistita │   │ stato   │
              │ proprio │    │ allega  │    │         │    │         │
              └─────────┘    │ media   │    └─────────┘    └─────────┘
                             └─────────┘
```

### 6.2 User Journey - Docente/DSA

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  LOGIN  │───▶│ DASHBOARD│───▶│ GESTISCI│───▶│ AVVIA   │───▶│ COMUNICA│
│ SPID/CIE│    │ SCUOLA  │    │ CASI    │    │ WORKFLOW│    │ FAMIGLIE│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │              │
                    ▼              ▼              ▼              ▼
              ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
              │ KPI     │    │ Assegna │    │ Task    │    │ Report  │
              │ scuola  │    │ priorità│    │ automatici│   │ progress│
              │         │    │ vedi AI │    │         │    │         │
              │         │    │ analysis│    │         │    │         │
              └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 6.3 User Journey - Dirigente Scolastico

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  LOGIN  │───▶│ DASHBOARD│───▶│ ANALISI │───▶│ GESTISCI│───▶│ REPORT  │
│ SPID/CIE│    │ ISTITUTO│    │ TREND   │    │ TEAM    │    │ ISTITUZ.│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │              │
                    ▼              ▼              ▼              ▼
              ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
              │ Confronto│   │ Heatmap │    │ Formazione│   │ Export  │
              │ regionale│   │ temporale│   │ staff    │   │ MIUR    │
              │          │   │          │   │          │   │         │
              └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 6.4 User Journey - Segnalazione Anonima

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUSSO SEGNALAZIONE ANONIMA                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│   │  Accesso │───▶│  Form    │───▶│  AI      │───▶│  Ticket  │         │
│   │  senza   │    │  segnala-│    │  pre-    │    │  anonimo │         │
│   │  login   │    │  zione   │    │  analisi │    │  creato  │         │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│        │               │               │               │                │
│        ▼               ▼               ▼               ▼                │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│   │  Captcha │    │  Dettagli│    │  Risk    │    │  Codice  │         │
│   │  verify  │    │  incident│    │  scoring │    │  tracking│         │
│   │          │    │  Opzionale│   │  Auto-   │    │  (16 chr)│         │
│   │          │    │  allegati │   │  escalate│    │          │         │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                          │              │
│                                                          ▼              │
│                                                   ┌──────────┐          │
│                                                   │  User può│          │
│                                                   │  seguire │          │
│                                                   │  con code│          │
│                                                   └──────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SISTEMA RUOLI E PERMESSI

### 7.1 Modello RBAC + ABAC

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIERARCHY ROLES                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SYSTEM LEVEL                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │   SUPER     │  │   ADMIN     │  │   AUDITOR   │                 │   │
│  │  │   ADMIN     │  │   SYSTEM    │  │   COMPLIANCE│                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                               │
│  ┌───────────────────────────┼─────────────────────────────────────────┐   │
│  │                    INSTITUTION LEVEL                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   MIUR      │  │   REGIONAL  │  │  PROVINCIAL │  │   LOCAL     │ │   │
│  │  │   OFFICER   │  │   COORD.    │  │  COORD.     │  │   ADMIN     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                               │
│  ┌───────────────────────────┼─────────────────────────────────────────┐   │
│  │                    SCHOOL LEVEL                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  PRINCIPAL  │  │   VICE      │  │    DSA      │  │  PSYCHOLOGIST│ │   │
│  │  │             │  │  PRINCIPAL  │  │  (Referente)│  │              │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   TEACHER   │  │   TEACHER   │  │   STAFF     │                  │   │
│  │  │  (Tutor)    │  │  (Regular)  │  │             │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                               │
│  ┌───────────────────────────┼─────────────────────────────────────────┐   │
│  │                    CLASS/STUDENT LEVEL                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   CLASS     │  │   STUDENT   │  │   PARENT    │  │   GUEST     │ │   │
│  │  │   REP       │  │             │  │             │  │  (Anonymous)│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Matrice Permessi

| Permesso | Super Admin | MIUR | Dirigente | DSA | Docente | Studente | Genitore |
|----------|:-----------:|:----:|:---------:|:---:|:-------:|:--------:|:--------:|
| **Gestione Utenti** ||||||||
| Creare utenti | ✅ | ✅ | ✅ | | | | |
| Modific utenti | ✅ | ✅ | ✅ | | | | |
| Elimina utenti | ✅ | ✅ | | | | | |
| Gestisci ruoli | ✅ | ✅ | | | | | |
| **Segnalazioni** ||||||||
| Crea segnalazione | | | | | ✅ | ✅ | ✅ |
| Vedi tutte scuola | ✅ | ✅ | ✅ | ✅ | ✅ | | |
| Vedi proprie classe | | | | ✅ | ✅ | ✅ | |
| Modifica segnalazione | ✅ | ✅ | ✅ | ✅ | | | |
| Assegna incaricato | | ✅ | ✅ | ✅ | | | |
| Escalation | | ✅ | ✅ | ✅ | ✅ | | |
| **Evidencce** ||||||||
| Carica allegati | | | | | ✅ | ✅ | |
| Scarica allegati | ✅ | ✅ | ✅ | ✅ | ✅ | | |
| Elimina allegati | ✅ | | | | | | |
| **Reportistica** ||||||||
| Dashboard scuola | | | ✅ | ✅ | ✅ | | |
| Dashboard regionale | | ✅ | | | | | |
| Dashboard nazionale | ✅ | ✅ | | | | | |
| Export dati | ✅ | ✅ | ✅ | | | | |
| **Amministrazione** ||||||||
| Configura scuola | ✅ | ✅ | ✅ | | | | |
| Gestisci workflow | ✅ | ✅ | | | | | |
| Vedi audit log | ✅ | ✅ | | | | | |

### 7.3 Implementazione Permessi (CASL)

```typescript
// ability.ts - Definizione permessi
import { AbilityBuilder, Ability } from '@casl/ability';
import { User, Incident, School } from './models';

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'assign' | 'escalate';
type Subjects = 'User' | 'Incident' | 'Evidence' | 'School' | 'Report' | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

export function defineAbilityFor(user: User): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability);

  // Base: ogni utente può leggere il proprio profilo
  can('read', 'User', { id: user.id });

  switch (user.role) {
    case 'super_admin':
      can('manage', 'all');
      break;

    case 'miur_officer':
      can('read', 'all');
      can('update', 'Incident');
      can('escalate', 'Incident');
      can('read', 'Report');
      can('export', 'Report');
      break;

    case 'principal':
      can('manage', 'School', { id: user.schoolId });
      can('read', 'Incident', { schoolId: user.schoolId });
      can('update', 'Incident', { schoolId: user.schoolId });
      can('assign', 'Incident', { schoolId: user.schoolId });
      can('escalate', 'Incident', { schoolId: user.schoolId });
      can('read', 'Report', { schoolId: user.schoolId });
      break;

    case 'dsa':
      can('read', 'Incident', { schoolId: user.schoolId });
      can('update', 'Incident', { schoolId: user.schoolId, assignedTo: user.id });
      can('create', 'Incident');
      can('read', 'Report', { schoolId: user.schoolId });
      break;

    case 'teacher':
      can('create', 'Incident');
      can('read', 'Incident', { 
        schoolId: user.schoolId,
        classId: { $in: user.classIds }
      });
      break;

    case 'student':
      can('create', 'Incident');
      can('read', 'Incident', { 
        reporterId: user.id,
        'participants.userId': user.id
      });
      break;

    case 'parent':
      can('create', 'Incident');
      can('read', 'Incident', { 
        'participants.userId': { $in: user.childrenIds }
      });
      break;
  }

  return build();
}
```

---

## 8. SCHEMA API

### 8.1 REST API Endpoints

#### Authentication
```yaml
# POST /api/v1/auth/login
Request:
  body:
    email: string
    password: string
    mfaCode?: string

Response 200:
  body:
    accessToken: string
    refreshToken: string
    expiresIn: number
    user:
      id: UUID
      email: string
      roles: Role[]
      permissions: string[]

# POST /api/v1/auth/refresh
Request:
  body:
    refreshToken: string

Response 200:
  body:
    accessToken: string
    expiresIn: number

# POST /api/v1/auth/logout
Headers:
  Authorization: Bearer {accessToken}

Response 204
```

#### Incidents
```yaml
# POST /api/v1/incidents
Headers:
  Authorization: Bearer {accessToken}
  
Request:
  body:
    typeId: UUID
    severity: number (1-5)
    schoolId: UUID
    classId?: UUID
    incidentDate: date
    incidentTime?: time
    description: string
    locationType?: string
    isAnonymous: boolean
    participants:
      - role: victim|perpetrator|witness
        userId?: UUID
        pseudonym?: string
        isAnonymous: boolean
    evidence?:
      - type: text|image|video|audio
        content: string (base64 o URL)
        filename?: string

Response 201:
  body:
    id: UUID
    incidentNumber: string
    status: string
    aiAnalysis:
      confidence: number
      riskLevel: string
      detectedContent: string[]
    trackingCode?: string (per anonimi)

# GET /api/v1/incidents
Headers:
  Authorization: Bearer {accessToken}
  
Query Parameters:
  status?: open|in_progress|resolved|closed
  severity?: 1|2|3|4|5
  schoolId?: UUID
  classId?: UUID
  typeId?: UUID
  assignedTo?: UUID
  dateFrom?: date
  dateTo?: date
  page?: number
  limit?: number (max 100)
  sort?: createdAt|updatedAt|severity
  order?: asc|desc

Response 200:
  body:
    data: Incident[]
    pagination:
      page: number
      limit: number
      total: number
      totalPages: number

# GET /api/v1/incidents/{id}
Headers:
  Authorization: Bearer {accessToken}

Response 200:
  body:
    id: UUID
    incidentNumber: string
    type: IncidentType
    status: string
    severity: number
    school: School
    class?: Class
    description: string
    participants: Participant[]
    evidence: Evidence[]
    aiAnalysis: AIAnalysis
    workflow: Workflow
    tasks: Task[]
    communications: Communication[]
    createdAt: datetime
    updatedAt: datetime

# PUT /api/v1/incidents/{id}
Headers:
  Authorization: Bearer {accessToken}
  
Request:
  body:
    status?: string
    severity?: number
    description?: string
    assignedTo?: UUID
    resolutionNotes?: string

Response 200:
  body: Incident

# POST /api/v1/incidents/{id}/assign
Headers:
  Authorization: Bearer {accessToken}
  
Request:
  body:
    userId: UUID
    notes?: string

Response 200:
  body:
    assignedTo: User
    assignedAt: datetime

# POST /api/v1/incidents/{id}/escalate
Headers:
  Authorization: Bearer {accessToken}
  
Request:
  body:
    reason: string
    escalateTo: school|region|miur|police
    priority?: low|medium|high|urgent

Response 200:
  body:
    escalatedTo: string
    escalatedAt: datetime
    newAssignee?: User
```

#### Analytics
```yaml
# GET /api/v1/analytics/dashboard
Headers:
  Authorization: Bearer {accessToken}
  
Query Parameters:
  schoolId?: UUID
  region?: string
  dateFrom?: date
  dateTo?: date

Response 200:
  body:
    summary:
      totalIncidents: number
      openIncidents: number
      resolvedThisMonth: number
      avgResolutionTime: number
    byType:
      - type: string
        count: number
        percentage: number
    bySeverity:
      - severity: number
        count: number
    trend:
      - date: string
        count: number
    topSchools:
      - schoolId: UUID
        schoolName: string
        incidentCount: number
    heatmapData: GeoJSON

# GET /api/v1/analytics/reports
Headers:
  Authorization: Bearer {accessToken}
  
Query Parameters:
  type: school|region|national
  format: pdf|excel|csv
  period: monthly|quarterly|yearly
  date: date

Response 200:
  headers:
    Content-Type: application/pdf|application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|text/csv
    Content-Disposition: attachment; filename="report.pdf"
  body: <file content>
```

### 8.2 GraphQL Schema (opzionale)

```graphql
type Query {
  me: User
  user(id: UUID!): User
  users(
    schoolId: UUID
    role: Role
    page: Int
    limit: Int
  ): UserConnection
  
  incident(id: UUID!): Incident
  incidents(
    filter: IncidentFilter
    sort: IncidentSort
    page: Int
    limit: Int
  ): IncidentConnection
  
  dashboard(
    schoolId: UUID
    dateRange: DateRange
  ): Dashboard
  
  analytics(
    metric: MetricType!
    granularity: Granularity!
    dateRange: DateRange!
    filters: AnalyticsFilter
  ): AnalyticsResult
}

type Mutation {
  createIncident(input: CreateIncidentInput!): Incident
  updateIncident(id: UUID!, input: UpdateIncidentInput!): Incident
  assignIncident(id: UUID!, userId: UUID!): Incident
  escalateIncident(id: UUID!, input: EscalateInput!): Incident
  
  createUser(input: CreateUserInput!): User
  updateUser(id: UUID!, input: UpdateUserInput!): User
  deleteUser(id: UUID!): Boolean
  
  sendNotification(input: NotificationInput!): Notification
}

type Subscription {
  incidentCreated(schoolId: UUID): Incident
  incidentUpdated(id: UUID): Incident
  notificationReceived: Notification
}
```

### 8.3 Webhook Events

```yaml
# Configurazione webhook per integrazioni esterne

webhooks:
  events:
    - incident.created
    - incident.updated
    - incident.assigned
    - incident.escalated
    - incident.resolved
    - user.created
    - user.deleted
    - gdpr.request.received

  payload:
    event: string
    timestamp: ISO8601
    data: object
    signature: HMAC-SHA256

  retry:
    maxAttempts: 5
    backoff: exponential
    initialDelay: 1s
```

---

## 9. ARCHITETTURA AI

### 9.1 Pipeline AI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI PROCESSING PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT                    PROCESSING                    OUTPUT               │
│                                                                              │
│  ┌──────────┐           ┌──────────────┐           ┌──────────────┐        │
│  │  Text    │──────────▶│  Pre-process │──────────▶│  BERT-it     │        │
│  │  Input   │           │  - Tokenize  │           │  Classifier  │        │
│  └──────────┘           │  - Normalize │           └──────┬───────┘        │
│                         └──────────────┘                  │                │
│                                                           ▼                │
│                                                  ┌──────────────┐          │
│                                                  │  Intent      │          │
│                                                  │  Detection   │          │
│                                                  └──────┬───────┘          │
│                                                         │                  │
│  ┌──────────┐           ┌──────────────┐               │                   │
│  │  Image   │──────────▶│  Pre-process │──────────▶────┤                   │
│  │  Input   │           │  - Resize    │               │                   │
│  └──────────┘           │  - Normalize │               ▼                   │
│                         └──────────────┘      ┌──────────────┐             │
│                                               │  ResNet50    │             │
│                                               │  Classifier  │             │
│                                               └──────┬───────┘             │
│                                                      │                      │
│  ┌──────────┐           ┌──────────────┐            │                      │
│  │  Video   │──────────▶│  Frame       │───────────▶┤                      │
│  │  Input   │           │  Extraction  │            │                      │
│  └──────────┘           └──────────────┘            ▼                      │
│                                            ┌──────────────┐                │
│                                            │  Deepfake    │                │
│                                            │  Detection   │                │
│                                            │  (FaceForensic)│              │
│                                            └──────┬───────┘                │
│                                                   │                        │
│                                                   ▼                        │
│                                          ┌──────────────┐                  │
│                                          │  Ensemble    │                  │
│                                          │  Aggregator  │                  │
│                                          └──────┬───────┘                  │
│                                                 │                          │
│                                                 ▼                          │
│                                          ┌──────────────┐                  │
│                                          │  Risk Score  │                  │
│                                          │  Calculator  │                  │
│                                          └──────┬───────┘                  │
│                                                 │                          │
│                                                 ▼                          │
│                                          ┌──────────────┐                  │
│                                          │  Decision    │                  │
│                                          │  Engine      │                  │
│                                          │  (Auto-      │                  │
│                                          │  escalate)   │                  │
│                                          └──────────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Modelli AI Specifici

#### Text Classification (BERT-it)
```yaml
model: dbmdz/bert-base-italian-xxl-cased
fine_tuned: true
task: multi-label classification
labels:
  - bullying
  - cyberbullying
  - grooming
  - hate_speech
  - violence
  - self_harm
  - threat
  - normal
performance:
  f1_macro: 0.92
  precision: 0.94
  recall: 0.90
inference:
  latency_p95: 150ms
  batch_size: 32
```

#### Toxicity Detection (RoBERTa)
```yaml
model: unitn-sml/italian-hate-speech-identification
fine_tuned: true
task: toxicity scoring
attributes:
  - identity_attack
  - insult
  - profanity
  - threat
  - severe_toxicity
output: score 0-1 per attributo
thresholds:
  low: 0.3
  medium: 0.5
  high: 0.7
  severe: 0.9
```

#### Deepfake Detection
```yaml
model: FaceForensics++ (custom)
architecture: XceptionNet + LSTM
task: video deepfake detection
input:
  - face extraction (MTCNN)
  - frame sequence (16 frames)
output:
  confidence: 0-1
  manipulation_type: face_swap|face_reenactment|lip_sync
performance:
  auc: 0.98
  accuracy: 0.95
```

### 9.3 MLflow Tracking

```python
# Esempio tracking esperimento
import mlflow

with mlflow.start_run(run_name="bert-bullying-v2"):
    # Parametri
    mlflow.log_params({
        "model": "bert-base-italian",
        "epochs": 5,
        "batch_size": 32,
        "learning_rate": 2e-5
    })
    
    # Metriche
    mlflow.log_metrics({
        "f1_macro": 0.92,
        "precision": 0.94,
        "recall": 0.90,
        "auc": 0.96
    })
    
    # Artefatti
    mlflow.log_artifact("confusion_matrix.png")
    mlflow.log_artifact("model.onnx")
    
    # Modello
    mlflow.pytorch.log_model(model, "model")
```

---

## 10. SICUREZZA E GDPR

### 10.1 Misure di Sicurezza

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: NETWORK                                                           │
│  ├── WAF (CloudFlare/AWS WAF)                                              │
│  ├── DDoS Protection                                                       │
│  ├── DLP (Data Loss Prevention)                                            │
│  └── VPC Isolation                                                         │
│                                                                              │
│  LAYER 2: APPLICATION                                                       │
│  ├── Input Validation (Zod/class-validator)                                │
│  ├── SQL Injection Prevention (ORM parametrized)                           │
│  ├── XSS Protection (CSP Headers)                                          │
│  ├── CSRF Tokens                                                           │
│  └── Rate Limiting                                                         │
│                                                                              │
│  LAYER 3: AUTHENTICATION                                                    │
│  ├── SPID/CIE Integration (eIDAS compliant)                                │
│  ├── MFA (TOTP/SMS)                                                        │
│  ├── JWT with short expiry                                                 │
│  ├── Session Management                                                    │
│  └── Password Policy (NIST guidelines)                                     │
│                                                                              │
│  LAYER 4: AUTHORIZATION                                                     │
│  ├── RBAC + ABAC (CASL)                                                    │
│  ├── Resource-level permissions                                            │
│  ├── Field-level masking                                                   │
│  └── Audit logging                                                         │
│                                                                              │
│  LAYER 5: DATA                                                              │
│  ├── Encryption at rest (AES-256)                                          │
│  ├── Encryption in transit (TLS 1.3)                                       │
│  ├── Field-level encryption (PII)                                          │
│  ├── Database TDE                                                          │
│  └── Key rotation (AWS KMS)                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 GDPR Compliance

| Requisito | Implementazione |
|-----------|-----------------|
| **Consenso** | Form consenso informato all'onboarding |
| **Diritto accesso** | Endpoint `/gdpr/export` - esportazione dati |
| **Diritto rettifica** | Endpoint `/gdpr/rectify` - modifica dati |
| **Diritto cancellazione** | Soft delete + anonymization dopo retention |
| **Diritto portabilità** | Export in formato JSON standard |
| **Diritto opposizione** | Opt-out marketing, processing limit |
| **Breach notification** | Alert automatico entro 72h |
| **DPO contact** | dpo@sicurezzascuola.gov.it |

### 10.3 Data Retention Policy

| Tipo Dato | Retention | Azione Post-Retention |
|-----------|-----------|----------------------|
| Incidenti attivi | 7 anni | Archiviazione cifrata |
| Incidenti chiusi | 5 anni | Anonymization |
| Log di accesso | 2 anni | Cancellazione |
| Chatbot conversations | 1 anno | Anonymization |
| Analytics aggregati | 10 anni | Nessuna (già anonimi) |
| Dati utente cancellato | 30 giorni | Hard delete |

### 10.4 Anonimization Strategy

```typescript
// Esempio anonimizzazione
async function anonymizeIncident(incidentId: string) {
  const pseudonymMap = new Map();
  
  // Genera pseudonimi consistenti
  const getPseudonym = (userId: string) => {
    if (!pseudonymMap.has(userId)) {
      pseudonymMap.set(userId, `STUDENT_${generateCode(6)}`);
    }
    return pseudonymMap.get(userId);
  };
  
  await db.$transaction(async (tx) => {
    // Anonimizza partecipanti
    await tx.incidentParticipant.updateMany({
      where: { incidentId },
      data: {
        userId: null,
        pseudonym: (p) => getPseudonym(p.userId),
        isAnonymous: true
      }
    });
    
    // Anonimzza reporter
    await tx.incident.update({
      where: { id: incidentId },
      data: {
        reporterId: null,
        description: anonymizeText(incident.description),
        anonymizedAt: new Date()
      }
    });
    
    // Cancella evidence con PII
    await tx.incidentEvidence.deleteMany({
      where: { 
        incidentId,
        evidenceType: { in: ['image', 'video', 'audio'] }
      }
    });
  });
}
```

---

## 11. DEPLOYMENT E DEVOPS

### 11.1 Infrastructure as Code

```hcl
# Terraform - EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "sicurezza-scuola-prod"
  cluster_version = "1.28"

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["m6i.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
    
    gpu = {
      desired_size = 1
      min_size     = 0
      max_size     = 3

      instance_types = ["g4dn.xlarge"]
      capacity_type  = "SPOT"
      
      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: |
          npm run test:unit
          npm run test:integration
          
      - name: Security scan
        run: |
          npm audit --audit-level=high
          npx snyk test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: |
          docker build -t $ECR_REGISTRY/api:$GITHUB_SHA ./apps/api
          docker build -t $ECR_REGISTRY/web:$GITHUB_SHA ./apps/web
          
      - name: Push to ECR
        run: |
          docker push $ECR_REGISTRY/api:$GITHUB_SHA
          docker push $ECR_REGISTRY/web:$GITHUB_SHA

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure kubectl
        run: |
          aws eks update-kubeconfig --region eu-south-1 --name sicurezza-scuola-prod
          
      - name: Deploy with Helm
        run: |
          helm upgrade --install api ./helm/api \
            --set image.tag=$GITHUB_SHA \
            --set replicas=3 \
            --namespace production
            
      - name: Run smoke tests
        run: |
          kubectl run smoke-test --image=curlimages/curl \
            --rm -i --restart=Never -- \
            https://api.sicurezzascuola.gov.it/health

  notify:
    needs: deploy
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
```

### 11.3 Monitoring Stack

```yaml
# Prometheus + Grafana
prometheus:
  retention: 30d
  scrape_interval: 15s
  
  rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        
    - alert: SlowResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
      for: 5m
      labels:
        severity: warning

grafana:
  dashboards:
    - api-performance
    - database-metrics
    - ai-model-metrics
    - business-kpis
    - security-events
```

---

## 12. STIMI COSTI INFRASTRUTTURA

### 12.1 Costi Mensili Stimati (AWS)

| Componente | Configurazione | Costo/mese |
|------------|----------------|------------|
| **EKS Cluster** | 3x m6i.xlarge | € 450 |
| **GPU Nodes** | 1x g4dn.xlarge (spot) | € 150 |
| **RDS PostgreSQL** | db.r6g.xlarge Multi-AZ | € 500 |
| **DocumentDB** | 3x db.r5.large | € 350 |
| **ElastiCache Redis** | cache.r6g.large cluster | € 180 |
| **OpenSearch** | 3x m6g.large | € 300 |
| **S3 Storage** | 5TB standard | € 115 |
| **CloudFront CDN** | 10TB transfer | € 800 |
| **Application Load Balancer** | 2 ALB | € 40 |
| **Secrets Manager** | 100 secrets | € 40 |
| **KMS** | 1000 requests/milione | € 10 |
| **CloudWatch** | Logs + Metrics | € 200 |
| **AI/ML (SageMaker)** | Training + Inference | € 500 |
| **Backup** | AWS Backup | € 100 |
| **Totale** | | **~ € 3.735/mese** |

### 12.2 Costi per Utente

| Scenario | Utenti | Costo/utente/mese |
|----------|--------|-------------------|
| Piccola scuola | 500 | € 7,47 |
| Media scuola | 1.500 | € 2,49 |
| Grande scuola | 3.000 | € 1,25 |
| Intero sistema (10.000 scuole) | 8M | € 0,47 |

---

## 13. ROADMAP IMPLEMENTAZIONE

### Fase 1: MVP (Mesi 1-4)
- [ ] Setup infrastruttura base
- [ ] Identity service + SPID
- [ ] Incident reporting base
- [ ] Dashboard scuola
- [ ] Notifiche email/SMS

### Fase 2: Core (Mesi 5-8)
- [ ] AI text classification
- [ ] Workflow automation
- [ ] Mobile app
- [ ] Analytics base
- [ ] Integrazione PEC

### Fase 3: Advanced (Mesi 9-12)
- [ ] AI image/video analysis
- [ ] Deepfake detection
- [ ] Chatbot AI
- [ ] Dashboard regionali/nazionali
- [ ] API per istituzioni

### Fase 4: Scale (Mesi 13-18)
- [ ] Ottimizzazione performance
- [ ] Multi-region deployment
- [ ] Advanced analytics
- [ ] ML model improvements
- [ ] Integrazioni terze parti

---

## 14. CONCLUSIONI

Questa architettura fornisce una base solida per una piattaforma nazionale di sicurezza digitale scolastica che sia:

- **Scalabile**: Architettura cloud-native con auto-scaling
- **Sicura**: Multi-layer security + GDPR compliance
- **Intelligente**: AI/ML integrato per rilevamento automatico
- **Flessibile**: Microservizi per evoluzione indipendente
- **Affidabile**: 99.99% uptime target con disaster recovery

Per qualsiasi chiarimento o approfondimento tecnico, contattare l'architetto di riferimento.

---

**Documento redatto da:** AI Architect  
**Versione:** 1.0  
**Ultimo aggiornamento:** 2024
