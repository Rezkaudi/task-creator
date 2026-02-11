
export default function ResizeHandle() {
    const handlePointerDown = (e) => {
        const corner = e.currentTarget;

        const resizeWindow = (ev) => {
            const size = {
                w: Math.max(400, Math.floor(ev.clientX + 5)),
                h: Math.max(300, Math.floor(ev.clientY + 5))
            };
            parent.postMessage({ pluginMessage: { type: 'resize-window', size } }, '*');
        };

        corner.onpointermove = resizeWindow;
        corner.setPointerCapture(e.pointerId);

        corner.onpointerup = (ev) => {
            corner.onpointermove = null;
            corner.releasePointerCapture(ev.pointerId);
        };
    };

    return <div id="resize-corner" onPointerDown={handlePointerDown}></div>;
}
