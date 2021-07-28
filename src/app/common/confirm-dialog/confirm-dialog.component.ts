import {Component, Inject} from '@angular/core';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
    data = {
        title: 'Are you sure?',
        content: 'Do you want to delete this user?',
        trueButton: 'Yes',
        falseButton: 'No'
    };

    constructor() {
        //
    }
}
