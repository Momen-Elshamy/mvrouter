# Icon Documentation for AI Providers

This document explains the icon patterns and options available when creating or updating AI providers in the Hive Router system.

## Icon Types

### 1. Emoji Icons
You can use emoji icons directly in the icon field. These are simple and universally supported.

**Examples:**
- 🤖 (Robot) - For AI/ML providers
- 🧠 (Brain) - For neural network providers
- 💡 (Lightbulb) - For creative AI providers
- 🔥 (Fire) - For fast/performance providers
- 🌟 (Star) - For premium providers
- 🎯 (Target) - For specialized providers
- 🚀 (Rocket) - For cutting-edge providers
- 🎨 (Artist Palette) - For creative AI providers

### 2. Lucide React Icons
You can also use icon names from the Lucide React library. These will be automatically converted to the appropriate icon component.

**Examples:**
- `robot` - Robot icon
- `brain` - Brain icon
- `lightbulb` - Lightbulb icon
- `zap` - Lightning bolt icon
- `star` - Star icon
- `target` - Target icon
- `rocket` - Rocket icon
- `palette` - Artist palette icon
- `cpu` - CPU icon
- `database` - Database icon
- `cloud` - Cloud icon
- `shield` - Security icon

## Type-Specific Icon Recommendations

### Image Generation Providers
**Recommended Icons:**
- 🎨 (Artist Palette) - Most popular for image generation
- 🖼️ (Picture Frame) - For image editing/manipulation
- 📸 (Camera) - For photo-related AI
- `image` - Lucide image icon
- `camera` - Lucide camera icon

### Text Generation Providers
**Recommended Icons:**
- 📝 (Memo) - For text generation
- 💬 (Speech Balloon) - For conversational AI
- 🧠 (Brain) - For language models
- `message-square` - Lucide message icon
- `file-text` - Lucide text file icon

### Video Generation Providers
**Recommended Icons:**
- 🎬 (Clapper Board) - For video generation
- 📹 (Video Camera) - For video creation
- 🎥 (Movie Camera) - For cinematic AI
- `video` - Lucide video icon
- `play` - Lucide play icon

### Audio Generation Providers
**Recommended Icons:**
- 🎵 (Musical Note) - For music generation
- 🔊 (Speaker) - For audio output
- 🎤 (Microphone) - For voice synthesis
- `volume-2` - Lucide volume icon
- `music` - Lucide music icon

### Multimodal Providers
**Recommended Icons:**
- 🔄 (Arrows) - For multi-modal processing
- ⚡ (Lightning) - For fast multi-modal AI
- 🌐 (Globe) - For comprehensive AI
- `layers` - Lucide layers icon
- `zap` - Lucide lightning icon

### Code Generation Providers
**Recommended Icons:**
- 💻 (Laptop) - For code generation
- 🔧 (Wrench) - For development tools
- ⚙️ (Gear) - For technical AI
- `code` - Lucide code icon
- `terminal` - Lucide terminal icon

### Other Providers
**Recommended Icons:**
- 🤖 (Robot) - General AI
- ⚡ (Lightning) - Fast/performance AI
- 🔮 (Crystal Ball) - Predictive AI
- `zap` - Lucide lightning icon
- `bot` - Lucide bot icon

## Best Practices

1. **Consistency**: Choose icons that represent the provider's function or specialty
2. **Simplicity**: Use simple, recognizable icons
3. **Uniqueness**: Avoid using the same icon for multiple providers in the same category
4. **Accessibility**: Ensure icons are clear and distinguishable
5. **Type Alignment**: Use type-specific recommended icons when possible

## Icon Categories by AI Provider Type

### General AI Providers
- 🤖 (robot) - General AI services
- 🧠 (brain) - Neural networks
- 💡 (lightbulb) - Creative AI

### Specialized AI Providers
- 🎨 (palette) - Image generation
- 🎵 (musical-note) - Audio generation
- 📝 (file-text) - Text generation
- 🔍 (search) - Search/Analysis
- 🎯 (target) - Specialized tasks

### Performance/Quality Indicators
- 🚀 (rocket) - High performance
- ⚡ (zap) - Fast processing
- 🌟 (star) - Premium quality
- 🔥 (flame) - Hot/new technology

## How to Use

1. **In the Create Provider Form**: Enter either an emoji or a Lucide icon name in the icon field
2. **Validation**: The system accepts both emoji and text-based icon names
3. **Display**: Icons will be displayed in the provider list and detail views
4. **Type Matching**: Consider using type-specific recommended icons for better categorization

## Technical Notes

- Emoji icons are stored as-is in the database
- Lucide icon names are converted to components when displayed
- The system supports both formats seamlessly
- Icon validation ensures only valid patterns are accepted
- Type-specific icons help with visual categorization in the dashboard

## Examples by Type

### Image Generation
```json
{
  "name": "Stable Diffusion",
  "icon": "🎨",
  "type": "image",
  "version": "2.1.0"
}
```

### Text Generation
```json
{
  "name": "OpenAI GPT-4",
  "icon": "🧠",
  "type": "text",
  "version": "4.0.0"
}
```

### Video Generation
```json
{
  "name": "Runway Gen-2",
  "icon": "🎬",
  "type": "video",
  "version": "1.0.0"
}
```

### Audio Generation
```json
{
  "name": "ElevenLabs",
  "icon": "🎵",
  "type": "audio",
  "version": "1.0.0"
}
```

### Code Generation
```json
{
  "name": "GitHub Copilot",
  "icon": "💻",
  "type": "code",
  "version": "1.0.0"
}
```

### Multimodal
```json
{
  "name": "GPT-4V",
  "icon": "🔄",
  "type": "multimodal",
  "version": "4.0.0"
}
``` 