/**
 * Build: copy the plain-JS sources from src/ into the published lib/.
 * Zero dependencies — the plugin halves are plain JavaScript on purpose.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(root, 'src')
const libDir = join(root, 'lib')

await mkdir(libDir, { recursive: true })
for (const file of ['index.js', 'client.js']) {
  await copyFile(join(srcDir, file), join(libDir, file))
  console.log(`built lib/${file}`)
}
