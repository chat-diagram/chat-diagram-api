import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DiagramsController } from './diagrams.controller';
import { DiagramsService } from './diagrams.service';
import { Diagram } from './entities/diagram.entity';
import { DiagramVersion } from './entities/diagram-version.entity';
import { ShareToken } from './entities/share-token.entity';
import { OpenAIModule } from '../openai/openai.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diagram, DiagramVersion, ShareToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d', // 默认7天过期
        },
      }),
    }),
    OpenAIModule,
    ProjectsModule,
    UsersModule,
  ],
  controllers: [DiagramsController],
  providers: [DiagramsService],
  exports: [DiagramsService],
})
export class DiagramsModule {}
