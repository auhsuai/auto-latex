import { remark } from 'remark';
import remarkMath from 'remark-math';
const text = 'hello\r\n$$ x $$';
const ast = remark().use(remarkMath).parse(text);
console.log(text.substring(ast.children[0].children[1].position.start.offset, ast.children[0].children[1].position.end.offset));
