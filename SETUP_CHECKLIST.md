# ✅ Beginner Setup Checklist

Use this checklist to make sure you have everything set up correctly before starting development.

## Pre-Development Setup

### 1. Essential Software Installation
- [ ] **Node.js** installed (check with `node --version`)
- [ ] **npm** installed (check with `npm --version`)
- [ ] **Git** installed (check with `git --version`)
- [ ] **VS Code** installed and can be opened

### 2. Git Configuration
- [ ] Set your Git username: `git config --global user.name "Your Name"`
- [ ] Set your Git email: `git config --global user.email "your.email@example.com"`
- [ ] Test Git config: `git config --list`

### 3. GitHub Account
- [ ] GitHub account created
- [ ] Can log in to GitHub.com
- [ ] Understand basic GitHub terminology (repository, clone, commit, push, pull)

### 4. VS Code Setup
- [ ] VS Code opens and works
- [ ] Can open terminal in VS Code (`Ctrl+\`` or `Cmd+\``)
- [ ] Installed recommended extensions:
  - [ ] Live Server
  - [ ] Prettier - Code formatter
  - [ ] Auto Rename Tag
  - [ ] GitLens
- [ ] Format on save enabled in settings

## Project Setup

### 5. This Project (ETCETER4)
- [ ] Repository cloned to your computer: `git clone https://github.com/4-b100m/etceter4.git`
- [ ] Can navigate to project folder: `cd etceter4`
- [ ] Dependencies installed: `npm install` (completed without major errors)
  - **Note**: You may see warnings - this is normal for older projects
  - The important thing is that `node_modules` folder is created
- [ ] Development server runs: `npm test` (shows "Access URLs" with localhost)
- [ ] Can open project in VS Code: `code .`

### 6. Basic Workflow Test
- [ ] Made a small change to a file (like adding your name to README.md)
- [ ] Checked Git status: `git status` (shows modified files)
- [ ] Staged changes: `git add filename` or `git add .`
- [ ] Committed changes: `git commit -m "Your message"`
- [ ] Pushed to GitHub: `git push origin master` (may need to set up authentication)

## Verification

### 7. Everything Works
- [ ] Terminal commands work (can navigate with `cd`, `ls`/`dir`, `pwd`)
- [ ] Git commands work without errors
- [ ] VS Code can edit files and save them
- [ ] Development server shows website in browser
- [ ] Changes to files automatically refresh the browser
- [ ] Can commit and push changes to GitHub

## Troubleshooting

**If any item above fails:**
1. ❓ Check the [Beginner Tutorial](BEGINNER_TUTORIAL.md) troubleshooting section
2. 🔍 Google the specific error message
3. 📚 Review the installation steps for the failing tool
4. 💬 Ask for help in developer communities

## Next Steps Once Everything Works

- [ ] Read through the complete [Beginner Tutorial](BEGINNER_TUTORIAL.md)
- [ ] Explore the project files and understand the structure  
- [ ] Make small experimental changes to see what happens
- [ ] Practice the Git workflow with several commits
- [ ] Start learning HTML, CSS, and JavaScript basics

## 🎉 Congratulations!

If you can check off all the items above, you have a complete development environment ready for web development! 

**Pro tip:** Save this checklist - you can use it for future projects too!

---

*Having trouble with any step? Don't give up! Every developer has been where you are. The learning curve is steep at first, but it gets much easier with practice.*