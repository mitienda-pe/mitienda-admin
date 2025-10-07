# TinyMCE Self-Hosted

Este directorio contiene los archivos de TinyMCE copiados desde `node_modules`.

## ¿Por qué?

TinyMCE requiere varios archivos estáticos (plugins, skins, themes, etc.) que normalmente
se cargan desde un CDN. Para usar TinyMCE sin API key y completamente self-hosted,
necesitamos copiar estos archivos al directorio `public`.

## Instalación

Los archivos se copian automáticamente después de `npm install` gracias al script
`postinstall` definido en `package.json`.

Si necesitas copiar manualmente los archivos:

```bash
node scripts/copy-tinymce.js
```

## .gitignore

Los archivos de TinyMCE están en `.gitignore` excepto la carpeta `langs/` que contiene
las traducciones personalizadas. Esto evita trackear muchos archivos estáticos que se
pueden regenerar desde `node_modules`.

## Configuración en Vue

En el componente Vue, la configuración debe incluir:

```javascript
const tinyConfig = {
  base_url: '/tinymce',
  suffix: '.min',
  // ... resto de configuración
}
```

Esto le indica a TinyMCE que cargue los archivos desde `/public/tinymce` en lugar del CDN.
