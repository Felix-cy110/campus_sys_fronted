#!/usr/bin/env bash
set -euo pipefail

release_id=${1:?缺少发布编号}
[[ "$release_id" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]]
root=/www/wwwroot/campusX
release="$root/releases/$release_id"
uploaded="/tmp/campusx-admin-$release_id.tar.gz"
trap 'rm -f -- "$uploaded"' EXIT

exec 9>/var/lock/campusx-deploy.lock
flock -w 120 9
test -s "$uploaded"
test -L "$root/current"
previous=$(readlink -f "$root/current")
test -f "$previous/index.html"
test ! -e "$release"

install -d -m 755 "$release"
tar -xzf "$uploaded" --no-same-owner -C "$release"
test -s "$release/index.html"
test "$(cat "$release/revision.txt")" = "$release_id"
chmod -R a+rX "$release"

# 保留旧的哈希资源，让更新前已打开的页面仍能加载旧代码块。
if test -d "$previous/assets"; then
    mkdir -p "$release/assets"
    cp -an "$previous/assets/." "$release/assets/"
fi

switch_to() {
    ln -s "$1" "$root/current.$release_id"
    mv -Tf "$root/current.$release_id" "$root/current"
}

switch_to "$release"
for attempt in {1..5}; do
    if revision=$(curl -fsS --max-time 10 --resolve xixutech.cn:443:127.0.0.1 https://xixutech.cn/revision.txt) &&
        test "$revision" = "$release_id"; then
        printf '管理端发布成功：%s\n' "$release_id"
        exit 0
    fi
    sleep 2
done

echo '站点检查失败，正在恢复上一版本。' >&2
switch_to "$previous"
exit 1
