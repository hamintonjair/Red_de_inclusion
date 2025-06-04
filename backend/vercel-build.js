const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando proceso de construcción personalizado para Vercel...');

// Función para ejecutar comandos con manejo de errores
function runCommand(command, cwd = process.cwd()) {
  console.log(`📝 Ejecutando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    console.error(`❌ Error al ejecutar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log('🔍 Verificando estructura de directorios...');
    
    // Verificar si estamos en el directorio correcto
    const isBackendDir = fs.existsSync(path.join(process.cwd(), 'app'));
    const projectRoot = isBackendDir ? '..' : '.';
    const backendDir = isBackendDir ? '.' : 'backend';
    const frontendDir = isBackendDir ? '../frontend' : 'frontend';
    
    console.log(`📂 Directorio raíz del proyecto: ${path.resolve(projectRoot)}`);
    
    // Instalar dependencias del backend
    console.log('🐍 Instalando dependencias de Python...');
    if (!runCommand('pip install -r requirements-vercel.txt', backendDir)) {
      throw new Error('Error al instalar dependencias de Python');
    }
    
    // Instalar dependencias del frontend
    console.log('🔄 Instalando dependencias de Node.js...');
    if (fs.existsSync(path.join(projectRoot, frontendDir, 'package.json'))) {
      if (!runCommand('npm install', path.join(projectRoot, frontendDir))) {
        console.warn('⚠️  No se pudieron instalar las dependencias del frontend');
      }
      
      // Construir el frontend
      console.log('🔨 Construyendo el frontend...');
      if (!runCommand('npm run build', path.join(projectRoot, frontendDir))) {
        console.warn('⚠️  No se pudo construir el frontend');
      }
    } else {
      console.log('ℹ️  No se encontró el directorio del frontend, omitiendo...');
    }
    
    console.log('✅ Construcción completada exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la construcción:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
