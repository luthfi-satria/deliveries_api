import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { AuthInternalService } from './auth-internal.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [TypeOrmModule.forFeature([]), HttpModule],
  controllers: [InternalController],
  providers: [InternalService, AuthInternalService, CommonService],
  exports: [AuthInternalService],
})
export class InternalModule {}
