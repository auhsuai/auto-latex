let latex = 'V_{vào} = 220\\text{V} và I_{tải} = 5\\text{A} hoặc P_{hao_phí} hoặc \\text{nếu } f < 1\\text{kHz}';
const textBlocks = [];

// Trích xuất các block \text{...} đã có
latex = latex.replace(/\\text\{[^}]*\}/g, (match) => {
    textBlocks.push(match);
    return '__TEXT_BLOCK_' + (textBlocks.length - 1) + '__';
});

console.log('After extraction:', latex);

// Regex bắt các cụm từ chứa tiếng Việt (có thể chứa chữ cái, dấu gạch dưới, khoảng trắng nếu nó nối liền chữ tiếng Việt)
// Wait, if we use [a-zA-Z_ ]*, it will match a lot of English words before/after the Vietnamese word!
// Like " và I" -> " và I" will be wrapped in \text!
// We only want to wrap the exact word/phrase. 
// Actually, [a-zA-Z_]* is safe because it only matches letters and underscores connected to the VN word!
// So "hao_phí" is one match.
const vnRegex = /([a-zA-Z_]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+[a-zA-Z_]*)/g;

latex = latex.replace(vnRegex, (match) => '\\text{' + match + '}');

console.log('After VN wrap:', latex);

// Phục hồi các block \text{...}
textBlocks.forEach((block, i) => {
    latex = latex.replace('__TEXT_BLOCK_' + i + '__', block);
});

console.log('Final:', latex);
