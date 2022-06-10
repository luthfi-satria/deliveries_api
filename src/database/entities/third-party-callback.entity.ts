import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'deliveries_third_party_callbacks' })
export class ThirdPartyCallbacksDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  third_party_request_id: string;

  @Column({ type: 'json' })
  callback: object;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true, select: false })
  deleted_at: Date;
}
