import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({
    description: 'The authenticated user information',
    type: () => User,
  })
  user: User;

  @ApiProperty({
    description: 'JWT authentication token (expires based on JWT_EXPIRATION env variable, default: 1 day)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;
}
