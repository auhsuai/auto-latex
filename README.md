# Auto LaTeX for Microsoft Word

A lightweight, completely offline, and privacy-focused Microsoft Word Add-in that converts LaTeX mathematical formulas into native Word equations seamlessly. 

<div align="center">
  <img src="assets/icon-128.png" alt="Auto LaTeX Icon" width="128">
</div>

## 🔒 100% Privacy Guarantee (Local Processing)

Unlike many AI-based tools or online formatters that send your document data to third-party servers, **Auto LaTeX runs 100% locally on your machine**. 
- **Zero data collection**: Your text and formulas never leave your computer.
- **Client-side processing**: All parsing and rendering (using [KaTeX](https://katex.org/) and [unified](https://unifiedjs.com/)) happen entirely within the secure sandbox of your Word environment.
- You can freely use this for confidential research, exam papers, or proprietary company documents without worrying about data leaks.

## ✨ Features

- **Quick Convert Ribbon Button**: Convert all LaTeX formulas in the document with a single click from the Word Ribbon (Home tab). No need to even open the task pane!
- **Edge Case Auto-Healing**: Handles common LaTeX syntax errors naturally found in raw AI outputs:
  - Balances missing curly braces `{}`.
  - Fixes trailing slashes `\`.
  - Fixes missing `\right` tags.
  - Automatically wraps Vietnamese text inside `\text{...}` blocks.
  - Intelligently spaces merged tokens (e.g., `\muF` -> `\mu F`).
- **High Performance**: Designed with chunking and bulk-sync mechanisms to prevent memory bloat, allowing smooth conversion even on low-end machines for documents with thousands of formulas.
- **Native Word UI Integration**: The add-in's interface is built using standard "Word Blue" typography and flat design to feel like a native Microsoft extension.

## 🚀 How to Install (Sideloading)

Since this project is open-source and free, you can install it directly onto your machine using the sideloading method:

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- Microsoft Word (Windows/Mac/Web).

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/auhsuai/auto-latex.git
   cd auto-latex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Add-in:**
   ```bash
   npm run start
   ```
   *This command will automatically build the project, launch the local development server, and open Microsoft Word with the Add-in loaded into the Ribbon.*

### Production Build
To build the project for a production server deployment:
```bash
npm run build
```

## 🛠 Tech Stack
- **Office.js** - Microsoft's JavaScript API for Word.
- **TypeScript & Webpack 5** - For robust type-checking and bundling.
- **KaTeX** - For lightning-fast MathML generation.
- **remark-math** - AST parsing to extract inline and block formulas accurately.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/auhsuai/auto-latex/issues).

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
