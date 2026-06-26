const katex = require("katex");
console.log("sum inline:");
console.log(katex.renderToString("\\sum_0^1", { output: "mathml", displayMode: false }));
console.log("sum block:");
console.log(katex.renderToString("\\sum_0^1", { output: "mathml", displayMode: true }));
