import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { shipments as shipmentsApi } from "../api";

export default function Layout() {
  const [allShipments, setAllShipments] = useState([]);

  // Load all shipments once at layout level so Navbar can search them
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    shipmentsApi
      .list()
      .then(({ data }) => setAllShipments(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar shipments={allShipments} />
        <main className=" flex-1 overflow-y-auto p-6  bg-white rounded-lg shadow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
