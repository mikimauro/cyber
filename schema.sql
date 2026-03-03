-- ==========================================
-- SafeChat AI - Database Schema
-- PostgreSQL 14+
-- ==========================================

-- Estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUM TYPES
-- ==========================================

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_category AS ENUM (
    'offensive_language', 
    'bullying', 
    'threats', 
    'self_harm', 
    'grooming', 
    'hate_speech', 
    'normal'
);
CREATE TYPE monitoring_scope AS ENUM ('school', 'class', 'user');

-- ==========================================
-- TABELLA: analyzed_messages
-- Memorizza i messaggi analizzati con logging crittografato
-- ==========================================

CREATE TABLE analyzed_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Hash del messaggio (anonimizzato)
    message_hash VARCHAR(64) NOT NULL,
    
    -- Contenuto crittografato (opzionale, per audit)
    encrypted_content TEXT,
    
    -- Score rischio 0-100
    risk_score SMALLINT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Livello rischio
    risk_level risk_level NOT NULL,
    
    -- Categorie rilevate (JSONB)
    categories JSONB NOT NULL DEFAULT '[]',
    
    -- Se il messaggio è stato bloccato
    is_blocked BOOLEAN DEFAULT FALSE,
    
    -- Se l'utente ha confermato l'invio
    user_confirmed BOOLEAN DEFAULT FALSE,
    
    -- ID utente hashato (anonimizzato)
    user_hash VARCHAR(64),
    
    -- ID scuola e classe
    school_id UUID,
    class_id UUID,
    
    -- Tipo di contesto
    context_type VARCHAR(50) DEFAULT 'chat',
    
    -- Stato notifiche
    parent_notified BOOLEAN DEFAULT FALSE,
    school_notified BOOLEAN DEFAULT FALSE,
    parent_notified_at TIMESTAMPTZ,
    school_notified_at TIMESTAMPTZ,
    
    -- Revisione
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Metadati (IP, user agent, etc.)
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Data retention (per GDPR)
    retention_until TIMESTAMPTZ
);

-- Indici per analyzed_messages
CREATE INDEX idx_analyzed_messages_hash ON analyzed_messages(message_hash);
CREATE INDEX idx_analyzed_messages_risk_level ON analyzed_messages(risk_level);
CREATE INDEX idx_analyzed_messages_school ON analyzed_messages(school_id);
CREATE INDEX idx_analyzed_messages_created ON analyzed_messages(created_at);
CREATE INDEX idx_analyzed_messages_retention ON analyzed_messages(retention_until) 
    WHERE retention_until < NOW();

-- Indice per ricerca JSONB sulle categorie
CREATE INDEX idx_analyzed_messages_categories ON analyzed_messages USING GIN (categories);

-- ==========================================
-- TABELLA: monitoring_settings
-- Configurazione monitoraggio per scuola/classe
-- ==========================================

CREATE TABLE monitoring_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Scope: school, class, user
    scope_type monitoring_scope NOT NULL,
    
    -- ID scuola (obbligatorio)
    school_id UUID NOT NULL,
    
    -- ID classe (opzionale, se scope è class)
    class_id UUID,
    
    -- ID utente (opzionale, se scope è user)
    user_id UUID,
    
    -- Se il monitoraggio è attivo
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Se mostrare popup di avviso
    show_warning_popup BOOLEAN DEFAULT TRUE,
    
    -- Se bloccare automaticamente messaggi critici
    auto_block_critical BOOLEAN DEFAULT TRUE,
    
    -- Notifiche
    notify_parents BOOLEAN DEFAULT TRUE,
    notify_school BOOLEAN DEFAULT TRUE,
    parent_notification_level VARCHAR(20) DEFAULT 'high',
    school_notification_level VARCHAR(20) DEFAULT 'medium',
    
    -- Canali di notifica (JSON array)
    notification_channels JSONB DEFAULT '["email"]',
    
    -- Categorie da monitorare
    monitored_categories JSONB DEFAULT '["offensive_language", "bullying", "threats", "self_harm", "grooming", "hate_speech"]',
    
    -- Threshold personalizzato
    custom_threshold SMALLINT CHECK (custom_threshold >= 0 AND custom_threshold <= 100),
    
    -- Orari di monitoraggio
    monitoring_schedule JSONB DEFAULT '{
        "enabled": true,
        "startTime": "00:00",
        "endTime": "23:59",
        "daysOfWeek": [0, 1, 2, 3, 4, 5, 6]
    }',
    
    -- Messaggio personalizzato per popup
    custom_warning_message TEXT,
    
    -- Audit
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint unique per scope
    UNIQUE(scope_type, school_id, class_id, user_id)
);

-- Indici per monitoring_settings
CREATE INDEX idx_monitoring_settings_school ON monitoring_settings(school_id);
CREATE INDEX idx_monitoring_settings_active ON monitoring_settings(is_active) WHERE is_active = TRUE;

-- ==========================================
-- TABELLA: notification_logs
-- Log delle notifiche inviate
-- ==========================================

CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Riferimento al messaggio
    message_id UUID REFERENCES analyzed_messages(id) ON DELETE CASCADE,
    
    -- Tipo di notifica
    notification_type VARCHAR(50) NOT NULL, -- 'parent_email', 'parent_sms', 'school_dashboard'
    
    -- Destinatario (hashato)
    recipient_hash VARCHAR(64),
    
    -- Canale utilizzato
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    
    -- Stato
    status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed'
    
    -- Dettagli errore (se fallito)
    error_message TEXT,
    
    -- Timestamp
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per notification_logs
CREATE INDEX idx_notification_logs_message ON notification_logs(message_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at);

-- ==========================================
-- TABELLA: audit_logs
-- Log di audit per compliance
-- ==========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Utente che ha eseguito l'azione (hashato)
    user_hash VARCHAR(64),
    
    -- Tipo di azione
    action VARCHAR(100) NOT NULL, -- 'MESSAGE_ANALYZED', 'MESSAGE_BLOCKED', 'SETTINGS_CHANGED', etc.
    
    -- Entità coinvolta
    entity_type VARCHAR(50) NOT NULL, -- 'message', 'settings', 'user'
    entity_id UUID,
    
    -- Dettagli
    details JSONB,
    
    -- Contesto
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per audit_logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_hash);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ==========================================
-- TABELLA: model_performance
-- Tracking performance modelli AI
-- ==========================================

CREATE TABLE model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Modello
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    
    -- Metriche
    total_requests INTEGER DEFAULT 0,
    avg_latency_ms FLOAT,
    error_rate FLOAT,
    
    -- Accuratezza (se disponibile da feedback)
    true_positives INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    true_negatives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    
    -- Periodo
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per model_performance
CREATE INDEX idx_model_performance_model ON model_performance(model_name, model_version);
CREATE INDEX idx_model_performance_period ON model_performance(period_start, period_end);

-- ==========================================
-- VISTE
-- ==========================================

-- Vista per alert da rivedere
CREATE VIEW pending_review_alerts AS
SELECT 
    id,
    message_hash,
    risk_score,
    risk_level,
    categories,
    school_id,
    class_id,
    user_hash,
    created_at
FROM analyzed_messages
WHERE reviewed = FALSE 
    AND risk_level IN ('high', 'critical')
ORDER BY risk_score DESC, created_at DESC;

-- Vista per statistiche giornaliere
CREATE VIEW daily_stats AS
SELECT 
    DATE(created_at) as date,
    school_id,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE risk_level = 'low') as low_count,
    COUNT(*) FILTER (WHERE risk_level = 'medium') as medium_count,
    COUNT(*) FILTER (WHERE risk_level = 'high') as high_count,
    COUNT(*) FILTER (WHERE risk_level = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE is_blocked = TRUE) as blocked_count,
    COUNT(*) FILTER (WHERE parent_notified = TRUE) as parent_notifications,
    AVG(risk_score) as avg_risk_score
FROM analyzed_messages
GROUP BY DATE(created_at), school_id;

-- ==========================================
-- FUNZIONI
-- ==========================================

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per analyzed_messages
CREATE TRIGGER update_analyzed_messages_updated_at
    BEFORE UPDATE ON analyzed_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per monitoring_settings
CREATE TRIGGER update_monitoring_settings_updated_at
    BEFORE UPDATE ON monitoring_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Funzione per pulizia dati scaduti (GDPR)
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Cancella messaggi scaduti
    DELETE FROM analyzed_messages 
    WHERE retention_until < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- DATI INIZIALI
-- ==========================================

-- Inserisci impostazioni di default per test
INSERT INTO monitoring_settings (
    scope_type,
    school_id,
    is_active,
    show_warning_popup,
    auto_block_critical,
    notify_parents,
    notify_school,
    created_by
) VALUES (
    'school',
    '00000000-0000-0000-0000-000000000001',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ==========================================
-- PERMESSI
-- ==========================================

-- Crea ruolo per l'applicazione (opzionale)
-- CREATE ROLE safechat_app WITH LOGIN PASSWORD 'secure_password';
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO safechat_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO safechat_app;
