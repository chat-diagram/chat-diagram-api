import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserSubscription } from '../users/entities/user-subscription.entity';
import { SubscriptionTasksService } from './subscription-tasks.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([UserSubscription]),
  ],
  providers: [SubscriptionTasksService],
})
export class TasksModule {}
