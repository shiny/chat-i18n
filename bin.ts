#!/usr/bin/env bun
import { Glob } from "bun"
import { basename } from 'path'
import getDiff from "./get-diff"
import queryForDeepseek from "./provider/deepseek"
import queryForGemini from "./provider/gemini"
import applyDiff from "./apply-diff"
import removeRedundantDiff from "./remove-redundant-diff"
const { default: cfg } = await import(process.cwd() + '/chat-i18n.toml')
import { parseArgs } from "util"

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    full: {
      type: 'boolean',
      default: false,
    },
    help: {
        type: 'boolean',
        alias: 'h',
        default: false,
    },
    target: {
        type: 'string',
        alias: 't',
        default: '',
    }
  },
  strict: true,
  allowPositionals: true,
})

if (values.help) {
    console.log(`Usage: ${Bun.argv[0]} [options]`)
    console.log(`Options:`)
    console.log(`  --target  Target locale to translate (default: all)`)
    console.log(`  --full    use full translation (default: false)`)
    console.log(`  --help    Show this help message`)
    process.exit(0)
}

const localeDir = './' + cfg.dir
const localeFiles = localeDir + "/*.json"
const sourceFile = localeDir + `/${cfg.source}.json`
const glob = new Glob(localeFiles);

if (!glob.match(sourceFile)) {
    console.error("Source file not found");
    process.exit(1);
}

const provider = cfg.provider.name
const providerConfig = cfg[provider]

const provides = {
    'deekseek': {
        query: queryForDeepseek,
        defaultModel: 'deepseek-reasoner'
    },
    'gemini': {
        query: queryForGemini,
        defaultModel: 'gemini-2.0-flash'
    }
}
const apiKey = providerConfig.api_key
//@ts-expect-error
const query = provides[provider].query
// @ts-expect-error
const model = providerConfig.model ?? provides[provider].defaultModel
if (!query) {
    console.error(`Provider ${provider} not found`);
    process.exit(1);
}
if (values.full) {
    console.log("Using full translation")
    const source = await Bun.file(sourceFile).json()
    for await (const localeFile of glob.scan()) {
        const targetLocale = basename(localeFile, '.json')
        if (targetLocale === cfg.source) {
            continue; 
        }
        if (values.target && targetLocale !== values.target) {
            continue;
        }
        console.log(`Updating ${localeFile}`)
        const translated = await query({
            translateDiffs: source,
            locale: targetLocale,
            key: apiKey,
            model
        })
        const file = Bun.file(localeDir + '/' + targetLocale + '.json')
        await Bun.write(file, JSON.stringify(translated, null, 4))
    }
    process.exit(0)
}

const diffs = await getDiff(sourceFile)
const patchToTranslate = removeRedundantDiff(diffs)

const localeFilesToTranslate = await Array.fromAsync(glob.scan())
const results = await Promise.allSettled(localeFilesToTranslate.map(localeFile => translate(localeFile)))
results.forEach(result => {
    if (result.status === 'rejected') {
        console.error(result.reason)
    }
})

async function translate(localeFile: string) {
    const targetLocale = basename(localeFile, '.json')
    if (targetLocale === cfg.source) {
        return; 
    }
    if (values.target && targetLocale !== values.target) {
        return;
    }
    console.log(`Updating ${localeFile}`)
    const translated = await query({
        translateDiffs: patchToTranslate,
        locale: targetLocale,
        key: apiKey,
        model
    })
    const file = Bun.file(localeDir + '/' + targetLocale + '.json')
    const result = await file.json()
    const finalResult = await applyDiff(diffs, result, translated)
    await Bun.write(file, JSON.stringify(finalResult, null, 4))

}