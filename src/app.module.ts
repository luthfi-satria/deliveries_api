import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { CouriersModule } from './couriers/couriers.module';
import { CommonModule } from './common/common.module';
import { InternalModule } from './internal/internal.module';
import { AuthModule } from './auth/auth.module';
import { CallbacksModule } from './callbacks/callbacks.module';
import { HttpModule } from '@nestjs/axios';
import { DeliveriesModule } from './deliveries/deliveries.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    CouriersModule,
    HttpModule,
    CommonModule,
    InternalModule,
    AuthModule,
    CallbacksModule,
    DeliveriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
