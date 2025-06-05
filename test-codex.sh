docker run --rm -it \
    -e CODEX_ENV_NODE_VERSION=20 \
    -e NPM_TOKEN=$NPM_TOKEN \
    -v $(pwd):/workspace/$(basename $(pwd)) -w /workspace/$(basename $(pwd)) \
    ghcr.io/openai/codex-universal:latest