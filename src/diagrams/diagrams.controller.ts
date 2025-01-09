import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DiagramsService } from './diagrams.service';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { Diagram } from './entities/diagram.entity';
import { DiagramVersion } from './entities/diagram-version.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('diagrams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('diagrams')
export class DiagramsController {
  constructor(private readonly diagramsService: DiagramsService) {}

  @ApiOperation({ summary: 'Create a new diagram with streaming response' })
  @ApiResponse({
    status: 201,
    description: 'Diagram creation progress and result',
  })
  @Post()
  async create(
    @Body() createDiagramDto: CreateDiagramDto,
    @Request() req,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      // Send progress update: Starting
      response.write(
        `data: ${JSON.stringify({
          status: 'starting',
          message: 'Starting diagram creation...',
        })}\n\n`,
      );

      // Generate Mermaid code with streaming
      let fullMermaidCode = '';
      const stream = await this.diagramsService.generateMermaidCode(
        createDiagramDto.description,
      );

      // Stream the Mermaid code generation progress
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullMermaidCode += content;
          response.write(
            `data: ${JSON.stringify({
              status: 'generating',
              content,
            })}\n\n`,
          );
        }
      }

      // Send progress update: Saving
      response.write(
        `data: ${JSON.stringify({
          status: 'saving',
          message: 'Saving diagram...',
        })}\n\n`,
      );

      // Save the diagram with the generated Mermaid code
      const diagram = await this.diagramsService.create(
        {
          ...createDiagramDto,
          mermaidCode: fullMermaidCode,
        },
        req.user.id,
      );

      // Send the final result
      response.write(
        `data: ${JSON.stringify({
          status: 'completed',
          diagram,
        })}\n\n`,
      );

      response.write('data: [DONE]\n\n');
      response.end();
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error creating diagram',
        error: error.message,
      });
    }
  }

  @ApiOperation({ summary: 'Get all diagrams for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of diagrams',
    type: [Diagram],
  })
  @Get()
  findAll(@Request() req) {
    return this.diagramsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get all diagrams in a project' })
  @ApiResponse({
    status: 200,
    description: 'List of diagrams in the project',
    type: [Diagram],
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @Request() req) {
    return this.diagramsService.findByProject(projectId, req.user.id);
  }

  @ApiOperation({ summary: 'Get a specific diagram' })
  @ApiResponse({
    status: 200,
    description: 'The found diagram',
    type: Diagram,
  })
  @ApiResponse({ status: 404, description: 'Diagram not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.diagramsService.findOne(id, req.user.id);
  }

  @ApiOperation({
    summary: 'Create a new version of the diagram with streaming response',
  })
  @ApiResponse({
    status: 201,
    description: 'Version creation progress and result',
  })
  @Post(':id/versions')
  async createVersion(
    @Param('id') id: string,
    @Body() createVersionDto: CreateVersionDto,
    @Request() req,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      // Send progress update: Starting
      response.write(
        `data: ${JSON.stringify({
          status: 'starting',
          message: 'Starting version creation...',
        })}\n\n`,
      );

      // Get the diagram first to access its description
      const diagram = await this.diagramsService.findOne(id, req.user.id);

      // Generate Mermaid code with streaming
      let fullMermaidCode = '';
      const stream = await this.diagramsService.generateMermaidCode(
        diagram.description,
      );

      // Stream the Mermaid code generation progress
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullMermaidCode += content;
          response.write(
            `data: ${JSON.stringify({
              status: 'generating',
              content,
            })}\n\n`,
          );
        }
      }

      // Send progress update: Saving
      response.write(
        `data: ${JSON.stringify({
          status: 'saving',
          message: 'Saving version...',
        })}\n\n`,
      );

      // Save the version with the generated Mermaid code
      const version = await this.diagramsService.createVersion(
        id,
        req.user.id,
        {
          ...createVersionDto,
          mermaidCode: fullMermaidCode,
        },
      );

      // Send the final result
      response.write(
        `data: ${JSON.stringify({
          status: 'completed',
          version,
        })}\n\n`,
      );

      response.write('data: [DONE]\n\n');
      response.end();
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error creating version',
        error: error.message,
      });
    }
  }

  @ApiOperation({ summary: 'Get all versions of a diagram' })
  @ApiResponse({
    status: 200,
    description: 'List of diagram versions',
    type: [DiagramVersion],
  })
  @Get(':id/versions')
  getVersions(@Param('id') id: string, @Request() req) {
    return this.diagramsService.getVersions(id, req.user.id);
  }

  @ApiOperation({ summary: 'Rollback to a specific version' })
  @ApiResponse({
    status: 200,
    description: 'Successfully rolled back to the specified version',
  })
  @Post(':id/versions/:versionNumber/rollback')
  rollbackVersion(
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Request() req,
  ) {
    return this.diagramsService.rollbackVersion(id, req.user.id, versionNumber);
  }

  @ApiOperation({ summary: 'Delete a diagram' })
  @ApiResponse({
    status: 200,
    description: 'Diagram successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Diagram not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.diagramsService.remove(id, req.user.id);
  }

  @ApiOperation({ summary: 'Restore a deleted diagram' })
  @ApiResponse({
    status: 200,
    description: 'Diagram successfully restored',
  })
  @ApiResponse({ status: 404, description: 'Diagram not found' })
  @Post(':id/restore')
  restore(@Param('id') id: string, @Request() req) {
    return this.diagramsService.restore(id, req.user.id);
  }
}
