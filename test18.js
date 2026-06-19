const katex = require('katex');
const html = katex.renderToString('\\left( x', {throwOnError: false});
console.log(html);
