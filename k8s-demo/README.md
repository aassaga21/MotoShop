# MotoShop — E-Commerce Kubernetes

Site de vente de motos en ligne déployé sur Kubernetes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Utilisateur                                                 │
│      │  http://<NODE_IP>:30080                              │
│      ▼                                                       │
│  ┌───────────────┐  NodePort:30080                          │
│  │  frontend-svc │                                          │
│  └───────┬───────┘                                          │
│          │                                                   │
│  ┌───────▼─────────────────────────────────────────┐        │
│  │  POD 1 — Frontend                               │        │
│  │  ┌─────────────────────────────────────────┐   │        │
│  │  │  Nginx + React (build statique)         │   │        │
│  │  │  • Sert le SPA React                    │   │        │
│  │  │  • Proxy /api → backend-service:5000    │   │        │
│  │  └─────────────────────────────────────────┘   │        │
│  └─────────────────────────┬───────────────────────┘        │
│                            │ ClusterIP                       │
│                    ┌───────▼────────┐                        │
│                    │  backend-svc   │                        │
│                    └───────┬────────┘                        │
│  ┌─────────────────────────▼───────────────────────┐        │
│  │  POD 2 — Backend + Base de données              │        │
│  │  ┌──────────────────┐  ┌────────────────────┐  │        │
│  │  │  Flask API       │  │  MongoDB 7.0       │  │        │
│  │  │  port 5000       │◄─►  port 27017        │  │        │
│  │  │  (localhost)     │  │  PVC → /data/db    │  │        │
│  │  └──────────────────┘  └────────────────────┘  │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  Secrets : identifiants MongoDB                              │
│  ConfigMap : DB_NAME, MONGO_HOST                             │
│  PV / PVC : persistance données MongoDB                      │
└─────────────────────────────────────────────────────────────┘
```

### Stack technique
| Composant   | Technologie             |
|-------------|-------------------------|
| Frontend    | React 18 + Vite + Nginx |
| Backend     | Python 3.12 + Flask     |
| Base de données | MongoDB 7.0         |
| Orchestration | Kubernetes            |

---

## Structure du projet

```
k8s-demo/
├── backend/
│   ├── app.py               # API Flask (produits, commandes)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Composant principal
│   │   ├── App.css          # Thème dark
│   │   ├── api.js           # Appels HTTP vers le backend
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── ProductGrid.jsx
│   │       ├── ProductCard.jsx
│   │       ├── ProductModal.jsx
│   │       ├── Cart.jsx
│   │       ├── OrderForm.jsx
│   │       ├── Contact.jsx      # Page de contact
│   │       └── Admin.jsx        # Dashboard administration
│   ├── public/
│   │   └── images/              # Photos des motos (jpg/png)
│   ├── nginx.conf           # Proxy /api → backend-service
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile           # Multi-stage : build + nginx
└── k8s/
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── mongo-pv.yaml
    ├── mongo-pvc.yaml
    ├── backend-deployment.yaml   # Pod 2 : Flask + MongoDB (strategy: Recreate)
    ├── backend-service.yaml      # ClusterIP
    ├── frontend-deployment.yaml  # Pod 1 : Nginx/React
    └── frontend-service.yaml     # NodePort 30080
```

---

## Déploiement

### Prérequis
- Docker Desktop avec Kubernetes activé (ou Minikube)
- Un compte Docker Hub

### 1 — Construire et pousser les images

```bash
# Remplacez "votreusername" par votre identifiant Docker Hub

# Backend
cd backend
docker build -t votreusername/moto-backend:latest .
docker login
docker tag alexa/moto-backend:latest alexandraassaga/moto-backend:latest
docker push votreusername/moto-backend:latest
```
![image](https://hackmd.io/_uploads/Sk291Opgfl.png)
![image](https://hackmd.io/_uploads/SyqnkuTxGg.png)
![image](https://hackmd.io/_uploads/BJazedaeMl.png)
![image](https://hackmd.io/_uploads/HJzzGu6gGx.png)

```bash
# Frontend
cd ../frontend
npm install
docker build -t votreusername/moto-frontend:latest .
docker push votreusername/moto-frontend:latest
```
![image](https://hackmd.io/_uploads/BJAq7d6xGe.png)
![image](https://hackmd.io/_uploads/rkKl4Opgzx.png)
![image](https://hackmd.io/_uploads/By4MVOpgfe.png)
![image](https://hackmd.io/_uploads/HJ144OTlfe.png)
![image](https://hackmd.io/_uploads/SJakHOpeMe.png)

Mettez à jour le champ `image:` dans :
- `k8s/backend-deployment.yaml`
- `k8s/frontend-deployment.yaml`
![image](https://hackmd.io/_uploads/SkGlDuTxGe.png)
![image](https://hackmd.io/_uploads/By04D_alfl.png)

### 2 — Appliquer les manifests Kubernetes

```bash
# Namespace
kubectl create namespace ecommerce
kubectl apply -f k8s/namespace.yaml

# Volumes (PV global, PVC dans le namespace)
kubectl apply -f k8s/mongo-pv.yaml
kubectl apply -f k8s/mongo-pvc.yaml

# Configuration et secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Backend (Flask + MongoDB)
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Frontend (React/Nginx)
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

![image](https://hackmd.io/_uploads/rkcQtuTxGl.png)

Ou tout d'un coup :

```bash
kubectl apply -f C:\Users\alexa\k8s-demo\k8s\
```
![image](https://hackmd.io/_uploads/HyYjtuagMl.png)

> Le warning c'est juste Kubernetes qui dit que le namespace ecommerce avait été créé manuellement avant (avec kubectl create namespace), pas via un fichier YAML. Il l'a patché automatiquement, donc aucun problème.

![image](https://hackmd.io/_uploads/B14tcdTezl.png)
![image](https://hackmd.io/_uploads/HkH09OTxGl.png)
![image](https://hackmd.io/_uploads/rJCJo_Txfg.png)

### 3 — Vérifier le déploiement

```bash
# État des Pods
kubectl get pods -n ecommerce

# Services
kubectl get services -n ecommerce

# Logs Flask
kubectl logs -n ecommerce deployment/backend -c flask

# Logs MongoDB
kubectl logs -n ecommerce deployment/backend -c mongodb

# PVC
kubectl get pvc -n ecommerce
```
![image](https://hackmd.io/_uploads/S15f5uTlfg.png)

### 4 — Accéder à l'application

```bash
# Sur Docker Desktop / minikube
kubectl get nodes -o wide   # noter l'IP du nœud

# Avec minikube
minikube service frontend-service -n ecommerce
```

Ouvrir : **http://\<NODE_IP\>:30080**

---

## Vérifications fonctionnelles

| Test | Commande |
|------|----------|
| Santé de l'API | `curl http://<NODE_IP>:30080/api/health` |
| Liste des produits | `curl http://<NODE_IP>:30080/api/products` |
| Interface web | Ouvrir dans le navigateur |
| Persistance | Supprimer le pod backend → le redémarrer → les données subsistent |

### Test de persistance

```bash
# Supprimer le Pod (il sera recréé par le Deployment)
kubectl delete pod -n ecommerce -l app=backend

# Attendre le redémarrage
kubectl get pods -n ecommerce -w

# Vérifier que les produits sont toujours là
curl http://<NODE_IP>:30080/api/products | python -m json.tool
```

---

## Fonctionnalités de l'application

- Catalogue de 12 motos (Naked, Sport, Trail, Cruiser)
- Filtres par catégorie
- Fiche produit détaillée (moteur, puissance, poids, vitesse max)
- Panier avec gestion des quantités
- Formulaire de commande
- Données persistées en MongoDB
- **Page Contact** — formulaire + coordonnées (messages sauvegardés en base)
- **Page Admin** — tableau de bord commandes & clients avec gestion des statuts

---

## Pages ajoutées

### Page Contact (`/contact`)

Accessible via le lien **Contact** dans la navigation.

- Formulaire : Nom, Email, Sujet, Message
- Informations de contact (adresse, téléphone, horaires, réseaux sociaux)
- Les messages sont sauvegardés dans MongoDB (collection `contacts`) via `POST /api/contact`

### Page Admin (`/admin`)

Accessible via l'icône **⚙** en haut à droite de la navigation.

- **4 statistiques** : commandes totales, clients uniques, chiffre d'affaires, panier moyen
- **Onglet Commandes** : tableau avec référence, date, client, articles, total et sélecteur de statut modifiable en live
  - Statuts disponibles : En attente → Confirmée → Expédiée → Livrée / Annulée
  - Endpoint : `PATCH /api/orders/<id>/status`
- **Onglet Clients** : liste des acheteurs déduite des commandes, clic sur une ligne → panneau latéral avec l'historique complet des commandes du client
- Barre de recherche par nom ou email, bouton Actualiser

> Les "utilisateurs" correspondent aux clients ayant passé commande — il n'y a pas de système de compte séparé.

---

## Gestion des images de motos

### Nommage des fichiers

Les images doivent être placées dans `frontend/public/images/` avec des noms en **kebab-case minuscules**, correspondant exactement aux chemins définis dans `SEED_PRODUCTS` de `backend/app.py` :

| Moto                        | Fichier attendu                        |
|-----------------------------|----------------------------------------|
| Yamaha MT-07                | `yamaha-mt07.jpg`                      |
| Honda CB650R                | `honda-cb650r.jpg`                     |
| Kawasaki Z900               | `kawasaki-z900.jpg`                    |
| Ducati Monster              | `ducati-monster.jpg`                   |
| Suzuki GSX-R750             | `suzuki-gsx-r750.jpg`                  |
| Kawasaki Ninja ZX-10R       | `kawasaki-ninja-zx-10r.jpg`            |
| BMW R 1250 GS               | `bmw-r1250gs.jpg`                      |
| Honda Africa Twin           | `honda-africa-twin.jpg`                |
| Harley-Davidson Sportster S | `harley-davidson-sportster-s.jpg`      |
| KTM 890 Duke                | `ktm-890-duke.jpg`                     |
| Yamaha Ténéré 700           | `yamaha-tenere-700.jpg`                |
| Indian Scout                | `indian-scout.jpg`                     |

> Linux est **sensible à la casse** : `Yamaha-MT07.jpg` ≠ `yamaha-mt07.jpg`. Toujours utiliser des minuscules.

### Workflow : mettre à jour les images

À chaque fois que tu modifies les images dans `app.py` ou renommes des fichiers dans `public/images/`, appliquer ces 4 commandes dans l'ordre :

**1 — Rebuilder et pousser les deux images Docker**

```bash
# Backend (nouveau SEED_PRODUCTS)
cd C:\Users\alexa\k8s-demo\backend
docker build -t alexandraassaga/moto-backend:latest .
docker push alexandraassaga/moto-backend:latest

# Frontend (nouveaux fichiers images inclus dans Nginx)
cd C:\Users\alexa\k8s-demo\frontend
docker build -t alexandraassaga/moto-frontend:latest .
docker push alexandraassaga/moto-frontend:latest
```

**2 — Vider la collection produits** (force le re-seed avec les nouvelles données)

```bash
# Via le container Flask — évite l'OOM du container MongoDB
kubectl exec -n ecommerce deployment/backend -c flask -- python3 -c "
from pymongo import MongoClient
client = MongoClient('mongodb://mongouser:MongoPass2024@localhost:27017/ecommerce?authSource=admin')
client.ecommerce.products.drop()
print('OK')
"
```

> ⚠️ **Pourquoi ne pas utiliser `mongosh` directement ?**
> Le container MongoDB est limité à 512 Mi. Lancer `mongosh` en plus de `mongod` provoque un OOM kill (exit code 137). Passer par le container Flask avec `pymongo` déjà chargé est la méthode fiable.

**3 — Redémarrer les deployments**

```bash
kubectl rollout restart deployment/backend deployment/frontend -n ecommerce
kubectl rollout status deployment/backend -n ecommerce
```

**4 — Hard refresh dans le navigateur**

`Ctrl + Shift + R` pour vider le cache et voir les nouvelles images.

---

## Pipeline CI/CD

À chaque `git push` sur `main`, le pipeline GitHub Actions :

1. **Détecte** quels dossiers ont changé (`backend/`, `frontend/`, `k8s/`)
2. **Build et push** uniquement les images Docker concernées sur Docker Hub
3. **Déploie** sur Kubernetes (apply manifests + rollout restart)
4. **Recharge MongoDB** automatiquement si `backend/` a changé (vide la collection `products` → Flask re-seed au redémarrage)

```
git push → GitHub Actions
              ├── backend/ modifié ?  → build moto-backend:latest → push Docker Hub
              │                          → kubectl rollout restart backend
              │                          → drop products → restart → re-seed auto
              ├── frontend/ modifié ? → build moto-frontend:latest → push Docker Hub
              │                          → kubectl rollout restart frontend
              └── k8s/ modifié ?      → kubectl apply -f k8s/
```

### Alternative locale : script PowerShell + hook git

Puisque Kubernetes tourne en local (Docker Desktop), le pipeline peut fonctionner **sans GitHub Actions** grâce à deux fichiers dans `scripts/` :

| Fichier | Rôle |
|---------|------|
| `scripts/deploy.ps1` | Script principal : détecte les changements, build, push, déploie, recharge MongoDB |
| `scripts/install-hook.ps1` | Installe un hook git qui déclenche `deploy.ps1` automatiquement à chaque `git push` |

#### Ce que fait `deploy.ps1`

```
git push
  └── hook pre-push → deploy.ps1
        ├── Détecte quels dossiers ont changé (git diff)
        ├── backend/ modifié ?  → docker build + push → kubectl restart → reseed MongoDB
        ├── frontend/ modifié ? → docker build + push → kubectl restart
        └── k8s/ modifié ?      → kubectl apply -f k8s/
```

#### Installation (une seule fois)

Ouvre **PowerShell** dans le dossier du projet et exécute :

```powershell
cd C:\Users\alexa\k8s-demo
.\scripts\install-hook.ps1
```

Tu verras :
```
Hook pre-push installé avec succès !

Désormais, chaque 'git push' déclenchera automatiquement :
  - Build et push des images Docker modifiées
  - Déploiement sur Kubernetes
  - Rechargement MongoDB si le backend a changé
```

**Vérifier que le hook est bien installé :**

```powershell
Test-Path .git\hooks\pre-push
# doit afficher : True
```

> **Erreur rencontrée** : si tu vois `Impossible de trouver une partie du chemin '.git\hooks\pre-push'`, c'est que le dossier `.git\hooks\` n'existait pas.
> Le script `install-hook.ps1` a été corrigé pour le créer automatiquement — il suffit de le relancer.

#### Utilisation quotidienne

Après installation, le workflow est simplement :

```bash
# 1. Modifier des fichiers (backend, frontend, k8s...)

# 2. Commiter
git add .
git commit -m "ma modification"

# 3. Pousser → le déploiement se déclenche AUTOMATIQUEMENT
git push
```

Le script affiche la progression en temps réel dans le terminal :

```
======================================
  MotoShop - Deploiement automatique
======================================

Changements détectés :
  Backend  : OUI
  Frontend : non
  K8s      : non

[BACKEND] Build de l'image Docker...
[BACKEND] Image pushée sur Docker Hub  ✓
[K8S] Redémarrage du backend...
[MONGODB] Rechargement de la base de données...
[MONGODB] Base de données rechargée  ✓

======================================
       Deploiement terminé  ✓
======================================

Site disponible sur : http://localhost:30080
```

#### Déploiement manuel (sans git push)

```powershell
# Déployer uniquement ce qui a changé
.\scripts\deploy.ps1

# Forcer le déploiement complet (tout rebuilder)
.\scripts\deploy.ps1 -Force
```

#### Désactiver le hook

```powershell
Remove-Item .git\hooks\pre-push
```

### Runner GitHub Actions (optionnel)

Si tu veux aussi que le pipeline tourne **sur GitHub** (visible dans l'onglet Actions), tu peux configurer un runner auto-hébergé :

**https://github.com/aassaga21/MotoShop/settings/actions/runners/new?arch=x64&os=win**

Et créer les secrets Docker Hub :

| Nom du secret      | Valeur                      |
|--------------------|-----------------------------|
| `DOCKER_USERNAME`  | `alexandraassaga`           |
| `DOCKER_PASSWORD`  | ton mot de passe Docker Hub |

Le fichier `.github/workflows/deploy.yml` est déjà prêt dans le repo.

### Ce que fait chaque étape

| Étape            | Se déclenche si…          | Actions                                                        |
|------------------|---------------------------|----------------------------------------------------------------|
| Détection        | Toujours                  | `git diff` pour savoir quoi rebuild                            |
| Build backend    | `backend/` modifié        | `docker build` + `docker push` moto-backend:latest             |
| Build frontend   | `frontend/` modifié       | `docker build` + `docker push` moto-frontend:latest            |
| Deploy k8s       | `k8s/` modifié            | `kubectl apply -f k8s/`                                        |
| Restart + reseed | `backend/` modifié        | `rollout restart` + drop products + restart (re-seed auto)     |

---

## Dépôt GitHub

Le code source est hébergé sur : **https://github.com/aassaga21/MotoShop**

### Premier push (initialisation)

```bash
# Lier le repo GitHub
git remote add origin https://github.com/aassaga21/MotoShop.git

# Ajouter tous les fichiers (.gitignore exclut node_modules automatiquement)
git add .

# Créer le commit initial
git commit -m "Ajout pages Contact & Admin, images motos, navigation"

# Pousser sur GitHub
git push -u origin main
```

> Si GitHub demande un mot de passe, utilise un **Personal Access Token** :
> GitHub → Settings → Developer settings → Personal access tokens → Generate new token (cocher `repo`)

### Mettre à jour le repo après chaque modification

```bash
git add .
git commit -m "description de la modification"
git push
```

### Fichiers exclus du dépôt (`.gitignore`)

| Dossier / Fichier         | Raison                                   |
|---------------------------|------------------------------------------|
| `frontend/node_modules/`  | Trop lourd, se réinstalle avec `npm install` |
| `frontend/dist/`          | Build généré automatiquement par Vite    |
| `__pycache__/`, `*.pyc`   | Fichiers compilés Python temporaires     |
| `.env`, `.env.local`      | Variables sensibles (mots de passe)      |

---

## Génération des Secrets

```bash
echo -n "mongouser"     | base64   # → bW9uZ291c2Vy
echo -n "MongoPass2024" | base64   # → TW9uZ29QYXNzMjAyNA==
```

---

## Développement local (sans Kubernetes)

```bash
# Terminal 1 — MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7.0

# Terminal 2 — Backend
cd backend
pip install -r requirements.txt
python app.py

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev          # démarre sur http://localhost:5173
```

---

## Commandes utiles

```bash
# Supprimer tout le namespace
kubectl delete namespace ecommerce

# Voir les events (debugging)
kubectl get events -n ecommerce --sort-by='.lastTimestamp'

# Shell dans le conteneur Flask
kubectl exec -it -n ecommerce deployment/backend -c flask -- bash

# Shell dans MongoDB
kubectl exec -it -n ecommerce deployment/backend -c mongodb -- mongosh \
  -u mongouser -p MongoPass2024 --authenticationDatabase admin
```

---

## Dépannage — Problèmes rencontrés

### Modification apportée : `strategy: Recreate` dans `backend-deployment.yaml`

Le deployment backend a été modifié pour utiliser la stratégie `Recreate` au lieu de `RollingUpdate` (valeur par défaut) :

```yaml
spec:
  replicas: 1
  strategy:
    type: Recreate   # ← ajouté
```

**Pourquoi** : Flask et MongoDB partagent un PVC `ReadWriteOnce` dans le même pod. Avec `RollingUpdate`, Kubernetes démarre le nouveau pod *avant* de supprimer l'ancien. Les deux pods tentent alors de monter le même volume en même temps, ce qui provoque des conflits de verrou MongoDB.
Avec `Recreate`, l'ancien pod est entièrement supprimé avant que le nouveau démarre.

```bash
# Appliquer la modification
kubectl apply -f k8s/backend-deployment.yaml
```

---

### Problème 1 — `mongod.lock` bloqué (CrashLoopBackOff / Error)

**Symptôme** dans les logs MongoDB :
```
DBPathInUse: Unable to lock the lock file: /data/db/mongod.lock
(Resource temporarily unavailable). Another mongod instance is already running
```

**Cause** : Un `kubectl rollout restart` a créé un nouveau pod avant que l'ancien soit supprimé. L'ancien pod gardait le verrou sur le PVC.

**Résolution** :

```bash
# 1. Passer à 0 replicas pour libérer le PVC
kubectl scale deployment backend -n ecommerce --replicas=0

# 2. Supprimer le fichier verrou via un pod temporaire
kubectl run mongo-cleanup --image=mongo:7.0 -n ecommerce --restart=Never \
  --overrides='{
    "spec": {
      "volumes": [{"name":"mongo-data","persistentVolumeClaim":{"claimName":"mongo-pvc"}}],
      "containers": [{
        "name": "cleaner",
        "image": "mongo:7.0",
        "command": ["sh","-c","rm -f /data/db/mongod.lock && echo DONE"],
        "volumeMounts": [{"name":"mongo-data","mountPath":"/data/db"}]
      }]
    }
  }'

# Vérifier le résultat
kubectl logs mongo-cleanup -n ecommerce   # doit afficher : DONE

# 3. Nettoyer et relancer
kubectl delete pod mongo-cleanup -n ecommerce
kubectl scale deployment backend -n ecommerce --replicas=1
```

---

### Problème 2 — User MongoDB inexistant après réinitialisation (`UserNotFound`)

**Symptôme** dans les logs Flask :
```
Authentication failed.
```

**Symptôme** dans les logs MongoDB :
```
UserNotFound: Could not find user "mongouser" for db "admin"
```

**Cause** : Les variables `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` ne sont traitées par l'entrypoint MongoDB que si `/data/db` est **entièrement vide**. Un simple `rm -rf /data/db/*` ne supprime pas les fichiers cachés (`.`), ce qui empêche la ré-initialisation.

**Résolution — Étape A : vider complètement le répertoire**

```bash
kubectl scale deployment backend -n ecommerce --replicas=0

# Supprimer TOUS les fichiers, y compris les cachés
kubectl run mongo-wipe --image=busybox -n ecommerce --restart=Never \
  --overrides='{
    "spec": {
      "volumes": [{"name":"mongo-data","persistentVolumeClaim":{"claimName":"mongo-pvc"}}],
      "containers": [{
        "name": "wiper",
        "image": "busybox",
        "command": ["sh","-c","find /data/db -mindepth 1 -delete && echo FULL_WIPE_DONE && ls -la /data/db"],
        "volumeMounts": [{"name":"mongo-data","mountPath":"/data/db"}]
      }]
    }
  }'

kubectl logs mongo-wipe -n ecommerce   # doit afficher : FULL_WIPE_DONE
kubectl delete pod mongo-wipe -n ecommerce
```

**Résolution — Étape B : créer le user manuellement**

Si malgré le wipe le user n'est toujours pas créé (l'entrypoint peut être perturbé par les tentatives de connexion de Flask au démarrage), créer le user via un pod dédié sans authentification :

```bash
kubectl run mongo-fix --image=mongo:7.0 -n ecommerce --restart=Never \
  --overrides='{
    "spec": {
      "volumes": [{"name":"mongo-data","persistentVolumeClaim":{"claimName":"mongo-pvc"}}],
      "containers": [{
        "name": "mongo-fix",
        "image": "mongo:7.0",
        "command": ["bash","-c","mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --noauth --fork --logpath /tmp/mongo.log && sleep 8 && mongosh 127.0.0.1:27017/admin --norc --quiet --eval \"var r = db.getSiblingDB('"'"'admin'"'"').createUser({user: '"'"'mongouser'"'"', pwd: '"'"'MongoPass2024'"'"', roles: [{role: '"'"'root'"'"', db: '"'"'admin'"'"'}]}); printjson(r); print('"'"'USER_CREATED'"'"')\" 2>&1 && mongod --shutdown --dbpath /data/db && echo ALL_DONE"],
        "volumeMounts": [{"name":"mongo-data","mountPath":"/data/db"}]
      }]
    }
  }'

# Vérifier : doit afficher { ok: 1 }, USER_CREATED, ALL_DONE
kubectl logs mongo-fix -n ecommerce | tail -10

kubectl delete pod mongo-fix -n ecommerce
kubectl scale deployment backend -n ecommerce --replicas=1
```

> **Note** : dans `mongosh --eval`, utiliser `db.getSiblingDB('admin')` et non `use admin` — la commande `use` est une commande shell interactive qui ne fonctionne pas en mode `--eval`.

**Vérification finale** :
```bash
kubectl get pods -n ecommerce
# backend-xxxxx   2/2   Running   0   ...  ← attendu
```
