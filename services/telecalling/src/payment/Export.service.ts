// export.service.ts

import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  async exportPayments(res: Response, payments: any[]) {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Payments');
    
    // Columns
    worksheet.columns = [
      { header: 'Phone Number', key: 'phoneNumber', width: 20 },
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Receipt Number', key: 'receipt_number', width: 25 },
      { header: 'Transaction ID', key: 'transaction_id', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Payment Date', key: 'payment_date', width: 25 },
      { header: 'Payment Purpose', key: 'payment_perpose', width: 25 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Add rows
    payments.forEach((payment) => {
      worksheet.addRow({
        amount: payment.amount,
        payment_date: new Date(payment.paymentDate),
        receipt_number: payment.receiptNumber,
        transaction_id: payment.transactionId,
        student_id: payment.studentId,
        student_name: payment.studentName,
        notes: payment.notes,
        status: payment.status,
        payment_perpose: payment.paymentPerpose,
        phoneNumber: payment.phoneNumber,
      });
    });

    // Header style
    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFF' },
    };

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F4E78' },
    };

    // Date format
    worksheet.getColumn('payment_date').numFmt = 'dd-mm-yyyy hh:mm:ss';

    // Center align
    worksheet.eachRow((row) => {
      row.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    });

    // Response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=payments.xlsx',
    );

    // Export
    await workbook.xlsx.write(res);

    res.end();
  }
}