/* eslint-disable max-classes-per-file */
import { parse } from './SafeJson.js';
import echarts from './echarts.js';
echarts.setCanvasCreator(() => new OffscreenCanvas(32, 32));
const ctx = self;
class TooltipContent {
    constructor(param) {
        this._isShow = false;
        ctx.postMessage(['tooltip', {
                type: 'init',
                param,
            }]);
    }
    update() {
        // empty
    }
    show(tooltipModel) {
        this._isShow = true;
        const textStyleModel = tooltipModel.getModel('textStyle');
        ctx.postMessage(['tooltip', {
                type: 'show',
                param: {
                    transitionDuration: tooltipModel.get('transitionDuration') + 's',
                    backgroundColor: tooltipModel.get('backgroundColor'),
                    color: textStyleModel.getTextColor(),
                    font: textStyleModel.getFont(),
                    fontSize: textStyleModel.get('fontSize') + 'px',
                    textDecoration: textStyleModel.get('decoration'),
                    textAlign: textStyleModel.get('align'),
                    padding: tooltipModel.get('padding') + 'px',
                    borderColor: tooltipModel.get('borderColor'),
                    borderWidth: tooltipModel.get('borderWidth'),
                    extraCssText: tooltipModel.get('extraCssText'),
                },
            }]);
    }
    setContent(content) {
        ctx.postMessage(['tooltip', {
                type: 'setContent',
                param: content,
            }]);
    }
    setEnterable(_enterable) {
        // unimplemented
    }
    getSize() {
        return [0, 0];
    }
    moveTo(zrX, zrY) {
        ctx.postMessage(['tooltip', {
                type: 'moveTo',
                param: [zrX, zrY],
            }]);
    }
    hide() {
        if (this._isShow) {
            this._isShow = false;
            ctx.postMessage(['tooltip', {
                    type: 'hide',
                }]);
        }
    }
    hideLater(_time) {
        if (this._isShow) {
            setTimeout(() => this.hide(), _time);
        }
    }
    isShow() {
        return this._isShow;
    }
    dispose() {
        ctx.postMessage(['tooltip', {
                type: 'dispose',
            }]);
    }
    getOuterSize() {
        return [0, 0];
    }
}
TooltipContent.newLine = '\n';
const events = new class WorkerEventHandler {
    constructor() {
        this.plot = null;
    }
    init(canvas, theme, opts) {
        if (this.plot)
            throw new Error('Has been initialized');
        ctx.devicePixelRatio = opts.devicePixelRatio;
        const plot = this.plot = echarts.init(canvas, theme, opts);
        plot._api.saveAsImage = (args) => {
            ctx.postMessage(['saveAsImage', args]);
        };
        plot.getZr().handler.proxy.setCursor = (cursorStyle) => {
            ctx.postMessage(['setCursor', cursorStyle]);
        };
    }
    registerTheme(name, theme) {
        echarts.registerTheme(name, JSON.parse(theme));
    }
    addEventListener(type) {
        this.plot.off(type);
        return this.plot.on(type, params => {
            params.event = undefined;
            ctx.postMessage(['event', params]);
        });
    }
    removeEventListener(type) {
        return this.plot.off(type);
    }
    event(type, eventInitDict) {
        return this.plot.getDom()
            .dispatchEvent(Object.assign(new Event(type), eventInitDict));
    }
    callMethod(methodName, ...args) {
        return this.plot[methodName](...args);
    }
    setOption(json, ...args) {
        const option = parse(json);
        if (option.tooltip && typeof option.tooltip === 'object' && !option.tooltip.renderMode) {
            option.tooltip.renderMode = 'html';
            option.tooltip.renderer = TooltipContent;
        }
        return this.plot.setOption(option, ...args);
    }
    dispose() {
        this.plot.dispose();
        this.plot = null;
    }
}();
ctx.open = (...args) => {
    ctx.postMessage(['open', args]);
};
ctx.onmessage = msg => {
    try {
        ctx.postMessage(['resolve', events[msg.data.type](...msg.data.args)]);
    }
    catch (e) {
        if (e instanceof Error) {
            ctx.postMessage(['error', [e.name, e.message, e.stack]]);
        }
        else {
            ctx.postMessage(['reject', e]);
        }
    }
};
//# sourceMappingURL=renderer.worker.js.map