import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { EditCollectionAttributeTriggerDirective } from './edit-collection-attribute-trigger.directive';
import { EditCollectionAttributeComponent } from './edit-collection-attribute.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
  ],
  declarations: [
    EditCollectionAttributeComponent,
    EditCollectionAttributeTriggerDirective,
  ],
  exports: [EditCollectionAttributeTriggerDirective],
})
export class EditCollectionAttributeModule {}
