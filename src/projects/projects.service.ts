import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      userId,
    });

    return this.projectsRepository.save(project);
  }

  async findAll(userId: string) {
    return this.projectsRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['diagrams'],
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['diagrams'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new UnauthorizedException('You do not have access to this project');
    }

    return project;
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectsRepository.softDelete(id);
    return { message: 'Project successfully deleted' };
  }

  async restore(id: string, userId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new UnauthorizedException('You do not have access to this project');
    }

    await this.projectsRepository.restore(id);
    return { message: 'Project successfully restored' };
  }
}
