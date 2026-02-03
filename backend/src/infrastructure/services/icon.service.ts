// src/infrastructure/services/icon.service.ts

import { IIconService, IconSearchResult } from '../../domain/services/IIconService';

export class IconService implements IIconService {

    async searchIcons(query: string): Promise<IconSearchResult> {
        console.log(`🔍 Searching icons for: ${query}`);

        try {
            const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=20`);

            if (!response.ok) {
                throw new Error(`Icon search failed: ${response.statusText}`);
            }

            const data = await response.json() as { icons?: string[] };
            return { icons: data.icons ?? [] };

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`⚠️ Icon search timed out for: ${query}`);
                return { icons: [] };
            }

            throw error;
        }
    }

    getIconUrl(iconData: string): string {
        const [prefix, name] = iconData.split(':');

        if (!prefix || !name) {
            throw new Error(`Invalid icon format: ${iconData}. Expected "prefix:name"`);
        }

        return `https://api.iconify.design/${prefix}/${name}.svg`;
    }
}