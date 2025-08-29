# 🚀 PPT Generator - Quick Start Guide

Get up and running with PPT Generator in just a few minutes!

## 📋 Prerequisites Checklist

- [ ] Python 3.8+ installed on your system
- [ ] Git installed (for cloning the repository)
- [ ] An LLM API key from one of these providers:
  - [ ] [OpenAI](https://platform.openai.com/api-keys) (Recommended)
  - [ ] [Anthropic](https://console.anthropic.com/)
  - [ ] [Google AI Studio](https://aistudio.google.com/app/apikey)

## ⚡ 3-Step Setup

### Step 1: Get the Code
```bash
git clone https://github.com/yourusername/PPT_Generator.git
cd PPT_Generator
```

### Step 2: Set Up Environment
```bash
python setup.py
```
This automatically creates a virtual environment and installs all dependencies!

### Step 3: Activate & Run
```bash
# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start the application
python run.py
```

## 🎯 First Use

1. **Open your browser** to `http://localhost:8080`

2. **Prepare your content:**
   - Paste any text (minimum 100 characters)
   - Add guidance like "make it an investor pitch" (optional)

3. **Configure AI:**
   - Select your LLM provider
   - Enter your API key (never stored!)

4. **Upload template:**
   - Drag & drop a PowerPoint file (.pptx or .potx)
   - Or click to browse and select

5. **Generate & Download:**
   - Click "Generate Presentation"
   - Wait 30-60 seconds
   - Download your styled presentation!

## 🛠️ Troubleshooting

### "ImportError" when running
```bash
# Make sure you're in the virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Then try again
python run.py
```

### "API Error" messages
- Double-check your API key is correct
- Ensure you have credits/quota with your LLM provider
- Try a different provider if one is having issues

### "File too large" error
- PowerPoint templates must be under 50MB
- Try compressing your template or use a simpler one

### App won't start
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Or run setup again
python setup.py
```

## 💡 Pro Tips

- **Start simple:** Use a basic PowerPoint template for your first try
- **Content length:** 500-2000 characters works best for most presentations
- **Clear guidance:** Specific instructions like "technical overview" or "sales pitch" work better than vague ones
- **Template variety:** Try different template styles to see how the app adapts

## 🔗 Need Help?

- 📖 Full documentation: [README.md](README.md)
- 🐛 Report issues: [GitHub Issues](https://github.com/yourusername/PPT_Generator/issues)
- 💡 Feature requests: Open a GitHub issue with your idea

---

**Ready to create amazing presentations? Let's get started! 🎉**
