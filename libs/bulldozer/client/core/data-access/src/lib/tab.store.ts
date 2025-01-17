import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserInstructionsStore } from '@bulldozer-client/users-data-access';
import { WorkspaceInstructionsStore } from '@bulldozer-client/workspaces-data-access';
import { HdSolanaConfigStore } from '@heavy-duty/ngx-solana';
import { isNotNullOrUndefined } from '@heavy-duty/rxjs';
import { ComponentStore } from '@ngrx/component-store';
import {
  concatMap,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  pairwise,
  pipe,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ConfigStore } from './config.store';

export interface Tab {
  id: string;
  kind: 'workspace' | 'application' | 'collection' | 'instruction' | 'profile';
  url: string;
}

interface ViewModel {
  tabs: Tab[];
  selected: string | null;
}

const initialState: ViewModel = {
  tabs: [],
  selected: null,
};

@Injectable()
export class TabStore extends ComponentStore<ViewModel> {
  readonly tabs$ = this.select(({ tabs }) => tabs);
  readonly selected$ = this.select(({ selected }) => selected, {
    debounce: true,
  });
  readonly tab$ = this.select(
    this.tabs$,
    this.selected$,
    (tabs, selected) => tabs.find(({ id }) => id === selected) || null
  );

  constructor(
    private readonly _router: Router,
    private readonly _configStore: ConfigStore,
    private readonly _hdSolanaConfigStore: HdSolanaConfigStore,
    private readonly _userInstructionsStore: UserInstructionsStore,
    private readonly _workspaceInstructionsStore: WorkspaceInstructionsStore
  ) {
    super(initialState);

    this._handleActiveWorkspaceChanges(
      this._configStore.workspaceId$.pipe(isNotNullOrUndefined)
    );
    this._handleNetworkChanges(this._hdSolanaConfigStore.selectedNetwork$);
    this._removeWorkspaceTabOnDelete(
      merge(
        this._workspaceInstructionsStore.lastInstructionStatus$,
        this._userInstructionsStore.lastInstructionStatus$
      ).pipe(
        isNotNullOrUndefined,
        filter(
          (instructionStatus) =>
            instructionStatus.name === 'deleteWorkspace' &&
            instructionStatus.status === 'finalized'
        ),
        map(
          (instructionStatus) =>
            instructionStatus.accounts.find(
              (account) => account.name === 'Workspace'
            )?.pubkey ?? null
        ),
        isNotNullOrUndefined
      )
    );
  }

  private readonly _removeWorkspaceTabOnDelete = this.effect<string>(
    tap((workspaceId) => this.closeTab(workspaceId))
  );

  private readonly _removeTab = this.updater<string>((state, tabId) => ({
    ...state,
    tabs: state.tabs.filter((tab) => tab.id !== tabId),
  }));

  private readonly _removeWorkspaceTabs = this.updater<string>(
    (state, workspaceId) => ({
      ...state,
      tabs: state.tabs.filter(
        (tab) => !tab.url.startsWith(`/workspaces/${workspaceId}`)
      ),
    })
  );

  private readonly _handleNetworkChanges = this.effect(
    pipe(
      distinctUntilChanged(),
      pairwise(),
      tap(() =>
        this.patchState({
          tabs: [],
          selected: null,
        })
      )
    )
  );

  private readonly _handleActiveWorkspaceChanges = this.effect<string>(
    pipe(
      distinctUntilChanged(),
      pairwise(),
      tap(([previousWorkspaceId]) =>
        this._removeWorkspaceTabs(previousWorkspaceId)
      )
    )
  );

  readonly openTab = this.updater<Tab>((state, newTab) => {
    const oldTab = state.tabs.find((tab) => tab.id === newTab.id);

    return {
      ...state,
      tabs: oldTab ? state.tabs : [...state.tabs, newTab],
      selected: newTab.id,
    };
  });

  readonly closeTab = this.effect<string>(
    pipe(
      tap((tabId) => this._removeTab(tabId)),
      concatMap(() =>
        of(null).pipe(
          withLatestFrom(this.tabs$, (_, tabs) =>
            tabs.length > 0 ? tabs[0] : null
          )
        )
      ),
      tap((tab) => {
        if (tab) {
          this._router.navigateByUrl(tab.url);
        } else {
          this._router.navigate(['/']);
        }
      })
    )
  );
}
