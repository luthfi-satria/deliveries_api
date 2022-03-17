import { Module } from '@nestjs/common';
import { SettingModule } from 'src/setting/setting.module';
import { SettingSeederService } from './setting-seed.service';

@Module({
  imports: [SettingModule],
  providers: [SettingSeederService],
  exports: [SettingSeederService],
})
export class SettingSeederModule {}
