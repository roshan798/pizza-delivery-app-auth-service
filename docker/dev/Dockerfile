FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]