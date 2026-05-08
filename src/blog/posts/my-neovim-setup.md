---
title: "How to Set Up Neovim for Rails with LazyVim"
description: "A step-by-step guide to setting up Neovim for Rails development. Covers LazyVim, lazy.nvim, the oxocarbon colorscheme, Ruby and ERB LSPs via Mason, Treesitter, vim-rails, and formatting with conform.nvim."
date: 2026-05-01
tags: ["blog", "neovim", "lazyvim", "rails", "ruby", "dotfiles"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

I write all of my code in Neovim. It runs inside Ghostty as part of [my terminal setup](/blog/how-to-set-up-a-modern-terminal-with-ghostty-zsh-and-starship/), the keybindings line up with my terminal split bindings, and the whole thing makes me feel like a wizard. I used to roll my own config from scratch, but eventually I realized I was spending to much time tinkering with it and thinking about it so I  adopted LazyVim as my base. Now my config is mostly small overrides for Rails work — LSP servers, treesitter parsers, formatters, and a handful of keymaps.

The full config lives in [github.com/AlexKeyCodes/neovim](https://github.com/AlexKeyCodes/neovim). This guide walks through the whole stack: installing Neovim, cloning the dotfiles, configuring LSPs and treesitter for Ruby and ERB, formatting with conform, and the small custom tweaks that make it mine.

## Part 1: LazyVim Does the Heavy Lifting

The whole setup is built on top of [LazyVim](https://www.lazyvim.org/) — a Neovim distribution that ships sensible defaults, a curated plugin set (telescope, which-key, snacks, mini, treesitter, lazy.nvim, Mason, conform.nvim, and dozens more), and a clean override pattern for customizing any of it. If I were starting from raw Neovim today, I'd spend a week wiring up the same stack by hand and end up with something objectively worse than what LazyVim gives you out of the box.

So my config isn't really a Neovim config — it's a thin layer on top of LazyVim. A colorscheme override, an LSP plugin file with the language servers I actually use, a couple of keymaps, and one autocmd. That's the entire scope of what's in [my repo](https://github.com/AlexKeyCodes/neovim) — everything else comes from LazyVim itself, which means I get to ride upstream's improvements without maintaining them myself.

## Part 2: Install Neovim

LazyVim requires Neovim 0.8+, but in practice you want the latest stable — newer features like Snacks.nvim's picker rely on recent Neovim APIs.

### Step 1: Install Neovim and Dependencies

**macOS:**

```bash
brew install neovim stow git curl
```

**Arch Linux:**

```bash
sudo pacman -S --needed neovim stow git curl unzip
```

**Fedora:**

```bash
sudo dnf install -y neovim stow git curl unzip
```

**Debian/Ubuntu:**

```bash
sudo apt update
sudo apt install -y neovim stow git curl unzip
```

`stow` is what we'll use to symlink the config into `~/.config/nvim`, the same way [the terminal setup](/blog/how-to-set-up-a-modern-terminal-with-ghostty-zsh-and-starship/) does.

### Step 2: Verify the Version

```bash
nvim --version | head -1
```

You want `NVIM v0.10.0` or newer. If your distro ships an older version, install Neovim from a release tarball or the [official AppImage](https://github.com/neovim/neovim/releases) instead.

## Part 3: Clone and Stow the Dotfiles

### Step 3: Back Up Any Existing Config

If you already have a `~/.config/nvim`, get it out of the way before stow runs — stow refuses to overwrite real files:

```bash
mv ~/.config/nvim ~/.config/nvim.backup.$(date +%Y%m%d-%H%M%S)
```

You probably also want to back up the data and state directories, since old plugin state can interfere with a fresh LazyVim install:

```bash
mv ~/.local/share/nvim ~/.local/share/nvim.backup
mv ~/.local/state/nvim ~/.local/state/nvim.backup
```

### Step 4: Clone the Repo

```bash
git clone https://github.com/AlexKeyCodes/neovim.git ~/dotfiles-nvim
cd ~/dotfiles-nvim
```

The repo follows the same stow-friendly layout as the terminal dotfiles — one top-level package (`nvim`) whose internal structure mirrors `$HOME`:

```
~/dotfiles-nvim/
└── nvim/
    └── .config/nvim/
        ├── init.lua
        ├── lazyvim.json
        ├── stylua.toml
        └── lua/
            ├── config/
            │   ├── autocmds.lua
            │   ├── keymaps.lua
            │   ├── lazy.lua
            │   └── options.lua
            └── plugins/
                ├── colorscheme.lua
                ├── disabled.lua
                └── lsp-config.lua
```

### Step 5: Stow It

```bash
stow -t ~ nvim
```

This creates `~/.config/nvim` as a symlink tree pointing back at the repo. Edit any file under `~/.config/nvim` and you're really editing the file in `~/dotfiles-nvim` — commit and push, and the change is captured.

## Part 4: First Launch

### Step 6: Open Neovim

```bash
nvim
```

LazyVim detects that no plugins are installed yet and bootstraps everything: it clones lazy.nvim, then walks the plugin spec and downloads each plugin in turn. Watch the install screen — it usually finishes in 30–60 seconds depending on connection speed.

When it's done, quit (`:q`) and reopen. The second launch is where you actually see how fast it is — under 100ms on a warm system.

### Step 7: Run :checkhealth

```vim
:checkhealth
```

This walks every part of the install — Lua version, LSP clients, treesitter, providers — and tells you what's missing. The most common warnings are:

- A missing Node.js — needed for several language servers and Mason tools.
- A missing `gcc`/`clang` — needed by treesitter to compile parsers.

Both are easy fixes (`brew install node`, `xcode-select --install` on macOS).

## Part 5: The Colorscheme

I rotate between three colorschemes depending on mood and time of day: [catppuccin](https://github.com/catppuccin/nvim) on the Mocha flavour (my default — it's also what Ghostty is themed with, so the editor and terminal blend into a single surface), [oxocarbon](https://github.com/nyoom-engineering/oxocarbon.nvim) (an IBM Carbon-inspired theme with a slightly cooler palette), and [tokyonight](https://github.com/folke/tokyonight.nvim) (LazyVim's default — pre-installed and gorgeous). A few extras (`kanagawa`, `dracula`, `onedark`) round out the list for when I want to try something different.

Whenever I swap Neovim colorschemes I also swap [Ghostty's theme](/blog/how-to-set-up-a-modern-terminal-with-ghostty-zsh-and-starship/) to match — Ghostty ships every popular theme out of the box, so changing `theme = catppuccin-mocha` to `theme = oxocarbon` or `theme = tokyonight` in `~/.config/ghostty/config` keeps the whole thing seamless. Editor, prompt, status line, splits, terminal background — all one palette, no jarring color edges between Neovim and the surrounding terminal.

### Step 8: The Colorscheme Plugin File

`lua/plugins/colorscheme.lua`:

```lua
return {
  -- Catppuccin (default — matches my Ghostty theme)
  {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 1000,
    opts = {
      flavour = "mocha",
      transparent_background = true,
    },
  },
  -- Oxocarbon
  {
    "nyoom-engineering/oxocarbon.nvim",
    priority = 1000,
  },
  -- One Dark
  {
    "navarasu/onedark.nvim",
    priority = 1000,
    opts = {
      style = "darker",
      transparent = true,
    },
  },
  -- Kanagawa
  {
    "rebelot/kanagawa.nvim",
    priority = 1000,
    opts = {
      transparent = true,
    },
  },
  -- Dracula
  { "Mofiqul/dracula.nvim" },

  -- Tell LazyVim which one to load by default
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "catppuccin",
    },
  },
}
```

`transparent = true` is important: combined with Ghostty's `background-opacity = 0.96` and `background-blur = true`, you get a subtle frosted look behind the editor without it ever being hard to read.

### Step 9: Patch Oxocarbon's Picker Highlights

Oxocarbon doesn't quite get along with Snacks.nvim's file picker out of the box — folder text and matched highlights end up too dim. The fix is a small autocmd in `lua/config/autocmds.lua` that overrides a handful of highlight groups whenever oxocarbon loads:

```lua
vim.api.nvim_create_autocmd("ColorScheme", {
  pattern = "oxocarbon",
  callback = function()
    local colors = {
      base09 = "#78a9ff", -- bright blue — folder text
      base04 = "#dde1e6", -- light text
      base15 = "#82cfff", -- light blue — search matches
      base10 = "#ee5396", -- hot pink — folder icons
    }

    -- Snacks picker
    vim.api.nvim_set_hl(0, "SnacksPickerDir", { fg = colors.base09, bold = true })
    vim.api.nvim_set_hl(0, "SnacksPickerFile", { fg = colors.base04 })
    vim.api.nvim_set_hl(0, "SnacksPickerMatch", { fg = colors.base15, bold = true })
    vim.api.nvim_set_hl(0, "Directory", { fg = colors.base09, bold = true })

    -- Mini icons (used by Snacks)
    vim.api.nvim_set_hl(0, "MiniIconsAzure", { fg = colors.base10 })
    vim.api.nvim_set_hl(0, "MiniIconsDirectory", { fg = colors.base10 })
    vim.api.nvim_set_hl(0, "MiniIconsFile", { fg = colors.base04 })
  end,
})
```

The `pattern = "oxocarbon"` filter means this only fires when oxocarbon loads — switch to catppuccin and the autocmd does nothing.

## Part 6: LSPs for Rails

This is where the Rails-specific work lives. `lua/plugins/lsp-config.lua` configures four language servers and tells Mason to install them.

### Step 10: Configure the LSP Servers

```lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        -- Ruby
        ruby_lsp = {
          mason = true,
          settings = {
            rubyLsp = {
              enabledFeatures = {
                "diagnostics",
                "documentHighlights",
                "documentSymbols",
                "foldingRanges",
                "formatting",
                "hover",
                "selectionRanges",
                "semanticHighlighting",
              },
            },
          },
        },
        -- HTML (handles .html.erb via the `eruby` filetype)
        html = {
          mason = true,
          filetypes = { "html", "eruby" },
          settings = {
            html = {
              format = {
                templating = true,
                wrapLineLength = 120,
                wrapAttributes = "auto",
              },
            },
          },
        },
        -- CSS / SCSS / Sass
        cssls = {
          mason = true,
          filetypes = { "css", "scss", "sass" },
        },
        -- ESLint for JS
        eslint = {
          mason = true,
          settings = {
            workingDirectories = { mode = "auto" },
            format = { enable = true },
            rules = {
              quotes = { "error", "single" },
              semi = { "error", "never" },
            },
          },
        },
      },
    },
  },
}
```

A few of these are worth calling out:

- **`ruby_lsp`** — the official Shopify-maintained Ruby language server. I disable `codeActions`, `inlayHints`, and `completion` because they each had quirks I didn't love; everything else is on.
- **HTML on `eruby`** — this is the magic that makes `.html.erb` files actually behave. The HTML LSP doesn't know about `<%= %>` tags, but registering it on the `eruby` filetype gives you HTML hover, formatting, and validation in your views without breaking ERB.
- **`eslint`** with single quotes and no semis — my JS preferences, enforced at the LSP level so the editor flags violations as you type.

### Step 11: Tell Mason What to Install

```lua
{
  "mason-org/mason.nvim",
  opts = {
    ensure_installed = {
      -- Ruby
      "ruby-lsp",
      "rubocop",
      -- Web
      "html-lsp",
      "css-lsp",
      "eslint_d",
      "prettier",
      "htmlbeautifier",
    },
  },
},
```

Mason auto-installs everything in `ensure_installed` on first launch. No more remembering to `gem install` a language server in every project — Mason handles it once, globally.

You can also run `:Mason` for an interactive UI to install/update/remove anything.

## Part 7: Treesitter

Treesitter parses code into a real syntax tree, which gives you better highlighting, folding, and indentation than the old regex-based approach. LazyVim handles installing parsers via lazy.nvim — just declare which ones you want.

### Step 12: Configure Treesitter Parsers

```lua
{
  "nvim-treesitter/nvim-treesitter",
  opts = {
    ensure_installed = {
      "ruby",
      "html",
      "embedded_template", -- ERB
      "css",
      "scss",
      "javascript",
      "json",
      "yaml",
      "bash",
      "lua",
      "vim",
      "markdown",
    },
  },
},
```

`embedded_template` is the parser you actually want for ERB — it understands the `<% %>` interpolation and hands HTML chunks to the HTML parser, so highlighting works inside both halves of the file.

## Part 8: Rails Plugins

Tim Pope's `vim-rails` and `vim-bundler` are still the gold standard for Rails work in Vim — and they translate directly to Neovim.

### Step 13: Wire Up vim-rails

```lua
{
  "tpope/vim-rails",
  ft = { "ruby", "eruby" },
  config = function()
    vim.keymap.set("n", "<leader>ra", ":A<CR>", { desc = "Rails Alternate" })
    vim.keymap.set("n", "<leader>rr", ":R<CR>", { desc = "Rails Related" })
    vim.keymap.set("n", "<leader>rm", ":Emodel<CR>", { desc = "Rails Model" })
    vim.keymap.set("n", "<leader>rc", ":Econtroller<CR>", { desc = "Rails Controller" })
    vim.keymap.set("n", "<leader>rv", ":Eview<CR>", { desc = "Rails View" })
  end,
},
{
  "tpope/vim-bundler",
  ft = { "ruby" },
},
{
  "vim-ruby/vim-ruby",
  ft = { "ruby", "eruby" },
},
```

The `ft = { "ruby", "eruby" }` lazy-loads each plugin only when a Ruby or ERB file is opened — start time stays fast even with all this Rails machinery.

The keymaps are the payoff:

- `<leader>ra` — jump to the Alternate file (model ↔ test, controller ↔ test).
- `<leader>rr` — jump to the Related file (controller → view, model → schema).
- `<leader>rm`, `<leader>rc`, `<leader>rv` — open a model, controller, or view by name.

These four bindings replace 80% of the file-jumping I'd otherwise do with telescope. Once you stop typing model paths and start hopping between alternates, Rails feels a lot smaller.

## Part 9: Formatting

[conform.nvim](https://github.com/stevearc/conform.nvim) is the formatter equivalent of Mason — one config that wraps every formatter you care about, format-on-save included.

### Step 14: Configure Conform

```lua
{
  "stevearc/conform.nvim",
  opts = {
    formatters_by_ft = {
      ruby = { "rubocop" },
      eruby = { "htmlbeautifier" },
      html = { "prettier" },
      css = { "prettier" },
      javascript = { "prettier" },
      json = { "prettier" },
    },
    formatters = {
      prettier = {
        prepend_args = {
          "--single-quote",
          "--no-semi",
          "--trailing-comma",
          "es5",
        },
      },
    },
  },
},
```

Two things to point out:

- **rubocop on Ruby, htmlbeautifier on ERB.** ERB files have to be formatted by something that understands the embedded tags — running prettier or `html-lsp` on them mangles the `<%= %>` interpolation.
- **Prettier args.** Single quotes, no semicolons, ES5 trailing commas. I'd rather hard-code these than ship a `.prettierrc` in every project.

LazyVim wires conform.nvim's format-on-save by default, so the moment you `:w` a file, the right formatter runs.

## Part 10: Custom Tweaks

A handful of small things that don't fit anywhere else but each save me a real amount of friction.

### Step 15: `dd` to Exit Insert Mode

`lua/config/keymaps.lua`:

```lua
vim.keymap.set("i", "dd", "<ESC>", { silent = true })
```

Reaching for ESC pulls my hand off the home row. Mapping `dd` in insert mode to ESC is one of the smallest changes I've made and it's the one that bothers me most when I'm in a vanilla Vim somewhere else. (Works because `dd` isn't a real word in any language I write code in, so the false positives never come up.)

### Step 16: Treat `.njk` Files as HTML

This portfolio is built with [11ty](/blog/how-to-create-a-blog-using-11ty/), which uses Nunjucks (`.njk`) templates. Out of the box Neovim has no idea what `.njk` is, so highlighting just doesn't fire. One line fixes it:

```lua
vim.filetype.add({
  extension = {
    njk = "html",
  },
}),
```

Now `.njk` files get HTML highlighting, indentation, and the HTML LSP, which is more than enough for template work.

### Step 17: Disable blink.cmp

LazyVim ships with [blink.cmp](https://github.com/Saghen/blink.cmp) as the default completion engine. I've had better luck falling back to LazyVim's pre-blink completion stack, so I disable blink in `lua/plugins/disabled.lua`:

```lua
return {
  { "blink.cmp", enabled = false },
}
```

Set `enabled = false` on any plugin in any spec to disable it without having to touch the upstream config — a great pattern for surgically removing things from a distribution like LazyVim.

## Part 11: Useful Commands

A few you'll use constantly:

| Command | What it does |
|---------|--------------|
| `:Lazy` | Plugin manager — install, update, sync, profile startup time. |
| `:LazyHealth` | LazyVim-specific health check. |
| `:checkhealth` | Neovim's full health check across providers and plugins. |
| `:Mason` | LSP / formatter / linter installer UI. |
| `<leader>ff` | Find files (Snacks picker). |
| `<leader>sg` | Live grep across the project. |
| `<leader>e` | File explorer. |
| `<leader>l` | Open `:Lazy`. |
| `<leader>cs` | Run `:checkhealth`. |
| `gd` | Go to definition (LSP). |
| `K` | Hover documentation (LSP). |

## Setup Checklist

Before you call it done:

- Neovim 0.10+ installed
- `stow` installed
- Existing `~/.config/nvim`, `~/.local/share/nvim`, `~/.local/state/nvim` backed up
- Repo cloned and `stow -t ~ nvim` ran cleanly
- First `nvim` launch finished installing plugins
- `:checkhealth` passes (or only complains about things you don't use)
- `:Mason` shows ruby-lsp, rubocop, html-lsp, css-lsp, eslint_d, prettier, htmlbeautifier installed
- Opening a `.rb` file gets diagnostics from ruby-lsp
- Opening a `.html.erb` file highlights both HTML and ERB correctly
- `:colorscheme oxocarbon` looks the way it's supposed to

The full config is at [github.com/AlexKeyCodes/neovim](https://github.com/AlexKeyCodes/neovim). Fork it, swap the colorscheme, add LSPs for whatever language you actually work in, and you'll have a Rails-grade Neovim setup running inside [your fancy new terminal](/blog/how-to-set-up-a-modern-terminal-with-ghostty-zsh-and-starship/) in well under an hour.
