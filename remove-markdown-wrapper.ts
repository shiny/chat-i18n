export default function removeMarkdownWrapper(text: string) {
    if (text.startsWith('```json') && text.endsWith('```')) {
        return JSON.parse(text.slice(7, -3).trim())
    } else {
        return JSON.parse(text.trim())
    }
}