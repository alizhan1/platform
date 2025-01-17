import { Directive, HostListener } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { HdTransactionsListComponent } from './transactions-list.component';

@Directive({ selector: 'button[hdTransactionsListTrigger]' })
export class HdTransactionsListTriggerDirective {
  @HostListener('click') onClick() {
    this._matBottomSheet.open(HdTransactionsListComponent);
  }

  constructor(private readonly _matBottomSheet: MatBottomSheet) {}
}
