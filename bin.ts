#!/usr/bin/env bun
import { Glob } from "bun"
import { basename } from 'path'
import getDiff from "./get-diff"
import queryForDeepseek from "./provider/deepseek"
import applyDiff from "./apply-diff"
import removeRedundantDiff from "./remove-redundant-diff"
const { default: cfg } = await import(process.cwd() + '/chat-i18n.toml')

const localeDir = './' + cfg.dir
const localeFiles = localeDir + "/*.json"
const sourceFile = localeDir + `/${cfg.source}.json`
const glob = new Glob(localeFiles);

if (!glob.match(sourceFile)) {
    console.error("Source file not found");
    process.exit(1);
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
