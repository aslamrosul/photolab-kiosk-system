import { NextRequest, NextResponse } from "next/server";
const Midtrans = require("midtrans-client");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/payment/token
 * Creates a Midtrans QRIS transaction and returns the QR code URL.
 * Also supports Snap token generation via ?mode=snap query param.
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, customerName, customerEmail, mode } = await req.json();

    if (!amount || !orderId) {
      return NextResponse.json({ error: "Amount and Order ID are required" }, { status: 400, headers: corsHeaders });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return NextResponse.json({ error: "Midtrans Server Key not configured" }, { status: 500, headers: corsHeaders });
    }

    // Mode: snap (popup) or qris (direct QR code)
    if (mode === "snap") {
      const snap = new Midtrans.Snap({ isProduction, serverKey, clientKey: process.env.MIDTRANS_CLIENT_KEY });
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: { first_name: customerName || "Customer", email: customerEmail || "customer@photolab.id" },
      });
      return NextResponse.json({ token: transaction.token, redirect_url: transaction.redirect_url }, { headers: corsHeaders });
    }

    // Default: QRIS mode via Core API
    const core = new Midtrans.CoreApi({ isProduction, serverKey, clientKey: process.env.MIDTRANS_CLIENT_KEY });

    const parameter = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName || "Photobooth Customer",
        email: customerEmail || "customer@photolab.id",
      },
      qris: {
        acquirer: "gopay",
      },
    };

    const chargeResponse = await core.charge(parameter);

    // Extract QR URL from response
    const qrUrl = chargeResponse.actions?.find((a: any) => a.name === "generate-qr-code")?.url || null;

    return NextResponse.json({
      orderId: chargeResponse.order_id,
      transactionId: chargeResponse.transaction_id,
      qrUrl,
      status: chargeResponse.transaction_status,
      rawResponse: chargeResponse,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[Midtrans Token API Error]:", error?.ApiResponse || error.message || error);
    return NextResponse.json(
      { error: error?.ApiResponse?.status_message || error.message || "Failed to create transaction" },
      { status: 500, headers: corsHeaders }
    );
  }
}
