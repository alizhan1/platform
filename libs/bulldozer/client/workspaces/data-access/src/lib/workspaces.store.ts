import { Injectable } from '@angular/core';
import { NotificationStore } from '@bulldozer-client/core-data-access';
import {
  Document,
  Workspace,
  WorkspaceFilters,
} from '@heavy-duty/bulldozer-devkit';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import {
  concatMap,
  EMPTY,
  filter,
  first,
  mergeMap,
  of,
  pipe,
  switchMap,
  takeUntil,
  takeWhile,
  withLatestFrom,
} from 'rxjs';
import { WorkspaceApiService } from './workspace-api.service';
import { WorkspaceEventService } from './workspace-event.service';

interface ViewModel {
  loading: boolean;
  workspacesMap: Map<string, Document<Workspace>>;
  filters: WorkspaceFilters | null;
}

const initialState: ViewModel = {
  loading: false,
  filters: null,
  workspacesMap: new Map<string, Document<Workspace>>(),
};

@Injectable()
export class WorkspacesStore extends ComponentStore<ViewModel> {
  readonly loading$ = this.select(({ loading }) => loading);
  readonly filters$ = this.select(({ filters }) => filters);
  readonly workspacesMap$ = this.select(({ workspacesMap }) => workspacesMap);
  readonly workspaces$ = this.select(this.workspacesMap$, (workspacesMap) =>
    Array.from(workspacesMap, ([, workspace]) => workspace)
  );

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _workspaceApiService: WorkspaceApiService,
    private readonly _workspaceEventService: WorkspaceEventService,
    private readonly _notificationStore: NotificationStore
  ) {
    super(initialState);

    this._handleWorkspaceCreated(this.filters$);
    this._loadWorkspaces(this.filters$);
  }

  private readonly _setWorkspace = this.updater<Document<Workspace>>(
    (state, newWorkspace) => {
      const workspacesMap = new Map(state.workspacesMap);
      workspacesMap.set(newWorkspace.id, newWorkspace);
      return {
        ...state,
        workspacesMap,
      };
    }
  );

  private readonly _addWorkspace = this.updater<Document<Workspace>>(
    (state, newWorkspace) => {
      if (state.workspacesMap.has(newWorkspace.id)) {
        return state;
      }
      const workspacesMap = new Map(state.workspacesMap);
      workspacesMap.set(newWorkspace.id, newWorkspace);
      return {
        ...state,
        workspacesMap,
      };
    }
  );

  private readonly _removeWorkspace = this.updater<string>(
    (state, workspaceId) => {
      const workspacesMap = new Map(state.workspacesMap);
      workspacesMap.delete(workspaceId);
      return {
        ...state,
        workspacesMap,
      };
    }
  );

  private readonly _handleWorkspaceChanges = this.effect<string>(
    mergeMap((workspaceId) =>
      this._workspaceEventService.workspaceChanges(workspaceId).pipe(
        tapResponse(
          (changes) => {
            if (changes === null) {
              this._removeWorkspace(workspaceId);
            } else {
              this._setWorkspace(changes);
            }
          },
          (error) => this._notificationStore.setError(error)
        ),
        takeUntil(
          this.loading$.pipe(
            filter((loading) => loading),
            first()
          )
        ),
        takeWhile((workspace) => workspace !== null)
      )
    )
  );

  private readonly _handleWorkspaceCreated =
    this.effect<WorkspaceFilters | null>(
      switchMap((filters) => {
        if (filters === null) {
          return EMPTY;
        }

        return this._workspaceEventService.workspaceCreated(filters).pipe(
          tapResponse(
            (workspace) => {
              this._addWorkspace(workspace);
              this._handleWorkspaceChanges(workspace.id);
            },
            (error) => this._notificationStore.setError(error)
          )
        );
      })
    );

  private readonly _loadWorkspaces = this.effect<WorkspaceFilters | null>(
    switchMap((filters) => {
      if (filters === null) {
        return EMPTY;
      }

      this.patchState({ loading: true });

      return this._workspaceApiService.find(filters).pipe(
        tapResponse(
          (workspaces) => {
            this.patchState({
              workspacesMap: workspaces.reduce(
                (workspacesMap, workspace) =>
                  workspacesMap.set(workspace.id, workspace),
                new Map<string, Document<Workspace>>()
              ),
              loading: false,
            });
            workspaces.forEach(({ id }) => this._handleWorkspaceChanges(id));
          },
          (error) => this._notificationStore.setError(error)
        )
      );
    })
  );

  readonly setFilters = this.updater<WorkspaceFilters | null>(
    (state, filters) => ({
      ...state,
      filters,
    })
  );

  readonly createWorkspace = this.effect<string>(
    pipe(
      concatMap((request) =>
        of(request).pipe(withLatestFrom(this._walletStore.publicKey$))
      ),
      concatMap(([workspaceName, authority]) => {
        if (authority === null) {
          return EMPTY;
        }

        return this._workspaceApiService
          .create({
            workspaceName,
            authority: authority.toBase58(),
          })
          .pipe(
            tapResponse(
              () =>
                this._notificationStore.setEvent(
                  'Create workspace request sent'
                ),
              (error) => this._notificationStore.setError(error)
            )
          );
      })
    )
  );

  readonly updateWorkspace = this.effect<{
    workspaceId: string;
    workspaceName: string;
  }>(
    pipe(
      concatMap((request) =>
        of(request).pipe(withLatestFrom(this._walletStore.publicKey$))
      ),
      concatMap(([{ workspaceId, workspaceName }, authority]) => {
        if (authority === null) {
          return EMPTY;
        }

        return this._workspaceApiService
          .update({
            workspaceName,
            authority: authority.toBase58(),
            workspaceId,
          })
          .pipe(
            tapResponse(
              () =>
                this._notificationStore.setEvent(
                  'Update workspace request sent'
                ),
              (error) => this._notificationStore.setError(error)
            )
          );
      })
    )
  );

  readonly deleteWorkspace = this.effect<string>(
    pipe(
      concatMap((request) =>
        of(request).pipe(withLatestFrom(this._walletStore.publicKey$))
      ),
      concatMap(([workspaceId, authority]) => {
        if (authority === null) {
          return EMPTY;
        }

        return this._workspaceApiService
          .delete({
            authority: authority.toBase58(),
            workspaceId,
          })
          .pipe(
            tapResponse(
              () =>
                this._notificationStore.setEvent(
                  'Delete workspace request sent'
                ),
              (error) => this._notificationStore.setError(error)
            )
          );
      })
    )
  );
}