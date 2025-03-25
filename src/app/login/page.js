"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for the new App Router

export default function LoginPage() {
  const router = useRouter();
  const [supplierID, setSupplierID] = useState("");  // Note: Corrected variable name to supplierID
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [supplier, setSupplier] = useState(null);  // State to store the supplier data

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
  
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplierID, password }),
    });
  
    try {
      const data = await response.json();
      console.log("Supabase Login Response:", data);
  
      if (response.ok) {
        setSupplier(data);
        localStorage.setItem("supplier", JSON.stringify(data)); // Store in localStorage
        alert(`Welcome, ${data.s_name}!`);
        router.push("/appointments"); // Redirect to Appointments page
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error parsing response:", error);
      setError("An error occurred while processing your request.");
    }
  };
  
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-blue-400">Supplier Login</h2>
        <form className="mt-4" onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-300">Supplier ID</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded bg-gray-700 text-white outline-none focus:border-blue-500" 
              placeholder="Enter your ID" 
              value={supplierID} 
              onChange={(e) => setSupplierID(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300">Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded bg-gray-700 text-white outline-none focus:border-blue-500" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400">
          Forgot your password? <span className="text-blue-400 cursor-pointer hover:underline">Contact Trolley</span>
        </p>
      </div>
    </div>
  );
}
