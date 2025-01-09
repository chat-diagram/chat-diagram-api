import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'chat_diagram'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get('NODE_ENV', 'development') === 'development', // 仅在开发环境启用
  extra: {
    // 设置会话级别的时区
    timezone: 'Asia/Shanghai',
  },
});
