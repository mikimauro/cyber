import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Headers,
  Ip,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessageAnalysisService, AnalyzeMessageDto, AnalysisResponse } from './message-analysis.service';
import { RiskLevel } from './entities/analyzed-message.entity';

// DTOs
class AnalyzeMessageRequest {
  message: string;
  userId?: string;
  schoolId?: string;
  classId?: string;
  contextType?: string;
}

class ConfirmMessageRequest {
  messageId: string;
  userId: string;
}

class ToggleMonitoringRequest {
  schoolId: string;
  classId?: string;
  isActive: boolean;
  updatedBy: string;
}

// Mock Auth Guard (da implementare con JWT)
class JwtAuthGuard {
  canActivate() { return true; }
}

@Controller('api/v1/messages')
export class MessageAnalysisController {
  constructor(private readonly messageAnalysisService: MessageAnalysisService) {}

  /**
   * Analizza un messaggio in tempo reale
   * POST /api/v1/messages/analyze
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @Throttle(60, 60) // 60 richieste al minuto
  async analyzeMessage(
    @Body() dto: AnalyzeMessageRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AnalysisResponse> {
    return this.messageAnalysisService.analyzeMessage({
      ...dto,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Conferma invio messaggio nonostante avviso
   * POST /api/v1/messages/confirm
   */
  @Post('confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmMessageSend(
    @Body() dto: ConfirmMessageRequest,
  ): Promise<void> {
    await this.messageAnalysisService.confirmMessageSend(dto.messageId, dto.userId);
  }

  /**
   * Toggle monitoraggio
   * POST /api/v1/messages/monitoring/toggle
   */
  @Post('monitoring/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleMonitoring(
    @Body() dto: ToggleMonitoringRequest,
  ) {
    return this.messageAnalysisService.toggleMonitoring(
      dto.schoolId,
      dto.classId || null,
      dto.isActive,
      dto.updatedBy,
    );
  }

  /**
   * Recupera statistiche scuola
   * GET /api/v1/messages/stats/:schoolId
   */
  @Get('stats/:schoolId')
  @UseGuards(JwtAuthGuard)
  async getSchoolStats(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.messageAnalysisService.getSchoolStats(schoolId, start, end);
  }

  /**
   * Health check
   * GET /api/v1/messages/health
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'message-analysis' };
  }
}
