export function getOffscreenCanvasSupport() {
    if (typeof OffscreenCanvas === 'function') {
        try {
            const offscreen = new OffscreenCanvas(32, 32);
            return !!offscreen.getContext('2d');
        }
        catch { }
        return false;
    }
}
export async function getEchartsAdaptor(forceFallback = false) {
    if (!forceFallback && getOffscreenCanvasSupport()) {
        const { OffscreenEcharts } = await import('./OffscreenEcharts.js');
        return OffscreenEcharts;
    }
    else {
        if (typeof echarts === 'undefined') {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.async = true;
                const { url } = (import.meta);
                script.src = url.slice(0, url.lastIndexOf('/')) + '/echarts.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        const { FallbackEcharts } = await import('./FallbackEcharts.js');
        return FallbackEcharts;
    }
}
//# sourceMappingURL=EchartsAdaptor.js.map