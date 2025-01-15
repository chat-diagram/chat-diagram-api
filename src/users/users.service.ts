import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionsRepository: Repository<UserSubscription>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ username }, { email }],
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    // Create initial subscription
    const subscription = await this.subscriptionsRepository.save({
      userId: savedUser.id,
      isPro: false,
      remainingVersions: 3,
    });

    // Generate JWT token
    const token = this.jwtService.sign({
      username: user.username,
      sub: user.id,
    });

    return { user, subscription, token };
  }

  async checkVersionLimit(userId: string) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Pro users have unlimited versions
    if (subscription.isPro) {
      return true;
    }

    // Check if non-pro user has remaining versions
    if (subscription.remainingVersions <= 0) {
      throw new ForbiddenException(
        'No remaining version generations. Please upgrade to Pro.',
      );
    }

    // Decrement remaining versions
    await this.subscriptionsRepository.update(subscription.id, {
      remainingVersions: subscription.remainingVersions - 1,
    });

    return true;
  }

  async getSubscriptionStatus(userId: string) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async upgradeToPro(userId: string, durationInDays: number = 30) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const proExpiresAt = new Date();
    proExpiresAt.setDate(proExpiresAt.getDate() + durationInDays);

    await this.subscriptionsRepository.update(subscription.id, {
      isPro: true,
      proExpiresAt,
    });

    return this.getSubscriptionStatus(userId);
  }

  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    // Find user
    const user = await this.usersRepository.findOne({
      where: { username },
      withDeleted: false,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get subscription info
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      username: user.username,
      sub: user.id,
    });

    return { user, subscription, token };
  }

  async softDelete(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.softDelete(userId);
    return { message: 'User successfully deleted' };
  }

  async restore(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.restore(userId);
    return { message: 'User successfully restored' };
  }

  async createSubscription(userId: string, durationInDays: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const proExpiresAt = new Date(
      now.getTime() + durationInDays * 24 * 60 * 60 * 1000,
    );

    const subscription = await this.subscriptionsRepository.save({
      userId,
      isPro: true,
      proExpiresAt,
      remainingVersions: 0, // Pro用户设置一个很大的数值
    });

    return subscription;
  }
}
