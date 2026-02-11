import { UILibraryProject } from '../entities/ui-library-project.entity';
import { UILibraryComponent } from '../entities/ui-library-component.entity';

export interface IUILibraryRepository {
    createProject(project: Pick<UILibraryProject, 'name' | 'userId'>): Promise<UILibraryProject>;
    findProjects(userId: string): Promise<UILibraryProject[]>;
    deleteProject(projectId: string, userId: string): Promise<void>;
    findProjectById(projectId: string, userId: string): Promise<UILibraryProject | null>;

    createComponent(component: {
        projectId: string;
        userId: string;
        name: string;
        description: string;
        designJson: any;
        previewImage?: string | null;
    }): Promise<UILibraryComponent>;
    findComponentsByProject(projectId: string, userId: string): Promise<UILibraryComponent[]>;
    findComponentById(componentId: string, userId: string): Promise<UILibraryComponent | null>;
    deleteComponent(componentId: string, userId: string): Promise<void>;
}
