const ctx = self;
// Hack echarts
ctx.window = self;
ctx.importScripts('./echarts.js');
echarts.setCanvasCreator(() => new OffscreenCanvas(32, 32));
const events = new class WorkerEventHandler {
    constructor() {
        this.plot = null;
    }
    getDom() {
        return this.plot.getDom();
    }
    init(canvas, theme, opts) {
        if (this.plot)
            throw new Error('Has been initialized');
        ctx.devicePixelRatio = opts.devicePixelRatio;
        const plot = this.plot = echarts.init(canvas, theme, opts);
        plot._api.saveAsImage = async (opts) => {
            const { title, type } = opts;
            const blob = await this.getDom().convertToBlob({
                type: 'image/' + type,
            });
            ctx.postMessage(['saveAsImage', {
                    blob,
                    fileName: `${title}.${type}`,
                }]);
        };
    }
    addEventListener(type) {
        this.plot.off(type);
        this.plot.on(type, params => {
            params.event = undefined;
            ctx.postMessage(['event', params]);
        });
    }
    removeEventListener(type) {
        this.plot.off(type);
    }
    event(type, eventInitDict) {
        this.plot.getDom().dispatchEvent(Object.assign(new Event(type), eventInitDict));
    }
    callMethod(methodName, ...args) {
        this.plot[methodName](...args);
    }
    dispose() {
        this.plot.dispose();
        this.plot = null;
    }
};
ctx.open = (...args) => {
    ctx.postMessage(['open', args]);
};
ctx.onmessage = msg => {
    ctx.postMessage(['finish', events[msg.data.type](...msg.data.args)]);
};
//# sourceMappingURL=worker.js.map