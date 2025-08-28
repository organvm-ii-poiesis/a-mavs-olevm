# Complete Beginner's Guide to Web Development Tools

Welcome to the complete beginner's guide for getting started with essential web development tools! This tutorial will walk you through setting up and using the fundamental tools every developer needs, from the terminal to GitHub to VS Code.

## 🎯 What You'll Learn

By the end of this tutorial, you'll be able to:
- Navigate and use the terminal/command line confidently
- Set up and use Git and GitHub for version control
- Install and configure VS Code for web development
- Clone and run this project locally
- Make changes and contribute to projects
- Follow best practices for beginner developers

## 📋 Prerequisites

- A computer running Windows, macOS, or Linux
- An internet connection
- No programming experience required!

---

## 1. 🖥️ Terminal Basics

The terminal (also called command line, shell, or console) is a text-based way to interact with your computer. Don't worry - it's not as scary as it looks!

### What is the Terminal?

The terminal allows you to:
- Navigate through folders (directories)
- Run programs and commands
- Install software
- Manage files
- Work with code projects

### Opening the Terminal

**On Mac:**
- Press `Cmd + Space` to open Spotlight
- Type "Terminal" and press Enter
- Or go to Applications > Utilities > Terminal

**On Windows:**
- Press `Win + R`, type `cmd`, and press Enter
- Or search for "Command Prompt" in the Start menu
- For a better experience, install Windows Terminal from the Microsoft Store

**On Linux:**
- Press `Ctrl + Alt + T`
- Or search for "Terminal" in your applications

### Essential Terminal Commands

Here are the most important commands you'll use daily:

```bash
# See where you are (print working directory)
pwd

# List files and folders in current location
ls                    # Mac/Linux
dir                   # Windows

# List files with more details
ls -la                # Mac/Linux
dir /a                # Windows

# Change directory (move to a folder)
cd foldername         # Go into a folder
cd ..                 # Go up one level
cd                    # Go to home directory
cd ~                  # Go to home directory (Mac/Linux)

# Create a new folder
mkdir newfolder

# Create a new file
touch filename.txt    # Mac/Linux
echo. > filename.txt  # Windows

# View file contents
cat filename.txt      # Mac/Linux
type filename.txt     # Windows

# Copy files
cp file.txt copy.txt  # Mac/Linux
copy file.txt copy.txt # Windows

# Move/rename files
mv oldname.txt newname.txt    # Mac/Linux
move oldname.txt newname.txt  # Windows

# Delete files (be careful!)
rm filename.txt       # Mac/Linux
del filename.txt      # Windows

# Delete folders (be very careful!)
rm -rf foldername     # Mac/Linux
rmdir /s foldername   # Windows
```

### Practice Exercise

Try these commands to get comfortable:

1. Open your terminal
2. Type `pwd` to see where you are
3. Type `ls` (Mac/Linux) or `dir` (Windows) to see what's in your current folder
4. Create a test folder: `mkdir my-test-folder`
5. Go into that folder: `cd my-test-folder`
6. Create a test file: `touch test.txt` (Mac/Linux) or `echo. > test.txt` (Windows)
7. List the files to see your new file: `ls` or `dir`
8. Go back up: `cd ..`

---

## 2. 🔧 Installing Essential Tools

### Installing Node.js and npm

Node.js is a JavaScript runtime that lets you run JavaScript outside the browser. npm (Node Package Manager) comes with it and helps you install code libraries.

#### Method 1: Using Node Version Manager (NVM) - Recommended

NVM allows you to install and switch between different versions of Node.js easily.

**On Mac/Linux:**

1. Open your terminal
2. Install NVM with this command:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```

3. Close and reopen your terminal, or run:
```bash
source ~/.bashrc
```

4. Install the latest LTS (Long Term Support) version of Node.js:
```bash
nvm install --lts
```

5. Use the LTS version as default:
```bash
nvm use --lts
nvm alias default node
```

**On Windows:**

1. Download nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
2. Download the `nvm-setup.exe` file
3. Run the installer
4. Open a new Command Prompt or PowerShell as Administrator
5. Install Node.js:
```bash
nvm install lts
nvm use lts
```

#### Method 2: Direct Installation

1. Go to https://nodejs.org/
2. Download the LTS version for your operating system
3. Run the installer and follow the prompts
4. Restart your terminal

#### Verify Installation

Check that Node.js and npm are installed:
```bash
node --version
npm --version
```

You should see version numbers for both.

### Installing Git

Git is a version control system that tracks changes in your code and helps you collaborate with others.

**On Mac:**
- Install using Homebrew: `brew install git`
- Or download from: https://git-scm.com/download/mac

**On Windows:**
- Download from: https://git-scm.com/download/win
- Run the installer (accept default settings)

**On Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**On Linux (CentOS/RHEL):**
```bash
sudo yum install git
```

#### Verify Git Installation

```bash
git --version
```

#### Configure Git

Set up your name and email (this will appear in your commits):
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 3. 🐱 GitHub Setup and Basics

GitHub is a platform where developers store, share, and collaborate on code projects.

### Creating a GitHub Account

1. Go to https://github.com
2. Click "Sign up"
3. Choose a username (this will be public and part of your profile)
4. Enter your email and create a password
5. Verify your account via email

### Understanding Git vs GitHub

- **Git**: The version control system (software on your computer)
- **GitHub**: A cloud service that hosts Git repositories and provides collaboration tools

### Basic GitHub Concepts

- **Repository (Repo)**: A project folder that contains your code and its history
- **Clone**: Download a copy of a repository to your computer
- **Fork**: Create your own copy of someone else's repository
- **Commit**: Save a snapshot of your changes
- **Push**: Upload your commits to GitHub
- **Pull**: Download changes from GitHub
- **Pull Request**: Request to merge your changes into someone else's project

### Your First Repository

#### Creating a Repository on GitHub

1. Log in to GitHub
2. Click the "+" icon in the top right
3. Select "New repository"
4. Choose a repository name (e.g., "my-first-repo")
5. Add a description (optional)
6. Keep it public for learning
7. Check "Add a README file"
8. Click "Create repository"

#### Cloning Your Repository

1. On your repository page, click the green "Code" button
2. Copy the HTTPS URL
3. In your terminal, navigate to where you want the project:
```bash
cd Desktop  # or wherever you want to put it
```
4. Clone the repository:
```bash
git clone https://github.com/yourusername/my-first-repo.git
```
5. Go into the project folder:
```bash
cd my-first-repo
```

### Basic Git Workflow

Here's the typical workflow for making changes:

```bash
# 1. Check the status of your files
git status

# 2. Make changes to your files (edit README.md, for example)

# 3. Add files to staging area
git add .                    # Add all changes
git add filename.txt         # Add specific file

# 4. Commit your changes
git commit -m "Describe what you changed"

# 5. Push changes to GitHub
git push origin main
```

### Practice Exercise

1. Create a test repository on GitHub
2. Clone it to your computer
3. Edit the README.md file in a text editor
4. Add a line like "Hello, world! This is my first edit."
5. Save the file
6. In terminal, run:
```bash
git status
git add README.md
git commit -m "Updated README with hello message"
git push origin main
```
7. Check your GitHub repository to see the changes!

---

## 4. 💻 VS Code Setup and Configuration

Visual Studio Code (VS Code) is a free, powerful code editor that's perfect for beginners and professionals alike.

### Installing VS Code

1. Go to https://code.visualstudio.com/
2. Download for your operating system
3. Install using default settings
4. Launch VS Code

### First-Time Setup

When you first open VS Code, you might see:
- Welcome tab with helpful links
- Theme selection (choose what you like)
- Extension recommendations

### Essential Extensions for Web Development

Extensions add functionality to VS Code. Install these essential ones:

1. **Live Server**
   - Click Extensions icon (or press `Ctrl+Shift+X`)
   - Search "Live Server"
   - Click Install
   - *What it does*: Creates a local server to preview your websites

2. **Prettier - Code formatter**
   - Search and install "Prettier"
   - *What it does*: Automatically formats your code to look neat

3. **Auto Rename Tag**
   - Search and install "Auto Rename Tag"
   - *What it does*: When you change an HTML opening tag, it automatically changes the closing tag

4. **Bracket Pair Colorizer** (or use built-in bracket colorization)
   - *What it does*: Colors matching brackets to help you see code structure

5. **GitLens**
   - Search and install "GitLens"
   - *What it does*: Shows Git information inline with your code

### Basic VS Code Navigation

#### Key Interface Elements:
- **Activity Bar** (left side): File explorer, search, Git, extensions
- **Editor Area** (center): Where you write code
- **Panel** (bottom): Terminal, output, problems
- **Status Bar** (bottom): File info, errors, Git branch

#### Important Keyboard Shortcuts:

**File Operations:**
- `Ctrl+N` (Win/Linux) or `Cmd+N` (Mac): New file
- `Ctrl+O` (Win/Linux) or `Cmd+O` (Mac): Open file
- `Ctrl+S` (Win/Linux) or `Cmd+S` (Mac): Save file
- `Ctrl+Shift+S` (Win/Linux) or `Cmd+Shift+S` (Mac): Save as

**Editing:**
- `Ctrl+Z` (Win/Linux) or `Cmd+Z` (Mac): Undo
- `Ctrl+Y` (Win/Linux) or `Cmd+Shift+Z` (Mac): Redo
- `Ctrl+F` (Win/Linux) or `Cmd+F` (Mac): Find in file
- `Ctrl+H` (Win/Linux) or `Cmd+Option+F` (Mac): Find and replace

**Navigation:**
- `Ctrl+P` (Win/Linux) or `Cmd+P` (Mac): Quick open file
- `Ctrl+Shift+P` (Win/Linux) or `Cmd+Shift+P` (Mac): Command palette
- `Ctrl+\`` (Win/Linux) or `Cmd+\`` (Mac): Toggle terminal

### Opening a Project in VS Code

#### Method 1: From VS Code
1. File → Open Folder
2. Navigate to your project folder
3. Click "Select Folder"

#### Method 2: From Terminal
```bash
cd your-project-folder
code .
```
(The `.` means "current directory")

### Basic Configuration

#### Setting Up Prettier
1. Go to File → Preferences → Settings (or `Ctrl+,`)
2. Search for "format on save"
3. Check the "Format On Save" box
4. Search for "default formatter"
5. Select "Prettier - Code formatter"

#### Customizing Your Theme
1. Go to File → Preferences → Color Theme
2. Try different themes (Dark+, Light+, etc.)
3. Pick one you like!

---

## 5. 🚀 Setting Up This Project (ETCETER4)

Now let's put everything together and get this specific project running on your computer!

### Cloning the Project

1. Open your terminal
2. Navigate to where you want the project:
```bash
cd Desktop  # or wherever you prefer
```
3. Clone the repository:
```bash
git clone https://github.com/4-b100m/etceter4.git
```
4. Go into the project folder:
```bash
cd etceter4
```

### Installing Project Dependencies

This project uses npm to manage its dependencies. Install them:

```bash
npm install
```

You might see some warnings - that's normal for older projects!

### Understanding the Project Structure

Let's explore what's in this project:

```
etceter4/
├── README.md           # Project documentation
├── package.json        # Project configuration and dependencies
├── index.html          # Main website page
├── css/               # Stylesheets
├── js/                # JavaScript files
├── img/               # Images
├── fonts/             # Font files
└── other files...     # Various other project files
```

### Running the Project

This project includes a development server. Start it with:

```bash
npm test
```

This command starts a local server that will:
- Serve your website at a local address (like `http://localhost:3000`)
- Automatically refresh the page when you make changes
- Watch for changes in HTML, CSS, and JavaScript files

### Opening in VS Code

```bash
code .
```

This opens the entire project in VS Code, where you can:
- See the file structure in the sidebar
- Edit any file
- Use the integrated terminal
- Preview your changes

---

## 6. 🔄 Basic Development Workflow

Here's the typical workflow you'll follow when working on projects:

### Daily Workflow

1. **Start your development session:**
```bash
cd your-project-folder
npm test  # or whatever command starts your local server
```

2. **Open your code editor:**
```bash
code .
```

3. **Make changes to files**
   - Edit HTML, CSS, JavaScript files
   - Save frequently (`Ctrl+S` or `Cmd+S`)

4. **Test your changes**
   - Check the browser (should auto-refresh)
   - Look for errors in the browser console (F12)

5. **Save your work with Git:**
```bash
git status                    # See what changed
git add .                     # Stage all changes
git commit -m "Describe your changes"
git push origin main          # Upload to GitHub
```

### Making Your First Change

Let's practice by making a small change to this project:

1. **Open `README.md` in VS Code**
2. **Add a line** at the end: `## My Learning Notes - [Your Name]`
3. **Save the file** (`Ctrl+S` or `Cmd+S`)
4. **Commit your changes:**
```bash
git status
git add README.md
git commit -m "Added my learning notes section to README"
git push origin main
```

### Understanding Git Status Messages

When you run `git status`, you'll see files in different states:

- **Red files**: Modified but not staged
- **Green files**: Staged and ready to commit  
- **Untracked files**: New files Git doesn't know about

---

## 7. 📚 Best Practices for Beginners

### Terminal Best Practices

1. **Always know where you are**: Use `pwd` frequently
2. **Don't delete files hastily**: Double-check before using `rm` or `del`
3. **Use tab completion**: Start typing and press Tab to auto-complete
4. **Keep your terminal organized**: Close old sessions regularly

### Git Best Practices

1. **Commit early and often**: Small, frequent commits are better than large ones
2. **Write clear commit messages**: 
   - Good: "Fix navigation menu on mobile"
   - Bad: "stuff" or "changes"
3. **Check status before committing**: Always run `git status` first
4. **Don't commit everything**: Use `.gitignore` for files you don't want to track
5. **Pull before you push**: If working with others, always pull recent changes first

### VS Code Best Practices

1. **Use the integrated terminal**: `Ctrl+\`` to toggle
2. **Learn keyboard shortcuts**: They'll save you tons of time
3. **Install useful extensions**: But don't go overboard
4. **Customize your settings**: Make the editor work for you
5. **Use the command palette**: `Ctrl+Shift+P` for quick actions

### General Development Best Practices

1. **Save frequently**: `Ctrl+S` should become muscle memory
2. **Test your changes**: Always check your work in the browser
3. **Keep learning**: Web development evolves constantly
4. **Don't be afraid to break things**: You can always undo or revert changes
5. **Google errors**: Copy error messages and search for solutions
6. **Take breaks**: Coding can be mentally intensive

---

## 8. 🔧 Troubleshooting Common Issues

### Terminal Issues

**Problem**: "Command not found"
- **Solution**: The program isn't installed or not in your PATH
- **Check**: Try `which commandname` (Mac/Linux) or `where commandname` (Windows)

**Problem**: "Permission denied"
- **Solution**: You might need administrator privileges
- **Try**: Add `sudo` before the command (Mac/Linux) or run terminal as administrator (Windows)

**Problem**: Can't find a file or folder
- **Solution**: Use `ls` or `dir` to see what's available, check your current location with `pwd`

### Git Issues

**Problem**: "Fatal: not a git repository"
- **Solution**: You're not in a Git repository folder
- **Fix**: Navigate to your project folder or run `git init` to start a new repository

**Problem**: "Your branch is ahead of origin/main"
- **Solution**: You have local commits that aren't on GitHub yet
- **Fix**: Run `git push origin main`

**Problem**: "Please tell me who you are"
- **Solution**: Git doesn't know your identity
- **Fix**: Run the git config commands from earlier in this tutorial

**Problem**: Merge conflicts
- **Solution**: This happens when Git can't automatically combine changes
- **Fix**: Open the conflicted files, look for `<<<<<<<` markers, resolve manually

### VS Code Issues

**Problem**: Extensions not working
- **Solution**: Reload VS Code or restart it
- **Try**: `Ctrl+Shift+P` then type "Reload Window"

**Problem**: Formatting not working
- **Solution**: Make sure Prettier is set as your default formatter
- **Check**: Settings → Format On Save should be enabled

**Problem**: Terminal not opening
- **Solution**: VS Code can't find your shell
- **Fix**: Check VS Code settings for terminal configuration

### Project-Specific Issues

**Problem**: `npm install` fails
- **Solution**: Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again
- **Alternative**: Make sure you have the right version of Node.js

**Problem**: "Port already in use"
- **Solution**: Another process is using the same port
- **Fix**: Kill the other process or use a different port

**Problem**: Browser shows "Cannot GET /"
- **Solution**: The server isn't running or isn't serving the right files
- **Fix**: Make sure your development server is running (`npm test`)

### Getting Help

When you're stuck:
1. **Read the error message carefully**
2. **Google the exact error message**
3. **Check Stack Overflow** - most common problems have been solved
4. **Ask on forums** like Reddit r/webdev, Discord servers, or GitHub Discussions
5. **Check documentation** for the specific tool or technology

---

## 9. 🎯 Next Steps

Congratulations! You now have the foundation for web development. Here's what to learn next:

### Immediate Next Steps

1. **Practice with this project**:
   - Make small changes to the HTML/CSS
   - Add your own content
   - Experiment with the JavaScript

2. **Learn basic HTML/CSS**:
   - HTML structure and tags
   - CSS styling and layout
   - Responsive design basics

3. **JavaScript fundamentals**:
   - Variables, functions, loops
   - DOM manipulation
   - Event handling

### Intermediate Goals

1. **Advanced Git**:
   - Branches and merging
   - Collaborative workflows
   - Pull requests

2. **Build tools**:
   - Understanding npm scripts
   - Task runners
   - Module bundlers

3. **Web development concepts**:
   - Responsive design
   - Browser developer tools
   - Performance optimization

### Learning Resources

**Free Resources:**
- [freeCodeCamp](https://freecodecamp.org) - Interactive coding lessons
- [MDN Web Docs](https://developer.mozilla.org) - Comprehensive web technology docs
- [Git Handbook](https://guides.github.com/introduction/git-handbook/) - Git learning
- [VS Code Tips](https://code.visualstudio.com/docs/getstarted/tips-and-tricks) - Editor productivity

**YouTube Channels:**
- Traversy Media
- The Net Ninja  
- freeCodeCamp

**Practice Platforms:**
- CodePen - For experimenting with front-end code
- GitHub - For hosting your projects
- Netlify/Vercel - For deploying websites

---

## 🎉 Conclusion

You've just learned the essential tools that every web developer uses daily! Remember:

- **The terminal** is your command center
- **Git and GitHub** keep your code safe and enable collaboration  
- **VS Code** is your development environment
- **npm** manages your project dependencies

These tools might feel overwhelming at first, but with practice, they'll become second nature. Every expert was once a beginner - the key is to keep practicing and building projects.

Start with small changes, commit your work frequently, and don't be afraid to experiment. The best way to learn is by doing!

Happy coding! 🚀

---

## 📖 Quick Reference

### Essential Terminal Commands
```bash
pwd                    # Where am I?
ls / dir              # What's here?
cd foldername         # Go to folder
cd ..                 # Go up one level
mkdir newfolder       # Create folder
```

### Essential Git Commands
```bash
git status            # Check status
git add .             # Stage all changes
git commit -m "msg"   # Save changes
git push origin main  # Upload to GitHub
git pull origin main  # Download from GitHub
```

### Essential VS Code Shortcuts
```bash
Ctrl+N               # New file
Ctrl+S               # Save
Ctrl+`               # Toggle terminal  
Ctrl+P               # Open file quickly
Ctrl+Shift+P         # Command palette
```

### Getting This Project Running
```bash
git clone https://github.com/4-b100m/etceter4.git
cd etceter4
npm install
npm test
code .
```

---

*This tutorial was created to help beginners get started with web development. If you found it helpful or have suggestions for improvement, please let us know!*