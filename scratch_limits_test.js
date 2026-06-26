const katex = require("katex");
console.log(katex.renderToString("\\int_0^1", { output: "mathml", displayMode: true }));
