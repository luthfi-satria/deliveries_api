import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CallbacksModule } from './callbacks/callbacks.module';
import { CommonModule } from './common/common.module';
import { CouriersModule } from './couriers/couriers.module';
import { CronElogModule } from './cron/cron-elog.module';
import { DatabaseService } from './database/database.service';
import { SeederModule } from './database/seeders/seeder.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { InternalModule } from './internal/internal.module';
import { SettingModule } from './setting/setting.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    CouriersModule,
    HttpModule,
    CommonModule,
    InternalModule,
    AuthModule,
    CallbacksModule,
    DeliveriesModule,
    SettingModule,
    SeederModule,
    CronElogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
