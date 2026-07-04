import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";

const API_CONFIG = {
  baseURL: "http://175.29.181.245:2001",
  timeout: 5000000,
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const PRESETS = [
  {
    label: "This Month vs Same Month Last Year",
    value: "this_month_vs_last_year",
    getDates: () => ({
      p1: {
        startDate: dayjs().startOf("month").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD HH:mm:ss"),
        label: dayjs().format("MMMM YYYY"),
      },
      p2: {
        startDate: dayjs().subtract(1, "year").startOf("month").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().subtract(1, "year").endOf("month").format("YYYY-MM-DD HH:mm:ss"),
        label: dayjs().subtract(1, "year").format("MMMM YYYY"),
      },
    }),
  },
  {
    label: "Last 30 Days vs Previous 30 Days",
    value: "last_30_vs_prev_30",
    getDates: () => ({
      p1: {
        startDate: dayjs().subtract(29, "day").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        label: `Last 30 Days (${dayjs().subtract(29, "day").format("DD MMM")} - ${dayjs().format("DD MMM")})`,
      },
      p2: {
        startDate: dayjs().subtract(59, "day").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().subtract(30, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        label: `Prev 30 Days (${dayjs().subtract(59, "day").format("DD MMM")} - ${dayjs().subtract(30, "day").format("DD MMM")})`,
      },
    }),
  },
  {
    label: "Last 7 Days vs Previous 7 Days",
    value: "last_7_vs_prev_7",
    getDates: () => ({
      p1: {
        startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        label: `Last 7 Days (${dayjs().subtract(6, "day").format("DD MMM")} - ${dayjs().format("DD MMM")})`,
      },
      p2: {
        startDate: dayjs().subtract(13, "day").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().subtract(7, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        label: `Prev 7 Days (${dayjs().subtract(13, "day").format("DD MMM")} - ${dayjs().subtract(7, "day").format("DD MMM")})`,
      },
    }),
  },
  {
    label: "This Quarter vs Same Quarter Last Year",
    value: "this_quarter_vs_last_year",
    getDates: () => {
      const currentQuarter = Math.floor(dayjs().month() / 3);
      const qStart = dayjs().quarter(currentQuarter + 1).startOf("quarter");
      const qEnd = dayjs().quarter(currentQuarter + 1).endOf("quarter");
      const lastYearQStart = qStart.subtract(1, "year");
      const lastYearQEnd = qEnd.subtract(1, "year");
      return {
        p1: {
          startDate: qStart.format("YYYY-MM-DD HH:mm:ss"),
          endDate: qEnd.format("YYYY-MM-DD HH:mm:ss"),
          label: `Q${currentQuarter + 1} ${dayjs().format("YYYY")}`,
        },
        p2: {
          startDate: lastYearQStart.format("YYYY-MM-DD HH:mm:ss"),
          endDate: lastYearQEnd.format("YYYY-MM-DD HH:mm:ss"),
          label: `Q${currentQuarter + 1} ${dayjs().subtract(1, "year").format("YYYY")}`,
        },
      };
    },
  },
  {
    label: "This Half Year vs Same Half Last Year",
    value: "this_half_vs_last_year",
    getDates: () => {
      const isH1 = dayjs().month() < 6;
      const hStart = isH1 ? dayjs().startOf("year") : dayjs().startOf("year").add(6, "month");
      const hEnd = isH1 ? dayjs().startOf("year").add(6, "month").subtract(1, "day") : dayjs().endOf("year");
      const lastYearHStart = hStart.subtract(1, "year");
      const lastYearHEnd = hEnd.subtract(1, "year");
      return {
        p1: {
          startDate: hStart.format("YYYY-MM-DD HH:mm:ss"),
          endDate: hEnd.format("YYYY-MM-DD HH:mm:ss"),
          label: `${isH1 ? "H1" : "H2"} ${dayjs().format("YYYY")}`,
        },
        p2: {
          startDate: lastYearHStart.format("YYYY-MM-DD HH:mm:ss"),
          endDate: lastYearHEnd.format("YYYY-MM-DD HH:mm:ss"),
          label: `${isH1 ? "H1" : "H2"} ${dayjs().subtract(1, "year").format("YYYY")}`,
        },
      };
    },
  },
  {
    label: "This Year vs Last Year",
    value: "this_year_vs_last_year",
    getDates: () => ({
      p1: {
        startDate: dayjs().startOf("year").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        label: dayjs().format("YYYY"),
      },
      p2: {
        startDate: dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs().subtract(1, "year").endOf("year").format("YYYY-MM-DD HH:mm:ss"),
        label: dayjs().subtract(1, "year").format("YYYY"),
      },
    }),
  },
  {
    label: "Custom Date Range",
    value: "custom",
    getDates: () => null,
  },
];

const SalesCompareReport = () => {
  const [selectedPreset, setSelectedPreset] = useState("this_month_vs_last_year");
  const [customP1Start, setCustomP1Start] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [customP1End, setCustomP1End] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [customP2Start, setCustomP2Start] = useState(dayjs().subtract(1, "year").startOf("month").format("YYYY-MM-DD"));
  const [customP2End, setCustomP2End] = useState(dayjs().subtract(1, "year").endOf("month").format("YYYY-MM-DD"));

  const [salesDataP1, setSalesDataP1] = useState([]);
  const [salesDataP2, setSalesDataP2] = useState([]);

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBelt, setSelectedBelt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getBeltFromZone = useCallback((zoneName) => {
    if (!zoneName) return "";
    if (zoneName.includes("ZONE-01")) return "Belt-1";
    if (zoneName.includes("ZONE-03")) return "Belt-3";
    return "";
  }, []);

  const getPresetDates = useCallback(() => {
    const preset = PRESETS.find((p) => p.value === selectedPreset);
    if (!preset) return null;
    return preset.getDates();
  }, [selectedPreset]);

  const fetchSalesData = useCallback(async (startDate, endDate) => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    const response = await api.get(`/sales-reports?${params.toString()}`);
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid data format");
    }
    return response.data;
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dates = getPresetDates();
      let p1, p2;

      if (selectedPreset === "custom") {
        p1 = {
          startDate: dayjs(customP1Start).format("YYYY-MM-DD HH:mm:ss"),
          endDate: dayjs(customP1End).endOf("day").format("YYYY-MM-DD HH:mm:ss"),
          label: `${dayjs(customP1Start).format("DD MMM YYYY")} - ${dayjs(customP1End).format("DD MMM YYYY")}`,
        };
        p2 = {
          startDate: dayjs(customP2Start).format("YYYY-MM-DD HH:mm:ss"),
          endDate: dayjs(customP2End).endOf("day").format("YYYY-MM-DD HH:mm:ss"),
          label: `${dayjs(customP2Start).format("DD MMM YYYY")} - ${dayjs(customP2End).format("DD MMM YYYY")}`,
        };
      } else {
        p1 = dates.p1;
        p2 = dates.p2;
      }

      const [sales1, sales2] = await Promise.all([
        fetchSalesData(p1.startDate, p1.endDate),
        fetchSalesData(p2.startDate, p2.endDate),
      ]);

      setSalesDataP1(sales1);
      setSalesDataP2(sales2);
    } catch (err) {
      console.error("Error fetching compare data:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedPreset, customP1Start, customP1End, customP2Start, customP2End, getPresetDates, fetchSalesData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filterSales = useCallback((salesData) => {
    return salesData.filter((sale) => {
      const belt = getBeltFromZone(sale.zone);
      const matchZone = selectedZone ? sale.zone?.includes(selectedZone) : true;
      const matchBelt = selectedBelt ? belt === selectedBelt : true;
      return matchZone && matchBelt;
    });
  }, [selectedZone, selectedBelt, getBeltFromZone]);

  const aggregateByUser = useCallback((salesData) => {
    const salesByUser = salesData.reduce((acc, sale) => {
      if (!sale.user || !sale.so) return acc;
      const userId = sale.user;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          name: sale.so,
          outlet: sale.outlet,
          zone: sale.zone,
          role: sale.role || "SO",
          asm: sale.asm,
          som: sale.som,
          totalTP: 0,
          salesCount: 0,
        };
      }
      acc[userId].totalTP += (sale.total_tp - sale.return) || 0;
      acc[userId].salesCount += 1;
      return acc;
    }, {});

    const managerLevels = ["ASM", "SOM"];
    const managerReports = {};

    managerLevels.forEach((level) => {
      const managers = [...new Set(salesData.map((s) => s[level.toLowerCase()]))].filter(Boolean);
      managers.forEach((manager) => {
        const managerKey = `${level}_${manager}`;
        const teamMembers = Object.values(salesByUser).filter(
          (user) => user[level.toLowerCase()] === manager
        );
        const teamTP = teamMembers.reduce((sum, member) => sum + (member.totalTP || 0), 0);

        managerReports[managerKey] = {
          userId: managerKey,
          name: manager,
          role: level,
          zone: teamMembers[0]?.zone || "",
          totalTP: teamTP,
          salesCount: teamMembers.reduce((sum, m) => sum + (m.salesCount || 0), 0),
          teamMembers: teamMembers.map((m) => m.userId),
          isManager: true,
        };
      });
    });

    return [...Object.values(salesByUser), ...Object.values(managerReports)];
  }, []);

  const { reports, summaryData } = useMemo(() => {
    const filteredP1 = filterSales(salesDataP1);
    const filteredP2 = filterSales(salesDataP2);

    const aggP1 = aggregateByUser(filteredP1);
    const aggP2 = aggregateByUser(filteredP2);

    const mergedMap = {};

    aggP1.forEach((report) => {
      const matchRole = selectedRole ? report.role === selectedRole : true;
      if (!matchRole) return;
      mergedMap[report.userId] = {
        ...report,
        p1TotalTP: report.totalTP,
        p1SalesCount: report.salesCount,
        p2TotalTP: 0,
        p2SalesCount: 0,
      };
    });

    aggP2.forEach((report) => {
      const matchRole = selectedRole ? report.role === selectedRole : true;
      if (!matchRole) return;
      if (mergedMap[report.userId]) {
        mergedMap[report.userId].p2TotalTP = report.totalTP;
        mergedMap[report.userId].p2SalesCount = report.salesCount;
      } else {
        mergedMap[report.userId] = {
          ...report,
          p1TotalTP: 0,
          p1SalesCount: 0,
          p2TotalTP: report.totalTP,
          p2SalesCount: report.salesCount,
        };
      }
    });

    const allReports = Object.values(mergedMap).map((r) => ({
      ...r,
      change: r.p2TotalTP - r.p1TotalTP,
      changePercent: r.p1TotalTP !== 0
        ? ((r.p2TotalTP - r.p1TotalTP) / Math.abs(r.p1TotalTP)) * 100
        : r.p2TotalTP > 0 ? 100 : 0,
      belt: getBeltFromZone(r.zone),
    }));

    const totalP1 = allReports.reduce((sum, r) => sum + r.p1TotalTP, 0);
    const totalP2 = allReports.reduce((sum, r) => sum + r.p2TotalTP, 0);

    return {
      reports: allReports,
      summaryData: {
        totalP1,
        totalP2,
        change: totalP2 - totalP1,
        changePercent: totalP1 !== 0
          ? ((totalP2 - totalP1) / Math.abs(totalP1)) * 100
          : totalP2 > 0 ? 100 : 0,
      },
    };
  }, [salesDataP1, salesDataP2, selectedRole, filterSales, aggregateByUser, getBeltFromZone]);

  const organizeReportsHierarchically = useCallback((reportsList) => {
    const reportsByBelt = reportsList.reduce((acc, report) => {
      const belt = report.belt || "Unknown Belt";
      if (!acc[belt]) acc[belt] = [];
      acc[belt].push(report);
      return acc;
    }, {});

    return Object.entries(reportsByBelt).map(([belt, beltReports]) => {
      const soms = beltReports.filter((r) => r.role === "SOM");
      const asms = beltReports.filter((r) => r.role === "ASM");
      const salesOfficers = beltReports.filter((r) => r.role === "SO");

      const soBySom = salesOfficers.reduce((acc, so) => {
        const som = so.som || "Unknown SOM";
        if (!acc[som]) acc[som] = [];
        acc[som].push(so);
        return acc;
      }, {});

      const soByAsm = salesOfficers.reduce((acc, so) => {
        const asm = so.asm || "Unknown ASM";
        if (!acc[asm]) acc[asm] = [];
        acc[asm].push(so);
        return acc;
      }, {});

      const organized = [];

      soms.forEach((som) => {
        organized.push(som);
        const somAsms = asms.filter((asm) =>
          soBySom[asm.name]?.some((so) => so.som === som.name)
        );
        somAsms.forEach((asm) => {
          organized.push(asm);
          const asmSos = soByAsm[asm.name] || [];
          organized.push(...asmSos.sort((a, b) => a.name.localeCompare(b.name)));
        });
        const directSos = (soBySom[som.name] || []).filter((so) => !so.asm);
        organized.push(...directSos.sort((a, b) => a.name.localeCompare(b.name)));
      });

      const remainingAsms = asms.filter(
        (asm) => !organized.some((r) => r.userId === asm.userId)
      );
      remainingAsms.forEach((asm) => {
        organized.push(asm);
        const asmSos = soByAsm[asm.name] || [];
        organized.push(...asmSos.sort((a, b) => a.name.localeCompare(b.name)));
      });

      const remainingSos = salesOfficers.filter(
        (so) => !organized.some((r) => r.userId === so.userId)
      );
      organized.push(...remainingSos.sort((a, b) => a.name.localeCompare(b.name)));

      return { belt, reports: organized };
    });
  }, []);

  const organizedReports = useMemo(() => organizeReportsHierarchically(reports), [reports, organizeReportsHierarchically]);

  const dates = getPresetDates();
  const p1Label = selectedPreset === "custom"
    ? `${dayjs(customP1Start).format("DD MMM YYYY")} - ${dayjs(customP1End).format("DD MMM YYYY")}`
    : dates?.p1?.label || "";
  const p2Label = selectedPreset === "custom"
    ? `${dayjs(customP2Start).format("DD MMM YYYY")} - ${dayjs(customP2End).format("DD MMM YYYY")}`
    : dates?.p2?.label || "";

  const exportToExcel = () => {
    const exportData = organizedReports.flatMap((beltGroup) =>
      beltGroup.reports.map((report) => ({
        "User Name": report.name?.trim(),
        Zone: report.zone,
        Role: report.role,
        Belt: report.belt,
        [`P1 Sales (TP)`]: report.p1TotalTP.toFixed(2),
        [`P2 Sales (TP)`]: report.p2TotalTP.toFixed(2),
        "Change (TP)": report.change.toFixed(2),
        "Change (%)": report.changePercent.toFixed(1),
      }))
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Compare Report");

    const fileName = `Sales_Compare_Report_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePresetChange = (e) => {
    setSelectedPreset(e.target.value);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sales Compare Report</h2>
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            disabled={loading || organizedReports.length === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export to Excel
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-semibold text-blue-800">Period 1 Total TP</h3>
            <p className="text-xl font-bold text-blue-900">{summaryData.totalP1.toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">{p1Label}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-semibold text-purple-800">Period 2 Total TP</h3>
            <p className="text-xl font-bold text-purple-900">{summaryData.totalP2.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-1">{p2Label}</p>
          </div>
          <div className={`p-4 rounded-lg shadow text-center ${summaryData.change >= 0 ? "bg-green-100" : "bg-red-100"}`}>
            <h3 className={`text-sm font-semibold ${summaryData.change >= 0 ? "text-green-800" : "text-red-800"}`}>Change (TP)</h3>
            <p className={`text-xl font-bold ${summaryData.change >= 0 ? "text-green-900" : "text-red-900"}`}>
              {summaryData.change >= 0 ? "+" : ""}{summaryData.change.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-lg shadow text-center ${summaryData.changePercent >= 0 ? "bg-green-100" : "bg-red-100"}`}>
            <h3 className={`text-sm font-semibold ${summaryData.changePercent >= 0 ? "text-green-800" : "text-red-800"}`}>Change (%)</h3>
            <p className={`text-xl font-bold ${summaryData.changePercent >= 0 ? "text-green-900" : "text-red-900"}`}>
              {summaryData.changePercent >= 0 ? "+" : ""}{summaryData.changePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="font-medium block text-sm">Compare Preset</label>
            <select
              value={selectedPreset}
              onChange={handlePresetChange}
              className="border rounded p-2 mt-1"
            >
              {PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {selectedPreset === "custom" && (
            <>
              <div>
                <label className="font-medium block text-sm">Period 1 Start</label>
                <input
                  type="date"
                  value={customP1Start}
                  onChange={(e) => setCustomP1Start(e.target.value)}
                  className="border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="font-medium block text-sm">Period 1 End</label>
                <input
                  type="date"
                  value={customP1End}
                  onChange={(e) => setCustomP1End(e.target.value)}
                  className="border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="font-medium block text-sm">Period 2 Start</label>
                <input
                  type="date"
                  value={customP2Start}
                  onChange={(e) => setCustomP2Start(e.target.value)}
                  className="border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="font-medium block text-sm">Period 2 End</label>
                <input
                  type="date"
                  value={customP2End}
                  onChange={(e) => setCustomP2End(e.target.value)}
                  className="border rounded p-2 mt-1"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-medium block text-sm">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border rounded p-2 mt-1"
            >
              <option value="">All Roles</option>
              <option value="SO">Sales Officer</option>
              <option value="ASM">ASM</option>
              <option value="SOM">SOM</option>
            </select>
          </div>

          <div>
            <label className="font-medium block text-sm">Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border rounded p-2 mt-1"
            >
              <option value="">All Zones</option>
              <option value="DHAKA-01-ZONE-01">DHAKA-01-ZONE-01</option>
              <option value="DHAKA-02-ZONE-01">DHAKA-02-ZONE-01</option>
              <option value="DHAKA-02-ZONE-03">DHAKA-02-ZONE-03</option>
              <option value="DHAKA-03-ZONE-03">DHAKA-03-ZONE-03</option>
              <option value="SYLHET-ZONE-03">SYLHET-ZONE-03</option>
              <option value="KHULNA-ZONE-01">KHULNA-ZONE-01</option>
              <option value="COMILLA-ZONE-03">COMILLA-ZONE-03</option>
              <option value="CHITTAGONG-ZONE-03">CHITTAGONG-ZONE-03</option>
              <option value="RANGPUR-ZONE-01">RANGPUR-ZONE-01</option>
              <option value="BARISAL-ZONE-03">BARISAL-ZONE-03</option>
              <option value="BOGURA-ZONE-01">BOGURA-ZONE-01</option>
              <option value="MYMENSINGH-ZONE-01">MYMENSINGH-ZONE-01</option>
            </select>
          </div>

          <div>
            <label className="font-medium block text-sm">Belt</label>
            <select
              value={selectedBelt}
              onChange={(e) => setSelectedBelt(e.target.value)}
              className="border rounded p-2 mt-1"
            >
              <option value="">All Belts</option>
              <option value="Belt-1">Belt-1 (ZONE-01)</option>
              <option value="Belt-3">Belt-3 (ZONE-03)</option>
            </select>
          </div>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => {
              setSelectedRole("");
              setSelectedZone("");
              setSelectedBelt("");
            }}
            disabled={loading}
          >
            Reset Filters
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : organizedReports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">No data found for the selected filters</p>
          </div>
        ) : (
          <div className="relative overflow-auto max-h-[80vh]">
            {organizedReports.map((beltGroup, beltIndex) => (
              <div key={beltIndex} className="mb-8">
                <h3 className="text-lg font-bold bg-gray-200 p-2 sticky top-0 z-10">
                  {beltGroup.belt}
                </h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border text-left" rowSpan="2">User</th>
                      <th className="p-2 border text-left" rowSpan="2">Zone</th>
                      <th className="p-2 border text-left" rowSpan="2">Role</th>
                      <th className="p-2 border text-center bg-blue-50" colSpan="2">
                        {p1Label}
                      </th>
                      <th className="p-2 border text-center bg-purple-50" colSpan="2">
                        {p2Label}
                      </th>
                      <th className="p-2 border text-center bg-green-50" colSpan="2">Change</th>
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="p-1 border text-xs bg-blue-50">Sales (TP)</th>
                      <th className="p-1 border text-xs bg-blue-50">Sales Count</th>
                      <th className="p-1 border text-xs bg-purple-50">Sales (TP)</th>
                      <th className="p-1 border text-xs bg-purple-50">Sales Count</th>
                      <th className="p-1 border text-xs bg-green-50">TP</th>
                      <th className="p-1 border text-xs bg-green-50">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beltGroup.reports.map((report, index) => (
                      <tr
                        key={`${beltIndex}-${index}`}
                        className={`border hover:bg-gray-50 ${report.isManager ? "bg-blue-50 font-semibold" : ""}`}
                      >
                        <td className="border p-2">
                          {report.name}
                          {report.isManager && (
                            <span className="ml-2 text-xs text-blue-600">({report.role})</span>
                          )}
                        </td>
                        <td className="border p-2 text-sm">{report.zone}</td>
                        <td className="border p-2 text-sm">{report.role}</td>
                        <td className="border p-2 text-right text-sm">{report.p1TotalTP.toFixed(2)}</td>
                        <td className="border p-2 text-center text-sm">{report.p1SalesCount}</td>
                        <td className="border p-2 text-right text-sm">{report.p2TotalTP.toFixed(2)}</td>
                        <td className="border p-2 text-center text-sm">{report.p2SalesCount}</td>
                        <td className={`border p-2 text-right text-sm font-medium ${report.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {report.change >= 0 ? "+" : ""}{report.change.toFixed(2)}
                        </td>
                        <td className={`border p-2 text-right text-sm font-medium ${report.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {report.changePercent >= 0 ? "+" : ""}{report.changePercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesCompareReport;
