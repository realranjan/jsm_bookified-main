import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    const status = {
        database: { connected: false, error: null as string | null },
        environment_variables: {
            MONGODB_URI: !!process.env.MONGODB_URI,
            BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
            GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
            VAPI_SERVER_SECRET: !!process.env.VAPI_SERVER_SECRET,
            ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
        },
        pdf_parser: "UNPKG CDN Enabled",
        timestamp: new Date().toISOString()
    };

    // Test MongoDB Connection
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing");
        }
        
        // Use a short timeout of 3 seconds so the health check doesn't hang forever
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
        status.database.connected = true;
        status.database.error = "Connection successful. IP is permitted.";
    } catch (e: any) {
        status.database.connected = false;
        status.database.error = e.message || "Unknown database error";
        
        if (status.database.error.includes("ENOTFOUND") || status.database.error.includes("ETIMEDOUT")) {
            status.database.error += " (Make sure MongoDB Network Access is set to 0.0.0.0/0)";
        }
    } finally {
        if(mongoose.connection.readyState === 1) {
             // Close connection in serverless environment if needed, but mongoose caches it. We can leave it open for Next.js.
        }
    }

    const allEnvGood = Object.values(status.environment_variables).every(v => v === true);
    
    return NextResponse.json({
        system_status: status.database.connected && allEnvGood ? "Healthy" : "Issues Detected",
        ...status
    }, {
        status: 200
    });
}
