set -e

yarn
yarn build
docker buildx build --platform linux/amd64 -t docker.inmagik.com/greenmanager/frontend:latest . --push
