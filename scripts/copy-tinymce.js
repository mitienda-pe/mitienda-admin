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
