import { parseSoft } from "./parser.mjs"
import { Command } from "commander"
import fs from "fs"
const program = new Command()

program
  .requiredOption('-f, --file <string>')

program.parse()

const options = program.opts()
const fileName = options.file

fs.readFile(fileName, (err, data) => {
    if (err) {
        console.log(err)
    } else {
        const fullText = data.toString()
        const parsedText = parseSoft(fullText)
        fs.writeFile("output.html", parsedText, () => {
            console.log("Wrote output.html")
        })
    }
})