import React, { useState, useEffect, useMemo, useRef } from "react";
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
  const [selectedZone, setSelectedZone] = useState("");
  const [zones, setZones] = useState([]);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    openingStock: true,
    primary: true,
    secondary: true,
    marketReturn: true,
    actualSecondary: true,
    officeReturn: true,
    closingStock: true,
  });
  const [columnView, setColumnView] = useState("Normal");
  const [showProductTotal, setShowProductTotal] = useState(true);
  const [showProductAverage, setShowProductAverage] = useState(true);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState(visibleColumns);
  const [draftColumnView, setDraftColumnView] = useState("Normal");
  const [draftShowProductTotal, setDraftShowProductTotal] = useState(true);
  const [draftShowProductAverage, setDraftShowProductAverage] = useState(true);
  const [periodData, setPeriodData] = useState([]);
  const fetchControllerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    axios.get("http://175.29.181.245:2001/api/full-stock-summary-zones", { signal: controller.signal })
      .then((response) => {
        const availableZones = (response.data?.data || []).filter(Boolean).sort();
        setZones(availableZones);
        setSelectedZone(availableZones[0] || "all");
        setZonesLoaded(true);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        console.error("Zone load error:", loadError);
        setError("Failed to load zones. Please refresh the page and try again.");
        setZonesLoaded(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (zonesLoaded && dateRange.start && dateRange.end && selectedZone) {
      fetchReportData();
    }
  }, [zonesLoaded, selectedZone, dateRange.start, dateRange.end, columnView]);

  useEffect(() => () => fetchControllerRef.current?.abort(), []);

  const fetchReportData = async () => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      if (!dateRange.start || !dateRange.end) {
        throw new Error("Please select both start and end dates");
      }

      const rangeStart = dayjs(dateRange.start).startOf("day");
      const rangeEnd = dayjs(dateRange.end).endOf("day");
      if (rangeStart.isAfter(rangeEnd)) throw new Error("The start date must be before the end date");

      const viewConfig = {
        Monthly: { unit: "month", label: (date) => date.format("MMM YYYY") },
        Quarterly: { unit: "month", label: (date) => `Q${Math.floor(date.month() / 3) + 1} ${date.format("YYYY")}` },
        "Half Yearly": { unit: "month", label: (date) => `H${date.month() < 6 ? 1 : 2} ${date.format("YYYY")}` },
      }[columnView];
      const ranges = [];
      if (!viewConfig) {
        ranges.push({ start: rangeStart, end: rangeEnd, label: "Normal" });
      } else {
        const seen = new Set();
        let cursor = rangeStart.startOf(viewConfig.unit);
        while (cursor.isBefore(rangeEnd) || cursor.isSame(rangeEnd)) {
          const bucketStartMonth = columnView === "Quarterly"
            ? Math.floor(cursor.month() / 3) * 3
            : columnView === "Half Yearly"
              ? (cursor.month() < 6 ? 0 : 6)
              : cursor.month();
          const periodStart = cursor.month(bucketStartMonth).startOf("month");
          const periodEnd = columnView === "Quarterly"
            ? periodStart.add(2, "month").endOf("month")
            : columnView === "Half Yearly"
              ? periodStart.add(5, "month").endOf("month")
              : periodStart.endOf("month");
          const key = viewConfig.label(periodStart);
          if (!seen.has(key)) {
            ranges.push({
              start: periodStart.isBefore(rangeStart) ? rangeStart : periodStart,
              end: periodEnd.isAfter(rangeEnd) ? rangeEnd : periodEnd,
              label: key,
            });
            seen.add(key);
          }
          cursor = periodEnd.add(1, "day");
        }
      }

      const reports = new Array(ranges.length);
      let nextRangeIndex = 0;
      const fetchNextRange = async () => {
        while (nextRangeIndex < ranges.length) {
          const index = nextRangeIndex++;
          const range = ranges[index];
          const response = await axios.get("http://175.29.181.245:2001/api/full-stock-summary", {
            params: {
              startDate: range.start.format("YYYY-MM-DD HH:mm:ss"),
              endDate: range.end.endOf("day").format("YYYY-MM-DD HH:mm:ss"),
              ...(selectedZone !== "all" ? { zone: selectedZone } : {}),
            },
            signal: controller.signal,
          });
          if (!response.data?.success) throw new Error(response.data?.message || "Invalid response format");
          reports[index] = { label: range.label, ...response.data.data };
        }
      };
      await Promise.all(Array.from({ length: Math.min(2, ranges.length) }, fetchNextRange));

      if (reports.length) {
        setPeriodData(reports);
        const productMap = new Map();
        reports.forEach((report) => report.products.forEach((product) => productMap.set(product.barcode, product)));
        setProducts([...productMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
        setOutlets(reports[0].outlets);
      } else {
        setPeriodData([]);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
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
      setPeriodData([]);
    } finally {
      if (fetchControllerRef.current === controller) setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const brandFiltered = selectedBrand === "all"
      ? products
      : products.filter((p) => (p.brand || "Unbranded") === selectedBrand);
    const cats = [...new Set(brandFiltered.map((p) => p.category || "Uncategorized"))].sort();
    return [{ value: "all", label: "All Categories" }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [products, selectedBrand]);

  const brands = useMemo(() => {
    const catFiltered = selectedCategory === "all"
      ? products
      : products.filter((p) => (p.category || "Uncategorized") === selectedCategory);
    const brs = [...new Set(catFiltered.map((p) => p.brand || "Unbranded"))].sort();
    return [{ value: "all", label: "All Brands" }, ...brs.map((b) => ({ value: b, label: b }))];
  }, [products, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch = selectedCategory === "all" || p.category === selectedCategory;
      const brandMatch = selectedBrand === "all" || p.brand === selectedBrand;
      return catMatch && brandMatch;
    });
  }, [products, selectedCategory, selectedBrand]);
  const visibleProducts = filteredProducts;

  const filteredOutlets = useMemo(
    () => selectedZone === "all" ? outlets : outlets.filter((outlet) => outlet.zone === selectedZone),
    [outlets, selectedZone],
  );

  const outletsByZone = useMemo(() => {
    const groups = new Map();
    filteredOutlets.forEach((outlet) => {
      const zone = outlet.zone || "Unassigned Zone";
      if (!groups.has(zone)) groups.set(zone, []);
      groups.get(zone).push(outlet);
    });
    return [...groups.entries()].sort(([zoneA], [zoneB]) => zoneA.localeCompare(zoneB));
  }, [filteredOutlets]);

  const displayPeriods = periodData;

  useEffect(() => {
    if (selectedBrand !== "all") {
      const validCategories = categories.map((c) => c.value);
      if (selectedCategory !== "all" && !validCategories.includes(selectedCategory)) {
        setSelectedCategory("all");
      }
    }
  }, [selectedBrand, categories]);

  useEffect(() => {
    if (selectedCategory !== "all") {
      const validBrands = brands.map((b) => b.value);
      if (selectedBrand !== "all" && !validBrands.includes(selectedBrand)) {
        setSelectedBrand("all");
      }
    }
  }, [selectedCategory, brands]);

  const periodOutletLookups = useMemo(
    () => new Map(periodData.map((period) => [period, new Map(period.outlets.map((outlet) => [outlet.outletName, outlet]))])),
    [periodData],
  );
  const getPeriodOutlet = (period, outlet) => periodOutletLookups.get(period)?.get(outlet.outletName) || outlet;

  const getVal = (outlet, barcode, field, period = periodData[0]) => {
    return getPeriodOutlet(period, outlet).products?.[barcode]?.[field] || 0;
  };

  const getClosing = (outlet, barcode, period = periodData[0]) => {
    const p = getPeriodOutlet(period, outlet).products?.[barcode];
    if (!p) return 0;
    return (
      (p.openingStock || 0) +
      (p.primary || 0) -
      (p.secondary || 0) +
      (p.marketReturn || 0) -
      (p.officeReturn || 0)
    );
  };

  const getActualSecondary = (outlet, barcode, period = periodData[0]) => getVal(outlet, barcode, "secondary", period) - getVal(outlet, barcode, "marketReturn", period);

  const columnOptions = [
    { key: "openingStock", label: "Opening", getValue: (outlet, barcode, period) => getVal(outlet, barcode, "openingStock", period) },
    { key: "primary", label: "Primary", getValue: (outlet, barcode, period) => getVal(outlet, barcode, "primary", period) },
    { key: "secondary", label: "Secondary", getValue: (outlet, barcode, period) => getVal(outlet, barcode, "secondary", period) },
    { key: "marketReturn", label: "Market Return", shortLabel: "Mkt Ret", getValue: (outlet, barcode, period) => getVal(outlet, barcode, "marketReturn", period) },
    { key: "actualSecondary", label: "Act Secondary", getValue: getActualSecondary },
    { key: "officeReturn", label: "Office Return", shortLabel: "Off Ret", getValue: (outlet, barcode, period) => getVal(outlet, barcode, "officeReturn", period) },
    { key: "closingStock", label: "Closing", getValue: getClosing },
  ];
  const activeColumns = columnOptions.filter(({ key }) => visibleColumns[key]);
  const draftActiveColumnCount = columnOptions.filter(({ key }) => draftVisibleColumns[key]).length;
  // Period summaries belong to each product, never to the whole report.
  const getProductPeriodTotal = (outlet, product, column) => displayPeriods.reduce(
    (sum, period) => sum + (column.getValue(outlet, product.barcode, period) || 0),
    0,
  );
  const getProductPeriodAverage = (outlet, product, column) => (
    Number((displayPeriods.length ? getProductPeriodTotal(outlet, product, column) / displayPeriods.length : 0).toFixed(2))
  );
  const getProductGrandPeriodTotal = (product, column) => filteredOutlets.reduce(
    (sum, outlet) => sum + getProductPeriodTotal(outlet, product, column),
    0,
  );
  const getProductGrandPeriodAverage = (product, column) => Number((
    displayPeriods.length ? getProductGrandPeriodTotal(product, column) / displayPeriods.length : 0
  ).toFixed(2));
  const showPeriodSummaryColumns = columnView !== "Normal" && (showProductTotal || showProductAverage);
  const productSummaryColumnCount = activeColumns.length * (
    (showPeriodSummaryColumns && showProductTotal ? 1 : 0) +
    (showPeriodSummaryColumns && showProductAverage ? 1 : 0)
  );
  const exportToExcel = () => {
    try {
      const prods = filteredProducts;
      const subHeaders = activeColumns.map((column) => column.label);
      const totalCols = 1 + prods.length * (displayPeriods.length * activeColumns.length + productSummaryColumnCount);
      const headerRow1 = ["Dealer Name"];
      const headerRow2 = [""];
      const headerRow3 = [""];
      const headerMerges = [];
      let col = 1;
      if (columnView === "Normal") {
        prods.forEach((product) => {
          headerRow1.push(product.name, ...new Array(activeColumns.length - 1).fill(""));
          headerRow2.push(...subHeaders);
          headerMerges.push({ s: { r: 2, c: col }, e: { r: 2, c: col + activeColumns.length - 1 } });
          col += activeColumns.length;
        });
      } else {
        prods.forEach((product) => {
          const productSpan = displayPeriods.length * activeColumns.length + productSummaryColumnCount;
          headerRow1.push(product.name, ...new Array(productSpan - 1).fill(""));
          headerMerges.push({ s: { r: 2, c: col }, e: { r: 2, c: col + productSpan - 1 } });
          displayPeriods.forEach((period) => {
            headerRow2.push(period.label, ...new Array(activeColumns.length - 1).fill(""));
            headerRow3.push(...subHeaders);
            headerMerges.push({ s: { r: 3, c: col }, e: { r: 3, c: col + activeColumns.length - 1 } });
            col += activeColumns.length;
          });
          if (showPeriodSummaryColumns) {
            [
              ...(showProductTotal ? ["Total"] : []),
              ...(showProductAverage ? ["Average"] : []),
            ].forEach((label) => {
              headerRow2.push(label, ...new Array(activeColumns.length - 1).fill(""));
              headerRow3.push(...subHeaders);
              headerMerges.push({ s: { r: 3, c: col }, e: { r: 3, c: col + activeColumns.length - 1 } });
              col += activeColumns.length;
            });
          }
        });
      }

      const dataRows = [];
      const zoneHeaderRows = [];
      const dataStartRow = columnView === "Normal" ? 4 : 5;
      outletsByZone.forEach(([zone, zoneOutlets]) => {
        zoneHeaderRows.push(dataStartRow + dataRows.length);
        dataRows.push([zone, ...new Array(totalCols - 1).fill("")]);
        zoneOutlets.forEach((outlet) => {
          const row = [outlet.outletName];
          prods.forEach((product) => {
            displayPeriods.forEach((period) => {
              row.push(...activeColumns.map((column) => column.getValue(outlet, product.barcode, period)));
            });
            if (showPeriodSummaryColumns && showProductTotal) row.push(...activeColumns.map((column) => getProductPeriodTotal(outlet, product, column)));
            if (showPeriodSummaryColumns && showProductAverage) row.push(...activeColumns.map((column) => getProductPeriodAverage(outlet, product, column)));
          });
          dataRows.push(row);
        });
      });

      const totalsRow = ["TOTAL"];
      prods.forEach((product) => {
        displayPeriods.forEach((period) => {
          totalsRow.push(...activeColumns.map((column) =>
            filteredOutlets.reduce((sum, outlet) => sum + column.getValue(outlet, product.barcode, period), 0),
          ));
        });
        if (showPeriodSummaryColumns && showProductTotal) totalsRow.push(...activeColumns.map((column) => getProductGrandPeriodTotal(product, column)));
        if (showPeriodSummaryColumns && showProductAverage) totalsRow.push(...activeColumns.map((column) => getProductGrandPeriodAverage(product, column)));
      });

      const filterLabel =
        (selectedCategory !== "all" ? `Category: ${selectedCategory}` : "") +
        (selectedBrand !== "all" ? `${selectedCategory !== "all" ? " | " : ""}Brand: ${selectedBrand}` : "") +
        (selectedZone !== "all" ? `${selectedCategory !== "all" || selectedBrand !== "all" ? " | " : ""}Zone: ${selectedZone}` : "");

      const excelData = [
        [
          `Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(dateRange.end).format("DD-MM-YY")}${filterLabel ? ` | ${filterLabel}` : ""}`,
          "",
          ...new Array(totalCols - 2).fill(""),
        ],
        [],
        headerRow1,
        headerRow2,
        ...(columnView === "Normal" ? [] : [headerRow3]),
        ...dataRows,
        totalsRow,
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      if (columnView !== "Normal" && showProductAverage) {
        headerRow2.forEach((header, startCol) => {
          if (header !== "Average") return;
          for (let row = 5; row < excelData.length; row++) {
            for (let offset = 0; offset < activeColumns.length; offset++) {
              const address = XLSX.utils.encode_cell({ r: row, c: startCol + offset });
              if (ws[address] && typeof ws[address].v === "number") ws[address].z = "0.00";
            }
          }
        });
      }

      ws["!cols"] = [{ wch: 35 }];
      for (let i = 1; i < totalCols; i++) ws["!cols"].push({ wch: 14 });

      const merges = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: totalCols - 1 },
        },
      ];

      if (columnView !== "Normal") merges.push({ s: { r: 2, c: 0 }, e: { r: 4, c: 0 } });
      merges.push(...headerMerges);
      zoneHeaderRows.forEach((row) => {
        merges.push({ s: { r: row, c: 0 }, e: { r: row, c: totalCols - 1 } });
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
        `Full Stock Summary Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(dateRange.end).format("DD-MM-YY")}${selectedZone !== "all" ? ` | Zone: ${selectedZone}` : ""}`,
        14,
        15,
      );

      const subHeaders = activeColumns.map((column) => column.shortLabel || column.label);
      const headers = columnView === "Normal"
        ? [["Dealer Name", ...prods.flatMap(() => subHeaders)]]
        : [
          [
            { content: "Dealer Name", rowSpan: 3, styles: { halign: "left" } },
            ...prods.map((product) => ({ content: product.name, colSpan: displayPeriods.length * activeColumns.length + productSummaryColumnCount })),
          ],
          [
            ...prods.flatMap(() => [
              ...displayPeriods.map((period) => ({ content: period.label, colSpan: activeColumns.length })),
              ...(showPeriodSummaryColumns && showProductTotal ? [{ content: "Total", colSpan: activeColumns.length }] : []),
              ...(showPeriodSummaryColumns && showProductAverage ? [{ content: "Average", colSpan: activeColumns.length }] : []),
            ]),
          ],
          [
            ...prods.flatMap(() => [
              ...displayPeriods.flatMap(() => subHeaders),
              ...(showPeriodSummaryColumns && showProductTotal ? subHeaders : []),
              ...(showPeriodSummaryColumns && showProductAverage ? subHeaders : []),
            ]),
          ],
        ];

      const body = [];
      outletsByZone.forEach(([zone, zoneOutlets]) => {
        body.push([{
          content: zone,
          colSpan: 1 + prods.length * (displayPeriods.length * activeColumns.length + productSummaryColumnCount),
          styles: { fontStyle: "bold", fillColor: [219, 234, 254], halign: "left" },
        }]);
        zoneOutlets.forEach((outlet) => {
          const row = [outlet.outletName];
          if (columnView === "Normal") {
            const period = displayPeriods[0];
            prods.forEach((product) => {
              row.push(...activeColumns.map((column) => column.getValue(outlet, product.barcode, period)));
            });
          } else {
            prods.forEach((product) => {
              displayPeriods.forEach((period) => row.push(...activeColumns.map((column) => column.getValue(outlet, product.barcode, period))));
              if (showPeriodSummaryColumns && showProductTotal) row.push(...activeColumns.map((column) => getProductPeriodTotal(outlet, product, column)));
              if (showPeriodSummaryColumns && showProductAverage) row.push(...activeColumns.map((column) => getProductPeriodAverage(outlet, product, column).toFixed(2)));
            });
          }
          body.push(row);
        });
      });

      const totalsRow = ["TOTAL"];
      if (columnView === "Normal") {
        const period = displayPeriods[0];
        prods.forEach((product) => {
          totalsRow.push(...activeColumns.map((column) =>
            filteredOutlets.reduce((sum, outlet) => sum + column.getValue(outlet, product.barcode, period), 0),
          ));
        });
      } else {
        prods.forEach((product) => {
          displayPeriods.forEach((period) => totalsRow.push(...activeColumns.map((column) => filteredOutlets.reduce((sum, outlet) => sum + column.getValue(outlet, product.barcode, period), 0))));
          if (showPeriodSummaryColumns && showProductTotal) totalsRow.push(...activeColumns.map((column) => getProductGrandPeriodTotal(product, column)));
          if (showPeriodSummaryColumns && showProductAverage) totalsRow.push(...activeColumns.map((column) => getProductGrandPeriodAverage(product, column).toFixed(2)));
        });
      }
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
              <button
                type="button"
                onClick={() => {
                  setDraftVisibleColumns(visibleColumns);
                  setDraftColumnView(columnView);
                  setDraftShowProductTotal(showProductTotal);
                  setDraftShowProductAverage(showProductAverage);
                  setIsConfigureOpen(true);
                }}
                className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Configure
              </button>
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

          {isConfigureOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsConfigureOpen(false); }}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="configure-columns-title"
                className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
              >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700">Report display</p>
                    <h2 id="configure-columns-title" className="text-xl font-semibold text-slate-900">Configure Columns</h2>
                    <p className="mt-1 text-sm text-slate-500">Choose a period layout and the values to include.</p>
                  </div>
                  <button type="button" onClick={() => setIsConfigureOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close configure columns">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                <div className="overflow-y-auto px-6 py-5">
                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Column View
                      <select value={draftColumnView} onChange={(event) => setDraftColumnView(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                      <option>Normal</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Half Yearly</option>
                      </select>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 self-end rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60">
                      <input type="checkbox" checked={draftShowProductTotal} onChange={(event) => setDraftShowProductTotal(event.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
                      <span><span className="block">Show product total</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Add a Total group after each product’s periods.</span></span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60">
                      <input type="checkbox" checked={draftShowProductAverage} onChange={(event) => setDraftShowProductAverage(event.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
                      <span><span className="block">Show product average</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Add an Average group after each product’s periods.</span></span>
                    </label>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Movement columns</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Keep at least one value selected.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{draftActiveColumnCount} selected</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {columnOptions.map((column) => (
                      <label key={column.key} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 text-sm transition ${draftVisibleColumns[column.key] ? "border-blue-200 bg-blue-50/70 text-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={draftVisibleColumns[column.key]}
                          disabled={draftVisibleColumns[column.key] && draftActiveColumnCount === 1}
                          onChange={(event) => setDraftVisibleColumns((current) => ({ ...current, [column.key]: event.target.checked }))}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span className="font-medium">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setDraftVisibleColumns(Object.fromEntries(columnOptions.map(({ key }) => [key, true])))}
                    className="text-sm font-medium text-blue-700 transition hover:text-blue-900"
                  >
                    Select all columns
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsConfigureOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Cancel</button>
                    <button
                      type="button"
                      onClick={() => {
                        setVisibleColumns(draftVisibleColumns);
                        setColumnView(draftColumnView);
                        setShowProductTotal(draftShowProductTotal);
                        setShowProductAverage(draftShowProductAverage);
                        setIsConfigureOpen(false);
                      }}
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                    >
                      Apply settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                {zones.length !== 1 && <option value="all">All Zones</option>}
                {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            </div>
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
                disabled={loading || !zonesLoaded}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full"
              >
                {!zonesLoaded ? "Loading zones..." : loading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {(loading || !zonesLoaded) && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {!loading && zonesLoaded && filteredProducts.length > 0 && filteredOutlets.length > 0 && (
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
                    {columnView === "Normal" ? (
                      <>
                        <th colSpan={visibleProducts.length * activeColumns.length} className="bg-gray-200 border p-2 text-center">Particulars</th>
                      </>
                    ) : <>
                      {visibleProducts.map((product) => <th key={product.barcode} colSpan={displayPeriods.length * activeColumns.length + productSummaryColumnCount} className="bg-gray-200 border p-2 text-center">{product.name}</th>)}
                    </>}
                  </tr>
                  <tr>
                    {columnView === "Normal"
                      ? <>
                        {visibleProducts.map((product) => <th key={product.barcode} colSpan={activeColumns.length} className="bg-gray-100 border p-2 text-center text-xs">{product.name}</th>)}
                      </>
                      : <>
                        {visibleProducts.flatMap((product) => [
                          ...displayPeriods.map((period) => <th key={`${product.barcode}-${period.label}`} colSpan={activeColumns.length} className="bg-gray-100 border p-2 text-center text-xs">{period.label}</th>),
                          ...(showPeriodSummaryColumns && showProductTotal ? [<th key={`${product.barcode}-total`} colSpan={activeColumns.length} className="bg-blue-50 border p-2 text-center text-xs">Total</th>] : []),
                          ...(showPeriodSummaryColumns && showProductAverage ? [<th key={`${product.barcode}-average`} colSpan={activeColumns.length} className="bg-blue-50 border p-2 text-center text-xs">Average</th>] : []),
                        ])}
                      </>}
                  </tr>
                  <tr>
                    {(columnView === "Normal"
                      ? visibleProducts.map((product) => ({ product, period: displayPeriods[0] }))
                      : visibleProducts.flatMap((product) => [
                        ...displayPeriods.map((period) => ({ product, period })),
                        ...(showPeriodSummaryColumns && showProductTotal ? [{ product, summary: "total" }] : []),
                        ...(showPeriodSummaryColumns && showProductAverage ? [{ product, summary: "average" }] : []),
                      ]))
                      .map((group) => <React.Fragment key={`${group.product.barcode}-${group.period?.label || group.summary}`}>
                        {activeColumns.map((column) => <th key={column.key} className="bg-gray-50 border p-1 text-xs text-center whitespace-nowrap">{column.shortLabel || column.label}</th>)}
                      </React.Fragment>)}
                  </tr>
                </thead>
                <tbody>
                  {outletsByZone.map(([zone, zoneOutlets]) => (
                    <React.Fragment key={zone}>
                      <tr className="bg-blue-100 font-bold">
                        <td colSpan={1 + visibleProducts.length * (displayPeriods.length * activeColumns.length + productSummaryColumnCount)} className="border px-3 py-2 text-sm text-blue-900">
                          {zone}
                        </td>
                      </tr>
                      {zoneOutlets.map((outlet, index) => (
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
                      {(columnView === "Normal" ? visibleProducts.map((product) => ({ product, period: displayPeriods[0] })) : visibleProducts.flatMap((product) => [
                        ...displayPeriods.map((period) => ({ product, period })),
                        ...(showPeriodSummaryColumns && showProductTotal ? [{ product, summary: "total" }] : []),
                        ...(showPeriodSummaryColumns && showProductAverage ? [{ product, summary: "average" }] : []),
                      ])).map(({ product, period, summary }) => <React.Fragment key={`${product.barcode}-${period?.label || summary}`}>
                        {activeColumns.map((column) => <td key={column.key} className="border p-1 text-right text-xs">{summary === "total" ? getProductPeriodTotal(outlet, product, column) : summary === "average" ? getProductPeriodAverage(outlet, product, column).toFixed(2) : column.getValue(outlet, product.barcode, period)}</td>)}
                      </React.Fragment>)}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr className="bg-gray-200 font-bold sticky bottom-0">
                    <td
                      className="border p-2 bg-gray-200"
                      style={{ position: "sticky", left: 0, zIndex: 1 }}
                    >
                      TOTAL
                    </td>
                    {(columnView === "Normal" ? visibleProducts.map((product) => ({ product, period: displayPeriods[0] })) : visibleProducts.flatMap((product) => [
                      ...displayPeriods.map((period) => ({ product, period })),
                      ...(showPeriodSummaryColumns && showProductTotal ? [{ product, summary: "total" }] : []),
                      ...(showPeriodSummaryColumns && showProductAverage ? [{ product, summary: "average" }] : []),
                    ])).map(({ product, period, summary }) => <React.Fragment key={`${product.barcode}-${period?.label || summary}`}>
                      {activeColumns.map((column) => <td key={column.key} className="border p-1 text-right text-xs">{summary === "total" ? getProductGrandPeriodTotal(product, column) : summary === "average" ? getProductGrandPeriodAverage(product, column).toFixed(2) : filteredOutlets.reduce((sum, outlet) => sum + column.getValue(outlet, product.barcode, period), 0)}</td>)}
                    </React.Fragment>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {!loading && zonesLoaded && filteredProducts.length === 0 && !error && products.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              No products match the selected category/brand filter.
            </div>
          )}

          {!loading && zonesLoaded && products.length === 0 && !error && (
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
