const API_BASE_URL = 'https://task-creator-api.onrender.com';
// For local development:
// const API_BASE_URL = 'http://localhost:5000';

// ==================== STATE ====================
let chatMessages = [];
let conversationHistory = [];
let currentDesignData = null;
let isGenerating = false;
let currentExportData = null;
let selectedVersionId = null;
let versionsCache = [];

// ==================== ELEMENTS ====================
const importBtn = document.getElementById('import-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tabs = document.querySelectorAll('.tab');
const jsonInput = document.getElementById('json-input');
const jsonStats = document.getElementById('json-stats');
const statusEl = document.getElementById('status');
const mainButtonGroup = document.getElementById('main-button-group');

// AI Chat elements
const chatMessagesEl = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

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

// ==================== TAB SWITCHING ====================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

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
    addMessage('assistant', 'Creating your design...', true);

    parent.postMessage({
        pluginMessage: {
            type: 'ai-chat-message',
            message: message,
            history: conversationHistory
        }
    }, '*');
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

function addDesignPreview(designData, previewHtml = null) {
    const lastMessage = chatMessagesEl.lastElementChild;
    if (!lastMessage || !lastMessage.classList.contains('assistant')) return;

    const contentEl = lastMessage.querySelector('.message-content');
    if (!contentEl || contentEl.querySelector('.design-preview')) return;

    const previewEl = document.createElement('div');
    previewEl.className = 'design-preview';
    const uniqueId = 'import-btn-' + Date.now();

    const visualContent = previewHtml || '<div style="padding: 40px; color: #999;">Preview unavailable</div>';

    previewEl.innerHTML = `
    <div class="design-preview-header">
      <span class="design-preview-title">✨ Design Preview</span>
      <div class="preview-actions">
        <div class="zoom-controls">
          <button class="zoom-btn zoom-out">-</button>
          <span class="zoom-level">100%</span>
          <button class="zoom-btn zoom-in">+</button>
          <button class="zoom-btn zoom-reset">Reset</button>
        </div>
        <button class="import-to-figma-btn" id="${uniqueId}" ${!designData ? 'disabled' : ''}>
          Import to Figma
        </button>
      </div>
    </div>
    <div class="design-preview-visual">
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
            importButton.textContent = 'Importing...';
            parent.postMessage({
                pluginMessage: {
                    type: 'import-design-from-chat',
                    designData: designData
                }
            }, '*');
        });
    }
}

// ==================== VERSION MANAGEMENT ====================

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

    // Add click handlers
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

        // Refresh versions list if on that tab
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

// Version button handlers
refreshVersionsBtn.addEventListener('click', loadVersions);
importVersionBtn.addEventListener('click', () => {
    if (selectedVersionId) importVersionFromDb(selectedVersionId);
});
deleteVersionBtn.addEventListener('click', () => {
    if (selectedVersionId) deleteVersion(selectedVersionId);
});

// Save to DB button
saveToDbBtn.addEventListener('click', () => {
    if (!currentExportData) {
        showStatus('⚠️ No design data to save. Export first.', 'warning');
        return;
    }
    saveModal.style.display = 'block';
    saveDescription.focus();
});

// Modal handlers
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

function handleExportSuccess(msg) {
    currentExportData = msg.data;
    exportOutput.value = JSON.stringify(msg.data, null, 2);
    copyJsonBtn.disabled = false;
    downloadJsonBtn.disabled = false;
    saveToDbBtn.disabled = false;
    exportStats.textContent = `✅ Exported ${msg.nodeCount} node(s)`;
    showStatus(`✅ Exported ${msg.nodeCount} node(s)!`, 'success');
    resetExportButtons();
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

async function callBackendForClaude(userPrompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        const response = await fetch(`${API_BASE_URL}/api/designs/generate-from-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
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

        case 'ai-chat-response':
            isGenerating = false;
            chatSendBtn.disabled = false;
            removeLoadingMessages();

            addMessage('assistant', msg.message);
            conversationHistory.push({ role: 'assistant', content: msg.message });

            if (msg.designData || msg.previewHtml) {
                currentDesignData = msg.designData;
                addDesignPreview(msg.designData, msg.previewHtml);
            }
            break;

        case 'ai-chat-error':
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
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Initial setup - hide main button group for AI tab
mainButtonGroup.style.display = 'none';

setTimeout(() => {
    parent.postMessage({ pluginMessage: { type: 'get-selection-info' } }, '*');
}, 100);