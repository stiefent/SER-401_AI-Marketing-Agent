import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json(
            { error: "Search query required"},
            { status: 400 }
        );
    }

    //TODO: Implment the Call to YouTube and format the reponse
    //For now return an error to implement

    return NextResponse.json(
        { error: "YouTube API call not implemented"},
        { status: 501 }
    )
    
}