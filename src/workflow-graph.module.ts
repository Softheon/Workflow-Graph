import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { WorkflowGraphComponent } from './workflow-graph.component';
import { WorkflowGraphService } from './workflow-graph.service';

export { Edge } from './classes/edge';
export { Node } from './classes/node';

@NgModule({
  imports: [
    CommonModule, 
    FormsModule
  ],
  declarations: [ WorkflowGraphComponent ], 
  exports: [
    WorkflowGraphComponent
  ], 
  providers: [ 
    WorkflowGraphService, 
    RouterModule 
  ]
})
export class WorkflowGraphModule { }
