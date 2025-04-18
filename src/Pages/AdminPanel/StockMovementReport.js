import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

const StockMovementReport = () => {
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
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
    if (selectedOutlet && month) {
      fetchReportData();
    }
  }, [selectedOutlet, month]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/stock-movement-report",
        {
          params: {
            outlet: selectedOutlet,
            month: month,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success) {
        setReportData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (error) {
      console.error("API error:", error);
      setError(error.message || "Failed to fetch stock movement report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalPrimary = reportData.reduce((sum, item) => sum + (item.primary || 0), 0);
  const totalMarketReturn = reportData.reduce((sum, item) => sum + (item.marketReturn || 0), 0);
  const totalOfficeReturn = reportData.reduce((sum, item) => sum + (item.officeReturn || 0), 0);

  return (
    <div className="flex">
      <div>
        <AdminSidebar />
      </div>

      <div className="mx-auto px-6 py-8 w-full md:w-[80%]">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Stock Movement Report</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Outlet</option>
            {outlets.map((outlet, index) => (
              <option key={index} value={outlet}>
                {outlet}
              </option>
            ))}
          </select>

          <div className="flex items-center">
            <label className="font-medium mr-2">Select Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
            <p className="text-sm mt-1">Check console for more details</p>
          </div>
        )}

        {/* Summary Section */}
        {!loading && reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border-l-4 border-green-600 rounded shadow p-4">
              <p className="text-sm text-gray-600">Total Primary (PC)</p>
              <p className="text-2xl font-semibold text-green-700">{totalPrimary}</p>
            </div>
            <div className="bg-white border-l-4 border-red-600 rounded shadow p-4">
              <p className="text-sm text-gray-600">Total Market Return (PC)</p>
              <p className="text-2xl font-semibold text-red-700">{totalMarketReturn}</p>
            </div>
            <div className="bg-white border-l-4 border-yellow-600 rounded shadow p-4">
              <p className="text-sm text-gray-600">Total Office Return (PC)</p>
              <p className="text-2xl font-semibold text-yellow-700">{totalOfficeReturn}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 shadow rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Primary (PC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Market Return (PC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Office Return (PC)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr
                    key={`${item.barcode}-${index}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{item.productName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.barcode}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.primary}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.marketReturn}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.officeReturn}</td>
                  </tr>
                ))}

                {reportData.length > 0 && (
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                    <td className="px-6 py-4 text-sm text-gray-500">—</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{totalPrimary}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{totalMarketReturn}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{totalOfficeReturn}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {reportData.length === 0 && !loading && !error && (
              <div className="text-center py-8 text-gray-500">
                No data available for the selected criteria
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovementReport;
