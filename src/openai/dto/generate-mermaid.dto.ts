import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateMermaidDto {
  @ApiProperty({
    description: 'The description to generate Mermaid DSL code from',
    example: '用户注册流程：填写信息，验证邮箱，创建账号',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
