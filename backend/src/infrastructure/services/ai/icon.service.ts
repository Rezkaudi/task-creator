// src/infrastructure/services/icon.service.ts

import { IIconService, IconSearchResult } from '../../../domain/services/IIconService';

const ICON_SEARCH_TIMEOUT_MS = 5000;
const ICON_SEARCH_LIMIT = 10;

export class IconService implements IIconService {

    async searchIcons(query: string): Promise<IconSearchResult> {
        console.log(`🔍 Searching icons for: ${query}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ICON_SEARCH_TIMEOUT_MS);

        try {
            const response = await fetch(
                `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${ICON_SEARCH_LIMIT}`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                throw new Error(`Icon search failed: ${response.statusText}`);
            }

            const data = await response.json() as { icons?: string[] };
            const icons: string[] = data.icons ?? [];

            return { icons };

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`⚠️ Icon search timed out for: ${query}`);
                return { icons: [] };
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}