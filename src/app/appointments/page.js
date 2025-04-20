"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";

export default function AppointmentsPage() {
  const [supplier, setSupplier] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ticketDetails, setTicketDetails] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef(null);
  const qrCodeRef = useRef(null);

  const generateNext7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(currentDate.getDate() + i);
      return date;
    });
  };

  const generateTimeSlots = () => {
    return Array.from({ length: 9 }, (_, i) => {
      const start = `${i + 7}:00`;
      const end = `${i + 8}:00`;
      return `${start}-${end}`;
    });
  };

  const isPastTimeSlot = (timeSlot, date) => {
    const [start] = timeSlot.split("-");
    const [startHour] = start.split(":").map(Number);
    if (
      date.toLocaleDateString("en-GB") ===
      currentDate.toLocaleDateString("en-GB")
    ) {
      return currentDate.getHours() >= startHour;
    }
    return false;
  };

  useEffect(() => {
    const storedSupplier = localStorage.getItem("supplier");
    if (storedSupplier) {
      setSupplier(JSON.parse(storedSupplier));
    }
  }, []);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;

    setIsDownloading(true);

    try {
      // Create a ticket element with simple styling
      const ticketContainer = document.createElement("div");
      ticketContainer.style.backgroundColor = "#ffffff";
      ticketContainer.style.padding = "20px";
      ticketContainer.style.width = "350px";
      ticketContainer.style.fontFamily = "Arial, sans-serif";
      ticketContainer.style.borderRadius = "8px";
      ticketContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      ticketContainer.style.color = "#000000";
      ticketContainer.style.textAlign = "center";

      // Add ticket content
      ticketContainer.innerHTML = `
        <h2 style="font-size:22px; font-weight:bold; margin-bottom:16px;">${ticketDetails.title}</h2>
        <p style="font-size:14px; margin:8px 0;">Supplier: ${ticketDetails.supplierName}</p>
        <p style="font-size:14px; margin:8px 0;">Company: ${ticketDetails.supplierCompany}</p>
        <p style="font-size:14px; margin:16px 0;">Booked Slot: ${ticketDetails.bookedSlot}</p>
        <p style="font-size:42px; font-weight:bold; color:#ff0000; margin:16px 0;">${ticketDetails.tokenNo}</p>
        <p style="font-size:12px; margin:8px 0;">Transaction ID: ${ticketDetails.transactionId}</p>
        <div id="qr-placeholder" style="display:flex; justify-content:center; align-items:center; margin-top:16px; height:120px;"></div>
      `;

      // Append to document but keep hidden
      ticketContainer.style.position = "absolute";
      ticketContainer.style.left = "-9999px";
      document.body.appendChild(ticketContainer);

      // If we have a QR code in the DOM, copy it to our canvas
      if (qrCodeRef.current) {
        // Find the canvas inside the QRCodeCanvas component
        const originalQrCanvas = qrCodeRef.current.querySelector("canvas");
        if (originalQrCanvas) {
          // Create a new canvas for the QR code
          const qrCanvas = document.createElement("canvas");
          qrCanvas.width = 120;
          qrCanvas.height = 120;
          const qrContext = qrCanvas.getContext("2d");

          // Draw the QR code centered
          qrContext.drawImage(originalQrCanvas, 0, 0, 120, 120);

          // Add the QR code to our ticket with centering styles
          const qrPlaceholder =
            ticketContainer.querySelector("#qr-placeholder");
          if (qrPlaceholder) {
            qrCanvas.style.display = "block";
            qrCanvas.style.margin = "0 auto";
            qrPlaceholder.appendChild(qrCanvas);
          }

          // Now capture the ticket as an image
          const canvas = await html2canvas(ticketContainer, {
            backgroundColor: "#ffffff",
            scale: 2,
            logging: false,
          });

          // Create download link
          const link = document.createElement("a");
          link.download = `trolley-appointment-${ticketDetails.tokenNo}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      }

      // Clean up
      document.body.removeChild(ticketContainer);
    } catch (error) {
      console.error("Error downloading ticket:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!supplier) return <p>Loading...</p>;

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !supplier?.id || isBooking) return;

    setIsBooking(true); // Disable the button

    const formattedDate = selectedDate.toLocaleDateString("en-GB");
    const [startTime, endTime] = selectedTime.split("-");

    try {
      const response = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDate: selectedDate.toISOString(),
          selectedTime: { startTime, endTime },
          supplierId: supplier.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to book appointment.");

      const data = await response.json();

      setTicketDetails({
        title: "Trolley Kuwait Appointment",
        supplierName: supplier.s_name,
        supplierCompany: supplier.s_compname,
        bookedSlot: `${formattedDate} | ${startTime} - ${endTime}`,
        tokenNo: data.token_no,
        transactionId: data.t_id, // This should come from the backend
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      setIsBooking(false); // Re-enable the button if an error occurs
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
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
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 mt-4">
            {generateNext7Days().map((date, index) => {
              const formattedDate = date.toLocaleDateString("en-GB");
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-md ${
                    selectedDate?.toLocaleDateString("en-GB") === formattedDate
                      ? "bg-blue-500"
                      : "bg-gray-700"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
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

        {/* Book Appointment Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedTime || isBooking}
            className={`px-6 py-2 rounded-md text-white ${
              isBooking
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isBooking ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </div>

      {/* Ticket Modal */}
      {ticketDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-80 text-center relative">
            {/* Ticket Content - wrapped in a div with ref for capture */}
            <div ref={ticketRef}>
              <h2 className="text-lg font-bold">{ticketDetails.title}</h2>
              <p className="text-sm mt-2">
                Supplier: {ticketDetails.supplierName}
              </p>
              <p className="text-sm">
                Company: {ticketDetails.supplierCompany}
              </p>
              <p className="mt-4 text-sm">
                Booked Slot: {ticketDetails.bookedSlot}
              </p>
              <p className="text-4xl font-bold text-red-600 mt-4">
                {ticketDetails.tokenNo}
              </p>
              <p className="text-xs mt-2">
                Transaction ID: {ticketDetails.transactionId}
              </p>

              {/* QR Code for Transaction ID - centered */}
              <div ref={qrCodeRef} className="flex justify-center mt-4">
                <QRCodeCanvas value={ticketDetails.transactionId} size={100} />
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadTicket}
              disabled={isDownloading}
              className={`mt-4 px-4 py-2 rounded ${
                isDownloading
                  ? "bg-gray-300"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isDownloading ? "Downloading..." : "Download Ticket"}
            </button>

            <button
              onClick={() => {
                setTicketDetails(null);
                setIsBooking(false); // Re-enable the button when closing the modal
              }}
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
