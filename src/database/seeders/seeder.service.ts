import { Injectable, Logger } from '@nestjs/common';
import { SettingSeederService } from './setting/setting-seed.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly logger: Logger,
    private readonly settingSeederService: SettingSeederService,
  ) {}

  onApplicationBootstrap() {
    this.seed();
  }

  async seed() {
    await this.setting()
      .then((completed) => {
        this.logger.debug('Successively completed seeding Settings...');
        Promise.resolve(completed);
      })
      .catch((error) => {
        this.logger.error('Failed seeding Settings...');
        Promise.reject(error);
      });
  }

  private async setting() {
    return this.settingSeederService
      .create()
      .then(() => {
        return Promise.resolve(true);
      })
      .catch((error) => Promise.reject(error));
  }
}
