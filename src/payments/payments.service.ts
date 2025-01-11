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
  private alipaySdk: AlipaySdk | null = null;
  private wechatPay: WxPay | null = null;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.initializePaymentSDKs();
  }

  private initializePaymentSDKs() {
    // Initialize Alipay SDK if configuration is available
    const alipayAppId = this.configService.get('ALIPAY_APP_ID');
    const alipayPrivateKey = this.configService.get('ALIPAY_PRIVATE_KEY');
    const alipayPublicKey = this.configService.get('ALIPAY_PUBLIC_KEY');

    if (alipayAppId && alipayPrivateKey && alipayPublicKey) {
      this.alipaySdk = new AlipaySdk({
        appId: alipayAppId,
        privateKey: alipayPrivateKey,
        alipayPublicKey: alipayPublicKey,
        timeout: 5000,
        camelcase: true,
      });
    }

    // Initialize WeChat Pay SDK if configuration is available
    const wechatAppId = this.configService.get('WECHAT_APP_ID');
    const wechatMchId = this.configService.get('WECHAT_MCH_ID');
    const wechatPublicKey = this.configService.get('WECHAT_PUBLIC_KEY');
    const wechatPrivateKey = this.configService.get('WECHAT_PRIVATE_KEY');

    if (wechatAppId && wechatMchId && wechatPublicKey && wechatPrivateKey) {
      this.wechatPay = new WxPay({
        appid: wechatAppId,
        mchid: wechatMchId,
        publicKey: wechatPublicKey,
        privateKey: wechatPrivateKey,
      });
    }
  }

  private calculateAmount(durationInDays: number): number {
    const pricePerDay = 100; // 1 CNY per day
    return durationInDays * pricePerDay;
  }

  async create(userId: string, createPaymentDto: CreatePaymentDto) {
    // Check if the selected payment method is available
    if (createPaymentDto.method === PaymentMethod.ALIPAY && !this.alipaySdk) {
      throw new BadRequestException('Alipay payment method is not available');
    }

    if (createPaymentDto.method === PaymentMethod.WECHAT && !this.wechatPay) {
      throw new BadRequestException('WeChat Pay method is not available');
    }

    const amount = this.calculateAmount(createPaymentDto.durationInDays);

    const payment = await this.paymentsRepository.save({
      userId,
      method: createPaymentDto.method,
      durationInDays: createPaymentDto.durationInDays,
      amount,
      status: PaymentStatus.PENDING,
    });

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
    if (!this.alipaySdk) {
      throw new BadRequestException('Alipay is not configured');
    }

    const outTradeNo = `${Date.now()}_${payment.id}`;
    try {
      const result = await this.alipaySdk.pageExec('alipay.trade.page.pay', {
        notifyUrl: this.configService.get('ALIPAY_NOTIFY_URL'),
        returnUrl: this.configService.get('ALIPAY_RETURN_URL'),
        bizContent: {
          outTradeNo,
          productCode: 'FAST_INSTANT_TRADE_PAY',
          totalAmount: (payment.amount / 100).toFixed(2),
          subject: `Subscribe for ${payment.durationInDays} days`,
          body: `Activate Pro Plan for ${payment.durationInDays} days`,
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to create Alipay order:', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  private async createWechatOrder(payment: Payment): Promise<string> {
    if (!this.wechatPay) {
      throw new BadRequestException('WeChat Pay is not configured');
    }

    try {
      const outTradeNo = `${Date.now()}_${payment.id}`;
      const notifyUrl = this.configService.get('WECHAT_NOTIFY_URL');

      const result = await this.wechatPay.transactions_native({
        description: `Subscribe for ${payment.durationInDays} days`,
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
      console.error('Failed to create WeChat Pay order:', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  async handleAlipayCallback(params: Record<string, string>) {
    if (!this.alipaySdk) {
      throw new BadRequestException('Alipay is not configured');
    }

    try {
      const isValid = await this.alipaySdk.checkNotifySign(params);
      if (!isValid) {
        throw new BadRequestException('Invalid signature');
      }

      const payment = await this.paymentsRepository.findOne({
        where: { id: params.out_trade_no.split('_')[1] },
      });

      if (!payment) {
        throw new NotFoundException('Payment order not found');
      }

      if (params.trade_status === 'TRADE_SUCCESS') {
        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.SUCCESS,
          tradeNo: params.trade_no,
          paidAt: new Date(),
        });

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
      console.error('Failed to handle Alipay callback:', error);
      throw new BadRequestException('Failed to process payment callback');
    }
  }

  async handleWechatCallback(params: Record<string, any>) {
    if (!this.wechatPay) {
      throw new BadRequestException('WeChat Pay is not configured');
    }

    try {
      const signature = params.signature;
      const timestamp = params.timestamp;
      const nonce = params.nonce;
      const body = params.body;

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const sign = createHash('sha256').update(message).digest('base64');

      if (sign !== signature) {
        throw new BadRequestException('Invalid signature');
      }

      const result = JSON.parse(body);
      const payment = await this.paymentsRepository.findOne({
        where: { id: result.out_trade_no.split('_')[1] },
      });

      if (!payment) {
        throw new NotFoundException('Payment order not found');
      }

      if (result.trade_state === 'SUCCESS') {
        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.SUCCESS,
          tradeNo: result.transaction_id,
          paidAt: new Date(),
        });

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
        message: 'Success',
      };
    } catch (error) {
      console.error('Failed to handle WeChat Pay callback:', error);
      throw new BadRequestException('Failed to process payment callback');
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
      throw new NotFoundException('Payment order not found');
    }

    return payment;
  }
}
