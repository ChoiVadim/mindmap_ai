# 🧠 MindCanvas AI

**"Miro for AI Knowledge"** — A visual canvas for structuring, connecting, and reusing AI-generated knowledge.

![MindCanvas AI](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React Flow](https://img.shields.io/badge/React_Flow-12-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)

---

## 🎯 What is MindCanvas AI?

MindCanvas AI solves the **fragmentation problem** of AI chats. Instead of losing context between separate conversations, you can:

- 📝 **Create visual notes** and connect them on a canvas
- 🔗 **Link ideas** with arrows to build context
- 🤖 **Run AI prompts** that automatically use connected notes as context
- 📦 **Organize with groups** to structure related information
- 💾 **Save and reuse** your knowledge maps

---

## ✨ Features

### 🧱 Node Types

| Node Type | Icon | Purpose |
|-----------|------|---------|
| **Note** | 📝 | Store text, ideas, and information |
| **Prompt** | ✨ | AI prompts (runs with connected context) |
| **Group** | # | Container for organizing multiple notes |
| **Text Label** | T | Visual labels and comments |
| **Result** | 💡 | AI-generated responses |

### 🎨 Canvas Features

- ✅ Infinite canvas with zoom & pan
- ✅ Drag-and-drop node creation
- ✅ Connect nodes with arrows
- ✅ Inline text editing
- ✅ Beautiful modern UI with shadows and gradients
- ✅ MiniMap for navigation
- ✅ Auto-save to localStorage

### 🤖 AI Integration

- Automatically gathers context from connected notes
- Groups expand to include all child notes
- Generates responses using GPT-4o
- Creates result nodes automatically
- Preserves conversation history on canvas

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or navigate to the project:**

\`\`\`bash
cd mindmap-ai
\`\`\`

2. **Install dependencies:**

\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables:**

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Then edit `.env.local` and add your OpenAI API key:

\`\`\`
OPENAI_API_KEY=sk-your-key-here
\`\`\`

4. **Run the development server:**

\`\`\`bash
npm run dev
\`\`\`

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 How to Use

### Basic Workflow

1. **Add nodes** from the toolbar (left side)
2. **Click nodes to edit** their content
3. **Drag from handles** to create connections
4. **Connect notes to a Prompt** node
5. **Click the Play button** on the Prompt to generate AI response
6. **View results** in the automatically created Result node

### Example Use Case: Writing a System Prompt

1. Create three Note nodes:
   - "Prompt Style"
   - "User Goal"
   - "Format Requirements"

2. Create a Prompt node with: "Create a system prompt based on these requirements"

3. Connect all three notes → Prompt

4. Click Run (▶️) on the Prompt

5. AI generates a combined response in a new Result node!

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 15 (App Router)
- **UI Framework:** React 18
- **Canvas:** React Flow 12
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI:** OpenAI API (GPT-4o)
- **Storage:** localStorage (browser)

---

## 📁 Project Structure

\`\`\`
mindmap-ai/
├── app/
│   ├── api/
│   │   └── generate/          # AI generation endpoint
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── nodes/                 # Custom node components
│   │   ├── NoteNode.tsx
│   │   ├── PromptNode.tsx
│   │   ├── GroupNode.tsx
│   │   ├── TextLabelNode.tsx
│   │   └── ResultNode.tsx
│   ├── Canvas.tsx             # Main React Flow canvas
│   └── Toolbar.tsx            # Toolbar with node buttons
├── store/
│   └── canvas-store.ts        # Zustand state management
├── types/
│   └── canvas.ts              # TypeScript type definitions
├── lib/
│   └── ai-service.ts          # AI context gathering
└── public/                    # Static assets
\`\`\`

---

## 🎨 Design Inspiration

This project draws inspiration from:

- **Miro** — Infinite canvas and visual thinking
- **Obsidian** — Knowledge graphs and bidirectional linking
- **Notion** — Block-based structure and flexibility
- **ChatGPT** — AI-powered contextual generation

---

## 🔮 Roadmap

### MVP (Current)
- ✅ Basic canvas with node types
- ✅ AI integration with context
- ✅ Local persistence
- ✅ Modern UI

### Future Features
- [ ] Drag-and-drop notes into groups
- [ ] Multiple canvas boards
- [ ] Export to Markdown/JSON
- [ ] Collaborative editing
- [ ] Cloud sync (Supabase)
- [ ] Custom prompt templates
- [ ] Version history
- [ ] Mobile support
- [ ] Dark mode

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) - Excellent flow-based UI library
- [Zustand](https://github.com/pmndrs/zustand) - Minimal state management
- [Lucide Icons](https://lucide.dev/) - Beautiful icon set
- [OpenAI](https://openai.com/) - Powerful AI capabilities

---

## 💬 Questions or Feedback?

If you have questions or want to share your use case, feel free to open an issue!

---

**Built with ❤️ for visual thinkers and AI enthusiasts**
