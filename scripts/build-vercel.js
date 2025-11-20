const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

const rootDir = path.join(__dirname, '..');

copyFile(
    path.join(rootDir, 'index.html'),
    path.join(publicDir, 'index.html')
);

copyDir(path.join(rootDir, 'css'), path.join(publicDir, 'css'));
copyDir(path.join(rootDir, 'img'), path.join(publicDir, 'img'));
copyDir(path.join(rootDir, 'dist'), path.join(publicDir, 'dist'));

console.log('✅ Arquivos copiados para public/ com sucesso!');

