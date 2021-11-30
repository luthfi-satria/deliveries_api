import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderHistoriesDocument } from './orders-history.entity';

export enum OrdersStatus {
  FINDING_DRIVER = 'FINDING_DRIVER',
  DRIVER_FOUND = 'DRIVER_FOUND',
  DRIVER_NOT_FOUND = 'DRIVER_NOT_FOUND',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrdersServiceStatus {
  Placed = 'placed',
  Confirmed = 'confirmed',
  Allocated = 'allocated',
  Picking_up = 'picking_up',
  Picked = 'picked',
  Dropping_of = 'dropping_off',
  Delivered = 'delivered',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
  On_hold = 'on_hold',
  Courier_not_found = 'courier_not_found',
}

@Entity({ name: 'deliveries_orders' })
export class OrdersDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @Column({ nullable: true })
  delivery_id: string;

  @Column({ nullable: true })
  price: number;

  @Column({ type: 'json' })
  response_payload: string;

  @Column({
    type: 'enum',
    enum: OrdersStatus,
    default: OrdersStatus.FINDING_DRIVER,
    nullable: true,
  })
  // @Column()
  status: string;

  @OneToMany(() => OrderHistoriesDocument, (history) => history.history)
  histories: OrderHistoriesDocument[];

  @Column({ nullable: true })
  waybill_id: string;

  @Column({ nullable: true })
  driver_name: string;

  @Column({ nullable: true })
  driver_phone: string;

  @Column({
    type: 'enum',
    enum: OrdersServiceStatus,
    default: OrdersServiceStatus.Placed,
  })
  service_status: string;

  @Column({ nullable: true })
  tracking_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, select: false })
  deleted_at: Date;
}
