import pretty from "pretty"

const parseHashBlocks = fullText => {
    //if the first line doesn't start with a #, it's an implicit #root at the top
    if (fullText[0] !== "#") {
        fullText = "#root\n" + fullText
    }
    //break into lines, removing unused "\r" chars
    const lines = fullText.replaceAll("\r", "").split("\n")
    let blocks = []
    let currentBlock = []
    for (const line of lines) {
        //if it starts with a #
        if (line.startsWith("#")) {
            //start new block
            if (currentBlock.length > 0) {
                //if we're working on a block, push to the list
                blocks.push([...currentBlock])
                currentBlock = []
            }
        }
        //add line to current block
        currentBlock.push(line)
    }
    //finish block
    blocks.push([...currentBlock])
    return blocks
}

class ElementNode {
    constructor(lines) {
        this.lines = lines
        this.tag = null
        this.areaName = null
        this.classes = []
        this.attributes = []
        this.content = []
        this.children = []
        this._parse()
    }

    _parse() {
        //first line is special
        this._parseFirstLine()
        //regular proceeding lines
        let contentMode = false
        for (const rawLine of this.lines.slice(1)) {
            const line = rawLine.trim()
            
            //check for content
            if (line.startsWith("***")) {
                contentMode = !contentMode
                continue

            } else if (contentMode) {
                this.content.push(line)
            
            } else if (line.startsWith("@")) {
                //attributes start with @
                const matches = line.match(/\@(\S+) (.*)/)
                const name = matches[1]
                //todo: real support for boolean attributes
                const val = matches[2] ? matches[2] : ""
                this.attributes.push([name, val])

            } else if (/^\S/.test(line)) {
                //anything else but whitespace, treat as classes
                this.classes.push(line.trim())
            }
        }
    }

    _parseFirstLine() {
        const rawLine = this.lines[0].trim()
        let line = ""
        //check for area tag
        if (rawLine.startsWith("[")) {
            this.areaName = rawLine.match(/^\[([\w\d]+)\]/)[1]
            line = rawLine.slice(this.areaName.length + 3)
        } else {
            line = rawLine
        }
        //get element tag
        this.tag = line.match(/([\w\d]+)( \S+)?/)[1]
        //shortcuts
        if (/\S+ ?\./.test(line)) {
            //tag .class
            this.classes.push(line.match(/\S+ ?\.(.+)/)[1])
        
        } else if (/\S+ ?\@\S+/.test(line)) {
            //tag @attribute value
            const matches = line.match(/\S+ ?\@(\S+) (\S+)/)
            this.attributes.push([
                matches[1],
                matches[2]
            ])
        
        } else {
            //anything else is content
            const contentMatch = line.match(/ (.+)/)
            if (contentMatch) this.content.push(contentMatch[1])
        }
    }

    getHTML() {
        //classes
        const concatClasses = this.classes.join(" ")
        let classStr = ""
        if (concatClasses.length > 0) {
            classStr = ` class="${concatClasses}"`
        } else {
            classStr = ""
        }
        //attributes
        let attributeStr = ""
        if (this.attributes.length > 0) {
            attributeStr = " " + this.attributes.map(
                a => `${a[0]}="${a[1]}"`
            ).join(" ")
        } else {
            attributeStr = ""
        } 
        //children
        let childrenStr = ""
        for (const child of this.children) {
            childrenStr += child.getHTML()
        }
        return `<${this.tag}${attributeStr}${classStr}>${this.content.join("\n")}${childrenStr}</${this.tag}>`
    }
}

const indentTree = lines => {
    //build indent list
    let indents = []
    for (const line of lines) {
        if (!/\S/.test(line)) {
            //if it's an empty line, push null
            indents.push(null)
        } else {
            //otherwise, push the number of indents
            indents.push(line.search(/\S|$/))
        }
    }

    //make tree
    let tree = []
    let lastIndent = 0
    let elementLines = []
    let possibleParents = [] //like [[0, root], [4, div]]
    let lastLineNull = false

    //helpers
    const addToParent = () => {
        //checks
        if (elementLines.length === 0) return null
        if (!/\S/.test(elementLines[0])) return null

        const element = new ElementNode(elementLines)
        elementLines = []
        if (lastIndent === 0) {
            tree.push(element)
        } else {
            const rev = [...possibleParents].reverse()
            for (const [ind, par] of rev) {
                if (ind < lastIndent) {
                    par.children.push(element)
                    break
                }
            }
        }
        return element
    }

    const removeParentsOfDepth = depth => {
        possibleParents = possibleParents.filter(p => p[0] < depth)
    }

    for (let i = 0; i < indents.length; i++)  {
        const line = lines[i]
        const indent = indents[i]
        
        //if empty line, element is finished
        if (indent === null) {
            lastLineNull = true
            continue
            // addToParent()
            //don't update lastIndent or add this line

        } else if (indent === lastIndent) {
            //if we came from a null line, finish it up
            if (lastLineNull) {
                addToParent()
            }
            //if indent matches, add to list
            elementLines.push(line)
        
        } else if (indent > lastIndent) {
            //going deeper into the tree
            //make this element a potential parent of more elements
            const element = addToParent()
            possibleParents.push([lastIndent, element]) 

            lastIndent = indent
            elementLines.push(line)
        
        } else if (indent < lastIndent) {
            //coming out from deep in the tree
            //remove all parents of this depth and deeper
            addToParent()
            removeParentsOfDepth(indent)

            lastIndent = indent
            elementLines.push(line)
        }

        //this is skipped if it actually was a null line
        lastLineNull = false
    }
    //finally, add whatever we were working on, if extant
    addToParent()
    return tree
}

export const parseSoft = fullText => {
    const hashBlocks = parseHashBlocks(fullText)
    let out = ""
    let root = null

    const insertChildTree = (parentTree, area, childTree) => {
        if (typeof parentTree.children === "undefined") return
        for (const node of parentTree.children) {
            if (node.areaName === area) {
                for (const subNode of childTree) {
                    node.children.push(subNode)
                }
            } else {
                insertChildTree(node, area, childTree)
            }
        }
    }

    for (const block of hashBlocks) {
        //first line of the block shouldn't get parsed
        const blockData = block.slice(1)
        //#root
        if (block[0].startsWith("#root")) {
            root = indentTree(blockData)
        }
        //#in
        if (block[0].startsWith("#in")) {
            const childTree = indentTree(blockData)
            const area = block[0].match(/\[([\w\d]+)\]/)[1]
            for (const rootNode of root) {
                insertChildTree(rootNode, area, childTree)
            }
        }
    }
    for (const rootNode of root) {
        out += rootNode.getHTML()
    }

    return pretty(out)
}


//TODO:
//boolean attributes
//#file
//mixing text content and elements
//markdown integration
//self closing tags
//#apply selector
//(stuff to apply)
//#template, used as components / in markdown maybe
//extensive tests