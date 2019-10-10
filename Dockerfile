FROM node:10.9.0-alpine as build-client
RUN mkdir /app
COPY . /app/
RUN cd /app/client && npm install && npm run build

FROM node:10.9.0-alpine
RUN mkdir -p /app/{client/build,server}
COPY --from=build-client /app/client/build /app/client/build
COPY server /app/server
RUN cd /app/server && npm install
COPY config.js /app
WORKDIR /app/server
CMD ["npm", "start"]
