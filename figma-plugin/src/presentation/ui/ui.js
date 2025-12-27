// const API_BASE_URL = 'https://task-creator-api.onrender.com';
const API_BASE_URL = "http://localhost:5000"

// ==================== STATE ====================
let chatMessages = [];
let conversationHistory = [];
let currentDesignData = null;
let isGenerating = false;
let currentExportData = null;
let selectedVersionId = null;
let versionsCache = [];

// Model & Design System state
let currentModel = 'gpt-4';
let availableModels = [];
let currentDesignSystem = 'none';
let availableDesignSystems = [];

// Mode state
let currentMode = null;
let selectedLayerForEdit = null;
let selectedLayerJson = null;

// ==================== ELEMENTS ====================
const importBtn = document.getElementById('import-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tabs = document.querySelectorAll('.tab');
const jsonInput = document.getElementById('json-input');
const jsonStats = document.getElementById('json-stats');
const statusEl = document.getElementById('status');
const mainButtonGroup = document.getElementById('main-button-group');

// Mode selection elements
const modeSelectionScreen = document.getElementById('mode-selection-screen');
const createModeBtn = document.getElementById('create-mode-btn');
const editModeBtn = document.getElementById('edit-mode-btn');
const backToModeBtn = document.getElementById('back-to-mode-selection');
const editModeHeader = document.getElementById('edit-mode-header');
const selectedLayerNameEl = document.getElementById('selected-layer-name');

// AI Chat elements
const aiChatContainer = document.getElementById('ai-chat-container');
const chatMessagesEl = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

// Model Selection elements
const modelFloatingBtn = document.getElementById('model-floating-btn');
const modelPanel = document.getElementById('model-panel');
const modelPanelBackdrop = document.getElementById('model-panel-backdrop');
const closeModelPanel = document.getElementById('close-model-panel');
const modelBtnText = document.querySelector('.model-btn-text');
const selectedModelInfo = document.getElementById('selected-model-info');
const currentModelNameEl = document.getElementById('current-model-name');

// Design System Selection elements
const designSystemFloatingBtn = document.getElementById('design-system-floating-btn');
const designSystemPanel = document.getElementById('design-system-panel');
const designSystemBtnText = document.querySelector('.design-system-btn-text');
const selectedDesignSystemInfo = document.getElementById('selected-design-system-info');
const currentDesignSystemNameEl = document.getElementById('current-design-system-name');

// Export elements
const exportSelectedBtn = document.getElementById('export-selected-btn');
const exportAllBtn = document.getElementById('export-all-btn');
const exportOutput = document.getElementById('export-output');
const copyJsonBtn = document.getElementById('copy-json-btn');
const downloadJsonBtn = document.getElementById('download-json-btn');
const saveToDbBtn = document.getElementById('save-to-db-btn');
const selectionInfo = document.getElementById('selection-info');
const exportStats = document.getElementById('export-stats');

// Version elements
const versionsList = document.getElementById('versions-list');
const refreshVersionsBtn = document.getElementById('refresh-versions-btn');
const selectedVersionActions = document.getElementById('selected-version-actions');
const importVersionBtn = document.getElementById('import-version-btn');
const deleteVersionBtn = document.getElementById('delete-version-btn');

// Modal elements
const saveModal = document.getElementById('save-modal');
const saveDescription = document.getElementById('save-description');
const confirmSaveBtn = document.getElementById('confirm-save-btn');
const cancelSaveBtn = document.getElementById('cancel-save-btn');

// ==================== MODEL SELECTION ====================
function initModelSelection() {
    // Floating button click handler
    modelFloatingBtn.addEventListener('click', toggleModelPanel);

    // Close button handler
    closeModelPanel.addEventListener('click', closeModelPanelFunc);

    // Backdrop click handler
    modelPanelBackdrop.addEventListener('click', closeModelPanelFunc);

    // Load models on first click
    let modelsLoaded = false;
    modelFloatingBtn.addEventListener('click', async () => {
        if (!modelsLoaded) {
            await fetchAIModels();
            modelsLoaded = true;
        }
    });

    // Load saved model from localStorage
    try {
        const savedModel = localStorage.getItem('figma-ai-model');
        if (savedModel) {
            currentModel = savedModel;
        }
    } catch (e) {
        console.log('LocalStorage load error:', e);
    }
}

function toggleModelPanel() {
    if (modelPanel.style.display === 'block') {
        closeModelPanelFunc();
    } else {
        openModelPanel();
    }
}

function openModelPanel() {
    modelPanel.style.display = 'block';
    modelPanelBackdrop.style.display = 'block';
}

function closeModelPanelFunc() {
    modelPanel.style.display = 'none';
    modelPanelBackdrop.style.display = 'none';
}

function selectModel(modelId, showNotification = true) {
    const model = availableModels.find(m => m.id === modelId);
    if (!model) return;

    // Update current model
    currentModel = modelId;

    // Update UI
    updateModelUI(model, showNotification);

    // Update all model items in the list
    document.querySelectorAll('.model-item').forEach(item => {
        const isActive = item.dataset.model === modelId;
        item.classList.toggle('active', isActive);
        item.querySelector('.model-item-check').textContent = isActive ? '✓' : '';
    });

    // Store in localStorage
    try {
        localStorage.setItem('figma-ai-model', modelId);
    } catch (e) {
        console.log('LocalStorage save error:', e);
    }
}

function updateModelUI(model, showNotification = true) {
    // Update floating button text
    if (modelBtnText) {
        modelBtnText.textContent = model.name;
    }

    // Update selected model info
    if (selectedModelInfo) {
        selectedModelInfo.textContent = `Currently using: ${model.name}`;
    }

    // Update current model name
    if (currentModelNameEl) {
        currentModelNameEl.textContent = model.name;
    }

    // Show notification
    if (showNotification) {
        showStatus(`✅ Switched to ${model.name}`, 'success');
        setTimeout(hideStatus, 2000);
    }
}

// ==================== DESIGN SYSTEM SELECTION ====================
function initDesignSystemSelection() {
    // Floating button click handler
    designSystemFloatingBtn.addEventListener('click', toggleDesignSystemPanel);

    // Create backdrop for design system panel if it doesn't exist
    if (!document.getElementById('design-system-panel-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.id = 'design-system-panel-backdrop';
        backdrop.className = 'model-panel-backdrop';
        backdrop.addEventListener('click', closeDesignSystemPanelFunc);
        document.body.appendChild(backdrop);
    }

    // Close button handler
    document.getElementById('close-design-system-panel').addEventListener('click', closeDesignSystemPanelFunc);

    // Load design systems on first click
    let systemsLoaded = false;
    designSystemFloatingBtn.addEventListener('click', async () => {
        if (!systemsLoaded) {
            await fetchDesignSystems();
            systemsLoaded = true;
        }
    });

    // Load saved design system from localStorage
    try {
        const savedSystem = localStorage.getItem('figma-design-system');
        if (savedSystem) {
            currentDesignSystem = savedSystem;
        }
    } catch (e) {
        console.log('LocalStorage load error:', e);
    }
}

function toggleDesignSystemPanel() {
    const panel = document.getElementById('design-system-panel');
    if (panel.style.display === 'block') {
        closeDesignSystemPanelFunc();
    } else {
        openDesignSystemPanel();
    }
}

function openDesignSystemPanel() {
    const panel = document.getElementById('design-system-panel');
    const backdrop = document.getElementById('design-system-panel-backdrop');
    panel.style.display = 'block';
    backdrop.style.display = 'block';
}

function closeDesignSystemPanelFunc() {
    const panel = document.getElementById('design-system-panel');
    const backdrop = document.getElementById('design-system-panel-backdrop');
    panel.style.display = 'none';
    backdrop.style.display = 'none';
}

function selectDesignSystem(systemId, showNotification = true) {
    const system = availableDesignSystems.find(s => s.id === systemId);
    if (!system) return;

    currentDesignSystem = systemId;

    // Update UI
    updateDesignSystemUI(system, showNotification);

    // Update all system items in the list
    document.querySelectorAll('#design-system-list .model-item').forEach(item => {
        const isActive = item.dataset.system === systemId;
        item.classList.toggle('active', isActive);
        item.querySelector('.model-item-check').textContent = isActive ? '✓' : '';
    });

    // Store in localStorage
    try {
        localStorage.setItem('figma-design-system', systemId);
    } catch (e) {
        console.log('LocalStorage save error:', e);
    }
}

function updateDesignSystemUI(system, showNotification = true) {
    if (designSystemBtnText) {
        designSystemBtnText.textContent = system.name;
    }

    if (selectedDesignSystemInfo) {
        selectedDesignSystemInfo.textContent = `Currently using: ${system.name}`;
    }

    if (currentDesignSystemNameEl) {
        currentDesignSystemNameEl.textContent = system.name;
    }

    if (showNotification) {
        showStatus(`✅ Switched to ${system.name}`, 'success');
        setTimeout(hideStatus, 2000);
    }
}

async function fetchDesignSystems() {
    try {
        showDesignSystemStatus('🔄 Loading design systems...', 'info');

        const response = await fetch(`${API_BASE_URL}/api/design-systems`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load design systems');
        }

        availableDesignSystems = data.systems;
        renderDesignSystemList(availableDesignSystems);
        showDesignSystemStatus(`✅ Loaded ${data.count} design systems`, 'success');

        // Load saved design system
        try {
            const savedSystem = localStorage.getItem('figma-design-system');
            if (savedSystem) {
                selectDesignSystem(savedSystem, false);
            } else if (availableDesignSystems.length > 0) {
                selectDesignSystem(currentDesignSystem, false);
            }
        } catch (e) {
            console.log('LocalStorage error:', e);
        }

        setTimeout(() => hideDesignSystemStatus(), 2000);
    } catch (error) {
        console.error('Failed to fetch design systems:', error);
        showDesignSystemStatus('⚠️ Using default system', 'warning');
    }
}

function renderDesignSystemList(systems) {
    const listEl = document.getElementById('design-system-list');
    if (!listEl) return;

    if (!systems || systems.length === 0) {
        listEl.innerHTML = `
      <div class="model-empty">
        <div class="model-empty-icon">⚠️</div>
        <div class="model-empty-text">No design systems available</div>
      </div>
    `;
        return;
    }

    listEl.innerHTML = systems.map(system => `
    <div class="model-item ${currentDesignSystem === system.id ? 'active' : ''}" 
         data-system="${system.id}">
      <div class="model-item-icon">${system.icon}</div>
      <div class="model-item-info">
        <div class="model-item-name">${escapeHtml(system.name)}</div>
        <div class="model-item-desc">${escapeHtml(system.description)}</div>
      </div>
      <div class="model-item-check">${currentDesignSystem === system.id ? '✓' : ''}</div>
    </div>
  `).join('');

    document.querySelectorAll('#design-system-list .model-item').forEach(item => {
        item.addEventListener('click', () => {
            selectDesignSystem(item.dataset.system);
            closeDesignSystemPanelFunc();
        });
    });
}

function showDesignSystemStatus(message, type) {
    const statusEl = document.getElementById('design-system-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `model-status ${type}`;
        statusEl.style.display = 'block';
    }
}

function hideDesignSystemStatus() {
    const statusEl = document.getElementById('design-system-status');
    if (statusEl) {
        statusEl.style.display = 'none';
    }
}

// ==================== MODE SELECTION ====================
createModeBtn.addEventListener('click', () => {
    currentMode = 'create';
    showChatInterface();
});

editModeBtn.addEventListener('click', () => {
    showStatus('📍 Please select a layer to edit...', 'info');
    parent.postMessage({
        pluginMessage: { type: 'request-layer-selection-for-edit' }
    }, '*');
});

backToModeBtn.addEventListener('click', () => {
    resetToModeSelection();
});

function showChatInterface() {
    console.log('🔥 showChatInterface called, mode:', currentMode);

    // Hide mode selection
    modeSelectionScreen.style.display = 'none';

    // Show chat interface
    aiChatContainer.classList.add('show-chat');
    aiChatContainer.style.display = 'flex';

    // Show/hide edit mode header
    if (currentMode === 'edit') {
        editModeHeader.classList.add('show-header');
        editModeHeader.style.display = 'block';

        const layerName = selectedLayerForEdit || 'selected layer';
        selectedLayerNameEl.textContent = `"${layerName}"`;
    } else {
        editModeHeader.classList.remove('show-header');
        editModeHeader.style.display = 'none';
    }

    // Clear old conversation
    chatMessages = [];
    conversationHistory = [];

    // Welcome message
    const model = availableModels.find(m => m.id === currentModel);
    const system = availableDesignSystems.find(s => s.id === currentDesignSystem);
    const modelName = model ? model.name : 'GPT-4';
    const systemName = system ? system.name : 'None';

    let welcomeMessage;
    if (currentMode === 'edit') {
        welcomeMessage = `I'll help you edit <strong>"${selectedLayerForEdit}"</strong> using ${modelName} and ${systemName}. What changes would you like to make?`;
    } else {
        welcomeMessage = `Hi! I'll create your design using ${modelName} and ${systemName}. Describe what you want. 🎨`;
    }

    chatMessagesEl.innerHTML = `
        <div class="message assistant">
            <div class="message-content">
                <div>${welcomeMessage}</div>
            </div>
        </div>
    `;
    chatMessagesEl.classList.add('show-messages');

    // Show input elements
    const inputContainer = document.getElementById('chat-input-container');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (inputContainer) {
        inputContainer.classList.add('show-input');
        inputContainer.style.display = 'flex';
    }

    if (input) {
        input.classList.add('show-input');
        input.style.display = 'block';
        input.disabled = false;
        input.value = '';
        input.placeholder = currentMode === 'edit'
            ? `e.g. Change the background color to blue, make the text larger...`
            : `e.g. Create a login page with email and password fields...`;
        setTimeout(() => {
            input.focus();
        }, 100);
    }

    if (sendBtn) {
        sendBtn.classList.add('show-button');
        sendBtn.style.display = 'block';
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }

    // Scroll to bottom
    setTimeout(() => {
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }, 50);

    console.log('✅ Chat interface shown successfully');
}

function resetToModeSelection() {
    currentMode = null;
    selectedLayerForEdit = null;
    selectedLayerJson = null;
    modeSelectionScreen.style.display = 'flex';
    aiChatContainer.style.display = 'none';
    aiChatContainer.classList.remove('show-chat');
    editModeHeader.style.display = 'none';
    editModeHeader.classList.remove('show-header');
    chatInput.value = '';
    conversationHistory = [];
    chatMessages = [];
}

// ==================== TAB SWITCHING ====================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Reset to mode selection when switching to AI tab
        if (tabName === 'ai') {
            resetToModeSelection();
        }

        const buttonTexts = {
            'ai': '🚀 Generate & Import',
            'auto': '📥 Fetch & Import',
            'manual': '📋 Import JSON',
            'export': null,
            'versions': null
        };

        if (tabName === 'export' || tabName === 'versions') {
            mainButtonGroup.style.display = 'none';
            if (tabName === 'versions') {
                loadVersions();
            }
        } else if (tabName === 'ai') {
            mainButtonGroup.style.display = 'none';
        } else {
            mainButtonGroup.style.display = 'flex';
            importBtn.textContent = buttonTexts[tabName] || 'Import';
        }

        resetButton();
        hideStatus();
    });
});

// ==================== AI CHAT FUNCTIONS ====================
chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || isGenerating) return;

    addMessage('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    isGenerating = true;
    chatSendBtn.disabled = true;

    conversationHistory.push({ role: 'user', content: message });

    const model = availableModels.find(m => m.id === currentModel);
    const system = availableDesignSystems.find(s => s.id === currentDesignSystem);
    const modelName = model.name;
    const systemName = system.name;

    addMessage('assistant', currentMode === 'edit'
        ? `Editing with ${modelName} and ${systemName}...`
        : `Creating with ${modelName} and ${systemName}...`, true);

    if (currentMode === 'edit') {
        parent.postMessage({
            pluginMessage: {
                type: 'ai-edit-design',
                message: message,
                history: conversationHistory,
                layerJson: selectedLayerJson,
                model: currentModel,
                designSystemId: currentDesignSystem
            }
        }, '*');
    } else {
        parent.postMessage({
            pluginMessage: {
                type: 'ai-chat-message',
                message: message,
                history: conversationHistory,
                model: currentModel,
                designSystemId: currentDesignSystem
            }
        }, '*');
    }
}

function addMessage(role, content, isLoading = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    if (isLoading) {
        contentEl.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <span>${content}</span>
      </div>
    `;
    } else {
        contentEl.innerHTML = `<div>${content}</div>`;
    }

    messageEl.appendChild(contentEl);
    chatMessagesEl.appendChild(messageEl);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    chatMessages.push({ role, content, timestamp: new Date() });
}

function removeLoadingMessages() {
    const loadingEls = chatMessagesEl.querySelectorAll('.loading-indicator');
    loadingEls.forEach(el => el.closest('.message').remove());
}

// ==================== DESIGN PREVIEW FUNCTIONS ====================
function addDesignPreview(designData, previewHtml = null, isEditMode = false, layerInfo = null) {
    const lastMessage = chatMessagesEl.lastElementChild;
    if (!lastMessage || !lastMessage.classList.contains('assistant')) return;

    const contentEl = lastMessage.querySelector('.message-content');
    if (!contentEl || contentEl.querySelector('.design-preview')) return;

    const previewEl = document.createElement('div');
    previewEl.className = 'design-preview';
    const uniqueId = 'import-btn-' + Date.now();

    const modeText = isEditMode ? '✏️ Edited Design Preview' : '✨ New Design Preview';
    const buttonText = isEditMode ? 'Update in Figma' : 'Import to Figma';

    const layerInfoHtml = isEditMode && layerInfo ?
        `<div class="edit-layer-info">
            <span class="editing-label">Editing:</span>
            <span class="layer-name">${escapeHtml(layerInfo.name)}</span>
            <span class="layer-type">(${escapeHtml(layerInfo.type)})</span>
        </div>` : '';

    const visualContent = previewHtml || generateDefaultPreview(designData, isEditMode);

    previewEl.innerHTML = `
    <div class="design-preview-header">
      <span class="design-preview-title">
        ${modeText}
        ${isEditMode ? '<span class="edit-badge">EDIT</span>' : '<span class="create-badge">NEW</span>'}
      </span>
      <div class="preview-actions">
        <div class="zoom-controls">
          <button class="zoom-btn zoom-out">-</button>
          <span class="zoom-level">100%</span>
          <button class="zoom-btn zoom-in">+</button>
          <button class="zoom-btn zoom-reset">Reset</button>
        </div>
        <button class="import-to-figma-btn" id="${uniqueId}" ${!designData ? 'disabled' : ''}>
          ${buttonText}
        </button>
      </div>
    </div>
    ${layerInfoHtml}
    <div class="design-preview-visual ${isEditMode ? 'edit-mode' : 'create-mode'}">
      <div class="design-preview-content" style="transform: scale(1); transform-origin: top left; transition: transform 0.2s;">
        ${visualContent}
      </div>
    </div>
  `;

    contentEl.appendChild(previewEl);

    // Zoom functionality
    let currentZoom = 1;
    const previewContent = previewEl.querySelector('.design-preview-content');
    const zoomLevel = previewEl.querySelector('.zoom-level');
    const zoomIn = previewEl.querySelector('.zoom-in');
    const zoomOut = previewEl.querySelector('.zoom-out');
    const zoomReset = previewEl.querySelector('.zoom-reset');

    function updateZoom(newZoom) {
        currentZoom = Math.max(0.1, Math.min(2, newZoom));
        previewContent.style.transform = `scale(${currentZoom})`;
        zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    zoomIn.addEventListener('click', () => updateZoom(currentZoom + 0.1));
    zoomOut.addEventListener('click', () => updateZoom(currentZoom - 0.1));
    zoomReset.addEventListener('click', () => updateZoom(1));

    // Import button
    const importButton = previewEl.querySelector('.import-to-figma-btn');
    if (importButton && designData) {
        importButton.addEventListener('click', () => {
            importButton.disabled = true;
            importButton.textContent = isEditMode ? 'Updating...' : 'Importing...';

            const messageType = isEditMode ? 'import-edited-design' : 'import-design-from-chat';
            parent.postMessage({
                pluginMessage: {
                    type: messageType,
                    designData: designData,
                    isEditMode: isEditMode,
                    ...(isEditMode && { layerId: selectedLayerForEdit })
                }
            }, '*');
        });
    }
}

function generateDefaultPreview(designData, isEditMode = false) {
    if (!designData) {
        return '<div style="padding: 40px; color: #999; text-align: center;">Preview unavailable</div>';
    }

    try {
        if (isEditMode) {
            return generateEditModePreview(designData);
        } else {
            return generateCreateModePreview(designData);
        }
    } catch (error) {
        console.error('Error generating preview:', error);
        return '<div style="padding: 20px; background: #fef2f2; color: #dc2626; border-radius: 8px;">Error generating preview</div>';
    }
}

function generateCreateModePreview(designData) {
    let html = '<div class="create-preview-container">';

    const name = designData.name || 'New Design';
    const type = designData.type || 'FRAME';
    const childrenCount = designData.children ? designData.children.length : 0;

    html += `
        <div class="design-summary">
            <div class="design-name">${escapeHtml(name)}</div>
            <div class="design-type">${escapeHtml(type)}</div>
            <div class="design-stats">${childrenCount} elements</div>
        </div>
    `;

    if (designData.children && designData.children.length > 0) {
        html += '<div class="design-elements">';

        designData.children.slice(0, 5).forEach((child, index) => {
            const childName = child.name || `Element ${index + 1}`;
            const childType = child.type || 'NODE';
            const icon = getElementIcon(childType);

            html += `
                <div class="design-element">
                    <span class="element-icon">${icon}</span>
                    <span class="element-name">${escapeHtml(childName)}</span>
                    <span class="element-type">${escapeHtml(childType)}</span>
                </div>
            `;
        });

        if (designData.children.length > 5) {
            html += `<div class="more-elements">+ ${designData.children.length - 5} more elements</div>`;
        }

        html += '</div>';
    }

    html += '</div>';
    return html;
}

function generateEditModePreview(designData) {
    let html = '<div class="edit-preview-container">';

    html += `
        <div class="edit-notice">
            <div class="notice-icon">✏️</div>
            <div class="notice-text">
                <strong>Editing Mode Active</strong>
                <small>Preview shows the updated design</small>
            </div>
        </div>
    `;

    if (designData.children && designData.children.length > 0) {
        html += '<div class="edited-design">';

        designData.children.forEach((child, index) => {
            const isSelected = selectedLayerForEdit &&
                (child.name === selectedLayerForEdit || child.id === selectedLayerForEdit);

            html += `
                <div class="edited-element ${isSelected ? 'selected-element' : ''}">
                    <span class="element-status">${isSelected ? '🎯' : '🔹'}</span>
                    <span class="element-name">${escapeHtml(child.name || `Element ${index + 1}`)}</span>
                    <span class="element-type">${escapeHtml(child.type || 'NODE')}</span>
                </div>
            `;
        });

        html += '</div>';
    }

    html += '</div>';
    return html;
}

function getElementIcon(type) {
    const icons = {
        'FRAME': '🖼️',
        'GROUP': '👥',
        'TEXT': '📝',
        'RECTANGLE': '⬜',
        'ELLIPSE': '⭕',
        'LINE': '📏',
        'VECTOR': '🔺',
        'COMPONENT': '🧩',
        'INSTANCE': '🔗'
    };
    return icons[type] || '🔲';
}

// ==================== VERSION MANAGEMENT ====================
async function fetchAIModels() {
    try {
        showModelStatus('🔄 Loading AI models...', 'info');

        const response = await fetch(`${API_BASE_URL}/api/ai-models`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load AI models');
        }

        availableModels = data.models;
        renderModelList(availableModels);
        showModelStatus(`✅ Loaded ${data.count} models`, 'success');

        // Load saved model
        try {
            const savedModel = localStorage.getItem('figma-ai-model');
            if (savedModel) {
                selectModel(savedModel, false);
            } else if (availableModels.length > 0) {
                selectModel(currentModel, false);
            }
        } catch (e) {
            console.log('LocalStorage error:', e);
        }

        setTimeout(() => hideModelStatus(), 2000);
    } catch (error) {
        console.error('Failed to fetch AI models:', error);
        showModelStatus('⚠️ Using default models', 'warning');

    }
}

function renderModelList(models) {
    const modelListEl = document.getElementById('model-list');
    if (!modelListEl) return;

    if (!models || models.length === 0) {
        modelListEl.innerHTML = `
            <div class="model-empty">
                <div class="model-empty-icon">⚠️</div>
                <div class="model-empty-text">No AI models available</div>
            </div>
        `;
        return;
    }

    modelListEl.innerHTML = models.map(model => `
        <div class="model-item ${currentModel === model.id ? 'active' : ''}" 
             data-model="${model.id}">
            <div class="model-item-icon">${model.icon}</div>
            <div class="model-item-info">
                <div class="model-item-name">${escapeHtml(model.name)}</div>
                <div class="model-item-desc">${escapeHtml(model.description)}</div>
            </div>
            <div class="model-item-check">${currentModel === model.id ? '✓' : ''}</div>
        </div>
    `).join('');

    document.querySelectorAll('.model-item').forEach(item => {
        if (availableModels.find(m => m.id === item.dataset.model)) {
            item.addEventListener('click', () => {
                selectModel(item.dataset.model);
                closeModelPanelFunc();
            });
        }
    });
}

function updateModelButton(model) {
    if (modelBtnText) {
        modelBtnText.textContent = model.name;
    }
}

function showModelStatus(message, type) {
    const modelStatusEl = document.getElementById('model-status');
    if (modelStatusEl) {
        modelStatusEl.textContent = message;
        modelStatusEl.className = `model-status ${type}`;
        modelStatusEl.style.display = 'block';
    }
}

function hideModelStatus() {
    const modelStatusEl = document.getElementById('model-status');
    if (modelStatusEl) {
        modelStatusEl.style.display = 'none';
    }
}

async function loadVersions() {
    try {
        showStatus('📡 Loading versions...', 'info');
        refreshVersionsBtn.disabled = true;
        refreshVersionsBtn.innerHTML = '<span class="loading"></span>';

        const response = await fetch(`${API_BASE_URL}/api/design-versions`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load versions');
        }

        versionsCache = data.versions;
        renderVersionsList(data.versions);
        hideStatus();
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
        versionsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">Failed to load versions.<br>Check your connection and try again.</div>
      </div>
    `;
    } finally {
        refreshVersionsBtn.disabled = false;
        refreshVersionsBtn.innerHTML = '🔄 Refresh';
    }
}

function renderVersionsList(versions) {
    if (!versions || versions.length === 0) {
        versionsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No versions saved yet.<br>Export a design and save it to the database.</div>
      </div>
    `;
        selectedVersionActions.style.display = 'none';
        return;
    }

    versionsList.innerHTML = versions.map(v => `
    <div class="version-item ${selectedVersionId === v.id ? 'selected' : ''}" data-id="${v.id}">
      <div class="version-header">
        <span class="version-number">v${v.version}</span>
        <span class="version-date">${formatDate(v.createdAt)}</span>
      </div>
      <div class="version-description">${escapeHtml(v.description)}</div>
    </div>
  `).join('');

    document.querySelectorAll('.version-item').forEach(item => {
        item.addEventListener('click', () => selectVersion(parseInt(item.dataset.id)));
    });
}

function selectVersion(id) {
    selectedVersionId = id;
    document.querySelectorAll('.version-item').forEach(item => {
        item.classList.toggle('selected', parseInt(item.dataset.id) === id);
    });
    selectedVersionActions.style.display = 'flex';
}

async function saveVersionToDb(description, designJson) {
    try {
        showStatus('💾 Saving to database...', 'info');
        confirmSaveBtn.disabled = true;
        confirmSaveBtn.innerHTML = '<span class="loading"></span> Saving...';

        const response = await fetch(`${API_BASE_URL}/api/design-versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, designJson })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to save version');
        }

        showStatus(`✅ Saved as version ${data.version.version}!`, 'success');
        saveModal.style.display = 'none';
        saveDescription.value = '';

        if (document.querySelector('.tab[data-tab="versions"]').classList.contains('active')) {
            loadVersions();
        }
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
    } finally {
        confirmSaveBtn.disabled = false;
        confirmSaveBtn.innerHTML = 'Save';
    }
}

async function importVersionFromDb(id) {
    try {
        showStatus('📥 Loading version...', 'info');
        importVersionBtn.disabled = true;
        importVersionBtn.innerHTML = '<span class="loading"></span> Loading...';

        const response = await fetch(`${API_BASE_URL}/api/design-versions/${id}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load version');
        }

        showStatus('✅ Importing to Figma...', 'info');
        parent.postMessage({
            pluginMessage: {
                type: 'import-version',
                designJson: data.version.designJson
            }
        }, '*');
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
        importVersionBtn.disabled = false;
        importVersionBtn.innerHTML = '📥 Import to Figma';
    }
}

async function deleteVersion(id) {
    if (!confirm('Are you sure you want to delete this version? This cannot be undone.')) {
        return;
    }

    try {
        showStatus('🗑️ Deleting version...', 'info');
        deleteVersionBtn.disabled = true;
        deleteVersionBtn.innerHTML = '<span class="loading"></span>';

        const response = await fetch(`${API_BASE_URL}/api/design-versions/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to delete version');
        }

        showStatus('✅ Version deleted!', 'success');
        selectedVersionId = null;
        selectedVersionActions.style.display = 'none';
        loadVersions();
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
    } finally {
        deleteVersionBtn.disabled = false;
        deleteVersionBtn.innerHTML = '🗑️ Delete';
    }
}

refreshVersionsBtn.addEventListener('click', loadVersions);
importVersionBtn.addEventListener('click', () => {
    if (selectedVersionId) importVersionFromDb(selectedVersionId);
});
deleteVersionBtn.addEventListener('click', () => {
    if (selectedVersionId) deleteVersion(selectedVersionId);
});

saveToDbBtn.addEventListener('click', () => {
    if (!currentExportData) {
        showStatus('⚠️ No design data to save. Export first.', 'warning');
        return;
    }
    saveModal.style.display = 'block';
    saveDescription.focus();
});

confirmSaveBtn.addEventListener('click', () => {
    const description = saveDescription.value.trim();
    if (!description) {
        showStatus('⚠️ Please enter a description', 'warning');
        return;
    }
    saveVersionToDb(description, currentExportData);
});

cancelSaveBtn.addEventListener('click', () => {
    saveModal.style.display = 'none';
    saveDescription.value = '';
});

// ==================== EXPORT FUNCTIONS ====================
exportSelectedBtn.addEventListener('click', () => {
    exportSelectedBtn.disabled = true;
    exportSelectedBtn.innerHTML = '<span class="loading"></span> Exporting...';
    showStatus('📦 Exporting selected layers...', 'info');
    parent.postMessage({ pluginMessage: { type: 'export-selected' } }, '*');
});

exportAllBtn.addEventListener('click', () => {
    exportAllBtn.disabled = true;
    exportAllBtn.innerHTML = '<span class="loading"></span> Exporting...';
    showStatus('📄 Exporting all layers on page...', 'info');
    parent.postMessage({ pluginMessage: { type: 'export-all' } }, '*');
});

copyJsonBtn.addEventListener('click', async () => {
    if (!currentExportData) return;
    try {
        await navigator.clipboard.writeText(JSON.stringify(currentExportData, null, 2));
        showStatus('✅ Copied to clipboard!', 'success');
        copyJsonBtn.textContent = '✅ Copied!';
        setTimeout(() => copyJsonBtn.textContent = '📋 Copy', 2000);
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = JSON.stringify(currentExportData, null, 2);
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showStatus('✅ Copied to clipboard!', 'success');
    }
});

downloadJsonBtn.addEventListener('click', () => {
    if (!currentExportData) return;
    const jsonString = JSON.stringify(currentExportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let filename = 'figma-design';
    if (Array.isArray(currentExportData) && currentExportData[0]?.name) {
        filename = currentExportData[0].name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    }
    a.download = `${filename}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('✅ Downloaded!', 'success');
});

// ==================== UTILITY FUNCTIONS ====================
function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

function hideStatus() {
    statusEl.className = 'status';
    statusEl.textContent = '';
}

function resetButton() {
    importBtn.disabled = false;
    const currentTab = document.querySelector('.tab.active').dataset.tab;
    const buttonTexts = {
        'ai': '🚀 Generate & Import',
        'auto': '📥 Fetch & Import',
        'manual': '📋 Import JSON'
    };
    importBtn.innerHTML = buttonTexts[currentTab] || 'Import';
}

function resetExportButtons() {
    exportSelectedBtn.innerHTML = '📦 Export Selected';
    exportAllBtn.innerHTML = '📄 Export All (Page)';
    exportAllBtn.disabled = false;
}

function setLoading(message = 'Working...') {
    importBtn.disabled = true;
    importBtn.innerHTML = `<span class="loading"></span> ${message}`;
}

function updateExportOutput(data) {
    currentExportData = data;
    exportOutput.value = JSON.stringify(data, null, 2);
    copyJsonBtn.disabled = false;
    downloadJsonBtn.disabled = false;
    saveToDbBtn.disabled = false;
    const stats = analyzeJsonStructure(data);
    exportStats.textContent = stats;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function validateJsonInput() {
    const value = jsonInput.value.trim();
    if (!value) {
        jsonInput.classList.remove('error', 'valid');
        jsonStats.textContent = '';
        return null;
    }
    try {
        const parsed = JSON.parse(value);
        const stats = analyzeJsonStructure(parsed);
        jsonInput.classList.remove('error');
        jsonInput.classList.add('valid');
        jsonStats.classList.remove('error');
        jsonStats.textContent = stats;
        return parsed;
    } catch (e) {
        jsonInput.classList.remove('valid');
        jsonInput.classList.add('error');
        jsonStats.classList.add('error');
        jsonStats.textContent = `❌ Invalid JSON: ${e.message}`;
        return null;
    }
}

function analyzeJsonStructure(data) {
    let nodeCount = 0, frameCount = 0, textCount = 0, otherCount = 0;
    function countNodes(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(countNodes); return; }
        if (node.type) {
            nodeCount++;
            if (node.type === 'FRAME' || node.type === 'GROUP') frameCount++;
            else if (node.type === 'TEXT') textCount++;
            else otherCount++;
        }
        if (node.children) node.children.forEach(countNodes);
        if (node.data) countNodes(node.data);
    }
    countNodes(data);
    if (nodeCount === 0) return '⚠️ No Figma nodes detected';
    return `✅ ${nodeCount} nodes (${frameCount} frames, ${textCount} text, ${otherCount} other)`;
}

function updateSelectionInfo(selection) {
    if (!selection || selection.count === 0) {
        selectionInfo.innerHTML = '<strong>No selection.</strong> Select layers to export, or export entire page.';
        exportSelectedBtn.disabled = true;
    } else {
        const names = selection.names.slice(0, 3).join(', ');
        const more = selection.count > 3 ? ` and ${selection.count - 3} more` : '';
        selectionInfo.innerHTML = `<strong>${selection.count} layer${selection.count !== 1 ? 's' : ''} selected:</strong> ${names}${more}`;
        exportSelectedBtn.disabled = false;
    }
}

// ==================== MAIN IMPORT HANDLERS ====================
jsonInput.addEventListener('input', debounce(validateJsonInput, 300));

importBtn.addEventListener('click', async () => {
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    try {
        if (activeTab === 'ai') await handleAiGeneration();
        else if (activeTab === 'auto') await handleApiFetch();
        else await handleManualJson();
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
        resetButton();
    }
});

async function handleAiGeneration() {
    const prompt = chatInput.value.trim();
    if (!prompt) throw new Error('Please describe the design you want.');
    if (prompt.length < 10) throw new Error('Please provide more detail (at least 10 characters).');
    setLoading('Generating with AI...');
    showStatus('🤖 Generating design with AI...', 'info');
    parent.postMessage({ pluginMessage: { type: 'generate-design-from-text', prompt } }, '*');
}

async function handleApiFetch() {
    const apiUrl = document.getElementById('api-url').value.trim();
    if (!apiUrl) throw new Error('Please enter an API URL.');
    try { new URL(apiUrl); } catch (e) { throw new Error('Please enter a valid URL'); }
    setLoading('Fetching design...');
    showStatus('📡 Fetching from API...', 'info');
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    let result = await response.json();
    let designData = result.data || result.design || result.result || result;
    if (!designData || Object.keys(designData).length === 0) throw new Error('No design data received.');
    showStatus('✅ Importing to Figma...', 'info');
    parent.postMessage({ pluginMessage: { type: 'import-design', designData } }, '*');
}

async function handleManualJson() {
    const jsonValue = jsonInput.value.trim();
    if (!jsonValue) throw new Error('Please paste your design JSON.');
    let designData;
    try { designData = JSON.parse(jsonValue); } catch (e) { throw new Error(`Invalid JSON: ${e.message}`); }
    setLoading('Importing...');
    showStatus('📋 Importing to Figma...', 'info');
    parent.postMessage({ pluginMessage: { type: 'import-design', designData } }, '*');
}

cancelBtn.addEventListener('click', () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
});

// ==================== PLUGIN MESSAGES ====================
window.onmessage = async (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    switch (msg.type) {
        case 'call-backend-for-claude':
            try {
                const designData = await callBackendForClaude(msg.prompt);
                parent.postMessage({ pluginMessage: { type: 'design-generated-from-ai', designData } }, '*');
            } catch (error) {
                showStatus(`❌ AI Generation failed: ${error.message}`, 'error');
                resetButton();
            }
            break;

        case 'layer-selected-for-edit':
            currentMode = 'edit';
            selectedLayerForEdit = msg.layerName;
            selectedLayerJson = msg.layerJson;
            showChatInterface();
            selectedLayerNameEl.textContent = msg.layerName;
            hideStatus();
            break;

        case 'no-layer-selected':
            showStatus('⚠️ Please select a layer to edit', 'warning');
            setTimeout(hideStatus, 3000);
            break;

        case 'ai-chat-response':
            isGenerating = false;
            chatSendBtn.disabled = false;
            removeLoadingMessages();

            addMessage('assistant', msg.message);
            conversationHistory.push({ role: 'assistant', content: msg.message });

            if (msg.designData || msg.previewHtml) {
                currentDesignData = msg.designData;
                // وضع الإنشاء
                addDesignPreview(msg.designData, msg.previewHtml, false, null);
            }
            break;

        case 'ai-edit-response':
            isGenerating = false;
            chatSendBtn.disabled = false;
            removeLoadingMessages();

            addMessage('assistant', msg.message);
            conversationHistory.push({ role: 'assistant', content: msg.message });

            if (msg.designData || msg.previewHtml) {
                currentDesignData = msg.designData;
                const layerInfo = {
                    name: selectedLayerForEdit,
                    type: selectedLayerJson?.type || 'LAYER',
                    id: selectedLayerJson?.id || ''
                };
                addDesignPreview(msg.designData, msg.previewHtml, true, layerInfo);
            }
            break;

        case 'ai-chat-error':
        case 'ai-edit-error':
            isGenerating = false;
            chatSendBtn.disabled = false;
            removeLoadingMessages();
            addMessage('assistant', `Error: ${msg.error}`);
            showStatus(`❌ ${msg.error}`, 'error');
            break;

        case 'import-success':
            showStatus('✅ Design imported successfully!', 'success');
            resetButton();
            importVersionBtn.disabled = false;
            importVersionBtn.innerHTML = '📥 Import to Figma';
            setTimeout(hideStatus, 3000);
            break;

        case 'design-updated':
            console.log('🔄 Design updated, refreshing layer JSON for next edit');
            selectedLayerJson = msg.layerJson;
            showStatus('✅ Design updated! You can continue editing.', 'success');
            setTimeout(hideStatus, 2000);
            break;

        case 'import-error':
            showStatus(`❌ Import failed: ${msg.error}`, 'error');
            resetButton();
            importVersionBtn.disabled = false;
            importVersionBtn.innerHTML = '📥 Import to Figma';
            break;

        case 'selection-changed':
            updateSelectionInfo(msg.selection);
            break;

        case 'export-success':
            showStatus(`✅ Exported ${msg.nodeCount} nodes!`, 'success');
            updateExportOutput(msg.data);
            resetExportButtons();
            break;

        case 'export-error':
            showStatus(`❌ Export failed: ${msg.error}`, 'error');
            resetExportButtons();
            break;
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function () {
    initModelSelection();
    initDesignSystemSelection();
    resetToModeSelection();
    fetchDesignSystems();
    fetchAIModels();

    setTimeout(() => {
        parent.postMessage({ pluginMessage: { type: 'get-selection-info' } }, '*');
    }, 100);
});

// Helper function (keep existing)
async function callBackendForClaude(userPrompt) {
    // const controller = new AbortController();
    // const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        const response = await fetch(`${API_BASE_URL}/api/designs/generate-from-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: userPrompt,
                modelId: currentModel,
                designSystemId: currentDesignSystem
            }),
            signal: controller.signal
        });
        // clearTimeout(timeoutId);
        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try { const err = await response.json(); errorMessage = err.message || err.error || errorMessage; } catch (e) { }
            throw new Error(errorMessage);
        }
        const result = await response.json();
        return result.design || result.data || result;
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Request timed out.');
        throw error;
    }
}