import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user_subscriptions')
export class UserSubscription {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the subscription',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the user this subscription belongs to',
  })
  @Column()
  userId: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user is a pro user',
  })
  @Column({ default: false })
  isPro: boolean;

  @ApiProperty({
    example: 3,
    description: 'Number of version generations remaining for non-pro users',
  })
  @Column({ default: 3 })
  remainingVersions: number;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'When the pro subscription expires',
  })
  @Column({ type: 'timestamp', nullable: true })
  proExpiresAt: Date;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The creation date of the subscription',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The last update date of the subscription',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
