# Workflow
Workflow is a module for generating and displaying workflow graphs. 

Example graphs generated by Workflow: 

![Image of a customized workflow graph (3)](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/fullZoom.png)

![Image of a customized workflow graph (3)](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/defaultZoom.png)


## Installing
To use this module, install Workflow using npm: `npm install --save @softheon/workflow`. You will also need to install D3: `npm install --save d3` and DefinitelyTyped: `npm install --save-dev @types/node`.

## Features
### Layout 
Workflow graphs are automatically sized to best fill the available space on the page. Node widths are dynamically determined by the size of the graph and width of the page, and are bounded by a min and max width to ensure legibility. 
### Zoom
There is a zoom tool, which can be toggled to show/hide by clicking on the 'zoom' button. When open, the zoom tool allows you to zoom in and out, or click on 'Show All' to see a full view of the entire graph. 
### Badges
Badges are hidden if their value is 0.

## Adding a Graph
To create your workflow graph, add a `app-workflow-graph` component to your page. The graph takes in edge and node data, as well as a start node, graph ID, and optional visual specifications. 
```html
<app-workflow-graph [settings]="my_settings"
                    [data]="my_data"></app-workflow-graph>
```

## Parameters
### Data
#### _Nodes_
Each node corresponds to a mailbox, or a step in the workflow, and holds information about the number of tasks that pass through it. The nodes data should be formatted as a JSON. The keys are the ID of the mailbox, which must be unique. 

The IDs map to a dictionary that contains 5 key-value pairs: 
1. `name`: will be displayed on the mailbox (if too long, the name will get cut off to fit)
2. `url`: optional if there is a url function defined (see below)
3. `all`: integer that represents the number of total tasks in that mailbox
4. `completed`: represents the number of completed tasks in that mailbox
5. `remaining`: represents the number of remaining tasks in that mailbox 
```javascript
my_data.nodes = {
    1000: { "name": "first", "all": 100, "completed": 96, "remaining": 4, "url": "customUrl/mailbox1000" },
    1001: { "name": "second", "all": 88, "completed": 75, "remaining": 13 },
    1002: { "name": "third", "all": 54, "completed": 49, "remaining": 5 },
    1003: { "name": "fourth", "all": 1000, "completed": 900, "remaining": 100, "url": "anotherCustomUrl" },
    1004: { "name": "fifth", "all": 100, "completed": 75, "remaining": 25 }
};
``` 

#### _URLs_
There are two ways to define a URL for a mailbox. 
1. As a custom URL, specific to that mailbox (in the nodes object, as shown above)
2. As a default URL pattern, general to all mailboxes in that graph (a function of the ID)

At least one must be defined, in order for the mailbox to link anywhere (defaults to `/`). If both are given, the custom URL will take precedence. 
```javascript
my_data.urls = function(id)  { return "/mailbox/" + id; };
```
**Example 1**: the url function is not defined
```javascript
data.nodes = { 
  0: { "name": "first", "all": 100, completed: 100, remaining: 0, url: "urlForFirstNode" }, 
  1: { "name": "next",  "all": 100, completed: 100, remaining: 0 }
};
// then, when mailbox 0 is clicked, the page redirects to /urlForFirstNode
// and when mailbox 1 is clicked, nothing happens 
```
**Example 2**: the url function is defined
```javascript
data.urls = function(id) { return "/mailbox/" + id; };
data.nodes = { 
  0: { "name": "first", "all": 100, completed: 100, remaining: 0, url: "urlForFirstNode" }, 
  1: { "name": "next",  "all": 100, completed: 100, remaining: 0 }
};
// then, when mailbox 0 is clicked, the page redirects to /urlForFirstNode
// and when mailbox 1 is clicked, the page redirects to /mailbox/1
```


#### _Edges_
The nodes must be linked together to form the workflow process path. The edges data is an array of JSON objects. Each object includes a `source` and `end` parameter, which map to the IDs of the source and destination nodes, respectively. These IDs must match with the names defined in the nodes data above. 
```javascript
my_data.edges = [
    {"source": 1000, "end": 1001},
    {"source": 1001, "end": 1002},
    {"source": 1001, "end": 1003},
    {"source": 1002, "end": 1003},
    {"source": 1003, "end": 1004}
];
``` 

#### _Starting Node_
The ID of the first node in the workflow must be provided. 
```javascript
my_data.startNode = 1000;
``` 
If none is given, the first node will default to the source node of the first edge in the edges list.


### Settings
By default, the workflow graph will already be colored and formatted cleanly. However, if you would like to customize the appearance of the graph, there are several parameters that can be set (all are optional).

#### _Arrows_ 
Graphs with more nodes per level look better with straight arrows, rather than bent ones. 

The boolean `straightArrows` specifies whether the arrows are right-angled (left image) or straight (right image). The value defaults to false (angled).

<img src="https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/bentArrows.png" width="400"/>
<img src="https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/straightArrows.png" width="400"/>

<!-- ![Image of a customized workflow graph (3)](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/custom33.png) -->

<!-- Graph with `straightArrows === true`:
![Image of a customized workflow graph (3)](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/custom13.png) -->

#### _Layout_ 
* Width and height of the graph window
  * defaults to 1200 x 600
* Width and height of the nodes
  * width defaults to the max that will fit (relative to the window width and margin values)
  * height defaults to 40px
* Margins on each side of the graph, within the window
  * defaults to 25px
* Margins between the nodes in the graph
  * defaults to 50px
* Height of the badges
  * defaults to 22, and only accepts custom values with a minimum value of 20

```javascript
my_settings.layoutSettings = {
    "windowWidth":1200,
    "windowHeight":300,
    "rectHeight":60,
    "rectWidth":100,
    "badgeHeight":22,
    "sideMargin":20,
    "nodeMargin":25
};
```

#### _Colors_ 
* Background color of the three types of badges
* Text color of the badges
* Background color of the nodes
* Text color of the nodes
* Border of the nodes
* Background of the graph window

```javascript
my_settings.colorSettings = {
    "blue": "#4fa4cc",
    "green": "#53ad57",
    "red": "#b71d26", 
    "nodeColor": "white",
    "border": 1,
    "background": "darkgray"
};
``` 
Example graphs with color settings (top graph has default parameters):

![Image of a workflow graph with default parameters](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/defaultColors.png)

![Image of a customized workflow graph](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/customColors1.png)

![Image of a customized workflow graph](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/customColors2.png)

![Image of a customized workflow graph (2)](https://raw.githubusercontent.com/Softheon/Workflow-Graph/master/images/customColors3.png)