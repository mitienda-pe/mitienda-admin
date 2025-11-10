#!/usr/bin/env node

/**
 * Script para decodificar un JWT y ver su contenido
 * Uso: node decode-jwt.js "tu_token_aqui"
 */

const token = process.argv[2]

if (!token) {
  console.error('❌ Por favor proporciona un token JWT')
  console.error('Uso: node decode-jwt.js "tu_token_aqui"')
  process.exit(1)
}

try {
  // Decodificar el payload (parte 2 del JWT)
  const parts = token.split('.')

  if (parts.length !== 3) {
    throw new Error('Token JWT inválido (debe tener 3 partes separadas por puntos)')
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))

  console.log('\n📋 Contenido del JWT:\n')
  console.log(JSON.stringify(payload, null, 2))
  console.log('\n🏪 Store ID:', payload.store_id || 'NO ENCONTRADO')
  console.log('👤 User ID:', payload.user_id || 'NO ENCONTRADO')
  console.log('📧 Email:', payload.email || 'NO ENCONTRADO')
  console.log('\n')
} catch (error) {
  console.error('❌ Error al decodificar el token:', error.message)
  process.exit(1)
}
