import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrdersDocument } from './orders.entity';

export enum OrderHistoriesStatus {
  FINDING_DRIVER = 'FINDING_DRIVER',
  DRIVER_FOUND = 'DRIVER_FOUND',
  DRIVER_NOT_FOUND = 'DRIVER_NOT_FOUND',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderHistoriesServiceStatus {
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

@Entity({ name: 'deliveries_orders_histories' })
export class OrderHistoriesDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @Column({
    type: 'enum',
    enum: OrderHistoriesStatus,
    default: OrderHistoriesStatus.FINDING_DRIVER,
    nullable: true,
  })
  // @Column()
  status: string;

  @ManyToOne(() => OrdersDocument, (order) => order.histories, { eager: true })
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  history: OrdersDocument;

  @Column({
    type: 'enum',
    enum: OrderHistoriesServiceStatus,
    default: OrderHistoriesServiceStatus.Placed,
  })
  service_status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, select: false })
  deleted_at: Date;
}
