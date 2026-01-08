// figma-plugin/src/infrastructure/figma/creators/icon-node.creator.ts

import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

export class IconNodeCreator extends BaseNodeCreator {
  
  async create(nodeData: DesignNode): Promise<VectorNode | FrameNode> {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  IconNodeCreator.create() CALLED                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`📝 Node Name: ${nodeData.name}`);
    console.log(`📝 Node Type: ${nodeData.type}`);
    console.log(`📝 Has vectorPaths: ${!!nodeData.vectorPaths}`);
    console.log(`📝 Paths count: ${nodeData.vectorPaths?.length || 0}`);

    // ✅ Check if we have valid vector paths
    if (!nodeData.vectorPaths || nodeData.vectorPaths.length === 0) {
      console.warn(`⚠️ No vector paths for ${nodeData.name}, creating placeholder`);
      return this.createPlaceholder(nodeData.name || 'Icon', nodeData.width || 24);
    }

    // ✅ Log path data
    console.log(`\n📊 Vector Path Data:`);
    nodeData.vectorPaths.forEach((path, i) => {
      console.log(`  Path ${i + 1}:`);
      console.log(`    - Winding Rule: ${path.windingRule || 'NONZERO'}`);
      console.log(`    - Data Length: ${path.data?.length || 0} chars`);
      console.log(`    - Data Preview: ${path.data?.substring(0, 60)}...`);
    });

    try {
      console.log(`\n🔨 Creating Figma VectorNode...`);
      const vectorNode = figma.createVector();
      vectorNode.name = nodeData.name || 'Icon';
      console.log(`✅ VectorNode created with name: ${vectorNode.name}`);

      // Set dimensions
      const width = nodeData.width || 24;
      const height = nodeData.height || 24;
      
      console.log(`📏 Setting dimensions: ${width}x${height}`);
      vectorNode.resize(width, height);

      // Apply position
      if (typeof nodeData.x === 'number') {
        vectorNode.x = nodeData.x;
        console.log(`📍 Position X: ${nodeData.x}`);
      }
      if (typeof nodeData.y === 'number') {
        vectorNode.y = nodeData.y;
        console.log(`📍 Position Y: ${nodeData.y}`);
      }

      // ✅ CRITICAL: Apply vector paths
      console.log(`\n🎨 Applying vector paths...`);
      await this.applyVectorPathsSafely(vectorNode, nodeData.vectorPaths);

      // Apply fills
      console.log(`\n🎨 Applying fills...`);
      if (nodeData.fills && nodeData.fills.length > 0) {
        console.log(`  Using provided fills (${nodeData.fills.length} fills)`);
        await this.applyFillsAsync(vectorNode, nodeData.fills);
      } else {
        console.log(`  Applying default black fill`);
        vectorNode.fills = [{
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 },
          opacity: 1
        }];
      }

      // Apply other properties
      if (typeof nodeData.opacity === 'number') {
        vectorNode.opacity = nodeData.opacity;
        console.log(`  Opacity: ${nodeData.opacity}`);
      }

      if (nodeData.blendMode) {
        vectorNode.blendMode = nodeData.blendMode as BlendMode;
        console.log(`  Blend Mode: ${nodeData.blendMode}`);
      }

      if (typeof nodeData.visible === 'boolean') {
        vectorNode.visible = nodeData.visible;
        console.log(`  Visible: ${nodeData.visible}`);
      }

      console.log(`\n✅ Icon node created successfully!`);
      console.log(`   Name: ${vectorNode.name}`);
      console.log(`   Type: ${vectorNode.type}`);
      console.log(`   Size: ${vectorNode.width}x${vectorNode.height}`);
      console.log(`   Vector paths: ${vectorNode.vectorPaths?.length || 0}`);
      console.log('╚═══════════════════════════════════════════════════════╝\n');

      return vectorNode;

    } catch (error) {
      console.error(`\n❌ ERROR in IconNodeCreator.create():`);
      console.error(`   Node: ${nodeData.name}`);
      console.error(`   Error:`, error);
      console.error(`   Stack:`, error instanceof Error ? error.stack : 'N/A');
      console.log('╚═══════════════════════════════════════════════════════╝\n');
      
      return this.createPlaceholder(nodeData.name || 'Icon', nodeData.width || 24);
    }
  }

  /**
   * ✅ CRITICAL: Apply vector paths with maximum safety and logging
   */
  private async applyVectorPathsSafely(
    node: VectorNode,
    paths: Array<{ windingRule?: string; data: string }>
  ): Promise<void> {
    console.log(`  🔧 applyVectorPathsSafely() called`);
    console.log(`     Input paths count: ${paths.length}`);

    try {
      // Validate and clean paths
      const validPaths: VectorPath[] = [];
      
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        console.log(`\n     Validating path ${i + 1}/${paths.length}:`);
        
        if (!path) {
          console.warn(`       ⚠️ Path is null/undefined, skipping`);
          continue;
        }
        
        if (!path.data) {
          console.warn(`       ⚠️ Path has no data, skipping`);
          continue;
        }
        
        const trimmedData = path.data.trim();
        if (trimmedData.length === 0) {
          console.warn(`       ⚠️ Path data is empty after trim, skipping`);
          continue;
        }
        
        // Check if starts with valid SVG command
        if (!/^[MmLlHhVvCcSsQqTtAaZz]/.test(trimmedData)) {
          console.warn(`       ⚠️ Path doesn't start with SVG command: ${trimmedData.substring(0, 30)}`);
          continue;
        }
        
        console.log(`       ✅ Path valid`);
        console.log(`          Data length: ${trimmedData.length}`);
        console.log(`          Winding rule: ${path.windingRule || 'NONZERO'}`);
        
        validPaths.push({
          windingRule: (path.windingRule as 'NONZERO' | 'EVENODD') || 'NONZERO',
          data: trimmedData
        });
      }

      if (validPaths.length === 0) {
        throw new Error('No valid vector paths after validation');
      }

      console.log(`\n     ✅ Validation complete: ${validPaths.length} valid paths`);
      console.log(`     🎨 Setting vectorPaths property...`);
      
      // Apply to node
      node.vectorPaths = validPaths;
      
      console.log(`     ✅ vectorPaths set successfully`);
      console.log(`     📊 Node now has ${node.vectorPaths.length} paths`);
      
      // Force redraw
      const w = node.width;
      const h = node.height;
      console.log(`     🔄 Forcing redraw (resize ${w}x${h})...`);
      node.resize(w, h);
      console.log(`     ✅ Redraw complete`);
      
    } catch (error) {
      console.error(`\n     ❌ ERROR in applyVectorPathsSafely:`);
      console.error(`        Error:`, error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Apply vector paths with better error handling
   */
  private async applyVectorPaths(
    node: VectorNode,
    paths: Array<{ windingRule?: string; data: string }>
  ): Promise<void> {
    try {
      const vectorPaths: VectorPath[] = paths
        .filter(path => path && path.data) // Filter out invalid paths
        .map(path => ({
          windingRule: (path.windingRule as 'NONZERO' | 'EVENODD') || 'NONZERO',
          data: path.data.trim() // Trim whitespace
        }));

      if (vectorPaths.length === 0) {
        throw new Error('No valid vector paths');
      }

      node.vectorPaths = vectorPaths;
      
      // ✅ Force redraw
      node.resize(node.width, node.height);
      
    } catch (error) {
      console.error('Error applying vector paths:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Better placeholder for failed icons
   */
  private createPlaceholder(keyword: string, size: number = 24): FrameNode {
    const placeholder = figma.createFrame();
    placeholder.name = `Icon: ${keyword}`;
    placeholder.resize(size, size);
    
    // Light gray background
    placeholder.fills = [{
      type: 'SOLID',
      color: { r: 0.88, g: 0.88, b: 0.88 }
    }];

    placeholder.cornerRadius = 4;

    // Add text label
    const label = figma.createText();
    label.name = 'Label';
    
    // Get first 2 chars of keyword
    const chars = keyword.substring(0, 2).toUpperCase();
    
    // Load font async
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
      .then(() => {
        label.fontName = { family: 'Inter', style: 'Medium' };
        label.characters = chars;
        label.fontSize = Math.max(8, size / 2);
        label.textAlignHorizontal = 'CENTER';
        label.textAlignVertical = 'CENTER';
        label.resize(size, size);
        label.x = 0;
        label.y = 0;
        placeholder.appendChild(label);
      })
      .catch((error) => {
        console.warn('Could not load font for placeholder:', error);
        // Still create without text
      });

    return placeholder;
  }

  /**
   * ✅ NEW: Validate vector path data
   */
  private isValidSVGPath(pathData: string): boolean {
    if (!pathData || typeof pathData !== 'string') {
      return false;
    }

    // Check if it starts with valid SVG path commands
    const svgCommands = /^[MmLlHhVvCcSsQqTtAaZz\s\d.,\-]+$/;
    return svgCommands.test(pathData.trim());
  }

  /**
   * ✅ NEW: Create from SVG string
   */
  async createFromSVG(
    svgString: string,
    name: string = 'Icon',
    size: number = 24
  ): Promise<VectorNode | FrameNode> {
    try {
      const paths = this.extractPathsFromSVG(svgString);
      
      if (paths.length === 0) {
        console.warn('No paths found in SVG');
        return this.createPlaceholder(name, size);
      }

      const vectorNode = figma.createVector();
      vectorNode.name = name;
      vectorNode.resize(size, size);

      await this.applyVectorPaths(vectorNode, paths);

      // Default icon styling
      vectorNode.fills = [{
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0 },
        opacity: 1
      }];

      return vectorNode;
    } catch (error) {
      console.error('Error creating icon from SVG:', error);
      return this.createPlaceholder(name, size);
    }
  }

  /**
   * ✅ FIXED: Better SVG path extraction
   */
  private extractPathsFromSVG(svgString: string): Array<{ windingRule: string; data: string }> {
    const paths: Array<{ windingRule: string; data: string }> = [];
    
    // Match both self-closing and regular path tags
    const pathRegex = /<path[^>]*\sd="([^"]*)"[^>]*\/?>/gi;
    let match;

    while ((match = pathRegex.exec(svgString)) !== null) {
      const pathData = match[1];
      if (pathData && this.isValidSVGPath(pathData)) {
        paths.push({
          windingRule: 'NONZERO',
          data: pathData
        });
      }
    }

    return paths;
  }
}