declare const process: { env: { BACKEND_URL: string } };
export const API_BASE_URL: string = process.env.BACKEND_URL;

export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return function (...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function analyzeJsonStructure(data: unknown): string {
    let nodeCount = 0, frameCount = 0, textCount = 0, otherCount = 0;
    function countNodes(node: unknown) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(countNodes); return; }
        const n = node as Record<string, unknown>;
        if (n.type) {
            nodeCount++;
            if (n.type === 'FRAME' || n.type === 'GROUP') frameCount++;
            else if (n.type === 'TEXT') textCount++;
            else otherCount++;
        }
        if (Array.isArray(n.children)) n.children.forEach(countNodes);
        if (n.data) countNodes(n.data);
    }
    countNodes(data);
    if (nodeCount === 0) return '⚠️ No Figma nodes detected';
    return `✅ ${nodeCount} nodes (${frameCount} frames, ${textCount} text, ${otherCount} other)`;
}

export function getElementIcon(type: string): string {
    const icons: Record<string, string> = {
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
