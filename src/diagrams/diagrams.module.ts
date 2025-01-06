import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagramsController } from './diagrams.controller';
import { DiagramsService } from './diagrams.service';
import { Diagram } from './entities/diagram.entity';
import { DiagramVersion } from './entities/diagram-version.entity';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Diagram, DiagramVersion]), OpenAIModule],
  controllers: [DiagramsController],
  providers: [DiagramsService],
  exports: [DiagramsService],
})
export class DiagramsModule {}
