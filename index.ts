const { execSync } = require('child_process');
import { diff, type IChange } from 'json-diff-ts';


const sourceLocale = 'en';
// // get the output of git diff
const oldFileContent = execSync(`git show HEAD:messages/${sourceLocale}.json`, { encoding: 'utf-8' });
const newFileContent = await Bun.file(`messages/${sourceLocale}.json`).json();

const oldJson = JSON.parse(oldFileContent);
// const newJson = JSON.parse(newFileContent);


const patch = diff(oldJson, newFileContent)

const patchToTranslate = removeRedundantDiff(patch)
// console.log(await queryForDeepseek(patchToTranslate, 'es'))
// console.log(await queryForDeepseek(patchToTranslate, 'zh-CN'))
import { Glob } from 'bun'
import { basename } from 'path';
const glob = new Glob('*.json')

for await (const localeFile of glob.scan("./messages")) {
    const locale = basename(localeFile, '.json')
    if (locale === sourceLocale) {
        continue;
    }
    console.log(`Updating ${localeFile}`)
    const translated = await queryForDeepseek(patchToTranslate, locale)
    const file = Bun.file('./messages/' + localeFile)
    const result = await file.json()
    const finalResult = await applyDiff(patch, result, translated)
    await Bun.write(file, JSON.stringify(finalResult, null, 4))
}


function removeRedundantDiff(diff: IChange[]) {
    const result: Record<string, any> = {};
    for (const change of diff) {
        if (Array.isArray(change.changes)) {
            result[change.key] = removeRedundantDiff(change.changes);
            continue
        }
        switch (change.type) {
            case "ADD":
                result[change.key] = change.value;
                break;
            case "UPDATE":
                result[change.key] = change.value;
                break;
            case "REMOVE":
                break;
        }
    }
    return result;
}

async function applyDiff(diff: IChange[], target: Record<string, any>, translated: Record<string, any>) {
    for (const change of diff) {

        if (Array.isArray(change.changes)) {
            if (!target[change.key]) {
                target[change.key] = {}
            }
            target[change.key] = await applyDiff(change.changes, target[change.key], translated[change.key]);
            continue;
        }
        if (change.embeddedKey) {
            throw new Error("Does not support an array");
        }
        switch (change.type) {
            case "REMOVE":
                delete target[change.key];
                break;
            case "ADD":
                target[change.key] = translated[change.key];
                break;
            case "UPDATE":
                target[change.key] = translated[change.key];
                break;
        }
    }
    return target;
}

function removeMarkdownWrapper(text: string) {
    if (text.startsWith('```json') && text.endsWith('```')) {
        return JSON.parse(text.slice(7, -3).trim())
    } else {
        return JSON.parse(text.trim())
    }
}

export async function queryForDeepseek(translateDiffs: Record<string, any>, locale: string) {
    const text = `你有丰富的软件国际化经验，擅长用地道、本土的语言翻译 locale 文件，目标语种代码为 ${locale}。根据下文，翻译并直接输出 json 格式:\n${JSON.stringify(translateDiffs)}`

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            "messages": [
                {
                    "content": text,
                    "role": "user"
                }
            ],
            "model": "deepseek-chat"
        })
    })
    const { choices } = await res.json()
    return removeMarkdownWrapper(choices?.[0]?.message?.content) || null
}
