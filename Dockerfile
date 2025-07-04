# Define a imagem base do Node.js
FROM node:20.15.0-alpine

# Define o diretório de trabalho dentro do container
COPY package*.json ./

# Instalar as dependências
RUN npm install 

# Copiar os arquivos do projeto para o diretório de trabalho
COPY . .

# Expor a porta 5000 para acesso externo
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["npm", "start"]