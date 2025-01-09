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
    const text = `You have rich software internationalization experience, you are good at using local and native languages to translate locale files.
    Rewrite this text in a more natural and fluent way, ensuring it sounds polished and natural, avoiding a literal translation.
    Translate this into ${locale}, but focus on idiomatic and smooth phrasing rather than a direct word-for-word translation.
    Accdording to context, make this text sound more polished and native-like by rephrasing it with a focus on clarity and fluency.
    Output json:\n${JSON.stringify(translateDiffs)}`

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
