// src/infrastructure/services/icon.service.ts

import { IIconService, IconSearchResult } from '../../../domain/services/IIconService';
import { ENV_CONFIG } from '../../config/env.config';

interface CacheEntry {
    result: IconSearchResult;
    expiry: number;
}

export class IconService implements IIconService {
    private cache = new Map<string, CacheEntry>();

    async searchIcons(query: string): Promise<IconSearchResult> {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return { icons: [] };

        // Check cache first
        const cached = this.cache.get(normalizedQuery);
        if (cached && Date.now() < cached.expiry) {
            console.log(`⚡ Icon cache hit for: "${normalizedQuery}"`);
            return cached.result;
        }

        console.log(`🔍 Searching icons for: "${normalizedQuery}"`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ENV_CONFIG.ICON_SEARCH_TIMEOUT_MS);

        try {
            const response = await fetch(
                `https://api.iconify.design/search?query=${encodeURIComponent(normalizedQuery)}&limit=${ENV_CONFIG.ICON_SEARCH_LIMIT}`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                throw new Error(`Icon search failed: ${response.statusText}`);
            }

            const data = await response.json() as { icons?: string[] };
            const icons: string[] = data.icons ?? [];
            const result: IconSearchResult = { icons };

            // Store in cache
            this.cache.set(normalizedQuery, {
                result,
                expiry: Date.now() + ENV_CONFIG.ICON_CACHE_TTL_MS,
            });

            // Evict expired entries periodically (keep cache bounded)
            if (this.cache.size > 200) {
                this.evictExpired();
            }

            return result;

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`⚠️ Icon search timed out for: "${normalizedQuery}"`);
                return { icons: [] };
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    private evictExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now >= entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}