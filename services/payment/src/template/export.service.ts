/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

@Injectable()
export class IncoiveService {
  // ─── Color Palette ────────────────────────────────────────────────────────────
  TEAL = '#1A6E82'; // dark teal (headers, borders)
  TEAL_LIGHT = '#2A8FA8'; // lighter teal (section headings)
  GOLD = '#C8A84B'; // dashed-border accent
  WHITE = '#FFFFFF';
  TEXT_DARK = '#1A1A1A';
  TEXT_TEAL = '#1A6E82';

  // ─── Layout Constants ─────────────────────────────────────────────────────────
  PW = 595.28; // A4 width pt
  PH = 841.89; // A4 height pt
  ML = 30; // left margin
  MR = this.PW - 30; // right margin
  CW = this.MR - this.ML; // content width

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

  /** Draw a filled rounded rectangle */
  roundRect(doc, x, y, w, h, r, fillColor, strokeColor) {
    doc.save();
    if (strokeColor) doc.strokeColor(strokeColor);
    if (fillColor) doc.fillColor(fillColor);
    doc.roundedRect(x, y, w, h, r);
    if (fillColor && strokeColor) doc.fillAndStroke();
    else if (fillColor) doc.fill();
    else doc.stroke();
    doc.restore();
  }

  /** Draw a simple filled rect */
  fillRect(doc, x, y, w, h, color) {
    doc.save().fillColor(color).rect(x, y, w, h).fill().restore();
  }

  /** Draw a dashed horizontal border line */
  dashedLine(doc, x1, y, x2, color = this.GOLD) {
    doc
      .save()
      .strokeColor(color)
      .lineWidth(1)
      .dash(4, { space: 3 })
      .moveTo(x1, y)
      .lineTo(x2, y)
      .stroke()
      .undash()
      .restore();
  }

  /** Draw solid horizontal line */
  solidLine(doc, x1, y, x2, width = 1, color = this.TEAL) {
    doc
      .save()
      .strokeColor(color)
      .lineWidth(width)
      .moveTo(x1, y)
      .lineTo(x2, y)
      .stroke()
      .restore();
  }

  /** Draw solid vertical line */
  vertLine(doc, x, y1, y2, width = 0.5, color = this.TEAL) {
    doc
      .save()
      .strokeColor(color)
      .lineWidth(width)
      .moveTo(x, y1)
      .lineTo(x, y2)
      .stroke()
      .restore();
  }

  /** Cell label text in teal */
  cellLabel(doc, text, x, y) {
    doc
      .save()
      .fontSize(8)
      .font('Helvetica')
      .fillColor(this.TEXT_TEAL)
      .text(text, x, y)
      .restore();
  }

  /** Cell value text in dark */
  cellValue(doc, text, x, y, opts = {}) {
    doc
      .save()
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor(this.TEXT_DARK)
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

        // ── Optionally draw letterhead background ──────────────────────────────
        const letterheadPath = path.join(
          process.cwd(),
          'public',
          'letterhead.png',
        );
        if (fs.existsSync(letterheadPath)) {
          doc.image(letterheadPath, 0, 0, { width: this.PW, height: this.PH });
        }

        // ══════════════════════════════════════════════════════════════════════
        // HEADER SECTION
        // ══════════════════════════════════════════════════════════════════════
        let y = 20;

        // "INVOICE" text (top right) — big teal word
        doc
          .save()
          .fontSize(38)
          .font('Helvetica-Bold')
          .fillColor(this.TEAL)
          .text('INVOICE', this.ML + 360, y + 8, {
            width: this.CW - 360,
            align: 'right',
          })
          .restore();

        // Company block (top left) — text only, no logo
        doc
          .save()
          .fontSize(13)
          .font('Helvetica-Bold')
          .fillColor(this.TEAL)
          .text('PATRON INTERNATIONAL', this.ML, y + 6)
          .restore();

        doc
          .save()
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(this.TEAL)
          .text('Institute of Vocational Education', this.ML, y + 22)
          .text('An ISO 9001 : 2015 Certified Organisation', this.ML, y + 32)
          .restore();

        y += 65;

        // ── Top border line ───────────────────────────────────────────────────
        this.solidLine(doc, this.ML, y, this.MR, 1.5, this.TEAL);
        y += 8;

        // ── Invoice ID & Date row ─────────────────────────────────────────────
        doc
          .save()
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(this.TEAL)
          .text(`INVOICE ID : #${data.invoiceId || ''}`, this.ML, y)
          .restore();

        doc
          .save()
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(this.TEAL)
          .text(
            `INVOICE DATE :  ${this.fmtDate(data.invoiceDate)}`,
            this.ML + 250,
            y,
          )
          .restore();

        y += 18;
        this.solidLine(doc, this.ML, y, this.MR, 1, this.TEAL);
        y += 8;

        // ══════════════════════════════════════════════════════════════════════
        // INVOICE TO SECTION
        // ══════════════════════════════════════════════════════════════════════
        doc
          .save()
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(this.TEAL)
          .text('INVOICE TO', this.ML, y)
          .restore();
        y += 14;

        // Outer border
        const tableTop = y;
        const tableBottom = y + 192;
        doc
          .save()
          .strokeColor(this.TEAL)
          .lineWidth(1)
          .rect(this.ML, tableTop, this.CW, tableBottom - tableTop)
          .stroke()
          .restore();

        // ── Row 1: Student's Name ─────────────────────────────────────────────
        const R1_H = 20;
        this.fillRect(doc, this.ML, y, this.CW, R1_H, '#EAF5F8');
        this.solidLine(doc, this.ML, y + R1_H, this.MR, 0.5, this.TEAL);
        this.cellLabel(doc, "Student's Name :", this.ML + 4, y + 4);
        this.cellValue(doc, data.studentName || '', this.ML + 90, y + 5);
        y += R1_H;

        // ── Row 2: Registration No | Mobile No ───────────────────────────────
        const R2_H = 18;
        const midX = this.ML + this.CW / 2;
        this.solidLine(doc, this.ML, y + R2_H, this.MR, 0.5, this.TEAL);
        this.vertLine(doc, midX, y, y + R2_H);
        this.cellLabel(doc, 'Registration No :', this.ML + 4, y + 4);
        this.cellValue(doc, data.registrationNo || '', this.ML + 90, y + 5);
        this.cellLabel(doc, 'Mobile No :', midX + 4, y + 4);
        this.cellValue(doc, data.mobileNo || '', midX + 70, y + 5);
        y += R2_H;

        // ── Row 3: Email | Qualifications ────────────────────────────────────
        this.solidLine(doc, this.ML, y + R2_H, this.MR, 0.5, this.TEAL);
        this.vertLine(doc, midX, y, y + R2_H);
        this.cellLabel(doc, 'Email Id :', this.ML + 4, y + 4);
        this.cellValue(doc, data.emailId || '', this.ML + 50, y + 5);
        this.cellLabel(doc, 'Qualifications :', midX + 4, y + 4);
        this.cellValue(doc, data.qualifications || '', midX + 80, y + 5);
        y += R2_H;

        // ── Row 4: DOB | Gender ───────────────────────────────────────────────
        this.solidLine(doc, this.ML, y + R2_H, this.MR, 0.5, this.TEAL);
        this.vertLine(doc, midX, y, y + R2_H);
        this.cellLabel(doc, 'Date of Birth :', this.ML + 4, y + 4);
        this.cellValue(
          doc,
          data.dateOfBirth ? this.fmtDate(data.dateOfBirth) : '',
          this.ML + 80,
          y + 5,
        );
        this.cellLabel(doc, 'Gender :', midX + 4, y + 4);
        this.cellValue(doc, data.gender || '', midX + 50, y + 5);
        y += R2_H;

        // ── Row 5: Father | Mother ────────────────────────────────────────────
        this.solidLine(doc, this.ML, y + R2_H, this.MR, 0.5, this.TEAL);
        this.vertLine(doc, midX, y, y + R2_H);
        this.cellLabel(doc, 'Father Name :', this.ML + 4, y + 4);
        this.cellValue(doc, data.fatherName || '', this.ML + 75, y + 5);
        this.cellLabel(doc, 'Mother Name :', midX + 4, y + 4);
        this.cellValue(doc, data.motherName || '', midX + 75, y + 5);
        y += R2_H;

        // ── Row 6: Parent's Mobile ────────────────────────────────────────────
        this.solidLine(doc, this.ML, y + R2_H, this.MR, 0.5, this.TEAL);
        this.cellLabel(doc, "Parent's Mobile No :", this.ML + 4, y + 4);
        this.cellValue(doc, data.parentMobile || '', this.ML + 105, y + 5);
        y += R2_H;

        // ── Row 7: Address (taller) ───────────────────────────────────────────
        const R7_H = 40;
        this.solidLine(doc, this.ML, y + R7_H, this.MR, 0.5, this.TEAL);
        this.vertLine(doc, midX, y, y + R7_H);
        this.cellLabel(doc, 'Current Address :', this.ML + 4, y + 4);
        this.cellValue(doc, data.currentAddress || '', this.ML + 4, y + 14, {
          width: midX - this.ML - 8,
        });
        this.cellLabel(doc, 'Permanent Address :', midX + 4, y + 4);
        this.cellValue(doc, data.permanentAddress || '', midX + 4, y + 14, {
          width: this.MR - midX - 8,
        });
        y += R7_H;

        // ── Row 8: Course Selected ────────────────────────────────────────────
        this.solidLine(doc, this.ML, y + R2_H, this.MR, 0.5, this.TEAL);
        this.cellLabel(doc, 'Course Selected :', this.ML + 4, y + 4);
        this.cellValue(doc, data.courseSelected || '', this.ML + 90, y + 5);
        y += R2_H;

        // ── Row 9: Mode of Training | Mode of Payment ────────────────────────
        this.vertLine(doc, midX, y, y + R2_H);
        this.cellLabel(doc, 'Mode of Training :', this.ML + 4, y + 4);
        this.cellValue(doc, data.modeOfTraining || '', this.ML + 95, y + 5);
        this.cellLabel(doc, 'Mode of Payment :', midX + 4, y + 4);
        this.cellValue(doc, data.modeOfPayment || '', midX + 95, y + 5);
        y += R2_H;

        // ══════════════════════════════════════════════════════════════════════
        // FEES DETAILS SECTION
        // ══════════════════════════════════════════════════════════════════════
        y += 8;
        doc
          .save()
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(this.TEAL)
          .text('FEES DETAILS', this.ML, y)
          .restore();
        y += 12;

        // Row: Total Course Fees (full width, teal bg)
        const FEE_H = 18;
        this.fillRect(doc, this.ML, y, this.CW, FEE_H, this.TEAL);
        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(
            `Total Course Fees : \u20B9  ${this.fmtAmount(data.totalCourseFees)}`,
            this.ML + 6,
            y + 5,
          )
          .restore();
        this.dashedLine(doc, this.ML, y + FEE_H, this.MR, this.GOLD);
        y += FEE_H;

        // Row: Registration Fees | Training Fees
        this.fillRect(doc, this.ML, y, this.CW, FEE_H, this.TEAL);
        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(
            `Registration Fees : \u20B9  ${this.fmtAmount(data.registrationFees)}`,
            this.ML + 6,
            y + 5,
          )
          .restore();
        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(
            `Training Fees : \u20B9  ${this.fmtAmount(data.trainingFees)}`,
            midX + 6,
            y + 5,
          )
          .restore();
        // Vertical divider
        doc
          .save()
          .strokeColor(this.GOLD)
          .lineWidth(1)
          .moveTo(midX, y)
          .lineTo(midX, y + FEE_H)
          .stroke()
          .restore();
        this.dashedLine(doc, this.ML, y + FEE_H, this.MR, this.GOLD);
        y += FEE_H;

        // Row: Total Fees Paid | Pending Fees
        this.fillRect(doc, this.ML, y, this.CW, FEE_H, this.TEAL);
        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(
            `Total Fees Paid : \u20B9  ${this.fmtAmount(data.totalFeesPaid)}`,
            this.ML + 6,
            y + 5,
          )
          .restore();
        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(
            `Pending Fees : \u20B9  ${this.fmtAmount(data.pendingFees)}`,
            midX + 6,
            y + 5,
          )
          .restore();
        doc
          .save()
          .strokeColor(this.GOLD)
          .lineWidth(1)
          .moveTo(midX, y)
          .lineTo(midX, y + FEE_H)
          .stroke()
          .restore();
        this.dashedLine(doc, this.ML, y + FEE_H, this.MR, this.GOLD);
        y += FEE_H;

        // Row: Remarks (taller, teal bg)
        const REM_H = 36;
        this.fillRect(doc, this.ML, y, this.CW, REM_H, this.TEAL);
        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(`Remarks :  ${data.remarks || ''}`, this.ML + 6, y + 5, {
            width: this.CW - 12,
          })
          .restore();
        y += REM_H + 10;

        // ══════════════════════════════════════════════════════════════════════
        // LINE ITEMS TABLE
        // ══════════════════════════════════════════════════════════════════════
        const COL_SL = 45;
        const COL_DESC = this.CW - COL_SL - 80;
        const COL_AMT = 80;

        // Header row
        const LH_H = 20;
        this.fillRect(doc, this.ML, y, this.CW, LH_H, this.TEAL);
        this.roundRect(
          doc,
          this.ML,
          y,
          COL_SL + 2,
          LH_H,
          3,
          this.TEAL_LIGHT,
          null,
        );
        doc
          .save()
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text('Sl.No', this.ML + 5, y + 6, {
            width: COL_SL - 4,
            align: 'center',
          })
          .restore();
        doc
          .save()
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text('Descriptions', this.ML + COL_SL + 6, y + 6, {
            width: COL_DESC - 8,
            align: 'center',
          })
          .restore();
        this.roundRect(
          doc,
          this.MR - COL_AMT,
          y,
          COL_AMT,
          LH_H,
          3,
          this.TEAL_LIGHT,
          null,
        );
        doc
          .save()
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text('Amount \u20B9', this.MR - COL_AMT + 4, y + 6, {
            width: COL_AMT - 8,
            align: 'center',
          })
          .restore();
        y += LH_H;

        // Item rows
        const items = data.items || [];
        const ROW_H = 22;
        const ROWS = Math.max(items.length, 3); // at least 3 empty rows

        for (let i = 0; i < ROWS; i++) {
          const item = items[i] || {};
          const rowBg = i % 2 === 0 ? '#F0F9FC' : this.WHITE;
          this.fillRect(doc, this.ML, y, this.CW, ROW_H, rowBg);
          this.solidLine(doc, this.ML, y + ROW_H, this.MR, 0.3, this.TEAL);
          // Vertical dividers
          doc
            .save()
            .strokeColor(this.TEAL)
            .lineWidth(0.3)
            .moveTo(this.ML + COL_SL, y)
            .lineTo(this.ML + COL_SL, y + ROW_H)
            .stroke()
            .moveTo(this.MR - COL_AMT, y)
            .lineTo(this.MR - COL_AMT, y + ROW_H)
            .stroke()
            .restore();

          if (item.slNo || item.description || item.amount) {
            doc
              .save()
              .fontSize(8.5)
              .font('Helvetica')
              .fillColor(this.TEXT_DARK)
              .text(String(item.slNo || i + 1), this.ML + 4, y + 7, {
                width: COL_SL - 6,
                align: 'center',
              })
              .restore();
            doc
              .save()
              .fontSize(8.5)
              .font('Helvetica')
              .fillColor(this.TEXT_DARK)
              .text(item.description || '', this.ML + COL_SL + 6, y + 7, {
                width: COL_DESC - 10,
              })
              .restore();
            doc
              .save()
              .fontSize(8.5)
              .font('Helvetica')
              .fillColor(this.TEXT_DARK)
              .text(this.fmtAmount(item.amount), this.MR - COL_AMT + 4, y + 7, {
                width: COL_AMT - 8,
                align: 'right',
              })
              .restore();
          }
          y += ROW_H;
        }

        // Outer border for items table
        doc
          .save()
          .strokeColor(this.TEAL)
          .lineWidth(1)
          .rect(this.ML, y - ROWS * ROW_H - LH_H, this.CW, ROWS * ROW_H + LH_H)
          .stroke()
          .restore();

        y += 12;

        // ── NOTE & Total row ──────────────────────────────────────────────────
        const noteX = this.ML;
        const totalBtnX = this.MR - 160;

        doc
          .save()
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(this.TEXT_DARK)
          .text('NOTE :', noteX, y)
          .restore();
        doc
          .save()
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(this.TEXT_DARK)
          .text(data.note || '', noteX, y + 12, {
            width: totalBtnX - noteX - 10,
          })
          .restore();

        // Total pill (teal rounded)
        this.roundRect(doc, totalBtnX, y - 4, 160, 26, 13, this.TEAL, null);
        doc
          .save()
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(this.WHITE)
          .text(
            `Total : \u20B9  ${this.fmtAmount(data.totalAmount)}`,
            totalBtnX + 8,
            y + 4,
            { width: 144, align: 'center' },
          )
          .restore();

        y += 50;

        // ── Thank You ─────────────────────────────────────────────────────────
        doc
          .save()
          .fontSize(18)
          .font('Helvetica-Oblique')
          .fillColor(this.TEXT_DARK)
          .text('Thank You', this.ML + this.CW / 2 - 50, y)
          .restore();

        y += 36;

        // ══════════════════════════════════════════════════════════════════════
        // TERMS AND CONDITIONS
        // ══════════════════════════════════════════════════════════════════════
        doc
          .save()
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor(this.TEXT_DARK)
          .text('TERMS AND CONDITIONS :', this.ML, y)
          .restore();
        y += 10;

        const terms = data.terms || [
          'Payment of this invoice constitutes acceptance of the terms and conditions outlined in the Placement Guarantee Agreement.',
          'The invoice amount, once paid, is final and non-refundable subjected to the placement guarantee agreement.',
        ];
        terms.forEach((t) => {
          doc
            .save()
            .fontSize(7)
            .font('Helvetica')
            .fillColor(this.TEXT_DARK)
            .text(`\u2022  ${t}`, this.ML + 4, y, { width: this.CW - 8 })
            .restore();
          y += 11;
        });

        y += 6;

        // ── Footer bar ────────────────────────────────────────────────────────
        this.fillRect(doc, this.ML, y, this.CW, 20, this.TEAL);
        const footerItems = [
          `\u260E  ${data.phone || '+91 7200 842333'}`,
          `\u2709  ${data.email || 'info@patroninternational.org'}`,
          `\u{1F4CD}  ${data.address || 'No.29/1, 2nd floor, Ambal Nagar, Main Road, Keelkattalai, Chennai 600117'}`,
        ];
        doc
          .save()
          .fontSize(7)
          .font('Helvetica')
          .fillColor(this.WHITE)
          .text(footerItems.join('   |   '), this.ML + 6, y + 6, {
            width: this.CW - 12,
            align: 'center',
          })
          .restore();

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  };
}
