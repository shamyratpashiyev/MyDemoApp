import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Agent {
  id: string;
  name: string;
  prompt: string;
}

@Component({
  selector: 'app-agent-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-selector.component.html',
  styleUrls: ['./agent-selector.component.scss']
})
export class AgentSelectorComponent {
  @Output() agentSelected = new EventEmitter<Agent>();

  agents: Agent[] = [
    { id: 'developer', name: 'Developer', prompt: 'From now on, you are a professional software developer. Subsequent questions will be related to this field.' },
    { id: 'devops', name: 'DevOps Engineer', prompt: 'From now on, you are a professional DevOps engineer. Subsequent questions will be related to this field.' },
    { id: 'designer', name: 'Designer', prompt: 'From now on, you are a professional designer. Subsequent questions will be related to this field.' }
  ];

  selectedAgent: Agent | null = null;

  selectAgent(agent: Agent) {
    this.selectedAgent = agent;
    this.agentSelected.emit(agent);
  }
}
