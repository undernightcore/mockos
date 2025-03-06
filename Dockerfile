FROM node:lts as build

WORKDIR /usr/local/app

COPY ./app /usr/local/app/app
COPY ./commands /usr/local/app/commands
COPY ./config /usr/local/app/config
COPY ./contracts /usr/local/app/contracts
COPY ./database /usr/local/app/database
COPY ./providers /usr/local/app/providers
COPY ./resources /usr/local/app/resources
COPY ./start /usr/local/app/start
COPY ./tests /usr/local/app/tests
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
