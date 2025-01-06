import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Diagram } from '../../diagrams/entities/diagram.entity';

@Entity('projects')
export class Project {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the project',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '用户管理系统',
    description: 'The name of the project',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: '包含用户注册、登录、权限管理等功能的系统',
    description: 'The description of the project',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the user who created this project',
  })
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Diagram, (diagram) => diagram.project)
  diagrams: Diagram[];

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The creation date of the project',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The last update date of the project',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'The deletion date of the project, null if not deleted',
  })
  @DeleteDateColumn()
  deletedAt: Date;
}
