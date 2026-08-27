FROM node:20-slim

# Instala tini usando o apt-get (padrão do Debian/Ubuntu)
RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia os manifestos de pacotes e o lockfile do Yarn
COPY package.json yarn.lock ./

# Instala as dependências usando o yarn
RUN yarn install --network-timeout 300000 --network-concurrency 1

COPY . .

EXPOSE 8080

# Caminho do tini no Debian é /usr/bin/tini
ENTRYPOINT ["/usr/bin/tini", "--"]

# Executa o servidor de desenvolvimento com Yarn e expõe na rede (--host)
CMD ["yarn", "dev", "--host"]