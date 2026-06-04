# ============================================================
#  MotoShop — Script de deploiement automatique
#  Usage : .\scripts\deploy.ps1
#          .\scripts\deploy.ps1 -Force   (tout rebuilder)
# ============================================================
param([switch]$Force)

$ErrorActionPreference = "Stop"
$NAMESPACE   = "ecommerce"
$DOCKER_USER = "alexandraassaga"
$ROOT        = Split-Path -Parent $PSScriptRoot   # C:\Users\alexa\k8s-demo

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  MotoShop - Deploiement automatique  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ROOT

# ── Detecter le prefixe git (ex: "k8s-demo/") ───────────────────
# La racine git peut etre au-dessus de k8s-demo
$GIT_ROOT = (git rev-parse --show-toplevel 2>$null) -replace '/', '\'
$PREFIX   = ""
if ($GIT_ROOT -and ($GIT_ROOT -ne $ROOT)) {
    $rel     = $ROOT.Replace($GIT_ROOT, "").TrimStart("\")
    $PREFIX  = ($rel -replace "\\", "/") + "/"
}
# PREFIX = "k8s-demo/" si le depot git est au-dessus, "" sinon

# ── Detecter les changements ─────────────────────────────────────
$backendChanged  = $false
$frontendChanged = $false
$k8sChanged      = $false

if ($Force) {
    Write-Host "Mode -Force : deploiement complet force" -ForegroundColor Yellow
    $backendChanged = $frontendChanged = $k8sChanged = $true
} else {
    $changed = git diff --name-only HEAD 2>$null
    if (-not $changed) {
        $changed = git diff --name-only HEAD~1 HEAD 2>$null
    }

    if ($changed) {
        Write-Host "Fichiers modifies :" -ForegroundColor Gray
        $changed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
        Write-Host ""
    }

    $backendChanged  = ($changed | Where-Object { $_ -like "${PREFIX}backend/*"  }).Count -gt 0
    $frontendChanged = ($changed | Where-Object { $_ -like "${PREFIX}frontend/*" }).Count -gt 0
    $k8sChanged      = ($changed | Where-Object { $_ -like "${PREFIX}k8s/*"      }).Count -gt 0
}

if (-not $backendChanged -and -not $frontendChanged -and -not $k8sChanged) {
    Write-Host "Aucun changement detecte dans backend/, frontend/ ou k8s/." -ForegroundColor Yellow
    Write-Host "Utilise : .\scripts\deploy.ps1 -Force  pour tout deployer." -ForegroundColor Yellow
    exit 0
}

Write-Host "Changements detectes :" -ForegroundColor White
Write-Host "  Backend  : $(if ($backendChanged)  {'OUI'} else {'non'})" -ForegroundColor $(if ($backendChanged)  {"Green"} else {"Gray"})
Write-Host "  Frontend : $(if ($frontendChanged) {'OUI'} else {'non'})" -ForegroundColor $(if ($frontendChanged) {"Green"} else {"Gray"})
Write-Host "  K8s      : $(if ($k8sChanged)      {'OUI'} else {'non'})" -ForegroundColor $(if ($k8sChanged)      {"Green"} else {"Gray"})
Write-Host ""

# ── Build & Push Backend ─────────────────────────────────────────
if ($backendChanged) {
    Write-Host "[BACKEND] Build de l'image Docker..." -ForegroundColor Cyan
    Set-Location "$ROOT\backend"
    docker build -t "${DOCKER_USER}/moto-backend:latest" .
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : build backend echoue" -ForegroundColor Red; exit 1 }
    docker push "${DOCKER_USER}/moto-backend:latest"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : push backend echoue" -ForegroundColor Red; exit 1 }
    Write-Host "[BACKEND] Image pushee sur Docker Hub" -ForegroundColor Green
    Set-Location $ROOT
}

# ── Build & Push Frontend ────────────────────────────────────────
if ($frontendChanged) {
    Write-Host "[FRONTEND] Build de l'image Docker..." -ForegroundColor Cyan
    Set-Location "$ROOT\frontend"
    docker build -t "${DOCKER_USER}/moto-frontend:latest" .
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : build frontend echoue" -ForegroundColor Red; exit 1 }
    docker push "${DOCKER_USER}/moto-frontend:latest"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : push frontend echoue" -ForegroundColor Red; exit 1 }
    Write-Host "[FRONTEND] Image pushee sur Docker Hub" -ForegroundColor Green
    Set-Location $ROOT
}

# ── Appliquer les manifests Kubernetes ──────────────────────────
if ($k8sChanged) {
    Write-Host "[K8S] Application des manifests..." -ForegroundColor Cyan
    kubectl apply -f "$ROOT\k8s\"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : kubectl apply echoue" -ForegroundColor Red; exit 1 }
    Write-Host "[K8S] Manifests appliques (monitoring inclus)" -ForegroundColor Green
}

# ── Deploiement Backend + reseed MongoDB ────────────────────────
if ($backendChanged) {
    Write-Host "[K8S] Redemarrage du backend..." -ForegroundColor Cyan
    kubectl rollout restart deployment/backend -n $NAMESPACE
    kubectl rollout status  deployment/backend -n $NAMESPACE --timeout=120s
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : rollout backend echoue" -ForegroundColor Red; exit 1 }

    Write-Host "[MONGODB] Attente du pod backend..." -ForegroundColor Cyan
    kubectl wait pod -n $NAMESPACE -l app=backend --for=condition=Ready --timeout=120s

    Write-Host "[MONGODB] Rechargement de la base de donnees..." -ForegroundColor Cyan
    $pyCmd = "import os; from pymongo import MongoClient; " +
             "u=os.environ['MONGO_USERNAME']; p=os.environ['MONGO_PASSWORD']; " +
             "h=os.environ.get('MONGO_HOST','localhost'); " +
             "c=MongoClient(f'mongodb://{u}:{p}@{h}:27017/ecommerce?authSource=admin'); " +
             "c.ecommerce.products.drop(); print('Collection products videe')"
    kubectl exec -n $NAMESPACE deployment/backend -c flask -- python3 -c $pyCmd
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : reseed MongoDB echoue" -ForegroundColor Red; exit 1 }

    kubectl rollout restart deployment/backend -n $NAMESPACE
    kubectl rollout status  deployment/backend -n $NAMESPACE --timeout=120s
    Write-Host "[MONGODB] Base de donnees rechargee" -ForegroundColor Green
}

# ── Deploiement Frontend ─────────────────────────────────────────
if ($frontendChanged) {
    Write-Host "[K8S] Redemarrage du frontend..." -ForegroundColor Cyan
    kubectl rollout restart deployment/frontend -n $NAMESPACE
    kubectl rollout status  deployment/frontend -n $NAMESPACE --timeout=60s
    if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR : rollout frontend echoue" -ForegroundColor Red; exit 1 }
    Write-Host "[FRONTEND] Pod redémarre" -ForegroundColor Green
}

# ── Resume ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "       Deploiement termine            " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
kubectl get pods -n $NAMESPACE
Write-Host ""
Write-Host "Site disponible sur    : http://localhost:30080" -ForegroundColor Cyan
Write-Host "Grafana (monitoring)   : kubectl port-forward pod/monitoring-pod 3000:3000 -n $NAMESPACE" -ForegroundColor Yellow
Write-Host "Prometheus (monitoring): kubectl port-forward pod/monitoring-pod 9090:9090 -n $NAMESPACE" -ForegroundColor Yellow
Write-Host ""
