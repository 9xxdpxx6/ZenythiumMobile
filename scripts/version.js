#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Читаем build.gradle
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

// Функция для увеличения версии
function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch (type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2]++;
            break;
    }
    
    return parts.join('.');
}

// Обновляем версию в package.json
const newVersion = incrementVersion(packageJson.version, versionType);
packageJson.version = newVersion;

// Обновляем versionCode (увеличиваем на 1)
const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1]) : 1;
const newVersionCode = currentVersionCode + 1;

// Обновляем build.gradle
buildGradleContent = buildGradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${newVersionCode}`
);
buildGradleContent = buildGradleContent.replace(
    /versionName\s+"[^"]*"/,
    `versionName "${newVersion}"`
);

// Записываем изменения
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
fs.writeFileSync(buildGradlePath, buildGradleContent);

console.log(`✅ Версия обновлена: ${newVersion} (versionCode: ${newVersionCode})`);
console.log(`📱 Android: versionName="${newVersion}", versionCode=${newVersionCode}`);
console.log(`📦 Package: version="${newVersion}"`);
