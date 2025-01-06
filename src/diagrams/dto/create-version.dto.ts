import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({
    description: 'Optional comment for this version',
    example: '更新了登录失败的处理流程',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
