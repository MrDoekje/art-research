import axiod from "https://deno.land/x/axiod/mod.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { parseArgs } from "jsr:@std/cli/parse-args"

interface Art {
  title: string
  artist: string
  date?: string
  style?: string[]
  image?: string
}

const scrapeArt = async (url: string): Promise<Art> => {
  const response = await axiod.get(url)
  const html = response.data

  const $ = cheerio.load(html)

  const title = $("h1").text().split("\n")[0]
  const artist = $("h2").text()
  const dictionaryValues = $("article > ul > li")
    .map((_, el) => {
      const key = $(el).find("s").text().replace(":", "").toLocaleLowerCase()
      const value = $(el).find("span").text()

      return { key, value }
    })
    .toArray()

  const date = dictionaryValues
    .find((item) => item.key === "date")
    ?.value.split(";")[0]
    .replaceAll("c.", "")
  const style = dictionaryValues
    .find((item) => item.key === "style")
    ?.value.replaceAll("\n", "")
    .toLowerCase()
    .replaceAll(" ", "")
    .split(";")

  const image = $("img[itemprop='image']").attr("src")?.split("!")[0]

  return {
    title,
    artist,
    date,
    style,
    image,
  }
}

const toMarkDown = (art: Art, source: string) => {
  return `---
artist: ${art.artist}
date: ${art.date}
style: ${art?.style?.map((style: string) => `\n - ${style}`) || "Unknown"}
tags: ${art?.style?.map((style: string) => `\n - ${style}`)} \n - ${art.artist.replaceAll(" ", "-").toLocaleLowerCase()}
image: ${art.image}
source: '${source}'
---
---
![](${art.image})
`
}

const saveToFile = async (markdown: string, title: string) => {
  await Deno.writeTextFile(`../content/art/${title}.md`, markdown)
}

const simpleHash = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
  }
  // Convert to 32bit unsigned integer in base 36 and pad with "0" to ensure length is 7.
  return (hash >>> 0).toString(36).padStart(7, "0")
}

async function main(url: string) {
  const art = await scrapeArt(url)
  const markdown = toMarkDown(art, url)

  await saveToFile(markdown, `${art.title} ${art.artist} ${art.date} ${simpleHash(art.title)}`)
  console.log(`${markdown} saved as ${art.title} ${art.date}`)
}

const flags = parseArgs(Deno.args, {
  // boolean: ["help", "color"],
  string: ["url"],
  // default: { color: true },
  // negatable: ["color"],
})

if (!flags.url) {
  console.log(
    "Please provide a url e.g. --url https://www.wikiart.org/en/georges-braque/musical-instruments-1908",
  )
  Deno.exit(1)
}

main(flags.url)

// https://www.wikiart.org/en/georges-braque/musical-instruments-1908
