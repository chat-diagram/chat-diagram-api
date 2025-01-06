import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'The name of the project',
    example: '用户管理系统',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the project',
    example: '包含用户注册、登录、权限管理等功能的系统',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
} 