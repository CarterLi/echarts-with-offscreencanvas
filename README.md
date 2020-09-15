# OffscreenEcharts

Echarts with OffscreenCanvas

* Echarts: https://github.com/apache/incubator-echarts

* OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas

* Original issue: https://github.com/apache/incubator-echarts/issues/9232

* Supported browser: https://caniuse.com/#feat=offscreencanvas

* Ref: https://segmentfault.com/a/1190000012563475

## How does it work

1. A canvas cannot be used directly in worker, but OffscreenCanvas [can be used as a handle](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas#Asynchronous_display_of_frames_produced_by_an_OffscreenCanvas) to control it.
1. All rendering is done in worker. `Echarts` has plenty well worker support, with a few exception. Patched below.
1. Mouse events are bind on the canvas in UI thread. When triggered, necessary event data is sent into worker using `postMessage`, then dispatches the event to echarts instance using its internal API. See https://github.com/ecomfe/zrender/pull/448#issuecomment-692451904
1. All methods are dispatched into worker using `postMessage`, and return a promise immediately. After the method is called in worker, send its return value back to UI thread using `postMessage`, and then resolve the promise. See https://github.com/CarterLi/ThreadPool.js
1. All Echarts events are bound in worker, and send event data back to UI thread when triggered. In UI thread, `DocumentFragment` is used as an event bus.

## Modify Echarts source code

1. Add `&& !env.worker` to disable hoverLayerThreshold in worker. See https://github.com/apache/incubator-echarts/issues/13164
1. Modify `SaveAsImage.prototype.onclick` to let it support `OffscreenCanvas`
1. Optional: Remove UMD sh*t
1. Optional: Modify `tooltip.init` to let it accept a customized `TooltipContent` implementation

See `patch.diff`

## Known issues

1. [DataView](https://www.echartsjs.com/option.html#toolbox.feature.dataView) because it operates DOM ( won't fix because few people use it )
1. [Group](https://echarts.apache.org/zh/api.html#echartsInstance.group) doesn't work (yet)

## Demo

See Github Page: https://carterli.github.io/echarts-with-offscreencanvas/

Support Chrome 80+ ( due to using of module scripts on worker ). Fallback version support Safari & Firefox 67 ( because older FireFox versions and Edge lack [dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports) support )
