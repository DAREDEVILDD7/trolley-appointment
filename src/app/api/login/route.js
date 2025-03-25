import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { supplierId, password } = await req.json();

    const { data, error } = await supabase
      .from("Supplier")
      .select("id, s_name, s_compname") // Select only necessary fields
      .eq("id", supplierId)
      .eq("s_password", password)
      .single(); // Ensure only one record is returned

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
