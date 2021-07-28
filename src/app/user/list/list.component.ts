import { Component, OnInit, OnDestroy } from "@angular/core";

import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmDialogComponent } from "src/app/common/confirm-dialog/confirm-dialog.component";
import { AppService, User } from "src/app/core/app.service";

declare var device;
@Component({
    templateUrl: './list.component.html'
})
export class ListComponent implements OnInit, OnDestroy {
    isLoading = false;
    error: any = '';

    mainTable= {
        displayedColumns: ['Actions', 'Email', 'FirstName', 'LastName', 'Delete'],
        dataSource: new MatTableDataSource<User>()
    };

    constructor(private dialog: MatDialog, private as: AppService) {}

    ngOnInit(){
        this.getMainTableData();
    }

    getMainTableData() {
        this.as.getUsersList(this).then((res: User[]) => {
            this.mainTable.dataSource.data = res;
        });
    }

    ngOnDestroy() {
        //
    }

    onDeleteClick(id: number) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent);

        dialogRef.afterClosed().subscribe(dialogResult => {
            if (dialogResult) {
                this.as.deleteUser(this, id).then(res => {
                    this.getMainTableData();
                });         
            }
        });
    }
}
