// app/api/inventory/send-supplier-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMockData, generateId, updateMockData } from '../../../../lib/mockData'; // Adjust path
import { ReminderSentConfirmation } from '../../../../app/types'; // Adjust path
import nodemailer from 'nodemailer';
import { format } from 'date-fns'; // For better date formatting in emails

export async function POST(request: NextRequest) {
  try {
    const { po_id, supplier_id, message } = await request.json();

    if (!po_id || !supplier_id) {
      return NextResponse.json({ error: 'Missing po_id or supplier_id.' }, { status: 400 });
    }

    const mockData = getMockData();
    const purchaseOrder = mockData.purchaseOrders.find(po => po.poId === po_id);
    const supplier = mockData.suppliers.find(s => s.id === supplier_id);

    if (!purchaseOrder) {
      return NextResponse.json({ error: `Purchase Order with ID ${po_id} not found.` }, { status: 404 });
    }
    if (!supplier) {
      return NextResponse.json({ error: `Supplier with ID ${supplier_id} not found.` }, { status: 404 });
    }

    // --- Simulate Reminder Sending ---
    const reminderId = generateId('REM');
    const sentDate = new Date();
    const defaultMessage = `This is an urgent reminder regarding Purchase Order ${po_id} for product ${purchaseOrder.productId} (Quantity: ${purchaseOrder.quantityOrdered}). It was expected by ${format(new Date(purchaseOrder.expectedDeliveryDate), 'PPP')}. Please provide an immediate update on its status.`;
    const finalMessage = message || defaultMessage;

    // --- Internal Email Sending Logic (e.g., to an internal team or a direct supplier email) ---
    let emailStatus: ReminderSentConfirmation['email_notification_status'] = 'not_attempted';
    let emailError: string | null = null;

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn("GMAIL_USER or GMAIL_PASS environment variables are not set. Email notification for reminder will not be sent.");
      emailStatus = 'failed';
      emailError = 'Email credentials not configured.';
    } else {
      try {
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: supplier.email, // Sending reminder to the supplier's email
          subject: `URGENT REMINDER: Delayed PO #${po_id} - ${purchaseOrder.productId}`,
          text: `
Dear ${supplier.name},

${finalMessage}

Please provide an immediate update on the status of this order.

Thank you,
Your Purchasing Team
          `,
        };

        await transporter.sendMail(mailOptions);
        emailStatus = 'sent';
      } catch (e: any) {
        console.error('Failed to send email notification for reminder:', e);
        emailStatus = 'failed';
        emailError = e.message;
      }
    }

    // --- Prepare Response ---
    const responseBody: ReminderSentConfirmation = {
      reminder_id: reminderId,
      po_id: po_id,
      supplier_id: supplier_id,
      message: `Reminder sent to ${supplier.name} for PO ${po_id}.`, // Confirmation message for the agent
      sent_date: sentDate.toISOString(),
      email_notification_status: emailStatus,
      email_error_message: emailError,
    };

    // Optionally: Update PO status in mockData if reminder sent
    // For simplicity of this mock, we are not changing PO status here,
    // as it's meant to be polled by check_po_status.

    return NextResponse.json(responseBody, { status: 200 });

  } catch (error: any) {
    console.error("Error in send_supplier_reminder API:", error);
    return NextResponse.json({ error: error.message || "Failed to send supplier reminder." }, { status: 500 });
  }
}