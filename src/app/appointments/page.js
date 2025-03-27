"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react"; // Correct import

export default function AppointmentsPage() {
  const [supplier, setSupplier] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [message, setMessage] = useState("");
  const [tokenNo, setTokenNo] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null); // Store ticket details

  const generateNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(currentDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 7; i <= 15; i++) {
      const start = `${i}:00`;
      const end = `${i + 1}:00`;
      slots.push(`${start}-${end}`);
    }
    return slots;
  };

  const isPastTimeSlot = (timeSlot, date) => {
    const [start] = timeSlot.split("-");
    const [startHour] = start.split(":").map(Number);
    if (
      date.toLocaleDateString("en-GB") ===
      currentDate.toLocaleDateString("en-GB")
    ) {
      const currentHour = currentDate.getHours();
      return currentHour >= startHour;
    }
    return false;
  };

  useEffect(() => {
    const storedSupplier = localStorage.getItem("supplier");
    if (storedSupplier) {
      setSupplier(JSON.parse(storedSupplier));
    } else {
      router.push("/");
    }
  }, []);

  if (!supplier) return <p>Loading...</p>;

  const generateTID = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
    return `T${day}${month}${year}${hours}${minutes}${seconds}${milliseconds}`;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !supplier?.id) return;

    const formattedDate = selectedDate.toLocaleDateString("en-GB");
    const [startTime, endTime] = selectedTime.split("-");
    const t_id = generateTID();

    try {
      const response = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          t_id,
          selectedDate: selectedDate.toISOString(),
          selectedTime: { startTime, endTime },
          supplierId: supplier.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to book appointment.");

      const data = await response.json();

      // Store ticket details to show in the pop-up
      setTicketDetails({
        title: "Trolley Kuwait Appointment",
        supplierName: supplier.s_name,
        supplierCompany: supplier.s_compname,
        bookedSlot: `${formattedDate} | ${startTime} - ${endTime}`,
        tokenNo: data.token_no,
        transactionId: t_id,
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
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
                  onClick={() => setSelectedDate(date)}
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
        {selectedDate && (
          <div className="mt-6 text-center">
            <p className="text-gray-300">Select a time slot:</p>
            <div className="flex justify-center space-x-2 mt-4">
              {generateTimeSlots().map((timeSlot, index) => {
                const isDisabled = isPastTimeSlot(timeSlot, selectedDate);
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedTime(timeSlot)}
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
        <div className="mt-6 text-center">
          <button
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedTime}
            className="px-6 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600"
          >
            Book Appointment
          </button>
        </div>
      </div>

      {ticketDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-80 text-center relative">
            <h2 className="text-lg font-bold">{ticketDetails.title}</h2>
            <p className="text-sm mt-2">
              Supplier: {ticketDetails.supplierName}
            </p>
            <p className="text-sm">Company: {ticketDetails.supplierCompany}</p>
            <p className="mt-4 text-sm">
              Booked Slot: {ticketDetails.bookedSlot}
            </p>
            <p className="text-4xl font-bold text-red-600 mt-4">
              {ticketDetails.tokenNo}
            </p>
            <p className="text-xs mt-2">
              Transaction ID: {ticketDetails.transactionId}
            </p>

            {/* QR Code for Transaction ID */}
            <div className="flex justify-center mt-4">
              <QRCodeCanvas value={ticketDetails.transactionId} size={100} />
            </div>

            <button
              onClick={() => setTicketDetails(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
