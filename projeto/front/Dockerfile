FROM node:20-alpine

WORKDIR /app

# Copia os manifestos de pacotes e o lockfile do Yarn
COPY package.json yarn.lock ./

# Instala as dependências usando o yarn
RUN yarn 

COPY . .

EXPOSE 8080

# Executa o servidor de desenvolvimento com Yarn e expõe na rede (--host)
CMD ["yarn", "dev", "--host"]
