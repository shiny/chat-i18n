import removeMarkdownWrapper from "../remove-markdown-wrapper"

export default async function deepseek({ 
    translateDiffs,
    locale,
    key,
    model = 'deepseek-reasoner'
}: {
    translateDiffs: Record<string, any>;
    locale: string;
    key: string;
    model?: 'deepseek-reasoner' | 'deepseek-chat';
}) {
    const text = `You have rich software internationalization experience, you are good at using local and native languages to translate locale files.
    Rewrite this text in a more natural and fluent way, ensuring it sounds polished and natural, avoiding a literal translation.
    Translate this into ${locale}, but focus on idiomatic and smooth phrasing rather than a direct word-for-word translation.
    Accdording to context, make this text sound more polished and native-like by rephrasing it with a focus on clarity and fluency.
    Only Output json, DO NOT ADD EXTRA TEXT:\n${JSON.stringify(translateDiffs)}`

    const config = {
        "messages": [
            {
                "content": text,
                "role": "user"
            }
        ],
        "model": model,
        "response_format": model === 'deepseek-chat' ? {
            "type": "json_object"
        } : undefined
    }
    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify(config)
    })
    const result = await res.json()
    if (res.status !== 200) {
        console.error(result)
        throw new Error(`Deepseek API error: ${res.status} ${res.statusText}`)
    }
    const { choices } = result
    console.log(choices)
    return removeMarkdownWrapper(choices?.[0]?.message?.content) || null
}
