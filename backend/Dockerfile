# Usar una imagen ligera de Node.js
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto del backend
EXPOSE 3001

# Comando de inicio
CMD ["node", "server.js"]