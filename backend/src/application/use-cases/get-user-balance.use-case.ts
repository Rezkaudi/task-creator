import { IUserRepository } from "../../domain/repositories/user.repository";

export class GetUserBalanceUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string): Promise<{ pointsBalance: number; hasPurchased: boolean }> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        return {
            pointsBalance: user.pointsBalance,
            hasPurchased: user.hasPurchased,
        };
    }
}
