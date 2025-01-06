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
} from '@nestjs/common';
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

  @ApiOperation({ summary: 'Create a new diagram' })
  @ApiResponse({
    status: 201,
    description: 'Diagram successfully created',
    type: Diagram,
  })
  @Post()
  create(@Body() createDiagramDto: CreateDiagramDto, @Request() req) {
    return this.diagramsService.create(createDiagramDto, req.user.id);
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

  @ApiOperation({ summary: 'Create a new version of the diagram' })
  @ApiResponse({
    status: 201,
    description: 'New version created successfully',
    type: DiagramVersion,
  })
  @Post(':id/versions')
  createVersion(
    @Param('id') id: string,
    @Body() createVersionDto: CreateVersionDto,
    @Request() req,
  ) {
    return this.diagramsService.createVersion(id, req.user.id, createVersionDto);
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
