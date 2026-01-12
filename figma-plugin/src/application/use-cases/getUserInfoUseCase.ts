import { DesignNode } from '../../domain/entities/design-node';
import { INodeRepository } from '../../domain/interfaces/node-repository.interface';

export class GetUserInfoUseCase {

  constructor(
    private readonly nodeRepository: INodeRepository,
  ) { }

  async execute(): Promise<HeadersInit> {
    return await this.nodeRepository.getHeaders();
  }

}
