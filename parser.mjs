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
    constructor(tag, areaName = null, classes = [], attributes = [], content = [], children = []) {
        this.tag = tag
        this.areaName = areaName
        this.classes = classes
        this.attributes = attributes
        this.content = content
        this.children = children
    }

    addChild(node) {
        this.children.push(node)
    }

    getHTML() {
        //classes
        const concatClasses = this.classes.join(" ")
        let classStr = ""
        let attributeStr = ""
        if (concatClasses.length > 0) {
            classStr = ` class="${concatClasses}"`
        } else {
            classStr = ""
        }
        //attributes
        if (this.attributes.length > 0) {
            attributeStr = " " + this.attributes.map(
                a => `${a[0]}="${a[1]}"`
            ).join(" ")
        } else {
            attributeStr = ""
        } 
        return `<${tag}${attributeStr}${classStr}>\n  ${this.content.join("\n")}\n</${tag}>\n`
    }
}

class ElementTree {
    constructor(lines) {
        this.lines = lines
        this.rootNodes = []
        this._parse()
    }

    _parse() {
        //go through the hash block line by line and build the tree as we go
        let contentMode = false

        //STEP 1: check for content
        
    }
}

export const parseSoft = fullText => {
    const hashBlocks = parseHashBlocks(fullText)
    for (const block of hashBlocks) {
        const t = new TreeNode(block)
        console.log(JSON.stringify(t))
    }
    return "hi lol"
}