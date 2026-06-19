const katex = require('katex');

const percentMath = '50% + 50%';
console.log('Percent MathML:', katex.renderToString(percentMath, {output: 'mathml', throwOnError: false}));

const nbspMath = 'x' + String.fromCharCode(160) + '=' + String.fromCharCode(160) + '1';
console.log('NBSP MathML:', katex.renderToString(nbspMath, {output: 'mathml', throwOnError: false}));
