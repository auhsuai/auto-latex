const katex = require("katex");

const html1 = katex.renderToString("\\frac{1}{2}", { output: "mathml", displayMode: false });
const html2 = katex.renderToString("\\displaystyle \\frac{1}{2}", { output: "mathml", displayMode: false });

console.log("Without displaystyle:");
console.log(html1.replace(/<semantics>([\s\S]*?)<annotation[\s\S]*?<\/annotation><\/semantics>/ig, "$1").replace(/<math/, '<math display="inline"'));
console.log("\nWith displaystyle:");
console.log(html2.replace(/<semantics>([\s\S]*?)<annotation[\s\S]*?<\/annotation><\/semantics>/ig, "$1").replace(/<math/, '<math display="inline"'));
