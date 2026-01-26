// src/infrastructure/services/design-system-extractor.service.ts

interface ExtractedDesignSystem {
    colors: ColorInfo[];
    typography: TypographyInfo[];
    spacing: SpacingInfo;
    borders: BorderInfo;
    shadows: ShadowInfo[];
    componentPatterns: ComponentPattern[];
}

interface ColorInfo {
    name: string;
    color: { r: number; g: number; b: number; a?: number };
    usage: string;
    count: number;
}

interface TypographyInfo {
    fontFamily: string;
    fontStyle: string;
    fontSize: number;
    usage: string;
    count: number;
}

interface SpacingInfo {
    paddings: number[];
    gaps: number[];
    margins: number[];
}

interface BorderInfo {
    radiuses: number[];
    widths: number[];
    colors: { r: number; g: number; b: number }[];
}

interface ShadowInfo {
    type: string;
    radius: number;
    offset: { x: number; y: number };
    color: { r: number; g: number; b: number; a: number };
    count: number;
}

interface ComponentPattern {
    type: string;
    name: string;
    structure: string;
}

export class DesignSystemExtractorService {
    /**
     * Extract design system from a Figma design JSON
     * Returns a compact representation of colors, typography, spacing, etc.
     */
    extract(designJson: any): ExtractedDesignSystem {
        const colors = new Map<string, ColorInfo>();
        const typography = new Map<string, TypographyInfo>();
        const paddings = new Set<number>();
        const gaps = new Set<number>();
        const margins = new Set<number>();
        const radiuses = new Set<number>();
        const borderWidths = new Set<number>();
        const borderColors = new Map<string, { r: number; g: number; b: number }>();
        const shadows = new Map<string, ShadowInfo>();
        const componentPatterns: ComponentPattern[] = [];

        // Process the design recursively
        const nodes = Array.isArray(designJson) ? designJson : [designJson];
        nodes.forEach(node => this.processNode(node, {
            colors,
            typography,
            paddings,
            gaps,
            margins,
            radiuses,
            borderWidths,
            borderColors,
            shadows,
            componentPatterns
        }));

        return {
            colors: this.getTopItems(Array.from(colors.values()), 10),
            typography: this.getTopItems(Array.from(typography.values()), 8),
            spacing: {
                paddings: this.getUniqueValues(paddings, 10),
                gaps: this.getUniqueValues(gaps, 10),
                margins: this.getUniqueValues(margins, 10),
            },
            borders: {
                radiuses: this.getUniqueValues(radiuses, 5),
                widths: this.getUniqueValues(borderWidths, 3),
                colors: Array.from(borderColors.values()).slice(0, 5),
            },
            shadows: this.getTopItems(Array.from(shadows.values()), 5),
            componentPatterns: componentPatterns.slice(0, 10),
        };
    }

    /**
     * Create a compact summary of the design system for the AI prompt
     */
    createSummary(designSystem: ExtractedDesignSystem): string {
        const lines: string[] = [];

        // Colors
        if (designSystem.colors.length > 0) {
            lines.push('## Colors');
            designSystem.colors.forEach(c => {
                lines.push(`- ${c.usage}: rgb(${this.formatColor(c.color)}) [used ${c.count}x]`);
            });
            lines.push('');
        }

        // Typography
        if (designSystem.typography.length > 0) {
            lines.push('## Typography');
            designSystem.typography.forEach(t => {
                lines.push(`- ${t.fontFamily} ${t.fontStyle} ${t.fontSize}px (${t.usage}) [used ${t.count}x]`);
            });
            lines.push('');
        }

        // Spacing
        lines.push('## Spacing');
        if (designSystem.spacing.paddings.length > 0) {
            lines.push(`- Paddings: ${designSystem.spacing.paddings.join(', ')}px`);
        }
        if (designSystem.spacing.gaps.length > 0) {
            lines.push(`- Gaps: ${designSystem.spacing.gaps.join(', ')}px`);
        }
        lines.push('');

        // Borders
        lines.push('## Borders');
        if (designSystem.borders.radiuses.length > 0) {
            lines.push(`- Border Radius: ${designSystem.borders.radiuses.join(', ')}px`);
        }
        if (designSystem.borders.widths.length > 0) {
            lines.push(`- Border Widths: ${designSystem.borders.widths.join(', ')}px`);
        }
        lines.push('');

        // Shadows
        if (designSystem.shadows.length > 0) {
            lines.push('## Shadows');
            designSystem.shadows.forEach(s => {
                lines.push(`- ${s.type}: blur=${s.radius}px, offset=(${s.offset.x}, ${s.offset.y}), rgba(${this.formatColorWithAlpha(s.color)})`);
            });
            lines.push('');
        }

        // Component Patterns
        if (designSystem.componentPatterns.length > 0) {
            lines.push('## Component Patterns');
            designSystem.componentPatterns.forEach(p => {
                lines.push(`- ${p.type}: ${p.name}`);
            });
        }

        return lines.join('\n');
    }

    /**
     * Get a simplified structure of the design (without full details)
     * Useful for showing the AI what types of components exist
     */
    getSimplifiedStructure(designJson: any, maxDepth: number = 3): any {
        const nodes = Array.isArray(designJson) ? designJson : [designJson];
        return nodes.map(node => this.simplifyNode(node, 0, maxDepth));
    }

    private processNode(node: any, collectors: any, depth: number = 0): void {
        if (!node || typeof node !== 'object') return;

        // Collect fills (colors)
        if (node.fills && Array.isArray(node.fills)) {
            node.fills.forEach((fill: any) => {
                if (fill.type === 'SOLID' && fill.color && fill.visible !== false) {
                    const key = this.colorKey(fill.color);
                    const existing = collectors.colors.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        collectors.colors.set(key, {
                            name: key,
                            color: fill.color,
                            usage: this.guessColorUsage(node, fill.color),
                            count: 1
                        });
                    }
                }
            });
        }

        // Collect typography
        if (node.type === 'TEXT' && node.fontName && node.fontSize) {
            const key = `${node.fontName.family}-${node.fontName.style}-${node.fontSize}`;
            const existing = collectors.typography.get(key);
            if (existing) {
                existing.count++;
            } else {
                collectors.typography.set(key, {
                    fontFamily: node.fontName.family,
                    fontStyle: node.fontName.style,
                    fontSize: node.fontSize,
                    usage: this.guessTypographyUsage(node),
                    count: 1
                });
            }
        }

        // Collect spacing
        if (node.paddingTop) collectors.paddings.add(node.paddingTop);
        if (node.paddingRight) collectors.paddings.add(node.paddingRight);
        if (node.paddingBottom) collectors.paddings.add(node.paddingBottom);
        if (node.paddingLeft) collectors.paddings.add(node.paddingLeft);
        if (node.itemSpacing) collectors.gaps.add(node.itemSpacing);

        // Collect borders
        if (node.cornerRadius) collectors.radiuses.add(node.cornerRadius);
        if (node.topLeftRadius) collectors.radiuses.add(node.topLeftRadius);
        if (node.strokeWeight) collectors.borderWidths.add(node.strokeWeight);
        if (node.strokes && Array.isArray(node.strokes)) {
            node.strokes.forEach((stroke: any) => {
                if (stroke.color) {
                    const key = this.colorKey(stroke.color);
                    collectors.borderColors.set(key, stroke.color);
                }
            });
        }

        // Collect shadows
        if (node.effects && Array.isArray(node.effects)) {
            node.effects.forEach((effect: any) => {
                if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
                    const key = `${effect.type}-${effect.radius}-${effect.offset?.x || 0}-${effect.offset?.y || 0}`;
                    const existing = collectors.shadows.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        collectors.shadows.set(key, {
                            type: effect.type,
                            radius: effect.radius || 0,
                            offset: effect.offset || { x: 0, y: 0 },
                            color: effect.color || { r: 0, g: 0, b: 0, a: 0.25 },
                            count: 1
                        });
                    }
                }
            });
        }

        // Collect component patterns (only at shallow depths)
        if (depth < 2 && node.type === 'FRAME' && node.name) {
            const pattern = this.identifyComponentPattern(node);
            if (pattern) {
                collectors.componentPatterns.push(pattern);
            }
        }

        // Process children
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child: any) => {
                this.processNode(child, collectors, depth + 1);
            });
        }
    }

    private simplifyNode(node: any, depth: number, maxDepth: number): any {
        if (!node || depth > maxDepth) return null;

        const simplified: any = {
            name: node.name,
            type: node.type,
        };

        if (node.width) simplified.width = node.width;
        if (node.height) simplified.height = node.height;
        if (node.layoutMode) simplified.layoutMode = node.layoutMode;

        if (node.children && Array.isArray(node.children) && depth < maxDepth) {
            simplified.children = node.children
                .map((child: any) => this.simplifyNode(child, depth + 1, maxDepth))
                .filter(Boolean)
                .slice(0, 5); // Limit children to avoid huge output

            if (node.children.length > 5) {
                simplified.moreChildren = node.children.length - 5;
            }
        }

        return simplified;
    }

    private colorKey(color: { r: number; g: number; b: number }): string {
        return `${Math.round(color.r * 255)}-${Math.round(color.g * 255)}-${Math.round(color.b * 255)}`;
    }

    private formatColor(color: { r: number; g: number; b: number }): string {
        return `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`;
    }

    private formatColorWithAlpha(color: { r: number; g: number; b: number; a: number }): string {
        return `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a?.toFixed(2) || 1}`;
    }

    private guessColorUsage(node: any, color: { r: number; g: number; b: number }): string {
        // Try to guess what the color is used for based on context
        const brightness = (color.r + color.g + color.b) / 3;

        if (node.type === 'TEXT') {
            return brightness < 0.3 ? 'Text (Dark)' : 'Text (Light)';
        }

        if (brightness > 0.95) return 'Background (White)';
        if (brightness < 0.1) return 'Background (Dark)';
        if (color.r > 0.8 && color.g < 0.3 && color.b < 0.3) return 'Accent (Red)';
        if (color.r < 0.3 && color.g > 0.6 && color.b < 0.3) return 'Accent (Green)';
        if (color.r < 0.3 && color.g < 0.5 && color.b > 0.7) return 'Primary (Blue)';

        return 'Surface';
    }

    private guessTypographyUsage(node: any): string {
        const fontSize = node.fontSize || 14;
        if (fontSize >= 32) return 'Display/Heading';
        if (fontSize >= 24) return 'Heading';
        if (fontSize >= 18) return 'Subheading';
        if (fontSize >= 14) return 'Body';
        return 'Caption/Small';
    }

    private identifyComponentPattern(node: any): ComponentPattern | null {
        const name = node.name?.toLowerCase() || '';

        // Common patterns
        if (name.includes('button') || name.includes('btn')) {
            return { type: 'Button', name: node.name, structure: this.getChildTypes(node) };
        }
        if (name.includes('input') || name.includes('field') || name.includes('textfield')) {
            return { type: 'Input', name: node.name, structure: this.getChildTypes(node) };
        }
        if (name.includes('card')) {
            return { type: 'Card', name: node.name, structure: this.getChildTypes(node) };
        }
        if (name.includes('nav') || name.includes('menu') || name.includes('header')) {
            return { type: 'Navigation', name: node.name, structure: this.getChildTypes(node) };
        }
        if (name.includes('modal') || name.includes('dialog')) {
            return { type: 'Modal', name: node.name, structure: this.getChildTypes(node) };
        }

        return null;
    }

    private getChildTypes(node: any): string {
        if (!node.children || !Array.isArray(node.children)) return 'empty';
        const types = node.children.map((c: any) => c.type).slice(0, 5);
        return types.join(', ');
    }

    private getTopItems<T extends { count: number }>(items: T[], limit: number): T[] {
        return items.sort((a, b) => b.count - a.count).slice(0, limit);
    }

    private getUniqueValues(set: Set<number>, limit: number): number[] {
        return Array.from(set).sort((a, b) => a - b).slice(0, limit);
    }
}