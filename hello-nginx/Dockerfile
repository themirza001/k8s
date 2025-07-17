# Stage 1: Builder (can be extended for asset building using Node or similar tools)
FROM alpine:3.18 as builder
WORKDIR /app
COPY index.html .

# Stage 2: Nginx to serve static files
FROM nginx:stable-alpine
COPY --from=builder /app/index.html /usr/share/nginx/html/index.html


