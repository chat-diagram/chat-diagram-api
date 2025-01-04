import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ username }, { email }],
      withDeleted: true, // 同时检查已删除的用户
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

    await this.usersRepository.save(user);

    // Generate JWT token
    const token = this.jwtService.sign({
      username: user.username,
      sub: user.id,
    });

    return { user, token };
  }

  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    // Find user
    const user = await this.usersRepository.findOne({
      where: { username },
      withDeleted: false, // 不包含已删除的用户
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      username: user.username,
      sub: user.id,
    });

    return { user, token };
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
}
