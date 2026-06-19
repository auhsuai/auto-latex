import { remark } from 'remark';
import remarkMath from 'remark-math';

const text = "**$Q_{tỏa} = I^2 R t$**";
const ast = remark().use(remarkMath).parse(text);
console.dir(ast.children[0].children, {depth: null});
