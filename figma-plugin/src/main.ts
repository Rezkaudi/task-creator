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
  AccessControlService,
} from './application';

// Presentation
import { PluginMessageHandler } from './presentation/handlers';

// Shared
import { PluginConfig } from './shared/constants';
import { GetUserInfoUseCase } from '@application/use-cases/getUserInfoUseCase';

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
  private readonly getUserInfoUseCase: GetUserInfoUseCase;

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

    this.getUserInfoUseCase = new GetUserInfoUseCase(
      this.nodeRepository
    );

    // Initialize Handlers
    this.messageHandler = new PluginMessageHandler(
      this.uiPort,
      this.notificationPort,
      this.importDesignUseCase,
      this.importAIDesignUseCase,
      this.exportSelectedUseCase,
      this.exportAllUseCase,
      this.getUserInfoUseCase
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
    console.log('==================');
    console.log('Your User ID:', figma.currentUser?.id);
    console.log('Your Name:', figma.currentUser?.name);
    console.log('==================');

    if (!AccessControlService.checkAccess()) {
      console.log('❌ Access Denied - Plugin closing');
      figma.closePlugin();
      return;
    }

    this.uiPort.show({
      width: PluginConfig.UI_WIDTH,
      height: PluginConfig.UI_HEIGHT,
      themeColors: PluginConfig.THEME_COLORS,
    });

    // Initialize handlers
    this.messageHandler.initialize();
    this.selectionChangeHandler.initialize();

    // Log startup
    console.log('Rio Plugin initialized  successfully');
  }
}

// Create and run the application
const app = new PluginApplication();
app.run();