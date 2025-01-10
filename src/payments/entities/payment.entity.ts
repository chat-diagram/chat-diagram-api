import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../dto/create-payment.dto';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('payments')
export class Payment {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the payment',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the user who made the payment',
  })
  @Column()
  userId: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method',
    example: PaymentMethod.ALIPAY,
  })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @ApiProperty({
    enum: PaymentStatus,
    description: 'Payment status',
    example: PaymentStatus.SUCCESS,
  })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Subscription duration in days',
    example: 30,
  })
  @Column()
  durationInDays: number;

  @ApiProperty({
    description: 'Payment amount in cents',
    example: 2900,
  })
  @Column()
  amount: number;

  @ApiProperty({
    description: 'Third-party payment transaction number',
    example: '2024010410595900001',
  })
  @Column({ nullable: true })
  tradeNo: string;

  @ApiProperty({
    description: 'Payment completion time',
    example: '2024-01-04T10:59:59Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
} 