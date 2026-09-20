#!/usr/bin/env bash
set -euo pipefail

NAME="monitoredu"
VERSION="${1:-${VERSION:-0.2.0}}"
VERSION="${VERSION#v}"

ARCH="amd64"

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG="$ROOT/dist/${NAME}_${VERSION}_${ARCH}"

rm -rf "$PKG"
mkdir -p "$PKG/DEBIAN"
mkdir -p "$PKG/usr/bin"
mkdir -p "$PKG/etc/$NAME"
mkdir -p "$PKG/etc/xdg/autostart"
mkdir -p "$PKG/lib/systemd/system"

echo "==> Compilando agente (serviço em background)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o "$PKG/usr/bin/$NAME" \
    ./cmd/agente

echo "==> Compilando agente-session (sessão gráfica do aluno)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o "$PKG/usr/bin/${NAME}-session" \
    ./cmd/agente-session

echo "==> Copiando arquivos de configuração e inicialização..."
cp packaging/etc/monitoredu/config.json \
   "$PKG/etc/$NAME/config.json"

cp packaging/etc/xdg/autostart/monitoredu-session.desktop \
   "$PKG/etc/xdg/autostart/monitoredu-session.desktop"

cp packaging/lib/systemd/system/monitoredu.service \
   "$PKG/lib/systemd/system/$NAME.service"

cp packaging/DEBIAN/control "$PKG/DEBIAN/control"
sed -i "s/^Version:.*/Version: $VERSION/" "$PKG/DEBIAN/control"

cp packaging/DEBIAN/postinst "$PKG/DEBIAN/postinst"
cp packaging/DEBIAN/prerm "$PKG/DEBIAN/prerm"
cp packaging/DEBIAN/postrm "$PKG/DEBIAN/postrm"
cp packaging/DEBIAN/conffiles "$PKG/DEBIAN/conffiles"

# Calcula tamanho instalado (em KB) e adiciona ao control
INSTALLED_SIZE=$(du -sk --exclude="$PKG/DEBIAN" "$PKG" | cut -f1)
sed -i "/^Installed-Size:/d" "$PKG/DEBIAN/control"
echo "Installed-Size: $INSTALLED_SIZE" >> "$PKG/DEBIAN/control"

echo "==> Ajustando permissões..."
chmod 0755 "$PKG/usr/bin/$NAME"
chmod 0755 "$PKG/usr/bin/${NAME}-session"
chmod 0755 "$PKG/DEBIAN/postinst"
chmod 0755 "$PKG/DEBIAN/prerm"
chmod 0755 "$PKG/DEBIAN/postrm"
chmod 0644 "$PKG/DEBIAN/control"
chmod 0644 "$PKG/DEBIAN/conffiles"
chmod 0644 "$PKG/lib/systemd/system/$NAME.service"
chmod 0644 "$PKG/etc/xdg/autostart/monitoredu-session.desktop"
chmod 0666 "$PKG/etc/$NAME/config.json"

echo "==> Construindo pacote .deb..."
if command -v dpkg-deb >/dev/null 2>&1; then
    dpkg-deb --build "$PKG"
else
    echo "dpkg-deb não encontrado. Usando empacotador nativo (ar + tar)..."
    TMP_DIR=$(mktemp -d)
    echo "2.0" > "$TMP_DIR/debian-binary"
    (cd "$PKG/DEBIAN" && tar --owner=0 --group=0 --numeric-owner -czf "$TMP_DIR/control.tar.gz" .)
    (cd "$PKG" && tar --owner=0 --group=0 --numeric-owner --exclude='./DEBIAN' -czf "$TMP_DIR/data.tar.gz" .)
    ar -rcD "$PKG.deb" "$TMP_DIR/debian-binary" "$TMP_DIR/control.tar.gz" "$TMP_DIR/data.tar.gz"
    rm -rf "$TMP_DIR"
fi

echo ""
echo "========================================="
echo " Pacote .deb criado com sucesso!"
echo " Arquivo: $PKG.deb"
echo "========================================="
