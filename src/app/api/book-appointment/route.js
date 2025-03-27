import { supabase } from "../../../lib/supabase"; // Update to your correct Supabase instance path
import { NextResponse } from "next/server";

export const POST = async (req) => {
  const { selectedDate, selectedTime, supplierId } = await req.json();

  if (!selectedDate || !selectedTime || !supplierId) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch the last token number
    const { data, error } = await supabase
      .from("Tokens")
      .select("token_no")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching last token number:", error);
      return NextResponse.json(
        { message: "Error fetching last token number." },
        { status: 500 }
      );
    }

    const lastTokenNo = data[0]?.token_no;
    // Get current timestamp for t_id
    const now = new Date();
    const dayNow = now.getDate().toString().padStart(2, "0"); // dd
    const monthNow = (now.getMonth() + 1).toString().padStart(2, "0"); // mm
    const yearNow = now.getFullYear().toString(); // yyyy
    const hourNow = now.getHours().toString().padStart(2, "0"); // HH
    const minuteNow = now.getMinutes().toString().padStart(2, "0"); // MM
    const secondNow = now.getSeconds().toString().padStart(2, "0"); // SS
    const millisecondNow = now.getMilliseconds().toString().padStart(3, "0"); // SSS

    // Construct t_id in required format
    const t_id = `T${dayNow}${monthNow}${yearNow}${hourNow}${minuteNow}${secondNow}${millisecondNow}`;

    if (!lastTokenNo) {
      return NextResponse.json(
        { message: "No token number found in the database." },
        { status: 500 }
      );
    }

    // 2. Increment the token number
    const lastTokenNumber = parseInt(lastTokenNo.substring(1)); // Remove "O" and convert to number
    const nextTokenNumber = `O${lastTokenNumber + 1}`; // Increment and reattach "O"

    // 3. Format the slot_time as ddmmyyyyhhmmhhmm
    const dateObj = new Date(selectedDate);

    // Extract day, month, and year properly
    const day = dateObj.getDate().toString().padStart(2, "0"); // dd
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0"); // mm
    const year = dateObj.getFullYear().toString(); // yyyy

    // Ensure selectedTime is an object with startTime and endTime
    if (
      typeof selectedTime !== "object" ||
      !selectedTime.startTime ||
      !selectedTime.endTime
    ) {
      throw new Error(
        "selectedTime is not a valid object with startTime and endTime"
      );
    }

    const { startTime, endTime } = selectedTime;
    const startHour = startTime.substring(0, 2); // hh (start)
    const startMinute = startTime.substring(3, 5); // mm (start)
    const endHour = endTime.substring(0, 2); // hh (end)
    const endMinute = endTime.substring(3, 5); // mm (end)

    // Ensure the formatting is correct for each component
    const formattedSlotTime = `${day}${month}${year}${startHour}${startMinute}${endHour}${endMinute}`;

    // 4. Create a new appointment record with the next token
    const { error: insertError } = await supabase.from("Tokens").insert([
      {
        t_id: t_id, // Assign the formatted t_id
        token_no: nextTokenNumber,
        s_id: supplierId,
        slot_time: formattedSlotTime, // Using the formatted slot time
        present_time: new Date().toISOString(), // Current timestamp
      },
    ]);

    if (insertError) {
      console.error("Error inserting new token:", insertError);
      return NextResponse.json(
        { message: "Error creating new token for appointment." },
        { status: 500 }
      );
    }

    // 5. Respond back with success and token number
    return NextResponse.json(
      { message: "Appointment booked successfully", token_no: nextTokenNumber }, // Returning nextTokenNumber
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
};
