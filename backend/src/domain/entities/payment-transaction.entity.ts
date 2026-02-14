export interface PaymentTransaction {
    id: string;
    userId: string;
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    packageName: string;
    pointsPurchased: number;
    amountPaid: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt?: Date;
    completedAt?: Date;
}
