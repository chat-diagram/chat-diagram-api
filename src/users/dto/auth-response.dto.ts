import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserSubscription } from '../entities/user-subscription.entity';

export class AuthResponseDto {
  @ApiProperty({
    description: 'The authenticated user information',
    type: () => User,
  })
  user: User;

  @ApiProperty({
    description: 'The subscription information',
    type: () => UserSubscription,
  })
  subscription: UserSubscription;

  @ApiProperty({
    description:
      'JWT authentication token (expires based on JWT_EXPIRATION env variable, default: 1 day)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;
}
