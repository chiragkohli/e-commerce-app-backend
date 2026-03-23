FROM node:20-alpine

WORKDIR /app

COPY api-gateway/package.json .
RUN npm install

COPY api-gateway/ .

EXPOSE 3000

CMD ["npm", "start"]
