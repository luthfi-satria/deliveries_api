import { Injectable } from '@nestjs/common';
import { SettingsDocument } from 'src/database/entities/settings.entity';
import { SettingService } from 'src/setting/setting.service';
import { settingSeedsData } from './setting-seed.data';

@Injectable()
export class SettingSeederService {
  constructor(private readonly settingService: SettingService) {}
  create(): Promise<SettingsDocument[]> {
    return this.settingService.updateSetting(settingSeedsData);
  }
}
