import { NextResponse } from "next/server";
import { findNearestCity } from "@/app/api/cache/CitiesCache";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const lat = parseFloat(searchParams.get("lat") || "");
        const lon = parseFloat(searchParams.get("lon") || "");

        if (isNaN(lat) || isNaN(lon)) {
            return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
        }

        const cityData = await findNearestCity(lon, lat);
        if (!cityData) {
            return NextResponse.json({ error: "No nearby city found" }, { status: 404 });
        }

        return NextResponse.json(cityData);
    } catch (error){
        console.log(error)
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
