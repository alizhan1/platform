import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InstructionAccountItemView } from '@bulldozer-client/instructions-data-access';
import {
  Collection,
  Document,
  InstructionAccount,
  InstructionAccountDto,
} from '@heavy-duty/bulldozer-devkit';
import { EditInstructionDocumentComponent } from './edit-instruction-document.component';

@Directive({ selector: '[bdEditInstructionDocumentTrigger]' })
export class EditInstructionDocumentTriggerDirective {
  @Input() instructionDocument: Document<InstructionAccount> | null = null;
  @Input() collections: Document<Collection>[] | null = null;
  @Input() instructionAccounts: InstructionAccountItemView[] | null = null;
  @Output() editInstructionDocument = new EventEmitter<InstructionAccountDto>();
  @HostListener('click') onClick(): void {
    if (!this.collections || !this.instructionAccounts) {
      return;
    }

    this._matDialog
      .open<
        EditInstructionDocumentComponent,
        {
          document: Document<InstructionAccount> | null;
          collections: Document<Collection>[];
          accounts: InstructionAccountItemView[];
        },
        InstructionAccountDto
      >(EditInstructionDocumentComponent, {
        data: {
          document: this.instructionDocument,
          collections: this.collections,
          accounts: this.instructionAccounts,
        },
      })
      .afterClosed()
      .subscribe((data) => data && this.editInstructionDocument.emit(data));
  }

  constructor(private readonly _matDialog: MatDialog) {}
}
