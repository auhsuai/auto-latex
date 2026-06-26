const katex = require("katex");
console.log(katex.renderToString("\\frac{1}{2}", { output: "mathml", displayMode: false }));
console.log(katex.renderToString("\\frac{1}{2}", { output: "mathml", displayMode: true }));
