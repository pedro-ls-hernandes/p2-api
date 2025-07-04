# Define a imagem base do Node.js
FROM node:20.15.0-alpine

# Define o diretório de trabalho dentro do container
COPY package*.json ./

# Instalar as dependências
RUN npm install 

# Copiar os arquivos do projeto para o diretório de trabalho
COPY . .

# Executar o comando de build
RUN npm start

# Expor a porta 80 para acesso externo
EXPOSE 80

# Comando para iniciar o servidor
CMD ["npm", "start"]