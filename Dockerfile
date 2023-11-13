# --- BASE ---
FROM node:current-alpine3.18 AS base

# install all apk dependencies 
# `dumb-init` handles being pid 1 and forwarding signals
RUN apk add --update dumb-init
ENTRYPOINT ["dumb-init", "--"]
WORKDIR /app

# --- BUILD ---
FROM base  AS build 
# install all node dependencies
COPY package*.json ./
RUN npm set progress=false \
    && npm config set depth 0 \
    && npm i 

# copy our app source code
COPY ./middleware ./middleware
COPY ./models ./models
COPY ./public ./public
COPY ./routes ./routes
COPY ./service ./service
COPY ./views ./views
COPY ./server.js ./server.js

# if you have any build scripts to run, like for the `templated-site` flavor
# uncomment and possibly modify the following RUN command:
# RUN npm run build
# keeping all of the bash commands you can within a single RUN is generally important,
# but for this case it's likely that we want to use the cache from the prune which will
# change infrequently.

# expose port to access server
EXPOSE 3000 

# --- TEST ---
FROM build AS test
ENV NODE_ENV=test
USER node
# use `sh -c` so we can chain test commands using `&&`
CMD ["npm", "test"]

# --- DEVELOPMENT ---
FROM build AS dev 
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# --- PRODUCTION ---
FROM build AS prod 
ENV NODE_ENV=production

# prune non-prod deps
RUN npm prune --production 

USER node
CMD ["npm", "start"]
