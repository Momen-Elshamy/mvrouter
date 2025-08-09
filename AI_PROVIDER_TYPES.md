# AI Provider Types Documentation

This document explains the different types of AI providers available in the Hive Router system and their specific use cases.

## Available AI Provider Types

### 1. Image Generation (`image`)
AI providers that specialize in creating, editing, or manipulating images.

**Examples:**
- Stable Diffusion
- DALL-E
- Midjourney
- Leonardo AI
- Runway ML

**Use Cases:**
- Text-to-image generation
- Image editing and manipulation
- Style transfer
- Image enhancement
- Creative artwork generation

**Recommended Icons:**
- 🎨 (Artist Palette)
- 🖼️ (Picture Frame)
- 📸 (Camera)
- `image` (Lucide icon)

### 2. Text Generation (`text`)
AI providers that focus on natural language processing and text generation.

**Examples:**
- OpenAI GPT-4
- Claude (Anthropic)
- LLaMA
- PaLM
- Cohere

**Use Cases:**
- Chatbots and conversational AI
- Content creation
- Language translation
- Text summarization
- Sentiment analysis
- Question answering

**Recommended Icons:**
- 📝 (Memo)
- 💬 (Speech Balloon)
- 🧠 (Brain)
- `message-square` (Lucide icon)

### 3. Video Generation (`video`)
AI providers that create, edit, or manipulate video content.

**Examples:**
- Runway Gen-2
- Pika Labs
- Stable Video Diffusion
- Meta Make-A-Video
- Google Imagen Video

**Use Cases:**
- Text-to-video generation
- Video editing and effects
- Video enhancement
- Animation creation
- Video style transfer

**Recommended Icons:**
- 🎬 (Clapper Board)
- 📹 (Video Camera)
- 🎥 (Movie Camera)
- `video` (Lucide icon)

### 4. Audio Generation (`audio`)
AI providers that create, edit, or manipulate audio content.

**Examples:**
- ElevenLabs
- Play.ht
- Murf AI
- Descript
- Synthesia

**Use Cases:**
- Text-to-speech
- Voice cloning
- Music generation
- Audio editing
- Podcast creation
- Voice synthesis

**Recommended Icons:**
- 🎵 (Musical Note)
- 🔊 (Speaker)
- 🎤 (Microphone)
- `volume-2` (Lucide icon)

### 5. Multimodal (`multimodal`)
AI providers that can handle multiple types of content (text, image, video, audio) simultaneously.

**Examples:**
- GPT-4V (GPT-4 Vision)
- Claude 3.5 Sonnet
- Gemini Pro
- LLaVA
- Flamingo

**Use Cases:**
- Cross-modal understanding
- Image captioning
- Visual question answering
- Content analysis across modalities
- Multimodal chatbots

**Recommended Icons:**
- 🔄 (Arrows)
- ⚡ (Lightning)
- 🌐 (Globe)
- `layers` (Lucide icon)

### 6. Code Generation (`code`)
AI providers that specialize in generating, analyzing, or manipulating code.

**Examples:**
- GitHub Copilot
- CodeWhisperer
- Cursor
- Tabnine
- Replit Ghost

**Use Cases:**
- Code completion
- Code generation from descriptions
- Code review and analysis
- Bug detection
- Code refactoring
- Documentation generation

**Recommended Icons:**
- 💻 (Laptop)
- 🔧 (Wrench)
- ⚙️ (Gear)
- `code` (Lucide icon)

### 7. Other (`other`)
AI providers that don't fit into the above categories or have specialized functions.

**Examples:**
- Custom AI solutions
- Specialized APIs
- Research models
- Experimental AI

**Use Cases:**
- Custom implementations
- Research projects
- Specialized applications
- Experimental features

**Recommended Icons:**
- 🤖 (Robot)
- ⚡ (Lightning)
- 🔮 (Crystal Ball)
- `zap` (Lucide icon)

## Type Selection Guidelines

### For Image Generation Providers
- Choose `image` type for providers that primarily generate or manipulate images
- Use purple color coding in the dashboard
- Recommended icons: 🎨, 🖼️, 📸

### For Text Generation Providers
- Choose `text` type for providers that focus on language processing
- Use blue color coding in the dashboard
- Recommended icons: 📝, 💬, 🧠

### For Video Generation Providers
- Choose `video` type for providers that create or edit video content
- Use red color coding in the dashboard
- Recommended icons: 🎬, 📹, 🎥

### For Audio Generation Providers
- Choose `audio` type for providers that handle sound and voice
- Use green color coding in the dashboard
- Recommended icons: 🎵, 🔊, 🎤

### For Multimodal Providers
- Choose `multimodal` type for providers that handle multiple content types
- Use yellow color coding in the dashboard
- Recommended icons: 🔄, ⚡, 🌐

### For Code Generation Providers
- Choose `code` type for providers that generate or analyze code
- Use indigo color coding in the dashboard
- Recommended icons: 💻, 🔧, ⚙️

### For Other Providers
- Choose `other` type for specialized or custom providers
- Use gray color coding in the dashboard
- Recommended icons: 🤖, ⚡, 🔮

## Implementation Notes

- Each type has a specific color scheme in the dashboard for easy identification
- Types are validated using an enum to ensure only valid values are accepted
- The default type is `other` for backward compatibility
- Types are displayed with proper capitalization in the UI
- Type information is stored in the database and used for filtering and categorization

## Examples

```json
{
  "name": "Stable Diffusion",
  "type": "image",
  "icon": "🎨",
  "version": "2.1.0"
}
```

```json
{
  "name": "OpenAI GPT-4",
  "type": "text",
  "icon": "🧠",
  "version": "4.0.0"
}
```

```json
{
  "name": "Runway Gen-2",
  "type": "video",
  "icon": "🎬",
  "version": "1.0.0"
}
```

```json
{
  "name": "GitHub Copilot",
  "type": "code",
  "icon": "💻",
  "version": "1.0.0"
}
``` 