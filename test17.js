const katex = require('katex');

const matrix = '\\begin{matrix} a & b \\end{matrix}';
console.log('Matrix:', katex.renderToString(matrix, {output: 'mathml', throwOnError: false}));

const isolated = 'a & b';
console.log('Isolated:', katex.renderToString(isolated, {output: 'mathml', throwOnError: false}));

const cases = '\\begin{cases} a & b \\end{cases}';
console.log('Cases:', katex.renderToString(cases, {output: 'mathml', throwOnError: false}));
