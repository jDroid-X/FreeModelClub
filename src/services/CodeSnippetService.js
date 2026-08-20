/**
 * CodeSnippetService.js
 * Purpose: Generates integration script snippets for cURL, Python, Node.js, Go, PHP, and JSON
 *          for all localhost endpoints (chat completions, models, API status).
 * Dependencies: None
 */

class CodeSnippetService {
  static getSnippets(baseUrl = 'http://localhost:12247/v1', apiKey = 'fmc-live-key-jdroidxy-2026', selectedModel = 'llama-3.3-70b-versatile') {
    const endpoints = {
      dashboard: 'http://localhost:12247',
      baseUrl: `${baseUrl}`,
      apiStatus: `${baseUrl}/api`,
      models: `${baseUrl}/models`,
      chatCompletions: `${baseUrl}/chat/completions`
    };

    return {
      endpoints,
      snippets: {
        curl: {
          title: 'cURL Integration',
          language: 'bash',
          chatCompletions: `curl -X POST "${endpoints.chatCompletions}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedModel}",
    "messages": [
      { "role": "system", "content": "You are a helpful AI assistant." },
      { "role": "user", "content": "Hello, explain how localhost AI service proxy works!" }
    ],
    "temperature": 0.7,
    "stream": false
  }'`,
          models: `curl -X GET "${endpoints.models}" \\
  -H "Authorization: Bearer ${apiKey}"`,
          apiStatus: `curl -X GET "${endpoints.apiStatus}"`
        },
        python: {
          title: 'Python (OpenAI SDK)',
          language: 'python',
          chatCompletions: `from openai import OpenAI

# Initialize client pointing to FreeModelsClub Localhost Service
client = OpenAI(
    base_url="${endpoints.baseUrl}",
    api_key="${apiKey}"
)

response = client.chat.completions.create(
    model="${selectedModel}",
    messages=[
        {"role": "system", "content": "You are an expert AI assistant."},
        {"role": "user", "content": "Write a fast python function for quicksort."}
    ],
    temperature=0.7
)

print("Response:", response.choices[0].message.content)
print("Tokens Used:", response.usage.total_tokens if response.usage else "N/A")`,
          models: `import requests

res = requests.get("${endpoints.models}", headers={"Authorization": "Bearer ${apiKey}"})
models = res.json()
print("Available Free Models:", [m["id"] for m in models.get("data", [])])`
        },
        nodejs: {
          title: 'Node.js (OpenAI SDK & Fetch)',
          language: 'javascript',
          chatCompletions: `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: '${endpoints.baseUrl}',
  apiKey: '${apiKey}',
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello FreeModelsClub Chatbot!' }],
    model: '${selectedModel}',
  });

  console.log(completion.choices[0].message.content);
}

main();`,
          models: `fetch('${endpoints.models}', {
  headers: { 'Authorization': 'Bearer ${apiKey}' }
})
  .then(res => res.json())
  .then(data => console.log('Free Models:', data.data));`
        },
        go: {
          title: 'Go (Golang Net/HTTP)',
          language: 'go',
          chatCompletions: `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${endpoints.chatCompletions}"
	payload := []byte(\`{
		"model": "${selectedModel}",
		"messages": [{"role": "user", "content": "Hello from Go!"}]
	}\`)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer ${apiKey}")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(body))
}`
        },
        php: {
          title: 'PHP (cURL)',
          language: 'php',
          chatCompletions: `<?php
$ch = curl_init('${endpoints.chatCompletions}');
$payload = json_encode([
    'model' => '${selectedModel}',
    'messages' => [['role' => 'user', 'content' => 'Hello from PHP!']]
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${apiKey}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`
        },
        jsonSpec: {
          title: 'OpenAI API JSON Specification',
          language: 'json',
          chatCompletions: JSON.stringify(
            {
              model: selectedModel,
              messages: [
                { role: 'system', content: 'System instruction' },
                { role: 'user', content: 'User prompt message' }
              ],
              temperature: 0.7,
              top_p: 1.0,
              max_tokens: 4096,
              stream: false
            },
            null,
            2
          )
        },
        vscode: {
          title: 'External AI Clients (VS Code, Kiro, Cline, Cursor)',
          language: 'json',
          chatCompletions: [
            {
              label: '1. DIRECT MODEL SCRIPT (Target a specific Free Model directly)',
              code: JSON.stringify({
                id: selectedModel,
                name: selectedModel + ' (Direct)',
                url: endpoints.baseUrl,
                toolCalling: true,
                vision: true,
                maxInputTokens: 8192,
                maxOutputTokens: 16000
              }, null, 2)
            },
            {
              label: '2. PROVIDER POOL SCRIPT (Auto-rotate models within a Provider)',
              code: JSON.stringify({
                id: 'provider_openrouter',
                name: 'OpenRouter Pool',
                url: endpoints.baseUrl,
                toolCalling: true,
                vision: true,
                maxInputTokens: 8192,
                maxOutputTokens: 16000
              }, null, 2)
            },
            {
              label: '3. COMBO SCRIPT (Load Balancing & Fallback routing across Providers)',
              code: JSON.stringify({
                id: 'combo_smart_coder',
                name: 'Smart Coder Combo',
                url: endpoints.baseUrl,
                toolCalling: true,
                vision: true,
                maxInputTokens: 8192,
                maxOutputTokens: 16000
              }, null, 2)
            }
          ]
        }
      }
    };
  }
}

module.exports = CodeSnippetService;
