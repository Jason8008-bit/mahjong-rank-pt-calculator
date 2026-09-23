"""Create reproducible, allowlisted source/web ZIPs and SHA-256 manifests."""
from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
STAMP = (2026, 9, 21, 0, 0, 0)


class BundleReferences(HTMLParser):
    """Inspect real tags, without mistaking inline JavaScript strings for HTML."""
    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        attrs = dict(attributes)
        if (tag == 'script' and attrs.get('src')) or (tag == 'link' and 'stylesheet' in (attrs.get('rel') or '').split()):
            raise SystemExit('Standalone HTML unexpectedly references an external bundle')


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_versions(version: str, files: dict[str, bytes]) -> None:
    lock = json.loads(files['package-lock.json'])
    if lock.get('version') != version or lock.get('packages', {}).get('', {}).get('version') != version:
        raise SystemExit('Version mismatch in package-lock.json')
    # This project uses a literal version in [project]; no TOML dependency is needed on Python 3.10.
    project = re.search(r'(?ms)^\[project\]\s*\n(.*?)(?=^\[|\Z)', files['pyproject.toml'].decode('utf-8'))
    match = re.search(r'(?m)^version\s*=\s*"([^"]+)"\s*$', project[1] if project else '')
    if not match or match[1] != version:
        raise SystemExit('Version mismatch in pyproject.toml')
    for name in ('docs/usage.md', 'docs/usage.zh-TW.md', 'docs/usage.en.md'):
        if f'tingque-open-tool-v{version}-web.zip' not in files[name].decode('utf-8'):
            raise SystemExit(f'Version mismatch in {name}')
    headings = re.findall(r'(?m)^## (\d+\.\d+\.\d+)\b', files['CHANGELOG.md'].decode('utf-8'))
    if not headings or headings[0] != version:
        raise SystemExit('Version mismatch in CHANGELOG.md')


def archive(path: Path, files: dict[str, bytes]) -> None:
    temporary = path.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, STAMP)
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            output.writestr(info, data)
    temporary.replace(path)


def main() -> None:
    for output in (sys.stdout, sys.stderr):
        if hasattr(output, 'reconfigure'):
            output.reconfigure(encoding='utf-8', errors='backslashreplace')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'release')
    parser.add_argument('--prepare', type=Path, help='Prepare an empty, allowlisted source staging directory for the release builder')
    args = parser.parse_args()
    version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    if not isinstance(version, str) or not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise SystemExit('Version must be x.y.z')
    names = json.loads((ROOT / 'scripts/release-files.json').read_text(encoding='utf-8'))
    if not isinstance(names, list) or not all(isinstance(name, str) for name in names):
        raise SystemExit('Release file list must contain paths')
    if len(names) != len(set(names)):
        raise SystemExit('Duplicate release file')
    files: dict[str, bytes] = {}
    for name in sorted(names):
        path = ROOT / name
        parts = name.split('/')
        if (Path(name).is_absolute() or '\\' in name or PurePosixPath(name).as_posix() != name
                or any(part in ('', '.', '..') for part in parts)
                or any(ROOT.joinpath(*parts[:i + 1]).is_symlink() for i in range(len(parts)))
                or not path.resolve().is_relative_to(ROOT.resolve()) or not path.is_file()):
            raise SystemExit(f'Invalid or missing release file: {name}')
        files[name] = path.read_bytes()
    validate_versions(version, files)
    if args.prepare is not None:
        staging = args.prepare.resolve()
        staging.mkdir(parents=True, exist_ok=True)
        if any(staging.iterdir()):
            raise SystemExit('Source staging directory must be empty')
        for name, data in files.items():
            path = staging / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        print(f'Prepared {len(files)} allowlisted source files')
        return
    manifest = ''.join(f'{digest(data)}  {name}\n' for name, data in files.items()).encode()
    files['SOURCE-MANIFEST.sha256'] = manifest
    html_path = ROOT / 'dist-standalone/index.html'
    if not html_path.is_file():
        raise SystemExit('Run npm run package:release before direct Python packaging')
    html = html_path.read_bytes()
    try:
        provenance = json.loads((html_path.parent / '.build-provenance.json').read_text(encoding='utf-8'))
    except (OSError, ValueError):
        raise SystemExit('Missing or invalid build provenance; run npm run package:release') from None
    if not isinstance(provenance, dict) or provenance.get('schema_version') != 1:
        raise SystemExit('Invalid build provenance; run npm run package:release')
    if provenance.get('isolated_source_build') is not True:
        raise SystemExit('Release build must use isolated source staging; run npm run package:release')
    if provenance.get('version') != version or provenance.get('source_manifest_sha256') != digest(manifest):
        raise SystemExit('Standalone build is stale; run npm run package:release')
    if provenance.get('html_sha256') != digest(html):
        raise SystemExit('Standalone HTML changed after the build; run npm run package:release')
    BundleReferences().feed(html.decode('utf-8'))
    web = {'index.html': html, 'LICENSE': files['LICENSE'], 'THIRD_PARTY_NOTICES.md': files['THIRD_PARTY_NOTICES.md'],
           '使用说明.txt': ('听雀 TingQue\n\n解压后双击 index.html；段位分析和 JSON/CSV 导出可离线运行。\n'
                         'AI 牌谱复盘、第一打模拟、局面逆推和 AI 陪练通过页面入口连接 https://tingque.ai/ 。\n'
                         '点数计算采用已说明的简化规则，用于局面比较。\n\n'
                         '解壓縮後按兩下 index.html，即可離線執行段位分析及JSON/CSV匯出。\n'
                         '其他TingQue功能入口需要網路連線；點數計算採用已說明的簡化規則。\n\n'
                         'Open index.html in a modern browser. Local rank analysis works offline.\n'
                         'TingQue feature links require a network connection.\n').encode('utf-8')}
    web['BUILD-INFO.json'] = json.dumps({'name': 'tingque-open-tool', 'version': version,
        'source_manifest_sha256': digest(manifest), 'html_sha256': digest(html)}, indent=2).encode() + b'\n'
    destination = args.output.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    source_name = f'tingque-open-tool-v{version}-source.zip'
    web_name = f'tingque-open-tool-v{version}-web.zip'
    archive(destination / source_name, {f'tingque-open-tool/{name}': data for name, data in files.items()})
    archive(destination / web_name, {f'tingque-web/{name}': data for name, data in web.items()})
    checksums = ''.join(f'{digest((destination / name).read_bytes())}  {name}\n' for name in (source_name, web_name))
    # newline='\n' 不可省：Path.write_text 默认按平台翻译换行，在 Windows 上打包会写出
    # CRLF，而 sha256sum -c 会把行尾的 \r 当成文件名的一部分，于是每一行都报 FAILED
    # —— 下载者会以为压缩包被人动过。校验清单必须与平台无关。
    (destination / 'SHA256SUMS.txt').write_text(checksums, encoding='utf-8', newline='\n')
    print(f'Packaged {len(files) - 1} source files + source manifest; {len(web)} web files.\n{destination}\n{checksums}', end='')


if __name__ == '__main__':
    main()
