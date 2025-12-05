import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Registry for tracking components during import
 */
export class ComponentRegistry {
  private components: Map<string, ComponentNode> = new Map();
  private pendingInstances: Map<string, { nodeData: DesignNode; parent?: SceneNode; callback: (node: SceneNode) => void }[]> = new Map();

  /**
   * Register a component
   */
  registerComponent(key: string, component: ComponentNode): void {
    this.components.set(key, component);

    // Process any pending instances for this component
    const pending = this.pendingInstances.get(key);
    if (pending) {
      for (const { nodeData, parent, callback } of pending) {
        try {
          const instance = component.createInstance();
          instance.name = nodeData.name || 'Instance';
          callback(instance);
        } catch (error) {
          console.warn('Error creating pending instance:', error);
        }
      }
      this.pendingInstances.delete(key);
    }
  }

  /**
   * Get a registered component
   */
  getComponent(key: string): ComponentNode | undefined {
    return this.components.get(key);
  }

  /**
   * Add a pending instance to be created when component is available
   */
  addPendingInstance(componentKey: string, nodeData: DesignNode, parent: SceneNode | undefined, callback: (node: SceneNode) => void): void {
    if (!this.pendingInstances.has(componentKey)) {
      this.pendingInstances.set(componentKey, []);
    }
    this.pendingInstances.get(componentKey)!.push({ nodeData, parent, callback });
  }

  /**
   * Check if a component is registered
   */
  hasComponent(key: string): boolean {
    return this.components.has(key);
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.components.clear();
    this.pendingInstances.clear();
  }

  /**
   * Get all registered components
   */
  getAllComponents(): Map<string, ComponentNode> {
    return new Map(this.components);
  }
}

/**
 * Creator for Component nodes
 */
export class ComponentNodeCreator extends BaseNodeCreator {
  private registry: ComponentRegistry;

  constructor(registry?: ComponentRegistry) {
    super();
    this.registry = registry || new ComponentRegistry();
  }

  /**
   * Set the component registry
   */
  setRegistry(registry: ComponentRegistry): void {
    this.registry = registry;
  }

  /**
   * Get the component registry
   */
  getRegistry(): ComponentRegistry {
    return this.registry;
  }

  /**
   * Create a component node from design data
   */
  async create(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: ComponentNode) => Promise<void>
  ): Promise<ComponentNode> {
    const componentNode = figma.createComponent();
    componentNode.name = nodeData.name || 'Component';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    componentNode.resize(width, height);

    await this.applyFillsAsync(componentNode, nodeData.fills);
    await this.applyStrokesAsync(
      componentNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );
    this.applyCornerRadius(componentNode, nodeData);

    // Apply clipsContent
    if (typeof nodeData.clipsContent === 'boolean') {
      componentNode.clipsContent = nodeData.clipsContent;
    }

    // Apply auto-layout if specified
    this.applyAutoLayout(componentNode, nodeData);

    // Apply grids and guides
    this.applyGridsAndGuides(componentNode, nodeData);

    // Apply component description
    if (nodeData.componentDescription) {
      componentNode.description = nodeData.componentDescription;
    }

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
      for (const child of sortedChildren) {
        if (child && typeof child === 'object') {
          await createChildFn(child, componentNode);
        }
      }
    }

    // Register the component for instance creation
    if (nodeData.componentKey) {
      this.registry.registerComponent(nodeData.componentKey, componentNode);
    } else {
      // Use the generated key
      this.registry.registerComponent(componentNode.key, componentNode);
    }

    return componentNode;
  }

  /**
   * Create an instance from a component
   */
  async createInstance(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<SceneNode> {
    // Try to find the main component
    let mainComponent: ComponentNode | undefined;

    if (nodeData.mainComponentId) {
      mainComponent = this.registry.getComponent(nodeData.mainComponentId);
    }

    if (mainComponent) {
      // Create instance from registered component
      const instance = mainComponent.createInstance();
      instance.name = nodeData.name || 'Instance';

      // Apply position
      if (typeof nodeData.x === 'number') instance.x = nodeData.x;
      if (typeof nodeData.y === 'number') instance.y = nodeData.y;

      // Apply size if different from component
      if (nodeData.width && nodeData.height) {
        instance.resize(nodeData.width, nodeData.height);
      }

      // Apply component property overrides
      if (nodeData.componentProperties) {
        for (const [key, prop] of Object.entries(nodeData.componentProperties)) {
          try {
            instance.setProperties({ [key]: prop.value });
          } catch (error) {
            console.warn(`Error setting component property ${key}:`, error);
          }
        }
      }

      return instance;
    }

    // Fallback: create as frame if component not found
    console.warn(`Component ${nodeData.mainComponentId} not found, creating as frame`);
    return this.createInstanceAsFrame(nodeData, createChildFn);
  }

  /**
   * Create instance as frame fallback
   */
  private async createInstanceAsFrame(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const frameNode = figma.createFrame();
    frameNode.name = nodeData.name || 'Instance (Frame fallback)';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    frameNode.resize(width, height);

    await this.applyFillsAsync(frameNode, nodeData.fills);
    await this.applyStrokesAsync(
      frameNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign
    );
    this.applyCornerRadius(frameNode, nodeData);

    if (typeof nodeData.clipsContent === 'boolean') {
      frameNode.clipsContent = nodeData.clipsContent;
    }

    this.applyAutoLayout(frameNode, nodeData);

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
      for (const child of sortedChildren) {
        if (child && typeof child === 'object') {
          await createChildFn(child, frameNode);
        }
      }
    }

    return frameNode;
  }

  /**
   * Create a component set
   */
  async createComponentSet(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    // ComponentSet requires specific handling - create as frame with components as children
    const setFrame = figma.createFrame();
    setFrame.name = nodeData.name || 'Component Set';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    setFrame.resize(width, height);

    await this.applyFillsAsync(setFrame, nodeData.fills);
    await this.applyStrokesAsync(
      setFrame,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign
    );
    this.applyCornerRadius(setFrame, nodeData);

    if (typeof nodeData.clipsContent === 'boolean') {
      setFrame.clipsContent = nodeData.clipsContent;
    }

    this.applyAutoLayout(setFrame, nodeData);

    // Create children (should be components)
    if (nodeData.children && Array.isArray(nodeData.children)) {
      const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
      for (const child of sortedChildren) {
        if (child && typeof child === 'object') {
          await createChildFn(child, setFrame);
        }
      }
    }

    return setFrame;
  }

  /**
   * Sort children by layer index to preserve z-order
   */
  private sortChildrenByLayerIndex(children: DesignNode[]): DesignNode[] {
    return [...children].sort((a, b) => {
      const indexA = a._layerIndex ?? 0;
      const indexB = b._layerIndex ?? 0;
      return indexA - indexB;
    });
  }
}
