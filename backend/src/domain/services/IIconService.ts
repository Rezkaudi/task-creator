// src/domain/services/IIconService.ts

export interface IconSearchResult {
    icons: string[];
}

export interface IIconService {
    searchIcons(query: string): Promise<IconSearchResult>;
    getIconUrl(iconData: string): string;
}
