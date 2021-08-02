import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

import { timer } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import users from './users-2.v1.json';

import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

export const METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
};

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    dateOfBirth: string;
    createDate: string;
}

declare var navigator;

@Injectable({
    providedIn: 'root'
})
export class AppService {
    dbName = 'Test';
    storeName = 'Users';
    connection: IDBDatabase;
    idDataLoaded = false;

    constructor(private location: Location, private http: HttpClient) {
        this.connectToLocalDb().then(async () => {
            const usersData = users.paths["/users"].get.responses[200].content["application/json"].schema.items["x-examples"];
            let usersArr = [];
            for(let user in usersData) {
                usersArr.push(usersData[user]);
            }

            for (let i=0;i<usersArr.length;i++) {
                await this.put(usersArr[i].id, usersArr[i]);
            }
            this.idDataLoaded = true;
        })
    }

    async request(parent: any, method: string, params: any = null): Promise<any> {
        return new Promise(resolve => {
            resolve(false);
            try {
                switch(method) {
                    case METHOD.GET: 
                        this.http.get('https://api-mock.hwbe.io/testapp/userId').subscribe(res => {
                            resolve(res);
                        },
                        err => {
                            parent.error = err.message;
                            resolve(false);
                        });
                        break;
                    
                    case METHOD.POST:
                        this.http.post('https://api-mock.hwbe.io/testapp/userId', null, { params }).subscribe(res => {
                            resolve(res);
                        },
                        err => {
                            parent.error = err.message;
                            resolve(false);
                        });
                        break;
    
                    case METHOD.PUT:
                        this.http.put('https://api-mock.hwbe.io/testapp/userId', null, { params }).subscribe(res => {
                            resolve(res);
                        },
                        err => {
                            parent.error = err.message;
                            resolve(false);
                        });
                        break;
    
                    case METHOD.DELETE:
                        this.http.delete('https://api-mock.hwbe.io/testapp/userId', { params }).subscribe(res => {
                            resolve(res);
                        },
                        err => {
                            parent.error = err.message;
                            resolve(false);
                        });
                        break;

                        default: resolve(false);
                }
            } catch (e) {
                resolve(false);
            }
        })

    }

    async getUsersList(parent: any): Promise<User[]> {
        return new Promise(async resolve => {
            let result: any;
            if (await this.checkConnection()) {
                result = await this.request(parent, METHOD.GET);
            }
            if (!result) {
                if (this.idDataLoaded) {
                    result = await this.getAll();
                    resolve(result);
                } else {
                    timer(0, 500)
                        .pipe(takeWhile(() => !this.idDataLoaded, true))
                        .subscribe(async () => {
                            if (this.idDataLoaded) {
                                result = await this.getAll();
                                resolve(result);
                            }
                        });
                }
            } else {
                resolve(result);
            }
        });
    }

    async getUserByID(parent: any, ID: number) {
        let result: any;
        if (await this.checkConnection()) {
            result = await this.request(parent, METHOD.POST, { ID });
        }
        if (!result) {
            return await this.get(ID);
        }
        return result;
    }

    async addUser(parent: any, params: {ID:number, Email:string, FirstName:string, LastName:string, DateOfBirth:string}) {
        let result, ID = Number((Math.random() * 100).toFixed(0));
        if (await this.checkConnection()) {
            result = await this.request(parent, METHOD.POST, params);
            if (result && result['id']) {
                ID = result['id'];
            }
        } else {
            this.saveAction({operation: 'add', params});
        }

        const user = {
            id: ID, 
            email: params.Email, 
            firstName: params.FirstName, 
            lastName: params.LastName, 
            dateOfBirth: params.DateOfBirth,
            emailVerified: true,
            createDate: moment().format("YYYY-MM-DD")
        };

        await this.put(ID, user);
        
        return true;
    }

    async editUser(parent: any, params: {ID:number, Email:string, FirstName:string, LastName:string, DateOfBirth:string, DateOfCreate: string}) {
        console.log(this);
        if (await this.checkConnection()) {
            await this.request(parent, METHOD.PUT, params);
        } else {
            this.saveAction({operation: 'edit', params});
        }

        await this.put(params.ID, {
            id: params.ID,
            firstName: params.FirstName,
            lastName: params.LastName,
            email: params.Email,
            dateOfBirth: params.DateOfBirth,
            createDate: params.DateOfCreate,
            emailVerified: true
        })

        return true;
    }

    async deleteUser(parent: any, ID: number) {
        if (await this.checkConnection()) {
            await this.request(parent, METHOD.DELETE, { ID });
        } else {
            this.saveAction({operation: 'delete', params: {id: ID}});
        }

        await this.delete(ID);

        return true;
    }

    goBack(){
        this.location.back();
    }

    async connectToLocalDb() {
        return new Promise(resolve => {
            if (!this.connection) {
                const request = indexedDB.open(this.dbName, 1);

                request.onerror = function() {
                    console.error('Message: '+request.error.message);
                };
    
                request.onsuccess = () => {
                    this.connection = request.result;
                    resolve(true);
                };
    
                request.onupgradeneeded = () => {
                    if (!request.result.objectStoreNames.contains(this.storeName)) {
                        const objectStore = request.result.createObjectStore(this.storeName);
                        // objectStore.createIndex('id', 'id', {unique: true});   
                    }
                };
            } else {
                resolve(true);
            }
        })
    }

    put(key: number, value: any) {
        return new Promise(async (resolve) => {
            await this.connectToLocalDb();

            const transaction = this.connection.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
            
            request.onsuccess = function() {
                resolve(true);
            };
        });
    }

    get(key: number) {
        return new Promise(async (resolve) => {
            await this.connectToLocalDb();

            const transaction = this.connection.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
        });
    }

    delete(key: number) {
        return new Promise(async (resolve) => {
            if (!this.connection) { await this.connectToLocalDb(); }

            const transaction = this.connection.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onsuccess = function() {
                resolve(true);
            };
        });
    }

    getAll() {
        return new Promise(async (resolve) => {
            await this.connectToLocalDb();

            const transaction = this.connection.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = function() {
                resolve(request.result);
            };
        });
    }

    async checkConnection() {
        const Connection = {
            UNKNOWN: "UNKNOWN",
            ETHERNET: "ETHERNET",
            WIFI: "WIFI",
            CELL_2G: "CELL_2G",
            CELL_3G: "CELL_3G",
            CELL_4G: "CELL_4G",
            CELL: "CELL",
            NONE: "NONE"
        };

        let networkState;
        if (navigator && navigator.connection && (navigator.connection.type !== undefined)) {
            networkState = navigator.connection.type;
        }
        
        /* var states = {};
        states[Connection.UNKNOWN]  = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI]     = 'WiFi connection';
        states[Connection.CELL_2G]  = 'Cell 2G connection';
        states[Connection.CELL_3G]  = 'Cell 3G connection';
        states[Connection.CELL_4G]  = 'Cell 4G connection';
        states[Connection.CELL]     = 'Cell generic connection';
        states[Connection.NONE]     = 'No network connection'; */
    
        if (!networkState || [Connection.UNKNOWN, Connection.CELL, Connection.NONE].includes(networkState)) {
            return false;
        }
        await this.executeActions();
        return true;
    }

    saveAction(action: any) {
        const savedActions = localStorage.getItem('actions');

        if (savedActions) {
            const actionsArr = JSON.parse(savedActions);
            actionsArr.push(action);
            localStorage.setItem('actions', JSON.stringify(actionsArr));
        } else {
            localStorage.setItem('actions', JSON.stringify([action]));
        }
    }

    async executeActions() {
        const savedActions = localStorage.getItem('actions');

        if (savedActions) {
            const actionsArr = JSON.parse(savedActions);
            if (actionsArr && Array.isArray(actionsArr) &&(actionsArr.length > 0)) {
                const action = actionsArr.shift();
                switch(action.operation) {
                    case 'add':
                        const result = await this.request({}, METHOD.POST, action.params);
                        const ID = result['id'];
                        
                        const localUsers = await this.getUsersList({});
                        const addedUser = localUsers.filter((el: User) => (el.email === action.params.Email) && 
                                                                  (el.firstName === action.params.FirstName) && 
                                                                  (el.lastName === action.params.LastName));

                        // if user not found maybe he was deleted locally, in this case we don't do anything
                        if (addedUser && addedUser[0] && addedUser[0].id) {
                            await this.deleteUser({}, addedUser[0].id);

                            const user = {
                                id: ID, 
                                email: action.params.Email, 
                                firstName: action.params.FirstName, 
                                lastName: action.params.LastName, 
                                dateOfBirth: action.params.DateOfBirth,
                                emailVerified: true,
                                createDate: moment().format("YYYY-MM-DD")
                            };

                            await this.put(ID, user);
                        }
                        break;

                    case 'edit':
                        await this.request({}, METHOD.PUT, action.params);
                        break;

                    case 'delete':
                        await this.request(parent, METHOD.DELETE, { ID: action.params.id });
                        break;
                }

                if (actionsArr.length > 0) {
                    localStorage.setItem('actions', JSON.stringify(actionsArr));
                    await this.executeActions();
                } else {
                    localStorage.removeItem('actions');
                }
            }
        }
    }
}
