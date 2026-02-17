<?php
/**
 * FrancoLink White-Label Rebranding Script
 * Usage: php rebrand.php "NewAppName" "newdomain.com"
 */

if ($argc < 3) {
    die("Usage: php rebrand.php 'NewAppName' 'newdomain.com'\n");
}

$newAppName = $argv[1];
$newDomain = $argv[2];

// Files to search/replace
$extensions = ['tsx', 'ts', 'json', 'md', 'sql', 'env.example'];
$excludeDirs = ['node_modules', '.next', '.git', 'dist'];

// Replacements
$replacements = [
    'FrancoLink' => $newAppName,
    'francolink.com' => $newDomain,
    'francolink.net' => $newDomain,
    'FRANCOLINK' => strtoupper($newAppName),
    'francolink' => strtolower(str_replace(' ', '', $newAppName)),
];

function scanDirectory($dir, $extensions, $excludeDirs, $replacements) {
    $files = scandir($dir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        
        if (is_dir($path)) {
            if (in_array($file, $excludeDirs)) continue;
            scanDirectory($path, $extensions, $excludeDirs, $replacements);
        } else {
            $ext = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array($ext, $extensions)) {
                replaceInFile($path, $replacements);
            }
        }
    }
}

function replaceInFile($filePath, $replacements) {
    $content = file_get_contents($filePath);
    $originalContent = $content;
    
    foreach ($replacements as $search => $replace) {
        $content = str_replace($search, $replace, $content);
    }
    
    if ($content !== $originalContent) {
        file_put_contents($filePath, $content);
        echo "✓ Updated: $filePath\n";
    }
}

echo "Starting rebranding to: $newAppName ($newDomain)\n\n";

scanDirectory('.', $extensions, $excludeDirs, $replacements);

echo "\n✅ Rebranding complete!\n";
echo "Next steps:\n";
echo "1. Update .env.local with new domain\n";
echo "2. Replace logo files in /public\n";
echo "3. Update Supabase app_settings via SQL or admin panel\n";
?>