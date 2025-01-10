import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAIService } from '../openai/openai.service';
import { ProjectsService } from '../projects/projects.service';
import { Diagram } from './entities/diagram.entity';
import { DiagramVersion } from './entities/diagram-version.entity';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class DiagramsService {
  constructor(
    @InjectRepository(Diagram)
    private readonly diagramsRepository: Repository<Diagram>,
    @InjectRepository(DiagramVersion)
    private readonly versionsRepository: Repository<DiagramVersion>,
    private readonly openaiService: OpenAIService,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  async generateMermaidCode(description: string) {
    return this.openaiService.streamGenerateMermaid(description);
  }

  async generateTitle(description: string) {
    return this.openaiService.generateTitle(description);
  }

  async create(
    createDiagramDto: CreateDiagramDto & { mermaidCode: string },
    userId: string,
  ) {
    // Check if user has access to the project
    await this.projectsService.findOne(createDiagramDto.projectId, userId);

    // Generate title if not provided
    let title = createDiagramDto.title;
    if (!title) {
      let fullTitle = '';
      const stream = await this.openaiService.generateTitle(
        createDiagramDto.description,
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullTitle += content;
      }
      title = fullTitle;
    }

    // Create new diagram with Mermaid code
    const diagram = this.diagramsRepository.create({
      ...createDiagramDto,
      title,
      userId,
      currentVersion: 1,
    });

    const savedDiagram = await this.diagramsRepository.save(diagram);

    // Create initial version with the generated Mermaid code
    await this.versionsRepository.save({
      diagramId: savedDiagram.id,
      mermaidCode: createDiagramDto.mermaidCode,
      description: createDiagramDto.description,
      versionNumber: 1,
      comment: '初始版本',
    });

    return savedDiagram;
  }

  async findAll(userId: string) {
    return this.diagramsRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['project', 'versions'],
    });
  }

  async findByProject(projectId: string, userId: string) {
    // Check if user has access to the project
    await this.projectsService.findOne(projectId, userId);

    return this.diagramsRepository.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
      relations: ['versions'],
    });
  }

  async findOne(id: string, userId: string) {
    const diagram = await this.diagramsRepository.findOne({
      where: { id },
      relations: ['project', 'versions'],
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    if (diagram.userId !== userId) {
      throw new UnauthorizedException('You do not have access to this diagram');
    }

    return diagram;
  }

  async createVersion(
    id: string,
    userId: string,
    createVersionDto: CreateVersionDto & { mermaidCode: string },
  ) {
    const diagram = await this.findOne(id, userId);

    // Check version limit for non-pro users
    await this.usersService.checkVersionLimit(userId);

    // Generate version comment by comparing descriptions
    let comment = '';
    const stream = await this.openaiService.generateVersionComment(
      diagram.description,
      createVersionDto.description,
    );

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      comment += content;
    }

    // Create new version with the generated Mermaid code
    const newVersion = await this.versionsRepository.save({
      diagramId: diagram.id,
      mermaidCode: createVersionDto.mermaidCode,
      description: createVersionDto.description,
      versionNumber: diagram.currentVersion + 1,
      comment,
    });

    // Update diagram with new version number, description and Mermaid code
    await this.diagramsRepository.update(id, {
      currentVersion: newVersion.versionNumber,
      mermaidCode: createVersionDto.mermaidCode,
      description: createVersionDto.description,
    });

    return newVersion;
  }

  async rollbackVersion(id: string, userId: string, versionNumber: number) {
    const diagram = await this.findOne(id, userId);

    const targetVersion = diagram.versions.find(
      (v) => v.versionNumber === versionNumber,
    );
    if (!targetVersion) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Update diagram with old version's code
    await this.diagramsRepository.update(id, {
      mermaidCode: targetVersion.mermaidCode,
      currentVersion: versionNumber,
    });

    return { message: `Successfully rolled back to version ${versionNumber}` };
  }

  async getVersions(id: string, userId: string) {
    const diagram = await this.findOne(id, userId);
    return diagram.versions;
  }

  async remove(id: string, userId: string) {
    const diagram = await this.findOne(id, userId);
    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }
    await this.diagramsRepository.softDelete(id);
    return { message: 'Diagram successfully deleted' };
  }

  async restore(id: string, userId: string) {
    const diagram = await this.diagramsRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    if (diagram.userId !== userId) {
      throw new UnauthorizedException('You do not have access to this diagram');
    }

    await this.diagramsRepository.restore(id);
    return { message: 'Diagram successfully restored' };
  }

  async updateTitle(id: string, userId: string, title: string) {
    const diagram = await this.findOne(id, userId);
    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    await this.diagramsRepository.update(id, { title });

    return {
      message: 'Title successfully updated',
      title,
    };
  }
}
