import { remark } from 'remark';
import remarkMath from 'remark-math';
const text = 'hello\n$\\int\n\\frac$';
const ast = remark().use(remarkMath).parse(text);
console.log(JSON.stringify(ast.children[0].children));
