import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'User successfully deleted',
  })
  message: string;
}
