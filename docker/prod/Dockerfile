# syntax=docker/dockerfile:1

#setting build argument for node version, default is 18.16.0
ARG NODE_VERSION=18.16.0

# Use the official Node.js image as the base image
FROM node:${NODE_VERSION}-alpine AS builder

# Set the working directory in the container
WORKDIR /home/node/app

# Copy package.json and package-lock.json to the working directory
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application code to the working directory
COPY . .

RUN npm run build

# Use a smaller base image for the final image
FROM node:${NODE_VERSION}-alpine

# Set user from root to node for security reasons
USER node

# Create the application directory and set it as the working directory
RUN mkdir -p /home/node/app

# set the working directory to the application directory
WORKDIR /home/node/app

#set environment variable for production
ENV NODE_ENV=production

# Copy package.json and package-lock.json to the working directory
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

# Copy the built application from the builder stage to the final image
# --chown=node:node is used to set the ownership of the copied files to the node user
COPY --from=builder --chown=node:node /home/node/app/dist ./

EXPOSE 8081
# Start the application
CMD ["node", "src/server.js"]



