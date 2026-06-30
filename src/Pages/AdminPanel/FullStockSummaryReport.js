import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import AdminSidebar from "../../Component/AdminSidebar";

const FullStockSummaryReport = () => {
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [error, setError] = useState(null);
  const [exportDropdown, setExportDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReportData();
    }
  }, [dateRange.start, dateRange.end]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!dateRange.start || !dateRange.end) {
        throw new Error("Please select both start and end dates");
      }

      const params = {
        startDate: dayjs(dateRange.start).format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs(dateRange.end)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };

      const response = await axios.get(
        "http://175.29.181.245:2001/api/full-stock-summary",
        { params },
      );

      if (response.data?.success) {
        setProducts(response.data.data.products);
        setOutlets(response.data.data.outlets);
        setSelectedCategory("all");
        setSelectedBrand("all");
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
        errorMessage = "No response from server";
      }
      setError(errorMessage);
      setProducts([]);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category || "Uncategorized"))].sort();
    return [{ value: "all", label: "All Categories" }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [products]);

  const brands = useMemo(() => {
    const filteredProducts =
      selectedCategory === "all"
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const brs = [...new Set(filteredProducts.map((p) => p.brand || "Unbranded"))].sort();
    return [{ value: "all", label: "All Brands" }, ...brs.map((b) => ({ value: b, label: b }))];
  }, [products, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch = selectedCategory === "all" || p.category === selectedCategory;
      const brandMatch = selectedBrand === "all" || p.brand === selectedBrand;
      return catMatch && brandMatch;
    });
  }, [products, selectedCategory, selectedBrand]);

  useEffect(() => {
    if (selectedCategory !== "all") {
      const validBrands = brands.map((b) => b.value);
      if (selectedBrand !== "all" && !validBrands.includes(selectedBrand)) {
        setSelectedBrand("all");
      }
    }
  }, [selectedCategory, brands]);

  const getVal = (outlet, barcode, field) => {
    return outlet.products[barcode]?.[field] || 0;
  };

  const getClosing = (outlet, barcode) => {
    const p = outlet.products[barcode];
    if (!p) return 0;
    return (
      (p.openingStock || 0) +
      (p.primary || 0) -
      (p.secondary || 0) +
      (p.marketReturn || 0) -
      (p.officeReturn || 0)
    );
  };

  const getTotal = (barcode, field) => {
    return outlets.reduce((sum, outlet) => {
      return sum + getVal(outlet, barcode, field);
    }, 0);
  };

  const exportToExcel = () => {
    try {
      const prods = filteredProducts;
      const subHeaders = [
        "Opening Stock",
        "Primary",
        "Secondary",
        "Market Return",
        "Office Return",
        "Closing Stock",
      ];

      const totalCols = 1 + prods.length * 6;
      const headerRow1 = ["Dealer Name"];
      const headerRow2 = [""];

      prods.forEach((product) => {
        headerRow1.push(product.name, "", "", "", "", "");
        headerRow2.push(...subHeaders);
      });

      const dataRows = outlets.map((outlet) => {
        const row = [outlet.outletName];
        prods.forEach((product) => {
          const barcode = product.barcode;
          row.push(
            getVal(outlet, barcode, "openingStock"),
            getVal(outlet, barcode, "primary"),
            getVal(outlet, barcode, "secondary"),
            getVal(outlet, barcode, "marketReturn"),
            getVal(outlet, barcode, "officeReturn"),
            getClosing(outlet, barcode),
          );
        });
        return row;
      });

      const totalsRow = ["TOTAL"];
      prods.forEach((product) => {
        const barcode = product.barcode;
        const tOpening = getTotal(barcode, "openingStock");
        const tPrimary = getTotal(barcode, "primary");
        const tSecondary = getTotal(barcode, "secondary");
        const tMarketReturn = getTotal(barcode, "marketReturn");
        const tOfficeReturn = getTotal(barcode, "officeReturn");
        totalsRow.push(
          tOpening,
          tPrimary,
          tSecondary,
          tMarketReturn,
          tOfficeReturn,
          tOpening + tPrimary - tSecondary + tMarketReturn - tOfficeReturn,
        );
      });

      const filterLabel =
        (selectedCategory !== "all" ? `Category: ${selectedCategory}` : "") +
        (selectedBrand !== "all" ? `${selectedCategory !== "all" ? " | " : ""}Brand: ${selectedBrand}` : "");

      const excelData = [
        [
          `Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(dateRange.end).format("DD-MM-YY")}${filterLabel ? ` | ${filterLabel}` : ""}`,
          "",
          ...new Array(prods.length * 6 - 1).fill(""),
        ],
        [],
        headerRow1,
        headerRow2,
        ...dataRows,
        totalsRow,
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      ws["!cols"] = [{ wch: 35 }];
      prods.forEach(() => {
        for (let i = 0; i < 6; i++) {
          ws["!cols"].push({ wch: 14 });
        }
      });

      const merges = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: totalCols - 1 },
        },
      ];

      prods.forEach((_, idx) => {
        const startCol = 1 + idx * 6;
        merges.push({
          s: { r: 2, c: startCol },
          e: { r: 2, c: startCol + 5 },
        });
      });

      ws["!merges"] = merges;

      XLSX.utils.book_append_sheet(wb, ws, "Full Stock Summary");

      const fileName = `Full_Stock_Summary_${dayjs(dateRange.start).format("YYYY-MM-DD")}_to_${dayjs(dateRange.end).format("YYYY-MM-DD")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export Excel. Please try again.");
    }
  };

  const exportToPDF = () => {
    try {
      const prods = filteredProducts;
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
      });

      doc.setFontSize(14);
      doc.text(
        `Full Stock Summary Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(dateRange.end).format("DD-MM-YY")}`,
        14,
        15,
      );

      const subHeaders = [
        "Opening",
        "Primary",
        "Secondary",
        "Mkt Ret",
        "Off Ret",
        "Closing",
      ];

      const headers = [
        ["Dealer Name", ...prods.flatMap(() => subHeaders)],
      ];

      const body = outlets.map((outlet) => {
        const row = [outlet.outletName];
        prods.forEach((product) => {
          const barcode = product.barcode;
          row.push(
            getVal(outlet, barcode, "openingStock"),
            getVal(outlet, barcode, "primary"),
            getVal(outlet, barcode, "secondary"),
            getVal(outlet, barcode, "marketReturn"),
            getVal(outlet, barcode, "officeReturn"),
            getClosing(outlet, barcode),
          );
        });
        return row;
      });

      const totalsRow = ["TOTAL"];
      prods.forEach((product) => {
        const barcode = product.barcode;
        const tOpening = getTotal(barcode, "openingStock");
        const tPrimary = getTotal(barcode, "primary");
        const tSecondary = getTotal(barcode, "secondary");
        const tMarketReturn = getTotal(barcode, "marketReturn");
        const tOfficeReturn = getTotal(barcode, "officeReturn");
        totalsRow.push(
          tOpening,
          tPrimary,
          tSecondary,
          tMarketReturn,
          tOfficeReturn,
          tOpening + tPrimary - tSecondary + tMarketReturn - tOfficeReturn,
        );
      });
      body.push(totalsRow);

      autoTable(doc, {
        head: headers,
        body: body,
        startY: 22,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 1,
          overflow: "linebreak",
          halign: "center",
        },
        headStyles: {
          fillColor: [55, 65, 81],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
        },
        columnStyles: {
          0: { halign: "left", cellWidth: 40 },
        },
      });

      const fileName = `Full_Stock_Summary_${dayjs(dateRange.start).format("YYYY-MM-DD")}_to_${dayjs(dateRange.end).format("YYYY-MM-DD")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-6 bg-gray-100 overflow-auto">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Full Stock Summary
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setExportDropdown(!exportDropdown)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export
                </button>
                {exportDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                    <button
                      onClick={() => {
                        exportToExcel();
                        setExportDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => {
                        exportToPDF();
                        setExportDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Export to PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {brands.map((br) => (
                  <option key={br.value} value={br.value}>
                    {br.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full"
              >
                {loading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && outlets.length > 0 && (
            <div className="shadow rounded-lg overflow-x-auto">
              <table
                className="border border-gray-300"
                style={{ minWidth: "max-content" }}
              >
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th
                      rowSpan="3"
                      className="bg-gray-200 border p-2 text-left"
                      style={{ position: "sticky", left: 0, minWidth: "200px", zIndex: 20 }}
                    >
                      Dealer Name
                    </th>
                    <th
                      colSpan={filteredProducts.length * 6}
                      className="bg-gray-200 border p-2 text-center"
                    >
                      Particulars
                    </th>
                  </tr>
                  <tr>
                    {filteredProducts.map((product) => (
                      <th
                        key={product.barcode}
                        colSpan="6"
                        className="bg-gray-100 border p-2 text-center text-xs"
                      >
                        {product.name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {filteredProducts.map((product) => (
                      <React.Fragment key={product.barcode}>
                        <th className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">
                          Opening
                        </th>
                        <th className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">
                          Primary
                        </th>
                        <th className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">
                          Secondary
                        </th>
                        <th className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">
                          Mkt Ret
                        </th>
                        <th className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">
                          Off Ret
                        </th>
                        <th className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">
                          Closing
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outlets.map((outlet, index) => (
                    <tr
                      key={outlet.outletName}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td
                        className="border p-2 font-medium text-sm whitespace-nowrap bg-white"
                        style={{ position: "sticky", left: 0, zIndex: 1 }}
                      >
                        {outlet.outletName}
                      </td>
                      {filteredProducts.map((product) => {
                        const barcode = product.barcode;
                        const opening = getVal(outlet, barcode, "openingStock");
                        const primary = getVal(outlet, barcode, "primary");
                        const secondary = getVal(outlet, barcode, "secondary");
                        const marketReturn = getVal(
                          outlet,
                          barcode,
                          "marketReturn",
                        );
                        const officeReturn = getVal(
                          outlet,
                          barcode,
                          "officeReturn",
                        );
                        const closing = getClosing(outlet, barcode);

                        return (
                          <React.Fragment key={barcode}>
                            <td className="border p-1 text-right text-xs">
                              {opening}
                            </td>
                            <td className="border p-1 text-right text-xs text-green-600">
                              {primary}
                            </td>
                            <td className="border p-1 text-right text-xs text-blue-600">
                              {secondary}
                            </td>
                            <td className="border p-1 text-right text-xs text-red-600">
                              {marketReturn}
                            </td>
                            <td className="border p-1 text-right text-xs text-yellow-600">
                              {officeReturn}
                            </td>
                            <td className="border p-1 text-right text-xs font-medium">
                              {closing}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold sticky bottom-0">
                    <td
                      className="border p-2 bg-gray-200"
                      style={{ position: "sticky", left: 0, zIndex: 1 }}
                    >
                      TOTAL
                    </td>
                    {filteredProducts.map((product) => {
                      const barcode = product.barcode;
                      const tOpening = getTotal(barcode, "openingStock");
                      const tPrimary = getTotal(barcode, "primary");
                      const tSecondary = getTotal(barcode, "secondary");
                      const tMarketReturn = getTotal(barcode, "marketReturn");
                      const tOfficeReturn = getTotal(barcode, "officeReturn");
                      const tClosing =
                        tOpening +
                        tPrimary -
                        tSecondary +
                        tMarketReturn -
                        tOfficeReturn;

                      return (
                        <React.Fragment key={barcode}>
                          <td className="border p-1 text-right text-xs">
                            {tOpening}
                          </td>
                          <td className="border p-1 text-right text-xs">
                            {tPrimary}
                          </td>
                          <td className="border p-1 text-right text-xs">
                            {tSecondary}
                          </td>
                          <td className="border p-1 text-right text-xs">
                            {tMarketReturn}
                          </td>
                          <td className="border p-1 text-right text-xs">
                            {tOfficeReturn}
                          </td>
                          <td className="border p-1 text-right text-xs">
                            {tClosing}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && !error && products.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              No products match the selected category/brand filter.
            </div>
          )}

          {!loading && products.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              Select a date range and click "Apply Filter" to view data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullStockSummaryReport;
