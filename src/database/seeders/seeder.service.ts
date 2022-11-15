import { Injectable, Logger } from '@nestjs/common';
import { ElogCourierSeederService } from './couriers/elog-courier-seed.service';
import { SettingSeederService } from './setting/setting-seed.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly logger: Logger,
    private readonly settingSeederService: SettingSeederService,
    private readonly elogCourierSeederService: ElogCourierSeederService,
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
    await this.elogCouriers()
      .then((completed) => {
        this.logger.debug('Successively completed seeding elog couriers...');
        Promise.resolve(completed);
      })
      .catch((error) => {
        this.logger.error('Failed seeding elog couriers...');
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

  private async elogCouriers() {
    return this.elogCourierSeederService
      .create()
      .then(() => {
        return Promise.resolve(true);
      })
      .catch((error) => Promise.reject(error));
  }
}
