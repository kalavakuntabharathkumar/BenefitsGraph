FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY db ./db
EXPOSE 4000
CMD ["sh","-c","node dist/src/db/migrate.js && node dist/src/db/seed.js && node dist/src/index.js"]
