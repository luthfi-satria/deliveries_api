import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'deliveries_elog_regionals' })
export class elogDocuments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  regional_name: string;

  @Column()
  status: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<elogDocuments>) {
    Object.assign(this, init);
  }
}
