import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";

const API_CONFIG = {
  baseURL: "http://175.29.181.245:5000",
  timeout: 5000000,
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const SalarySheet = () => {
  const [stockData, setStockData] = useState([]);
  const [targetsData, setTargetsData] = useState({});
  // const [attendanceData, setAttendanceData] = useState({});
  // const [workingDaysData, setWorkingDaysData] = useState(0);
  // const [holidaysData, setHolidaysData] = useState([]);
  // const [leaveData, setLeaveData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBelt, setSelectedBelt] = useState("");
  const [tddaData, setTddaData] = useState({});
  const dayCount = dayjs(selectedMonth).daysInMonth();

  const [loading, setLoading] = useState({
    stock: false,
    targets: false,
    attendance: false,
    workingDays: false,
    holidays: false,
    leaves: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getBeltFromZone = useCallback((zoneName) => {
    if (!zoneName) return "";
    if (zoneName.includes("ZONE-01")) return "Belt-1";
    if (zoneName.includes("ZONE-03")) return "Belt-3";
    return "";
  }, []);

  // const fetchWorkingDays = useCallback(async (month) => {
  //   try {
  //     setLoading((prev) => ({ ...prev, workingDays: true }));
  //     const response = await axios.get(
  //       `https://attendance-app-server-blue.vercel.app/api/workingdays`,
  //       { params: { month } }
  //     );
  //     setWorkingDaysData(response.data.workingDays);
  //   } catch (error) {
  //     console.error("Error fetching working days:", error);
  //     setWorkingDaysData(0);
  //   } finally {
  //     setLoading((prev) => ({ ...prev, workingDays: false }));
  //   }
  // }, []);

  // const fetchHolidays = useCallback(async (month) => {
  //   try {
  //     setLoading((prev) => ({ ...prev, holidays: true }));
  //     const [year, monthNumber] = month.split("-");
  //     const response = await axios.get(
  //       `https://attendance-app-server-blue.vercel.app/api/holidays`,
  //       { params: { year, month: monthNumber } }
  //     );
  //     setHolidaysData(response.data.holidays || []);
  //   } catch (error) {
  //     console.error("Error fetching holidays:", error);
  //     setHolidaysData([]);
  //   } finally {
  //     setLoading((prev) => ({ ...prev, holidays: false }));
  //   }
  // }, []);

  // const fetchLeaveData = useCallback(async (month) => {
  //   try {
  //     setLoading((prev) => ({ ...prev, leaves: true }));
  //     const [year, monthNumber] = month.split("-");
  //     const usersResponse = await axios.get("http://175.29.181.245:5000/getAllUser");
  //     const users = usersResponse.data.filter((user) => user.attendance_id);
  //     const leaveRecords = {};

  //     await Promise.all(
  //       users.map(async (user) => {
  //         try {
  //           const response = await axios.get(
  //             `https://attendance-app-server-blue.vercel.app/api/leave-requests/user/${user.attendance_id}/monthly`,
  //             { params: { month: monthNumber, year } }
  //           );
  //           leaveRecords[user._id] = response.data.leaveDays || 0;
  //         } catch (error) {
  //           console.error(
  //             `Error fetching leave data for user ${user._id}:`,
  //             error
  //           );
  //           leaveRecords[user._id] = 0;
  //         }
  //       })
  //     );

  //     setLeaveData(leaveRecords);
  //   } catch (error) {
  //     console.error("Error fetching leave data:", error);
  //     setLeaveData({});
  //   } finally {
  //     setLoading((prev) => ({ ...prev, leaves: false }));
  //   }
  // }, []);

  // const fetchAttendanceData = useCallback(async (month) => {
  //   try {
  //     setLoading((prev) => ({ ...prev, attendance: true }));
  //     const [year, monthNumber] = month.split("-");
  //     const usersResponse = await axios.get("http://175.29.181.245:5000/getAllUser");
  //     const users = usersResponse.data.filter((user) => user.attendance_id);
  //     const attendanceRecords = {};

  //     await Promise.all(
  //       users.map(async (user) => {
  //         try {
  //           const checkInsResponse = await axios.get(
  //             `https://attendance-app-server-blue.vercel.app/api/checkins/${user.attendance_id}`,
  //             { params: { month: monthNumber, year } }
  //           );
  //           const checkOutsResponse = await axios.get(
  //             `https://attendance-app-server-blue.vercel.app/api/checkouts/${user.attendance_id}`,
  //             { params: { month: monthNumber, year } }
  //           );

  //           const checkIns = checkInsResponse.data;
  //           const checkOuts = checkOutsResponse.data;
  //           let presentDays = 0;
  //           let checkInCount = 0;
  //           const dailyAttendance = {};

  //           for (let day = 1; day <= dayCount; day++) {
  //             const date = `${year}-${monthNumber}-${String(day).padStart(
  //               2,
  //               "0"
  //             )}`;
  //             const checkIn = checkIns.find(
  //               (checkin) => dayjs(checkin.time).format("YYYY-MM-DD") === date
  //             );
  //             const checkOut = checkOuts.find(
  //               (checkout) => dayjs(checkout.time).format("YYYY-MM-DD") === date
  //             );

  //             const isPresent = checkIn;
  //             if (isPresent) {
  //               presentDays++;
  //               checkInCount++;
  //             }

  //             dailyAttendance[day] = {
  //               in: checkIn ? dayjs(checkIn.time).format("hh:mm A") : "",
  //               out: checkOut ? dayjs(checkOut.time).format("hh:mm A") : "",
  //               present: isPresent,
  //             };
  //           }

  //           const holidaysCount = holidaysData.filter(
  //             (holiday) => dayjs(holiday.date).format("YYYY-MM") === month
  //           ).length;

  //           const approvedLeave = leaveData[user._id] || 0;
  //           const totalWorkingDays = workingDaysData;
  //           const absentDays =
  //             totalWorkingDays - presentDays - approvedLeave - holidaysCount;
  //           const extraDays = Math.max(0, checkInCount - totalWorkingDays);

  //           attendanceRecords[user._id] = {
  //             dailyAttendance,
  //             totalWorkingDays,
  //             holidays: dayCount - workingDaysData,
  //             approvedLeave,
  //             absentDays,
  //             extraDays,
  //             presentDays,
  //             checkInCount,
  //           };
  //         } catch (error) {
  //           console.error(
  //             `Error fetching attendance for user ${user._id}:`,
  //             error
  //           );
  //           attendanceRecords[user._id] = {
  //             dailyAttendance: {},
  //             totalWorkingDays: workingDaysData,
  //             holidays: 0,
  //             approvedLeave: 0,
  //             absentDays: 0,
  //             extraDays: 0,
  //             presentDays: 0,
  //             checkInCount: 0,
  //           };
  //         }
  //       })
  //     );

  //     setAttendanceData(attendanceRecords);
  //   } catch (error) {
  //     console.error("Error fetching attendance data:", error);
  //     setAttendanceData({});
  //   } finally {
  //     setLoading((prev) => ({ ...prev, attendance: false }));
  //   }
  // }, []);

  const fetchTddaData = useCallback(async (month) => {
    try {
      setLoading((prev) => ({ ...prev, tdda: true }));
      const response = await axios.get(
        "http://175.29.181.245:5000/api/tdda-summary",
        { params: { month } }
      );
      setTddaData(response.data.data);
    } catch (error) {
      console.error("Error fetching TDDA data:", error);
      setTddaData({});
    } finally {
      setLoading((prev) => ({ ...prev, tdda: false }));
    }
  }, []);

  const fetchStockData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, stock: true }));
      setError(null);

      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      } else {
        params.append("month", selectedMonth);
      }

      const response = await api.get(
        `/api/user-stock-movement?${params.toString()}`
      );
      if (!response.data || !response.data.success) {
        throw new Error("Invalid data format received from server");
      }

      const userMap = new Map();
      const processedData = response.data.data.flatMap((outletData) => {
        return outletData.users
          .filter((user) => {
            if (userMap.has(user.userId)) return false;
            userMap.set(user.userId, true);
            return true;
          })
          .map((user) => ({
            userId: user.userId,
            name: user.name,
            outlet: outletData.outlet,
            zone: user.zone,
            role: user.role,
            asm: user.asm,
            rsm: user.rsm,
            som: user.som,
            primary: user.primary,
            secondary: user.secondary,
            marketReturn: user.marketReturn,
            officeReturn: user.officeReturn,
            collection: user.collection,
            openingValueDP: outletData.openingValueDP,
            openingValueTP: outletData.openingValueTP,
            closingValueDP: outletData.closingValueDP,
            closingValueTP: outletData.closingValueTP,
          }));
      });

      setStockData(processedData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError(`Failed to load stock data: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, stock: false }));
    }
  }, [selectedMonth, startDate, endDate]);

  const fetchTargets = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, targets: true }));
      setError(null);

      const [year, month] = selectedMonth.split("-").map(Number);
      const response = await api.get("/targets", { params: { year, month } });

      const targetsMap = {};
      response.data.forEach((targetEntry) => {
        targetEntry.targets.forEach((target) => {
          if (target.year === year && target.month === month) {
            targetsMap[targetEntry.userID] = target.tp;
          }
        });
      });
      setTargetsData(targetsMap);
    } catch (error) {
      console.error("Error fetching targets:", error);
      setError("Failed to load targets. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, targets: false }));
    }
  }, [selectedMonth]);

  const filteredStockData = useMemo(() => {
    if (!stockData || stockData.length === 0) return [];
    return stockData.filter((data) => {
      const belt = getBeltFromZone(data.zone);
      const matchZone = selectedZone ? data.zone?.includes(selectedZone) : true;
      const matchBelt = selectedBelt ? belt === selectedBelt : true;
      return matchZone && matchBelt;
    });
  }, [stockData, selectedZone, selectedBelt, getBeltFromZone]);

  const organizeReportsHierarchically = (reports) => {
    const reportsByBelt = reports.reduce((acc, report) => {
      const belt = getBeltFromZone(report.zone) || "Unknown Belt";
      if (!acc[belt]) acc[belt] = [];
      acc[belt].push(report);
      return acc;
    }, {});

    return Object.entries(reportsByBelt).map(([belt, beltReports]) => {
      const soms = beltReports.filter((r) => r.role === "SOM");
      const rsms = beltReports.filter((r) => r.role === "RSM");
      const asms = beltReports.filter((r) => r.role === "ASM");
      const salesOfficers = beltReports.filter((r) => r.role === "SO");

      const soBySom = salesOfficers.reduce((acc, so) => {
        const som =
          soms.find((s) => so.zone.includes(s.zone))?.name || "Unknown SOM";
        if (!acc[som]) acc[som] = [];
        acc[som].push(so);
        return acc;
      }, {});

      const soByRsm = salesOfficers.reduce((acc, so) => {
        const rsm =
          rsms.find((r) => so.zone.includes(r.zone))?.name || "Unknown RSM";
        if (!acc[rsm]) acc[rsm] = [];
        acc[rsm].push(so);
        return acc;
      }, {});

      const soByAsm = salesOfficers.reduce((acc, so) => {
        const asm =
          asms.find((a) => so.zone.includes(a.zone))?.name || "Unknown ASM";
        if (!acc[asm]) acc[asm] = [];
        acc[asm].push(so);
        return acc;
      }, {});

      const organizedReports = [];

      soms.forEach((som) => {
        organizedReports.push(som);
        const somRsms = rsms.filter(
          (rsm) =>
            rsm.zone.includes(som.zone) ||
            soBySom[som.name]?.some((so) => so.rsm === rsm.name)
        );

        somRsms.forEach((rsm) => {
          organizedReports.push(rsm);
          const rsmAsms = asms.filter(
            (asm) =>
              asm.zone.includes(rsm.zone) ||
              soByRsm[rsm.name]?.some((so) => so.asm === asm.name)
          );

          rsmAsms.forEach((asm) => {
            organizedReports.push(asm);
            const asmSos = (soByAsm[asm.name] || []).filter((so) =>
              so.zone.includes(asm.zone)
            );
            organizedReports.push(
              ...asmSos.sort((a, b) => a.name.localeCompare(b.name))
            );
          });

          const directSos = (soByRsm[rsm.name] || []).filter(
            (so) => !so.asm && so.zone.includes(rsm.zone)
          );
          organizedReports.push(
            ...directSos.sort((a, b) => a.name.localeCompare(b.name))
          );
        });

        const directSos = (soBySom[som.name] || []).filter(
          (so) => !so.rsm && !so.asm && so.zone.includes(som.zone)
        );
        organizedReports.push(
          ...directSos.sort((a, b) => a.name.localeCompare(b.name))
        );
      });

      const remainingRsms = rsms.filter(
        (rsm) => !organizedReports.some((r) => r.userId === rsm.userId)
      );
      remainingRsms.forEach((rsm) => {
        organizedReports.push(rsm);
        const rsmAsms = asms.filter(
          (asm) =>
            asm.zone.includes(rsm.zone) ||
            soByRsm[rsm.name]?.some((so) => so.asm === asm.name)
        );

        rsmAsms.forEach((asm) => {
          organizedReports.push(asm);
          const asmSos = (soByAsm[asm.name] || []).filter((so) =>
            so.zone.includes(asm.zone)
          );
          organizedReports.push(
            ...asmSos.sort((a, b) => a.name.localeCompare(b.name))
          );
        });

        const directSos = (soByRsm[rsm.name] || []).filter(
          (so) => !so.asm && so.zone.includes(rsm.zone)
        );
        organizedReports.push(
          ...directSos.sort((a, b) => a.name.localeCompare(b.name))
        );
      });

      const remainingAsms = asms.filter(
        (asm) => !organizedReports.some((r) => r.userId === asm.userId)
      );
      remainingAsms.forEach((asm) => {
        organizedReports.push(asm);
        const asmSos = (soByAsm[asm.name] || []).filter((so) =>
          so.zone.includes(asm.zone)
        );
        organizedReports.push(
          ...asmSos.sort((a, b) => a.name.localeCompare(b.name))
        );
      });

      const remainingSos = salesOfficers.filter(
        (so) => !organizedReports.some((r) => r.userId === so.userId)
      );
      organizedReports.push(
        ...remainingSos.sort((a, b) => a.name.localeCompare(b.name))
      );

      return {
        belt,
        reports: organizedReports,
      };
    });
  };

  const { organizedReports, summaryData } = useMemo(() => {
    if (!filteredStockData || filteredStockData.length === 0) {
      return {
        organizedReports: [],
        summaryData: {
          totalSOs: 0,
          achievedSOs: 0,
          totalSecondary: 0,
          totalPrimary: 0,
          totalMarketReturn: 0,
          totalOfficeReturn: 0,
          totalCollection: 0,
          totalTddaExpense: 0,
          openingValue: 0,
          closingValue: 0,
        },
      };
    }

    const allUsersMap = filteredStockData.reduce((acc, user) => {
      acc[user.userId] = user;
      return acc;
    }, {});

    const getManagerZone = (managerName, level) => {
      const manager = Object.values(allUsersMap).find(
        (u) => u.name === managerName && u.role === level
      );
      if (manager) return manager.zone;
      const teamMembers = filteredStockData.filter(
        (user) => user[level.toLowerCase()] === managerName
      );
      if (teamMembers.length === 0) return "";
      if (level === "SOM") {
        const zoneParts = teamMembers[0].zone.split("-");
        return `ZONE-${zoneParts[zoneParts.length - 1]}`;
      }
      if (level === "RSM") {
        const sampleZone = teamMembers[0].zone;
        const zoneParts = sampleZone.split("-");
        return `ZONE-${zoneParts[zoneParts.length - 1]}`;
      }
      return teamMembers[0].zone;
    };

    const soReports = filteredStockData.filter((r) => r.role === "SO");
    const achievedSOs = soReports.filter((so) => {
      const target = targetsData[so.userId] || 0;
      return target > 0 && (so.secondary?.valueTP / target) * 100 >= 100;
    }).length;

    const uniqueOutlets = new Set();
    let totalOpeningValueDP = 0;
    let totalClosingValueDP = 0;

    filteredStockData.forEach((data) => {
      if (!uniqueOutlets.has(data.outlet)) {
        totalOpeningValueDP += data.openingValueDP || 0;
        totalClosingValueDP += data.closingValueDP || 0;
        uniqueOutlets.add(data.outlet);
      }
    });

    const summary = {
      totalSOs: soReports.length,
      achievedSOs,
      totalSecondary: soReports.reduce(
        (sum, so) => sum + (so.secondary?.valueTP || 0),
        0
      ),
      totalPrimary: soReports.reduce(
        (sum, so) => sum + (so.primary?.valueDP || 0),
        0
      ),
      totalMarketReturn: soReports.reduce(
        (sum, so) => sum + (so.marketReturn?.valueTP || 0),
        0
      ),
      totalOfficeReturn: soReports.reduce(
        (sum, so) => sum + (so.officeReturn?.valueDP || 0),
        0
      ),
      totalCollection: soReports.reduce(
        (sum, so) => sum + (so.collection?.amount || 0),
        0
      ),
      totalTddaExpense: soReports.reduce(
        // Add this line
        (sum, so) => sum + (tddaData[so.userId] || 0),
        0
      ),
      openingValue: totalOpeningValueDP,
      closingValue: totalClosingValueDP,
    };

    const managerLevels = ["ASM", "RSM", "SOM"];
    const managerReports = {};

    managerLevels.forEach((level) => {
      const managers = [
        ...new Set(filteredStockData.map((t) => t[level.toLowerCase()])),
      ].filter(Boolean);

      managers.forEach((managerName) => {
        const managerKey = `${level}_${managerName}`;
        const teamMembers = filteredStockData.filter(
          (user) => user[level.toLowerCase()] === managerName
        );

        const managerZone = getManagerZone(managerName, level);

        const managerTarget = teamMembers.reduce((sum, member) => {
          return sum + (Number(targetsData[member.userId]) || 0);
        }, 0);

        const managerAchievement = teamMembers.reduce((sum, member) => {
          const target = targetsData[member.userId] || 0;
          return target > 0
            ? sum + ((member.secondary?.valueTP || 0) / target) * 100
            : sum;
        }, 0);

        const teamUniqueOutlets = new Set();
        let teamOpeningValueDP = 0;
        let teamClosingValueDP = 0;

        teamMembers.forEach((member) => {
          if (!teamUniqueOutlets.has(member.outlet)) {
            teamOpeningValueDP += member.openingValueDP || 0;
            teamClosingValueDP += member.closingValueDP || 0;
            teamUniqueOutlets.add(member.outlet);
          }
        });

        managerReports[managerKey] = {
          userId: managerKey,
          name: managerName,
          role: level,
          zone: managerZone,
          primary: {
            valueDP: teamMembers.reduce(
              (sum, m) => sum + (m.primary?.valueDP || 0),
              0
            ),
          },
          secondary: {
            valueTP: teamMembers.reduce(
              (sum, m) => sum + (m.secondary?.valueTP || 0),
              0
            ),
          },
          marketReturn: {
            valueTP: teamMembers.reduce(
              (sum, m) => sum + (m.marketReturn?.valueTP || 0),
              0
            ),
          },
          officeReturn: {
            valueDP: teamMembers.reduce(
              (sum, m) => sum + (m.officeReturn?.valueDP || 0),
              0
            ),
          },
          collection: {
            amount: teamMembers.reduce(
              (sum, m) => sum + (m.collection?.amount || 0),
              0
            ),
          },
          openingValueDP: teamOpeningValueDP,
          closingValueDP: teamClosingValueDP,
          target: managerTarget,
          achievement: managerAchievement / teamMembers.length,
          transactionCount: teamMembers.length,
          teamMembers: teamMembers.map((m) => m.userId),
          isManager: true,
        };
      });
    });

    const allReports = [...filteredStockData, ...Object.values(managerReports)];

    const filteredReports = allReports
      .map((report) => {
        const matchRole = selectedRole ? report.role === selectedRole : true;
        const belt = getBeltFromZone(report.zone);

        if (!matchRole) return null;

        const target = report.isManager
          ? report.target
          : targetsData[report.userId] || 0;

        const achievement =
          target > 0 ? ((report.secondary?.valueTP || 0) / target) * 100 : 0;

        return {
          ...report,
          target: Number(target)?.toFixed(2),
          achievement,
          belt,
          transactionCount: report.transactionCount || 1,
        };
      })
      .filter(Boolean);

    const organized = organizeReportsHierarchically(filteredReports);

    return {
      organizedReports: organized,
      summaryData: summary,
    };
  }, [filteredStockData, targetsData, selectedRole, getBeltFromZone, tddaData]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  useEffect(() => {
    if (selectedMonth) {
      fetchTargets();
      // fetchWorkingDays(selectedMonth);
      // fetchHolidays(selectedMonth);
      // fetchLeaveData(selectedMonth);
      // fetchAttendanceData(selectedMonth);
      fetchTddaData(selectedMonth); // Add this line
    }
  }, [
    selectedMonth,
    fetchTargets,
    // fetchWorkingDays,
    // fetchHolidays,
    // fetchLeaveData,
    // fetchAttendanceData,
    fetchTddaData, // Add this to dependencies
  ]);

  const isLoading =
    loading.stock ||
    loading.targets ||
    // loading.attendance ||
    // loading.workingDays ||
    // loading.holidays ||
    // loading.leaves ||
    loading.tdda; // Add tdda loading check

  const exportToExcel = () => {
    const exportData = organizedReports.flatMap((zoneGroup) =>
      zoneGroup.reports.map((report) => {
        // const userAttendance = attendanceData[report.userId] || {
        //   totalWorkingDays: workingDaysData,
        //   holidays: 0,
        //   approvedLeave: 0,
        //   absentDays: 0,
        //   extraDays: 0,
        //   presentDays: 0,
        //   checkInCount: 0,
        // };

        return {
          "User Name": report.name,
          Outlet: report.outlet || "-",
          Zone: report.zone,
          Role: report.role,
          Belt: report.belt,
          Target: report.target,
          "Primary (DP)": report.primary?.valueDP?.toFixed(2) || "0.00",
          "Secondary (TP)": report.secondary?.valueTP?.toFixed(2) || "0.00",
          "Market Return (TP)":
            report.marketReturn?.valueTP?.toFixed(2) || "0.00",
          "Office Return (DP)":
            report.officeReturn?.valueDP?.toFixed(2) || "0.00",
          Collection: report.collection?.amount?.toFixed(2) || "0.00",
          "TD/DA Expense": tddaData[report.userId]?.toFixed(2),
          // "Total Working Days": workingDaysData,
          // Holidays: dayCount - workingDaysData,
          // "Approved Leave": userAttendance.approvedLeave,
          // Absent: userAttendance.absentDays,
          // "Extra Days": userAttendance.extraDays,
          // "Present Days": userAttendance.presentDays,
          // "Total Check-Ins": userAttendance.checkInCount,
          "Achievement (%)": report.achievement.toFixed(1),
          "Transaction Count": report.transactionCount,
        };
      })
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Salary Sheet Report");

    const fileName = `Salary_Sheet_Report_${
      selectedMonth ||
      (startDate && endDate
        ? `${startDate}_to_${endDate}`
        : dayjs().format("YYYY-MM"))
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedRole("");
    setSelectedZone("");
    setSelectedBelt("");
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Salary Sheet Report</h2>
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            disabled={isLoading || organizedReports.length === 0}
          >
            Export to Excel
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-8 gap-4 mb-4">
          <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Opening (DP)</h3>
            <p className="text-xl font-bold">
              {summaryData.openingValue?.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Primary (DP)</h3>
            <p className="text-xl font-bold">
              {summaryData.totalPrimary?.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Secondary (TP)</h3>
            <p className="text-xl font-bold">
              {summaryData.totalSecondary?.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Market Return (TP)</h3>
            <p className="text-xl font-bold">
              {summaryData.totalMarketReturn?.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Office Return (DP)</h3>
            <p className="text-xl font-bold">
              {summaryData.totalOfficeReturn?.toFixed(2)}
            </p>
          </div>
          <div className="bg-indigo-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Closing (DP)</h3>
            <p className="text-xl font-bold">
              {summaryData.closingValue?.toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Collections</h3>
            <p className="text-xl font-bold">
              {summaryData.totalCollection?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">TD/DA Expense</h3>
            <p className="text-xl font-bold">
              {summaryData.totalTddaExpense?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="font-medium">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded p-2 ml-2"
              disabled={startDate && endDate}
            />
          </div>
          <div>
            <label className="font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded p-2 ml-2"
            />
          </div>
          <div>
            <label className="font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded p-2 ml-2"
            />
          </div>

          <div>
            <label className="font-medium">Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Roles</option>
              <option value="SO">Sales Officer</option>
              <option value="ASM">ASM</option>
              <option value="RSM">RSM</option>
              <option value="SOM">SOM</option>
            </select>
          </div>

          <div>
            <label className="font-medium">Zone:</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Zones</option>
              <option value="DHAKA-01-ZONE-01">DHAKA-01-ZONE-01</option>
              <option value="DHAKA-02-ZONE-03">DHAKA-02-ZONE-03</option>
              <option value="DHAKA-03-ZONE-03">DHAKA-03-ZONE-03</option>
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
            <label className="font-medium">Belt:</label>
            <select
              value={selectedBelt}
              onChange={(e) => setSelectedBelt(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Belts</option>
              <option value="Belt-1">Belt-1 (ZONE-01)</option>
              <option value="Belt-3">Belt-3 (ZONE-03)</option>
            </select>
          </div>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleResetFilters}
            disabled={isLoading}
          >
            Reset Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : organizedReports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">
              No stock transaction data found for the selected filters
            </p>
          </div>
        ) : (
          <div className="relative overflow-auto max-h-[90vh]">
            {organizedReports.map((beltGroup, beltIndex) => (
              <div key={beltIndex} className="mb-8">
                <h3 className="text-lg font-bold bg-gray-200 p-2 sticky top-0 z-10">
                  {beltGroup.belt}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2">User</th>
                        <th className="p-2">Outlet</th>
                        <th className="p-2">Zone</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Target (TP)</th>
                        <th className="p-2">Opening (DP)</th>
                        <th className="p-2">Primary (DP)</th>
                        <th className="p-2">Secondary (TP)</th>
                        <th className="p-2">Market Return (TP)</th>
                        <th className="p-2">Office Return (DP)</th>
                        <th className="p-2">Closing (DP)</th>
                        <th className="p-2">Collection</th>
                        {/* <th className="p-2">Working Days</th>
                        <th className="p-2">Holidays</th>
                        <th className="p-2">Approved Leave</th>
                        <th className="p-2">Absent</th>
                        <th className="p-2">Extra Days</th>
                        <th className="p-2">Check-Ins</th> */}
                        <th className="p-2">TD/DA</th>
                        <th className="p-2">Achievement</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beltGroup.reports.map((report, index) => {
                        {
                          /* const userAttendance = attendanceData[
                          report.userId
                        ] || {
                          totalWorkingDays: workingDaysData,
                          holidays: 0,
                          approvedLeave: 0,
                          absentDays: 0,
                          extraDays: 0,
                          presentDays: 0,
                          checkInCount: 0,
                        }; */
                        }

                        return (
                          <tr
                            key={`${beltIndex}-${index}`}
                            className={`border hover:bg-gray-50 ${
                              report.isManager ? "bg-blue-50" : ""
                            }`}
                          >
                            <td className="border p-2">
                              {report.name}
                              {report.isManager && " (Manager)"}
                            </td>
                            <td className="border p-2">
                              {report.outlet || "-"}
                            </td>
                            <td className="border p-2">{report.zone}</td>
                            <td className="border p-2">{report.role}</td>
                            <td className="border p-2 text-right">
                              {Number(report.target).toLocaleString()}
                            </td>
                            <td className="border p-2 text-right">
                              {report.openingValueDP?.toFixed(2) || "0.00"}
                            </td>
                            <td className="border p-2 text-right">
                              {report.primary?.valueDP?.toFixed(2) || "0.00"}
                            </td>
                            <td className="border p-2 text-right">
                              {report.secondary?.valueTP?.toFixed(2) || "0.00"}
                            </td>
                            <td className="border p-2 text-right">
                              {report.marketReturn?.valueTP?.toFixed(2) ||
                                "0.00"}
                            </td>
                            <td className="border p-2 text-right">
                              {report.officeReturn?.valueDP?.toFixed(2) ||
                                "0.00"}
                            </td>
                            <td className="border p-2 text-right">
                              {report.closingValueDP?.toFixed(2) || "0.00"}
                            </td>
                            <td className="border p-2 text-right">
                              {report.collection?.amount?.toFixed(2) || "0.00"}
                            </td>
                            {/* <td className="border p-2 text-center">
                              {workingDaysData}
                            </td>
                            <td className="border p-2 text-center">
                              {dayCount - workingDaysData}
                            </td>
                            <td className="border p-2 text-center">
                              {userAttendance.approvedLeave}
                            </td>
                            <td className="border p-2 text-center">
                              {userAttendance.absentDays > 0
                                ? userAttendance.absentDays
                                : 0}
                            </td>
                            <td className="border p-2 text-center">
                              {userAttendance.extraDays}
                            </td>
                            <td className="border p-2 text-center">
                              {userAttendance.checkInCount}
                            </td> */}
                            <td className="border p-2 text-right">
                              {(tddaData[report.userId] || 0)?.toFixed(2)}
                            </td>
                            <td className="border p-2 text-right">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  report.achievement >= 100
                                    ? "bg-green-100 text-green-800"
                                    : report.achievement >= 80
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {report.achievement.toFixed(1)}%
                              </span>
                            </td>
                            <td className="border p-2 text-center">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/sales-report/daily/${report.userId}`,
                                    {
                                      state: {
                                        month: selectedMonth,
                                        startDate,
                                        endDate,
                                      },
                                    }
                                  )
                                }
                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalarySheet;
