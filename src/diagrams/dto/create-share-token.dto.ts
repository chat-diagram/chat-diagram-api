import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ShareExpiration {
  WEEK = '7d',
  TWO_WEEKS = '15d',
  NEVER = 'never',
}

export class CreateShareTokenDto {
  @ApiProperty({
    enum: ShareExpiration,
    description: 'Share link expiration time',
    example: ShareExpiration.WEEK,
  })
  @IsEnum(ShareExpiration)
  @IsNotEmpty()
  expiration: ShareExpiration;
}
