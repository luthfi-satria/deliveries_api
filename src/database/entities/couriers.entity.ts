import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CourierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity({ name: 'deliveries_couriers' })
@Index(['code', 'name', 'service_name', 'status'])
@Index(['code', 'name', 'status'])
@Index(['name', 'status'])
export class CourierDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  name: string;

  @Index()
  @Column()
  code: string;

  @Index()
  @Column()
  service_name: string;

  @Column()
  service_code: string;

  @Column()
  tier: string;

  @Column()
  description: string;

  @Column()
  service_type: string;

  @Column()
  shipping_type: string;

  @Column()
  duration_range: string;

  @Column()
  duration_unit: string;

  @Index()
  @Column({
    type: 'enum',
    enum: CourierStatus,
    default: CourierStatus.INACTIVE,
  })
  status: string;

  @Column({ default: 0, nullable: true })
  sequence: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
