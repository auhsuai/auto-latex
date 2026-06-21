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

## 🚀 How to Install

There are two ways to install this Add-in: the **Fast Setup** for end-users, and the **Developer Setup** for those who want to modify the code.

### Method 1: Fast Setup (Recommended for Windows Users)

This method allows you to install the Add-in permanently with a single click, without needing to install Node.js or use the terminal. The Add-in will automatically update whenever the codebase is updated.

1. Download or clone this repository.
2. Open the `fast_setup` folder.
3. Double-click the `setup.bat` file. 
4. A black console window will appear and register the Add-in. Once it says `[THANH CONG] Da cai dat xong!`, you can close it.
5. Open Microsoft Word, go to **Insert** -> **My Add-ins**, and you will see **Auto LaTeX** ready to use.

### Method 2: Developer Setup (For modifying code)

#### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- Microsoft Word (Windows/Mac/Web).

#### Setup
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
