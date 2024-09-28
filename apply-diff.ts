import type { IChange } from "json-diff-ts";

export default async function applyDiff(diff: IChange[], target: Record<string, any>, translated: Record<string, any>) {
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