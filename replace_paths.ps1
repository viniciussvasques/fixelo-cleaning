$files = Get-ChildItem -Path "apps/web/src" -Recurse -Include "*.tsx","*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '/cleaner/onboarding') {
        $newContent = $content -replace '/cleaner/onboarding', '/onboarding/cleaner'
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Done!"
