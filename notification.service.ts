import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

import { RiskLevel, RiskCategory } from '../message-analysis/entities/analyzed-message.entity';

interface NotifyParentJob {
  messageId: string;
  userId: string;
  schoolId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  categories: {
    category: RiskCategory;
    score: number;
    keywords: string[];
  }[];
}

interface NotifySchoolJob {
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

@Injectable()
@Processor('notifications')
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly emailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {
    // Configura transporter email
    this.emailTransporter = nodemailer.createTransporter({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  /**
   * Processa job di notifica genitore
   */
  @Process('notify-parent')
  async handleParentNotification(job: Job<NotifyParentJob>): Promise<void> {
    const { messageId, userId, schoolId, riskLevel, riskScore, categories } = job.data;

    this.logger.log(`Invio notifica genitore per messaggio ${messageId}`);

    try {
      // Recupera informazioni genitore e studente
      const parentEmail = await this.getParentEmail(userId);
      const studentName = await this.getStudentName(userId);
      const schoolName = await this.getSchoolName(schoolId);

      if (!parentEmail) {
        this.logger.warn(`Nessun genitore trovato per utente ${userId}`);
        return;
      }

      // Invia email
      await this.sendParentEmail({
        parentEmail,
        studentName,
        schoolName,
        riskLevel,
        riskScore,
        categories,
        messageId,
      });

      // Invia SMS se configurato
      const parentPhone = await this.getParentPhone(userId);
      if (parentPhone) {
        await this.sendParentSMS({
          phone: parentPhone,
          studentName,
          riskLevel,
        });
      }

      this.logger.log(`Notifica genitore inviata con successo per ${messageId}`);

    } catch (error) {
      this.logger.error(`Errore invio notifica genitore: ${error.message}`);
      throw error; // Rilancia per retry
    }
  }

  /**
   * Invia email al genitore
   */
  private async sendParentEmail(data: {
    parentEmail: string;
    studentName: string;
    schoolName: string;
    riskLevel: RiskLevel;
    riskScore: number;
    categories: { category: RiskCategory; score: number; keywords: string[] }[];
    messageId: string;
  }): Promise<void> {
    const { parentEmail, studentName, schoolName, riskLevel, riskScore, categories, messageId } = data;

    const categoryLabels: Record<RiskCategory, string> = {
      [RiskCategory.OFFENSIVE_LANGUAGE]: 'Linguaggio offensivo',
      [RiskCategory.BULLYING]: 'Bullismo',
      [RiskCategory.THREATS]: 'Minacce',
      [RiskCategory.SELF_HARM]: 'Autolesionismo',
      [RiskCategory.GROOMING]: 'Adescamento online',
      [RiskCategory.HATE_SPEECH]: 'Linguaggio di odio',
      [RiskCategory.NORMAL]: 'Normale',
    };

    const riskLevelLabels: Record<RiskLevel, string> = {
      [RiskLevel.LOW]: 'Basso',
      [RiskLevel.MEDIUM]: 'Medio',
      [RiskLevel.HIGH]: 'Alto',
      [RiskLevel.CRITICAL]: 'Critico',
    };

    const detectedCategories = categories
      .filter(c => c.category !== RiskCategory.NORMAL)
      .map(c => categoryLabels[c.category] || c.category)
      .join(', ');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
    .content { background: #f8f9fa; padding: 20px; margin: 20px 0; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Allerta Sicurezza Digitale</h1>
    </div>
    
    <div class="content">
      <p>Gentile Genitore,</p>
      
      <p>Il sistema di monitoraggio della scuola <strong>${schoolName}</strong> ha rilevato un'attività sospetta relativa a <strong>${studentName}</strong>.</p>
      
      <div class="alert">
        <h3>📊 Dettaglio Rilevamento</h3>
        <ul>
          <li><strong>Livello di rischio:</strong> ${riskLevelLabels[riskLevel]}</li>
          <li><strong>Score:</strong> ${riskScore}/100</li>
          <li><strong>Categorie rilevate:</strong> ${detectedCategories}</li>
        </ul>
      </div>
      
      <p>Il sistema ha identificato potenziali contenuti problematici nelle comunicazioni digitali di ${studentName}.</p>
      
      <h3>🎯 Cosa fare:</h3>
      <ol>
        <li>Parla con ${studentName} in modo calmo e comprensivo</li>
        <li>Verifica il benessere emotivo del tuo figlio/a</li>
        <li>Contatta la scuola se necessario</li>
        <li>Monitora l'utilizzo dei dispositivi digitali</li>
      </ol>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${this.configService.get('PORTAL_URL')}/parent/alerts/${messageId}" class="button">
          Visualizza Dettagli
        </a>
      </p>
      
      <p><strong>Nota:</strong> Questa notifica è generata automaticamente dal sistema di sicurezza della scuola. Per privacy, il contenuto originale non è incluso in questa email.</p>
    </div>
    
    <div class="footer">
      <p>SafeChat AI - Sistema di Protezione Digitale Scolastica</p>
      <p>Per assistenza: supporto@sicurezzascuola.gov.it</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.emailTransporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'SafeChat AI <alerts@sicurezzascuola.gov.it>',
      to: parentEmail,
      subject: `⚠️ Allerta Sicurezza - ${schoolName}`,
      html: htmlContent,
    });
  }

  /**
   * Invia SMS al genitore
   */
  private async sendParentSMS(data: {
    phone: string;
    studentName: string;
    riskLevel: RiskLevel;
  }): Promise<void> {
    // Integrazione con servizio SMS (Twilio, etc.)
    this.logger.log(`SMS inviato a ${data.phone}`);
    // Implementazione con Twilio
  }

  // Mock methods - da implementare con repository reali
  private async getParentEmail(userId: string): Promise<string | null> {
    // Recupera email genitore dal database
    return 'genitore@esempio.com';
  }

  private async getParentPhone(userId: string): Promise<string | null> {
    // Recupera telefono genitore
    return null;
  }

  private async getStudentName(userId: string): Promise<string> {
    // Recupera nome studente
    return 'Mario Rossi';
  }

  private async getSchoolName(schoolId: string): Promise<string> {
    // Recupera nome scuola
    return 'Istituto Comprensivo Roma';
  }
}
