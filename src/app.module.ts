import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { CouriersModule } from './couriers/couriers.module';
import { MessageModule } from './message/message.module';
import { ResponseModule } from './response/response.module';
import { CommonModule } from './common/common.module';
import { InternalModule } from './internal/internal.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    MessageModule,
    ResponseModule,
    CouriersModule,
    HttpModule,
    CommonModule,
    InternalModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
