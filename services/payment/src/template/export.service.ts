/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import PDFDocument, { lineGap } from 'pdfkit';
import fs from 'fs';
import path from 'path';

@Injectable()
export class IncoiveService {
  // ─── Layout Constants ─────────────────────────────────────────────────────────
  PW = 595.28; // A4 width pt
  PH = 841.89; // A4 height pt
  TEXT_DARK = '#1A1A1A';
  TEXT_WHITE = '#FFFFFF';

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  fmtAmount(val) {
    if (val === undefined || val === null || val === '') return '';
    return Number(val).toLocaleString('en-IN');
  }

  /** * Core helper to print values on top of the background image.
   * Modify the font size or color here if needed.
   */
  printValue(doc, text, x, y, opts = {}, color = this.TEXT_DARK, fontSize = 9) {
    if (!text) return;
    doc
      .save()
      .fontSize(fontSize)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(text, x, y, opts)
      .restore();
  }

  // ─── Main Generator ──────────────────────────────────────────────────────────

  generateInvoice = (data) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        const buffers = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk as never));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // ══════════════════════════════════════════════════════════════════════
        // 1. RENDER BACKGROUND TEMPLATE
        // ══════════════════════════════════════════════════════════════════════
        const bgPath = path.join(process.cwd(), 'public', 'letterhead.jpeg');

        if (fs.existsSync(bgPath)) {
          doc.image(bgPath, 0, 0, { width: this.PW, height: this.PH });
        } else {
          console.warn(
            'Background image Picture1.jpg not found in public folder!',
          );
        }

        // ══════════════════════════════════════════════════════════════════════
        // 2. HEADER DETAILS
        // ══════════════════════════════════════════════════════════════════════
        this.printValue(
          doc,
          data.invoiceId || '',
          143.95,
          105.3,
          {},
          '#1A6E82',
          12,
        );
        this.printValue(
          doc,
          this.fmtDate(data.invoiceDate),
          397.1,
          105.3,
          {},
          '#1A6E82',
          12,
        );

        // ══════════════════════════════════════════════════════════════════════
        // 3. INVOICE TO SECTION (Student Details)
        // ══════════════════════════════════════════════════════════════════════
        // Row 1
        this.printValue(
          doc,
          data.studentName || '',
          119.5,
          152.95,
          {},
          '#000000',
          12,
        );

        // Row 2
        this.printValue(
          doc,
          data.registrationNo || '',
          123.25,
          175.5,
          {},
          '#000000',
          12,
        );
        this.printValue(
          doc,
          data.mobileNo || '',
          381.1,
          174.2,
          {},
          '#000000',
          12,
        );

        // Row 3
        this.printValue(doc, data.emailId || '', 81, 196, {}, '#000000', 12);
        this.printValue(
          doc,
          data.qualifications || '',
          402.85,
          196.2,
          {},
          '#000000',
          12,
        );

        // Row 4
        this.printValue(
          doc,
          data.dateOfBirth ? this.fmtDate(data.dateOfBirth) : '',
          109.95,
          217.55,
          {},
          '#000000',
          12,
        );
        this.printValue(doc, data.gender || '', 371, 217.2, {}, '#000000', 12);

        // Row 5
        this.printValue(
          doc,
          data.fatherName || '',
          110,
          237.5,
          {},
          '#000000',
          12,
        );
        this.printValue(
          doc,
          data.motherName || '',
          368.95,
          237.25,
          {},
          '#000000',
          12,
        );

        // Row 6
        this.printValue(
          doc,
          data.parentMobile || '',
          141.5,
          260.94,
          {},
          '#000000',
          12,
        );

        // Row 7 (Addresses - utilizing width to allow text wrapping)
        this.printValue(
          doc,
          data.currentAddress || '',
          28.95,
          296.9,
          {
            width: 300,
          },
          '#000000',
          12,
        );
        this.printValue(
          doc,
          data.permanentAddress || '',
          302.3,
          296.45,
          {
            width: 300,
          },
          '#000000',
          12,
        );

        // Row 8
        this.printValue(
          doc,
          data.courseSelected || '',
          122.3,
          347.2,
          {},
          '#000000',
          12,
        );

        // Row 9
        this.printValue(
          doc,
          data.modeOfTraining || '',
          125.95,
          373.9,
          {},
          '#000000',
          12,
        );
        this.printValue(
          doc,
          data.modeOfPayment || '',
          401.3,
          374.2,
          {},
          '#000000',
          12,
        );

        // ══════════════════════════════════════════════════════════════════════
        // 4. FEES DETAILS
        // ══════════════════════════════════════════════════════════════════════
        // Values are printed in white as they sit on top of the teal background
        this.printValue(
          doc,
          this.fmtAmount(data.totalCourseFees),
          158.5,
          422.75,
          {},
          this.TEXT_WHITE,
          12,
        );

        this.printValue(
          doc,
          this.fmtAmount(data.registrationFees),
          152.95,
          448,
          {},
          this.TEXT_WHITE,
          12,
        );
        this.printValue(
          doc,
          this.fmtAmount(data.trainingFees),
          416,
          448,
          {},
          this.TEXT_WHITE,
          12,
        );

        this.printValue(
          doc,
          this.fmtAmount(data.totalFeesPaid),
          143.35,
          475,
          {},
          this.TEXT_WHITE,
          12,
        );
        this.printValue(
          doc,
          this.fmtAmount(data.pendingFees),
          413.95,
          474.5,
          {},
          this.TEXT_WHITE,
          12,
        );

        this.printValue(
          doc,
          data.remarks || '',
          98.95,
          499.95,
          { width: 440 },
          this.TEXT_WHITE,
          12,
        );

        // ══════════════════════════════════════════════════════════════════════
        // 5. LINE ITEMS TABLE
        // ══════════════════════════════════════════════════════════════════════
        const items = data.items || [];
        let itemY = 590; // Starting Y position for the first line item
        const rowHeight = 27; // Spacing between each row

        // Only iterate up to 3 items to fit the template structure
        for (let i = 0; i < Math.min(items.length, 3); i++) {
          const item = items[i];
          if (item) {
            // Sl.No
            this.printValue(
              doc,
              String(item.slNo || i + 1),
              53.95,
              itemY,
              { width: 40, align: 'center' },
              '#1A6E82',
              10,
            );
            // Description
            this.printValue(
              doc,
              item.description || '',
              90,
              itemY,
              { width: 250 },
              '#1A6E82',
              10,
            );
            // Amount
            this.printValue(
              doc,
              this.fmtAmount(item.amount),
              450,
              itemY,
              { width: 70, align: 'center' },
              '#1A6E82',
              10,
            );
          }
          itemY += rowHeight;
        }

        // ══════════════════════════════════════════════════════════════════════
        // 6. TOTAL & NOTES
        // ══════════════════════════════════════════════════════════════════════
        // Notes Section
        if (data.note) {
          this.printValue(
            doc,
            data.note,
            46.5,
            676.5,
            { width: 200, lineGap: 6 },
            '#1A6E82',
            10,
          );
        }

        // Total Amount inside the rounded pill
        this.printValue(
          doc,
          this.fmtAmount(data.totalAmount),
          408.95,
          666,
          { width: 100, align: 'center' },
          this.TEXT_WHITE,
          18,
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  };
}
