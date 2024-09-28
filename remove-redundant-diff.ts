import type { IChange } from "json-diff-ts";

export default function removeRedundantDiff(diff: IChange[]) {
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
