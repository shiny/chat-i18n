#!/usr/bin/env bun
import { Glob } from "bun"
import { basename } from 'path'
import getDiff from "./get-diff"
import queryForDeepseek from "./provider/deepseek"
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
    }
  },
  strict: true,
  allowPositionals: true,
})

if (values.help) {
    console.log(`Usage: ${Bun.argv[0]} [options]`)
    console.log(`Options:`)
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

if (values.full) {
    console.log("Using full translation")
    const source = await Bun.file(sourceFile).json()
    for await (const localeFile of glob.scan()) {
        const targetLocale = basename(localeFile, '.json')
        if (targetLocale === cfg.source) {
            continue; 
        }
        console.log(`Updating ${localeFile}`)
        const translated = await queryForDeepseek({
            translateDiffs: source,
            locale: targetLocale,
            key: cfg.deekseek.api_key
        })
        const file = Bun.file(localeDir + '/' + targetLocale + '.json')
        await Bun.write(file, JSON.stringify(translated, null, 4))
    }
    process.exit(0)
}

const diffs = await getDiff(sourceFile)
const patchToTranslate = removeRedundantDiff(diffs)

for await (const localeFile of glob.scan()) {
    const targetLocale = basename(localeFile, '.json')
    if (targetLocale === cfg.source) {
        continue; 
    }
    console.log(`Updating ${localeFile}`)
    const translated = await queryForDeepseek({
        translateDiffs: patchToTranslate,
        locale: targetLocale,
        key: cfg.deekseek.api_key
    })
    const file = Bun.file(localeDir + '/' + targetLocale + '.json')
    const result = await file.json()
    const finalResult = await applyDiff(diffs, result, translated)
    await Bun.write(file, JSON.stringify(finalResult, null, 4))
}
