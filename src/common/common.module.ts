import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonStorageService } from './storage/storage.service';
import { NotificationService } from './notification/notification.service';
import { FetchCourierService } from './courier/courier.service';
import { HttpModule } from '@nestjs/axios';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    HttpModule,
  ],
  providers: [
    CommonStorageService,
    CommonService,
    NotificationService,
    FetchCourierService,
    ResponseService,
    MessageService,
  ],
  exports: [CommonStorageService, NotificationService, FetchCourierService],
})
export class CommonModule {}
