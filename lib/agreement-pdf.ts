import "server-only"

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function wrapText(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) return [""]

  const lines: string[] = []
  let current = ""

  for (const word of normalized.split(" ")) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines
}

/** Renders plain-text agreement content as a minimal single-font PDF (no external dependencies). */
export function createAgreementPdf(plainText: string) {
  const wrappedLines = plainText.split("\n").flatMap((line) => (line.trim() ? wrapText(line, 92) : [""]))
  const linesPerPage = 50
  const pages: string[][] = []

  for (let index = 0; index < wrappedLines.length; index += linesPerPage) {
    pages.push(wrappedLines.slice(index, index + linesPerPage))
  }

  const objects: string[] = []
  const addObject = (value: string) => {
    objects.push(value)
    return objects.length
  }

  const fontObject = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const pageObjects: number[] = []

  for (const pageLines of pages) {
    const content = [
      "BT",
      "/F1 10 Tf",
      "14 TL",
      "50 760 Td",
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET",
    ].join("\n")
    const contentObject = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
    const pageObject = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`,
    )
    pageObjects.push(pageObject)
  }

  const pagesObject = addObject(
    `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`,
  )
  const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`)

  for (const pageObject of pageObjects) {
    objects[pageObject - 1] = objects[pageObject - 1].replace("/Parent 0 0 R", `/Parent ${pagesObject} 0 R`)
  }

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Uint8Array(Buffer.from(pdf, "utf8"))
}
