export interface CreateCollaboratorParams {
  authority: string;
  workspaceId: string;
  userId: string;
}

export interface DeleteCollaboratorParams {
  authority: string;
  workspaceId: string;
  collaboratorId: string;
}

export interface UpdateCollaboratorParams {
  authority: string;
  workspaceId: string;
  collaboratorId: string;
  status: number;
}

export interface RequestCollaboratorStatusParams {
  authority: string;
  workspaceId: string;
}

export interface RetryCollaboratorStatusRequestParams {
  authority: string;
  workspaceId: string;
  collaboratorId: string;
}
