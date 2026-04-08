export class CreatePaymentDto {
  amount!: number;
  paymentDate!: Date;
  paymentMode!: string;
  transactionId!: string;
  collectedBy!: string;
  studentId!: string;
  studentName!: string;
  notes!: string;
  phoneNumber!: string;
}

export class CreateGRPCdto {
  admissionFees!: number;
  paymentDate!: Date;
  paymentMode!: string;
  transactionId!: string;
  telecallerId!: string;
  studentId!: string;
  studentName!: string;
  remarks!: string;
  phoneNumber!: string;
}
