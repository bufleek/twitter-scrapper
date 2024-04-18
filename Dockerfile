FROM --platform=linux/amd64 node:slim

USER 0

RUN mkdir -p /var/www

WORKDIR /var/www

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/google-chrome-stable
ENV NODE_ENV production

RUN apt-get update && apt-get install gnupg wget -y
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
RUN apt-get update && apt-get install -y google-chrome-stable --no-install-recommends
RUN rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

RUN npm run build

RUN npm run swagger

CMD ["node", "src/index.js"]