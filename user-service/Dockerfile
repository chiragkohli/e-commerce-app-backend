FROM node:20-alpine
WORKDIR /app

# Copy monorepo root manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY user-service/package.json ./user-service/

# Install all workspace dependencies
RUN npm install --workspace=shared --workspace=user-service --ignore-scripts

# Copy source
COPY shared/ ./shared/
COPY user-service/ ./user-service/

WORKDIR /app/user-service
EXPOSE 5001
CMD ["node", "src/app.js"]
