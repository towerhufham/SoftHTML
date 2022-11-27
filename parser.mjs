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
        // this.tag = null
        // this.areaName = null
        // this.classes = []
        // this.attributes = []
        // this.content = []
        this.children = []
    }

    // getHTML() {
    //     //classes
    //     const concatClasses = this.classes.join(" ")
    //     let classStr = ""
    //     let attributeStr = ""
    //     if (concatClasses.length > 0) {
    //         classStr = ` class="${concatClasses}"`
    //     } else {
    //         classStr = ""
    //     }
    //     //attributes
    //     if (this.attributes.length > 0) {
    //         attributeStr = " " + this.attributes.map(
    //             a => `${a[0]}="${a[1]}"`
    //         ).join(" ")
    //     } else {
    //         attributeStr = ""
    //     } 
    //     return `<${tag}${attributeStr}${classStr}>\n  ${this.content.join("\n")}\n</${tag}>\n`
    // }
}

// class ElementTree {
//     constructor(lines) {
//         this.lines = lines
//         this.rootNodes = []
//         this._parse()
//     }

//     _parse() {
//         //go through the hash block line by line and build the tree as we go
//         let currentElement = new ElementNode()
//         currentElement.parent = this.rootNodes
//         let contentMode = false
//         let indentLevel = 0

//         for (const line of this.lines) {
//             //STEP 1: check for content blocks between ***
//             if (line.startsWith("***")) {
//                 contentMode = !contentMode
//                 continue
//             }
//             if (contentMode) {
//                 currentElement.content.push(line)
//                 continue
//             }

//             //STEP 2: check indent level
//             const thisLineIndent = line.search(/\S|$/)
//             if (thisLineIndent > indentLevel) {
//                 //starting a new child
//                 //this means the current element can be finished up
//                 currentElement.parent.push(currentElement)
//                 indentLevel = thisLineIndent
//                 const parent = currentElement.children
//                 currentElement = new ElementNode()
//                 currentElement.parent = parent
//                 //todo, this line is the special first line
//                 //maybe todo shortcuts
//             } else if (thisLineIndent < indentLevel) {
//                 //finishing the current set of children
//                 currentElement.parent.push(currentElement)
//                 indentLevel = thisLineIndent
//                 currentElement = new ElementNode()
//                 //oooohhh problem, we don't know how MANY indents down this is...
//             }
//         }
//     }
// }

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

    console.log("starting loop")
    for (let i = 0; i < indents.length; i++)  {
        const line = lines[i]
        const indent = indents[i]

        console.log("line: " + line)
        
        //if empty line, element is finished
        if (indent === null) {
            console.log("null line, finishing element")

            const element = new ElementNode(elementLines)
            addToParent(element)
            elementLines = []
            //don't update lastIndent

        } else if (indent === lastIndent) {
            //if indent matches, add to list
            console.log("same indentation, adding to collected lines")
            elementLines.push(line)
        
        } else if (indent > lastIndent) {
            console.log("going in deeper")
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
            console.log("coming out from depth")
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

        console.log("possible parents: " + possibleParents)
        console.log("\n")
    }
    //finally, add whatever we were working on
    const element = new ElementNode(elementLines)
    addToParent(element)

    return tree
}

export const parseSoft = fullText => {
    const hashBlocks = parseHashBlocks(fullText)
    for (const block of hashBlocks) {
        //first line of the block shouldn't get parsed
        const blockData = block.slice(1)
        console.log(JSON.stringify(indentTree(blockData)))
    }
    return "hi lol"
}

//NEW PLAN
//1: hash blocks
//2: build node tree of indented blocks
//3: convert node tree to html
