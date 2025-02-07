import removeMarkdownWrapper from "../remove-markdown-wrapper"

export default async function deepseek({ 
    translateDiffs,
    locale,
    key,
    model = 'gemini-2.0-flash'
}: {
    translateDiffs: Record<string, any>;
    locale: string;
    key: string;
    model?: 'gemini-2.0-flash';
}) {
    const text = `You have rich software internationalization experience, you are good at using local and native languages to translate locale files.
    Rewrite this text in a more natural and fluent way, ensuring it sounds polished and natural, avoiding a literal translation.
    Translate this into ${locale}, but focus on idiomatic and smooth phrasing rather than a direct word-for-word translation.
    Accdording to context, make this text sound more polished and native-like by rephrasing it with a focus on clarity and fluency.
    Output in JSON format, use JSON schema:\n${JSON.stringify(translateDiffs)}`

    const config = {
        "contents": [
            {
                "parts": [{ text }],
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
        }
    }
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
    const result = await res.json()
    if (res.status !== 200) {
        console.error(res)
    }
    return removeMarkdownWrapper(result.candidates[0].content.parts[0].text)
}
