$files = Get-ChildItem -Path "apps/web/src/app/onboarding/cleaner" -Recurse -Include "*.tsx", "*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Encoding UTF8
    $newContent = $content -replace '/api/onboarding/cleaner', '/api/cleaner/onboarding'
    Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    Write-Host "Updated: $($file.FullName)"
}
Write-Host "Done!"
