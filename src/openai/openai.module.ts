import { Module } from '@nestjs/common';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [OpenAIController],
  providers: [OpenAIService],
})
export class OpenAIModule {}
