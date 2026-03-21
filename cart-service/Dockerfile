FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY cart-service/package.json ./cart-service/
RUN npm install --workspace=shared --workspace=cart-service --ignore-scripts
COPY shared/ ./shared/
COPY cart-service/ ./cart-service/
WORKDIR /app/cart-service
EXPOSE 5002
CMD ["node", "src/app.js"]
