import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({
    description: 'The description for this version',
    example: '更新后的用户登录流程，添加了验证码校验步骤',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
