import { DesignNode, VectorPath, VectorNetwork } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for shape nodes (Ellipse, Polygon, Star, Line, Vector)
 */
export class ShapeNodeCreator extends BaseNodeCreator {
  /**
   * Create an ellipse node
   */
  async createEllipse(nodeData: DesignNode): Promise<EllipseNode> {
    const ellipseNode = figma.createEllipse();
    ellipseNode.name = nodeData.name || 'Ellipse';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    ellipseNode.resize(width, height);

    await this.applyFillsAsync(ellipseNode, nodeData.fills);
    await this.applyStrokesAsync(
      ellipseNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );

    // Arc data for partial ellipses
    if (nodeData.arcData) {
      ellipseNode.arcData = {
        startingAngle: nodeData.arcData.startingAngle || 0,
        endingAngle: nodeData.arcData.endingAngle || 2 * Math.PI,
        innerRadius: nodeData.arcData.innerRadius || 0,
      };
    }

    return ellipseNode;
  }

  /**
   * Create a polygon node
   */
  async createPolygon(nodeData: DesignNode): Promise<PolygonNode> {
    const polygonNode = figma.createPolygon();
    polygonNode.name = nodeData.name || 'Polygon';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    polygonNode.resize(width, height);

    if (typeof nodeData.pointCount === 'number' && nodeData.pointCount >= 3) {
      polygonNode.pointCount = nodeData.pointCount;
    }

    await this.applyFillsAsync(polygonNode, nodeData.fills);
    await this.applyStrokesAsync(
      polygonNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );

    return polygonNode;
  }

  /**
   * Create a star node
   */
  async createStar(nodeData: DesignNode): Promise<StarNode> {
    const starNode = figma.createStar();
    starNode.name = nodeData.name || 'Star';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    starNode.resize(width, height);

    if (typeof nodeData.pointCount === 'number' && nodeData.pointCount >= 3) {
      starNode.pointCount = nodeData.pointCount;
    }
    if (typeof nodeData.innerRadius === 'number') {
      starNode.innerRadius = nodeData.innerRadius;
    }

    await this.applyFillsAsync(starNode, nodeData.fills);
    await this.applyStrokesAsync(
      starNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );

    return starNode;
  }

  /**
   * Create a line node
   */
  async createLine(nodeData: DesignNode): Promise<LineNode> {
    const lineNode = figma.createLine();
    lineNode.name = nodeData.name || 'Line';

    // Lines are resized differently - width is the length
    const width = Math.max(1, nodeData.width || 100);
    lineNode.resize(width, 0);

    // Lines typically use strokes, not fills
    if (nodeData.strokes && nodeData.strokes.length > 0) {
      await this.applyStrokesAsync(
        lineNode,
        nodeData.strokes,
        nodeData.strokeWeight,
        nodeData.strokeAlign,
        nodeData.strokeCap,
        nodeData.strokeJoin,
        nodeData.dashPattern,
        nodeData.strokeMiterLimit
      );
    } else if (nodeData.fills && nodeData.fills.length > 0) {
      // If no strokes but has fills, use fills as strokes
      await this.applyStrokesAsync(
        lineNode,
        nodeData.fills,
        nodeData.strokeWeight || 1,
        nodeData.strokeAlign,
        nodeData.strokeCap,
        nodeData.strokeJoin,
        nodeData.dashPattern,
        nodeData.strokeMiterLimit
      );
    } else {
      // Default stroke
      lineNode.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      lineNode.strokeWeight = nodeData.strokeWeight || 1;
    }

    // Stroke caps
    if (nodeData.strokeCap) {
      lineNode.strokeCap = nodeData.strokeCap as StrokeCap;
    }

    // Dash pattern
    if (nodeData.dashPattern && Array.isArray(nodeData.dashPattern)) {
      lineNode.dashPattern = nodeData.dashPattern;
    }

    return lineNode;
  }

  /**
   * Create a vector node with full path support
   */
  async createVector(nodeData: DesignNode): Promise<VectorNode> {
    const vectorNode = figma.createVector();
    vectorNode.name = nodeData.name || 'Vector';

    // Apply vector paths if available
    if (nodeData.vectorPaths && nodeData.vectorPaths.length > 0) {
      this.applyVectorPaths(vectorNode, nodeData.vectorPaths);
    } else if (nodeData.vectorNetwork) {
      this.applyVectorNetwork(vectorNode, nodeData.vectorNetwork);
    } else {
      // Default size if no paths
      const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height, 24);
      vectorNode.resize(width, height);
    }

    await this.applyFillsAsync(vectorNode, nodeData.fills);
    await this.applyStrokesAsync(
      vectorNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );

    return vectorNode;
  }

  /**
   * Create a vector placeholder (for vectors without path data)
   */
  async createVectorPlaceholder(nodeData: DesignNode): Promise<RectangleNode> {
    const vectorPlaceholder = figma.createRectangle();
    vectorPlaceholder.name = `${nodeData.name || 'Vector'} (Vector placeholder)`;

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height, 24);
    vectorPlaceholder.resize(width, height);

    await this.applyFillsAsync(vectorPlaceholder, nodeData.fills);
    await this.applyStrokesAsync(
      vectorPlaceholder,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );

    return vectorPlaceholder;
  }

  /**
   * Apply vector paths to a vector node
   */
  private applyVectorPaths(vectorNode: VectorNode, paths: VectorPath[]): void {
    try {
      vectorNode.vectorPaths = paths.map(path => ({
        windingRule: path.windingRule,
        data: path.data,
      }));
    } catch (error) {
      console.warn('Error applying vector paths:', error);
    }
  }

  /**
   * Apply vector network to a vector node
   */
  private applyVectorNetwork(vectorNode: VectorNode, network: VectorNetwork): void {
    try {
      const figmaNetwork: VectorNetwork = {
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
        regions: network.regions?.map(r => ({
          windingRule: r.windingRule,
          loops: r.loops,
        })),
      };

      vectorNode.vectorNetwork = figmaNetwork as any;
    } catch (error) {
      console.warn('Error applying vector network:', error);
    }
  }
}
