import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Diagram } from './diagram.entity';

@Entity('share_tokens')
export class ShareToken {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the share token',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the diagram being shared',
  })
  @Column()
  diagramId: string;

  @ApiProperty({
    example: '2024-02-20T10:00:00Z',
    description: 'When this share token expires',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @ApiProperty({
    example: '2024-02-13T10:00:00Z',
    description: 'When this share token was created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Diagram)
  @JoinColumn({ name: 'diagramId' })
  diagram: Diagram;
} 