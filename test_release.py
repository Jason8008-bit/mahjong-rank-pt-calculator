"""Exercise release failures in isolated trees without changing working files."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parent


def stamp(root: Path) -> None:
    names = json.loads((root / 'scripts/release-files.json').read_text(encoding='utf-8'))
    manifest = ''.join(f'{hashlib.sha256((root / name).read_bytes()).hexdigest()}  {name}\n' for name in sorted(names))
    html = (root / 'dist-standalone/index.html').read_bytes()
    (root / 'dist-standalone/.build-provenance.json').write_text(json.dumps({
        'schema_version': 1,
        'isolated_source_build': True,
        'version': json.loads((root / 'package.json').read_text(encoding='utf-8'))['version'],
        'source_manifest_sha256': hashlib.sha256(manifest.encode()).hexdigest(),
        'html_sha256': hashlib.sha256(html).hexdigest(),
    }))


@pytest.fixture
def release_tree(tmp_path: Path) -> Path:
    for name in json.loads((ROOT / 'scripts/release-files.json').read_text(encoding='utf-8')):
        destination = tmp_path / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, destination)
    (tmp_path / 'dist-standalone').mkdir()
    (tmp_path / 'dist-standalone/index.html').write_text('<!doctype html><html><body>Isolated packaging fixture</body></html>')
    stamp(tmp_path)
    return tmp_path


def package(root: Path, output: str = 'release') -> subprocess.CompletedProcess[str]:
    return subprocess.run([sys.executable, str(root / 'scripts/package-release.py'), '--output', str(root / output)],
                          capture_output=True, text=True, encoding='utf-8', timeout=20)


def test_package_rejects_source_changed_after_build(release_tree: Path) -> None:
    (release_tree / 'src/content/features.ts').write_text('// Changed since the build\n')
    result = package(release_tree)
    assert result.returncode != 0
    assert 'stale' in result.stderr.lower()
    assert not (release_tree / 'release').exists()


def test_package_rejects_changed_html(release_tree: Path) -> None:
    (release_tree / 'dist-standalone/index.html').write_text('<html><body>Changed HTML</body></html>')
    result = package(release_tree)
    assert result.returncode != 0
    assert 'html' in result.stderr.lower()


def test_package_requires_build_provenance(release_tree: Path) -> None:
    (release_tree / 'dist-standalone/.build-provenance.json').unlink()
    result = package(release_tree)
    assert result.returncode != 0
    assert 'package:release' in result.stderr


@pytest.mark.parametrize('name', ['package-lock.json', 'pyproject.toml', 'README.md', 'README.zh-TW.md', 'README.en.md', 'CHANGELOG.md'])
def test_package_rejects_inconsistent_versions(release_tree: Path, name: str) -> None:
    path = release_tree / name
    version = json.loads((release_tree / 'package.json').read_text(encoding='utf-8'))['version']
    path.write_text(path.read_text(encoding='utf-8').replace(version, '9.9.9'), encoding='utf-8')
    stamp(release_tree)
    result = package(release_tree)
    assert result.returncode != 0
    assert name in result.stderr


def test_package_rejects_duplicate_files(release_tree: Path) -> None:
    path = release_tree / 'scripts/release-files.json'
    names = json.loads(path.read_text(encoding='utf-8'))
    path.write_text(json.dumps(names + names[:1]))
    result = package(release_tree)
    assert result.returncode != 0
    assert 'Duplicate' in result.stderr


def test_package_rejects_symlinked_parent_directory(release_tree: Path, tmp_path: Path) -> None:
    external = tmp_path.parent / f'{tmp_path.name}-external'
    external.mkdir()
    (external / 'private.txt').write_text('must never enter an archive')
    try:
        (release_tree / 'linked').symlink_to(external, target_is_directory=True)
    except OSError:
        pytest.skip('Directory symlinks unavailable for this user')
    path = release_tree / 'scripts/release-files.json'
    path.write_text(json.dumps(json.loads(path.read_text(encoding='utf-8')) + ['linked/private.txt']))
    result = package(release_tree)
    assert result.returncode != 0
    assert 'Invalid' in result.stderr


def test_valid_build_packages_reproducibly(release_tree: Path) -> None:
    first = package(release_tree, 'first')
    second = package(release_tree, 'second')
    assert first.returncode == 0, first.stderr
    assert second.returncode == 0, second.stderr
    for path in (release_tree / 'first').iterdir():
        assert path.read_bytes() == (release_tree / 'second' / path.name).read_bytes()


def test_checksum_list_is_usable_on_any_platform(release_tree: Path) -> None:
    """校验清单必须恒为 LF，且每个值真的对得上文件。

    Path.write_text 默认按平台翻译换行，在 Windows 上打包会写出 CRLF；sha256sum -c
    会把行尾的 \\r 当成文件名的一部分，于是每一行都报 FAILED —— 下载者会以为压缩包
    被人动过。所以这里钉的是字节，不是「能不能读出来」。
    """
    result = package(release_tree)
    assert result.returncode == 0, result.stderr
    raw = (release_tree / 'release/SHA256SUMS.txt').read_bytes()
    assert b'\r' not in raw, f'校验清单里混进了回车符: {raw!r}'

    lines = raw.decode('utf-8').splitlines()
    assert len(lines) == 2, lines
    for line in lines:
        recorded, separator, name = line.partition('  ')
        assert separator and name.endswith('.zip'), line
        actual = hashlib.sha256((release_tree / 'release' / name).read_bytes()).hexdigest()
        assert recorded == actual, f'{name} 的校验值对不上'


def test_package_reports_unicode_destination_under_non_utf8_locale(release_tree: Path) -> None:
    result = subprocess.run([sys.executable, str(release_tree / 'scripts/package-release.py'), '--output', str(release_tree / '发布包')],
                            capture_output=True, env={**os.environ, 'PYTHONIOENCODING': 'ascii'}, timeout=20)
    assert result.returncode == 0, result.stderr.decode('utf-8', errors='replace')
    assert '发布包' in result.stdout.decode('utf-8')
