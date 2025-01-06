import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OpenAIService } from './openai.service';
import { EnhanceDescriptionDto } from './dto/enhance-description.dto';
import { GenerateMermaidDto } from './dto/generate-mermaid.dto';

@ApiTags('openai')
@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @ApiOperation({ summary: 'Enhance description for Mermaid diagram' })
  @ApiResponse({
    status: 200,
    description: 'Description successfully enhanced',
    type: String,
  })
  @Post('enhance')
  async enhanceDescription(@Body() dto: EnhanceDescriptionDto) {
    const enhancedDescription = await this.openaiService.enhanceDescription(
      dto.description,
    );
    return { content: enhancedDescription };
  }

  @ApiOperation({ summary: 'Stream enhanced description for Mermaid diagram' })
  @ApiResponse({
    status: 200,
    description: 'Description enhancement stream',
  })
  @Post('enhance/stream')
  async streamEnhanceDescription(
    @Body() dto: EnhanceDescriptionDto,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.openaiService.streamEnhanceDescription(
        dto.description,
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          response.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      response.write('data: [DONE]\n\n');
      response.end();
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error processing stream',
        error: error.message,
      });
    }
  }

  @ApiOperation({ summary: 'Generate Mermaid DSL code' })
  @ApiResponse({
    status: 200,
    description: 'Mermaid DSL code successfully generated',
    type: String,
  })
  @Post('mermaid')
  async generateMermaid(@Body() dto: GenerateMermaidDto) {
    const mermaidCode = await this.openaiService.generateMermaid(
      dto.description,
    );
    return { content: mermaidCode };
  }

  @ApiOperation({ summary: 'Stream Mermaid DSL code generation' })
  @ApiResponse({
    status: 200,
    description: 'Mermaid DSL code generation stream',
  })
  @Post('mermaid/stream')
  async streamGenerateMermaid(
    @Body() dto: GenerateMermaidDto,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.openaiService.streamGenerateMermaid(
        dto.description,
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          response.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      response.write('data: [DONE]\n\n');
      response.end();
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error processing stream',
        error: error.message,
      });
    }
  }
}
