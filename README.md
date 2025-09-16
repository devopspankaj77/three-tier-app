

# 1) create DB secret (local)
kubectl create secret generic db-secret \
  --from-literal=MYSQL_ROOT_PASSWORD='rootPassword123' \
  --from-literal=MYSQL_DATABASE='appdb' \
  --from-literal=MYSQL_USER='appuser' \
  --from-literal=MYSQL_PASSWORD='appPassword123' \
  -n onetouch

# 2) create dockerhub registry secret (so k8s can pull private images)
kubectl create secret docker-registry dockerhub-secret \
  --docker-username=pankajdevops2403 \
  --docker-password="${DOCKERHUB_TOKEN}" \
  --docker-email=you@example.com \
  -n onetouch



Commands to apply everything (local steps)

Commit files to GitHub (update ArgoCD repoURL first).

On cluster (locally), create namespace & configmap & secrets:

kubectl apply -f k8s-manifests/base/namespace.yaml
kubectl apply -f k8s-manifests/base/configmap.yaml

# create secrets (recommended way, not via yaml in repo)
kubectl create secret generic db-secret \
  --from-literal=MYSQL_ROOT_PASSWORD='rootPassword123' \
  --from-literal=MYSQL_DATABASE='appdb' \
  --from-literal=MYSQL_USER='appuser' \
  --from-literal=MYSQL_PASSWORD='appPassword123' \
  -n onetouch

kubectl create secret docker-registry dockerhub-secret \
  --docker-username=pankajdevops2403 \
  --docker-password="${DOCKERHUB_TOKEN}" \
  --docker-email=pankaj.tiwari.devops@gmail.com \
  -n onetouch


Apply app manifests (ArgoCD will also manage it; for first time you can kubectl apply directly so resources are visible):

kubectl apply -f k8s-manifests/database/mysql-deployment.yaml
kubectl apply -f k8s-manifests/backend/deployment.yaml
kubectl apply -f k8s-manifests/backend/service.yaml
kubectl apply -f k8s-manifests/frontend/deployment.yaml
kubectl apply -f k8s-manifests/frontend/service.yaml
kubectl apply -f k8s-manifests/istio/gateway.yaml
kubectl apply -f k8s-manifests/istio/frontend-vs.yaml
kubectl apply -f k8s-manifests/flagger/backend-canary.yaml
# or apply whole folder:
kubectl apply -R -f k8s-manifests/


Check status:

kubectl get pods -n onetouch
kubectl get svc -n onetouch
kubectl describe deployment backend -n onetouch
kubectl logs deployment/backend -n onetouch


Access frontend (using Istio ingress in Minikube):

# find ingress port / IP
minikube service -n istio-system istio-ingressgateway --url
# or port-forward frontend:
kubectl -n onetouch port-forward svc/frontend 8080:80
# open http://localhost:8080

4) Explanation — where values come from & mapping (important)

MySQL chart / manifest creates DB using env vars MYSQL_* from secret. We create db-secret with keys MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD.

Backend code reads DB_USER / DB_PASSWORD / DB_HOST / DB_NAME. In deployment we map (DB_USER) -> secretKeyRef(MYSQL_USER) etc. So values are the same, just keys differ but mapping links them.

dockerhub-secret is used by Kubernetes pods to pull images — referenced via imagePullSecrets (if you add to Deployment spec) or cluster-wide pull secrets.

5) Small backend example code (so you can test)

backend/server.js (Node + mysql2 + healthcheck):

const http = require('http');
const mysql = require('mysql2');

const port = process.env.PORT || 8080;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
});

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    return res.end('OK');
  } else if (req.url === '/db') {
    pool.query('SELECT 1+1 AS solution', function(err, results) {
      if (err) {
        res.writeHead(500); res.end('DB ERROR: ' + err.message);
      } else {
        res.end(JSON.stringify(results));
      }
    });
  } else {
    res.end('Backend here');
  }
});

server.listen(port, () => console.log('Listening on', port));

6) Testing & troubleshooting tips

If pods stuck ImagePullBackOff → check kubectl -n onetouch describe pod <pod> and ensure dockerhub-secret exists and used.

If DB connection fails → check kubectl logs of backend; check kubectl exec into backend pod and run nc mysql 3306 or test env vars.

Flagger not doing canary → check logs kubectl -n flagger logs deployment/flagger.

ArgoCD not sync → kubectl -n argocd get applications or use ArgoCD UI (kubectl -n argocd port-forward svc/argocd-server 8080:443).

7) Next things I can do right now (pick one)

Generate all the files exactly (I’ll paste ready git-ready folder contents you can copy).

Give you a single bootstrap script to create namespace + secrets + apply manifests locally.

Add Trivy / cosign steps to CI.

Convert manifests to Kustomize overlays (dev/prod).