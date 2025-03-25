"use client";

import { useEffect, useState } from "react";

export default function AppointmentsPage() {
  const [supplier, setSupplier] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [message, setMessage] = useState("");

  // Generate the next 7 days starting from today
  const generateNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(currentDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Generate time slots from 7 AM to 2 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 7; i <= 15; i++) {
      const start = `${i}:00`;
      const end = `${i + 1}:00`;
      slots.push(`${start}-${end}`);
    }
    return slots;
  };

  // Check if a time slot is past for a selected date
  const isPastTimeSlot = (timeSlot, date) => {
    const [start, end] = timeSlot.split("-");
    const [startHour] = start.split(":").map(Number);

    // If the selected date is today
    if (
      date.toLocaleDateString("en-GB") ===
      currentDate.toLocaleDateString("en-GB")
    ) {
      const currentHour = currentDate.getHours();
      return currentHour >= startHour; // Disable time slots that have already passed
    }

    // For future dates, all slots are available
    return false;
  };

  useEffect(() => {
    const storedSupplier = localStorage.getItem("supplier");
    if (storedSupplier) {
      setSupplier(JSON.parse(storedSupplier)); // Parse and set the supplier object
    } else {
      // Redirect to login page if no supplier info found
      router.push("/");
    }
  }, []);

  if (!supplier) return <p>Loading...</p>;

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when the date is changed
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
  };

  const isBookingButtonDisabled = !selectedDate || !selectedTime;

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !supplier?.id) {
      console.log("Missing fields before API call:", {
        selectedDate,
        selectedTime,
        supplierId: supplier?.id,
      });
      return;
    }

    // Format the selected date to a standard string format (e.g., ISO 8601)
    const formattedDate = selectedDate.toISOString();

    // Time might need parsing to separate start and end times
    const [startTime, endTime] = selectedTime.split("-");

    // Send the selectedTime as an object
    const selectedTimeObj = { startTime, endTime };

    try {
      const response = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDate: formattedDate,
          selectedTime: selectedTimeObj, // Send as an object
          supplierId: supplier.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unknown error occurred.");
      }

      const data = await response.json();
      console.log("Appointment booked successfully", data);
      setMessage(`Appointment booked! Token: ${data.token_no}`);
    } catch (error) {
      console.error("Error booking appointment:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-blue-400">
          Appointments
        </h2>
        <div className="mt-6">
          <h3 className="text-xl text-center text-gray-300">
            Welcome, {supplier.s_name}!
          </h3>
          <p className="text-center text-gray-400">
            You are logged in as a supplier from {supplier.s_compname}.
          </p>
        </div>

        {/* Date Selection */}
        <div className="mt-6 text-center">
          <p className="text-gray-300">Select a date:</p>
          <div className="flex justify-center space-x-2 mt-4">
            {generateNext7Days().map((date, index) => {
              const formattedDate = date.toLocaleDateString("en-GB");
              const isSelected =
                selectedDate &&
                selectedDate.toLocaleDateString("en-GB") === formattedDate;

              return (
                <button
                  key={index}
                  onClick={() => handleDateChange(date)}
                  className={`px-4 py-2 rounded-md ${
                    isSelected ? "bg-blue-500" : "bg-gray-700"
                  }`}
                >
                  {formattedDate}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div className="mt-6 text-center">
            <p className="text-gray-300">Select a time slot:</p>
            <div className="flex justify-center space-x-2 mt-4">
              {generateTimeSlots().map((timeSlot, index) => {
                const isDisabled = isPastTimeSlot(timeSlot, selectedDate);

                return (
                  <button
                    key={index}
                    onClick={() => handleTimeChange(timeSlot)}
                    disabled={isDisabled}
                    className={`px-4 py-2 rounded-md ${
                      selectedTime === timeSlot
                        ? "bg-blue-500"
                        : isDisabled
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gray-700"
                    }`}
                  >
                    {timeSlot}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Book Appointment Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBookAppointment}
            disabled={isBookingButtonDisabled}
            className={`px-6 py-2 rounded-md text-white ${
              isBookingButtonDisabled
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Book Appointment
          </button>
        </div>

        {/* Message After Booking */}
        {message && (
          <div className="mt-4 text-center text-gray-400">
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
