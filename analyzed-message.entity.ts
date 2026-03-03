import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskCategory {
  OFFENSIVE_LANGUAGE = 'offensive_language',
  BULLYING = 'bullying',
  THREATS = 'threats',
  SELF_HARM = 'self_harm',
  GROOMING = 'grooming',
  HATE_SPEECH = 'hate_speech',
  NORMAL = 'normal',
}

@Entity('analyzed_messages')
@Index(['messageHash'])
@Index(['riskLevel'])
@Index(['schoolId'])
@Index(['createdAt'])
export class AnalyzedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Hash del messaggio originale (anonimizzato)
  @Column({ name: 'message_hash', type: 'varchar', length: 64 })
  messageHash: string;

  // Contenuto crittografato (opzionale, per audit)
  @Column({ name: 'encrypted_content', type: 'text', nullable: true })
  encryptedContent: string | null;

  // Score rischio 0-100
  @Column({ name: 'risk_score', type: 'smallint' })
  riskScore: number;

  // Livello rischio
  @Column({ name: 'risk_level', type: 'enum', enum: RiskLevel })
  riskLevel: RiskLevel;

  // Categorie rilevate (JSON)
  @Column({ name: 'categories', type: 'jsonb' })
  categories: {
    category: RiskCategory;
    score: number;
    confidence: number;
    keywordsDetected: string[];
  }[];

  // Se il messaggio è stato bloccato
  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  // Se l'utente ha confermato l'invio nonostante l'avviso
  @Column({ name: 'user_confirmed', type: 'boolean', default: false })
  userConfirmed: boolean;

  // ID utente (hashed per privacy)
  @Column({ name: 'user_hash', type: 'varchar', length: 64, nullable: true })
  userHash: string | null;

  // ID scuola
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  // ID classe
  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string | null;

  // Tipo di azione: 'chat', 'forum', 'comment', 'post'
  @Column({ name: 'context_type', type: 'varchar', length: 50, default: 'chat' })
  contextType: string;

  // Se le notifiche sono state inviate
  @Column({ name: 'parent_notified', type: 'boolean', default: false })
  parentNotified: boolean;

  @Column({ name: 'school_notified', type: 'boolean', default: false })
  schoolNotified: boolean;

  // Timestamp notifiche
  @Column({ name: 'parent_notified_at', type: 'timestamptz', nullable: true })
  parentNotifiedAt: Date | null;

  @Column({ name: 'school_notified_at', type: 'timestamptz', nullable: true })
  schoolNotifiedAt: Date | null;

  // Se il caso è stato rivisto da un umano
  @Column({ name: 'reviewed', type: 'boolean', default: false })
  reviewed: boolean;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  // Metadati
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    processingTimeMs?: number;
    modelVersion?: string;
  } | null;

  // Timestamp
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Data retention - quando cancellare
  @Column({ name: 'retention_until', type: 'timestamptz', nullable: true })
  retentionUntil: Date | null;
}
