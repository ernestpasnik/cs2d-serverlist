const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const baseDir = path.join('public', 'cs2d')
const folderRegex = /^[a-z0-9]{5}_[a-z0-9]{8}$/i

const mapsDestDir = path.join(baseDir, 'maps')
const tilesDestDir = path.join(baseDir, 'gfx', 'tiles')

const maps = {}
const tiles = {}

function sha256FileSync(filePath) {
  const fileBuffer = fs.readFileSync(filePath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function findMapsAndTiles() {
  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true })

    const matchedDirs = entries
      .filter(e => e.isDirectory() && folderRegex.test(e.name))
      .map(e => e.name)

    matchedDirs.forEach(dirName => {
      const currentDir = path.join(baseDir, dirName)

      // .map files
      const filesInCurrentDir = fs.readdirSync(currentDir, { withFileTypes: true })
      filesInCurrentDir.forEach(f => {
        if (f.isFile() && f.name.endsWith('.map')) {
          const fullPath = path.join(currentDir, f.name)
          const hash = sha256FileSync(fullPath)
          if (!maps[dirName]) maps[dirName] = {}
          maps[dirName][f.name] = { fullPath, sha256: hash }
        }
      })

      // tiles files
      const tilesDir = path.join(currentDir, 'tiles')
      if (fs.existsSync(tilesDir) && fs.statSync(tilesDir).isDirectory()) {
        const tilesFiles = fs.readdirSync(tilesDir, { withFileTypes: true })
        tilesFiles.forEach(f => {
          if (f.isFile()) {
            const fullPath = path.join(tilesDir, f.name)
            const hash = sha256FileSync(fullPath)
            if (!tiles[dirName]) tiles[dirName] = {}
            tiles[dirName][f.name] = { fullPath, sha256: hash }
          }
        })
      }
    })
  } catch (err) {
    console.error('Error:', err)
  }
}

function copyFiles(filesObj, destDir) {
  ensureDirExists(destDir)

  for (const folder in filesObj) {
    for (const filename in filesObj[folder]) {
      const fileInfo = filesObj[folder][filename]
      const destPath = path.join(destDir, filename)

      try {
        fs.copyFileSync(fileInfo.fullPath, destPath)
        console.log(`Copied ${fileInfo.fullPath} -> ${destPath}`)
      } catch (err) {
        console.error(`Failed to copy ${fileInfo.fullPath} to ${destPath}:`, err)
      }
    }
  }
}

findMapsAndTiles()

copyFiles(maps, mapsDestDir)
copyFiles(tiles, tilesDestDir)
