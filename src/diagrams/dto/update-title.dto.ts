import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateTitleDto {
  @ApiProperty({
    description: 'The new title for the diagram',
    example: '用户登录认证流程',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}
