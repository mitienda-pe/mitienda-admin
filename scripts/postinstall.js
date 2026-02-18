import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { cpSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')

// --- MTBuilder locales ---
const mtbuilderLocalesSource = join(projectRoot, 'node_modules', '@carlosvidalperu', 'mtbuilder', 'src', 'locales')
const mtbuilderLocalesDest = join(projectRoot, 'public', 'src', 'locales')

console.log('📦 Copiando locales de MTBuilder...')

if (!existsSync(mtbuilderLocalesDest)) {
  mkdirSync(mtbuilderLocalesDest, { recursive: true })
}

try {
  cpSync(mtbuilderLocalesSource, mtbuilderLocalesDest, {
    recursive: true,
    force: true
  })
  console.log('✅ Locales de MTBuilder copiados correctamente')
} catch (error) {
  console.error('❌ Error al copiar locales de MTBuilder:', error)
  process.exit(1)
}
