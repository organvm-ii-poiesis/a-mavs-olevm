# ETCETER4
This is the build for etceter4.com. Contact us if you see any strange things happening on the site!

## For Beginners

**New to web development?** We've got you covered with comprehensive learning materials:
- ✅ [Setup Checklist](SETUP_CHECKLIST.md) - Make sure everything is installed correctly
- 📚 [Complete Beginner's Tutorial](BEGINNER_TUTORIAL.md) - Learn Terminal, Git, GitHub, VS Code, and more
- 🚀 [Quick Start Guide](QUICK_START.md) - Get running in 5 minutes
- 📊 [Visual Guides](docs/VISUAL_GUIDES.md) - Diagrams and visual references

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