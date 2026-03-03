import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { AnalyzedMessage, RiskLevel, RiskCategory } from './entities/analyzed-message.entity';
import { MonitoringSettings, MonitoringScope } from './entities/monitoring-settings.entity';
import { EncryptionService } from '../encryption/encryption.service';

export interface AnalyzeMessageDto {
  message: string;
  userId?: string;
  schoolId?: string;
  classId?: string;
  contextType?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AIAnalysisResult {
  message_hash: string;
  overall_risk_score: number;
  risk_level: RiskLevel;
  is_blocked: boolean;
  categories: {
    category: RiskCategory;
    score: number;
    confidence: number;
    keywords_detected: string[];
    explanation?: string;
  }[];
  processing_time_ms: number;
  model_version: string;
  timestamp: string;
}

export interface AnalysisResponse {
  id: string;
  messageHash: string;
  riskScore: number;
  riskLevel: RiskLevel;
  isBlocked: boolean;
  showWarning: boolean;
  warningMessage: string;
  categories: {
    category: RiskCategory;
    score: number;
    keywords: string[];
  }[];
}

@Injectable()
export class MessageAnalysisService {
  private readonly logger = new Logger(MessageAnalysisService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(AnalyzedMessage)
    private analyzedMessageRepo: Repository<AnalyzedMessage>,
    @InjectRepository(MonitoringSettings)
    private monitoringSettingsRepo: Repository<MonitoringSettings>,
    private encryptionService: EncryptionService,
    private httpService: HttpService,
    private configService: ConfigService,
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('school-alerts') private schoolAlertQueue: Queue,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  /**
   * Analizza un messaggio in tempo reale
   */
  async analyzeMessage(dto: AnalyzeMessageDto): Promise<AnalysisResponse> {
    const startTime = Date.now();

    try {
      // 1. Verifica se il monitoraggio è attivo per questa scuola/classe
      const monitoringSettings = await this.getMonitoringSettings(dto.schoolId, dto.classId);
      
      if (!monitoringSettings || !monitoringSettings.isActive) {
        this.logger.debug(`Monitoraggio disattivato per school=${dto.schoolId}, class=${dto.classId}`);
        return {
          id: null,
          messageHash: this.encryptionService.hash(dto.message),
          riskScore: 0,
          riskLevel: RiskLevel.LOW,
          isBlocked: false,
          showWarning: false,
          warningMessage: null,
          categories: [],
        };
      }

      // 2. Chiama il servizio AI per l'analisi
      const aiResult = await this.callAIService(dto);

      // 3. Cifra il contenuto per storage (opzionale, per audit)
      const encryptedContent = monitoringSettings.isActive 
        ? this.encryptionService.encrypt(dto.message)
        : null;

      // 4. Crea hash anonimi
      const messageHash = this.encryptionService.hash(dto.message);
      const userHash = dto.userId ? this.encryptionService.hash(dto.userId) : null;

      // 5. Salva nel database
      const analyzedMessage = this.analyzedMessageRepo.create({
        messageHash,
        encryptedContent,
        riskScore: aiResult.overall_risk_score,
        riskLevel: aiResult.risk_level,
        categories: aiResult.categories,
        isBlocked: aiResult.is_blocked,
        userHash,
        schoolId: dto.schoolId,
        classId: dto.classId,
        contextType: dto.contextType || 'chat',
        metadata: {
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          processingTimeMs: Date.now() - startTime,
          modelVersion: aiResult.model_version,
        },
        retentionUntil: this.calculateRetentionDate(aiResult.risk_level),
      });

      const saved = await this.analyzedMessageRepo.save(analyzedMessage);

      // 6. Gestisci notifiche se necessario
      await this.handleNotifications(saved, monitoringSettings, dto);

      // 7. Prepara risposta
      const showWarning = this.shouldShowWarning(aiResult, monitoringSettings);
      
      return {
        id: saved.id,
        messageHash,
        riskScore: aiResult.overall_risk_score,
        riskLevel: aiResult.risk_level,
        isBlocked: aiResult.is_blocked && monitoringSettings.autoBlockCritical,
        showWarning,
        warningMessage: monitoringSettings.customWarningMessage || this.getDefaultWarningMessage(aiResult),
        categories: aiResult.categories.map(c => ({
          category: c.category,
          score: c.score,
          keywords: c.keywords_detected,
        })),
      };

    } catch (error) {
      this.logger.error('Errore analisi messaggio:', error);
      
      // Fallback: permetti l'invio in caso di errore del servizio AI
      return {
        id: null,
        messageHash: this.encryptionService.hash(dto.message),
        riskScore: 0,
        riskLevel: RiskLevel.LOW,
        isBlocked: false,
        showWarning: false,
        warningMessage: null,
        categories: [],
      };
    }
  }

  /**
   * Conferma l'invio di un messaggio nonostante l'avviso
   */
  async confirmMessageSend(messageId: string, userId: string): Promise<void> {
    await this.analyzedMessageRepo.update(messageId, {
      userConfirmed: true,
      updatedAt: new Date(),
    });

    this.logger.log(`Utente ${userId} ha confermato invio messaggio ${messageId}`);
  }

  /**
   * Chiama il microservizio AI
   */
  private async callAIService(dto: AnalyzeMessageDto): Promise<AIAnalysisResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/analyze`, {
          message: dto.message,
          user_id: dto.userId,
          school_id: dto.schoolId,
          context: dto.contextType,
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Errore chiamata servizio AI:', error.message);
      throw new HttpException(
        'Servizio AI non disponibile',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Recupera le impostazioni di monitoraggio
   */
  private async getMonitoringSettings(
    schoolId?: string,
    classId?: string
  ): Promise<MonitoringSettings | null> {
    if (!schoolId) return null;

    // Cerca prima impostazioni specifiche per classe
    if (classId) {
      const classSettings = await this.monitoringSettingsRepo.findOne({
        where: {
          scopeType: MonitoringScope.CLASS,
          schoolId,
          classId,
        },
      });
      if (classSettings) return classSettings;
    }

    // Altrimenti usa impostazioni scuola
    return this.monitoringSettingsRepo.findOne({
      where: {
        scopeType: MonitoringScope.SCHOOL,
        schoolId,
      },
    });
  }

  /**
   * Determina se mostrare il popup di avviso
   */
  private shouldShowWarning(
    aiResult: AIAnalysisResult,
    settings: MonitoringSettings
  ): boolean {
    if (!settings.showWarningPopup) return false;
    
    // Mostra warning per medium, high e critical
    return aiResult.overall_risk_score >= 26;
  }

  /**
   * Gestisce le notifiche in base al livello di rischio
   */
  private async handleNotifications(
    message: AnalyzedMessage,
    settings: MonitoringSettings,
    dto: AnalyzeMessageDto
  ): Promise<void> {
    const riskLevel = message.riskLevel;

    // Notifica genitori se il livello è sufficiente
    if (settings.notifyParents && this.shouldNotifyParent(riskLevel, settings)) {
      await this.notificationQueue.add('notify-parent', {
        messageId: message.id,
        userId: dto.userId,
        schoolId: dto.schoolId,
        riskLevel,
        riskScore: message.riskScore,
        categories: message.categories,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      await this.analyzedMessageRepo.update(message.id, {
        parentNotified: true,
        parentNotifiedAt: new Date(),
      });
    }

    // Notifica scuola se il livello è sufficiente
    if (settings.notifySchool && this.shouldNotifySchool(riskLevel, settings)) {
      await this.schoolAlertQueue.add('school-alert', {
        messageId: message.id,
        schoolId: dto.schoolId,
        classId: dto.classId,
        riskLevel,
        riskScore: message.riskScore,
        categories: message.categories,
        userHash: message.userHash,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      });

      await this.analyzedMessageRepo.update(message.id, {
        schoolNotified: true,
        schoolNotifiedAt: new Date(),
      });
    }
  }

  /**
   * Determina se notificare i genitori
   */
  private shouldNotifyParent(riskLevel: RiskLevel, settings: MonitoringSettings): boolean {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    const current = levels[riskLevel];
    const threshold = levels[settings.parentNotificationLevel as keyof typeof levels] || 3;
    return current >= threshold;
  }

  /**
   * Determina se notificare la scuola
   */
  private shouldNotifySchool(riskLevel: RiskLevel, settings: MonitoringSettings): boolean {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    const current = levels[riskLevel];
    const threshold = levels[settings.schoolNotificationLevel as keyof typeof levels] || 2;
    return current >= threshold;
  }

  /**
   * Calcola la data di retention in base al rischio
   */
  private calculateRetentionDate(riskLevel: RiskLevel): Date {
    const now = new Date();
    const retentionDays = {
      [RiskLevel.LOW]: 30,
      [RiskLevel.MEDIUM]: 90,
      [RiskLevel.HIGH]: 365,
      [RiskLevel.CRITICAL]: 2555, // 7 anni
    };
    
    return new Date(now.setDate(now.getDate() + retentionDays[riskLevel]));
  }

  /**
   * Messaggio di avviso predefinito
   */
  private getDefaultWarningMessage(aiResult: AIAnalysisResult): string {
    const categoryNames: Record<RiskCategory, string> = {
      [RiskCategory.OFFENSIVE_LANGUAGE]: 'linguaggio offensivo',
      [RiskCategory.BULLYING]: 'comportamento di bullismo',
      [RiskCategory.THREATS]: 'minacce',
      [RiskCategory.SELF_HARM]: 'contenuti relativi ad autolesionismo',
      [RiskCategory.GROOMING]: 'possibile adescamento',
      [RiskCategory.HATE_SPEECH]: 'linguaggio di odio',
      [RiskCategory.NORMAL]: 'contenuto normale',
    };

    const detectedCategories = aiResult.categories
      .filter(c => c.category !== RiskCategory.NORMAL)
      .map(c => categoryNames[c.category] || c.category);

    if (detectedCategories.length === 0) {
      return 'Questo messaggio potrebbe essere inappropriato. Sei sicuro di volerlo inviare?';
    }

    return `Questo messaggio potrebbe contenere ${detectedCategories.join(', ')}. Sei sicuro di volerlo inviare?`;
  }

  /**
   * Toggle monitoraggio per scuola/classe
   */
  async toggleMonitoring(
    schoolId: string,
    classId: string | null,
    isActive: boolean,
    updatedBy: string
  ): Promise<MonitoringSettings> {
    const scopeType = classId ? MonitoringScope.CLASS : MonitoringScope.SCHOOL;
    
    let settings = await this.monitoringSettingsRepo.findOne({
      where: { scopeType, schoolId, classId },
    });

    if (settings) {
      settings.isActive = isActive;
      settings.updatedBy = updatedBy;
      settings.updatedAt = new Date();
    } else {
      settings = this.monitoringSettingsRepo.create({
        scopeType,
        schoolId,
        classId,
        isActive,
        createdBy: updatedBy,
      });
    }

    return this.monitoringSettingsRepo.save(settings);
  }

  /**
   * Recupera statistiche per scuola
   */
  async getSchoolStats(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMessages: number;
    byRiskLevel: Record<RiskLevel, number>;
    byCategory: Record<string, number>;
    blockedCount: number;
    parentNotifiedCount: number;
  }> {
    const query = this.analyzedMessageRepo.createQueryBuilder('msg')
      .where('msg.schoolId = :schoolId', { schoolId })
      .andWhere('msg.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    const results = await query.getMany();

    const stats = {
      totalMessages: results.length,
      byRiskLevel: {
        [RiskLevel.LOW]: 0,
        [RiskLevel.MEDIUM]: 0,
        [RiskLevel.HIGH]: 0,
        [RiskLevel.CRITICAL]: 0,
      },
      byCategory: {},
      blockedCount: 0,
      parentNotifiedCount: 0,
    };

    for (const msg of results) {
      stats.byRiskLevel[msg.riskLevel]++;
      if (msg.isBlocked) stats.blockedCount++;
      if (msg.parentNotified) stats.parentNotifiedCount++;

      for (const cat of msg.categories) {
        stats.byCategory[cat.category] = (stats.byCategory[cat.category] || 0) + 1;
      }
    }

    return stats;
  }
}
