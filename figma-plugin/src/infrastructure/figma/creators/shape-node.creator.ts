import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for shape nodes (Ellipse, Polygon, Star, Line)
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

    this.applyFills(ellipseNode, nodeData.fills);
    this.applyStrokes(ellipseNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

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

    this.applyFills(polygonNode, nodeData.fills);
    this.applyStrokes(polygonNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

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

    this.applyFills(starNode, nodeData.fills);
    this.applyStrokes(starNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

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
      this.applyStrokes(lineNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
    } else if (nodeData.fills && nodeData.fills.length > 0) {
      // If no strokes but has fills, use fills as strokes
      this.applyStrokes(lineNode, nodeData.fills, nodeData.strokeWeight || 1, nodeData.strokeAlign);
    } else {
      // Default stroke
      lineNode.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      lineNode.strokeWeight = nodeData.strokeWeight || 1;
    }

    // Stroke caps and joins
    if (nodeData.strokeCap) {
      lineNode.strokeCap = nodeData.strokeCap;
    }

    // Dash pattern
    if (nodeData.dashPattern && Array.isArray(nodeData.dashPattern)) {
      lineNode.dashPattern = nodeData.dashPattern;
    }

    return lineNode;
  }

  /**
   * Create a vector placeholder (vectors require path data which is complex)
   */
  async createVectorPlaceholder(nodeData: DesignNode): Promise<RectangleNode> {
    const vectorPlaceholder = figma.createRectangle();
    vectorPlaceholder.name = `${nodeData.name || 'Vector'} (Vector placeholder)`;

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height, 24);
    vectorPlaceholder.resize(width, height);

    this.applyFills(vectorPlaceholder, nodeData.fills);
    this.applyStrokes(vectorPlaceholder, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

    return vectorPlaceholder;
  }
}
