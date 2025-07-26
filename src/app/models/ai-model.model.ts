export interface AiModel {
  id: number;
  modelId: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  provider: string;
  version: string;
  maxTokens: number;
  temperature: number;
  displayOrder: number;
}

export interface CreateAiModel {
  modelId: string;
  name: string;
  description: string;
  isActive?: boolean;
  isDefault?: boolean;
  provider?: string;
  version?: string;
  maxTokens?: number;
  temperature?: number;
  displayOrder?: number;
}

export interface UpdateAiModel {
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  version: string;
  maxTokens: number;
  temperature: number;
  displayOrder: number;
}