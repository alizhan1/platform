import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImportWorkspaceComponent } from './import-workspace.component';

@Directive({ selector: '[bdImportWorkspaceTrigger]' })
export class ImportWorkspaceTriggerDirective {
  @Output() importWorkspace = new EventEmitter<string>();
  @HostListener('click') onClick(): void {
    this._matDialog
      .open<ImportWorkspaceComponent, null, { pubkey: string }>(
        ImportWorkspaceComponent
      )
      .afterClosed()
      .subscribe((data) => data && this.importWorkspace.emit(data.pubkey));
  }

  constructor(private readonly _matDialog: MatDialog) {}
}
