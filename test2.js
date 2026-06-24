const fs = require('fs');
const content = fs.readFileSync('src/core/converter.ts', 'utf-8');
// extract functions
eval(content.replace(/export /g, '').replace(/import .*?from .*?;/g, ''));

const input = "F(\\omega) = e^{-2i\\omega} G(\\omega) = \\frac{e^{-2i\\omega}}{3+i\\omega}";
const output = sanitizeLaTeX(input, true);
console.log("INPUT: " + input);
console.log("OUTPUT: " + output);
