import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
}

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method',
    example: PaymentMethod.ALIPAY,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiProperty({
    description: 'Subscription duration in days',
    example: 30,
    minimum: 30,
  })
  @IsInt()
  @Min(30)
  durationInDays: number;
}
