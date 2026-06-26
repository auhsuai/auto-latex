const katex = require('katex');

const latex = `\\begin{aligned}
\\mathcal{L}_{Quantum} &= \\int_{\\partial \\Omega} \\left( \\sum_{i=1}^{N} \\frac{\\partial^2 \\Psi_i}{\\partial x^2} + \\frac{\\partial^2 \\Psi_i}{\\partial y^2} \\right) \\cdot \\mathbf{n} \\, dS + \\iint_{\\Omega} \\left( \\nabla \\times \\mathbf{A} - \\frac{1}{c}\\frac{\\partial \\mathbf{E}}{\\partial t} \\right) dx dy \\\\
&\\quad + \\lim_{N \\to \\infty} \\prod_{k=1}^{N} \\left( 1 - \\frac{s^2}{k^2 \\pi^2} \\right) \\times \\begin{pmatrix} \\frac{-b + \\sqrt{b^2 - 4ac}}{2a} & \\sin\\left(\\frac{\\pi}{2} - \\theta\\right) \\\\ e^{i\\pi} + 1 & \\log_{10}\\left( \\frac{\\mu F}{100} \\right) \\end{pmatrix} \\\\
&\\quad \\times \\begin{cases} \\Gamma(z) = \\int_0^\\infty t^{z-1} e^{-t} \\, dt & \\text{nếu } \\text{Phần thực của z} > 0 \\\\ \\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} & \\text{Trong các trường hợp Khác} \\end{cases} \\\\
&\\quad \\text{Đây là một đoạn text Tiếng Việt siêu dài...}
\\end{aligned}`;

try {
    const html = katex.renderToString(latex, {
        displayMode: true,
        output: "mathml",
        throwOnError: false,
        strict: false
    });
    console.log(html.substring(0, 500) + "\n...\n");
    // Look for <mtable> inside <mtd> inside <mtable>
    console.log("Number of <mtable>:", (html.match(/<mtable/g) || []).length);
    console.log("Contains <mo>∬</mo>:", html.includes('<mo>∬</mo>'));
    
    // check if it has a katex error
    if (html.includes("katex-error")) {
        console.log("KATEX ERROR DETECTED!");
        const errMatch = html.match(/title="([^"]+)"/);
        if (errMatch) console.log(errMatch[1]);
    } else {
        console.log("No KaTeX error.");
    }
} catch (e) {
    console.error(e);
}
