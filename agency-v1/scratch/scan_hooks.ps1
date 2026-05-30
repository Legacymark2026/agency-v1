# scan_hooks.ps1
$rootDir = "c:\Users\hboho\.gemini\antigravity\scratch\agency-v1\apps\web"
$files = Get-ChildItem -Path $rootDir -Filter *.tsx -Recurse | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.next" -and $_.FullName -notmatch "dist" }
$files += Get-ChildItem -Path $rootDir -Filter *.ts -Recurse | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.next" -and $_.FullName -notmatch "dist" }

Write-Host "Scanning $($files.Count) files..."

foreach ($file in $files) {
    # Use -LiteralPath to avoid bracket wildcard expansion errors
    $content = Get-Content -LiteralPath $file.FullName
    $lines = $content
    
    # We want to find cases where there is a return line followed by a hook call
    # And hooks inside if blocks
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()
        if ($line.StartsWith("//") -or $line.StartsWith("*")) { continue }
        
        # Check for hooks after return:
        if ($line -like "*return*" -and ($line -like "*if*" -or $line -like "*&&*" -or $line -like "*?*" -or $line -like "*!*" -or $line.StartsWith("return"))) {
            # Look ahead up to 40 lines
            for ($j = $i + 1; $j -lt [Math]::Min($i + 40, $lines.Count); $j++) {
                $nextLine = $lines[$j].Trim()
                if ($nextLine.StartsWith("//") -or $nextLine.StartsWith("*")) { continue }
                if ($nextLine -eq "}") { break } # End of block
                
                if ($nextLine -match "\buse[A-Z]\w*\s*\(") {
                    Write-Host ""
                    Write-Host "File: $($file.FullName)" -ForegroundColor Cyan
                    Write-Host "  [POTENTIAL VIOLATION] Hook call after return:" -ForegroundColor Red
                    Write-Host "    Line $($i+1): $line"
                    Write-Host "    Line $($j+1): $nextLine"
                    break
                }
            }
        }
        
        # Check for hooks inside if conditions or immediately following:
        if ($line -match "\bif\s*\(") {
            for ($j = $i; $j -lt [Math]::Min($i + 5, $lines.Count); $j++) {
                $nextLine = $lines[$j].Trim()
                if ($nextLine -match "\buse[A-Z]\w*\s*\(") {
                    Write-Host ""
                    Write-Host "File: $($file.FullName)" -ForegroundColor Cyan
                    Write-Host "  [POTENTIAL VIOLATION] Hook inside or near if:" -ForegroundColor Yellow
                    Write-Host "    Line $($j+1): $nextLine"
                }
            }
        }
    }
}
Write-Host "Scan finished."
