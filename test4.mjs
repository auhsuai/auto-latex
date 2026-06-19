import { remark } from 'remark';
import remarkMath from 'remark-math';

const text = "Công thức Euler cực kỳ nổi tiếng: $e^{i\\pi} + 1 = 0 \\$ và đẳng thức lượng giác $\\sin^2 x + \\cos^2 x = 1 \\\\$.";
const ast = remark().use(remarkMath).parse(text);
console.dir(ast.children[0].children, {depth: null});
