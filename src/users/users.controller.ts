import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Username or email already exists.',
  })
  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    return this.usersService.register(createUserDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    return this.usersService.login(loginUserDto);
  }

  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Delete(':id')
  softDelete(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.usersService.softDelete(id);
  }

  @ApiOperation({ summary: 'Restore a deleted user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully restored.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Post(':id/restore')
  restore(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.usersService.restore(id);
  }
}
