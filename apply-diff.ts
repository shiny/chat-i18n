import type { IChange } from "json-diff-ts";

export default async function applyDiff(diff: IChange[], target: Record<string, any>, translated: Record<string, any>) {
    for (const change of diff) {
        const key = /^\d+$/.test(change.key) ? Number(change.key) : change.key;
        if (Array.isArray(change.changes)) {
            if (!target[key]) {
                target[key] = change.embeddedKey === '$index' ? [] : {}
            }
            target[key] = await applyDiff(change.changes, target[key], translated[key]);
            continue;
        }
        switch (change.type) {
            case "REMOVE":
                delete target[key];
                break;
            case "ADD":
                target[key] = translated[key];
                break;
            case "UPDATE":
                target[key] = translated[key];
                break;
        }
    }
    return target;
}