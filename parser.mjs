const formatClasses = classes => {
    //split and rejoin to ensure they look ok
    const classesStr = classes.join(" ")
    return `class="${classesStr}"`
}

const formatAttributes = attributes => {
    return attributes.map(a => `${a[0]}="${a[1]}"`).join(" ")
}

const formatElement = (tag, classes, attributes, content) => {
    return `<${tag} ${formatAttributes(attributes)} ${formatClasses(classes)}>${content}</${tag}>\n`
}

export const parseSoft = fullText => {
    const lines = fullText.split("\n")
    let result = ""
    for (const line of lines) {
        const tag = line.split(" ")[0]
        const content = line.match(/ (.+)/)[1]
        result += formatElement(
            tag, 
            ["bg-blue-500", "py-4"], 
            [["id", "cool"], ["x-text", "var"]],
            content
        )
    }
    return result
}