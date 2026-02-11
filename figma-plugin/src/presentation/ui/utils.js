export const API_BASE_URL = process.env.BACKEND_URL;

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function analyzeJsonStructure(data) {
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

export function getElementIcon(type) {
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
