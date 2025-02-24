# Stage 1: Build the TypeScript code
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Copy the built code and package files from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/swagger.yaml ./

# Install only production dependencies
RUN npm install --production

# Expose the application ports
EXPOSE 3002 5321

# Command to run the application
CMD ["node", "dist/app.js"]