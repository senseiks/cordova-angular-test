import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

import * as moment from "moment";

import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { AppService, User } from "src/app/core/app.service";

const MY_FORMATS = {
    parse: {
      dateInput: 'DD-MM-YYYY',
    },
    display: {
      dateInput: 'DD-MM-YYYY',
      monthYearLabel: 'MMM YYYY',
      dateA11yLabel: 'DD-MM-YYYY',
      monthYearA11yLabel: 'MMMM YYYY',
    },
};

@Component({
    templateUrl: './item.component.html',
    providers: [
        {
          provide: DateAdapter,
          useClass: MomentDateAdapter,
          deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },
        {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    ]
})
export class ItemComponent implements OnInit {
    recordID = 0;
    isLoading = false;
    error: any = '';
    isNewMode = false;

    mainForm = this.fb.group({
        Email: ['', [Validators.email, Validators.required]],
        FirstName: ['', Validators.required],
        LastName: ['', Validators.required],
        DateOfBirth: ['', Validators.required],
        DateOfRegistration: ['', {Disabled: true}]
    });

    constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router,
        private as: AppService
    ) {
        //
    }

    ngOnInit(){
        const id = this.route.snapshot.params.id;
        if (id === 'new') { 
            this.isNewMode = true; 
        } else {
            this.recordID = Number(id);
        }
        if (!this.isNewMode && isNaN(this.recordID)) { this.cancel(); }

        if (!this.isNewMode) {
            this.as.getUserByID(this, this.recordID).then((res: User) => {
                this.mainForm.controls.FirstName.setValue(res.firstName);
                this.mainForm.controls.LastName.setValue(res.lastName);
                this.mainForm.controls.Email.setValue(res.email);
                this.mainForm.controls.DateOfBirth.setValue(res.dateOfBirth);
                this.mainForm.controls.DateOfRegistration.setValue(res.createDate)
            });
        }
    }

    submit() {
        if (!this.mainForm.valid) { 
            return; 
        }

        this.isLoading = true;
        const params = {
            "ID": this.recordID,
            "Email": this.mainForm.controls.Email.value,
            "FirstName": this.mainForm.controls.FirstName.value,
            "LastName": this.mainForm.controls.LastName.value,
            "DateOfBirth": moment(this.mainForm.controls.DateOfBirth.value).format('YYYY-MM-DD'),
            "DateOfCreate": this.mainForm.controls.DateOfRegistration.value
        };

        if (this.isNewMode) {
            this.as.addUser(this, params).then(() => {
                this.isLoading = false;
                this.cancel();
            });
        } else {
            this.as.editUser(this, params).then(() => {
                this.isLoading = false;
                this.cancel();
            });
        }
    }

    cancel() {
       this.as.goBack();
    }
}
