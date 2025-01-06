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

@Injectable()
export class DiagramsService {
  constructor(
    @InjectRepository(Diagram)
    private readonly diagramsRepository: Repository<Diagram>,
    @InjectRepository(DiagramVersion)
    private readonly versionsRepository: Repository<DiagramVersion>,
    private readonly openaiService: OpenAIService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(createDiagramDto: CreateDiagramDto, userId: string) {
    // Check if user has access to the project
    await this.projectsService.findOne(createDiagramDto.projectId, userId);

    // Generate Mermaid code using OpenAI
    const mermaidCode = await this.openaiService.generateMermaid(
      createDiagramDto.description,
    );

    // Create new diagram
    const diagram = this.diagramsRepository.create({
      ...createDiagramDto,
      userId,
      mermaidCode,
      currentVersion: 1,
    });

    const savedDiagram = await this.diagramsRepository.save(diagram);

    // Create initial version
    await this.versionsRepository.save({
      diagramId: savedDiagram.id,
      mermaidCode,
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
    createVersionDto: CreateVersionDto,
  ) {
    const diagram = await this.findOne(id, userId);

    // Generate new Mermaid code
    const mermaidCode = await this.openaiService.generateMermaid(
      diagram.description,
    );

    // Create new version
    const newVersion = await this.versionsRepository.save({
      diagramId: diagram.id,
      mermaidCode,
      versionNumber: diagram.currentVersion + 1,
      comment: createVersionDto.comment,
    });

    // Update diagram with new version
    await this.diagramsRepository.update(id, {
      mermaidCode,
      currentVersion: newVersion.versionNumber,
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
}
