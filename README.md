# OffscreenEcharts

Echarts with OffscreenCanvas

* Echarts: https://github.com/apache/incubator-echarts

* OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas

* Original issue: https://github.com/apache/incubator-echarts/issues/9232

* Supported browser: https://caniuse.com/#feat=offscreencanvas

* Ref: https://segmentfault.com/a/1190000012563475

---

## Modify Echarts source code

1. Remove `&& !env.worker`
1. Modify `SaveAsImage.prototype.onclick` to let it support `OffscreenCanvas`

See `patch.diff`

## Known issues

1. [DataView](https://www.echartsjs.com/option.html#toolbox.feature.dataView) because it operates DOM
1. For charts that have very large dataset, tooltips can make the whole chart blank. It can be echarts bug, details unknown

## Demo

See Github Page: https://carterli.github.io/echarts-with-offscreencanvas/

Support the latest Chrome & Opera. Fallback version support Safari & Firefox 67 ( because older FireFox versions and Edge lack [dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports) support )
