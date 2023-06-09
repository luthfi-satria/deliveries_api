import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { StorageService as NestStorageService } from '@codebrew/nestjs-storage';
import { AmazonWebServicesS3Storage } from '@slynova/flydrive-s3';
import fs from 'fs';
import { createUrl } from '../../utils/general-utils';

@Injectable()
export class CommonStorageService {
  constructor(private readonly storage: NestStorageService) {}

  async store(fileName: string): Promise<string> {
    if (process.env.STORAGE_DRIVER === 'local') {
      return createUrl(fileName);
    }

    const file = fileName.replace(/^\//, '');

    if (process.env.STORAGE_DRIVER === 's3') {
      try {
        this.storage.registerDriver('s3', AmazonWebServicesS3Storage);
        await this.storage
          .getDisk('s3')
          .put(file, fs.readFileSync(`./${file}`));

        return this.storage.getDisk('s3').getUrl(file);
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }
  }
}
