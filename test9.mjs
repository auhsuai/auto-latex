import { remark } from 'remark';
import remarkMath from 'remark-math';
const text = 'hello\\r\\n$$ x $$';
const ast = remark().use(remarkMath).parse(text);
console.log(JSON.stringify(ast, null, 2));
