# PPT Generator - AI-Powered Presentation Creator

Transform your text into professional PowerPoint presentations with AI-driven content structuring and template-based styling.

## 🚀 Features

- **AI Content Structuring**: Intelligently parse and organize text into slide content
- **Template Style Inheritance**: Extract and apply visual styles from uploaded PowerPoint templates
- **Multi-LLM Support**: Works with OpenAI GPT-4, Anthropic Claude, and Google Gemini
- **Speaker Notes Generation**: Automatically create detailed speaker notes for each slide
- **Professional Templates**: 8 built-in guidance templates (Sales, Research, Pitch, etc.)
- **Slide Previews**: Visual preview before downloading final presentation
- **Robust Error Handling**: Comprehensive validation and retry logic
- **File Size Limits**: Smart validation with user-friendly error messages

## 🎯 Live Demo

- **Local Development**: `http://localhost:8080`
- **Deployed Version**: Deploy to Render, Heroku, or any cloud platform

## 📋 Requirements

- Python 3.8+
- Flask
- python-pptx
- OpenAI/Anthropic/Gemini API key

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PPT_Generator
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create Upload Directory

```bash
mkdir uploads
```

### 5. Start the Application

```bash
python run.py
```

The application will be available at `http://localhost:8080`

## 🚀 Deployment

### Deploy to Render

1. **Connect to GitHub**
   - Go to [Render Dashboard](https://render.com/dashboard)
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `jhaaj08/PPT_Generator`

2. **Configure Deployment**
   - **Name**: `ppt-generator`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT app:app`

3. **Environment Variables**
   - Set `FLASK_ENV` to `production`
   - Set `PYTHON_VERSION` to `3.9.0` (optional)

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Access your live application at the provided Render URL

### Deploy to Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create ppt-generator-app

# Set environment variables
heroku config:set FLASK_ENV=production

# Deploy
git push heroku main

# Open the app
heroku open
```

## 📖 Usage Instructions

### Basic Usage

1. **Access the Application**
   - Open `http://localhost:8080` in your web browser

2. **Prepare Your Content**
   - Paste your text content (minimum 100 characters)
   - Choose a presentation guidance template or write custom guidance
   - Upload a PowerPoint template file (.pptx or .potx)

3. **Configure AI Settings**
   - Select your preferred LLM provider (OpenAI, Anthropic, or Gemini)
   - Enter your API key
   - Enable/disable speaker notes generation

4. **Generate Presentation**
   - Click "Generate Presentation"
   - View slide previews with content and styling
   - Download the final PowerPoint file

### Advanced Features

#### Guidance Templates
Choose from 8 professional templates:
- 📈 **Sales Deck**: Customer presentations, product demos
- 🔬 **Research Summary**: Academic, scientific presentations  
- 🚀 **Investor Pitch**: Startup funding, business pitches
- 🎓 **Training Material**: Educational content, workshops
- 📋 **Project Proposal**: Business proposals, project planning
- 📊 **Executive Report**: C-suite presentations, board meetings
- 🎯 **Strategy Overview**: Strategic planning, roadmaps
- 🎤 **Conference Talk**: Public speaking, conferences

#### Full-Flow Interface
Access enhanced features at `http://localhost:8080/test-full-flow`:
- Detailed slide previews
- Generation progress tracking
- Advanced error handling
- Template analysis insights

## 🔧 API Endpoints

- `GET /` - Main application interface
- `GET /test-full-flow` - Enhanced interface with previews
- `POST /api/generate-presentation-with-preview` - Generate presentation with preview data
- `POST /api/generate-manifest` - Extract template styling manifest
- `GET /api/health` - Health check endpoint

## 📁 Project Structure

```
PPT_Generator/
├── app.py                 # Main Flask application
├── llm_integration.py     # LLM provider integrations
├── improved_ppt_processor.py # PowerPoint processing engine
├── error_handler.py       # Comprehensive error handling
├── retry_handler.py       # API retry logic with backoff
├── requirements.txt       # Python dependencies
├── static/               # Frontend assets
│   ├── index.html        # Main interface
│   ├── test-full-flow.html # Enhanced interface
│   ├── app.js           # Main JavaScript
│   └── test-full-flow.js # Enhanced JavaScript
└── uploads/             # Temporary file storage
```

## 🔑 API Key Setup

### OpenAI
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create an API key starting with `sk-`
3. Ensure you have GPT-4 access for best results

### Anthropic Claude
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an API key starting with `sk-ant-`
3. Claude-3 models recommended

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Gemini Pro model supported

## 🚨 Error Handling

The application includes comprehensive error handling:

- **File Validation**: Size limits (50MB), type checking, corruption detection
- **API Retry Logic**: Exponential backoff for transient failures
- **User-Friendly Messages**: Clear, actionable error descriptions
- **Progress Tracking**: Step-by-step operation monitoring
- **Circuit Breaker**: Prevents cascading failures

## 🔒 Security & Privacy

- **API Keys**: Never stored or logged on the server
- **File Cleanup**: Temporary files automatically removed
- **Input Validation**: Comprehensive client and server-side validation
- **Error Sanitization**: No sensitive data in error messages

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

**Virtual Environment Issues**
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**API Key Errors**
- Verify API key format matches provider requirements
- Check API key permissions and usage limits
- Ensure sufficient credits/quota available

**File Upload Issues**
- Check file size (max 50MB)
- Verify file format (.pptx or .potx only)
- Ensure file is not corrupted

## 📊 Performance & Limits

- **File Size**: Maximum 50MB per template
- **Text Length**: 100 - 100,000 characters
- **Concurrent Users**: Depends on server configuration
- **API Rate Limits**: Handled automatically with retry logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **python-pptx**: PowerPoint file manipulation
- **Flask**: Web framework
- **OpenAI, Anthropic, Google**: LLM API providers
- **Tailwind CSS**: UI styling framework

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review error messages for specific guidance
3. Ensure all dependencies are properly installed
4. Verify API key configuration

---

**Built with ❤️ for creating professional presentations with AI assistance**