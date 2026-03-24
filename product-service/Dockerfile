FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY product-service/package.json ./product-service/
RUN npm install --workspace=shared --workspace=product-service --ignore-scripts
COPY shared/ ./shared/
COPY product-service/ ./product-service/
WORKDIR /app/product-service
EXPOSE 5002
CMD ["node", "src/app.js"]
