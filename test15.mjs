import { remark } from 'remark';
import remarkMath from 'remark-math';
const ast = remark().use(remarkMath).parse('hoặc $P_{hao_phí}$.');
console.log(JSON.stringify(ast, null, 2));
