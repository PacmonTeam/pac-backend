FROM node:18

EXPOSE 8545

COPY . /hardhat
WORKDIR /hardhat
RUN yarn install --non-interactive --frozen-lockfile
CMD yarn start