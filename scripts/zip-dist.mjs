// Packs dist/ into firetech-hostinger.zip (no dependencies) for upload via hPanel File Manager → Extract.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join, relative, sep } from 'path'
import { deflateRawSync } from 'zlib'

const root = join(import.meta.dirname, '..')
const dist = join(root, 'dist')
const out = join(root, 'firetech-hostinger.zip')
const table = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))

const locals = []
const central = []
let offset = 0
for (const file of walk(dist)) {
  const name = Buffer.from(relative(dist, file).split(sep).join('/'))
  const data = readFileSync(file)
  const comp = deflateRawSync(data, { level: 9 })
  const crc = crc32(data)
  const h = Buffer.alloc(30)
  h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8)
  h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26)
  locals.push(h, name, comp)
  const c = Buffer.alloc(46)
  c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10)
  c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28)
  c.writeUInt32LE(offset, 42)
  central.push(c, name)
  offset += h.length + name.length + comp.length
}
const cd = Buffer.concat(central)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10)
end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16)
writeFileSync(out, Buffer.concat([...locals, cd, end]))
console.log(`firetech-hostinger.zip: ${central.length / 2} files, ${Math.round(statSync(out).size / 1024)} KB`)
