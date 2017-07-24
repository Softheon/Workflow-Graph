import { Injectable } from '@angular/core';

@Injectable()
export class WorkflowGraphService {
    // returns an object representing a graph in the form { parentId: [array of childrenIDs], etc}
    getGraph(edges) : any {
        let graph : any = {};
        let edge : any, startNode : number, endNode : number;
        for (var i = 0; i < edges.length; i++) {
            edge = edges[i];
            startNode = edge.source;
            endNode = edge.end;
            if (!graph.hasOwnProperty(startNode)) {
                graph[startNode] = [];
            }
            graph[startNode].push(endNode);
        }
        console.log("graph", graph)
        return graph;
    }

    // returns an object in the form { id: depth, etc }
    getDepths(nodes, graph : any, startNode : number) : any {
        if (!graph || !startNode) return null;
        let currentNode : number = startNode;
        let queue : number[] = [startNode];
        let depths : any = {};
        let currentDepth : number = 0;
        let leftInLevel : number = 1;
        let nextLeftInLevel : number = 0;
        let children : number[], child : number;

        // doing a BFS to find the depths of the nodes in the graph
        while (queue) {
            currentNode = queue.shift();
            children = graph[currentNode];
            depths[currentNode] = currentDepth;

            // check if you're done
            if (!children) { break; }

            for (let i = 0; i < children.length; i++) {
                child = children[i]
                if (!depths.hasOwnProperty(child) && !queue.includes(child))
                    nextLeftInLevel++;
                if (!depths.hasOwnProperty(child) && !queue.includes(child)) {
                    queue.push(child);
                }
            }
            leftInLevel--;

            if (leftInLevel === 0) { // moving onto the next level
                currentDepth++;
                leftInLevel = nextLeftInLevel;
                nextLeftInLevel = 0;
            }
        }
        for (var node of nodes) {
            if (!depths[node.id])
                depths[node.id] = 0;
        }
        return depths;
    }

    // returns an object in the form { level index: [ids of the nodes in that level], etc }
    getNodesByLevel(depths : any) : any {
        let levels : any = {};
        for (let node in depths) {
            if (levels[depths[node]]) {
                levels[depths[node]]++;
            }
            else {
                levels[depths[node]] = 1;
            }
        }
        return levels;
    }

    findNode(nodes, node) {
        let thisNode = nodes.find(thisNode => { return thisNode.id === parseInt(node); });
        return thisNode;
    }

    // returns an object in the form {id: {id: _, name: _, url: _, x: _, y: _}, etc}
    getNodeInfo(depths: any, levelCounts:any, sideMargin: number, nodeMargin: number, 
        rectWidth: number, windowHeight: number, nodes, urls: any) {
        let nodeInfo = [];
        let levelPositions = {};
        let getX = (level) => { return sideMargin + level * (rectWidth + nodeMargin); }
        let getY = (level) => { return windowHeight / (level + 1); }

        for (let node in depths) {
            let depth = depths[node];
            let y = getY(levelCounts[depth]);
            if (!levelPositions[depth]) levelPositions[depth] = 0;
            levelPositions[depth] += y;

            let currentNode = this.findNode(nodes, node);
            let thisUrl = null;
            // let thisUrl = (currentNode.url) ? currentNode.url : urls(node);

            let newNode = currentNode;
            newNode.id = node;
            newNode.x = getX(depth);
            newNode.y = levelPositions[depth];
            nodeInfo.push(newNode);
           // nodeInfo[node].url = thisUrl;
        }
        return nodeInfo;
    }


    // returns the starting and endidng coordinates of the edges as an array of objects: 
    // [{ bend: isBending, x1:_, y1:_, x2:_, y2:_ }, etc ]
    getArrowCoordinates(edges, nodeInfo : any[], rectWidth : number, rectHeight : number, windowHeight : number) : any[] {
        let arrowCoordinates : any[] = [];
        let straightArrows = false;
        for (let i = 0; i < edges.length; i++) {
            let sourceId : number = edges[i].source;
            let source = nodeInfo.find(thisNode => { return parseInt(thisNode.id) === sourceId; });
            // let source = this.findNode(nodeInfo, sourceId).id;
            let endId : number = edges[i].end;
            let end = nodeInfo.find(thisNode => { return parseInt(thisNode.id) === endId; });
            let x1 : number = source.x;
            let y1 : number = source.y;
            let x2 : number = end.x;
            let y2 : number = end.y;

            if (straightArrows) {
                arrowCoordinates.push({
                    bend: false,
                    x1: x1 + rectWidth,
                    y1: y1,
                    x2: x2 - 7,
                    y2: y2
                })
            } else {
                // Taking care of the different cases for arrow directions
                // The directions correspond to the area in a circle that the arrow would be in on a compass
                // ex: 
                //    --->
                //    |
                // would be on the northwest area of a compass, so its direction is NW

                if (y1 === y2) { // going straight right
                    arrowCoordinates.push({
                        bend: false,
                        x1: x1 + rectWidth,
                        y1: y1,
                        x2: x2 - 7,
                        y2: y2
                    })
                } else if (y1 < y2) { 
                    if (y1 === windowHeight / 2) { // SW
                        arrowCoordinates.push({
                            bend: true,
                            direction: "SW",
                            x1: x1 + rectWidth / 2 + 5,
                            y1: y1 + rectHeight / 2,
                            x2: x1 + rectWidth / 2 + 5,
                            y2: y2
                        })
                        arrowCoordinates.push({
                            bend: false,
                            x1: x1 + rectWidth / 2 + 5,
                            y1: y2,
                            x2: x2 - 7,
                            y2: y2
                        })
                    } else { // NE
                        arrowCoordinates.push({
                            bend: true,
                            direction: "NE",
                            x1: x1 + rectWidth,
                            y1: y1,
                            x2: x2 + rectWidth / 2- 5,
                            y2: y1
                        })
                        arrowCoordinates.push({
                            bend: false,
                            x1: x2 + rectWidth / 2- 5,
                            y1: y1,
                            x2: x2 + rectWidth / 2- 5,
                            y2: y2 - rectHeight / 2 - 7
                        })
                    }
                } else { 
                    if (y1 === windowHeight / 2) { // NW
                        arrowCoordinates.push({
                            bend: true,
                            direction: "NW",
                            x1: x1 + rectWidth / 2 + 5,
                            y1: y1 - rectHeight / 2,
                            x2: x1 + rectWidth / 2 + 5,
                            y2: y2
                        })
                        arrowCoordinates.push({
                            bend: false,
                            x1: x1 + rectWidth / 2 + 5,
                            y1: y2,
                            x2: x2 - 7,
                            y2: y2
                        })
                    } else { // SE
                        arrowCoordinates.push({
                            bend: true,
                            direction: "SE",
                            x1: x1 + rectWidth,
                            y1: y1,
                            x2: x2 + rectWidth / 2 - 5,
                            y2: y1
                        })
                        arrowCoordinates.push({
                            bend: false,
                            x1: x2 + rectWidth / 2 - 5,
                            y1: y1,
                            x2: x2 + rectWidth / 2 - 5,
                            y2: y2 + rectHeight / 2 + 7
                        })
                    }
                }
            }
        }
        return arrowCoordinates;
    }
}
