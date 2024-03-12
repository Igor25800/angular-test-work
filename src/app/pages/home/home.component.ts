import {Component, OnInit} from '@angular/core';
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import moment from 'moment';
import {CertInterface} from "../../shared/interfaces/certificate.interface";
import {LocalStorageService} from "../../shared/services/local-storage.service";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})

export class HomeComponent implements OnInit {

  certificateInfo: CertInterface[] = [];
  fileName = 'Выберите через стандартний діалог';
  selectedId!: number | null;
  isAddCet = false;
  nameBtn = 'Додати'
  selectedCert!: CertInterface | null;

  constructor(private localStorage: LocalStorageService) {
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && this.localStorage?.getCert()?.length) {
      this.certificateInfo = this.localStorage.getCert();
    }
  }

  selected(event: number, cert: CertInterface): void {
    this.selectedId = event;
    this.selectedCert = cert;
    this.nameBtn = 'Додати'
  }

  addCert(): void {
    this.isAddCet = !this.isAddCet;
    if (this.nameBtn === 'Назад') {
      this.nameBtn = 'Додати'
      return;
    }
    this.selectedId = null
    this.isAddCet = true;
    this.selectedCert = null;
    this.nameBtn = 'Назад'


  }

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file: File = fileList[0];
      this.fileName = file.name;
      this._parseCertificate(file);
    }
  }
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleDroppedFiles(files);
    }
  }

  handleDroppedFiles(files: FileList): void {
    const file: File = files[0];
    this._parseCertificate(file);
  }

  private _parseCertificate(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const derCertificate = new Uint8Array(arrayBuffer);
      const asn1 = asn1js.fromBER(derCertificate);
      if (asn1.offset === -1) {
        console.error('Error parsing ASN.1 data');
        return;
      }
      const certificate = new pkijs.Certificate({ schema: asn1.result });
      const commonName = this._commonName(certificate.subject);
      const issuerCN = this._commonName(certificate.issuer);
      const {before,after} = this._date(certificate);
      const from =  moment(before).format('YYYY MM DD');
      const to =  moment(after).format('YYYY MM DD');
      const cert = {commonName, issuerCN, from, to};
      const relatedName = this.certificateInfo
        .find(cert => cert.commonName?.toLowerCase() === commonName?.toLowerCase())
      if (relatedName) {
        alert('існує вже такий Сертифікат')
        return;
      }
      this.certificateInfo.push(cert);
      this.localStorage.setLocalStorageCert(this.certificateInfo);
    };
    reader.readAsArrayBuffer(file);
  }

  private _commonName(nameProperty: any): string | null {
    if (!nameProperty || !nameProperty.typesAndValues) {
      return null;
    }
    const commonNameEntry = nameProperty.typesAndValues.find((entry: any) => entry.type === '2.5.4.3');
    return commonNameEntry ? commonNameEntry.value.valueBlock.value : null;
  }

  private _date(certificate: any): { before: Date | null, after: Date | null } {
    if (!certificate || !certificate.notBefore || !certificate.notAfter) {
      return { before: null, after: null };
    }
    const before = certificate.notBefore.value;
    const after = certificate.notAfter.value;
    return { before, after };
  }
}
