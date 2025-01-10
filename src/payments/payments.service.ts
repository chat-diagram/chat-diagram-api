import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { UsersService } from '../users/users.service';
import { AlipaySdk } from 'alipay-sdk';
import WxPay from 'wechatpay-node-v3';
import { createHash } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly alipaySdk: AlipaySdk;
  private readonly wechatPay: WxPay;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Alipay SDK
    this.alipaySdk = new AlipaySdk({
      appId: this.configService.get('ALIPAY_APP_ID'),
      privateKey: this.configService.get('ALIPAY_PRIVATE_KEY'),
      alipayPublicKey: this.configService.get('ALIPAY_PUBLIC_KEY'),
      timeout: 5000,
      camelcase: true,
    });

    // Initialize WeChat Pay SDK
    this.wechatPay = new WxPay({
      appid: this.configService.get('WECHAT_APP_ID'),
      mchid: this.configService.get('WECHAT_MCH_ID'),
      publicKey: this.configService.get('WECHAT_PUBLIC_KEY'),
      privateKey: this.configService.get('WECHAT_PRIVATE_KEY'),
    });
  }

  private calculateAmount(durationInDays: number): number {
    // 计算支付金额（以分为单位）
    const pricePerDay = 100; // 1元/天
    return durationInDays * pricePerDay;
  }

  async create(userId: string, createPaymentDto: CreatePaymentDto) {
    const amount = this.calculateAmount(createPaymentDto.durationInDays);

    const payment = await this.paymentsRepository.save({
      userId,
      method: createPaymentDto.method,
      durationInDays: createPaymentDto.durationInDays,
      amount,
      status: PaymentStatus.PENDING,
    });

    // 根据支付方式生成支付链接
    let payUrl: string;
    if (createPaymentDto.method === PaymentMethod.ALIPAY) {
      payUrl = await this.createAlipayOrder(payment);
    } else {
      payUrl = await this.createWechatOrder(payment);
    }

    return {
      ...payment,
      payUrl,
    };
  }

  private async createAlipayOrder(payment: Payment): Promise<string> {
    const outTradeNo = `${Date.now()}_${payment.id}`;
    try {
      const result = await this.alipaySdk.pageExec('alipay.trade.page.pay', {
        notifyUrl: this.configService.get('ALIPAY_NOTIFY_URL'),
        returnUrl: this.configService.get('ALIPAY_RETURN_URL'),
        bizContent: {
          outTradeNo,
          productCode: 'FAST_INSTANT_TRADE_PAY',
          totalAmount: (payment.amount / 100).toFixed(2),
          subject: `订阅 ${payment.durationInDays} 天`,
          body: `开通专业版 ${payment.durationInDays} 天`,
        },
      });

      return result;
    } catch (error) {
      console.error('创建支付宝订单失败:', error);
      throw new BadRequestException('创建支付订单失败');
    }
  }

  private async createWechatOrder(payment: Payment): Promise<string> {
    try {
      const outTradeNo = `${Date.now()}_${payment.id}`;
      const notifyUrl = this.configService.get('WECHAT_NOTIFY_URL');
      const appId = this.configService.get('WECHAT_APP_ID');
      const mchId = this.configService.get('WECHAT_MCH_ID');

      // 创建统一下单
      const result = await this.wechatPay.transactions_native({
        description: `订阅 ${payment.durationInDays} 天`,
        out_trade_no: outTradeNo,
        notify_url: notifyUrl,
        amount: {
          total: payment.amount,
          currency: 'CNY',
        },
        scene_info: {
          payer_client_ip: '127.0.0.1',
        },
      });

      if (!result.data.code_url) {
        throw new Error('Failed to get code_url');
      }

      return result.data.code_url;
    } catch (error) {
      console.error('创建微信支付订单失败:', error);
      throw new BadRequestException('创建支付订单失败');
    }
  }

  async handleAlipayCallback(params: Record<string, string>) {
    try {
      // 验证签名
      const isValid = await this.alipaySdk.checkNotifySign(params);
      if (!isValid) {
        throw new BadRequestException('签名验证失败');
      }

      const payment = await this.paymentsRepository.findOne({
        where: { id: params.out_trade_no.split('_')[1] },
      });

      if (!payment) {
        throw new NotFoundException('支付订单不存在');
      }

      if (params.trade_status === 'TRADE_SUCCESS') {
        // 更新支付状态
        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.SUCCESS,
          tradeNo: params.trade_no,
          paidAt: new Date(),
        });

        // 更新用户订阅状态
        await this.usersService.upgradeToPro(
          payment.userId,
          payment.durationInDays,
        );
      } else {
        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.FAILED,
        });
      }

      return 'success';
    } catch (error) {
      console.error('处理支付宝回调失败:', error);
      throw new BadRequestException('处理支付回调失败');
    }
  }

  async handleWechatCallback(params: Record<string, any>) {
    try {
      // 验证签名
      const signature = params.signature;
      const timestamp = params.timestamp;
      const nonce = params.nonce;
      const body = params.body;

      // 验证签名
      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const sign = createHash('sha256').update(message).digest('base64');

      if (sign !== signature) {
        throw new BadRequestException('签名验证失败');
      }

      const result = JSON.parse(body);
      const payment = await this.paymentsRepository.findOne({
        where: { id: result.out_trade_no.split('_')[1] },
      });

      if (!payment) {
        throw new NotFoundException('支付订单不存在');
      }

      if (result.trade_state === 'SUCCESS') {
        // 更新支付状态
        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.SUCCESS,
          tradeNo: result.transaction_id,
          paidAt: new Date(),
        });

        // 更新用户订阅状态
        await this.usersService.upgradeToPro(
          payment.userId,
          payment.durationInDays,
        );
      } else {
        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.FAILED,
        });
      }

      return {
        code: 'SUCCESS',
        message: '成功',
      };
    } catch (error) {
      console.error('处理微信支付回调失败:', error);
      throw new BadRequestException('处理支付回调失败');
    }
  }

  async findUserPayments(userId: string) {
    return this.paymentsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const payment = await this.paymentsRepository.findOne({
      where: { id, userId },
    });

    if (!payment) {
      throw new NotFoundException('支付订单不存在');
    }

    return payment;
  }
}
