import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchoolPanelService, AlertFilters } from './school-panel.service';
import { RiskLevel, RiskCategory } from '../message-analysis/entities/analyzed-message.entity';

class ReviewAlertDto {
  reviewedBy: string;
  notes?: string;
}

// Mock Auth Guard
class JwtAuthGuard {
  canActivate() { return true; }
}

class RolesGuard {
  constructor(private roles: string[]) {}
  canActivate() { return true; }
}

@Controller('api/v1/school-panel')
@UseGuards(JwtAuthGuard)
export class SchoolPanelController {
  constructor(private readonly schoolPanelService: SchoolPanelService) {}

  /**
   * Recupera alert per la scuola
   * GET /api/v1/school-panel/alerts
   */
  @Get('alerts')
  async getAlerts(
    @Query('schoolId') schoolId: string,
    @Query('riskLevel') riskLevel?: RiskLevel | RiskLevel[],
    @Query('category') category?: RiskCategory | RiskCategory[],
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('reviewed') reviewed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: AlertFilters = {
      schoolId,
      riskLevel: riskLevel ? (Array.isArray(riskLevel) ? riskLevel : [riskLevel]) : undefined,
      category: category ? (Array.isArray(category) ? category : [category]) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      reviewed: reviewed !== undefined ? reviewed === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };

    return this.schoolPanelService.getAlerts(filters);
  }

  /**
   * Recupera dettaglio alert
   * GET /api/v1/school-panel/alerts/:id
   */
  @Get('alerts/:id')
  async getAlertDetail(
    @Param('id') alertId: string,
    @Query('schoolId') schoolId: string,
  ) {
    return this.schoolPanelService.getAlertDetail(alertId, schoolId);
  }

  /**
   * Segna alert come rivisto
   * POST /api/v1/school-panel/alerts/:id/review
   */
  @Post('alerts/:id/review')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reviewAlert(
    @Param('id') alertId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: ReviewAlertDto,
  ) {
    await this.schoolPanelService.reviewAlert(alertId, schoolId, dto.reviewedBy, dto.notes);
  }

  /**
   * Recupera statistiche dashboard
   * GET /api/v1/school-panel/dashboard/:schoolId
   */
  @Get('dashboard/:schoolId')
  async getDashboardStats(@Param('schoolId') schoolId: string) {
    return this.schoolPanelService.getDashboardStats(schoolId);
  }

  /**
   * Recupera alert critici non rivisti
   * GET /api/v1/school-panel/critical/:schoolId
   */
  @Get('critical/:schoolId')
  async getCriticalAlerts(@Param('schoolId') schoolId: string) {
    return this.schoolPanelService.getAlerts({
      schoolId,
      riskLevel: [RiskLevel.HIGH, RiskLevel.CRITICAL],
      reviewed: false,
      limit: 10,
    });
  }
}
