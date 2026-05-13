FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps && \
    npm install ajv@^8.0.0 --save-dev --legacy-peer-deps
COPY . .
ENV CI=false
RUN npm run build

FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["/bin/sh", "-c", "serve -s build -l ${PORT:-3000}"]
