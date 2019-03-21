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
