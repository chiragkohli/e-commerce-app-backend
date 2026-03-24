FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY search-service/package.json ./search-service/
RUN npm install --workspace=shared --workspace=search-service --ignore-scripts
COPY shared/ ./shared/
COPY search-service/ ./search-service/
WORKDIR /app/search-service
EXPOSE 5003
CMD ["node", "src/app.js"]
