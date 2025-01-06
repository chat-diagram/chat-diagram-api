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
import { Project } from '../../projects/entities/project.entity';
import { DiagramVersion } from './diagram-version.entity';

@Entity('diagrams')
export class Diagram {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the diagram',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '用户登录流程',
    description: 'The title of the diagram',
  })
  @Column()
  title: string;

  @ApiProperty({
    example: '用户输入用户名密码，系统验证身份...',
    description: 'The original description of the diagram',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: 'sequenceDiagram\nUser->>System: Login...',
    description: 'The generated Mermaid DSL code',
  })
  @Column({ type: 'text', nullable: true })
  mermaidCode: string;

  @ApiProperty({
    example: 1,
    description: 'Current version number of the diagram',
  })
  @Column({ default: 1 })
  currentVersion: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the user who created this diagram',
  })
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the project this diagram belongs to',
  })
  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.diagrams)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => DiagramVersion, (version) => version.diagram)
  versions: DiagramVersion[];

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The creation date of the diagram',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'The last update date of the diagram',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'The deletion date of the diagram, null if not deleted',
  })
  @DeleteDateColumn()
  deletedAt: Date;
}
