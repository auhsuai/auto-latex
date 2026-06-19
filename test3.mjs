import { remark } from 'remark';
import remarkMath from 'remark-math';

const text = "$$formula$$";
const ast = remark().use(remarkMath).parse(text);
console.dir(ast.children, {depth: null});
