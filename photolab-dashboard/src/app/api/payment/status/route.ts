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
 * GET /api/payment/status?orderId=XXX
 * Polls Midtrans for the current transaction status.
 */
export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400, headers: corsHeaders });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return NextResponse.json({ error: "Midtrans Server Key not configured" }, { status: 500, headers: corsHeaders });
    }

    const core = new Midtrans.CoreApi({ isProduction, serverKey, clientKey: process.env.MIDTRANS_CLIENT_KEY });

    const statusResponse = await core.transaction.status(orderId);

    return NextResponse.json({
      orderId: statusResponse.order_id,
      transactionStatus: statusResponse.transaction_status,
      fraudStatus: statusResponse.fraud_status,
      paymentType: statusResponse.payment_type,
      grossAmount: statusResponse.gross_amount,
      settlementTime: statusResponse.settlement_time || null,
    }, { headers: corsHeaders });
  } catch (error: any) {
    // Midtrans returns 404 if transaction not found yet
    if (error?.httpStatusCode === 404 || error?.ApiResponse?.status_code === "404") {
      return NextResponse.json({ transactionStatus: "not_found" }, { headers: corsHeaders });
    }
    console.error("[Midtrans Status API Error]:", error?.ApiResponse || error.message || error);
    return NextResponse.json(
      { error: error?.ApiResponse?.status_message || error.message || "Failed to check status" },
      { status: 500, headers: corsHeaders }
    );
  }
}
