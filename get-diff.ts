import { execSync } from 'child_process'
import { diff } from 'json-diff-ts'

export default async function getDiff(sourceFile: string) {
    const oldFileContent = execSync(`git show HEAD:${sourceFile}`, { encoding: 'utf-8' });
    const newFileContent = await Bun.file(sourceFile).json();
    const oldJson = JSON.parse(oldFileContent);
    return diff(oldJson, newFileContent)
}
