import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { cpSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const tinymceSource = join(projectRoot, 'node_modules', 'tinymce')
const tinymceDest = join(projectRoot, 'public', 'tinymce')

console.log('📦 Copiando archivos de TinyMCE...')

// Crear directorio de destino si no existe
if (!existsSync(tinymceDest)) {
  mkdirSync(tinymceDest, { recursive: true })
}

// Copiar todos los archivos de TinyMCE
try {
  cpSync(tinymceSource, tinymceDest, {
    recursive: true,
    force: true
  })
  console.log('✅ Archivos de TinyMCE copiados correctamente')
} catch (error) {
  console.error('❌ Error al copiar archivos de TinyMCE:', error)
  process.exit(1)
}

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
