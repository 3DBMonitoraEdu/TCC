#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-${VERSION:-0.2.0}}"
VERSION="${VERSION#v}"



ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
mkdir -p "$DIST"

echo "==> Compilando agente (serviço em background)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o "$DIST/monitoredu" \
    ./cmd/agente

echo "==> Compilando agente-session (sessão gráfica do aluno)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o "$DIST/monitoredu-session" \
    ./cmd/agente-session

echo "==> Gerando RPM usando rpmbuild..."
mkdir -p "$DIST/rpmbuild"/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

rpmbuild -bb \
  --define "_topdir $DIST/rpmbuild" \
  --define "_sourcedir $ROOT" \
  --define "version $VERSION" \
  monitoredu.spec

# Move o RPM gerado para dist/ e limpa os arquivos temporários
find "$DIST/rpmbuild/RPMS" -name "*.rpm" -exec cp {} "$DIST/" \;
rm -rf "$DIST/rpmbuild" "$DIST/monitoredu" "$DIST/monitoredu-session"

echo ""
echo "========================================="
echo " Pacote .rpm criado com sucesso em dist/!"
echo "========================================="
