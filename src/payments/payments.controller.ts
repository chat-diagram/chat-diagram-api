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
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: '创建支付订单' })
  @ApiResponse({
    status: 201,
    description: '支付订单创建成功',
    type: Payment,
  })
  @Post()
  create(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.id, createPaymentDto);
  }

  @ApiOperation({ summary: '获取用户支付记录' })
  @ApiResponse({
    status: 200,
    description: '支付记录列表',
    type: [Payment],
  })
  @Get()
  findUserPayments(@Request() req) {
    return this.paymentsService.findUserPayments(req.user.id);
  }

  @ApiOperation({ summary: '获取支付订单详情' })
  @ApiResponse({
    status: 200,
    description: '支付订单详情',
    type: Payment,
  })
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.paymentsService.findOne(id, req.user.id);
  }

  @ApiOperation({ summary: '支付宝支付回调' })
  @ApiResponse({
    status: 200,
    description: '支付回调处理成功',
  })
  @Post('alipay/callback')
  handleAlipayCallback(@Body() params: any) {
    return this.paymentsService.handleAlipayCallback(params);
  }

  @ApiOperation({ summary: '微信支付回调' })
  @ApiResponse({
    status: 200,
    description: '支付回调处理成功',
  })
  @Post('wechat/callback')
  handleWechatCallback(@Body() params: any) {
    return this.paymentsService.handleWechatCallback(params);
  }
} 