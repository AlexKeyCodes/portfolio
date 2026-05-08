---
title: "How to Set Up a Modern Terminal with Ghostty, Zsh, and Starship"
description: "A step-by-step guide to setting up a fast, good-looking terminal environment. Covers Ghostty, zsh with Antidote, Starship, fzf, yazi, and a stow-based dotfiles workflow — all themed with Catppuccin Mocha."
date: 2026-04-24
tags: ["blog", "terminal", "zsh", "ghostty", "starship", "dotfiles"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

I spend most of my day in a terminal, so I care a lot about how it looks and how it feels. Over the years I've cycled through iTerm2, Alacritty, Kitty, Warp, and Wezterm — and a similar list of shells, prompts, and plugin managers. The setup I've landed on is fast, looks great, and takes about ten minutes to bring up on a brand new machine. I keep all of it in a [dotfiles repo](https://github.com/AlexKeyCodes/terminal) so a fresh laptop is always one `git clone` and three `stow` commands away from feeling like home.

This guide walks through every piece of that setup: Ghostty as the terminal, zsh with Antidote as the shell and plugin manager, Starship as the prompt, fzf and yazi as search and file management, and stow for managing the dotfiles themselves. Catppuccin Mocha is the theme across all of it.

## Part 1: What This Setup Consists Of

Before installing anything, here's what each piece does and why it's in the stack.

| Tool | Role | Why |
|------|------|-----|
| [Ghostty](https://ghostty.org/) | Terminal emulator | Native, GPU-accelerated, fast, sane defaults, a config file instead of a settings UI. |
| zsh | Shell | macOS default, mature, good completion. |
| [Antidote](https://antidote.sh/) | zsh plugin manager | Faster than oh-my-zsh, plugins listed in a plain text file. |
| [Starship](https://starship.rs/) | Prompt | Cross-shell, configurable in TOML, fast, gorgeous out of the box. |
| fzf | Fuzzy finder | `Ctrl+R` history search, file pickers, used by half the tools below. |
| yazi | File manager | Vim-style TUI file manager, faster than reaching for Finder. |
| stow | Dotfile manager | Symlinks `~/.config` files into place from the dotfiles repo. |

Three zsh plugins round out the shell experience:

- `zsh-completions` — extra completion definitions for tools that don't ship their own.
- `zsh-autosuggestions` — suggests commands from history as you type, accept with `→`.
- `zsh-syntax-highlighting` — colors valid commands green and broken ones red, in real time.

The whole thing is themed with [Catppuccin Mocha](https://catppuccin.com/) — the same palette is used in Ghostty, Starship, and the autosuggestion color, so everything looks coherent.

## Part 2: Install a Nerd Font

Starship's prompt uses glyphs (folder icons, branch icons, clocks) that aren't in standard fonts. You need a [Nerd Font](https://www.nerdfonts.com/) or you'll see a lot of `□` placeholders.

### Step 1: Download FiraCode or MesloLGS

I use MesloLGS, but FiraCode is just as good. Pick one:

```bash
# FiraCode Nerd Font
wget https://github.com/ryanoasis/nerd-fonts/releases/download/v3.4.0/FiraCode.zip
unzip FiraCode.zip -d FiraCode/

# MesloLGS Nerd Font
wget https://github.com/ryanoasis/nerd-fonts/releases/download/v3.4.0/Meslo.zip
unzip Meslo.zip -d Meslo/
```

### Step 2: Install the Font

**macOS:**

```bash
cp Meslo/*.ttf ~/Library/Fonts/
rm -rf Meslo Meslo.zip
```

**Arch / Fedora:**

```bash
mkdir -p ~/.local/share/fonts
cp Meslo/*.ttf ~/.local/share/fonts/
fc-cache -fv
rm -rf Meslo Meslo.zip
```

## Part 3: Install the Tools

Everything in this stack is available from your platform's main package manager — no curl-pipe-bash installers needed.

### Step 3: Install Packages

**macOS** (Homebrew):

```bash
brew install zsh starship ghostty stow yazi ffmpeg sevenzip jq poppler fd ripgrep fzf zoxide resvg imagemagick antidote
```

**Arch Linux:**

```bash
sudo pacman -S zsh starship ghostty stow yazi ffmpeg 7zip jq poppler fd ripgrep fzf zoxide imagemagick
```

You'll need to install Antidote separately on Arch — the [Antidote docs](https://getantidote.github.io/install) cover the AUR install.

**Fedora:**

```bash
sudo dnf install zsh starship ghostty stow fzf
```

yazi isn't in the Fedora repos yet — install it from cargo or skip it for now.

The yazi dependencies (`ffmpeg`, `7zip`/`sevenzip`, `jq`, `poppler`, `fd`, `ripgrep`, `imagemagick`, `resvg`) aren't strictly required but they unlock yazi's image/PDF/archive previews. If you don't plan to use yazi, you can drop them.

## Part 4: Clone the Dotfiles

Everything past this point assumes you've cloned my [terminal repo](https://github.com/AlexKeyCodes/terminal) — or your own fork of it. The repo's structure is built for stow, where each top-level folder mirrors the structure of `$HOME`.

### Step 4: Clone the Repo

```bash
git clone https://github.com/AlexKeyCodes/terminal.git ~/dotfiles
cd ~/dotfiles
```

The layout looks like this:

```
~/dotfiles/
├── ghostty/
│   └── .config/ghostty/config
├── starship/
│   └── .config/starship.toml
└── zsh/
    ├── .aliases
    ├── .zsh_plugins.txt
    └── .zshrc
```

Each subdirectory is a "package" stow can deploy independently.

### Step 5: Stow the Configs

```bash
stow -t ~ ghostty
stow -t ~ starship
stow -t ~ zsh
```

`stow -t ~` tells stow to symlink the contents of each package into `$HOME`. After running these, you'll have:

- `~/.config/ghostty/config` → `~/dotfiles/ghostty/.config/ghostty/config`
- `~/.config/starship.toml` → `~/dotfiles/starship/.config/starship.toml`
- `~/.aliases` and `~/.zsh_plugins.txt` → corresponding files in `~/dotfiles/zsh/`

**Important**: stow will refuse to overwrite existing files. If you already have a `~/.aliases` or `~/.config/ghostty/config`, back it up or remove it first — otherwise stow errors out and does nothing.

**Note on `.zshrc`**: I deliberately don't stow `.zshrc`. The file in the repo is a reference, not a config to deploy. zshrc gets too personal and machine-specific (Ruby version managers, NVM paths, work-only env vars) for a one-size-fits-all symlink to be safe. Copy what you want from it instead.

## Part 5: Configure Zsh

zsh is the macOS default, but you may need to flip it on for your user — and it needs to know about Antidote and Starship.

### Step 6: Set Zsh as Your Default Shell

```bash
chsh -s $(which zsh)
```

Open a new terminal window for the change to take effect.

### Step 7: Set Up Your `.zshrc`

Here's a minimal `.zshrc` with everything wired together — Antidote loads plugins, Starship initializes the prompt, and aliases get sourced last:

```bash
# Basic zsh configuration
autoload -Uz compinit
compinit

# History settings
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
setopt SHARE_HISTORY
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE

# Initialize antidote (macOS Homebrew path)
source $(brew --prefix)/share/antidote/antidote.zsh
antidote load

# Load Starship
eval "$(starship init zsh)"

# Load aliases
if [[ -f ~/.aliases ]]; then
    source ~/.aliases
fi

# Catppuccin color for zsh-autosuggestions
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=#585b70'
```

Save it as `~/.zshrc` and reload:

```bash
source ~/.zshrc
```

The `antidote load` line reads `~/.zsh_plugins.txt` (which stow already symlinked) and loads each plugin. The `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE` line keeps the autosuggestions in the muted Catppuccin "overlay" gray, so they don't fight with your real input visually.

### Step 8: Manage Plugins with Antidote

`~/.zsh_plugins.txt` is the source of truth for what plugins are loaded:

```text
# Completions - load first
zsh-users/zsh-completions

# Autosuggestions
zsh-users/zsh-autosuggestions

# Syntax highlighting - load last for best performance
zsh-users/zsh-syntax-highlighting

# Optional: Colored man pages
ohmyzsh/ohmyzsh path:plugins/colored-man-pages
```

To add or remove a plugin, edit this file and run:

```bash
antidote install
```

That's it — no `git submodule`, no manual `source` lines in `.zshrc`, no `~/.oh-my-zsh` directory ballooning to 500MB.

## Part 6: Configure Starship

Starship reads `~/.config/starship.toml`, which stow already linked from the dotfiles. Open a new terminal and you should see the two-line prompt:

```
╭──🕖 18:42─📁 ~/Work/portfolio─ main
╰─❯
```

The prompt is built from a few segments — time, directory, git branch, git status — each rendered as a small "pill" with a colored icon and label. The prompt body sits on its own line below, so you always have full width to type into.

### Step 9: Customize the Format

The full format is in `~/.config/starship.toml`:

```toml
format = """
[╭](fg:current_line)\
$time\
$directory\
$git_branch\
$git_status\
$line_break\
$character\
"""
```

The order of segments here is the order they appear, left to right. Drop a segment by deleting its `$variable`, or add new ones from the [Starship docs](https://starship.rs/config/) — `$nodejs`, `$rust`, `$python`, `$kubernetes`, etc. all just work.

### Step 10: Theme Customization

The Catppuccin Mocha palette is defined inline so I'm not depending on an external theme file:

```toml
palette = 'catppuccin_mocha'

[palettes.catppuccin_mocha]
foreground = '#D9E0EE'
background = '#1E1E2E'
current_line = '#2E2E3E'
primary = '#313244'
box = '#2E2E3E'
blue = '#8AADF4'
cyan = '#76E3F6'
green = '#A6E3A1'
orange = '#F9AF74'
pink = '#F5BDE6'
purple = '#CBA6F7'
red = '#F38BA8'
yellow = '#F9E2AF'
```

Every segment then references these names rather than raw hex codes — change a color in one place and the whole prompt updates.

## Part 7: Configure Ghostty

Ghostty is configured with a single plain-text file at `~/.config/ghostty/config`. No JSON, no UI, no profiles dialog. Reload by quitting and reopening, or `Ctrl+Shift+R` from inside Ghostty.

### Step 11: The Base Config

The full config lives in the dotfiles repo, but here are the parts worth understanding:

```bash
# Font
font-family = "MesloLGS Nerd Font Mono"
font-size = 18

# Theme
theme = catppuccin-mocha
background = #1b1b26
background-blur = true
background-opacity = 0.96

# Window
window-padding-x = 8
window-padding-y = 8
window-decoration = none

# Shell integration
shell-integration = zsh
shell-integration-features = cursor,sudo,title

# Cursor
cursor-style = block
cursor-style-blink = true

# UX
confirm-close-surface = false
copy-on-select = true
```

A few of these are worth calling out:

- `background-blur` and `background-opacity = 0.96` give a subtle frosted look without making text hard to read.
- `window-decoration = none` drops the title bar — it's just text and a cursor.
- `copy-on-select = true` is the single most useful setting in any terminal. Highlight, paste, done.
- `shell-integration = zsh` enables Ghostty's prompt-aware features (`Ctrl+Up`/`Ctrl+Down` to jump between previous prompts, etc.).

### Step 12: Vim-Motion Split Keybindings

The thing I miss most when I'm in someone else's terminal is splits I can navigate with vim motions. Ghostty makes this trivial:

```bash
# Create splits (vim motions)
keybind = ctrl+shift+l=new_split:right
keybind = ctrl+shift+j=new_split:down
keybind = ctrl+shift+h=new_split:left
keybind = ctrl+shift+k=new_split:up

# Navigate between splits
keybind = ctrl+h=goto_split:left
keybind = ctrl+l=goto_split:right
keybind = ctrl+j=goto_split:down
keybind = ctrl+k=goto_split:up

# Resize splits
keybind = ctrl+alt+h=resize_split:left,15
keybind = ctrl+alt+j=resize_split:down,15
keybind = ctrl+alt+k=resize_split:up,15
keybind = ctrl+alt+l=resize_split:right,15

# Close current split
keybind = ctrl+shift+w=close_surface

# Fullscreen toggle
keybind = ctrl+shift+f=toggle_fullscreen
```

The pattern matches my Neovim split bindings exactly: `ctrl+h/j/k/l` to move, `ctrl+shift+h/j/k/l` to create, `ctrl+alt+h/j/k/l` to resize. Same fingers, same direction, in either app.

## Part 8: Aliases

The `.aliases` file is sourced by `.zshrc` at the end. It's where the most personal customization happens — git shortcuts, project paths, SSH connections, and language-specific shortcuts.

### Step 13: Customize `~/.aliases`

Here's the starter set from the repo, with some annotations:

```bash
# Git shortcuts
alias gb='git --no-pager branch'
alias ga='git add'
alias gaa='git add --all'
alias gco='git checkout'
alias gplo='git pull origin'
alias gpso='git push origin'
alias gcmsg='git commit -m'
alias gst='git status'
alias gf='git fetch'

# Project navigation
alias dir='cd ~/path/to/directory'

# SSH connections
alias sshex='ssh user@example.com'

# Development shortcuts
alias ber='bundle exec rails'
alias br='bin/rails'
alias bspec="bin/rspec"

# zsh
alias zshconf='nvim ~/.zshrc'
alias zshres='source ~/.zshrc'
```

**Important**: The `dir` and `sshex` aliases in the repo are placeholders. Replace them with your actual project paths and server connections, or remove them — they're there as examples of the shape, not as working aliases.

The `zshconf` / `zshres` pair is small but pays off every day: edit zshrc, reload it, no new terminal needed.

## Part 9: fzf and yazi

These two tools don't need much configuration to be useful — they pay off the moment they're installed.

### fzf

After `brew install fzf`, run:

```bash
$(brew --prefix)/opt/fzf/install
```

This adds key bindings to `.zshrc`. The big ones:

- `Ctrl+R` — fuzzy search through shell history. Throw away `Ctrl+R`'s vanilla "back through history one match at a time" behavior; once you've used fzf's version you can't go back.
- `Ctrl+T` — fuzzy file picker, inserts the chosen path at the cursor.
- `Alt+C` — fuzzy directory picker, `cd`s into the choice.

### yazi

yazi is a TUI file manager. Launch with `yazi` (or alias it to something shorter). Vim motions move the cursor, `Enter` opens, `q` quits. With the dependencies installed earlier (`ffmpeg`, `poppler`, `imagemagick`, `resvg`) it'll show inline previews of images, videos, PDFs, and SVGs in the right pane.

The killer feature: when you quit, yazi can `cd` your shell into the last directory you were browsing. Add this to `.zshrc`:

```bash
function y() {
    local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
    yazi "$@" --cwd-file="$tmp"
    if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
        builtin cd -- "$cwd"
    fi
    rm -f -- "$tmp"
}
```

Now `y` opens yazi, and quitting with `q` drops you back in the shell at whatever directory you ended up in. This is the closest a terminal gets to a "Reveal in Finder, then jump there in shell" workflow.

## Part 10: Verifying the Setup

Open a new terminal and check each piece:

```bash
# Starship is rendering glyphs (not boxes)?
echo "$STARSHIP_SHELL"

# Antidote loaded plugins?
antidote list

# Aliases sourced?
alias gst

# Ghostty shell integration active?
echo "$TERM_PROGRAM"  # should print: ghostty
```

If any of those come back empty or wrong, the most likely cause is `.zshrc` not being sourced — open a brand-new terminal window (not a new tab) and try again.

## Setup Checklist

Before you call it done:

- Nerd Font installed (FiraCode or MesloLGS)
- All packages installed via brew/pacman/dnf
- Dotfiles cloned to `~/dotfiles`
- `stow -t ~ ghostty starship zsh` run successfully
- `~/.zshrc` written and sourced (Antidote, Starship, aliases all loading)
- `chsh -s $(which zsh)` run if zsh isn't your default shell
- Ghostty showing two-line Catppuccin prompt with glyphs
- `gst`, `gco`, and other aliases work
- `Ctrl+R` opens fzf history search

If you want to fork the dotfiles and make them your own, the source for everything in this post is at [github.com/AlexKeyCodes/terminal](https://github.com/AlexKeyCodes/terminal). Clone it, swap the aliases, tweak the Starship segments, change the Ghostty colors — and then your next new machine is ten minutes from feeling like home too.
