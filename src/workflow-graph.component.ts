import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { WorkflowGraphService } from './workflow-graph.service';

import * as d3 from "d3";

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
    @Input() id = "default-graph-id";
    windowWidth;
    minNodeWidth = 150;
    maxNodeWidth = 450;

    constructor(private workflowGraphService : WorkflowGraphService) { }
    
    // returns the attribute, if it's not null, otherwise returns the default value
    private initWithDefault(attribute, defaultValue) {
        return attribute ? attribute : defaultValue;
    }
    
    ngOnChanges(changes: SimpleChanges) {
        this.buildGraph(changes.data.currentValue);
    }
    
    public buildGraph(newData){
        console.log("onChanges");
        console.log(newData);
        // 
        // initializing settings values to defaults (if needed)
        // 
        if (!this.settings) this.settings = {};
        let layoutSettings = this.initWithDefault(this.settings.layoutSettings, {});
        let colorSettings = this.initWithDefault(this.settings.colorSettings, {});
        
        //
        // layout settings
        //
        this.windowWidth = document.getElementById(this.id).offsetWidth;
        //this.initWithDefault(layoutSettings.windowWidth, 1200);
        let windowHeight = this.initWithDefault(layoutSettings.windowHeight, 500);

        let rectWidth = layoutSettings.rectWidth;
        let rectHeight = this.initWithDefault(layoutSettings.rectHeight, 40);

        let sideMargin = this.initWithDefault(layoutSettings.sideMargin, 25);
        let nodeMargin = this.initWithDefault(layoutSettings.nodeMargin, 200);

        let badgeHeight = (layoutSettings.badgeHeight && (layoutSettings.badgeHeight > 20)) ? layoutSettings.badgeHeight : 22;
        let badgeRadius = this.initWithDefault(layoutSettings.badgeRadius, 10);

        //
        // color settings
        // 
        let blue = this.initWithDefault(colorSettings.blue, "blue");
        let green = this.initWithDefault(colorSettings.green, "green");
        let red = this.initWithDefault(colorSettings.red, "red");

        let nodeColor = this.initWithDefault(colorSettings.nodeColor, "lightgray");
        let border = this.initWithDefault(colorSettings.border, "0");

        let badgeTextColor = this.initWithDefault(colorSettings.badgeTextColor, "white");
        let mailboxTextColor = this.initWithDefault(colorSettings.mailboxTextColor, "white");

        let background = colorSettings.background ? colorSettings.background : "white";

        //
        // data settings
        //
        if (!newData || !newData.urls) {
            newData.urls = (id) => { return "javascript:void(0);"; }
        }

        // 
        // calculations 
        // 
        let graph = this.workflowGraphService.getGraph(newData.edges)
        let depths = this.workflowGraphService.getDepths(newData.nodes, graph, newData.startNode);
        let levelCounts = this.workflowGraphService.getNodesByLevel(depths);

        // 
        // positioning the nodes
        // 
        let maxDepth = Math.max.apply(null, (<any>Object).values(depths)) + 1;
        let maxStepHeight = Math.max.apply(null, (<any>Object).values(levelCounts)) + 1;

        if (!rectWidth) {
            rectWidth = Math.max(this.minNodeWidth, (this.windowWidth - 2 * sideMargin - nodeMargin * (maxDepth - 1)) / maxDepth);
            rectWidth = Math.min(this.maxNodeWidth, rectWidth);
        }
        this.windowWidth = Math.max(this.windowWidth, 2*sideMargin + nodeMargin*(maxDepth-1) + rectWidth*maxDepth);
        windowHeight = Math.max(windowHeight, (rectHeight + 50)*maxStepHeight);

        let nodeCoordinates = this.workflowGraphService.getNodeInfo(depths, levelCounts, sideMargin, nodeMargin, rectWidth, windowHeight, newData.nodes, newData.urls);
        let arrowCoordinates = this.workflowGraphService.getArrowCoordinates(newData.edges, nodeCoordinates, rectWidth, rectHeight, windowHeight);

        //
        // drawing it out
        //
        let svg = d3.select("#" + this.id)
            .html("")
            .append("svg")
            .attr("width", this.windowWidth)
            .attr("height", windowHeight);

        let backgroundDiv = svg.append("rect")
            .attr("width", this.windowWidth)
            .attr("height", windowHeight)
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

        // links
        let links = svg.selectAll(".link")
            .data((<any>Object).values(nodeCoordinates))
            .enter().append("a")
            .attr("href", (d) => { return d["url"]; });
        
        // nodes
        let nodes = links.append("g");
        let titles = nodes.append("title")
            .html(d => { return d["name"] })        

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
        let labels = nodes.append("text")
            .attr("x", (d) => { return d["x"]; })
            .attr("y", (d) => { return d["y"]; })
            .attr("dx", "6")
            .attr("dy", "4")
            .attr("style", "font-family: monospace")
            .text((d) => { return d["name"].substring(0, rectWidth / 7.7); })

        let badges = nodes.append("g")
            .attr("class", "circles");

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
                .attr("x", (d) => { return d["x"]; })
                .attr("y", (d) => { return d["y"] - rectHeight / 2; })
                .attr("dx", "-4")
                .attr("dy", "4")
                .attr("fill", badgeTextColor)
                .attr("style", "font-family: monospace")
                .text((d) => { return d["all"]; });

        // green
        let greenBadges = badges.append("rect")
            .filter((d) => { return d["complete"] > 0; })
                .attr("width", (d) => { return badgeHeight / 2 + 7 * d["completed"].toString().length; })
                .attr("height", badgeHeight)
                .attr("x", (d) => { return d["x"] - badgeHeight / 4 + rectWidth / 2 + 1; })
                .attr("y", (d) => { return d["y"] - rectHeight / 2 - badgeHeight / 2; })
                .attr("ry", badgeRadius)
                .attr("fill", green);

        let greenBadgeLabels = badges.append("text")
            .filter((d) => { return d["complete"] > 0; })
                .attr("x", (d) => { return d["x"] + rectWidth / 2 + 5; })
                .attr("y", (d) => { return d["y"] - rectHeight / 2; })
                .attr("dx", "-4")
                .attr("dy", "4")
                .attr("fill", badgeTextColor)
                .attr("style", "font-family: monospace")
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
                .attr("x", (d) => { return d["x"] + rectWidth; })
                .attr("y", (d) => { return d["y"] - rectHeight / 2; })
                .attr("dx", "-4")
                .attr("dy", "4")
                .attr("fill", badgeTextColor)
                .attr("style", "font-family: monospace")
                .text((d) => { return d["remaining"]; });
        
    }
}
