import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
}

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    description: '支付方式',
    example: PaymentMethod.ALIPAY,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiProperty({
    description: '订阅时长（天数）',
    example: 30,
    minimum: 30,
  })
  @IsInt()
  @Min(30)
  durationInDays: number;
} 