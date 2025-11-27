import { DesignNode } from '../../../domain/entities/design-node';
import { Fill } from '../../../domain/entities/fill';
import { FillMapper } from '../../mappers/fill.mapper';
import { EffectMapper } from '../../mappers/effect.mapper';
import { NodeTypeMapper } from '../../mappers/node-type.mapper';
import { Effect } from '../../../domain/entities/effect';

/**
 * Exporter for converting Figma nodes to DesignNode entities
 */
export class NodeExporter {
  /**
   * Export a Figma node to a DesignNode entity
   */
  export(node: SceneNode): DesignNode | null {
    try {
      switch (node.type) {
        case 'FRAME':
        case 'GROUP':
        case 'COMPONENT':
        case 'COMPONENT_SET':
        case 'INSTANCE':
          return this.exportFrameLike(node as FrameNode | GroupNode | ComponentNode | InstanceNode);
        case 'RECTANGLE':
          return this.exportRectangle(node as RectangleNode);
        case 'TEXT':
          return this.exportText(node as TextNode);
        case 'ELLIPSE':
          return this.exportEllipse(node as EllipseNode);
        case 'LINE':
          return this.exportLine(node as LineNode);
        case 'POLYGON':
          return this.exportPolygon(node as PolygonNode);
        case 'STAR':
          return this.exportStar(node as StarNode);
        case 'VECTOR':
          return this.exportVector(node as VectorNode);
        case 'BOOLEAN_OPERATION':
          return this.exportBooleanOperation(node as BooleanOperationNode);
        default:
          console.warn(`Unsupported node type: ${node.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Error exporting node ${node.name}:`, error);
      return null;
    }
  }

  private exportFrameLike(
    node: FrameNode | GroupNode | ComponentNode | InstanceNode
  ): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = 'fills' in node ? FillMapper.toEntity(node.fills as readonly Paint[]) : null;
    const strokes = 'strokes' in node ? FillMapper.toEntity(node.strokes as readonly Paint[]) : null;
    const effects = 'effects' in node ? EffectMapper.toEntity(node.effects as unknown as Effect[]) : null;

    // Handle strokeWeight which can be number | PluginAPI['mixed']
    const strokeWeight = this.getStrokeWeight(node);

    // Only get corner radius and layout for nodes that support it
    const cornerRadius = this.hasCornerRadius(node) 
      ? this.getCornerRadius(node as FrameNode | ComponentNode) 
      : {};
    
    const layoutProps = this.hasLayoutMode(node) 
      ? this.getLayoutProperties(node as FrameNode | ComponentNode) 
      : {};

    return this.buildDesignNode({
      ...baseProps,
      type: NodeTypeMapper.toDomain(node.type),
      fills,
      strokes,
      strokeWeight,
      strokeAlign: 'strokeAlign' in node ? node.strokeAlign : undefined,
      effects,
      ...cornerRadius,
      ...layoutProps,
      clipsContent: 'clipsContent' in node ? node.clipsContent : undefined,
      constraints: 'constraints' in node ? node.constraints : undefined,
      ...this.getOpacityAndBlendMode(node),
      children: this.exportChildren(node),
    });
  }

  private exportRectangle(node: RectangleNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const effects = EffectMapper.toEntity(node.effects as unknown as Effect[]);
    const strokeWeight = this.getStrokeWeight(node);

    return this.buildDesignNode({
      ...baseProps,
      type: 'RECTANGLE',
      fills,
      strokes,
      strokeWeight,
      ...this.getCornerRadius(node),
      effects,
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
    });
  }

  private exportText(node: TextNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);

    return this.buildDesignNode({
      ...baseProps,
      type: 'TEXT',
      characters: node.characters,
      fills,
      ...this.getTextProperties(node),
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
    });
  }

  private exportEllipse(node: EllipseNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const effects = EffectMapper.toEntity(node.effects as unknown as Effect[]);
    const strokeWeight = this.getStrokeWeight(node);

    return this.buildDesignNode({
      ...baseProps,
      type: 'ELLIPSE',
      fills,
      strokes,
      strokeWeight,
      effects,
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
      arcData: node.arcData,
    });
  }

  private exportLine(node: LineNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const strokeWeight = this.getStrokeWeight(node);
    
    // Handle strokeCap which can be mixed
    const strokeCap = node.strokeCap !== figma.mixed ? node.strokeCap : undefined;

    return this.buildDesignNode({
      ...baseProps,
      type: 'LINE',
      width: node.width,
      height: 0,
      strokes,
      strokeWeight,
      strokeCap: strokeCap as DesignNode['strokeCap'],
      dashPattern: node.dashPattern.length > 0 ? [...node.dashPattern] : undefined,
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
    });
  }

  private exportPolygon(node: PolygonNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const strokeWeight = this.getStrokeWeight(node);

    return this.buildDesignNode({
      ...baseProps,
      type: 'POLYGON',
      fills,
      strokes,
      strokeWeight,
      pointCount: node.pointCount,
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
    });
  }

  private exportStar(node: StarNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const strokeWeight = this.getStrokeWeight(node);

    return this.buildDesignNode({
      ...baseProps,
      type: 'STAR',
      fills,
      strokes,
      strokeWeight,
      pointCount: node.pointCount,
      innerRadius: node.innerRadius,
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
    });
  }

  private exportVector(node: VectorNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const strokeWeight = this.getStrokeWeight(node);

    return this.buildDesignNode({
      ...baseProps,
      type: 'VECTOR',
      fills,
      strokes,
      strokeWeight,
      ...this.getOpacityAndBlendMode(node),
      constraints: node.constraints,
    });
  }

  private exportBooleanOperation(node: BooleanOperationNode): DesignNode {
    const baseProps = this.getBaseProperties(node);
    const fills = FillMapper.toEntity(node.fills as readonly Paint[]);
    const strokes = FillMapper.toEntity(node.strokes as readonly Paint[]);
    const effects = EffectMapper.toEntity(node.effects as unknown as Effect[]);
    const strokeWeight = this.getStrokeWeight(node);

    return this.buildDesignNode({
      ...baseProps,
      type: 'BOOLEAN_OPERATION',
      fills,
      strokes,
      strokeWeight,
      effects,
      ...this.getOpacityAndBlendMode(node),
      children: this.exportChildren(node),
    });
  }

  private getBaseProperties(node: SceneNode): Pick<DesignNode, 'name' | 'x' | 'y' | 'width' | 'height'> {
    return {
      name: node.name,
      x: node.x,
      y: node.y,
      width: 'width' in node ? node.width : 0,
      height: 'height' in node ? node.height : 0,
    };
  }

  /**
   * Get stroke weight, handling mixed values
   */
  private getStrokeWeight(node: SceneNode): number | undefined {
    if (!('strokeWeight' in node)) return undefined;
    const weight = (node as GeometryMixin).strokeWeight;
    // strokeWeight can be number | PluginAPI['mixed'] (symbol)
    if (typeof weight === 'number') {
      return weight;
    }
    return undefined;
  }

  /**
   * Check if node has corner radius property
   */
  private hasCornerRadius(node: SceneNode): boolean {
    return 'cornerRadius' in node;
  }

  /**
   * Check if node has layout mode property
   */
  private hasLayoutMode(node: SceneNode): boolean {
    return 'layoutMode' in node;
  }

  private getCornerRadius(
    node: FrameNode | RectangleNode | ComponentNode
  ): Partial<DesignNode> {
    if (!('cornerRadius' in node)) return {};

    if (node.cornerRadius === figma.mixed) {
      return {
        topLeftRadius: node.topLeftRadius,
        topRightRadius: node.topRightRadius,
        bottomLeftRadius: node.bottomLeftRadius,
        bottomRightRadius: node.bottomRightRadius,
      };
    }

    if (node.cornerRadius > 0) {
      return { cornerRadius: node.cornerRadius };
    }

    return {};
  }

  private getLayoutProperties(
    node: FrameNode | ComponentNode
  ): Partial<DesignNode> {
    if (!('layoutMode' in node) || node.layoutMode === 'NONE') {
      return {};
    }

    return {
      layoutMode: node.layoutMode,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      primaryAxisSizingMode: node.primaryAxisSizingMode,
      counterAxisSizingMode: node.counterAxisSizingMode,
      itemSpacing: node.itemSpacing,
      paddingTop: node.paddingTop,
      paddingRight: node.paddingRight,
      paddingBottom: node.paddingBottom,
      paddingLeft: node.paddingLeft,
    };
  }

  private getTextProperties(node: TextNode): Partial<DesignNode> {
    const result: Record<string, unknown> = {};

    // Font
    if (node.fontName !== figma.mixed) {
      result.fontName = {
        family: node.fontName.family,
        style: node.fontName.style,
      };
    }

    // Font size
    if (node.fontSize !== figma.mixed) {
      result.fontSize = node.fontSize;
    }

    // Alignment
    result.textAlignHorizontal = node.textAlignHorizontal;
    result.textAlignVertical = node.textAlignVertical;

    // Line height
    if (node.lineHeight !== figma.mixed) {
      result.lineHeight = node.lineHeight;
    }

    // Letter spacing
    if (node.letterSpacing !== figma.mixed) {
      result.letterSpacing = node.letterSpacing;
    }

    // Text case and decoration
    if (node.textCase !== figma.mixed && node.textCase !== 'ORIGINAL') {
      result.textCase = node.textCase;
    }
    if (node.textDecoration !== figma.mixed && node.textDecoration !== 'NONE') {
      result.textDecoration = node.textDecoration;
    }

    // Auto resize
    result.textAutoResize = node.textAutoResize;

    return result as Partial<DesignNode>;
  }

  private getOpacityAndBlendMode(node: SceneNode & MinimalBlendMixin): Partial<DesignNode> {
    const result: Record<string, unknown> = {};

    if (node.opacity !== 1) {
      result.opacity = node.opacity;
    }
    if (node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') {
      result.blendMode = node.blendMode;
    }

    return result as Partial<DesignNode>;
  }

  private exportChildren(node: { children: readonly SceneNode[] }): DesignNode[] | undefined {
    if (!node.children || node.children.length === 0) {
      return undefined;
    }

    const exportedChildren: DesignNode[] = [];

    for (const child of node.children) {
      const exported = this.export(child);
      if (exported) {
        exportedChildren.push(exported);
      }
    }

    return exportedChildren.length > 0 ? exportedChildren : undefined;
  }

  /**
   * Build a DesignNode, filtering out null/undefined values
   */
  private buildDesignNode(props: Record<string, unknown>): DesignNode {
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }

    return cleaned as unknown as DesignNode;
  }
}
