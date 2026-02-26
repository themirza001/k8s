# Kubernetes 3-Tier App Deployment — README

A full walkthrough of deploying a 3-tier web application (Frontend + Backend + PostgreSQL) on Kubernetes using NGINX Ingress, NetworkPolicies, and SSL termination.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Architecture Overview](#architecture-overview)
3. [Secrets Management](#secrets-management)
4. [Networking & Ingress](#networking--ingress)
5. [Network Policies](#network-policies)
6. [SSL Termination](#ssl-termination)
7. [Useful Debug Commands](#useful-debug-commands)

---

## Project Structure

```
capstone_project_1/
│
├── backend/
│   ├── db.js
│   ├── Dockerfile
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   └── student.api.js
│   │   ├── assets/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
│
├── manifests/
│   ├── backend/
│   │   ├── backend-deployment.yaml
│   │   └── backend-service.yaml
│   ├── database/
│   │   ├── postgres-deployment.yaml
│   │   ├── postgres-secret.yaml
│   │   └── postgres-service.yaml
│   ├── frontend/
│   │   ├── frontend-deployment.yaml
│   │   └── frontend-service.yaml
│   ├── ingress/
│   │   └── ingress.yaml
│   └── network-policy/
│       ├── allow-backend-to-db.yaml
│       ├── allow-frontend-to-backend.yaml
│       ├── deny-all-backend.yaml
│       └── deny-all-db.yaml
└── certs/
|    ├── myapp.crt
|    └── myapp.key
│
└── README.md
```

---

## Architecture Overview

```
Browser
  │
  ▼
NGINX Ingress (myapp.local)
  ├── /api/*  ──▶  backend-service:3000  ──▶  Backend Pod
  │                                               │
  │                                               ▼
  │                                        db-service:5432
  │                                               │
  │                                               ▼
  │                                        PostgreSQL Pod
  │
  └── /       ──▶  frontend-service:80   ──▶  Frontend Pod
```

The app consists of three tiers:

- **Frontend** — A React app (Vite) served by NGINX inside the container on port 80
- **Backend** — A Node.js API server running on port 3000
- **Database** — PostgreSQL 15 running on port 5432

All inter-service communication is handled internally via Kubernetes ClusterIP services. External traffic enters only through the NGINX Ingress Controller.


---

## Secrets Management

Database credentials (`DB_USER`, `DB_PASSWORD`, `DB_NAME`) are stored in a Kubernetes `Secret` object named `postgres-secret` — see `manifests/database/postgres-secret.yaml`. These are injected as environment variables into both the backend and database pods so no credentials are hardcoded in the application code.

Apply it:

```bash
kubectl apply -f manifests/database/postgres-secret.yaml
```

Verify the secret values:
```bash
kubectl get secret postgres-secret -o jsonpath='{.data.DB_USER}' | base64 -d
```

---

## Networking & Ingress

All external traffic is routed through an NGINX Ingress Controller at `myapp.local` — see `manifests/ingress/ingress.yaml`. The ingress handles two routes:

- `/api/*` — proxied to `backend-service` on port 3000. Uses `pathType: ImplementationSpecific` with regex enabled via the `use-regex: "true"` annotation.
- `/` — proxied to `frontend-service` on port 80.

SSL redirect is enabled so all HTTP traffic is automatically upgraded to HTTPS.

### Local DNS Setup

Add `myapp.local` to your `/etc/hosts` so your browser can resolve it:

```bash
echo "127.0.0.1  myapp.local" | sudo tee -a /etc/hosts
```

### Frontend API URL

The frontend must call the backend through the ingress, not via the internal service name (which only resolves inside the cluster).

---

## Network Policies

Network policies are defined in `manifests/network-policy/` and restrict pod-to-pod communication to only what is necessary:

- `allow-frontend-to-backend.yaml` — allows traffic into the backend pod from both the frontend pods and the `ingress-nginx` namespace, since API requests arrive via the ingress controller and not directly from the frontend pods.
- `allow-backend-to-db.yaml` — allows the backend pod to connect to the database pod on port 5432.


Label the ingress-nginx namespace so the `namespaceSelector` in the allow policy resolves correctly:

```bash
kubectl label namespace ingress-nginx kubernetes.io/metadata.name=ingress-nginx
kubectl get namespace ingress-nginx --show-labels
```

---

## SSL Termination

SSL is terminated at the Ingress using a self-signed certificate for local development.

### Step 1 — Generate a Self-Signed Certificate

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout myapp.key \
  -out myapp.crt \
  -subj "/CN=myapp.local/O=myapp"
```

### Step 2 — Create a Kubernetes TLS Secret

```bash
kubectl create secret tls myapp-tls \
  --cert=myapp.crt \
  --key=myapp.key
```

Verify:

```bash
kubectl get secret myapp-tls
```

### Step 3 — Trust the Certificate on macOS(Your OS)

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain myapp.crt
```

Restart your browser after adding the certificate.

### Step 4 — Test HTTPS

```bash
curl -k https://myapp.local/api/students
```
---

## Useful Debug Commands

```bash
# Check all pod statuses
kubectl get pods

# View backend logs
kubectl logs deployment/backend --tail=50

# View previous pod logs (if it crashed and restarted)
kubectl logs deployment/backend --previous

# Describe a pod for events and errors
kubectl describe pod -l app=backend

# Test backend connectivity from inside the cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://backend-service:3000/students

# Check ingress configuration
kubectl describe ingress app-ingress

# Check network policies
kubectl get networkpolicies
kubectl describe networkpolicy allow-frontend-to-backend

# Verify secret values
kubectl get secret postgres-secret -o jsonpath='{.data.DB_USER}' | base64 -d

# Check namespace labels (for NetworkPolicy namespaceSelector)
kubectl get namespace ingress-nginx --show-labels
```