import { ApiProperty } from '@nestjs/swagger';

export class ShareTokenResponseDto {
  @ApiProperty({
    description: 'UUID of the shared diagram',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string;

  @ApiProperty({
    description: 'Token expiration time',
    example: '7d',
    nullable: true,
  })
  expiresIn: string | undefined;
}
