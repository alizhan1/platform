import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { WorkspaceView } from '@bulldozer-client/workspaces-data-access';

@Component({
  selector: 'bd-my-workspaces-list',
  template: `
    <mat-card class="p-3">
      <section class="flex flex-col gap-3">
        <header bdSectionHeader>
          <h2>My Workspaces</h2>
          <p>Visualize all the workspaces you own.</p>
        </header>

        <mat-list
          role="list"
          *ngIf="workspaces && workspaces.length > 0; else emptyList"
          class="flex flex-col gap-2"
        >
          <mat-list-item
            role="listitem"
            *ngFor="let workspace of workspaces; let i = index"
            class="h-auto bg-white bg-opacity-5 mat-elevation-z2"
          >
            <div class="flex items-center gap-4 py-2 w-full">
              <div
                class="flex justify-center items-center w-12 h-12 rounded-full bg-black bg-opacity-10 text-xl font-bold"
              >
                {{ i + 1 }}
              </div>
              <div class="flex-grow">
                <h3
                  class="mb-0 text-lg font-bold flex items-center justify-start gap-2"
                >
                  <span
                    [matTooltip]="
                      workspace.document.name
                        | bdItemUpdatingMessage: workspace:'Workspace'
                    "
                    matTooltipShowDelay="500"
                  >
                    {{ workspace.document.name }}
                  </span>
                  <mat-progress-spinner
                    *ngIf="workspace | bdItemShowSpinner"
                    diameter="16"
                    mode="indeterminate"
                  ></mat-progress-spinner>
                </h3>

                <p class="text-xs mb-0 italic">
                  Workspace ID:
                  {{ workspace.document.id }}
                </p>
              </div>
              <a
                mat-mini-fab
                aria-label="Load workspace"
                color="primary"
                [routerLink]="['/workspaces', workspace.document.id]"
              >
                <mat-icon>open_in_new</mat-icon>
              </a>
            </div>
          </mat-list-item>
        </mat-list>

        <ng-template #emptyList>
          <p class="text-center text-xl py-8">You don't have workspaces.</p>
        </ng-template>
      </section>
    </mat-card>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyWorkspacesListComponent {
  @Input() workspaces: WorkspaceView[] | null = null;
  @Input() activeWorkspaceId: string | null = null;
  @Output() activateWorkspace = new EventEmitter<string>();

  onActivateWorkspace(workspaceId: string) {
    this.activateWorkspace.emit(workspaceId);
  }
}
