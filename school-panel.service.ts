import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';

import { AnalyzedMessage, RiskLevel, RiskCategory } from '../message-analysis/entities/analyzed-message.entity';

interface SchoolAlertJob {
  messageId: string;
  schoolId: string;
  classId?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  categories: {
    category: RiskCategory;
    score: number;
    keywords: string[];
  }[];
  userHash: string;
}

export interface SchoolAlert {
  id: string;
  messageHash: string;
  riskScore: number;
  riskLevel: RiskLevel;
  categories: {
    category: RiskCategory;
    score: number;
    keywords: string[];
  }[];
  userHash: string;
  createdAt: Date;
  reviewed: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface AlertFilters {
  schoolId: string;
  riskLevel?: RiskLevel[];
  category?: RiskCategory[];
  startDate?: Date;
  endDate?: Date;
  reviewed?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
@Processor('school-alerts')
export class SchoolPanelService {
  private readonly logger = new Logger(SchoolPanelService.name);

  constructor(
    @InjectRepository(AnalyzedMessage)
    private analyzedMessageRepo: Repository<AnalyzedMessage>,
    @InjectQueue('school-alerts') private alertQueue: Queue,
  ) {}

  /**
   * Processa job di alert scuola
   */
  @Process('school-alert')
  async handleSchoolAlert(job: Job<SchoolAlertJob>): Promise<void> {
    const { messageId, schoolId, classId, riskLevel, riskScore, categories, userHash } = job.data;

    this.logger.log(`Processo alert scuola per messaggio ${messageId}`);

    try {
      // Notifica DSA/referente scuola in tempo reale (WebSocket/Push)
      await this.notifySchoolStaff({
        messageId,
        schoolId,
        classId,
        riskLevel,
        riskScore,
        categories,
        userHash,
      });

      // Crea ticket nel sistema di ticketing se critico
      if (riskLevel === RiskLevel.CRITICAL) {
        await this.createUrgentTicket({
          messageId,
          schoolId,
          classId,
          riskScore,
          categories,
        });
      }

    } catch (error) {
      this.logger.error(`Errore processo alert scuola: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recupera alert per il pannello scuola
   */
  async getAlerts(filters: AlertFilters): Promise<{
    alerts: SchoolAlert[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { schoolId, riskLevel, category, startDate, endDate, reviewed, page = 1, limit = 20 } = filters;

    const query = this.analyzedMessageRepo.createQueryBuilder('msg')
      .where('msg.schoolId = :schoolId', { schoolId });

    // Filtro per livello rischio
    if (riskLevel && riskLevel.length > 0) {
      query.andWhere('msg.riskLevel IN (:...riskLevel)', { riskLevel });
    }

    // Filtro per data
    if (startDate && endDate) {
      query.andWhere('msg.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    // Filtro per stato revisione
    if (reviewed !== undefined) {
      query.andWhere('msg.reviewed = :reviewed', { reviewed });
    }

    // Ordina per rischio e data
    query.orderBy('msg.riskScore', 'DESC')
      .addOrderBy('msg.createdAt', 'DESC');

    // Paginazione
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [messages, total] = await query.getManyAndCount();

    const alerts: SchoolAlert[] = messages.map(msg => ({
      id: msg.id,
      messageHash: msg.messageHash,
      riskScore: msg.riskScore,
      riskLevel: msg.riskLevel,
      categories: msg.categories.map(c => ({
        category: c.category,
        score: c.score,
        keywords: c.keywordsDetected,
      })),
      userHash: msg.userHash,
      createdAt: msg.createdAt,
      reviewed: msg.reviewed,
      reviewedBy: msg.reviewedBy,
      reviewNotes: msg.reviewNotes,
    }));

    return {
      alerts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Recupera dettaglio singolo alert
   */
  async getAlertDetail(alertId: string, schoolId: string): Promise<SchoolAlert | null> {
    const message = await this.analyzedMessageRepo.findOne({
      where: { id: alertId, schoolId },
    });

    if (!message) return null;

    return {
      id: message.id,
      messageHash: message.messageHash,
      riskScore: message.riskScore,
      riskLevel: message.riskLevel,
      categories: message.categories.map(c => ({
        category: c.category,
        score: c.score,
        keywords: c.keywordsDetected,
      })),
      userHash: message.userHash,
      createdAt: message.createdAt,
      reviewed: message.reviewed,
      reviewedBy: message.reviewedBy,
      reviewNotes: message.reviewNotes,
    };
  }

  /**
   * Segna un alert come rivisto
   */
  async reviewAlert(
    alertId: string,
    schoolId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    await this.analyzedMessageRepo.update(
      { id: alertId, schoolId },
      {
        reviewed: true,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes,
      }
    );

    this.logger.log(`Alert ${alertId} rivisto da ${reviewedBy}`);
  }

  /**
   * Recupera statistiche per dashboard scuola
   */
  async getDashboardStats(schoolId: string): Promise<{
    today: {
      total: number;
      high: number;
      critical: number;
      blocked: number;
    };
    thisWeek: {
      total: number;
      byDay: { date: string; count: number }[];
    };
    byCategory: Record<string, number>;
    trend: 'up' | 'down' | 'stable';
    pendingReview: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Statistiche oggi
    const todayStats = await this.analyzedMessageRepo
      .createQueryBuilder('msg')
      .where('msg.schoolId = :schoolId', { schoolId })
      .andWhere('msg.createdAt >= :today', { today })
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN msg.riskLevel = :high THEN 1 ELSE 0 END) as high',
        'SUM(CASE WHEN msg.riskLevel = :critical THEN 1 ELSE 0 END) as critical',
        'SUM(CASE WHEN msg.isBlocked = true THEN 1 ELSE 0 END) as blocked',
      ])
      .setParameters({ high: RiskLevel.HIGH, critical: RiskLevel.CRITICAL })
      .getRawOne();

    // Statistiche settimana
    const weekMessages = await this.analyzedMessageRepo.find({
      where: {
        schoolId,
        createdAt: Between(weekAgo, new Date()),
      },
      select: ['createdAt', 'riskLevel', 'categories'],
    });

    // Raggruppa per giorno
    const byDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = weekMessages.filter(m => 
        m.createdAt.toISOString().startsWith(dateStr)
      ).length;
      byDay.push({ date: dateStr, count });
    }

    // Conta per categoria
    const byCategory: Record<string, number> = {};
    for (const msg of weekMessages) {
      for (const cat of msg.categories) {
        if (cat.category !== RiskCategory.NORMAL) {
          byCategory[cat.category] = (byCategory[cat.category] || 0) + 1;
        }
      }
    }

    // Calcola trend
    const thisWeekCount = weekMessages.length;
    const prevWeekStart = new Date(weekAgo);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    
    const prevWeekMessages = await this.analyzedMessageRepo.count({
      where: {
        schoolId,
        createdAt: Between(prevWeekStart, weekAgo),
      },
    });

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (thisWeekCount > prevWeekMessages * 1.2) trend = 'up';
    else if (thisWeekCount < prevWeekMessages * 0.8) trend = 'down';

    // Alert da rivedere
    const pendingReview = await this.analyzedMessageRepo.count({
      where: {
        schoolId,
        reviewed: false,
        riskLevel: RiskLevel.HIGH,
      },
    });

    return {
      today: {
        total: parseInt(todayStats.total) || 0,
        high: parseInt(todayStats.high) || 0,
        critical: parseInt(todayStats.critical) || 0,
        blocked: parseInt(todayStats.blocked) || 0,
      },
      thisWeek: {
        total: weekMessages.length,
        byDay,
      },
      byCategory,
      trend,
      pendingReview,
    };
  }

  /**
   * Notifica staff scuola in tempo reale
   */
  private async notifySchoolStaff(data: {
    messageId: string;
    schoolId: string;
    classId?: string;
    riskLevel: RiskLevel;
    riskScore: number;
    categories: { category: RiskCategory; score: number; keywords: string[] }[];
    userHash: string;
  }): Promise<void> {
    // Implementazione WebSocket/Push notification
    this.logger.log(`Notifica staff scuola ${data.schoolId} per alert ${data.messageId}`);
    
    // TODO: Integrazione con WebSocket gateway per notifiche real-time
    // this.webSocketGateway.emitToSchool(data.schoolId, 'new-alert', data);
  }

  /**
   * Crea ticket urgente
   */
  private async createUrgentTicket(data: {
    messageId: string;
    schoolId: string;
    classId?: string;
    riskScore: number;
    categories: { category: RiskCategory; score: number; keywords: string[] }[];
  }): Promise<void> {
    this.logger.log(`Creazione ticket urgente per messaggio ${data.messageId}`);
    
    // TODO: Integrazione con sistema di ticketing
  }
}
