import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';
import { UILibraryProject } from '../../domain/entities/ui-library-project.entity';
import { UILibraryComponent } from '../../domain/entities/ui-library-component.entity';
import { UILibraryProjectEntity } from '../database/entities/ui-library-project.entity';
import { UILibraryComponentEntity } from '../database/entities/ui-library-component.entity';

export class TypeORMUILibraryRepository implements IUILibraryRepository {
    private readonly projectRepository: Repository<UILibraryProjectEntity>;
    private readonly componentRepository: Repository<UILibraryComponentEntity>;

    constructor() {
        this.projectRepository = AppDataSource.getRepository(UILibraryProjectEntity);
        this.componentRepository = AppDataSource.getRepository(UILibraryComponentEntity);
    }

    async createProject(project: Pick<UILibraryProject, 'name' | 'userId'>): Promise<UILibraryProject> {
        const entity = this.projectRepository.create({
            id: this.generateId(),
            name: project.name,
            userId: project.userId,
        });

        const saved = await this.projectRepository.save(entity);
        return this.toProject(saved);
    }

    async findProjects(userId: string): Promise<UILibraryProject[]> {
        const projects = await this.projectRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        return projects.map((project) => this.toProject(project));
    }

    async deleteProject(projectId: string, userId: string): Promise<void> {
        await this.projectRepository.delete({ id: projectId, userId });
    }

    async findProjectById(projectId: string, userId: string): Promise<UILibraryProject | null> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId, userId },
        });

        return project ? this.toProject(project) : null;
    }

    async createComponent(component: {
        projectId: string;
        userId: string;
        name: string;
        description: string;
        designJson: any;
        previewImage?: string | null;
    }): Promise<UILibraryComponent> {
        const entity = this.componentRepository.create({
            id: this.generateId(),
            projectId: component.projectId,
            userId: component.userId,
            name: component.name,
            description: component.description,
            designJson: component.designJson,
            previewImage: component.previewImage || null,
        });

        const saved = await this.componentRepository.save(entity);
        return this.toComponent(saved);
    }

    async findComponentsByProject(projectId: string, userId: string): Promise<UILibraryComponent[]> {
        const components = await this.componentRepository.find({
            where: { projectId, userId },
            order: { createdAt: 'DESC' },
        });

        return components.map((component) => this.toComponent(component));
    }

    async findComponentById(componentId: string, userId: string): Promise<UILibraryComponent | null> {
        const component = await this.componentRepository.findOne({
            where: { id: componentId, userId },
        });

        return component ? this.toComponent(component) : null;
    }

    async deleteComponent(componentId: string, userId: string): Promise<void> {
        await this.componentRepository.delete({ id: componentId, userId });
    }

    private toProject(project: UILibraryProjectEntity): UILibraryProject {
        return {
            id: project.id,
            name: project.name,
            userId: project.userId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        };
    }

    private toComponent(component: UILibraryComponentEntity): UILibraryComponent {
        return {
            id: component.id,
            projectId: component.projectId,
            userId: component.userId,
            name: component.name,
            description: component.description,
            designJson: component.designJson,
            previewImage: component.previewImage || null,
            createdAt: component.createdAt,
            updatedAt: component.updatedAt,
        };
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
}
