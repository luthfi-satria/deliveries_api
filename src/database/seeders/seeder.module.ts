import { Logger, Module } from '@nestjs/common';
import { SeederService } from 'src/database/seeders/seeder.service';
import { SettingSeederModule } from './setting/setting-seed.module';

@Module({
  imports: [SettingSeederModule],
  providers: [Logger, SeederService],
})
export class SeederModule {}
