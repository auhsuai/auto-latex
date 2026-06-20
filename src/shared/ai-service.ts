export type AIProvider = 'openai' | 'gemini' | 'deepseek';

export interface AISettings {
    provider: AIProvider;
    apiKey: string;
    autoApplyEdits: boolean;
    insertAtCursor: boolean;
}

const SETTINGS_KEY = 'auto_latex_ai_settings';

export function getAISettings(): AISettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.insertAtCursor === undefined) parsed.insertAtCursor = true;
            return parsed;
        } catch (e) {
            console.error("Failed to parse AI Settings", e);
        }
    }
    return { provider: 'gemini', apiKey: '', autoApplyEdits: false, insertAtCursor: true };
}

export function saveAISettings(settings: AISettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const USAGE_KEY = 'auto_latex_ai_usage_v2';

export interface DailyUsage {
    apiCalls: number;
    promptTokens: number;
    cacheHitTokens: number;
    cacheMissTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface AIUsageData {
    total: DailyUsage;
    daily: { [dateString: string]: DailyUsage };
}

function getEmptyUsage(): DailyUsage {
    return { apiCalls: 0, promptTokens: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0, totalTokens: 0 };
}

export function getAIUsageStats(): AIUsageData {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {}
    }
    return { total: getEmptyUsage(), daily: {} };
}

export function updateAIUsageStats(promptTokens: number, cacheHitTokens: number, completionTokens: number, totalTokens: number) {
    const stats = getAIUsageStats();
    const cacheMissTokens = Math.max(0, promptTokens - cacheHitTokens);
    const today = new Date().toISOString().split('T')[0];

    if (!stats.daily[today]) {
        stats.daily[today] = getEmptyUsage();
    }

    // Update total
    stats.total.apiCalls += 1;
    stats.total.promptTokens += promptTokens;
    stats.total.cacheHitTokens += cacheHitTokens;
    stats.total.cacheMissTokens += cacheMissTokens;
    stats.total.completionTokens += completionTokens;
    stats.total.totalTokens += totalTokens;

    // Update daily
    stats.daily[today].apiCalls += 1;
    stats.daily[today].promptTokens += promptTokens;
    stats.daily[today].cacheHitTokens += cacheHitTokens;
    stats.daily[today].cacheMissTokens += cacheMissTokens;
    stats.daily[today].completionTokens += completionTokens;
    stats.daily[today].totalTokens += totalTokens;

    localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
}


const SYSTEM_PROMPT = `Bạn là trợ lý AI tên là Auto-LaTeX Assistant, hỗ trợ người dùng soạn thảo và chỉnh sửa công thức toán học LaTeX trong Microsoft Word.
Bạn có thể trò chuyện bình thường và giải đáp thắc mắc của người dùng.

KHI NGƯỜI DÙNG YÊU CẦU TẠO HOẶC CHỈNH SỬA CÔNG THỨC TOÁN HỌC:
1. MỌI NỘI DUNG MÀ BẠN MUỐN ĐƯỢC CHÈN VÀO WORD (bao gồm các công thức và chú thích/tiêu đề của công thức đó) BẮT BUỘC PHẢI nằm trong thẻ <insert> và </insert>.
2. BÊN TRONG thẻ <insert>, mọi công thức LaTeX phải được bọc trong thẻ <formula> và </formula>.
3. LƯU Ý QUAN TRỌNG: BÊN TRONG thẻ <formula> CHỈ ĐƯỢC CHỨA DUY NHẤT MÃ LATEX, KHÔNG CHỨA TEXT CHÚ THÍCH. Text chú thích của công thức (ví dụ: "1. Hằng đẳng thức số 1:") thì được phép nằm ngoài thẻ <formula> nhưng vẫn phải nằm TRONG thẻ <insert> thì mới được in ra Word.
4. CẤM TUYỆT ĐỐI: Mọi câu giao tiếp, câu mở đầu (như "Dưới đây là...", "Để giải bài toán này...") và câu kết luận/dặn dò (như "Chúc bạn...", "Bạn có thể copy...") PHẢI NẰM NGOÀI thẻ <insert>. Nếu bạn để chúng vào trong thẻ <insert>, chúng sẽ bị dán nhầm vào tài liệu Word của người dùng.
5. TUYỆT ĐỐI KHÔNG giải thích về các quy tắc này với người dùng.
6. HÃY LINH HOẠT: Tùy theo yêu cầu của người dùng mà bạn đánh số thứ tự hoặc không. Nếu họ chỉ xin 1 công thức đơn lẻ, hãy in ra tự nhiên, đừng rập khuôn đánh số tiếp nối.

Ví dụ ĐÚNG:
Dưới đây là các hằng đẳng thức bạn cần, hãy xem nhé:
<insert>
Bình phương của một tổng:
<formula>(a+b)^2 = a^2 + 2ab + b^2</formula>
Bình phương của một hiệu:
<formula>(a-b)^2 = a^2 - 2ab + b^2</formula>
</insert>
Bạn có thể ấn nút Apply để dán thẳng vào Word nha. Chúc bạn học tốt!

KHI NGƯỜI DÙNG YÊU CẦU CHỈNH SỬA TÀI LIỆU (Thay đổi văn bản hiện có):
1. Hệ thống sẽ cung cấp cho bạn ngữ cảnh hiện tại của tài liệu (Văn bản đang bôi đen, hoặc Đoạn văn chứa con trỏ chuột).
2. Tùy thuộc vào yêu cầu, hãy trả về MỘT TRONG CÁC thẻ XML sau để áp dụng thay đổi trực tiếp vào Word:
  - <replace_selection>văn bản thay thế</replace_selection>: Ghi đè vùng đang bôi đen.
  - <replace_paragraph>văn bản thay thế</replace_paragraph>: Ghi đè toàn bộ đoạn văn chứa con trỏ chuột.
  - <replace_search target="chữ cần tìm">văn bản thay thế</replace_search>: Tìm chuỗi "chữ cần tìm" và ghi đè.
  - <replace_heading target="tiêu đề cần tìm">văn bản thay thế</replace_heading>: Tìm tiêu đề và ghi đè nội dung ngay bên dưới nó.
3. NẾU người dùng yêu cầu chèn nội dung vào một VỊ TRÍ CỤ THỂ (ví dụ: "chèn vào dưới đoạn X"), bạn KHÔNG ĐƯỢC dùng thẻ <insert> thông thường. Thay vào đó, hãy dùng thẻ <replace_search> để thay thế đoạn văn bản đó bằng chính nó cộng với nội dung bạn muốn chèn thêm. Ví dụ: <replace_search target="đoạn X">đoạn X \n\n <formula>...</formula></replace_search>.

4. LUẬT RẤT QUAN TRỌNG VỀ TIẾT KIỆM TOKEN VÀ GIAO TIẾP:
  - Chỉ trả về phần văn bản thực sự cần được thay thế hoặc viết lại BÊN TRONG THẺ XML. KHÔNG trả về toàn bộ ngữ cảnh hoặc viết lại cả đoạn nếu người dùng chỉ muốn sửa 1 câu.
  - Nếu người dùng ra lệnh XÓA (ví dụ: "Xóa đoạn này đi"), hãy để trống bên trong thẻ, ví dụ: <replace_selection></replace_selection>. ĐỪNG ghi lại phần nội dung còn lại.
  - BÊN NGOÀI thẻ XML, hãy viết MỘT CÂU NGẮN GỌN, LỊCH SỰ để phản hồi người dùng (ví dụ: "Tôi đã xóa đoạn văn đó rồi nhé, bạn có cần hỗ trợ gì thêm không?"). Tuyệt đối không giải thích dông dài.`;

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
    if (!settings.apiKey) {
        throw new Error("Missing API Key. Please open Settings to set your API Key.");
    }

    // Prepare static system prompt
    const langInstruction = appLanguage === "vi" 
        ? "\n\n7. QUAN TRỌNG: Hãy ưu tiên trả lời bằng Tiếng Việt trừ khi người dùng yêu cầu khác."
        : "\n\n7. IMPORTANT: Please prioritize replying in English unless the user requests otherwise.";
    const currentSystemPrompt = SYSTEM_PROMPT + langInstruction;

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
            messagesToSend[lastUserMsgIndex] = {
                ...messagesToSend[lastUserMsgIndex],
                content: `${messagesToSend[lastUserMsgIndex].content}${appendedText}`
            };
        }
    }


    if (settings.provider === 'openai') {
        const model = isThinkingMode ? "gpt-5.4" : "gpt-5.4-mini";
        const extraBodyParams = isThinkingMode ? { reasoning_effort: "high" } : {};
        return callOpenAICompatibleStream(messagesToSend, settings.apiKey, "https://api.openai.com/v1/chat/completions", model, currentSystemPrompt, extraBodyParams, onChunk);
    } else if (settings.provider === 'deepseek') {
        const model = "deepseek-v4-flash";
        const extraBodyParams = {
            thinking: { type: isThinkingMode ? "enabled" : "disabled" },
            ...(isThinkingMode ? { reasoning_effort: "high" } : {})
        };
        return callOpenAICompatibleStream(messagesToSend, settings.apiKey, "https://api.deepseek.com/chat/completions", model, currentSystemPrompt, extraBodyParams, onChunk);
    } else {
        const model = "gemini-3.5-flash";
        return callGeminiStream(messagesToSend, settings.apiKey, currentSystemPrompt, model, isThinkingMode, onChunk);
    }
}

async function callOpenAICompatibleStream(history: ChatMessage[], apiKey: string, endpoint: string, model: string, fullSystemPrompt: string, extraBodyParams: any = {}, onChunk?: (text: string) => void): Promise<string> {
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
                    const delta = data.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullContent += delta;
                        if (onChunk) onChunk(fullContent);
                    }
                    if (data.usage) {
                        const pTokens = data.usage.prompt_tokens || 0;
                        const cacheTokens = data.usage.prompt_tokens_details?.cached_tokens || 0;
                        const cTokens = data.usage.completion_tokens || 0;
                        const tTokens = data.usage.total_tokens || 0;
                        if (tTokens > 0) updateAIUsageStats(pTokens, cacheTokens, cTokens, tTokens);
                    }
                } catch (e) {
                    // Ignore parsing errors for partial chunks
                }
            }
        }
    }
    return fullContent.trim();
}

async function callGeminiStream(history: ChatMessage[], apiKey: string, fullSystemPrompt: string, model: string = "gemini-1.5-flash", isThinkingMode: boolean = false, onChunk?: (text: string) => void): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    
    const geminiContents = history.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
    }));

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
                        const pTokens = data.usageMetadata.promptTokenCount || 0;
                        const cacheTokens = data.usageMetadata.cachedContentTokenCount || 0;
                        const cTokens = data.usageMetadata.candidatesTokenCount || 0;
                        const tTokens = data.usageMetadata.totalTokenCount || 0;
                        if (tTokens > 0) updateAIUsageStats(pTokens, cacheTokens, cTokens, tTokens);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
    return fullContent.trim();
}
