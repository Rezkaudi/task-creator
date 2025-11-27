import { DesignNode, hasChildren } from '../../domain/entities/design-node';

/**
 * Service for parsing raw design data into DesignNode entities
 */
export class DesignDataParser {
  /**
   * Parse raw data into DesignNode array
   */
  parse(rawData: unknown): DesignNode[] {
    let data = this.unwrapData(rawData);
    const nodesToCreate = Array.isArray(data) ? data : [data];
    return nodesToCreate.filter(
      (node): node is DesignNode => node !== null && typeof node === 'object'
    );
  }

  /**
   * Parse AI response format into DesignNode array
   */
  parseAIResponse(rawData: unknown): DesignNode[] {
    let data = this.unwrapAIResponse(rawData);

    if (Array.isArray(data)) {
      return data.filter(
        (node): node is DesignNode => node !== null && typeof node === 'object'
      );
    }

    // If it's a single frame with multiple children, treat children as separate pages
    if (this.isMultiPageFrame(data)) {
      return (data as DesignNode).children || [];
    }

    if (data && typeof data === 'object' && 'type' in data) {
      return [data as DesignNode];
    }

    return [];
  }

  /**
   * Unwrap common data wrappers
   */
  private unwrapData(data: unknown): unknown {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;

      if ('data' in obj) return obj.data;
      if ('design' in obj) return obj.design;
      if ('result' in obj) return obj.result;
    }

    return data;
  }

  /**
   * Unwrap AI response wrappers
   */
  private unwrapAIResponse(data: unknown): unknown {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;

      if ('design' in obj) return obj.design;
      if ('data' in obj) return obj.data;
      if ('result' in obj) return obj.result;
      if ('figmaDesign' in obj) return obj.figmaDesign;
    }

    return data;
  }

  /**
   * Check if data represents a multi-page frame
   */
  private isMultiPageFrame(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;

    const node = data as DesignNode;
    return (
      node.type === 'FRAME' &&
      hasChildren(node) &&
      node.children!.length > 1
    );
  }
}
