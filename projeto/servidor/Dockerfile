from node:18.16.0-alpine3.18

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm ci  --omit=dev

COPY . .

EXPOSE 4040

CMD ["npm", "run", "dev"]
