// File: /backend/src/domain/entities/user.entity.ts

export interface User {
    id: string;
    figmaUserId: string;
    userName?: string;
    email?: string;
    googleId?: string;
    profilePicture?: string;
    pointsBalance: number;
    stripeCustomerId?: string;
    hasPurchased: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
