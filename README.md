# ETCETER4

This is the website for etceter4.com - a composer of sounds/words/images. Explore the depths of our web labyrinth.

![CI/CD Status](https://github.com/4-b100m/etceter4/workflows/CI%2FCD%20Pipeline/badge.svg)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Git** for version control

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/4-b100m/etceter4.git
   cd etceter4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   This will start a local server at `http://localhost:3000` with hot reloading enabled.

### Available Scripts

- `npm run dev` - Start development server with live reload
- `npm run lint` - Check code quality with ESLint  
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

## 🛠 Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **CSS Framework**: Tachyons for utility-first CSS
- **JavaScript Libraries**: jQuery 3.7+, Velocity.js 2.0+
- **Development**: ESLint, Prettier, Browser-sync
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages

## 📁 Project Structure

```
etceter4/
├── css/                 # Stylesheets
│   ├── styles.css      # Main styles
│   └── vendor/         # Third-party CSS
├── js/                 # JavaScript files
│   ├── main.js         # Main application logic
│   ├── page.js         # Page management
│   └── ...            # Other modules
├── img/                # Images and assets
├── ogod/              # OGOD section files
└── index.html         # Main entry point
```

## 🔧 Development Guidelines

### Code Style
- Use modern JavaScript (ES6+) features
- Prefer `const` and `let` over `var`
- Follow the configured ESLint and Prettier rules
- Use meaningful variable and function names

### CSS Architecture
- Utility-first approach with Tachyons
- Component-specific styles in `styles.css`  
- Responsive design for modern devices
- No IE8 support (modern browsers only)

### Git Workflow
- Create feature branches from `master`
- Use descriptive commit messages
- All PRs require passing CI checks
- Automatic dependency updates via Dependabot

## 🚀 Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `master` branch. The CI/CD pipeline:

1. **Linting & Formatting** - Ensures code quality
2. **Security Audit** - Checks for vulnerabilities  
3. **Deploy** - Publishes to GitHub Pages

## 🔒 Security

- **Zero known vulnerabilities** in dependencies
- Comprehensive Content Security Policy (CSP)
- Security headers (X-Frame-Options, CSP, HSTS-ready)
- Regular security audits via `npm audit`
- Dependabot for automatic dependency updates
- SRI (Subresource Integrity) hashes for all CDN resources

See [SECURITY.md](SECURITY.md) for full security documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Run tests: `npm run lint && npm run format:check`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [SECURITY.md](SECURITY.md) for security guidelines and [EDGE_CASES.md](EDGE_CASES.md) for known limitations.

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

Contact us if you see any strange things happening on the site!

---

*Modernized and updated for current web standards* ✨

## Getting Started

1. Download and install the [Node Version Manager (NVM)](https://github.com/creationix/nvm)  (you will need XCode for this if on Mac), and [git](https://www.atlassian.com/git/tutorials/install-git/mac-os-x)
2. Through NVM, download the latest long term support version of node

    ```bash
    nvm install --lts
    ```
    
3.  Set the default state of your terminal to that version of node (so you don't have to reset it every time!)

    ```bash
    # check the latest lts
    nvm current
    # use that version to make the default one
    nvm alias default 6.9.2
    ```

4. Move to the directory of the etceter4 folder using cd and ls

    ```bash
    # cd means 'change directory', move to directories using the syntax below
    cd ~/Dropbox/etceter4 
    # ls lists files in a directory, when you just type in ls, it lists the files in the current directory you're in
    ls 
    ```

5. When you get to the folder, run npm install. This will install all the programs used in the project into the node_modules folder. These programs are used as aids in development and run tasks to build the page for production (more on this later).

## Principles

- Always use classes to describe the visual style of your html. Do not style using inline CSS, and IDs.
- IDs are reserved to provide a hook to JS, and inline style is used for JS functions. 
- Only use style.css to create more small components for use within the HTML doc, and to describe the visual behavior of pseudo classes.
- Compartmentalize your JS. These will be concatenated and minified using a task runner.

### Some helpful commands

1. Remove a folder from git:

    ```bash
    # Removes it only from the git folder
    git rm -r --cached FolderName
    # Stages it
    git commit -m "Removed folder from repository"
    # Pushes changes live
    git push origin master
    ```