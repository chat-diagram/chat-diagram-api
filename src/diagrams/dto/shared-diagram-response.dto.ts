import { ApiProperty } from '@nestjs/swagger';

class SharedDiagramUser {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'The username of the user',
  })
  username: string;
}

export class SharedDiagramResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the diagram',
  })
  id: string;

  @ApiProperty({
    example: '用户登录流程',
    description: 'The title of the diagram',
  })
  title: string;

  @ApiProperty({
    example: '用户输入用户名密码，系统验证身份...',
    description: 'The description of the diagram',
  })
  description: string;

  @ApiProperty({
    example: 'sequenceDiagram\nUser->>System: Login...',
    description: 'The Mermaid DSL code',
  })
  mermaidCode: string;

  @ApiProperty({
    example: 1,
    description: 'The version number of the diagram',
  })
  versionNumber: number;

  @ApiProperty({
    description: 'The user who created the diagram',
    type: SharedDiagramUser,
  })
  user: SharedDiagramUser;
} 