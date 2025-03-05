FROM node:lts as build

WORKDIR /usr/local/app

COPY ./app /usr/local/app/
COPY ./commands /usr/local/app/
COPY ./config /usr/local/app/
COPY ./contracts /usr/local/app/
COPY ./database /usr/local/app/
COPY ./providers /usr/local/app/
COPY ./resources /usr/local/app/
COPY ./start /usr/local/app/
COPY ./tests /usr/local/app/
COPY ./.adonisrc.json /usr/local/app/
COPY ./ace /usr/local/app/
COPY ./ace-manifest.json /usr/local/app/
COPY ./env.ts /usr/local/app/
COPY ./package.json /usr/local/app/
COPY ./package-lock.json /usr/local/app/
COPY ./server.ts /usr/local/app/
COPY ./test.ts /usr/local/app/
COPY ./tsconfig.json /usr/local/app/

ENV NODE_ENV=development
RUN npm install
RUN node ace build --production --ignore-ts-errors

FROM node:lts
WORKDIR /usr/local/app
COPY --from=build /usr/local/app/build/ /usr/local/app/
ENV NODE_ENV=production
RUN npm ci
CMD node ace migration:run --force && node server.js
EXPOSE 3333
