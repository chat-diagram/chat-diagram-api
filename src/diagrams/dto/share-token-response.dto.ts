import { ApiProperty } from '@nestjs/swagger';

export class ShareTokenResponseDto {
  @ApiProperty({
    description: 'JWT token for accessing the shared diagram',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Token expiration time',
    example: '7d',
    nullable: true,
  })
  expiresIn: string | undefined;
}
