import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemComponent } from './user/item/item.component';
import { ListComponent } from './user/list/list.component';


const routes: Routes = [
    { path: 'item/:id', component: ItemComponent },
    { path: '', component: ListComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
