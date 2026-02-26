# Hello NGINX Kubernetes Deployment

This project demonstrates how to containerize a simple static HTML site using NGINX and deploy it to Kubernetes.

## Project Structure

```
hello-nginx/
├── Dockerfile
├── index.html
└── manifests/
    ├── deployment.yaml
    └── service.yaml
```

## Components

- **index.html**: The static HTML page served by NGINX.
- **Dockerfile**: Multi-stage build to copy `index.html` into an NGINX container.
- **manifests/deployment.yaml**: Kubernetes Deployment manifest for running the NGINX container.
- **manifests/service.yaml**: Kubernetes Service manifest to expose the deployment via NodePort.

## Build and Push Docker Image

1. Build the Docker image:
   ```sh
   docker build -t <your-dockerhub-username>/simple-html-nginx .
   ```
2. Push the image to Docker Hub:
   ```sh
   docker push <your-dockerhub-username>/simple-html-nginx
   ```

*(The deployment uses the image `mirzaatif/simple-html-nginx` by default. Update the image in `deployment.yaml` if you use your own.)*

## Deploy to Kubernetes

1. **Apply the Deployment and Service manifests:**
   ```sh
   kubectl apply -f manifests/deployment.yaml
   kubectl apply -f manifests/service.yaml
   ```

2. **Check resources:**
   ```sh
   kubectl get pods
   kubectl get svc
   ```

3. **Access the Application:**

   The service is exposed on `NodePort` 30036. Open your browser and go to:
   ```
   http://<NodeIP>:30036
   ```
   Replace `<NodeIP>` with the IP address of your Kubernetes node.

## Clean Up

To remove the deployment and service:
```sh
kubectl delete -f manifests/deployment.yaml
kubectl delete -f manifests/service.yaml
```

##