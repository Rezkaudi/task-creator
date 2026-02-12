// File: /backend/src/infrastructure/services/token-store.service.ts

export class TokenStoreService {
    private tokenMap: Map<string, { token: string; expiresAt: number }> = new Map();
    private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

    storeToken(id: string, token: string): void {
        this.cleanup();
        this.tokenMap.set(id, {
            token,
            expiresAt: Date.now() + this.TTL_MS,
        });
    }

    getToken(id: string): string | null {
        const entry = this.tokenMap.get(id);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.tokenMap.delete(id);
            return null;
        }

        // Token is retrieved once and then removed (one-time use)
        this.tokenMap.delete(id);
        return entry.token;
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, value] of this.tokenMap.entries()) {
            if (now > value.expiresAt) {
                this.tokenMap.delete(key);
            }
        }
    }
}
