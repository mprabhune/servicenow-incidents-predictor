
# 🚀 ServiceNow Incidents Predictor (DeepSeek R1)

A professional predictive analysis tool for ServiceNow incidents. It uses **DeepSeek R1** running locally on your machine via Ollama for 100% data privacy.

## 🛠️ Quick Start (3 Steps)

### 1. Install & Start Ollama
Download Ollama from [ollama.com](https://ollama.com). Once installed, run:
```bash
# Set CORS permissions so the Web UI can talk to Ollama
export OLLAMA_ORIGINS="*"
ollama serve
```

### 2. Pull the Model
In a new terminal window, download the DeepSeek R1 reasoning model:
```bash
ollama pull deepseek-r1
```

### 3. Run the App
Open `index.html` in your browser. 
- **Web UI**: Upload a CSV and start asking questions.
- **Privacy**: No data leaves your machine.

## 🐍 CLI Analysis Mode
For automated terminal-based analysis:
```bash
# 1. Install dependencies
pip install pandas requests

# 2. Run analysis
python analyze_incidents.py my_data.csv "Which service is highest risk?"
```
