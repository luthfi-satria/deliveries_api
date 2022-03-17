import { EntityRepository, In, Repository } from 'typeorm';
import { SettingsDocument } from '../entities/settings.entity';

@EntityRepository(SettingsDocument)
export class SettingsRepository extends Repository<SettingsDocument> {
  async findSettingsByNames(names: string[]): Promise<SettingsDocument[]> {
    const settings = await this.find({
      where: { name: In(names) },
    });
    return settings;
  }

  async findAllSettings(): Promise<SettingsDocument[]> {
    const settings = await this.find();
    return settings;
  }
}
