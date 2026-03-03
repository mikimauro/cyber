import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

import { MessageAnalysisService } from './message-analysis.service';
import { MessageAnalysisController } from './message-analysis.controller';
import { AnalyzedMessage } from './entities/analyzed-message.entity';
import { MonitoringSettings } from './entities/monitoring-settings.entity';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyzedMessage, MonitoringSettings]),
    HttpModule,
    EncryptionModule,
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'school-alerts' },
    ),
  ],
  controllers: [MessageAnalysisController],
  providers: [MessageAnalysisService],
  exports: [MessageAnalysisService],
})
export class MessageAnalysisModule {}
