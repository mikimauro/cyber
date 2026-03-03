import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum MonitoringScope {
  SCHOOL = 'school',
  CLASS = 'class',
  USER = 'user',
}

@Entity('monitoring_settings')
@Index(['schoolId'])
@Unique(['scopeType', 'schoolId', 'classId'])
export class MonitoringSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Scope: school, class, o user
  @Column({ name: 'scope_type', type: 'enum', enum: MonitoringScope })
  scopeType: MonitoringScope;

  // ID scuola
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  // ID classe (null se scope è school)
  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string | null;

  // ID utente (null se scope è school o class)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  // Se il monitoraggio è attivo
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Se mostrare popup di avviso allo studente
  @Column({ name: 'show_warning_popup', type: 'boolean', default: true })
  showWarningPopup: boolean;

  // Se bloccare automaticamente messaggi critici
  @Column({ name: 'auto_block_critical', type: 'boolean', default: true })
  autoBlockCritical: boolean;

  // Se notificare i genitori
  @Column({ name: 'notify_parents', type: 'boolean', default: true })
  notifyParents: boolean;

  // Se notificare la scuola
  @Column({ name: 'notify_school', type: 'boolean', default: true })
  notifySchool: boolean;

  // Livello minimo per notificare genitori
  @Column({ name: 'parent_notification_level', type: 'varchar', length: 20, default: 'high' })
  parentNotificationLevel: string;

  // Livello minimo per notificare scuola
  @Column({ name: 'school_notification_level', type: 'varchar', length: 20, default: 'medium' })
  schoolNotificationLevel: string;

  // Canali di notifica (JSON array)
  @Column({ name: 'notification_channels', type: 'jsonb', default: ['email'] })
  notificationChannels: string[];

  // Categorie da monitorare (JSON array)
  @Column({ 
    name: 'monitored_categories', 
    type: 'jsonb', 
    default: ['offensive_language', 'bullying', 'threats', 'self_harm', 'grooming', 'hate_speech']
  })
  monitoredCategories: string[];

  // Score threshold personalizzato (0-100)
  @Column({ name: 'custom_threshold', type: 'smallint', nullable: true })
  customThreshold: number | null;

  // Orari di monitoraggio (JSON)
  @Column({ 
    name: 'monitoring_schedule', 
    type: 'jsonb', 
    default: { 
      enabled: true, 
      startTime: '00:00', 
      endTime: '23:59',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6] 
    }
  })
  monitoringSchedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };

  // Messaggio personalizzato per popup
  @Column({ 
    name: 'custom_warning_message', 
    type: 'text', 
    nullable: true 
  })
  customWarningMessage: string | null;

  // Chi ha creato/modificato
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
