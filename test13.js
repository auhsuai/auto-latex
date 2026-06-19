const r1 = /(\\(?:inf|sup|min|max))([a-zA-Z0-9])/g;
const r2 = /(\\(?:infty|inf|sup|min|max))([a-zA-Z0-9])/g;
console.log('\\infty'.replace(r1, '$1 $2'));
console.log('\\infty'.replace(r2, '$1 $2'));
console.log('\\inftyA'.replace(r2, '$1 $2'));
