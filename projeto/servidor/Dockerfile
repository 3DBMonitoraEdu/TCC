FROM node:18-slim

# Instala tini para repasse correto de sinais (PID 1)
RUN apt-get update && apt-get install -y tini python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 4040

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "src/index.js"]
