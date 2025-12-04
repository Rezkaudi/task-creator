import { DesignNode, VectorPath, VectorNetwork, TextSegment, LayoutGrid } from '../../../domain/entities/design-node';
import { Fill } from '../../../domain/entities/fill';
import { Effect } from '../../../domain/entities/effect';

/**
 * Comprehensive Node Exporter
 * Exports all Figma node properties for lossless round-trip
 */
export class NodeExporter {
  private imageCache: Map<string, string> = new Map();

  /**
   * Clear image cache
   */
  clearImageCache(): void {
    this.imageCache.clear();
  }

  /**
   * Export a node with all its properties
   */
  async export(node: SceneNode, layerIndex: number = 0): Promise<DesignNode | null> {
    try {
      switch (node.type) {
        case 'FRAME':
          return this.exportFrame(node, layerIndex);
        case 'GROUP':
          return this.exportGroup(node, layerIndex);
        case 'COMPONENT':
          return this.exportComponent(node, layerIndex);
        case 'COMPONENT_SET':
          return this.exportComponentSet(node, layerIndex);
        case 'INSTANCE':
          return this.exportInstance(node, layerIndex);
        case 'SECTION':
          return this.exportSection(node, layerIndex);
        case 'RECTANGLE':
          return this.exportRectangle(node, layerIndex);
        case 'ELLIPSE':
          return this.exportEllipse(node, layerIndex);
        case 'LINE':
          return this.exportLine(node, layerIndex);
        case 'POLYGON':
          return this.exportPolygon(node, layerIndex);
        case 'STAR':
          return this.exportStar(node, layerIndex);
        case 'VECTOR':
          return this.exportVector(node, layerIndex);
        case 'TEXT':
          return this.exportText(node, layerIndex);
        case 'BOOLEAN_OPERATION':
          return this.exportBooleanOperation(node, layerIndex);
        default:
          console.warn(`Unsupported node type: ${node.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Error exporting node ${node.name}:`, error);
      return null;
    }
  }

  // ==================== CONTAINER NODES ====================

  private async exportFrame(node: FrameNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'FRAME',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getCornerRadiusProperties(node),
      ...this.getAutoLayoutProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      ...this.getGridProperties(node),
      clipsContent: node.clipsContent,
    };

    if (node.children.length > 0) {
      result.children = await this.exportChildren(node.children);
    }

    return result as DesignNode;
  }

  private async exportGroup(node: GroupNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'GROUP',
      ...this.getBlendPropertiesMinimal(node),
    };

    // Groups don't have constraints in Figma API
    if (node.children.length > 0) {
      result.children = await this.exportChildren(node.children);
    }

    return result as DesignNode;
  }

  private async exportComponent(node: ComponentNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'COMPONENT',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getCornerRadiusProperties(node),
      ...this.getAutoLayoutProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      ...this.getGridProperties(node),
      clipsContent: node.clipsContent,
      componentKey: node.key,
    };

    if (node.description) {
      result.componentDescription = node.description;
    }

    // Export component property definitions
    if (node.componentPropertyDefinitions && Object.keys(node.componentPropertyDefinitions).length > 0) {
      result.componentPropertyDefinitions = this.exportComponentPropertyDefinitions(node.componentPropertyDefinitions);
    }

    if (node.children.length > 0) {
      result.children = await this.exportChildren(node.children);
    }

    return result as DesignNode;
  }

  private async exportComponentSet(node: ComponentSetNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'COMPONENT_SET',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getCornerRadiusProperties(node),
      ...this.getAutoLayoutProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      clipsContent: node.clipsContent,
    };

    if (node.children.length > 0) {
      result.children = await this.exportChildren(node.children);
    }

    return result as DesignNode;
  }

  private async exportInstance(node: InstanceNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'INSTANCE',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getCornerRadiusProperties(node),
      ...this.getAutoLayoutProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      clipsContent: node.clipsContent,
    };

    // Store main component reference
    if (node.mainComponent) {
      result.mainComponentId = node.mainComponent.key;
    }

    // Export component property overrides
    if (node.componentProperties && Object.keys(node.componentProperties).length > 0) {
      const componentProps: Record<string, any> = {};
      for (const [key, prop] of Object.entries(node.componentProperties)) {
        componentProps[key] = {
          type: prop.type,
          value: prop.value,
        };
      }
      result.componentProperties = componentProps;
    }

    // Export overrides
    if (node.overrides && node.overrides.length > 0) {
      result.overrides = node.overrides.map(o => ({
        id: o.id,
        overriddenFields: [...o.overriddenFields],
      }));
    }

    return result as DesignNode;
  }

  private async exportSection(node: SectionNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'SECTION',
    };

    // Sections have limited properties
    if ('fills' in node) {
      result.fills = await this.exportFills((node as any).fills);
    }

    if (node.children.length > 0) {
      result.children = await this.exportChildren(node.children);
    }

    return result as DesignNode;
  }

  // ==================== SHAPE NODES ====================

  private async exportRectangle(node: RectangleNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'RECTANGLE',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getCornerRadiusProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
    };

    return result as DesignNode;
  }

  private async exportEllipse(node: EllipseNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'ELLIPSE',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
    };

    // Export arc data for partial ellipses
    if (node.arcData) {
      result.arcData = {
        startingAngle: node.arcData.startingAngle,
        endingAngle: node.arcData.endingAngle,
        innerRadius: node.arcData.innerRadius,
      };
    }

    return result as DesignNode;
  }

  private async exportLine(node: LineNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'LINE',
      ...await this.getStrokesOnly(node),
      ...this.getBlendProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
    };

    return result as DesignNode;
  }

  private async exportPolygon(node: PolygonNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'POLYGON',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      pointCount: node.pointCount,
    };

    return result as DesignNode;
  }

  private async exportStar(node: StarNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'STAR',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      pointCount: node.pointCount,
      innerRadius: node.innerRadius,
    };

    return result as DesignNode;
  }

  private async exportVector(node: VectorNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'VECTOR',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
    };

    // Export vector paths
    if (node.vectorPaths && node.vectorPaths.length > 0) {
      result.vectorPaths = this.exportVectorPaths(node);
    }

    // Export vector network for complex vectors
    if (node.vectorNetwork) {
      result.vectorNetwork = this.exportVectorNetwork(node.vectorNetwork);
    }

    return result as DesignNode;
  }

  private async exportBooleanOperation(node: BooleanOperationNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'BOOLEAN_OPERATION',
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getExportProperties(node),
      booleanOperation: node.booleanOperation,
    };

    // Boolean operations don't have constraints
    if (node.children.length > 0) {
      result.children = await this.exportChildren(node.children);
    }

    return result as DesignNode;
  }

  // ==================== TEXT NODE ====================

  private async exportText(node: TextNode, layerIndex: number): Promise<DesignNode> {
    const result: Partial<DesignNode> = {
      ...this.getBaseProperties(node, layerIndex),
      type: 'TEXT',
      characters: node.characters,
      ...await this.getGeometryProperties(node),
      ...this.getBlendProperties(node),
      ...this.getConstraintProperties(node),
      ...this.getExportProperties(node),
      ...this.getTextProperties(node),
    };

    // Export text segments for mixed styling
    const segments = this.exportTextSegments(node);
    if (segments.length > 1) {
      result.textSegments = segments;
    }

    return result as DesignNode;
  }

  // ==================== PROPERTY EXTRACTORS ====================

  private getBaseProperties(node: SceneNode, layerIndex: number): Partial<DesignNode> {
    const result: Partial<DesignNode> = {
      name: node.name,
      type: node.type as DesignNode['type'],
      x: node.x,
      y: node.y,
      _layerIndex: layerIndex,
    };

    if ('width' in node) result.width = node.width;
    if ('height' in node) result.height = node.height;
    if ('visible' in node && !node.visible) result.visible = false;
    if ('locked' in node && node.locked) result.locked = true;

    // Export rotation if present
    if ('rotation' in node && typeof (node as any).rotation === 'number') {
      const rotation = (node as any).rotation;
      if (rotation !== 0) {
        result.rotation = rotation;
      }
    }

    // Export relative transform for complex positioning
    if ('relativeTransform' in node) {
      const transform = (node as any).relativeTransform;
      if (transform) {
        const isIdentity =
          Math.abs(transform[0][0] - 1) < 0.0001 &&
          Math.abs(transform[0][1]) < 0.0001 &&
          Math.abs(transform[1][0]) < 0.0001 &&
          Math.abs(transform[1][1] - 1) < 0.0001;

        const hasRotation = 'rotation' in node && typeof (node as any).rotation === 'number' && (node as any).rotation !== 0;
        if (!isIdentity || hasRotation) {
          result.relativeTransform = [
            [transform[0][0], transform[0][1], transform[0][2]],
            [transform[1][0], transform[1][1], transform[1][2]],
          ];
        }
      }
    }

    return result;
  }

  private async getGeometryProperties(node: GeometryMixin & MinimalStrokesMixin): Promise<Partial<DesignNode>> {
    const result: Partial<DesignNode> = {};

    // Export fills
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const fills = await this.exportFills(node.fills);
      if (fills.length > 0) {
        result.fills = fills;
      }
    }

    // Export strokes
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
      const strokes = await this.exportFills(node.strokes);
      if (strokes.length > 0) {
        result.strokes = strokes;

        const strokeWeight = (node as any).strokeWeight;
        if (typeof strokeWeight === 'number' && strokeWeight !== 1) {
          result.strokeWeight = strokeWeight;
        }

        if ('strokeAlign' in node) {
          result.strokeAlign = node.strokeAlign as DesignNode['strokeAlign'];
        }

        if ('strokeCap' in node && (node as any).strokeCap !== 'NONE') {
          result.strokeCap = (node as any).strokeCap;
        }

        if ('strokeJoin' in node && (node as any).strokeJoin !== 'MITER') {
          result.strokeJoin = (node as any).strokeJoin;
        }

        if ('dashPattern' in node && (node as any).dashPattern?.length > 0) {
          result.dashPattern = [...(node as any).dashPattern];
        }

        if ('strokeMiterLimit' in node && (node as any).strokeMiterLimit !== 4) {
          result.strokeMiterLimit = (node as any).strokeMiterLimit;
        }
      }
    }

    return result;
  }

  private async getStrokesOnly(node: MinimalStrokesMixin): Promise<Partial<DesignNode>> {
    const result: Partial<DesignNode> = {};

    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
      const strokes = await this.exportFills(node.strokes);
      if (strokes.length > 0) {
        result.strokes = strokes;

        const strokeWeight = (node as any).strokeWeight;
        if (typeof strokeWeight === 'number') {
          result.strokeWeight = strokeWeight;
        }

        if ('strokeAlign' in node) {
          result.strokeAlign = (node as any).strokeAlign as DesignNode['strokeAlign'];
        }
      }
    }

    return result;
  }

  private getBlendProperties(node: BlendMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    if (node.opacity !== 1) {
      result.opacity = node.opacity;
    }

    if (node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') {
      result.blendMode = node.blendMode;
    }

    if ('isMask' in node && (node as any).isMask) {
      result.isMask = true;
    }

    if ('effects' in node && Array.isArray((node as any).effects) && (node as any).effects.length > 0) {
      result.effects = this.exportEffects((node as any).effects);
    }

    return result;
  }

  private getBlendPropertiesMinimal(node: MinimalBlendMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    if (node.opacity !== 1) {
      result.opacity = node.opacity;
    }

    if (node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') {
      result.blendMode = node.blendMode;
    }

    return result;
  }

  private getCornerRadiusProperties(node: CornerMixin | RectangleCornerMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
      if (node.cornerRadius !== 0) {
        // Check for mixed corner radius
        if ('topLeftRadius' in node) {
          const tl = typeof node.topLeftRadius === 'number' ? node.topLeftRadius : 0;
          const tr = typeof (node as any).topRightRadius === 'number' ? (node as any).topRightRadius : 0;
          const bl = typeof (node as any).bottomLeftRadius === 'number' ? (node as any).bottomLeftRadius : 0;
          const br = typeof (node as any).bottomRightRadius === 'number' ? (node as any).bottomRightRadius : 0;

          if (tl !== tr || tl !== bl || tl !== br) {
            result.topLeftRadius = tl;
            result.topRightRadius = tr;
            result.bottomLeftRadius = bl;
            result.bottomRightRadius = br;
          } else {
            result.cornerRadius = node.cornerRadius;
          }
        } else {
          result.cornerRadius = node.cornerRadius;
        }
      }

      if ('cornerSmoothing' in node && (node as any).cornerSmoothing !== 0) {
        result.cornerSmoothing = (node as any).cornerSmoothing;
      }
    }

    return result;
  }

  private getAutoLayoutProperties(node: BaseFrameMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    if (!node.layoutMode || node.layoutMode === 'NONE') {
      return result;
    }

    result.layoutMode = node.layoutMode;

    if (node.primaryAxisSizingMode !== 'AUTO') {
      result.primaryAxisSizingMode = node.primaryAxisSizingMode;
    }

    if (node.counterAxisSizingMode !== 'AUTO') {
      result.counterAxisSizingMode = node.counterAxisSizingMode;
    }

    if (node.primaryAxisAlignItems !== 'MIN') {
      result.primaryAxisAlignItems = node.primaryAxisAlignItems;
    }

    if (node.counterAxisAlignItems !== 'MIN') {
      result.counterAxisAlignItems = node.counterAxisAlignItems;
    }

    if (node.itemSpacing !== 0) {
      result.itemSpacing = node.itemSpacing;
    }

    if (node.paddingTop !== 0) {
      result.paddingTop = node.paddingTop;
    }

    if (node.paddingRight !== 0) {
      result.paddingRight = node.paddingRight;
    }

    if (node.paddingBottom !== 0) {
      result.paddingBottom = node.paddingBottom;
    }

    if (node.paddingLeft !== 0) {
      result.paddingLeft = node.paddingLeft;
    }

    // Layout wrap (for wrap layouts)
    if ('layoutWrap' in node && node.layoutWrap !== 'NO_WRAP') {
      result.layoutWrap = node.layoutWrap;
    }

    if ('counterAxisSpacing' in node && (node as any).counterAxisSpacing !== 0) {
      result.counterAxisSpacing = (node as any).counterAxisSpacing;
    }

    if ('itemReverseZIndex' in node && node.itemReverseZIndex) {
      result.itemReverseZIndex = true;
    }

    return result;
  }

  private getConstraintProperties(node: ConstraintMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    // Only export non-default constraints
    if (node.constraints) {
      const h = node.constraints.horizontal;
      const v = node.constraints.vertical;

      if (h !== 'MIN' || v !== 'MIN') {
        result.constraints = {
          horizontal: h,
          vertical: v,
        };
      }
    }

    if ('layoutAlign' in node && (node as any).layoutAlign !== 'INHERIT') {
      result.layoutAlign = (node as any).layoutAlign;
    }

    if ('layoutGrow' in node && (node as any).layoutGrow !== 0) {
      result.layoutGrow = (node as any).layoutGrow;
    }

    if ('layoutPositioning' in node && (node as any).layoutPositioning !== 'AUTO') {
      result.layoutPositioning = (node as any).layoutPositioning;
    }

    return result;
  }

  private getExportProperties(node: ExportMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    if (node.exportSettings && node.exportSettings.length > 0) {
      result.exportSettings = node.exportSettings.map(setting => {
        const exported: any = {
          format: setting.format,
          suffix: setting.suffix,
          contentsOnly: setting.contentsOnly,
        };

        // Handle constraint for image exports
        if ('constraint' in setting && (setting as any).constraint) {
          exported.constraint = {
            type: (setting as any).constraint.type,
            value: (setting as any).constraint.value,
          };
        }

        return exported;
      });
    }

    return result;
  }

  private getGridProperties(node: BaseFrameMixin): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    // Export guides
    if ('guides' in node && (node as any).guides?.length > 0) {
      result.guides = (node as any).guides.map((guide: Guide) => ({
        axis: guide.axis,
        offset: guide.offset,
      }));
    }

    // Export layout grids
    if (node.layoutGrids && node.layoutGrids.length > 0) {
      result.layoutGrids = node.layoutGrids.map(grid => {
        const exported: LayoutGrid = {
          pattern: grid.pattern,
          sectionSize: grid.sectionSize ?? 0,
          visible: grid.visible,
          color: grid.color ? {
            r: grid.color.r,
            g: grid.color.g,
            b: grid.color.b,
            a: grid.color.a,
          } : { r: 0.9, g: 0.9, b: 0.9, a: 0.1 },
        };

        if (grid.pattern === 'COLUMNS' || grid.pattern === 'ROWS') {
          (exported as any).alignment = grid.alignment;
          (exported as any).gutterSize = grid.gutterSize;
          (exported as any).offset = grid.offset;
          (exported as any).count = grid.count;
        }

        return exported;
      });
    }

    return result;
  }

  private getTextProperties(node: TextNode): Partial<DesignNode> {
    const result: Partial<DesignNode> = {};

    // Font - may be mixed
    const fontName = node.fontName;
    if (fontName !== figma.mixed && fontName) {
      result.fontName = {
        family: fontName.family,
        style: fontName.style,
      };
    }

    const fontSize = node.fontSize;
    if (fontSize !== figma.mixed && typeof fontSize === 'number') {
      result.fontSize = fontSize;
    }

    result.textAlignHorizontal = node.textAlignHorizontal;
    result.textAlignVertical = node.textAlignVertical;

    // Line height
    const lineHeight = node.lineHeight;
    if (lineHeight !== figma.mixed && typeof lineHeight === 'object') {
      result.lineHeight = {
        unit: lineHeight.unit,
        value: lineHeight.unit === 'AUTO' ? 0 : lineHeight.value,
      };
    }

    // Letter spacing
    const letterSpacing = node.letterSpacing;
    if (letterSpacing !== figma.mixed && typeof letterSpacing === 'object') {
      result.letterSpacing = {
        unit: letterSpacing.unit,
        value: letterSpacing.value,
      };
    }

    // Text case
    const textCase = node.textCase;
    if (textCase !== figma.mixed && textCase !== 'ORIGINAL') {
      result.textCase = textCase;
    }

    // Text decoration
    const textDecoration = node.textDecoration;
    if (textDecoration !== figma.mixed && textDecoration !== 'NONE') {
      result.textDecoration = textDecoration;
    }

    result.textAutoResize = node.textAutoResize;

    // Paragraph settings
    if (node.paragraphIndent !== 0) {
      result.paragraphIndent = node.paragraphIndent;
    }

    if (node.paragraphSpacing !== 0) {
      result.paragraphSpacing = node.paragraphSpacing;
    }

    // Hyperlink
    const hyperlink = node.hyperlink;
    if (hyperlink && hyperlink !== figma.mixed && typeof hyperlink === 'object' && 'type' in hyperlink) {
      result.hyperlink = {
        type: (hyperlink as HyperlinkTarget).type,
        value: (hyperlink as any).value || (hyperlink as any).url || '',
      };
    }

    // Text truncation
    if ('textTruncation' in node && (node as any).textTruncation !== 'DISABLED') {
      result.textTruncation = (node as any).textTruncation;
    }

    // Max lines
    if ('maxLines' in node && (node as any).maxLines !== null) {
      result.maxLines = (node as any).maxLines;
    }

    return result;
  }

  // ==================== FILL/STROKE EXPORT ====================

  private async exportFills(paints: readonly Paint[]): Promise<Fill[]> {
    const fills: Fill[] = [];

    for (const paint of paints) {
      const fill = await this.exportPaint(paint);
      if (fill) fills.push(fill);
    }

    return fills;
  }

  private exportFillsSync(paints: readonly Paint[]): Fill[] {
    const fills: Fill[] = [];

    for (const paint of paints) {
      const fill = this.exportPaintSync(paint);
      if (fill) fills.push(fill);
    }

    return fills;
  }

  private async exportPaint(paint: Paint): Promise<Fill | null> {
    const baseFill: Fill = {
      type: paint.type as Fill['type'],
      visible: paint.visible !== false,
      opacity: paint.opacity ?? 1,
      blendMode: paint.blendMode ?? 'NORMAL',
    };

    switch (paint.type) {
      case 'SOLID': {
        const solidPaint = paint as SolidPaint;
        return {
          ...baseFill,
          color: {
            r: solidPaint.color.r,
            g: solidPaint.color.g,
            b: solidPaint.color.b,
          },
        };
      }

      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND': {
        const gradientPaint = paint as GradientPaint;
        return {
          ...baseFill,
          gradientStops: gradientPaint.gradientStops.map(stop => ({
            position: stop.position,
            color: {
              r: stop.color.r,
              g: stop.color.g,
              b: stop.color.b,
              a: stop.color.a,
            },
          })),
          gradientTransform: gradientPaint.gradientTransform
            ? [
                [gradientPaint.gradientTransform[0][0], gradientPaint.gradientTransform[0][1], gradientPaint.gradientTransform[0][2]],
                [gradientPaint.gradientTransform[1][0], gradientPaint.gradientTransform[1][1], gradientPaint.gradientTransform[1][2]],
              ]
            : undefined,
        };
      }

      case 'IMAGE': {
        const imagePaint = paint as ImagePaint;
        const fill: Fill = {
          ...baseFill,
          scaleMode: imagePaint.scaleMode,
        };

        if (imagePaint.imageHash) {
          fill.imageHash = imagePaint.imageHash;

          // Try to get base64 image data
          if (!this.imageCache.has(imagePaint.imageHash)) {
            try {
              const image = figma.getImageByHash(imagePaint.imageHash);
              if (image) {
                const bytes = await image.getBytesAsync();
                const base64 = this.bytesToBase64(bytes);
                this.imageCache.set(imagePaint.imageHash, base64);
              }
            } catch (e) {
              console.warn('Failed to export image:', e);
            }
          }

          if (this.imageCache.has(imagePaint.imageHash)) {
            fill.imageData = this.imageCache.get(imagePaint.imageHash);
          }
        }

        if (imagePaint.imageTransform) {
          fill.imageTransform = [
            [imagePaint.imageTransform[0][0], imagePaint.imageTransform[0][1], imagePaint.imageTransform[0][2]],
            [imagePaint.imageTransform[1][0], imagePaint.imageTransform[1][1], imagePaint.imageTransform[1][2]],
          ];
        }

        if (imagePaint.scalingFactor !== undefined) {
          fill.scalingFactor = imagePaint.scalingFactor;
        }

        if (imagePaint.rotation !== undefined && imagePaint.rotation !== 0) {
          fill.rotation = imagePaint.rotation;
        }

        // Export image filters
        if (imagePaint.filters) {
          fill.filters = {
            exposure: imagePaint.filters.exposure,
            contrast: imagePaint.filters.contrast,
            saturation: imagePaint.filters.saturation,
            temperature: imagePaint.filters.temperature,
            tint: imagePaint.filters.tint,
            highlights: imagePaint.filters.highlights,
            shadows: imagePaint.filters.shadows,
          };
        }

        return fill;
      }

      default:
        return baseFill;
    }
  }

  private exportPaintSync(paint: Paint): Fill | null {
    const baseFill: Fill = {
      type: paint.type as Fill['type'],
      visible: paint.visible !== false,
      opacity: paint.opacity ?? 1,
      blendMode: paint.blendMode ?? 'NORMAL',
    };

    switch (paint.type) {
      case 'SOLID': {
        const solidPaint = paint as SolidPaint;
        return {
          ...baseFill,
          color: {
            r: solidPaint.color.r,
            g: solidPaint.color.g,
            b: solidPaint.color.b,
          },
        };
      }

      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND': {
        const gradientPaint = paint as GradientPaint;
        return {
          ...baseFill,
          gradientStops: gradientPaint.gradientStops.map(stop => ({
            position: stop.position,
            color: {
              r: stop.color.r,
              g: stop.color.g,
              b: stop.color.b,
              a: stop.color.a,
            },
          })),
          gradientTransform: gradientPaint.gradientTransform
            ? [
                [gradientPaint.gradientTransform[0][0], gradientPaint.gradientTransform[0][1], gradientPaint.gradientTransform[0][2]],
                [gradientPaint.gradientTransform[1][0], gradientPaint.gradientTransform[1][1], gradientPaint.gradientTransform[1][2]],
              ]
            : undefined,
        };
      }

      default:
        return baseFill;
    }
  }

  // ==================== EFFECTS EXPORT ====================

  private exportEffects(effects: readonly Effect[]): Effect[] {
    return effects.map(effect => {
      const base: Effect = {
        type: effect.type,
        visible: effect.visible !== false,
      };

      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        const shadowEffect = effect as DropShadowEffect | InnerShadowEffect;

        base.radius = shadowEffect.radius;

        base.color = {
          r: shadowEffect.color.r,
          g: shadowEffect.color.g,
          b: shadowEffect.color.b,
          a: shadowEffect.color.a,
        };

        base.offset = {
          x: shadowEffect.offset.x,
          y: shadowEffect.offset.y,
        };

        base.spread = shadowEffect.spread;

        if (shadowEffect.blendMode) {
          base.blendMode = shadowEffect.blendMode;
        }

        if (effect.type === 'DROP_SHADOW' && 'showShadowBehindNode' in shadowEffect) {
          base.showShadowBehindNode = (shadowEffect as DropShadowEffect).showShadowBehindNode;
        }
      } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
        base.radius = (effect as any).radius;
      }

      return base;
    });
  }

  // ==================== VECTOR EXPORT ====================

  private exportVectorPaths(node: VectorNode): VectorPath[] {
    return node.vectorPaths.map(path => ({
      windingRule: path.windingRule === 'NONE' ? 'NONZERO' : path.windingRule,
      data: path.data,
    }));
  }

  private exportVectorNetwork(network: { vertices: readonly any[]; segments: readonly any[]; regions?: readonly any[] }): VectorNetwork {
    const result: VectorNetwork = {
      vertices: network.vertices.map(v => ({
        x: v.x,
        y: v.y,
        strokeCap: v.strokeCap,
        strokeJoin: v.strokeJoin,
        cornerRadius: v.cornerRadius,
        handleMirroring: v.handleMirroring,
      })),
      segments: network.segments.map(s => ({
        start: s.start,
        end: s.end,
        tangentStart: s.tangentStart ? { x: s.tangentStart.x, y: s.tangentStart.y } : undefined,
        tangentEnd: s.tangentEnd ? { x: s.tangentEnd.x, y: s.tangentEnd.y } : undefined,
      })),
    };

    if (network.regions && network.regions.length > 0) {
      result.regions = network.regions.map(r => ({
        windingRule: r.windingRule,
        loops: r.loops,
      }));
    }

    return result;
  }

  // ==================== TEXT SEGMENTS ====================

  private exportTextSegments(node: TextNode): TextSegment[] {
    const text = node.characters;
    if (!text || text.length === 0) return [];

    const segments: TextSegment[] = [];
    let currentSegment: TextSegment | null = null;

    for (let i = 0; i < text.length; i++) {
      const style = this.getCharacterStyle(node, i);

      if (!currentSegment) {
        currentSegment = { start: i, end: i + 1, ...style };
      } else if (this.stylesMatch(currentSegment, style)) {
        // Update end position without spreading
        currentSegment = {
          ...currentSegment,
          end: i + 1,
        } as TextSegment;
      } else {
        segments.push(currentSegment);
        currentSegment = { start: i, end: i + 1, ...style };
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }

  private getCharacterStyle(node: TextNode, index: number): Partial<TextSegment> {
    const style: Partial<TextSegment> = {};

    try {
      const fontName = node.getRangeFontName(index, index + 1);
      if (fontName !== figma.mixed && fontName) {
        style.fontName = { family: fontName.family, style: fontName.style };
      }

      const fontSize = node.getRangeFontSize(index, index + 1);
      if (fontSize !== figma.mixed && typeof fontSize === 'number') {
        style.fontSize = fontSize;
      }

      const textCase = node.getRangeTextCase(index, index + 1);
      if (textCase !== figma.mixed) {
        style.textCase = textCase;
      }

      const textDecoration = node.getRangeTextDecoration(index, index + 1);
      if (textDecoration !== figma.mixed) {
        style.textDecoration = textDecoration;
      }

      const lineHeight = node.getRangeLineHeight(index, index + 1);
      if (lineHeight !== figma.mixed && typeof lineHeight === 'object') {
        style.lineHeight = {
          unit: lineHeight.unit,
          value: lineHeight.unit === 'AUTO' ? 0 : lineHeight.value,
        };
      }

      const letterSpacing = node.getRangeLetterSpacing(index, index + 1);
      if (letterSpacing !== figma.mixed && typeof letterSpacing === 'object') {
        style.letterSpacing = {
          unit: letterSpacing.unit,
          value: letterSpacing.value,
        };
      }

      const fills = node.getRangeFills(index, index + 1);
      if (fills !== figma.mixed && Array.isArray(fills)) {
        style.fills = this.exportFillsSync(fills as Paint[]);
      }
    } catch (e) {
      // Ignore range errors
    }

    return style;
  }

  private stylesMatch(a: Partial<TextSegment>, b: Partial<TextSegment>): boolean {
    return (
      JSON.stringify(a.fontName) === JSON.stringify(b.fontName) &&
      a.fontSize === b.fontSize &&
      a.textCase === b.textCase &&
      a.textDecoration === b.textDecoration &&
      JSON.stringify(a.lineHeight) === JSON.stringify(b.lineHeight) &&
      JSON.stringify(a.letterSpacing) === JSON.stringify(b.letterSpacing) &&
      JSON.stringify(a.fills) === JSON.stringify(b.fills)
    );
  }

  // ==================== COMPONENT PROPERTIES ====================

  private exportComponentPropertyDefinitions(
    definitions: ComponentPropertyDefinitions
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, def] of Object.entries(definitions)) {
      result[key] = {
        type: def.type,
        defaultValue: def.defaultValue,
      };

      if ('variantOptions' in def) {
        result[key].variantOptions = def.variantOptions;
      }

      if ('preferredValues' in def) {
        result[key].preferredValues = def.preferredValues;
      }
    }

    return result;
  }

  // ==================== CHILDREN EXPORT ====================

  private async exportChildren(children: readonly SceneNode[]): Promise<DesignNode[]> {
    const result: DesignNode[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const exported = await this.export(child, i);
      if (exported) {
        result.push(exported);
      }
    }

    return result;
  }

  // ==================== UTILITIES ====================

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
