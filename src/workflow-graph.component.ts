import { Component, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { WorkflowGraphService } from './workflow-graph.service';
import * as d3 from "d3";

import { Edge } from './classes/edge';
import { Node } from './classes/node';
import { Graph } from './classes/graph';
import { Coordinate } from './classes/coordinate';
import { Depth } from './classes/depth';

@Component({
    selector: 'app-workflow-graph',
    templateUrl: './workflow-graph.component.html',
    styleUrls: ['./workflow-graph.component.css']
})
export class WorkflowGraphComponent implements OnChanges {
    // 
    // inputs 
    //
    @Input() settings;
    @Input() data;
    @Output() link: EventEmitter<any> = new EventEmitter();
    windowWidth;
    windowHeight;
    minNodeWidth = 200;
    maxNodeWidth = 450;
    currentData;
    scale = 100;
    showZoom = false;

    constructor(
        private router: Router, 
        private workflowGraphService : WorkflowGraphService,
    ) { }

    public zoomIn() {
        this.scale = Math.round(this.scale * 1.25);
        this.buildGraph();
    }

    public zoomOut() {
        this.scale = Math.round(this.scale * .8);
        this.buildGraph();
    }
    
    public showAll() {
        this.scale = Math.round(document.getElementById("workflowgraph").offsetWidth / this.windowWidth * 100) - 1;
        this.scale = Math.min(this.scale, 
            Math.round(document.getElementById("workflowgraph").offsetHeight / this.windowHeight * 100) - 1);
        this.showZoom = false;
        this.buildGraph();
    }

    // returns the attribute, if it's not null, otherwise returns the default value
    private initWithDefault(attribute, defaultValue) {
        return attribute ? attribute : defaultValue;
    }
    
    ngOnChanges(changes: SimpleChanges) {
        this.currentData = changes.data.currentValue;
        this.buildGraph();
    }

    public onClick(url) {
        this.router.navigate([url]);
    }

    public buildGraph(){
        // 
        // initializing settings values to defaults (if needed)
        // 
        if (!this.settings) this.settings = {};
        let layoutSettings = this.initWithDefault(this.settings.layoutSettings, {});
        let colorSettings = this.initWithDefault(this.settings.colorSettings, {});
        let straightArrows = this.initWithDefault(this.settings.straightArrows, false);
        
        //
        // layout settings
        //
        this.windowWidth = document.getElementById("workflowgraph").offsetWidth;
        //this.initWithDefault(layoutSettings.windowWidth, 1200);
        this.windowHeight = this.initWithDefault(layoutSettings.windowHeight, 500);

        let rectWidth = layoutSettings.rectWidth;
        let rectHeight = this.initWithDefault(layoutSettings.rectHeight, 40);

        let sideMargin = this.initWithDefault(layoutSettings.sideMargin, 25);
        let nodeMargin = this.initWithDefault(layoutSettings.nodeMargin, 75);

        let badgeHeight = (layoutSettings.badgeHeight && (layoutSettings.badgeHeight > 20)) ? layoutSettings.badgeHeight : 22;
        let badgeRadius = this.initWithDefault(layoutSettings.badgeRadius, 10);

        //
        // color settings
        // 
        let blue = this.initWithDefault(colorSettings.blue, "#4f8cef");
        let green = this.initWithDefault(colorSettings.green, "#35a33b");
        let red = this.initWithDefault(colorSettings.red, "#e81e10");

        let nodeColor = this.initWithDefault(colorSettings.nodeColor, "#eee");
        let nodeTextColor = this.initWithDefault(colorSettings.nodeTextColor, "black");
        let border = this.initWithDefault(colorSettings.border, "0");

        let badgeTextColor = this.initWithDefault(colorSettings.badgeTextColor, "white");
        let mailboxTextColor = this.initWithDefault(colorSettings.mailboxTextColor, "white");

        let background = colorSettings.background ? colorSettings.background : "white";

        //
        // data settings
        //
        if (!this.currentData || !this.currentData.urls) {
            this.currentData.urls = (id) => { return "javascript:void(0);"; }
        }

        // 
        // calculations 
        // 
        let graph: Graph[] = this.workflowGraphService.getGraph(this.currentData.edges)
        let depths: Depth[] = this.workflowGraphService.getDepths(this.currentData.nodes, graph, this.currentData.startNode);
        let levelCounts = this.workflowGraphService.getLevelCounts(depths);

        // 
        // positioning the nodes
        // 
        let maxDepth: number = depths.reduce((d1, d2) => {
            return Math.max(d1, d2.depth);
        }, 0) + 1;
        let maxStepHeight: number = Math.max.apply(null, (<any>Object).values(levelCounts)) + 1;

        if (!rectWidth) {
            rectWidth = Math.max(this.minNodeWidth, (this.windowWidth - 2*sideMargin - nodeMargin * (maxDepth - 1))/maxDepth);
            rectWidth = Math.min(this.maxNodeWidth, rectWidth);
        }
        this.windowWidth = Math.max(this.windowWidth, 2*sideMargin + nodeMargin*(maxDepth-1) + rectWidth*maxDepth);
        this.windowHeight = Math.max(this.windowHeight, (rectHeight + 50)*maxStepHeight);
        let totalHeight = window.innerHeight - 30;
        let displayHeight = totalHeight - document.getElementById("workflowgraph").getBoundingClientRect().top;

        let nodeCoordinates: Node[] = this.workflowGraphService.getNodeInfo(
            depths, levelCounts, sideMargin, nodeMargin, rectWidth, this.windowHeight, this.currentData.nodes, this.currentData.urls);
        let arrowCoordinates: Coordinate[] = this.workflowGraphService.getArrowCoordinates(
            this.currentData.edges, nodeCoordinates, rectWidth, rectHeight, this.windowHeight, straightArrows);

        //
        // drawing it out
        //
        let svg = d3.select("#workflowgraph")
            .html("")
            .attr("style", "height: " + (displayHeight) + "px")
            .append("svg")
                .attr("viewBox", "0 0 " + this.windowWidth + " " + this.windowHeight)
                .attr("preserveAspectRatio", "none")
                .attr("width", this.windowWidth * this.scale / 100)
                .attr("height", this.windowHeight * this.scale / 100);

        let backgroundDiv = svg.append("rect")
            .attr("width", this.windowWidth)
            .attr("height", this.windowHeight)
            .attr("fill", background);

        // arrows
        let arrows = svg.append("svg:defs").append("svg:marker")
            .attr("id", "triangle")
            .attr("refX", 6)
            .attr("refY", 6) 
            .attr("markerWidth", 30)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
                .attr("d", "M 0 0 12 6 0 12 3 6")
                .style("fill", "black");

        // lines 
        let lines = svg.selectAll("line")
            .data(arrowCoordinates)
            .enter()
            .append("line")
                .attr("x1", (d) => { return d.x1; })
                .attr("y1", (d) => { return d.y1; })
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("x2", (d) => { return d.x2; })
                .attr("y2", (d) => { return d.y2; })
                .attr("marker-end", (d) => { if (d.bend) return "none"; else return "url(#triangle)"; });

        // nodes
        let nodes = svg.selectAll(".link")
            .data((<any>Object).values(nodeCoordinates))
            .enter()
            .append("g")
                .style("cursor", "pointer")
                .on('click', (d, i) => { this.onClick(d["url"]) });
            
        let titles = nodes.append("title")
            .html(d => { 
                return "Queue: " + d["name"] 
                    + "\nID: " + d["id"]
                    + "\nTotal Tasks: " + d["all"]
                    + "\nCompleted Tasks: " + d["completed"]
                    + "\nRemaining Tasks: " + d["remaining"]
            })        

        // rectangles
        let rectangles = nodes.append("rect")
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .attr("x", (d) => { return d["x"]; })
            .attr("y", (d) => { return d["y"] - rectHeight / 2; })
            .attr("stroke", "black")
            .attr("stroke-width", border)
            .attr("fill", nodeColor);

        // rectangle labels
        function getPath(d) {
            return "M" + (d["x"] + 5) + " " + (d["y"] + rectHeight/2 - 20) 
                + " h " + (rectWidth - 10);
        }
        var paths = nodes.append("path")
            .attr("id", (d) => "pathid_" + d["id"]) 
            .attr("d", (d) => { return getPath(d)}) 
            .style("fill", "none");

        nodes.append("text")
            .attr("dy", 8)
            .append("textPath") 
                .attr("xlink:href", (d) => "#pathid_" + d["id"])
                .text((d) => { return d["name"]; });

        let badges = nodes.append("g")
            .attr("fill", nodeTextColor)
            .attr("style", "font-family: monospace");

        // blue
        let blueBadges = badges.append("rect")
            .filter((d) => { return d["all"] > 0; })
                .attr("width", (d) => { return badgeHeight / 2 + 7 * d["all"].toString().length; })
                .attr("height", badgeHeight)
                .attr("x", (d) => { return d["x"] - badgeHeight / 4 - 3; })
                .attr("y", (d) => { return d["y"] - rectHeight / 2 - badgeHeight / 2; })
                .attr("ry", badgeRadius)
                .attr("fill", blue);

        let blueBadgeLabels = badges.append("text")
            .filter((d) => { return d["all"] > 0; })
                .attr("x", (d) => { return d["x"] - 4; })
                .attr("y", (d) => { return d["y"] - rectHeight / 2 + 4; })
                .attr("fill", badgeTextColor)
                .text((d) => { return d["all"]; });

        // alternative node design: still has the total badge on top, but shows 
        // the completed/remaining tasks on the bottom (length of green/red 
        // correlate with the % of complete vs remaining tasks) 
        let bottomBadges = false;

        if (!bottomBadges) {
            // green
            let greenBadges = badges.append("rect")
                .filter((d) => { return d["completed"] > 0; })
                    .attr("width", (d) => { return badgeHeight / 2 + 7 * d["completed"].toString().length; })
                    .attr("height", badgeHeight)
                    .attr("x", (d) => { return d["x"] - badgeHeight / 4 + rectWidth / 2 + 1; })
                    .attr("y", (d) => { return d["y"] - rectHeight / 2 - badgeHeight / 2; })
                    .attr("ry", badgeRadius)
                    .attr("fill", green);

            let greenBadgeLabels = badges.append("text")
                .filter((d) => { return d["completed"] > 0; })
                    .attr("x", (d) => { return d["x"] + rectWidth / 2 + 1; })
                    .attr("y", (d) => { return d["y"] - rectHeight / 2 + 4; })
                    .attr("fill", badgeTextColor)
                    .text((d) => { return d["completed"]; });

            // red
            let redBadges = badges.append("rect")
                .filter((d) => { return d["remaining"] > 0; })
                    .attr("width", (d) => { return badgeHeight / 2 + 7 * d["remaining"].toString().length; })
                    .attr("height", badgeHeight)
                    .attr("x", (d) => { return d["x"] - badgeHeight / 4 + rectWidth - 4; })
                    .attr("y", (d) => { return d["y"] - rectHeight / 2 - badgeHeight / 2; })
                    .attr("ry", badgeRadius)
                    .attr("fill", red);

            let redBadgeLabels = badges.append("text")
                .filter((d) => { return d["remaining"] > 0; })
                    .attr("x", (d) => { return d["x"] + rectWidth - 4; })
                    .attr("y", (d) => { return d["y"] - rectHeight / 2 + 4; })
                    .attr("fill", badgeTextColor)
                    .text((d) => { return d["remaining"]; });
        } else {
            // green
            let squareGreenBadges = badges.append("rect")
                .filter((d) => { return !isNaN(d["completed"]) && !isNaN(d["remaining"]) && d["completed"] > 0; })
                    .attr("width", (d) => { return rectWidth; })
                    .attr("height", badgeHeight*.75)
                    .attr("x", (d) => { return d["x"]; })
                    .attr("y", (d) => { return d["y"] + rectHeight / 2; })
                    .attr("fill", green);

            let squareGreenBadgesLabels = badges.append("text")
                .filter((d) => { return !isNaN(d["completed"]) && !isNaN(d["remaining"]) && d["completed"] > 0; })
                    .attr("x", (d) => { return d["x"]; })
                    .attr("y", (d) => { return d["y"] + rectHeight / 2; })
                    .attr("dx", "6")
                    .attr("dy", "12")
                    .attr("fill", badgeTextColor)
                    .text((d) => { return d["completed"]; });     
            
            // red
            let getRedWidth = (d) => { return rectWidth * d["remaining"] / d["all"] }
            let squareRedBadges = badges.append("rect")
                .filter((d) => { return !isNaN(d["completed"]) && !isNaN(d["remaining"]) && d["remaining"] > 0; })
                    .attr("width", (d) => { return getRedWidth(d); })
                    .attr("height", badgeHeight*.75)
                    .attr("x", (d) => { return d["x"] + rectWidth - getRedWidth(d); })
                    .attr("y", (d) => { return d["y"] + rectHeight / 2; })
                    .attr("fill", red);

            let squareRedBadgesLabels = badges.append("text")
                .filter((d) => { return !isNaN(d["completed"]) && !isNaN(d["remaining"]) && d["remaining"] > 0; })
                    .attr("x", (d) => { return d["x"] + rectWidth - getRedWidth(d); })
                    .attr("y", (d) => { return d["y"] + rectHeight / 2; })
                    .attr("dx", "6")
                    .attr("dy", "12")
                    .attr("fill", badgeTextColor)
                    .text((d) => { return d["remaining"]; });
            
            /* 
            let squareBlueBadges = badges.append("rect")
                .filter((d) => { return true; })
                    .attr("width", (d) => { return rectWidth; })
                    .attr("height", badgeHeight*.75)
                    .attr("x", (d) => { return d["x"]; })
                    .attr("y", (d) => { return d["y"] + rectHeight / 2; })
                    .attr("fill", blue);

            let squareBlueBadgesLabels = badges.append("text")
                .filter((d) => { return true; })
                    .attr("x", (d) => { return d["x"]; })
                    .attr("y", (d) => { return d["y"] + rectHeight / 2; })
                    .attr("dx", "6")
                    .attr("dy", "12")
                    .attr("fill", badgeTextColor)
                    .text((d) => { return d["all"]; });
            */
        }

    }
}
