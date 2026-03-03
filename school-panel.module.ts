import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { SchoolPanelService } from './school-panel.service';
import { SchoolPanelController } from './school-panel.controller';
import { AnalyzedMessage } from '../message-analysis/entities/analyzed-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyzedMessage]),
    BullModule.registerQueue({
      name: 'school-alerts',
    }),
  ],
  controllers: [SchoolPanelController],
  providers: [SchoolPanelService],
  exports: [SchoolPanelService],
})
export class SchoolPanelModule {}
