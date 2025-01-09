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

@Entity('diagram_versions')
export class DiagramVersion {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the version',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the diagram this version belongs to',
  })
  @Column()
  diagramId: string;

  @ApiProperty({
    example: '用户输入用户名密码，系统验证身份...',
    description: 'The description of the diagram for this version',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: 'sequenceDiagram\nUser->>System: Login...',
    description: 'The Mermaid DSL code for this version',
  })
  @Column({ type: 'text' })
  mermaidCode: string;

  @ApiProperty({
    example: '初始版本',
    description: 'Optional comment for this version',
  })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({
    example: 1,
    description: 'Version number, auto-incremented for each diagram',
  })
  @Column()
  versionNumber: number;

  @ApiProperty({
    example: '2024-01-04T10:00:00Z',
    description: 'When this version was created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Diagram, (diagram) => diagram.versions)
  @JoinColumn({ name: 'diagramId' })
  diagram: Diagram;
}
