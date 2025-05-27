import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

const StockMovementReport = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedOutlet, setSelectedOutlet] = useState(user.outlet || "");
  const [exportDropdown, setExportDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState(null);

  const outlets = [
    "Madina Trade International: New Market",
    "Shamima Akter: New Market",
    "Sheikh Enterprise: Mirpur",
    "Rafi Rafsan Trade International: Mirpur",
    "Aminur Enterprise: Mirpur",
    "Mamun Trade Int.: Mohammadpur",
    "Alok Trade Express: Mohammadpur",
    "S.R Enterprise: Savar",
    "Bismillah Enterprise: Manikgonj",
    "Bismillah Enterprise: Manikgonj 2",
    "Tasnim Enterprise: Uttara",
    "Tasnim Enterprise: Uttara 2",
    "Rayhan Enterprise: Uttara",
    "Turin General Store: Tongi",
    "Babul Enterprise: Tongi",
    "M.S Enterprise: Gazipur",
    "Fahad Enterprise: Gazipur",
    "Juthi Enterprise: Mawna",
    "S.A Enterprise: Mymensingh",
    "Orko Shop: Sherpur",
    "M Enterprise: Tangail",
    "Sumaiya & Suraiya Ent.: Netrokona",
    "SH Enterprise: Jamalpur",
    "Shahanaz Cosmetics: Kishorgonj",
    "RS Enterprise: Ghatail",
    "Brothers Enterprise: Rajshahi",
    "Sabbir Cosmetics: Chapainababgonj",
    "Sadiq Sabir Cosmetics: Bogura",
    "Sajeeb Store: Neogeon",
    "Mawantha Traders: Natore",
    "Sanaullah Trading Agency: Pabna",
    "Saad & Sinha: Sirajgonj",
    "Tiha Enterprise: Joypurhaat",
    "Arafat Traders: Sirajgonj",
    "Latif Store: Sirajgonj",
    "Islam Distribution : Rajshahi-CLOSED",
    "Apurbo Store: Neogeon",
    "Alam General Store: Rangpur",
    "Owais Enterprise: Rangpur",
    "Nishat Enterprise: Dinajpur",
    "Shatabdi Enterprise: Syedpur",
    "R.B Enterprise: Kurigram",
    "Sadia Enterprise: Lalmonirhaat",
    "Sohel Traders: Thakurgeon",
    "Bhattacharjo Strore: Thakurgoan",
    "Manik Enterprise: Gaibanda",
    "Parul Cosmetics: Gobindogonj",
    "Ruchita Cosmetics: Khulna",
    "Bhai Bhai Enterprise : Khulna",
    "Akhi Asma Biponi and Stationary: Jenaidah",
    "Tahsin Enterprise: Satkhira",
    "Makeup House: Kushtia",
    "Jannat Store: Jessore",
    "Tangil Traders: Meherpur",
    "Food Park & Coffee House: Chuadanga",
    "Chetona The Leather House: Jessore",
    "Mondol Traders: Rajbari",
    "R.M Traders: Dumoria, Khulna",
    "Rahman Cosmetics: Norail",
    "Biswas Store: Magura",
    "Betikrom Fasion: Kushtia",
    "Faruk Traders: Gulshan",
    "Harun Enterprise: Gulshan",
    "Ishika Enterprise: Fakirapool",
    "Nuraj Traders: Gulistan",
    "Tania Enterprise: Jatrabari",
    "Rahman Enterprise: Khilgaon",
    "Dream Traders: Keranigonj",
    "Tamim Enterprise: Narayangonj",
    "Muslim Enterprise: Sonargaon",
    "Jannat Traders: Munshigonj",
    "Maa Enterprise: Joypara Dohar",
    "Maa Varieties Store: Narayangonj#02",
    "Majharul Enterprise: Norshindi",
    "Bismillah Enterprise: Norshindi",
    "Usha Enterprise: Barisal",
    "Baba Mayer Dua Traders: Madaripur",
    "Raj Enterprise: Gopalgonj",
    "Jannati Enterprise : Bagerhat",
    "Mollah Distribution Point: Faridpur",
    "Giashuddin Ent: Shariatpur",
    "Maa Enterprise: Pirojpur",
    "Ashraf Store: Barguna",
    "Brothers International: Faridpur",
    "Sonali Store: Bhola",
    "Choiti Enterprise: Barisal",
    "Sabit Enterprise: Patuakhali",
    "S M Enterprise : Shibchar",
    "A.C Enterprise: Comilla",
    "Rajlaxmi Vandar: Maijdee, Noakhali",
    "Jamal Traders: Noakhali",
    "Tijarah United: Feni",
    "Tamim Enterprise : Chandpur",
    "Macca Enterprise: Laxsham",
    "Taqwa Enterprise: Laxipur",
    "Anowar & Ayan Sanitary House: Gauripur",
    "Prottasha Enterprise: Feni",
    "Rofik Enterprise: Laxsham",
    "Sazin Enterprise: Bancharampur",
    "Aban Fashion & Accessories: Sylhet",
    "MS Lalu Accessories: B-Baria",
    "Al Korim Trading & Distribution: Hobigonj",
    "Tuhi Store: Sylhet",
    "Tinni Enterprise: Moulvi Bazar, Sylhet",
    "Maa General Store: Muradfpur",
    "Priti Enterprise: Pahar Toli",
    "Bilash Biponi: Rangamati",
    "Bismilla Traders: Bondorthila",
    "Maa Babar Doa Enterprise: Khagrachori",
    "S.S Distribution: Cox's Bazar",
    "Rashid Enterprise: Reazuddin Bazar, Ctg",
    "Tafseer Enterprise: Reazuddin Bazar, Ctg",
    "Rahman Enterprise: Chittagong",
    "Riyad Enterprise: Shitakundo",
    "M.J Enterprise: Hathazari",
    "Rokeya Enterprise: Reazuddin Bazar",
    "N Huda & Sons: Reazuddin Bazar",
    "K.S Traders: Chittagong",
  ];

  useEffect(() => {
    if (selectedOutlet && dateRange.start && dateRange.end) {
      fetchReportData();
    }
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate dates
      if (!dateRange.start || !dateRange.end) {
        throw new Error("Please select both start and end dates");
      }

      // Format dates properly
      const params = {
        outlet: selectedOutlet,
        startDate: dayjs(dateRange.start).format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs(dateRange.end).format("YYYY-MM-DD HH:mm:ss"),
      };

      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/api/stock-movement",
        { params }
      );

      if (response.data?.success) {
        const filteredData = response.data.data.filter((item) => {
          return (
            (item.openingStock && item.openingStock !== 0) ||
            (item.primary && item.primary !== 0) ||
            (item.secondary && item.secondary !== 0) ||
            (item.officeReturn && item.officeReturn !== 0) ||
            (item.marketReturn && item.marketReturn !== 0)
          );
        });
        // Sort the data alphabetically by productName
        const sortedData = [...filteredData].sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        setReportData(sortedData);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      let errorMessage = "Failed to load report data";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response
      }
      setError(errorMessage);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = () => {
    fetchReportData();
  };

  const exportToExcel = () => {
    // Sort data alphabetically for export
    const sortedData = [...reportData].sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );
    // Prepare Excel data
    const excelData = [
      [
        `Distributor Name: ${selectedOutlet}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        `Period: ${
          dayjs(dateRange.start).format("DD-MM-YY") +
          " to " +
          dayjs(dateRange.end).format("DD-MM-YY")
        }`,
      ],
      ["", "", "", "", "", "", "", "", ""],
      // ["Name Of Sales Person:", "", "", "", "", "", "", "", "Area:"],
      [
        "Sl",
        "Products Name",
        "Opening Stock",
        "",
        "Primary",
        "",
        "Market Return",
        "",
        "Office Return",
        "",
        "Secondary",
        "",
        "Closing Stock",
        "",
      ],
      [
        "",
        "",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
      ],
      ...sortedData.map((item, index) => [
        index + 1,
        item.productName,
        item.openingStock,
        item.openingValueDP?.toFixed(2),
        item.primary,
        item.primaryValueDP?.toFixed(2),
        item.marketReturn,
        item.marketReturnValueDP?.toFixed(2),
        item.officeReturn,
        item.officeReturnValueDP?.toFixed(2),
        item.secondary,
        item.secondaryValueDP?.toFixed(2),
        item.openingStock +
          item.primary +
          item.marketReturn -
          item.secondary -
          item.officeReturn,
        (
          item.openingValueDP +
          item.primaryValueDP +
          item.marketReturnValueDP -
          item.secondaryValueDP -
          item.officeReturnValueDP
        )?.toFixed(2),
      ]),
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Merge header cells
    ws["!merges"] = [
      // Merge distributor name
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      // Merge month
      { s: { r: 0, c: 8 }, e: { r: 0, c: 13 } },
      // Merge sales person
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      // Merge area
      { s: { r: 1, c: 8 }, e: { r: 1, c: 13 } },
      // Merge headers
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // Opening Stock
      { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } }, // Primary
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }, // Market Return
      { s: { r: 2, c: 8 }, e: { r: 2, c: 9 } }, // Office Return
      { s: { r: 2, c: 10 }, e: { r: 2, c: 11 } }, // Secondary
      { s: { r: 2, c: 12 }, e: { r: 2, c: 13 } }, // Closing Stock
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Stock Movement");
    XLSX.writeFile(
      wb,
      `Stock_Movement_${selectedOutlet}_${dateRange.start}.xlsx`
    );
  };

  const exportToPDF = () => {
    // Sort data alphabetically for export
    const sortedData = [...reportData].sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );
    try {
      // Initialize PDF in landscape mode
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
      });

      // Add distributor and sales person info at the top
      doc.setFontSize(12);
      doc.text(`Distributor Name: ${selectedOutlet || ""}`, 14, 15);
      // Add month and area info at the top right
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(
        `Period: ${
          dayjs(dateRange.start).format("DD-MM-YY") +
          " to " +
          dayjs(dateRange.end).format("DD-MM-YY")
        }`,
        pageWidth - 75,
        15
      );

      // Prepare table data - match Excel structure exactly
      const headers = [
        [
          "Sl",
          "Products Name",
          "Opening Stock",
          "",
          "Primary",
          "",
          "Market Return",
          "",
          "Office Return",
          "",
          "Secondary",
          "",
          "Closing Stock",
          "",
        ],
        [
          "",
          "",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
        ],
      ];

      const data = sortedData.map((item, index) => [
        index + 1,
        item.productName || "",
        item.openingStock || 0,
        item.openingValueDP?.toFixed(2) || "0.00",
        item.primary || 0,
        item.primaryValueDP?.toFixed(2) || "0.00",
        item.marketReturn || 0,
        item.marketReturnValueDP?.toFixed(2) || "0.00",
        item.officeReturn || 0,
        item.officeReturnValueDP?.toFixed(2) || "0.00",
        item.secondary || 0,
        item.secondaryValueDP?.toFixed(2) || "0.00",
        item.openingStock +
          item.primary +
          item.marketReturn -
          item.secondary -
          item.officeReturn || 0,
        (
          item.openingValueDP +
          item.primaryValueDP +
          item.marketReturnValueDP -
          item.secondaryValueDP -
          item.officeReturnValueDP
        )?.toFixed(2) || "0.00",
      ]);

      // Add totals row if needed
      if (totals) {
        data.push([
          "",
          "TOTAL",
          totals.openingQty || 0,
          totals.openingValue?.toFixed(2) || "0.00",
          totals.primaryQty || 0,
          totals.primaryValue?.toFixed(2) || "0.00",
          totals.marketReturnQty || 0,
          totals.marketReturnValue?.toFixed(2) || "0.00",
          totals.officeReturnQty || 0,
          totals.officeReturnValue?.toFixed(2) || "0.00",
          totals.secondaryQty || 0,
          totals.secondaryValue?.toFixed(2) || "0.00",
          totals.openingQty +
            totals.primaryQty +
            totals.marketReturnQty -
            totals.secondaryQty -
            totals.officeReturnQty || 0,
          (
            totals.openingValue +
            totals.primaryValue +
            totals.marketReturnValue -
            totals.secondaryValue -
            totals.officeReturnValue
          ).toFixed(2) || "0.00",
        ]);
      }

      // Generate the table
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 30,
        margin: { horizontal: 10 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" }, // SL column
          1: { cellWidth: 30, halign: "left" }, // Product column
          // Other columns will auto-size
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        // Merge header cells to match Excel layout
        didParseCell: function (data) {
          if (data.section === "head" && data.row.index === 0) {
            // Merge cells in the first header row
            if (
              data.column.dataKey === 2 ||
              data.column.dataKey === 4 ||
              data.column.dataKey === 6 ||
              data.column.dataKey === 8 ||
              data.column.dataKey === 10 ||
              data.column.dataKey === 12
            ) {
              data.cell.colSpan = 2;
            }
          }
        },
      });

      // Save the PDF
      const fileName = `Stock_Report_${selectedOutlet || "all"}_${
        dayjs(dateRange.start).format("YYYY-MM-DD") +
          " to " +
          dayjs(dateRange.end).format("YYYY-MM-DD") || dayjs().format("MMMM")
      }_${dayjs().format("YYYYMMDD")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Calculate totals
  const totals = reportData.reduce(
    (acc, item) => {
      acc.openingQty += item.openingStock || 0;
      acc.openingValue += item.openingValueDP || 0;
      acc.primaryQty += item.primary || 0;
      acc.primaryValue += item.primaryValueDP || 0;
      acc.marketReturnQty += item.marketReturn || 0;
      acc.marketReturnValue += item.marketReturnValueDP || 0;
      acc.officeReturnQty += item.officeReturn || 0;
      acc.officeReturnValue += item.officeReturnValueDP || 0;
      acc.secondaryQty += item.secondary || 0;
      acc.secondaryValue += item.secondaryValueDP || 0;
      acc.closingQty += item.closingStock || 0;
      acc.closingValue += item.closingValueDP || 0;
      return acc;
    },
    {
      openingQty: 0,
      openingValue: 0,
      primaryQty: 0,
      primaryValue: 0,
      marketReturnQty: 0,
      marketReturnValue: 0,
      officeReturnQty: 0,
      officeReturnValue: 0,
      secondaryQty: 0,
      secondaryValue: 0,
      closingQty: 0,
      closingValue: 0,
    }
  );

  return (
    <div className="flex">
      {!user?.outlet && <AdminSidebar />}

      <div className="mx-auto px-6 py-8 w-full md:w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Stock Movement Report
          </h2>
          <div className="relative">
            <button
              onClick={() => setExportDropdown(!exportDropdown)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              disabled={reportData.length === 0}
            >
              Export
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {exportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportToExcel();
                      setExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export to Excel
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF();
                      setExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export to PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {!user?.outlet && (
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-4 py-2 border rounded-md shadow-sm"
            >
              <option value="">Select Outlet</option>
              {outlets.map((outlet, index) => (
                <option key={index} value={outlet}>
                  {outlet}
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="border rounded px-4 py-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="border rounded px-4 py-2"
              />
            </div>
            <button
              onClick={handleFilterClick}
              className="bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white border-l-4 border-purple-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Opening Stock (DP)</p>
              <p className="text-2xl font-semibold text-purple-700">
                {totals.openingValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-green-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Primary Stock (DP)</p>
              <p className="text-2xl font-semibold text-green-700">
                {totals.primaryValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Secondary Sales (DP)</p>
              <p className="text-2xl font-semibold text-blue-700">
                {totals.secondaryValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-red-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Market Returns (DP)</p>
              <p className="text-2xl font-semibold text-red-700">
                {totals.marketReturnValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-yellow-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Office Returns (DP)</p>
              <p className="text-2xl font-semibold text-yellow-700">
                {totals.officeReturnValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-indigo-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Closing Stock (DP)</p>
              <p className="text-2xl font-semibold text-indigo-700">
                {(
                  totals.openingValue +
                  totals.primaryValue +
                  totals.marketReturnValue -
                  totals.secondaryValue -
                  totals.officeReturnValue
                )?.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {/* Report Table */}
        {!loading && reportData.length > 0 && (
          <div
            className="overflow-x-auto shadow rounded-lg"
            style={{ maxHeight: "95vh" }}
          >
            <table className="min-w-full border">
              <thead className="sticky top-[-1px] bg-white z-10">
                <tr>
                  <th colSpan="14" className="bg-gray-200 px-4 py-2 text-left">
                    Distributor Name: {selectedOutlet}
                  </th>
                </tr>
                <tr>
                  <th colSpan="14" className="bg-gray-200 px-4 py-3 text-left">
                    Period: {dayjs(dateRange.start).format("DD-MM-YY")} to{" "}
                    {dayjs(dateRange.end).format("DD-MM-YY")}
                  </th>
                </tr>
                <tr className="bg-gray-100">
                  <th rowSpan="2" className=" p-2 sticky top-22 bg-gray-100">
                    Sl
                  </th>
                  <th rowSpan="2" className="p-2 sticky top-22 bg-gray-100">
                    Products Name
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Opening Stock
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Primary
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Market Return
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Office Return
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Secondary
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Closing Stock
                  </th>
                </tr>
                <tr className="bg-gray-100 sticky top-32">
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={item.barcode} className="hover:bg-gray-50">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{item.productName}</td>
                    <td className="border p-2 text-right">
                      {item.openingStock} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.openingValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.primary} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.primaryValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.marketReturn} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.marketReturnValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.officeReturn} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.officeReturnValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.secondary} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.secondaryValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.openingStock +
                        item.primary +
                        item.marketReturn -
                        item.secondary -
                        item.officeReturn}{" "}
                      pcs
                    </td>
                    <td className="border p-2 text-right">
                      {(
                        item.openingValueDP +
                        item.primaryValueDP +
                        item.marketReturnValueDP -
                        item.secondaryValueDP -
                        item.officeReturnValueDP
                      )?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-[-1px] bg-gray-100">
                <tr className="font-bold">
                  <td className="p-2" colSpan="2">
                    Total
                  </td>
                  <td className="p-2 text-right">{totals.openingQty}</td>
                  <td className="p-2 text-right">
                    {totals.openingValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.primaryQty}</td>
                  <td className="p-2 text-right">
                    {totals.primaryValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.marketReturnQty}</td>
                  <td className="p-2 text-right">
                    {totals.marketReturnValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.officeReturnQty}</td>
                  <td className="p-2 text-right">
                    {totals.officeReturnValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.secondaryQty}</td>
                  <td className="p-2 text-right">
                    {totals.secondaryValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.closingQty}</td>
                  <td className="p-2 text-right">
                    {totals.closingValue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!loading && reportData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No data available for selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovementReport;
