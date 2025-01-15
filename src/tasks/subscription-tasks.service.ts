import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserSubscription } from '../users/entities/user-subscription.entity';

@Injectable()
export class SubscriptionTasksService {
  private readonly logger = new Logger(SubscriptionTasksService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly subscriptionsRepository: Repository<UserSubscription>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions...');

    const now = new Date();
    const expiredSubscriptions = await this.subscriptionsRepository.find({
      where: {
        isPro: true,
        proExpiresAt: LessThan(now),
      },
    });

    if (expiredSubscriptions.length > 0) {
      this.logger.log(
        `Found ${expiredSubscriptions.length} expired subscriptions`,
      );

      await Promise.all(
        expiredSubscriptions.map((subscription) =>
          this.subscriptionsRepository.update(subscription.id, {
            isPro: false,
            proExpiresAt: null,
            remainingVersions: 0, // 重置为免费用户的版本数
          }),
        ),
      );

      this.logger.log('Successfully processed expired subscriptions');
    } else {
      this.logger.log('No expired subscriptions found');
    }
  }
}
