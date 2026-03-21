FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY order-service/package.json ./order-service/
RUN npm install --workspace=shared --workspace=order-service --ignore-scripts
COPY shared/ ./shared/
COPY order-service/ ./order-service/
WORKDIR /app/order-service
EXPOSE 5003
CMD ["node", "src/app.js"]
