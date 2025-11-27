/**
 * Task Creator Figma Plugin
 * 
 * Clean Architecture Entry Point
 * 
 * Architecture Layers:
 * - Domain: Business entities and interfaces
 * - Application: Use cases and services
 * - Infrastructure: Figma API implementations
 * - Presentation: UI and message handling
 * - Shared: Common types and utilities
 */

// Infrastructure
import {
  FigmaNodeRepository,
  FigmaUIPort,
  FigmaNotificationPort,
  SelectionChangeHandler,
} from './infrastructure/figma';

// Application
import {
  ImportDesignUseCase,
  ImportAIDesignUseCase,
  ExportSelectedUseCase,
  ExportAllUseCase,
  DesignDataParser,
  NodeCounter,
} from './application';

// Presentation
import { PluginMessageHandler } from './presentation/handlers';

// Shared
import { PluginConfig } from './shared/constants';

/**
 * Plugin Application - Composition Root
 */
class PluginApplication {
  // Infrastructure
  private readonly nodeRepository: FigmaNodeRepository;
  private readonly uiPort: FigmaUIPort;
  private readonly notificationPort: FigmaNotificationPort;

  // Application Services
  private readonly designDataParser: DesignDataParser;
  private readonly nodeCounter: NodeCounter;

  // Use Cases
  private readonly importDesignUseCase: ImportDesignUseCase;
  private readonly importAIDesignUseCase: ImportAIDesignUseCase;
  private readonly exportSelectedUseCase: ExportSelectedUseCase;
  private readonly exportAllUseCase: ExportAllUseCase;

  // Handlers
  private readonly messageHandler: PluginMessageHandler;
  private readonly selectionChangeHandler: SelectionChangeHandler;

  constructor() {
    // Initialize Infrastructure
    this.nodeRepository = new FigmaNodeRepository();
    this.uiPort = new FigmaUIPort();
    this.notificationPort = new FigmaNotificationPort();

    // Initialize Application Services
    this.designDataParser = new DesignDataParser();
    this.nodeCounter = new NodeCounter();

    // Initialize Use Cases
    this.importDesignUseCase = new ImportDesignUseCase(
      this.nodeRepository,
      this.notificationPort,
      this.designDataParser
    );

    this.importAIDesignUseCase = new ImportAIDesignUseCase(
      this.nodeRepository,
      this.notificationPort,
      this.designDataParser
    );

    this.exportSelectedUseCase = new ExportSelectedUseCase(
      this.nodeRepository,
      this.notificationPort,
      this.nodeCounter
    );

    this.exportAllUseCase = new ExportAllUseCase(
      this.nodeRepository,
      this.notificationPort,
      this.nodeCounter
    );

    // Initialize Handlers
    this.messageHandler = new PluginMessageHandler(
      this.uiPort,
      this.notificationPort,
      this.importDesignUseCase,
      this.importAIDesignUseCase,
      this.exportSelectedUseCase,
      this.exportAllUseCase
    );

    this.selectionChangeHandler = new SelectionChangeHandler(
      this.nodeRepository,
      this.uiPort
    );
  }

  /**
   * Start the plugin
   */
  run(): void {
    // Show UI
    this.uiPort.show({
      width: PluginConfig.UI_WIDTH,
      height: PluginConfig.UI_HEIGHT,
      themeColors: PluginConfig.THEME_COLORS,
    });

    // Initialize handlers
    this.messageHandler.initialize();
    this.selectionChangeHandler.initialize();

    // Log startup
    console.log('Task Creator Plugin initialized with Clean Architecture');
  }
}

// Create and run the application
const app = new PluginApplication();
app.run();
