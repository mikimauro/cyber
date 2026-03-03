import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';

import { MessageAnalysisModule } from './message-analysis/message-analysis.module';
import { NotificationModule } from './notification/notification.module';
import { SchoolPanelModule } from './school-panel/school-panel.module';
import { EncryptionModule } from './encryption/encryption.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 richieste per minuto
      },
    ]),
    
    // Database PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'safechat',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'safechat_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    
    // Redis per queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    
    // Moduli applicativi
    EncryptionModule,
    MessageAnalysisModule,
    NotificationModule,
    SchoolPanelModule,
    StatisticsModule,
  ],
})
export class AppModule {}
