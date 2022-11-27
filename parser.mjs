//process:
//pre-scan the text file for # blocks (not in content)
//create a syntax tree object
//insert the #root (explicit or implicit) elements as the root nodes
//the node objects just contain:
//  optional [area] name
//  list of semantic lines
//  list of raw content, not parsed
//  links to children
//  function to parse into html
//build the tree up with all the correct info before any actual parsing happens
//the key will be linking up all the children properly
//also let's use typescript this time

// rootNodes = []
// for each block in parseHashBlocks(fullText)
//   if root, rootNodes.push(treeNode(block))
//   else, idk it'll probably have to be a case by case basis
// generateAreaTable(rootNodes) // this will scan for all [AREAS] and return a dict of them for easy access
// generateHTML(rootNodes)

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
        const line = this.lines[0].trim()
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
            childrenStr += "  " + child.getHTML()
        }
        return `<${this.tag}${attributeStr}${classStr}>\n  ${this.content.join("\n")}${childrenStr}\n</${this.tag}>\n`
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

    //helpers
    const addToParent = ele => {
        if (lastIndent === 0) {
            tree.push(ele)
        } else {
            const rev = [...possibleParents].reverse()
            for (const [ind, par] of rev) {
                if (ind < lastIndent) {
                    par.children.push(ele)
                    break
                }
            }
        }
    }

    const removeParentsOfDepth = depth => {
        possibleParents = possibleParents.filter(p => p[0] < depth)
    }

    for (let i = 0; i < indents.length; i++)  {
        const line = lines[i]
        const indent = indents[i]
        
        //if empty line, element is finished
        if (indent === null) {
            const element = new ElementNode(elementLines)
            addToParent(element)
            elementLines = []
            //don't update lastIndent

        } else if (indent === lastIndent) {
            //if indent matches, add to list
            elementLines.push(line)
        
        } else if (indent > lastIndent) {
            //going deeper into the tree
            const element = new ElementNode(elementLines)
            elementLines = []
            //add this element
            addToParent(element)
            //make this element a potential parent of more elements
            possibleParents.push([lastIndent, element]) 
            lastIndent = indent
            elementLines.push(line)
        
        } else if (indent < lastIndent) {
            //coming out from deep in the tree
            const element = new ElementNode(elementLines)
            elementLines = []
            //add this element
            addToParent(element)
            //remove all parents of this depth and deeper
            removeParentsOfDepth(indent)
            elementLines.push(line)
            lastIndent = indent
        }
    }
    //finally, add whatever we were working on
    const element = new ElementNode(elementLines)
    addToParent(element)

    return tree
}

export const parseSoft = fullText => {
    const hashBlocks = parseHashBlocks(fullText)
    let out = ""
    for (const block of hashBlocks) {
        //first line of the block shouldn't get parsed
        const blockData = block.slice(1)
        const tree = indentTree(blockData)
        for (const rootNode of tree) {
            out += rootNode.getHTML()
        }
    }
    return out
}

//NEW PLAN
//1: hash blocks
//2: build node tree of indented blocks
//3: convert node tree to html
