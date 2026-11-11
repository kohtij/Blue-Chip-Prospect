import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The version in the footer, worked out from the history rather than typed in.
//
// The first commit in this repository is "Shipped Version 1.0!", so the game
// has been 1.x from the beginning and every commit since is a minor release:
// 1.<commits after that one>. Nothing to remember to bump, and the number in a
// player's footer always points at an exact commit, which is the whole use of
// putting it there. The short hash rides along for the same reason.
//
// If git is not there, or this is a copy of the source with no history, both
// come back null and the footer simply leaves the version out.
const git = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null
  } catch {
    return null
  }
}

const commits = Number(git('git rev-list --count HEAD'))
const version = Number.isFinite(commits) && commits > 0 ? `1.${commits - 1}` : null
const build = git('git rev-parse --short HEAD')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __GAME_VERSION__: JSON.stringify(version),
    __GAME_BUILD__: JSON.stringify(build)
  }
})
