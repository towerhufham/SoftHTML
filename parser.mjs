export const parseSoft = fullText => {
    const lines = fullText.split("\n")
    let result = ""
    for (const line of lines) {
        const element = line.split(" ")[0]
        const content = line.match(/ (.+)/)[1]
        result += `<${element}>${content}</${element}>\n`
    }
    return result
}