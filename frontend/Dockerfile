# STAGE 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy built files from Stage 1 to Nginx's serve directory
COPY --from=build /app/dist /usr/share/nginx/html
# Copy our custom nginx config (created in next step)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]