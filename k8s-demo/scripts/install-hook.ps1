# ============================================================
#  Installe le hook git pre-push
#  A executer UNE SEULE FOIS depuis la racine du projet :
#  .\scripts\install-hook.ps1
# ============================================================

$ROOT     = Split-Path -Parent $PSScriptRoot
$hookDir  = "$ROOT\.git\hooks"
$hookFile = "$hookDir\pre-push"

# Contenu du hook (script bash appele par git)
$hookContent = @'
#!/bin/bash
echo ""
echo ">>> Hook pre-push : lancement du deploiement automatique..."
echo ""

SCRIPT_DIR="$(git rev-parse --show-toplevel)/scripts/deploy.ps1"

powershell.exe -ExecutionPolicy Bypass -File "$SCRIPT_DIR"

if [ $? -ne 0 ]; then
    echo ""
    echo "ERREUR : le deploiement a echoue. Push annule."
    echo "Corrige le probleme puis relance : git push"
    exit 1
fi

echo ""
echo "Deploiement OK - push en cours vers GitHub..."
exit 0
'@

# Creer le dossier hooks s'il n'existe pas
if (-not (Test-Path $hookDir)) {
    New-Item -ItemType Directory -Path $hookDir -Force | Out-Null
}

# Ecrire le fichier hook
Set-Content -Path $hookFile -Value $hookContent -Encoding UTF8 -NoNewline

# Le rendre executable (necessite Git Bash)
$gitBash = "C:\Program Files\Git\bin\bash.exe"
if (Test-Path $gitBash) {
    & $gitBash -c "chmod +x '$(($hookFile -replace '\\','/')  )'"
}

Write-Host ""
Write-Host "Hook pre-push installe avec succes !" -ForegroundColor Green
Write-Host ""
Write-Host "Desormais, chaque 'git push' declenchera automatiquement :" -ForegroundColor White
Write-Host "  - Build et push des images Docker modifiees" -ForegroundColor Gray
Write-Host "  - Deploiement sur Kubernetes" -ForegroundColor Gray
Write-Host "  - Rechargement MongoDB si le backend a change" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour desactiver le hook :" -ForegroundColor Yellow
Write-Host "  Remove-Item .git\hooks\pre-push" -ForegroundColor Yellow
Write-Host ""
