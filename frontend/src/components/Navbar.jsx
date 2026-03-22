import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Navbar({ shipments = [] }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleSearch = (value) => {
    setSearch(value);
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const q = value.toLowerCase();
    const matched = shipments
      .filter(
        (s) =>
          s.tracking_number?.toLowerCase().includes(q) ||
          s.sender_city?.toLowerCase().includes(q) ||
          s.receiver_city?.toLowerCase().includes(q) ||
          s.carrier?.toLowerCase().includes(q),
      )
      .slice(0, 5);
    setResults(matched);
    setShowDropdown(true);
  };

  const handleSelect = (shipment) => {
    setSearch("");
    setShowDropdown(false);
    navigate(`/shipments/${shipment.id}`);
  };

  const handleClear = () => {
    setSearch("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 md:max-w-md relative max-md:mx-10">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Search tracking number, city, carrier..."
              className="pl-10 pr-8"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => search && setShowDropdown(true)}
            />
            {search && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No shipments found
                </div>
              ) : (
                results.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={() => handleSelect(s)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {s.tracking_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.sender_city}, {s.sender_state} → {s.receiver_city},{" "}
                        {s.receiver_state}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 ml-4 shrink-0">
                      {s.carrier || s.mode}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* User */}
        <div className="ml-auto flex items-center space-x-3">
          <div className="flex items-center space-x-2 rounded-lg px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-[#1B5E20] flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {user.name || user.email || "User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
