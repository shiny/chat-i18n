import removeMarkdownWrapper from "../remove-markdown-wrapper"

export default async function deepseek({ 
    translateDiffs,
    locale,
    key
}: {
    translateDiffs: Record<string, any>;
    locale: string;
    key: string;
}) {
    const text = `你有丰富的软件国际化经验，擅长用地道、本土的语言翻译 locale 文件，目标语种代码为 ${locale}。根据下文，翻译并直接输出 json 格式:\n${JSON.stringify(translateDiffs)}`

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            "messages": [
                {
                    "content": text,
                    "role": "user"
                }
            ],
            "model": "deepseek-chat",
            "response_format": {
                "type": "json_object"
            },
        })
    })
    const { choices } = await res.json()
    console.log(choices)
    return removeMarkdownWrapper(choices?.[0]?.message?.content) || null
}
