const katex = require("katex");
console.log(katex.renderToString("\\dfrac{1}{2}", { output: "mathml", displayMode: false }));
