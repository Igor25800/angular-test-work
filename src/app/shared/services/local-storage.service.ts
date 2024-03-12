import { Injectable } from '@angular/core';
import {CertInterface} from "../interfaces/certificate.interface";

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  getCert(): Array<CertInterface> {
    return JSON.parse(localStorage.getItem('cert') as string) ;
  }

  setLocalStorageCert(cert: Array<CertInterface>): void {
    localStorage.setItem('cert', JSON.stringify(cert));
  }
}
