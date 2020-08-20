import echarts from './echarts.js';
export class FallbackEcharts {
    constructor() {
        this._plot = null;
    }
    async registerTheme(name, theme) {
        echarts.registerTheme(name, theme);
    }
    async on(type, listener) {
        this._plot.on(type, listener);
        return { type, listener };
    }
    async off(indicator) {
        if (!indicator.type)
            return;
        this._plot.off(indicator.type, indicator.listener);
        indicator.type = null;
        indicator.listener = null;
    }
    async init(el, theme) {
        this._plot = echarts.init(el, theme);
    }
    async callMethod(methodName, ...args) {
        return this._plot[methodName](...args);
    }
    async setOption(option, ...args) {
        return this._plot.setOption(option, ...args);
    }
    async dispatchAction(payload) {
        return this._plot.dispatchAction(payload);
    }
    async resize(opts) {
        this._plot.resize(opts);
    }
    dispose() {
        this._plot.dispose();
    }
}
//# sourceMappingURL=FallbackEcharts.js.map