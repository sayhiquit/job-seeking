use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;

fn db_path() -> Result<PathBuf, String> {
    let mut dir = dirs::data_local_dir().ok_or_else(|| "Cannot resolve local data directory".to_string())?;
    dir.push("JobFitAssistant");
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    dir.push("jobfit.sqlite");
    Ok(dir)
}

fn connection() -> Result<Connection, String> {
    let conn = Connection::open(db_path()?).map_err(|error| error.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            raw TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )
    .map_err(|error| error.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS analysis_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )
    .map_err(|error| error.to_string())?;
    Ok(conn)
}

#[tauri::command]
fn load_state() -> Result<Option<String>, String> {
    let conn = connection()?;
    let mut stmt = conn
        .prepare("SELECT raw FROM app_state WHERE id = 1")
        .map_err(|error| error.to_string())?;
    let mut rows = stmt.query([]).map_err(|error| error.to_string())?;
    match rows.next().map_err(|error| error.to_string())? {
        Some(row) => row.get(0).map(Some).map_err(|error| error.to_string()),
        None => Ok(None),
    }
}

#[tauri::command]
fn save_state(raw: String) -> Result<(), String> {
    let conn = connection()?;
    conn.execute(
        "INSERT INTO app_state (id, raw, updated_at)
         VALUES (1, ?1, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET raw = excluded.raw, updated_at = CURRENT_TIMESTAMP",
        params![raw],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn save_analysis_record(raw: String) -> Result<(), String> {
    let conn = connection()?;
    conn.execute(
        "INSERT INTO analysis_records (raw, created_at) VALUES (?1, CURRENT_TIMESTAMP)",
        params![raw],
    )
    .map_err(|error| error.to_string())?;
    conn.execute(
        "DELETE FROM analysis_records
         WHERE id NOT IN (
            SELECT id FROM analysis_records ORDER BY created_at DESC, id DESC LIMIT 50
         )",
        [],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_analysis_records() -> Result<Vec<String>, String> {
    let conn = connection()?;
    let mut stmt = conn
        .prepare("SELECT raw FROM analysis_records ORDER BY created_at DESC, id DESC LIMIT 50")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?;
    let mut records = Vec::new();
    for row in rows {
        records.push(row.map_err(|error| error.to_string())?);
    }
    Ok(records)
}

#[tauri::command]
fn clear_state() -> Result<(), String> {
    let conn = connection()?;
    conn.execute("DELETE FROM app_state WHERE id = 1", [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn clear_analysis_records() -> Result<(), String> {
    let conn = connection()?;
    conn.execute("DELETE FROM analysis_records", [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_default_ai_config() -> Result<String, String> {
    let api_key = env::var("CODEX_API_KEY")
        .or_else(|_| env::var("OPENAI_API_KEY"))
        .unwrap_or_default();
    let base_url = env::var("OPENAI_BASE_URL")
        .or_else(|_| env::var("OPENAI_API_BASE"))
        .unwrap_or_else(|_| "https://api.openai.com/v1".to_string());
    let model = env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());

    Ok(serde_json::json!({
        "apiKey": api_key,
        "baseUrl": base_url,
        "model": model
    })
    .to_string())
}

#[derive(Debug, Deserialize)]
struct AiMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct AiChatRequest {
    api_key: String,
    base_url: String,
    model: String,
    temperature: f32,
    messages: Vec<AiMessage>,
}

#[derive(Debug, Serialize)]
struct ProviderMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ProviderChatRequest {
    model: String,
    temperature: f32,
    messages: Vec<ProviderMessage>,
}

#[derive(Debug, Deserialize)]
struct ProviderChatResponse {
    choices: Vec<ProviderChoice>,
}

#[derive(Debug, Deserialize)]
struct ProviderChoice {
    message: ProviderResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ProviderResponseMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct ProviderErrorResponse {
    error: Option<ProviderError>,
}

#[derive(Debug, Deserialize)]
struct ProviderError {
    message: Option<String>,
}

#[tauri::command]
async fn chat_completion(request: AiChatRequest) -> Result<String, String> {
    let mut base_url_owned = request
        .base_url
        .trim()
        .trim_end_matches('/')
        .trim_end_matches("/chat/completions")
        .to_string();
    if base_url_owned == "https://api.openai.com" {
        base_url_owned = "https://api.openai.com/v1".to_string();
    }
    let base_url = base_url_owned.as_str();
    if request.api_key.trim().is_empty() {
        return Err("请先在设置里填写 AI API Key。".to_string());
    }
    if base_url.is_empty() {
        return Err("请先在设置里填写 Base URL，例如 https://api.openai.com/v1。".to_string());
    }
    if !base_url.starts_with("http://") && !base_url.starts_with("https://") {
        return Err("Base URL 需要以 http:// 或 https:// 开头，例如 https://api.openai.com/v1。".to_string());
    }

    let url = format!("{}/chat/completions", base_url);
    let payload = ProviderChatRequest {
        model: if request.model.trim().is_empty() {
            "gpt-4.1-mini".to_string()
        } else {
            request.model
        },
        temperature: request.temperature,
        messages: request
            .messages
            .into_iter()
            .map(|message| ProviderMessage {
                role: message.role,
                content: message.content,
            })
            .collect(),
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|error| format!("AI 客户端初始化失败：{}", error))?;

    let response = client
        .post(url)
        .bearer_auth(request.api_key.trim())
        .json(&payload)
        .send()
        .await
        .map_err(|error| {
            if error.is_timeout() {
                "AI 请求超时：服务响应过慢，请稍后重试或更换 Base URL。".to_string()
            } else if error.is_connect() {
                "AI 服务连接失败：请检查网络、Base URL 或代理设置。".to_string()
            } else {
                format!("AI 请求失败：{}", error)
            }
        })?;

    let status = response.status();
    let text = response
        .text()
        .await
        .map_err(|error| format!("读取 AI 响应失败：{}", error))?;

    if !status.is_success() {
        let provider_message = serde_json::from_str::<ProviderErrorResponse>(&text)
            .ok()
            .and_then(|value| value.error.and_then(|error| error.message))
            .unwrap_or(text);
        return match status.as_u16() {
            401 => Err(format!("AI 请求失败：API Key 无效或没有权限。{}", provider_message)),
            404 => Err(format!("AI 请求失败：Base URL 或模型名称不正确。{}", provider_message)),
            429 => Err(format!("AI 请求失败：额度不足或请求过快。{}", provider_message)),
            code => Err(format!("AI 请求失败：HTTP {}，{}", code, provider_message)),
        };
    }

    let data = serde_json::from_str::<ProviderChatResponse>(&text)
        .map_err(|error| format!("AI 响应格式无法解析：{}。原始响应：{}", error, text))?;
    data.choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .filter(|content| !content.trim().is_empty())
        .ok_or_else(|| "AI 没有返回有效内容，请检查模型名称或服务商响应格式。".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_state,
            save_state,
            save_analysis_record,
            load_analysis_records,
            clear_state,
            clear_analysis_records,
            load_default_ai_config,
            chat_completion
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
