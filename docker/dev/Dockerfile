#Dockerfile for Node.js application
# Use the official Node.js image as a base
FROM node:22
# Set the working directory inside the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install the application dependencies
RUN npm install
# Copy the rest of the application code to the working directory
COPY . .
# Expose the port the app runs on :
EXPOSE 8080 
# Command to run the application
CMD ["npm", "run","dev"]

