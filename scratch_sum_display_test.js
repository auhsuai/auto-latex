const katex = require("katex");
console.log("sum inline display:");
console.log(katex.renderToString("\\displaystyle\\sum_0^1", { output: "mathml", displayMode: false }));
