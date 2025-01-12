FROM oven/bun:1.1.43 AS base
WORKDIR /usr/src/app

# Create directory for SQLite database and set permissions
RUN mkdir -p /usr/src/app/data && \
    chown bun:bun /usr/src/app/data

# install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy everything and build
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# build
ENV NODE_ENV=production
RUN bun run build

# final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/. .

# Ensure the data directory exists and has correct permissions in the final stage
RUN mkdir -p /usr/src/app/data && \
    chown -R bun:bun /usr/src/app/data && \
    touch /usr/src/app/data/db.sqlite && \
    chown bun:bun /usr/src/app/data/db.sqlite && \
    chmod 644 /usr/src/app/data/db.sqlite

# run the app
USER bun
EXPOSE 4000/tcp
ENTRYPOINT [ "bun", "run", "start" ]