const formatClasses = classes => {
    //split and rejoin to ensure they look ok
    const classesStr = classes.join(" ")
    if (classesStr.length > 0) {
        return ` class="${classesStr}"`
    } else {
        return ""
    }
}

const formatAttributes = attributes => {
    if (attributes.length > 0) {
        return " " + attributes.map(a => `${a[0]}="${a[1]}"`).join(" ")
    } else {
        return ""
    } 
}

const formatElement = (tag, classes, attributes, content) => {
    return `<${tag}${formatAttributes(attributes)}${formatClasses(classes)}>\n  ${content}\n</${tag}>\n`
}

const getIndentedLines = text => {
    const lines = text.split(/\n/)
    const indented = []
    let spaces = null
    for (const line of lines) {
        if (/^ +.+/.test(line)) {
            //indented by at least 1 space
            if (spaces === null) {
                spaces = line.match(/^ +/)[0].length
            }
            if (spaces) {
                const unindent = line.slice(spaces)
                indented.push(unindent)
            }
        }
    }
    return indented.join("\n")
}

const parseElement = elementText => {
    const lines = elementText.split("\n")
    let result = ""
    let tag = ""
    let classes = []
    let attributes = []
    let content = ""
    //first, check if we have an inner element to append to content
    const indented = getIndentedLines(elementText)
    if (indented.length > 0) {
        let innerElement = parseElement(indented)
        //make it pretty
        //remove trailing newline
        innerElement = innerElement.replace(/\n$/, "")
        //add 2 spaces before every indent
        innerElement = innerElement.replaceAll(/\n/g, "\n  ")
        content = innerElement
    }
    for (const line of lines) {
        //if we haven't found a tag, first thing is the tag
        if (tag == "") {
            tag = line.match(/(\S+)( \S+)?/)[1]
            const contentMatch = line.match(/ (.+)/)
            if (contentMatch) content = contentMatch[1]
        } else {
            //element has been started
            //empty line finishes element
            if (/^\s*.?$/.test(line)) {
                result += formatElement(tag, classes, attributes, content)
                return result
            } else if (/\s*\@/.test(line)) {
                //attributes start with @
                const matches = line.match(/\@(\S+) (.*)/)
                const name = matches[1]
                //todo: real support for boolean attributes
                const val = matches[2] ? matches[2] : ""
                attributes.push([name, val])
            } else if (/^\S/.test(line)) {
                //anything else but whitespace, treat as classes
                classes.push(line.trim())
            }
        }
    }
    //if we were still working on an element when EOF is hit, finish it up
    result += formatElement(tag, classes, attributes, content)
    return result
}

export const parseSoft = fullText => {
    const elements = fullText.split(/\n\s*\n/)
    let result = ""
    for (const element of elements) {
        result += parseElement(element)
    }
    return result
}