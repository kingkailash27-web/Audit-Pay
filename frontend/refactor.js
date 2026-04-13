import fs from 'fs';
import path from 'path';

const cssDir = path.join(process.cwd(), 'src');

const replacements = [
    { from: /#00D1FF/gi, to: '#3B82F6' },
    { from: /rgba\(0,\s*209,\s*255,/gi, to: 'rgba(59, 130, 246,' },
    { from: /#1a1f2e/gi, to: '#0F172A' },
    { from: /#2A3241/gi, to: '#1E293B' },
    { from: /#8b949e/gi, to: '#94A3B8' },
    { from: /#6b7280/gi, to: '#94A3B8' },
    { from: /#ffffff/gi, to: '#F8FAFC' }
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.css') || file.endsWith('.jsx')) { 
            results.push(file);
        }
    });
    return results;
}

const targetFiles = walk(cssDir);

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
        content = content.replace(r.from, r.to);
    });
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated theme colors in: ${path.basename(file)}`);
    }
});

console.log('De-cyanification complete!');
