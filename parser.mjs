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
// 
// class treeNode
//   constructor(lines)
//      sort lines into the categories below
//   name: string?
//   semanticLines: string[] = []
//   content: string[] = []
//   children: treeNode[] = []
//   generateHTML(areaTable): dict(string: treeNode) -> string
//      this is basically the regular parser logic I have
//      need a way to check for recursion eventually