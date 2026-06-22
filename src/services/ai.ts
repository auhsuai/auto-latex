export type AIProvider = 'openai' | 'gemini' | 'deepseek' | 'minimax';

export interface AISettings {
    provider: AIProvider;
    apiKeys: Record<string, string>;
    autoApplyEdits: boolean;
    insertAtCursor: boolean;
}

const SETTINGS_KEY = 'auto_latex_ai_settings';

export function getAISettings(): AISettings {
    const defaultSettings: AISettings = { provider: 'gemini', apiKeys: {}, autoApplyEdits: false, insertAtCursor: true };
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.insertAtCursor === undefined) parsed.insertAtCursor = true;
            if (parsed.apiKey !== undefined && !parsed.apiKeys) {
                parsed.apiKeys = { [parsed.provider || 'gemini']: parsed.apiKey };
                delete parsed.apiKey;
            }
            if (!parsed.apiKeys) parsed.apiKeys = {};
            return { ...defaultSettings, ...parsed };
        } catch (e) {
            console.error("Failed to parse AI Settings", e);
        }
    }
    return defaultSettings;
}

export function saveAISettings(settings: AISettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const USAGE_KEY = 'auto_latex_ai_usage_v2';

export interface UsageMetrics {
    apiCalls: number;
    promptTokens: number;
    cacheHitTokens: number;
    cacheMissTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface DailyUsage extends UsageMetrics {
    providers: {
        [providerName: string]: UsageMetrics;
    };
}

export interface AIUsageData {
    total: UsageMetrics;
    providersTotal: {
        [providerName: string]: UsageMetrics;
    };
    daily: { [dateString: string]: DailyUsage };
}

function getEmptyUsage(): UsageMetrics {
    return { apiCalls: 0, promptTokens: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0, totalTokens: 0 };
}

export function getAIUsageStats(): AIUsageData {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            if (!data.providersTotal) data.providersTotal = {};
            for (const key in data.daily) {
                if (!data.daily[key].providers) data.daily[key].providers = {};
            }
            return data;
        } catch (e) {}
    }
    return { total: getEmptyUsage(), providersTotal: {}, daily: {} };
}

export function updateAIUsageStats(provider: string, promptTokens: number, cacheHitTokens: number, completionTokens: number, totalTokens: number) {
    const stats = getAIUsageStats();
    const cacheMissTokens = Math.max(0, promptTokens - cacheHitTokens);
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    if (!stats.daily[today]) {
        stats.daily[today] = { ...getEmptyUsage(), providers: {} };
    }
    if (!stats.daily[today].providers[provider]) {
        stats.daily[today].providers[provider] = getEmptyUsage();
    }
    if (!stats.providersTotal[provider]) {
        stats.providersTotal[provider] = getEmptyUsage();
    }

    // Update overall total
    stats.total.apiCalls += 1;
    stats.total.promptTokens += promptTokens;
    stats.total.cacheHitTokens += cacheHitTokens;
    stats.total.cacheMissTokens += cacheMissTokens;
    stats.total.completionTokens += completionTokens;
    stats.total.totalTokens += totalTokens;

    // Update provider total
    stats.providersTotal[provider].apiCalls += 1;
    stats.providersTotal[provider].promptTokens += promptTokens;
    stats.providersTotal[provider].cacheHitTokens += cacheHitTokens;
    stats.providersTotal[provider].cacheMissTokens += cacheMissTokens;
    stats.providersTotal[provider].completionTokens += completionTokens;
    stats.providersTotal[provider].totalTokens += totalTokens;

    // Update overall daily
    stats.daily[today].apiCalls += 1;
    stats.daily[today].promptTokens += promptTokens;
    stats.daily[today].cacheHitTokens += cacheHitTokens;
    stats.daily[today].cacheMissTokens += cacheMissTokens;
    stats.daily[today].completionTokens += completionTokens;
    stats.daily[today].totalTokens += totalTokens;

    // Update provider daily
    stats.daily[today].providers[provider].apiCalls += 1;
    stats.daily[today].providers[provider].promptTokens += promptTokens;
    stats.daily[today].providers[provider].cacheHitTokens += cacheHitTokens;
    stats.daily[today].providers[provider].cacheMissTokens += cacheMissTokens;
    stats.daily[today].providers[provider].completionTokens += completionTokens;
    stats.daily[today].providers[provider].totalTokens += totalTokens;

    localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
}


const SYSTEM_PROMPT = `Bạn là trợ lý AI tên là Auto-LaTeX Assistant, hỗ trợ người dùng soạn thảo và chỉnh sửa công thức toán học LaTeX trong Microsoft Word.
Bạn có thể trò chuyện bình thường và giải đáp thắc mắc của người dùng.

QUY ĐỊNH ĐỊNH DẠNG PHẢN HỒI (RẤT QUAN TRỌNG):
1. BẤT CỨ NỘI DUNG NÀO dùng để chèn hoặc thay thế vào tài liệu Word (công thức, lý thuyết, văn bản mẫu, lời giải chi tiết) bắt buộc phải nằm trọn vẹn bên trong MỘT TRONG CÁC THẺ XML ĐỘC LẬP SAU: <insert>, <replace_selection>, <replace_paragraph>, <replace_search>, hoặc <replace_heading>.
2. Vui lòng KHÔNG BAO GIỜ lồng các thẻ hành động vào nhau (Ví dụ: Tuyệt đối không lồng <replace_search> vào bên trong <insert>).
3. Các câu thoại hướng dẫn, chào hỏi, hoặc giải thích thêm cho người dùng phải nằm ngoài các thẻ hành động này. Ví dụ: "Dưới đây là công thức bạn cần: <insert><inline_formula>E = mc^2</inline_formula></insert>. Chúc bạn làm bài tốt!"
4. Bên trong các thẻ hành động, mọi công thức LaTeX phải được bọc trong thẻ <inline_formula> (nếu xen kẽ chữ) hoặc <block_formula> (nếu đứng riêng một dòng).
5. Thẻ <inline_formula> và <block_formula> chỉ được chứa duy nhất mã LaTeX, không chứa text chú thích. Text bình thường cứ viết tự do bên ngoài các thẻ formula này.
6. Tuyệt đối KHÔNG ĐƯỢC có ký tự xuống dòng thực tế (newline) ngay sau dấu > của thẻ mở <inline_formula> hoặc <block_formula>. Hãy viết liền mạch mã LaTeX ngay trên cùng một dòng. Xuống dòng thừa sẽ làm vỡ giao diện công thức.
7. Vui lòng phản hồi tự nhiên như một con người và không giải thích các quy tắc kỹ thuật này với người dùng.
8. Hãy linh hoạt định dạng nội dung (danh sách, đoạn văn) tùy theo ngữ cảnh, không rập khuôn đánh số nếu không cần thiết.

MỘT SỐ VÍ DỤ:
KHI NGƯỜI DÙNG YÊU CẦU CHÈN NỘI DUNG MỚI:
User: "Cho tôi công thức hằng đẳng thức"
Assistant:
Dưới đây là các hằng đẳng thức đáng nhớ:
<insert>
Bình phương của một tổng:
<block_formula>(a+b)^2 = a^2 + 2ab + b^2</block_formula>
Bình phương của một hiệu:
<block_formula>(a-b)^2 = a^2 - 2ab + b^2</block_formula>
</insert>
Bạn có thể ấn nút Apply để dán thẳng vào Word nha. Chúc bạn học tốt!

KHI NGƯỜI DÙNG YÊU CẦU CHỈNH SỬA TÀI LIỆU (Thay đổi văn bản hiện có):
1. Hệ thống sẽ cung cấp cho bạn ngữ cảnh hiện tại của tài liệu (Văn bản đang bôi đen, hoặc Đoạn văn chứa con trỏ chuột).
2. Tùy thuộc vào yêu cầu, hãy trả về MỘT TRONG CÁC thẻ XML sau để áp dụng thay đổi trực tiếp vào Word:
  - <replace_selection>văn bản thay thế</replace_selection>: Ghi đè vùng đang bôi đen.
  - <replace_paragraph>văn bản thay thế</replace_paragraph>: Ghi đè toàn bộ đoạn văn chứa con trỏ chuột.
  - <replace_search><target>chữ cần tìm</target><content>văn bản thay thế</content></replace_search>: Tìm chuỗi và ghi đè. LƯU Ý: Chuỗi <target> phải trích xuất CHÍNH XÁC từng khoảng trắng từ văn bản gốc. Nếu bạn cảm thấy <target> quá dài hoặc dễ bị sai lệch khoảng trắng/xuống dòng, hãy ƯU TIÊN dùng <replace_selection> hoặc <replace_paragraph> để thay thế cho an toàn.
  - <replace_heading><target>tiêu đề cần tìm</target><content>văn bản thay thế</content></replace_heading>: Tìm tiêu đề và ghi đè nội dung bên dưới.
3. NẾU người dùng yêu cầu chèn nội dung vào một VỊ TRÍ CỤ THỂ, hãy dùng thẻ:
<replace_search><target>đoạn X</target><content>đoạn X 

<block_formula>...</block_formula></content></replace_search>
(LƯU Ý: Hãy nhấn phím Enter để xuống dòng thực tế, KHÔNG gõ chữ \n\n).

4. QUY ĐỊNH VỀ ĐỊNH DẠNG MÃ LATEX VÀ TEXT:
  - VUI LÒNG KHÔNG BAO GIỜ sử dụng ký hiệu $ hoặc $$ bao quanh mã LaTeX bên trong thẻ <inline_formula> hay <block_formula>. Việc này sẽ làm HỎNG hệ thống rendering. Mã LaTeX BẮT BUỘC phải thuần túy (Ví dụ đúng: <inline_formula>a^2+b^2</inline_formula>).
  - Chỉ lặp lại chính xác đoạn văn bản ngắn (<target>) dùng làm điểm neo tìm kiếm; TUYỆT ĐỐI KHÔNG sao chép hay lặp lại toàn bộ ngữ cảnh tài liệu dài mà hệ thống cung cấp.
  - Vui lòng tập trung trực tiếp vào kết quả sửa đổi, tránh giải thích các bước giải toán hay lý do sửa lỗi trừ khi người dùng yêu cầu "Hãy giải thích".
  - Bên ngoài thẻ XML, hãy phản hồi tự nhiên (ví dụ: "Dưới đây là phần bổ sung cho bạn:"). Tránh mô tả hành động kỹ thuật như "tôi sẽ chèn vào", "tôi sẽ thay thế", và vui lòng không đề cập đến thẻ XML với người dùng.

5. ĐỊNH DẠNG TRÌNH BÀY (KHÔNG SỬ DỤNG BẢNG):
  - QUY TẮC CỨNG: Khung chat có chiều ngang RẤT HẸP. DO ĐÓ, TUYỆT ĐỐI KHÔNG BAO GIỜ ĐƯỢC TẠO BẢNG MARKDOWN (ví dụ: | Cột | Cột |). Nếu bạn cố tình vẽ bảng, giao diện sẽ bị vỡ nát!
  - BẮT BUỘC: Thay vì dùng bảng, bạn PHẢI LUÔN LUÔN trình bày mọi dữ liệu, sự so sánh hay tóm tắt dưới dạng DANH SÁCH GẠCH ĐẦU DÒNG (Bullet points). Nếu người dùng chủ động yêu cầu "kẻ bảng", hãy từ chối khéo léo (giải thích rằng khung chat quá hẹp để hiển thị bảng) và tự động chuyển sang trình bày dạng danh sách.`;

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    html?: string;
    toolbar?: string;
}

export interface DocumentContext {
    selectionText: string;
    paragraphText: string;
}

export async function sendChatMessage(
    history: ChatMessage[], 
    contextText: string = "", 
    appLanguage: string = "en",
    documentContext?: DocumentContext,
    isThinkingMode: boolean = false,
    onChunk?: (text: string) => void
): Promise<string> {
    const settings = getAISettings();
    const apiKey = settings.apiKeys[settings.provider] || '';
    if (!apiKey) {
        throw new Error("Missing API Key. Please open Settings to set your API Key.");
    }

    // Prepare static system prompt
    const langInstruction = appLanguage === "vi" 
        ? "\n\n7. QUAN TRỌNG: Hãy ưu tiên trả lời bằng Tiếng Việt."
        : "\n\n7. IMPORTANT: Please prioritize replying in English.";
        
    const autoApplyInstruction = settings.autoApplyEdits
        ? "\n\n8. LƯU Ý HỆ THỐNG: Chế độ 'Auto-Apply' ĐANG BẬT. Bất kỳ thẻ XML nào bạn xuất ra sẽ TỰ ĐỘNG CHÈN vào Word ngay lập tức. TUYỆT ĐỐI KHÔNG dặn người dùng 'hãy bấm nút Apply'. Hãy trả lời kiểu: 'Tôi đã tự động dán kết quả vào Word cho bạn'."
        : "\n\n8. LƯU Ý HỆ THỐNG: Chế độ 'Auto-Apply' đang TẮT. Bạn có thể lịch sự nhắc người dùng 'Hãy bấm nút Apply để dán vào Word'.";

    const thinkingInstruction = "\n\n9. LƯU Ý QUAN TRỌNG: NẾU BẠN SỬ DỤNG KHỐI SUY NGHĨ (THINKING), BẠN BẮT BUỘC PHẢI VIẾT CÂU TRẢ LỜI CHÍNH THỨC NẰM NGOÀI KHỐI SUY NGHĨ. TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ TRẢ LỜI BÊN TRONG KHỐI SUY NGHĨ.";

    const currentSystemPrompt = SYSTEM_PROMPT + langInstruction + autoApplyInstruction + thinkingInstruction;



    // Clone history to avoid modifying original array
    const messagesToSend = [...history];

    let documentContextStr = "";
    if (documentContext && (documentContext.selectionText || documentContext.paragraphText)) {
        documentContextStr += `\n\n[NGỮ CẢNH TÀI LIỆU HIỆN TẠI TỪ WORD]`;
        if (documentContext.selectionText) {
            documentContextStr += `\nVùng đang bôi đen (Selection): """${documentContext.selectionText}"""`;
        }
        if (documentContext.paragraphText && (!documentContext.selectionText || documentContext.selectionText.length < 5)) {
            documentContextStr += `\nĐoạn văn chứa con trỏ chuột (Paragraph): """${documentContext.paragraphText}"""`;
        }
    }

    if ((contextText && contextText.trim() !== "") || documentContextStr !== "") {
        let lastUserMsgIndex = -1;
        for (let i = messagesToSend.length - 1; i >= 0; i--) {
            if (messagesToSend[i].role === "user") {
                lastUserMsgIndex = i;
                break;
            }
        }
        if (lastUserMsgIndex >= 0) {
            let appendedText = "";
            if (contextText && contextText.trim() !== "") {
                appendedText += `\n\n[Bối cảnh văn bản đang bôi đen]:\n${contextText}`;
            }
            if (documentContextStr !== "") {
                appendedText += documentContextStr;
            }
            if (appendedText !== "") {
                appendedText += `\n\n(LƯU Ý: Phần ngữ cảnh tài liệu ở trên được đính kèm để bạn tham khảo nội dung Word của người dùng. Vui lòng tập trung đáp ứng yêu cầu chính của người dùng.)`;
            }
            messagesToSend[lastUserMsgIndex] = {
                ...messagesToSend[lastUserMsgIndex],
                content: `${messagesToSend[lastUserMsgIndex].content}${appendedText}`
            };
        }
    }



    if (settings.provider === 'openai') {
        const model = isThinkingMode ? "gpt-5.4" : "gpt-5.4-mini";
        const extraBodyParams = isThinkingMode ? { reasoning_effort: "high" } : {};
        return callOpenAICompatibleStream(settings.provider, messagesToSend, apiKey, "https://api.openai.com/v1/chat/completions", model, currentSystemPrompt, extraBodyParams, onChunk);
    } else if (settings.provider === 'deepseek') {
        const model = "deepseek-v4-flash";
        const extraBodyParams = {
            thinking: { type: isThinkingMode ? "enabled" : "disabled" },
            ...(isThinkingMode ? { reasoning_effort: "high" } : {})
        };
        return callOpenAICompatibleStream(settings.provider, messagesToSend, apiKey, "https://api.deepseek.com/chat/completions", model, currentSystemPrompt, extraBodyParams, onChunk);
    } else if (settings.provider === 'minimax') {
        const model = "MiniMax-M3";
        return callOpenAICompatibleStream(settings.provider, messagesToSend, apiKey, "https://api.tokenrouter.com/v1/chat/completions", model, currentSystemPrompt, {}, onChunk);
    } else {
        const model = "gemini-3.5-flash";
        return callGeminiStream(settings.provider, messagesToSend, apiKey, currentSystemPrompt, model, isThinkingMode, onChunk);
    }
}

async function callOpenAICompatibleStream(provider: string, history: ChatMessage[], apiKey: string, endpoint: string, model: string, fullSystemPrompt: string, extraBodyParams: any = {}, onChunk?: (text: string) => void): Promise<string> {
    const body: any = {
        model: model,
        messages: [
            { role: "system", content: fullSystemPrompt },
            ...history
        ],
        temperature: 0.2,
        stream: true,
        stream_options: { include_usage: true },
        ...extraBodyParams
    };
    
    if (extraBodyParams.thinking && extraBodyParams.thinking.type === "enabled") {
        delete body.temperature;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error("OpenAI API Error: " + errText);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullContent = "";
    let buffer = "";

    let finalPTokens = 0, finalCacheTokens = 0, finalCTokens = 0, finalTTokens = 0;
    let isThinking = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            boundary = buffer.indexOf("\n");

            if (line.startsWith("data: ")) {
                const dataStr = line.slice(6);
                if (dataStr === "[DONE]") continue;
                try {
                    const data = JSON.parse(dataStr);
                    const delta = data.choices?.[0]?.delta;
                    if (delta) {
                        if (delta.reasoning_content) {
                            if (!isThinking) {
                                isThinking = true;
                                fullContent += "<think>\n";
                            }
                            fullContent += delta.reasoning_content;
                            if (onChunk) onChunk(fullContent);
                        }
                        if (delta.content !== undefined && delta.content !== null) {
                            if (isThinking) {
                                isThinking = false;
                                fullContent += "\n</think>\n";
                            }
                            fullContent += delta.content;
                            if (onChunk) onChunk(fullContent);
                        }
                    }
                    if (data.usage) {
                        finalPTokens = data.usage.prompt_tokens || 0;
                        finalCacheTokens = data.usage.prompt_tokens_details?.cached_tokens || 0;
                        finalCTokens = data.usage.completion_tokens || 0;
                        finalTTokens = data.usage.total_tokens || 0;
                    }
                } catch (e) {
                    // Ignore parsing errors for partial chunks
                }
            }
        }
    }
    
    if (finalTTokens > 0) {
        updateAIUsageStats(provider, finalPTokens, finalCacheTokens, finalCTokens, finalTTokens);
    }
    
    return fullContent.trim();
}

async function callGeminiStream(provider: string, history: ChatMessage[], apiKey: string, fullSystemPrompt: string, model: string = "gemini-1.5-flash", isThinkingMode: boolean = false, onChunk?: (text: string) => void): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    
    const geminiContents: any[] = [];
    for (const msg of history) {
        const role = msg.role === "assistant" ? "model" : "user";
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
            geminiContents[geminiContents.length - 1].parts[0].text += "\n\n" + msg.content;
        } else {
            geminiContents.push({ role, parts: [{ text: msg.content }] });
        }
    }
    if (geminiContents.length > 0 && geminiContents[0].role === "model") {
        geminiContents.unshift({ role: "user", parts: [{ text: "(Context init)" }] });
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: fullSystemPrompt }]
            },
            contents: geminiContents,
            generationConfig: {
                temperature: 0.2,
                ...(isThinkingMode ? { thinkingConfig: { thinkingLevel: "HIGH" } } : { thinkingConfig: { thinkingLevel: "LOW" } })
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error("Gemini API Error: " + errText);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullContent = "";
    let buffer = "";

    let finalPTokens = 0, finalCacheTokens = 0, finalCTokens = 0, finalTTokens = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            boundary = buffer.indexOf("\n");

            if (line.startsWith("data: ")) {
                const dataStr = line.slice(6);
                try {
                    const data = JSON.parse(dataStr);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        fullContent += text;
                        if (onChunk) onChunk(fullContent);
                    }
                    if (data.usageMetadata) {
                        finalPTokens = data.usageMetadata.promptTokenCount || 0;
                        finalCacheTokens = data.usageMetadata.cachedContentTokenCount || 0;
                        finalCTokens = data.usageMetadata.candidatesTokenCount || 0;
                        finalTTokens = data.usageMetadata.totalTokenCount || 0;
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
    
    if (finalTTokens > 0) {
        updateAIUsageStats(provider, finalPTokens, finalCacheTokens, finalCTokens, finalTTokens);
    }
    
    return fullContent.trim();
}
