FROM node:lts as build

WORKDIR /usr/local/app
COPY ./ /usr/local/app/
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
