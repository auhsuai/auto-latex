import { remark } from 'remark';
import remarkMath from 'remark-math';
const text = '$$ \\\\begin{bmatrix} a & b \\\\\\\\ c & d \\\\end{bmatrix} $$';
const ast = remark().use(remarkMath).parse(text);
console.log(ast.children[0]);
