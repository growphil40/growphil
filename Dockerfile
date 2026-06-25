# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency configurations
COPY package*.json ./

# Install packages
RUN npm ci

# Copy full application code
COPY . .

# Build-time environment variables for Next.js static content rendering
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js production build
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only production dependencies and build logs/outputs
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Run Next.js server
CMD ["npm", "run", "start"]
