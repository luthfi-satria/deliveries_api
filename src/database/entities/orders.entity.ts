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

  @Column()
  delivery_id: string;

  @Column()
  price: number;

  @Column({ type: 'json' })
  response_payload: string;

  @Column({
    type: 'enum',
    enum: OrdersStatus,
    default: OrdersStatus.Placed,
  })
  status: string;

  @OneToMany(() => OrderHistoriesDocument, (history) => history.history)
  histories: OrderHistoriesDocument[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, select: false })
  deleted_at: Date;
}
