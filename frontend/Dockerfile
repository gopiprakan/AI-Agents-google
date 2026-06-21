# 1. Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and compile
COPY . .
RUN npm run build

# 2. Production Stage
FROM nginx:alpine

# Copy custom nginx configs
COPY ../docker/nginx.conf /etc/nginx/nginx.conf

# Copy build files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
