import { Injectable } from '@angular/core';

import { Edge } from './classes/edge';
import { Node } from './classes/node';
import { Graph } from './classes/graph';
import { Coordinate } from './classes/coordinate';
import { Depth } from './classes/depth';

@Injectable()
export class WorkflowGraphService {
    public getGraph(edges: Edge[]): Graph[] {
        let graph: Graph[] = [];
        let edge: Edge;
        let startNodeIndex: number;
        let endNodeIndex: number;
        for (var i = 0; i < edges.length; i++) {
            edge = edges[i];
            startNodeIndex = edge.source;
            endNodeIndex = edge.end;
            if (!this.getChildren(graph, startNodeIndex)) {
                graph.push({
                    "parentId": startNodeIndex,
                    "children": []
                });
            }
            this.getChildren(graph, startNodeIndex).push(endNodeIndex)
        }
        return graph;
    }

    private getChildren(graph: Graph[], parentId: number): number[] {
        let parent: Graph = graph.find(thisParent => { 
            return thisParent.parentId === parentId 
        });
        if (parent) return parent.children; 
    }

    private getDepth(depths: Depth[], node): Depth {
        return depths.find(d => { 
            return d.nodeId === node 
        });
    }

    public getDepths(nodes: Node[], graph: Graph[], startNode: number): Depth[] {
        if (!graph || !startNode) return null;
        let currentNode: number = startNode;
        let queue: number[] = [startNode];
        let depths: Depth[] = [];
        let currentDepth: number = 0;
        let leftInLevel: number = 1;
        let nextLeftInLevel: number = 0;
        let children: number[], child: number;

        // doing a BFS to find the depths of the nodes in the graph
        while (queue) {
            currentNode = queue.shift();
            children = this.getChildren(graph, currentNode);
            depths.push({
                "nodeId": currentNode,
                "depth": currentDepth
            });

            // check if you're done
            if (!children) { break; }

            for (let i = 0; i < children.length; i++) {
                child = children[i]
                if (!this.getDepth(depths, child) && !queue.includes(child))
                    nextLeftInLevel++;
                if (!this.getDepth(depths, child) && !queue.includes(child)) {
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
            if (!this.getDepth(depths, node.id))
                depths.push({
                    nodeId: node.id,
                    depth: 0
                });
        }
        return depths;
    }

    // returns an object in the form { level index: [ids of the nodes in that level], etc }
    public getLevelCounts(depths: Depth[]): any {
        let levels: any = {};
        for (let node of depths) {
            if (levels[node.depth]) {
                levels[node.depth]++;
            }
            else {
                levels[node.depth] = 1;
            }
        }
        return levels;
    }

    private findNode(nodes: Node[], nodeId: number): Node {
        let thisNode: Node = nodes.find(thisNode => { return thisNode.id === nodeId; });
        return thisNode;
    }

    public getNodeInfo(depths: Depth[], levelCounts:any, sideMargin: number, nodeMargin: number, 
            rectWidth: number, windowHeight: number, nodes: Node[], urls: (string) => string): Node[] {
        let nodeInfo: Node[] = [];
        let levelPositions: any = {};
        let getX = (level) => { return sideMargin + level * (rectWidth + nodeMargin); }
        let getY = (level) => { return windowHeight / (level + 1); }

        for (let node of depths) {
            let depth = this.getDepth(depths, node.nodeId).depth;
            let y: number = getY(levelCounts[depth]);
            let currentNode: Node = this.findNode(nodes, node.nodeId);
            let newNode: Node = currentNode;
            let thisUrl = (currentNode.url) ? currentNode.url: urls(node.nodeId);

            if (!levelPositions[depth]) levelPositions[depth] = 0;
            levelPositions[depth] += y;

            newNode.id = node.nodeId;
            newNode.x = getX(depth);
            newNode.y = levelPositions[depth];
            newNode.url = thisUrl;
            nodeInfo.push(newNode);
        }
        return nodeInfo;
    }

    public getArrowCoordinates(edges: Edge[], nodeInfo: Node[], rectWidth: number, rectHeight: number, 
            windowHeight: number, straightArrows: boolean): Coordinate[] {
        let arrowCoordinates: Coordinate[] = [];
        for (let i = 0; i < edges.length; i++) {
            let sourceId: number = edges[i].source;
            let source: Node = this.findNode(nodeInfo, sourceId);
            let endId: number = edges[i].end;
            let end: Node = this.findNode(nodeInfo, endId);
            let x1: number = source.x;
            let y1: number = source.y;
            let x2: number = end.x;
            let y2: number = end.y;

            if (straightArrows) {
                let goingDown = y2 < y1 ? 1 : -1;
                goingDown = y2 === y1 ? 0 : goingDown;
                arrowCoordinates.push({
                    bend: false,
                    x1: x1 + rectWidth,
                    y1: y1,
                    x2: x2 - 7,
                    y2: y2 + (Math.min(rectHeight/4, Math.abs(y2-y1)/15))*goingDown
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
                } 
                else { 
                    if (y1 === windowHeight / 2) { // NW
                        arrowCoordinates.push({
                            bend: true,
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
