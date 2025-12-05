import { DesignNode, TextSegment } from '../../../domain/entities/design-node';
import { DefaultFonts } from '../../../domain/value-objects/typography';
import { BaseNodeCreator } from './base-node.creator';
import { FillMapper } from '../../mappers/fill.mapper';

/**
 * Creator for Text nodes
 */
export class TextNodeCreator extends BaseNodeCreator {
  private loadedFonts: Set<string> = new Set();

  /**
   * Create a text node from design data
   */
  async create(nodeData: DesignNode): Promise<TextNode> {
    const textNode = figma.createText();
    textNode.name = nodeData.name || 'Text';

    // Load and apply base font first
    const fontToUse = await this.loadFont(nodeData.fontName);
    textNode.fontName = fontToUse;

    // Set characters (must be after font is set)
    if (nodeData.characters !== undefined && nodeData.characters !== null) {
      textNode.characters = String(nodeData.characters);
    } else {
      textNode.characters = '';
    }

    // Apply base text properties
    await this.applyTextProperties(textNode, nodeData);

    // Apply text segments for mixed styling
    if (nodeData.textSegments && nodeData.textSegments.length > 0) {
      await this.applyTextSegments(textNode, nodeData.textSegments);
    }

    // Apply fills (text color) - use base fills if no segments
    if (!nodeData.textSegments || nodeData.textSegments.length === 0) {
      await this.applyFillsAsync(textNode, nodeData.fills);
    }

    return textNode;
  }

  private async loadFont(fontName?: { family: string; style: string }): Promise<FontName> {
    const defaultFont = DefaultFonts.INTER;

    if (fontName) {
      const fontKey = `${fontName.family}-${fontName.style}`;
      if (this.loadedFonts.has(fontKey)) {
        return fontName;
      }

      try {
        await figma.loadFontAsync(fontName);
        this.loadedFonts.add(fontKey);
        return fontName;
      } catch {
        console.warn(`Failed to load font ${fontName.family} ${fontName.style}, trying default`);
      }
    }

    try {
      const defaultKey = `${defaultFont.family}-${defaultFont.style}`;
      if (!this.loadedFonts.has(defaultKey)) {
        await figma.loadFontAsync(defaultFont);
        this.loadedFonts.add(defaultKey);
      }
      return defaultFont;
    } catch {
      // Try Arial as last resort
      const arialFont = DefaultFonts.ARIAL;
      const arialKey = `${arialFont.family}-${arialFont.style}`;
      if (!this.loadedFonts.has(arialKey)) {
        await figma.loadFontAsync(arialFont);
        this.loadedFonts.add(arialKey);
      }
      return arialFont;
    }
  }

  private async applyTextProperties(textNode: TextNode, nodeData: DesignNode): Promise<void> {
    // Font size
    if (typeof nodeData.fontSize === 'number' && nodeData.fontSize > 0) {
      textNode.fontSize = nodeData.fontSize;
    }

    // Text alignment
    if (nodeData.textAlignHorizontal) {
      textNode.textAlignHorizontal = nodeData.textAlignHorizontal;
    }
    if (nodeData.textAlignVertical) {
      textNode.textAlignVertical = nodeData.textAlignVertical;
    }

    // Text decoration
    if (nodeData.textDecoration && nodeData.textDecoration !== 'NONE') {
      textNode.textDecoration = nodeData.textDecoration;
    }

    // Text case
    if (nodeData.textCase && nodeData.textCase !== 'ORIGINAL') {
      textNode.textCase = nodeData.textCase;
    }

    // Line height
    if (nodeData.lineHeight) {
      this.applyLineHeight(textNode, nodeData.lineHeight);
    }

    // Letter spacing
    if (nodeData.letterSpacing && typeof nodeData.letterSpacing.value === 'number') {
      textNode.letterSpacing = {
        unit: nodeData.letterSpacing.unit || 'PIXELS',
        value: nodeData.letterSpacing.value,
      };
    }

    // Paragraph settings
    if (typeof nodeData.paragraphIndent === 'number') {
      textNode.paragraphIndent = nodeData.paragraphIndent;
    }
    if (typeof nodeData.paragraphSpacing === 'number') {
      textNode.paragraphSpacing = nodeData.paragraphSpacing;
    }

    // Hyperlink
    if (nodeData.hyperlink) {
      textNode.hyperlink = {
        type: nodeData.hyperlink.type,
        value: nodeData.hyperlink.value,
      };
    }

    // Text truncation
    if (nodeData.textTruncation && 'textTruncation' in textNode) {
      (textNode as any).textTruncation = nodeData.textTruncation;
    }
    if (typeof nodeData.maxLines === 'number' && 'maxLines' in textNode) {
      (textNode as any).maxLines = nodeData.maxLines;
    }

    // Text auto resize - apply after setting content
    this.applyTextAutoResize(textNode, nodeData);
  }

  private applyLineHeight(
    textNode: TextNode,
    lineHeight: { unit: string; value?: number }
  ): void {
    if (lineHeight.unit === 'AUTO') {
      textNode.lineHeight = { unit: 'AUTO' };
    } else if (
      (lineHeight.unit === 'PIXELS' || lineHeight.unit === 'PERCENT') &&
      typeof lineHeight.value === 'number'
    ) {
      textNode.lineHeight = {
        unit: lineHeight.unit,
        value: lineHeight.value,
      };
    }
  }

  private applyTextAutoResize(textNode: TextNode, nodeData: DesignNode): void {
    // If explicit textAutoResize is set, use it
    if (nodeData.textAutoResize) {
      textNode.textAutoResize = nodeData.textAutoResize;
      
      // Apply dimensions based on resize mode
      if (nodeData.textAutoResize === 'NONE' && nodeData.width && nodeData.height) {
        textNode.resize(nodeData.width, nodeData.height);
      } else if (nodeData.textAutoResize === 'HEIGHT' && nodeData.width) {
        textNode.resize(nodeData.width, textNode.height || 1);
      }
      // WIDTH_AND_HEIGHT and TRUNCATE don't need explicit resize
      return;
    }

    // Infer from layout context
    const isParentAutoLayout =
      nodeData.layoutAlign !== undefined || typeof nodeData.layoutGrow === 'number';

    if (isParentAutoLayout) {
      if (nodeData.width && nodeData.width > 0) {
        textNode.textAutoResize = 'HEIGHT';
        textNode.resize(nodeData.width, textNode.height || 1);
      } else {
        textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
      }
    } else {
      if (nodeData.width && nodeData.height) {
        textNode.textAutoResize = 'NONE';
        textNode.resize(nodeData.width, nodeData.height);
      } else if (nodeData.width) {
        textNode.textAutoResize = 'HEIGHT';
        textNode.resize(nodeData.width, textNode.height || 1);
      } else {
        textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
      }
    }
  }

  /**
   * Apply text segments for mixed styling
   */
  private async applyTextSegments(textNode: TextNode, segments: TextSegment[]): Promise<void> {
    const length = textNode.characters.length;
    if (length === 0) return;

    for (const segment of segments) {
      const start = Math.max(0, segment.start);
      const end = Math.min(length, segment.end);
      
      if (start >= end) continue;

      try {
        // Load and apply font for this segment
        if (segment.fontName) {
          const font = await this.loadFont(segment.fontName);
          textNode.setRangeFontName(start, end, font);
        }

        // Font size
        if (typeof segment.fontSize === 'number') {
          textNode.setRangeFontSize(start, end, segment.fontSize);
        }

        // Text case
        if (segment.textCase) {
          textNode.setRangeTextCase(start, end, segment.textCase);
        }

        // Text decoration
        if (segment.textDecoration) {
          textNode.setRangeTextDecoration(start, end, segment.textDecoration);
        }

        // Line height
        if (segment.lineHeight) {
          if (segment.lineHeight.unit === 'AUTO') {
            textNode.setRangeLineHeight(start, end, { unit: 'AUTO' });
          } else if (segment.lineHeight.value !== undefined) {
            textNode.setRangeLineHeight(start, end, {
              unit: segment.lineHeight.unit as 'PIXELS' | 'PERCENT',
              value: segment.lineHeight.value,
            });
          }
        }

        // Letter spacing
        if (segment.letterSpacing) {
          textNode.setRangeLetterSpacing(start, end, {
            unit: segment.letterSpacing.unit,
            value: segment.letterSpacing.value,
          });
        }

        // Fills (text color)
        if (segment.fills && segment.fills.length > 0) {
          const paints = await FillMapper.toPaintAsync(segment.fills);
          if (paints.length > 0) {
            textNode.setRangeFills(start, end, paints);
          }
        }

        // Hyperlink
        if (segment.hyperlink) {
          textNode.setRangeHyperlink(start, end, {
            type: segment.hyperlink.type,
            value: segment.hyperlink.value,
          });
        }
      } catch (error) {
        console.warn(`Error applying text segment [${start}, ${end}]:`, error);
      }
    }
  }
}
