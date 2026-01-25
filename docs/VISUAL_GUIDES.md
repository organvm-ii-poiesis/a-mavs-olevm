# Visual Guides for the Beginner Tutorial

## Git Workflow Diagram

```
Your Computer                    GitHub
┌─────────────┐                 ┌─────────────┐
│             │                 │             │
│  Working    │ git add .       │             │
│  Directory  ├──────────────►  │ Remote      │
│             │ git commit -m   │ Repository  │
│  (Your      │ git push        │             │
│   Files)    │                 │ (Online)    │
│             │ ◄───────────────┤             │
│             │ git pull        │             │
└─────────────┘                 └─────────────┘
```

## Terminal Navigation

```
File System Structure:
/
├── Users/
│   └── YourName/
│       ├── Desktop/
│       │   └── my-projects/
│       │       └── etceter4/      ← Your project here
│       ├── Documents/
│       └── Downloads/
└── Applications/

Commands to navigate:
• pwd              → Shows current location
• ls / dir         → Lists contents
• cd folder-name   → Enter folder
• cd ..            → Go up one level
• cd               → Go to home directory
```

## VS Code Layout

```
┌────────────────────────────────────────────────────────┐
│ File  Edit  View  Terminal  Help        [- □ ×]        │
├─────────────────────────────────────────────────────── │
│ ┌──────────┐                                           │
│ │ Activity │  ┌─────────────── Editor ─────────────┐   │
│ │   Bar    │  │                                    │   │
│ │          │  │  Your code goes here...            │   │
│ │ 📁 Files │  │                                    │   │
│ │ 🔍 Search│  │  function hello() {                │   │
│ │ 📝 Git   │  │    console.log("Hello World!");    │   │
│ │ 🧩 Extensions  }                                │   │
│ │          │  │                                    │   │
│ └──────────┘  └────────────────────────────────────┘   │
│               ┌────────── Panel ──────────┐           │
│               │ Terminal | Problems | ... │           │
│               │ $ npm test                │           │
│               │ Server running at:        │           │
│               │ http://localhost:3000     │           │
│               └───────────────────────────┘           │
├─────────────────────────────────────────────────────── │
│ Status Bar: Ready | UTF-8 | JavaScript | Git: main    │
└────────────────────────────────────────────────────────┘
```

## Development Workflow Steps

```
Step 1: Setup
┌─────────────┐
│ Install:    │
│ • Node.js   │
│ • Git       │
│ • VS Code   │
└─────────────┘
       ↓
Step 2: Clone Project
┌─────────────┐
│ git clone   │
│ repository  │
└─────────────┘
       ↓
Step 3: Install Dependencies
┌─────────────┐
│ npm install │
└─────────────┘
       ↓
Step 4: Start Development
┌─────────────┐
│ npm test    │
│ code .      │
└─────────────┘
       ↓
Step 5: Make Changes
┌─────────────┐
│ Edit files  │
│ Test in     │
│ browser     │
└─────────────┘
       ↓
Step 6: Save Changes
┌─────────────┐
│ git add .   │
│ git commit  │
│ git push    │
└─────────────┘
```

## File Structure Overview

```
etceter4/                        ← Main project folder
├── 📄 README.md                ← Project information
├── 📄 BEGINNER_TUTORIAL.md     ← This tutorial!
├── 📄 package.json             ← Project configuration
├── 📄 index.html               ← Main website page
├── 📁 css/                     ← Stylesheets folder
│   ├── styles.css              ← Main styles
│   └── vendor/                 ← Third-party CSS
├── 📁 js/                      ← JavaScript folder
│   ├── main.js                 ← Main JavaScript
│   ├── page.js                 ← Page functionality
│   └── other files...
├── 📁 img/                     ← Images folder
├── 📁 fonts/                   ← Font files
├── 📁 node_modules/            ← Dependencies (auto-generated)
└── 📁 docs/                    ← Documentation
```

## Common Error Messages and Solutions

```
❌ Error: "command not found"
💡 Solution: The program isn't installed or not in your PATH

❌ Error: "Permission denied"
💡 Solution: Try with 'sudo' (Mac/Linux) or run as administrator (Windows)

❌ Error: "fatal: not a git repository"
💡 Solution: You're not in a Git project folder

❌ Error: "npm ERR!"
💡 Solution: Try deleting node_modules and running npm install again

❌ Error: "Port 3000 is already in use"
💡 Solution: Another server is running, close it or use different port
```
