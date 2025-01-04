import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the user',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'johndoe', description: 'The username of the user' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The creation date of the user',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The last update date of the user',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'The deletion date of the user, null if not deleted',
  })
  @DeleteDateColumn()
  deletedAt: Date;
}
