import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create payment order' })
  @ApiResponse({
    status: 201,
    description: 'Payment order created successfully',
    type: Payment,
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.id, createPaymentDto);
  }

  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({
    status: 200,
    description: 'List of payment records',
    type: [Payment],
  })
  @Get()
  @UseGuards(JwtAuthGuard)
  findUserPayments(@Request() req) {
    return this.paymentsService.findUserPayments(req.user.id);
  }

  @ApiOperation({ summary: 'Get payment order details' })
  @ApiResponse({
    status: 200,
    description: 'Payment order details',
    type: Payment,
  })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Request() req, @Param('id') id: string) {
    return this.paymentsService.findOne(id, req.user.id);
  }

  @ApiOperation({ summary: 'Alipay payment callback' })
  @ApiResponse({
    status: 200,
    description: 'Payment callback processed successfully',
  })
  @Post('alipay/callback')
  handleAlipayCallback(@Body() params: any) {
    return this.paymentsService.handleAlipayCallback(params);
  }

  @ApiOperation({ summary: 'WeChat Pay callback' })
  @ApiResponse({
    status: 200,
    description: 'Payment callback processed successfully',
  })
  @Post('wechat/callback')
  handleWechatCallback(@Body() params: any) {
    return this.paymentsService.handleWechatCallback(params);
  }
}
