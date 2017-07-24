import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkflowGraphComponent } from './workflow-graph.component';
import { WorkflowGraphService } from './workflow-graph.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ WorkflowGraphComponent ], 
  exports: [
    WorkflowGraphComponent
  ], 
  providers: [ WorkflowGraphService ]
})
export class WorkflowGraphModule { }
