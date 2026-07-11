$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "职配助手 AI Key 本地配置" -ForegroundColor Cyan
Write-Host "Key 只会写入本机应用数据库，不会显示在屏幕上。" -ForegroundColor DarkGray
Write-Host ""

$secureKey = Read-Host "请粘贴 API Key" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($plainKey)) {
  throw "API Key 不能为空。"
}

$baseUrl = Read-Host "Base URL，直接回车使用 https://api.openai.com/v1"
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
  $baseUrl = "https://api.openai.com/v1"
}

$model = Read-Host "模型，直接回车使用 gpt-4.1-mini"
if ([string]::IsNullOrWhiteSpace($model)) {
  $model = "gpt-4.1-mini"
}

$env:JOBFIT_AI_KEY = $plainKey
$env:JOBFIT_AI_BASE_URL = $baseUrl
$env:JOBFIT_AI_MODEL = $model

$python = @'
import json
import os
import sqlite3
import sys

path = os.path.join(os.environ["LOCALAPPDATA"], "JobFitAssistant", "jobfit.sqlite")
os.makedirs(os.path.dirname(path), exist_ok=True)

key = os.environ.get("JOBFIT_AI_KEY", "").strip()
base_url = os.environ.get("JOBFIT_AI_BASE_URL", "").strip() or "https://api.openai.com/v1"
model = os.environ.get("JOBFIT_AI_MODEL", "").strip() or "gpt-4.1-mini"

conn = sqlite3.connect(path)
conn.execute(
    "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), raw TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
)
row = conn.execute("SELECT raw FROM app_state WHERE id = 1").fetchone()
state = json.loads(row[0]) if row else {}
ai = state.setdefault("aiConfig", {})
ai["apiKey"] = key
ai["baseUrl"] = base_url.rstrip("/")
ai["model"] = model
ai["allowSensitiveAi"] = True

raw = json.dumps(state, ensure_ascii=False)
conn.execute(
    "INSERT INTO app_state (id, raw, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) "
    "ON CONFLICT(id) DO UPDATE SET raw = excluded.raw, updated_at = CURRENT_TIMESTAMP",
    (raw,),
)
conn.commit()
conn.close()

print("配置已写入本机数据库。")
print("Base URL:", ai["baseUrl"])
print("模型:", ai["model"])
print("Key 长度:", len(key))
'@

try {
  $python | python -
} finally {
  $env:JOBFIT_AI_KEY = ""
  $env:JOBFIT_AI_BASE_URL = ""
  $env:JOBFIT_AI_MODEL = ""
  $plainKey = ""
}

Write-Host ""
Write-Host "完成。请重新打开职配助手，然后点击“测试 AI 连接”。" -ForegroundColor Green
