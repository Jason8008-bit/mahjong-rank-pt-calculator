import json
import io
import os
import subprocess
import sys
import pytest
from pathlib import Path

from rankpt import analyze

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = {"kyoku_idx": 0, "honba": 0, "kyotaku": 0, "scores": [25000] * 4}


def run_cli(*args, payload=""):
    return subprocess.run([sys.executable, "-m", "rankpt.cli", *args],
                          input=payload, capture_output=True, text=True, encoding='utf-8', cwd=ROOT)


def test_cli_stdin_matches_library():
    result = run_cli("analyze", "-", payload=json.dumps(SAMPLE))
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == analyze(SAMPLE)


def test_cli_file_matches_library(tmp_path):
    path = tmp_path / "局面.json"
    path.write_text(json.dumps(SAMPLE), encoding="utf-8")
    result = run_cli("analyze", str(path))
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == analyze(SAMPLE)


def test_cli_bad_request_returns_actionable_error():
    result = run_cli("analyze", "-", payload='{"scores": []}')
    assert result.returncode == 2
    assert not result.stdout
    assert "缺少字段" in result.stderr
    assert "Traceback" not in result.stderr


def test_cli_bad_json_and_missing_file():
    for args, payload in [(("analyze", "-"), "{broken"), (("analyze", "missing-file.json"), "")]:
        result = run_cli(*args, payload=payload)
        assert result.returncode == 2
        assert not result.stdout
        assert "Traceback" not in result.stderr


def test_utf8_stdin_with_bom_matches_file_under_non_utf8_locale(tmp_path):
    payload = json.dumps({**SAMPLE, 'table': '特上', 'dan': '四段'}, ensure_ascii=False).encode('utf-8-sig')
    path = tmp_path / 'request.json'
    path.write_bytes(payload)
    outputs = []
    for args, data in [(('-',), payload), ((str(path),), b'')]:
        result = subprocess.run([sys.executable, '-m', 'rankpt.cli', 'analyze', *args], input=data,
                                capture_output=True, cwd=ROOT, env={**os.environ, 'PYTHONIOENCODING': 'cp1252'})
        assert result.returncode == 0, result.stderr.decode('utf-8', errors='replace')
        outputs.append(json.loads(result.stdout))
    assert outputs[0] == outputs[1] == analyze(SAMPLE)


def test_non_utf8_stdin_returns_concise_error():
    result = subprocess.run([sys.executable, '-m', 'rankpt.cli', 'analyze'], input=b'\xff',
                            capture_output=True, cwd=ROOT, env={**os.environ, 'PYTHONIOENCODING': 'cp1252'})
    assert result.returncode == 2
    assert not result.stdout
    assert b'Traceback' not in result.stderr
    result.stderr.decode('utf-8')


def test_error_message_is_utf8_under_non_utf8_locale():
    result = subprocess.run([sys.executable, '-m', 'rankpt.cli', 'analyze'], input=b'{}',
                            capture_output=True, cwd=ROOT, env={**os.environ, 'PYTHONIOENCODING': 'ascii'})
    assert result.returncode == 2
    assert '缺少字段' in result.stderr.decode('utf-8')
    assert b'Traceback' not in result.stderr


def test_deeply_nested_json_is_a_concise_input_error():
    result = run_cli('analyze', '-', payload='[' * 20000 + '0' + ']' * 20000)
    assert result.returncode == 2
    assert not result.stdout
    assert 'Traceback' not in result.stderr
    assert len(result.stderr) < 500


@pytest.mark.parametrize('prefix', ['', '\ufeff'])
def test_main_accepts_replacement_text_streams(monkeypatch, prefix):
    from rankpt.cli import main
    output = io.StringIO()
    monkeypatch.setattr(sys, 'argv', ['rankpt', 'analyze', '-'])
    monkeypatch.setattr(sys, 'stdin', io.StringIO(prefix + json.dumps(SAMPLE)))
    monkeypatch.setattr(sys, 'stdout', output)
    assert main() == 0
    assert json.loads(output.getvalue()) == analyze(SAMPLE)
