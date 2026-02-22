/**
 * Converts Figma-like JSON design nodes to HTML with inline styles.
 * No LLM required — pure structural mapping.
 */

// --- Color helpers ---

function figmaColorToCSS(color, opacity) {
    if (!color) return 'transparent';
    const r = Math.round((color.r ?? 0) * 255);
    const g = Math.round((color.g ?? 0) * 255);
    const b = Math.round((color.b ?? 0) * 255);
    const a = color.a !== undefined ? color.a : (opacity !== undefined ? opacity : 1);
    return `rgba(${r},${g},${b},${a})`;
}

function getVisibleFill(fills) {
    if (!fills || fills.length === 0) return null;
    return fills.find(f => f.visible !== false) ?? fills[0];
}

// --- Gradient helpers ---

/**
 * Calculate CSS gradient angle (in degrees) from Figma's gradientTransform matrix.
 * Figma stores it as [[a,b,c],[d,e,f]]. The angle is derived from the first row vector.
 */
function gradientAngle(transform) {
    if (!transform || !transform[0]) return 90; // default: left-to-right
    const a = transform[0][0];
    const b = transform[0][1];
    return Math.round(Math.atan2(b, a) * (180 / Math.PI));
}

// --- Style helpers ---

function applyFillToStyle(style, fills) {
    const fill = getVisibleFill(fills);
    if (!fill) return;

    if (fill.type === 'SOLID') {
        style.backgroundColor = figmaColorToCSS(fill.color, fill.opacity);
    } else if (fill.type === 'GRADIENT_LINEAR') {
        const angle = gradientAngle(fill.gradientTransform);
        const stops = (fill.gradientStops || [])
            .map(s => `${figmaColorToCSS(s.color)} ${Math.round(s.position * 100)}%`)
            .join(', ');
        style.background = `linear-gradient(${angle}deg, ${stops})`;
    } else if (fill.type === 'GRADIENT_RADIAL') {
        const stops = (fill.gradientStops || [])
            .map(s => `${figmaColorToCSS(s.color)} ${Math.round(s.position * 100)}%`)
            .join(', ');
        style.background = `radial-gradient(ellipse at center, ${stops})`;
    } else if (fill.type === 'GRADIENT_ANGULAR') {
        const stops = (fill.gradientStops || [])
            .map(s => `${figmaColorToCSS(s.color)} ${Math.round(s.position * 360)}deg`)
            .join(', ');
        style.background = `conic-gradient(${stops})`;
    } else if (fill.type === 'IMAGE' && fill.imageUrl) {
        const safeUrl = fill.imageUrl.replace(/"/g, '%22');
        style.backgroundImage = `url("${safeUrl}")`;
        if (fill.scaleMode === 'TILE') {
            style.backgroundSize = 'auto';
            style.backgroundRepeat = 'repeat';
        } else {
            style.backgroundSize = fill.scaleMode === 'FIT' ? 'contain' : 'cover';
            style.backgroundRepeat = 'no-repeat';
            style.backgroundPosition = 'center';
        }
    }
}

function effectsToBoxShadow(effects) {
    if (!effects || effects.length === 0) return null;
    const shadows = effects
        .filter(e => e.visible !== false && (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW'))
        .map(e => {
            const color = figmaColorToCSS(e.color);
            const x = e.offset?.x || 0;
            const y = e.offset?.y || 0;
            const blur = e.radius || 0;
            const spread = e.spread || 0;
            const inset = e.type === 'INNER_SHADOW' ? 'inset ' : '';
            return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
        });
    return shadows.length ? shadows.join(', ') : null;
}

function strokesToBorder(strokes, strokeWeight) {
    if (!strokes || strokes.length === 0) return null;
    const stroke = strokes.find(s => s.visible !== false);
    if (!stroke) return null;
    return `${strokeWeight || 1}px solid ${figmaColorToCSS(stroke.color, stroke.opacity)}`;
}

function fontStyleToWeight(style = '') {
    const s = style.toLowerCase();
    if (s.includes('black') || s.includes('heavy')) return '900';
    if (s === 'bold' || s.includes('extra bold') || s.includes('extrabold')) return '700';
    if (s.includes('semi bold') || s.includes('semibold') || s.includes('demi')) return '600';
    if (s.includes('medium')) return '500';
    if (s.includes('light')) return '300';
    if (s.includes('thin') || s.includes('hairline')) return '100';
    return '400';
}

function axisAlignToFlex(value) {
    const map = {
        MIN: 'flex-start',
        MAX: 'flex-end',
        CENTER: 'center',
        SPACE_BETWEEN: 'space-between',
        BASELINE: 'baseline',
    };
    return map[value] || 'flex-start';
}

function borderRadiusStyle(node) {
    // Per-corner radius takes priority over uniform cornerRadius
    if (
        node.topLeftRadius != null ||
        node.topRightRadius != null ||
        node.bottomRightRadius != null ||
        node.bottomLeftRadius != null
    ) {
        const tl = node.topLeftRadius || 0;
        const tr = node.topRightRadius || 0;
        const br = node.bottomRightRadius || 0;
        const bl = node.bottomLeftRadius || 0;
        return `${tl}px ${tr}px ${br}px ${bl}px`;
    }
    if (node.cornerRadius) return `${node.cornerRadius}px`;
    return null;
}

// Converts camelCase key to kebab-case CSS property
function stylesToString(obj) {
    return Object.entries(obj)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => {
            const cssKey = k.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
            return `${cssKey}:${v}`;
        })
        .join(';');
}

function escapeText(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// --- Node renderer ---

/**
 * @param {object} node - Figma JSON node
 * @param {boolean} positionAbsolute - Whether to absolutely position this node (parent has no auto-layout)
 */
function renderNode(node, positionAbsolute = false) {
    if (!node) return '';

    // Skip hidden nodes
    if (node.visible === false) return '';

    const isAutoLayout = node.layoutMode && node.layoutMode !== 'NONE';
    const style = {};

    // Node-level opacity
    if (node.opacity != null && node.opacity < 1) {
        style.opacity = node.opacity;
    }

    // Rotation (Figma: clockwise degrees → CSS: counterclockwise, so negate)
    if (node.rotation) {
        style.transform = `rotate(${-node.rotation}deg)`;
    }

    // Absolute positioning (parent has no auto-layout)
    if (positionAbsolute) {
        style.position = 'absolute';
        style.left = `${node.x || 0}px`;
        style.top = `${node.y || 0}px`;
    }

    // Size — always set width; only set height for non-text nodes
    if (node.width != null) style.width = `${node.width}px`;
    if (node.height != null && node.type !== 'TEXT') style.height = `${node.height}px`;

    style.boxSizing = 'border-box';

    const radius = borderRadiusStyle(node);
    if (radius) style.borderRadius = radius;

    const border = strokesToBorder(node.strokes, node.strokeWeight);
    if (border) style.border = border;

    const shadow = effectsToBoxShadow(node.effects);
    if (shadow) style.boxShadow = shadow;

    // Layer blur effect
    const blurEffect = node.effects?.find(e => e.visible !== false && e.type === 'LAYER_BLUR');
    if (blurEffect) style.filter = `blur(${blurEffect.radius}px)`;

    // ── TEXT ──────────────────────────────────────────────────────────────────
    if (node.type === 'TEXT') {
        const fontName = node.fontName || {};
        style.display = 'block';
        style.color = figmaColorToCSS(
            getVisibleFill(node.fills)?.color,
            getVisibleFill(node.fills)?.opacity,
        );
        style.fontFamily = `'${fontName.family || 'Inter'}', sans-serif`;
        style.fontSize = `${node.fontSize || 14}px`;
        style.fontWeight = fontStyleToWeight(fontName.style);
        if ((fontName.style || '').toLowerCase().includes('italic')) {
            style.fontStyle = 'italic';
        }
        style.textAlign = (node.textAlignHorizontal || 'LEFT').toLowerCase();
        style.whiteSpace = 'pre-wrap';

        if (node.lineHeight?.unit === 'PERCENT') {
            style.lineHeight = `${node.lineHeight.value / 100}`;
        } else if (node.lineHeight?.unit === 'PIXELS') {
            style.lineHeight = `${node.lineHeight.value}px`;
        }

        if (node.letterSpacing?.value) {
            if (node.letterSpacing.unit === 'PIXELS') {
                style.letterSpacing = `${node.letterSpacing.value}px`;
            } else if (node.letterSpacing.unit === 'PERCENT') {
                style.letterSpacing = `${node.letterSpacing.value / 100}em`;
            }
        }

        if (node.textDecoration === 'UNDERLINE') style.textDecoration = 'underline';
        else if (node.textDecoration === 'STRIKETHROUGH') style.textDecoration = 'line-through';

        const caseMap = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' };
        if (caseMap[node.textCase]) style.textTransform = caseMap[node.textCase];

        return `<span style="${stylesToString(style)}">${escapeText(node.characters || '')}</span>`;
    }

    // ── ELLIPSE ───────────────────────────────────────────────────────────────
    if (node.type === 'ELLIPSE') {
        applyFillToStyle(style, node.fills);
        style.borderRadius = '50%';
        return `<div style="${stylesToString(style)}"></div>`;
    }

    // ── RECTANGLE with image fill ─────────────────────────────────────────────
    if (node.type === 'RECTANGLE') {
        const imgFill = node.fills?.find(f => f.type === 'IMAGE' && f.imageUrl);
        if (imgFill) {
            const safeUrl = imgFill.imageUrl.replace(/"/g, '%22');
            style.backgroundImage = `url("${safeUrl}")`;
            if (imgFill.scaleMode === 'TILE') {
                style.backgroundSize = 'auto';
                style.backgroundRepeat = 'repeat';
            } else {
                style.backgroundSize = imgFill.scaleMode === 'FIT' ? 'contain' : 'cover';
                style.backgroundRepeat = 'no-repeat';
                style.backgroundPosition = 'center';
            }
        } else {
            applyFillToStyle(style, node.fills);
        }
        return `<div style="${stylesToString(style)}"></div>`;
    }

    // ── FRAME / GROUP / COMPONENT / INSTANCE / others ─────────────────────────
    applyFillToStyle(style, node.fills);

    if (isAutoLayout) {
        style.display = 'flex';
        style.flexDirection = node.layoutMode === 'VERTICAL' ? 'column' : 'row';
        style.justifyContent = axisAlignToFlex(node.primaryAxisAlignItems);
        style.alignItems = axisAlignToFlex(node.counterAxisAlignItems);
        if (node.itemSpacing) style.gap = `${node.itemSpacing}px`;
        if (node.paddingTop) style.paddingTop = `${node.paddingTop}px`;
        if (node.paddingRight) style.paddingRight = `${node.paddingRight}px`;
        if (node.paddingBottom) style.paddingBottom = `${node.paddingBottom}px`;
        if (node.paddingLeft) style.paddingLeft = `${node.paddingLeft}px`;
    } else if (node.children?.length > 0) {
        style.position = 'relative';
    }

    if (node.clipsContent) style.overflow = 'hidden';

    // Children: absolutely positioned only when parent has no auto-layout
    const childrenHtml = (node.children || [])
        .map(child => renderNode(child, !isAutoLayout))
        .join('');

    return `<div style="${stylesToString(style)}">${childrenHtml}</div>`;
}

// --- Public API ---

/**
 * Converts an array of Figma JSON nodes (or a single node) to an HTML string.
 * @param {object|object[]} nodes
 * @returns {string} HTML string with inline styles
 */
export function figmaJsonToHtml(nodes) {
    if (!nodes) return '';
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    if (arr.length === 0) return '';
    return arr.map(node => renderNode(node, false)).join('');
}
