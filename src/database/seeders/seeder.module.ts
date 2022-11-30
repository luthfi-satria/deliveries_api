import { Logger, Module } from '@nestjs/common';
import { SeederService } from 'src/database/seeders/seeder.service';
import { CourierSeederModule } from './couriers/elog-courier-seed.module';
import { SettingSeederModule } from './setting/setting-seed.module';

@Module({
  imports: [SettingSeederModule, CourierSeederModule],
  providers: [Logger, SeederService],
})
export class SeederModule {}
