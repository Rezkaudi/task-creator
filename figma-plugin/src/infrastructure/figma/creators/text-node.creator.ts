import { DesignNode } from '../../../domain/entities/design-node';
import { DefaultFonts } from '../../../domain/value-objects/typography';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Text nodes
 */
export class TextNodeCreator extends BaseNodeCreator {
  /**
   * Create a text node from design data
   */
  async create(nodeData: DesignNode): Promise<TextNode> {
    const textNode = figma.createText();
    textNode.name = nodeData.name || 'Text';

    // Load and apply font
    const fontToUse = await this.loadFont(nodeData.fontName);
    textNode.fontName = fontToUse;

    // Set characters (must be after font is set)
    if (nodeData.characters !== undefined && nodeData.characters !== null) {
      textNode.characters = String(nodeData.characters);
    } else {
      textNode.characters = '';
    }

    // Apply text properties
    this.applyTextProperties(textNode, nodeData);

    // Apply fills (text color)
    this.applyFills(textNode, nodeData.fills);

    return textNode;
  }

  private async loadFont(fontName?: { family: string; style: string }): Promise<FontName> {
    const defaultFont = DefaultFonts.INTER;

    if (fontName) {
      try {
        await figma.loadFontAsync(fontName);
        return fontName;
      } catch {
        console.warn(`Failed to load font ${fontName.family} ${fontName.style}, trying default`);
      }
    }

    try {
      await figma.loadFontAsync(defaultFont);
      return defaultFont;
    } catch {
      // Try Arial as last resort
      const arialFont = DefaultFonts.ARIAL;
      await figma.loadFontAsync(arialFont);
      return arialFont;
    }
  }

  private applyTextProperties(textNode: TextNode, nodeData: DesignNode): void {
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

    // Text auto resize
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
}
