import echarts from './echarts.js';
export class FallbackEcharts {
    constructor() {
        this._plot = null;
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
    async terminate() {
        this._plot.dispose();
    }
}
//# sourceMappingURL=FallbackEcharts.js.map