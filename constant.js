const specialCharsMap = {
  '?': '？',
  '!': '！',
  '\\': '／',
  ':': '：',
  '*': '×',
  '|': ' ',
  '"': "'",
  '<': '＜',
  '>': '＞',
  '/': '／'
}

const normalMusicSuffixes = [
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.flac',
  '.ape',
  '.ogg',
  '.oga',
  '.wma'
]

const normalCompressedFileSuffixes = [
  '.rar',
  '.zip',
  '.7z',
  '.tar'
]

module.exports = {
  specialCharsMap,
  normalMusicSuffixes,
  normalCompressedFileSuffixes
}
