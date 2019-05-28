FROM node:8.12.0-alpine

MAINTAINER I2G

# Set workdir
WORKDIR /app

# Copy app source
COPY . /app

# Install npm package
COPY package.json /app
RUN npm install

# Set Environment
#ENV NODE_ENV=local-service

EXPOSE 2999

CMD ["node", "app.js"]
