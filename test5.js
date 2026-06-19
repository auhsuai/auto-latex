const katex = require('katex');
try {
  console.log(katex.renderToString('e^{i\\pi} + 1 = 0 \\', {output: 'mathml', throwOnError: true}));
} catch(e) {
  console.error(e.message);
}
