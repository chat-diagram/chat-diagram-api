import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EnhanceDescriptionDto {
  @ApiProperty({
    description: 'The original description to be enhanced',
    example: '用户登录流程：输入用户名密码，验证身份，返回结果',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
