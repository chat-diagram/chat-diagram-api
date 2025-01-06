import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'Project successfully created',
    type: Project,
  })
  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @ApiOperation({ summary: 'Get all projects for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of projects with their diagrams',
    type: [Project],
  })
  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a specific project' })
  @ApiResponse({
    status: 200,
    description: 'The found project with its diagrams',
    type: Project,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({
    status: 200,
    description: 'Project successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.projectsService.remove(id, req.user.id);
  }

  @ApiOperation({ summary: 'Restore a deleted project' })
  @ApiResponse({
    status: 200,
    description: 'Project successfully restored',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Post(':id/restore')
  restore(@Param('id') id: string, @Request() req) {
    return this.projectsService.restore(id, req.user.id);
  }
}
