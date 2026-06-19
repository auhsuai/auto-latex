import { remark } from 'remark';
import remarkMath from 'remark-math';

const text = "áp dụng công thức sau: $$C = 2\\pi R = \\pi D$$";
const ast = remark().use(remarkMath).parse(text);
console.dir(ast.children, {depth: null});
