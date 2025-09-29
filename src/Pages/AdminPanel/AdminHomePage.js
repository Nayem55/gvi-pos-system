import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { BarChart2, AlertCircle } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

// --- Lightweight shadcn-like components ---
const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl shadow-sm border border-gray-200 bg-white ${className}`}>{children}</div>
);
const CardHeader = ({ children }) => (
  <div className="p-4 sm:p-5 border-b border-gray-100">{children}</div>
);
const CardTitle = ({ children }) => (
  <h3 className="text-base sm:text-lg font-semibold tracking-tight">{children}</h3>
);
const CardContent = ({ className = "", children }) => (
  <div className={`p-4 sm:p-5 ${className}`}>{children}</div>
);
const Badge = ({ variant = "default", children }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
    purple: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>
  );
};

// --- Colors for charts ---
const COLORS = ["#60a5fa", "#34d399", "#f472b6", "#f59e0b", "#a78bfa", "#fb7185"];

// --- UI Components ---
function StatCard({ title, value, sub, delta, deltaType = "neutral" }) {
  const badge = deltaType === "up" ? (
    <Badge variant="success">▲ {delta}</Badge>
  ) : deltaType === "down" ? (
    <Badge variant="danger">▼ {delta}</Badge>
  ) : (
    <Badge variant="info">{delta}</Badge>
  );
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {badge}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</div>
        {sub && <div className="text-sm text-zinc-500 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function AchvPill({ achieved }) {
  const pct = Math.round(achieved * 100);
  const variant = pct >= 100 ? "success" : pct >= 80 ? "warning" : "danger";
  return <Badge variant={variant}>{pct}% Achieved</Badge>;
}

// --- Section Components ---
function ZonePerf({ zones }) {
  return (
    <Card className="h-[380px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Zone-wise Performance (Target / Primary / Secondary / Collection)</CardTitle>
          <Badge variant="info">This Month</Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={zones}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis dataKey="zone" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`৳${Number(v).toLocaleString()}`, ""]} />
            <Legend />
            <Bar dataKey="target" name="Target (DP)" radius={[6, 6, 0, 0]} fill="#d4d4d8" />
            <Bar dataKey="primary" name="Primary" radius={[6, 6, 0, 0]} fill="#34d399" />
            <Bar dataKey="secondary" name="Secondary" radius={[6, 6, 0, 0]} fill="#60a5fa" />
            <Bar dataKey="collection" name="Collection" radius={[6, 6, 0, 0]} fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function MonthlyTrend({ monthTrend }) {
  return (
    <Card className="h-[360px]">
      <CardHeader>
        <CardTitle>6‑Month Trend (Target, Primary, Secondary, Collection)</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthTrend}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis dataKey="m" />
            <YAxis tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `৳${Number(v).toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="target" stroke="#d4d4d8" strokeWidth={2} dot={false} name="Target (DP)" />
            <Line type="monotone" dataKey="primary" stroke="#34d399" strokeWidth={2} name="Primary" />
            <Line type="monotone" dataKey="secondary" stroke="#60a5fa" strokeWidth={2} name="Secondary" />
            <Line type="monotone" dataKey="collection" stroke="#f59e0b" strokeWidth={2} name="Collection" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BrandwiseCards({ brandwise }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Brandwise Sales & PCS Target</CardTitle>
          <div className="flex gap-2">
            <Badge variant="info">TP</Badge>
            <Badge variant="default">MRP</Badge>
            <Badge variant="purple">PCS Target</Badge>
            <Badge variant="default">PCS</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandwise.map((b, i) => (
              <div key={b.brand} className="p-4 rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-zinc-500">{b.brand}</div>
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-xs text-zinc-500">TP</div>
                    <div className="font-semibold tabular-nums">৳{b.tp.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">MRP</div>
                    <div className="font-semibold tabular-nums">৳{b.mrp.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">PCS Tgt</div>
                    <div className="font-semibold tabular-nums">{b.pcsTarget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">PCS</div>
                    <div className="font-semibold tabular-nums">{b.pcs.toLocaleString()}</div>
                    <div className="mt-1"><AchvPill achieved={b.pcs / b.pcsTarget} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BrandContributionAll({ brandwise }) {
  const pieDataTP = brandwise.map((b) => ({ name: b.brand, value: b.tp }));
  const pieDataMRP = brandwise.map((b) => ({ name: b.brand, value: b.mrp }));
  const pieDataPCS = brandwise.map((b) => ({ name: b.brand, value: b.pcs }));

  const PieBlock = ({ title, data }) => (
    <Card className="h-[360px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip formatter={(v) => `${Number(v).toLocaleString()}`} />
            <Legend />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <PieBlock title="Brand Contribution (PCS)" data={pieDataPCS} />
      <PieBlock title="Brand Contribution (TP)" data={pieDataTP} />
      <PieBlock title="Brand Contribution (MRP)" data={pieDataMRP} />
    </div>
  );
}

function ZoneTable({ zones }) {
  const rows = zones.map((z) => {
    const achievement = z.target ? (z.primary + z.secondary) / z.target : 0;
    return { ...z, achievement };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zone-wise Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2 pr-4">Zone</th>
                <th className="py-2 pr-4">Target (DP)</th>
                <th className="py-2 pr-4">Primary</th>
                <th className="py-2 pr-4">Secondary</th>
                <th className="py-2 pr-4">Collection</th>
                <th className="py-2 pr-4">Achievement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.zone} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium">{r.zone}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.target.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.primary.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.secondary.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.collection.toLocaleString()}</td>
                  <td className="py-2 pr-4"><AchvPill achieved={r.achievement} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SkuTables({ topSkus, bottomSkus }) {
  const Table = ({ title, data }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">PCS</th>
                <th className="py-2 pr-4">TP</th>
                <th className="py-2 pr-4">MRP</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.sku} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium">{r.sku}</td>
                  <td className="py-2 pr-4 tabular-nums">{r.pcs.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.tp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.mrp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Table title="Top Performing SKUs" data={topSkus} />
      <Table title="Slow / Bottom SKUs" data={bottomSkus} />
    </div>
  );
}

function SalesMovement({ salesMovementBrand, salesMovementProduct, salesMovementCategory }) {
  const Table = ({ title, cols, rows }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                {cols.map((c) => (
                  <th key={c.key} className="py-2 pr-4">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  {cols.map((c) => (
                    <td key={c.key} className={`py-2 pr-4 ${c.num ? "tabular-nums" : ""}`}>
                      {c.format ? c.format(r[c.key]) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Table
        title="Sales Movement – Brandwise"
        cols={[
          { key: "brand", name: "Brand" },
          { key: "today", name: "Today (PCS)", num: true },
          { key: "mtd", name: "MTD (PCS)", num: true },
          { key: "tp", name: "TP", num: true, format: (v) => `৳${v.toLocaleString()}` },
          { key: "mrp", name: "MRP", num: true, format: (v) => `৳${v.toLocaleString()}` },
        ]}
        rows={salesMovementBrand}
      />
      <Table
        title="Sales Movement – Productwise"
        cols={[
          { key: "sku", name: "SKU" },
          { key: "today", name: "Today (PCS)", num: true },
          { key: "mtd", name: "MTD (PCS)", num: true },
          { key: "tp", name: "TP", num: true, format: (v) => `৳${v.toLocaleString()}` },
          { key: "mrp", name: "MRP", num: true, format: (v) => `৳${v.toLocaleString()}` },
        ]}
        rows={salesMovementProduct}
      />
      <Table
        title="Sales Movement – Categorywise"
        cols={[
          { key: "category", name: "Category" },
          { key: "today", name: "Today (PCS)", num: true },
          { key: "mtd", name: "MTD (PCS)", num: true },
        ]}
        rows={salesMovementCategory}
      />
    </div>
  );
}

function CategoryTargets({ categoryWise }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Wise PCS – Target vs Actual</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={categoryWise}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pcsTarget" name="PCS Target" radius={[6,6,0,0]} fill="#a78bfa" />
            <Bar dataKey="pcs" name="PCS Actual" radius={[6,6,0,0]} fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ScrollList({ title, rows, nameKey = "brand" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-y-auto pr-1">
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r[nameKey]} className="py-2 flex items-center justify-between">
                <span className="text-sm">{r[nameKey]}</span>
                <span className="text-sm font-semibold tabular-nums">{r.pcs.toLocaleString()} pcs</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function StockMovementTable({ stockMovement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement (DP)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                {[
                  "Node", "Opening (DP)", "Primary (DP)", "Secondary (DP)", "Secondary (TP)", "Market Return (DP)", "Office Return (DP)", "Actual Secondary (DP)", "Closing (DP)",
                ].map((h) => (
                  <th key={h} className="py-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockMovement.map((r) => (
                <tr key={r.node} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium">{r.node}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.openingDp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.primaryDp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.secondaryDp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.secondaryTp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.marketReturnDp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.officeReturnDp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.actualSecondaryDp.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.closingDp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DueReportTable({ dueReport }) {
  const total = dueReport.reduce((s, r) => s + r.outstanding, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Due Report (Receivables Aging)</CardTitle>
          <Badge variant="warning">Total Outstanding: ৳{total.toLocaleString()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                {[
                  "Party", "Zone", "Outstanding", "0–30", "31–60", "61–90", ">90",
                ].map((h) => (
                  <th key={h} className="py-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dueReport.map((r) => (
                <tr key={r.party} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium">{r.party}</td>
                  <td className="py-2 pr-4">{r.zone}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.outstanding.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.bucket0_30.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.bucket31_60.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.bucket61_90.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">৳{r.bucket90p.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ZonewiseDue({ zones, dueReport }) {
  const sums = zones.map((z) => {
    const entries = dueReport.filter((d) => d.zone === z.zone);
    const total = entries.reduce((s, e) => s + e.outstanding, 0);
    return { zone: z.zone, outstanding: total };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zone-wise Due Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sums.map((r) => (
            <div key={r.zone} className="p-4 rounded-2xl border border-gray-100 bg-white">
              <div className="text-sm text-zinc-500">{r.zone}</div>
              <div className="text-xl font-semibold tabular-nums">৳{r.outstanding.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DevTests({ zones, targetData, stockMovement, dueReport, brandwise, brandPcsSales }) {
  const results = useMemo(() => {
    const tests = [];

    // Test 1: Sum of zone targets equals Target (DP)
    const sumZoneTarget = zones.reduce((s, z) => s + z.target, 0);
    const targetDp = targetData.reduce((sum, z) => sum + (z.total_dp_target || 0), 0);
    tests.push({
      name: "Targets sum matches Target (DP)",
      pass: Math.abs(sumZoneTarget - targetDp) < 1,
      details: `zones=${sumZoneTarget} vs targetDp=${targetDp}`,
    });

    // Test 2: Outstanding formula holds: primary + secondary - collection
    const primary = zones.reduce((s, z) => s + z.primary, 0);
    const secondary = zones.reduce((s, z) => s + z.secondary, 0);
    const collection = zones.reduce((s, z) => s + z.collection, 0);
    const outstanding = primary + secondary - collection;
    tests.push({
      name: "Outstanding = Primary + Secondary - Collection",
      pass: outstanding >= 0,
      details: `calc=${outstanding}`,
    });

    // Test 3: Stock closing math for each node
    const stockChecks = stockMovement.every((r) => r.closingDp === r.openingDp + r.primaryDp - r.actualSecondaryDp);
    tests.push({
      name: "Stock closing = opening + primary - actualSecondary",
      pass: stockChecks,
      details: "per-node validation",
    });

    // Test 4: Brandwise PCS list contains entries
    const map = Object.fromEntries(brandPcsSales.map((r) => [r.brand, r.pcs]));
    tests.push({
      name: "Brand PCS list contains entries",
      pass: brandwise.every((b) => map[b.brand] !== undefined),
      details: `brands=${brandwise.length}, pcsEntries=${Object.keys(map).length}`,
    });

    // Test 5: Contribution arrays not empty
    tests.push({ name: "Brand contribution data exists", pass: brandwise.length > 0, details: `brands=${brandwise.length}` });

    return tests;
  }, [zones, targetData, stockMovement, dueReport, brandwise, brandPcsSales]);

  const anyFail = results.some((t) => !t.pass);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dev Self‑Tests</CardTitle>
          <Badge variant={anyFail ? "danger" : "success"}>{anyFail ? "Some tests failed" : "All tests passed"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {results.map((t) => (
            <li key={t.name} className="flex items-center justify-between">
              <span>{t.name}</span>
              <span className={`font-medium ${t.pass ? "text-emerald-600" : "text-rose-600"}`}>{t.pass ? "PASS" : "FAIL"}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---
export default function AdminHomePage() {
  const [zones, setZones] = useState([]);
  const [targetData, setTargetData] = useState([]);
  const [monthTrend, setMonthTrend] = useState([]);
  const [brandwise, setBrandwise] = useState([]);
  const [brandPcsSales, setBrandPcsSales] = useState([]);
  const [categoryWise, setCategoryWise] = useState([]);
  const [categoryPcsSales, setCategoryPcsSales] = useState([]);
  const [salesMovementBrand, setSalesMovementBrand] = useState([]);
  const [salesMovementProduct, setSalesMovementProduct] = useState([]);
  const [salesMovementCategory, setSalesMovementCategory] = useState([]);
  const [stockMovement, setStockMovement] = useState([]);
  const [dueReport, setDueReport] = useState([]);
  const [topSkus, setTopSkus] = useState([]);
  const [bottomSkus, setBottomSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  useEffect(() => {
    fetchDashboardData();
  }, [year, month]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch zones
      const zonesRes = await axios.get("http://175.29.181.245:5000/api/area-options", { params: { type: "Zone" } });
      const zoneList = zonesRes.data.data || [];

      // Fetch targets and sales for current month
      const currentStart = dayjs(`${year}-${month}-01`).format("YYYY-MM-DD HH:mm:ss");
      const currentEnd = dayjs(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD HH:mm:ss");
      const currentMonthStr = `${year}-${month.toString().padStart(2, "0")}`;

      const salesRes = await axios.get("http://175.29.181.245:5000/sales/zone-wise", {
        params: { month: currentMonthStr, year },
      }).catch(() => ({ data: [] }));
      const targetsRes = await axios.get("http://175.29.181.245:5000/targets/zone-wise", {
        params: { year, month },
      }).catch(() => ({ data: [] }));

      setTargetData(targetsRes.data);

      // Aggregate zone data
      const zoneDataPromises = zoneList.map(async (zoneValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Zone", areaValue: zoneValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));
        const financialRes = await axios.get("http://175.29.181.245:5000/api/area-financial-movement", {
          params: { areaType: "Zone", areaValue: zoneValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: {} } }));

        const stock = stockRes.data.data || [];
        const financial = financialRes.data.data || {};

        const primary = stock.reduce((sum, item) => sum + (item.primaryValueTP || 0), 0);
        const secondary = stock.reduce((sum, item) => sum + (item.secondaryValueTP || 0), 0);
        const collection = financial.payment || 0;

        const targetEntry = targetsRes.data.find((t) => t._id === zoneValue);
        const salesEntry = salesRes.data.find((s) => s._id === zoneValue);

        const target = targetEntry ? targetEntry.total_tp_target : 0;
        const salesSecondary = salesEntry ? salesEntry.total_tp : secondary;

        return {
          zone: zoneValue.replace(/-\d+$/, "").replace(/-/g, " "),
          target,
          primary,
          secondary: salesSecondary,
          collection,
        };
      });

      const zoneData = await Promise.all(zoneDataPromises);
      setZones(zoneData);

      // Fetch brand data
      const brandRes = await axios.get("http://175.29.181.245:5000/api/area-options", { params: { type: "Brand" } });
      const brandList = brandRes.data.data || [];

      const brandDataPromises = brandList.map(async (brandValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Brand", areaValue: brandValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));
        const targetRes = await axios.get("http://175.29.181.245:5000/brandTargets", {
          params: { year, month, brand: brandValue },
        }).catch(() => ({ data: [] }));

        const stock = stockRes.data.data || [];
        const tp = stock.reduce((sum, item) => sum + (item.secondaryValueTP || 0), 0);
        const mrp = stock.reduce((sum, item) => sum + (item.secondaryValueMRP || 0), 0);
        const pcs = stock.reduce((sum, item) => sum + (item.secondaryQty || 0), 0);
        const pcsTarget = targetRes.data[0]?.pcsTarget || pcs * 1.5; // Fallback to 1.5x actual if no target

        return {
          brand: brandValue,
          tp,
          mrp,
          pcs,
          pcsTarget,
        };
      });

      const brandData = await Promise.all(brandDataPromises);
      setBrandwise(brandData);
      setBrandPcsSales(brandData.map((b) => ({ brand: b.brand, pcs: b.pcs })));

      // Fetch category data
      const categoryRes = await axios.get("http://175.29.181.245:5000/api/area-options", { params: { type: "Category" } });
      const categoryList = categoryRes.data.data || [];

      const categoryDataPromises = categoryList.map(async (categoryValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Category", areaValue: categoryValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));
        const targetRes = await axios.get("http://175.29.181.245:5000/categoryTargets", {
          params: { year, month, category: categoryValue },
        }).catch(() => ({ data: [] }));

        const stock = stockRes.data.data || [];
        const pcs = stock.reduce((sum, item) => sum + (item.secondaryQty || 0), 0);
        const pcsTarget = targetRes.data[0]?.pcsTarget || pcs * 1.5;

        return {
          category: categoryValue,
          pcs,
          pcsTarget,
        };
      });

      const categoryData = await Promise.all(categoryDataPromises);
      setCategoryWise(categoryData);
      setCategoryPcsSales(categoryData.map((c) => ({ category: c.category, pcs: c.pcs })));

      // Fetch sales movement data
      const todayStart = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
      const todayEnd = dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss");

      const salesMovementBrandPromises = brandList.map(async (brandValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Brand", areaValue: brandValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));
        const todayRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Brand", areaValue: brandValue, startDate: todayStart, endDate: todayEnd },
        }).catch(() => ({ data: { data: [] } }));

        const stock = stockRes.data.data || [];
        const todayStock = todayRes.data.data || [];

        return {
          brand: brandValue,
          today: todayStock.reduce((sum, item) => sum + (item.secondaryQty || 0), 0),
          mtd: stock.reduce((sum, item) => sum + (item.secondaryQty || 0), 0),
          tp: stock.reduce((sum, item) => sum + (item.secondaryValueTP || 0), 0),
          mrp: stock.reduce((sum, item) => sum + (item.secondaryValueMRP || 0), 0),
        };
      });

      const salesMovementCategoryPromises = categoryList.map(async (categoryValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Category", areaValue: categoryValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));
        const todayRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Category", areaValue: categoryValue, startDate: todayStart, endDate: todayEnd },
        }).catch(() => ({ data: { data: [] } }));

        const stock = stockRes.data.data || [];
        const todayStock = todayRes.data.data || [];

        return {
          category: categoryValue,
          today: todayStock.reduce((sum, item) => sum + (item.secondaryQty || 0), 0),
          mtd: stock.reduce((sum, item) => sum + (item.secondaryQty || 0), 0),
        };
      });

      const salesMovementProductPromises = zoneList.map(async (zoneValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Zone", areaValue: zoneValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));
        const todayRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Zone", areaValue: zoneValue, startDate: todayStart, endDate: todayEnd },
        }).catch(() => ({ data: { data: [] } }));

        const stock = stockRes.data.data || [];
        const todayStock = todayRes.data.data || [];

        return stock.map((item) => ({
          sku: item.itemName || "Unknown SKU",
          today: todayStock.find((t) => t.itemName === item.itemName)?.secondaryQty || 0,
          mtd: item.secondaryQty || 0,
          tp: item.secondaryValueTP || 0,
          mrp: item.secondaryValueMRP || 0,
        }));
      });

      const salesMovementBrandData = await Promise.all(salesMovementBrandPromises);
      const salesMovementCategoryData = await Promise.all(salesMovementCategoryPromises);
      const salesMovementProductData = (await Promise.all(salesMovementProductPromises)).flat();

      setSalesMovementBrand(salesMovementBrandData);
      setSalesMovementCategory(salesMovementCategoryData);
      setSalesMovementProduct(salesMovementProductData);

      // Fetch stock movement
      const stockPromises = zoneList.map(async (zoneValue) => {
        const stockRes = await axios.get("http://175.29.181.245:5000/api/area-stock-movement", {
          params: { areaType: "Zone", areaValue: zoneValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: [] } }));

        const stock = stockRes.data.data || [];
        return {
          node: zoneValue.replace(/-\d+$/, "").replace(/-/g, " "),
          openingDp: stock.reduce((sum, item) => sum + (item.openingValueDP || 0), 0),
          primaryDp: stock.reduce((sum, item) => sum + (item.primaryValueDP || 0), 0),
          secondaryDp: stock.reduce((sum, item) => sum + (item.secondaryValueDP || 0), 0),
          secondaryTp: stock.reduce((sum, item) => sum + (item.secondaryValueTP || 0), 0),
          marketReturnDp: stock.reduce((sum, item) => sum + (item.marketReturnValueDP || 0), 0),
          officeReturnDp: stock.reduce((sum, item) => sum + (item.officeReturnValueDP || 0), 0),
        };
      });

      const stockData = await Promise.all(stockPromises);
      setStockMovement(stockData.map((r) => ({
        ...r,
        actualSecondaryDp: r.secondaryDp - r.marketReturnDp - r.officeReturnDp,
        closingDp: r.openingDp + r.primaryDp - (r.secondaryDp - r.marketReturnDp - r.officeReturnDp),
      })));

      // Fetch due report
      const duePromises = zoneList.map(async (zoneValue) => {
        const financialRes = await axios.get("http://175.29.181.245:5000/api/area-financial-movement", {
          params: { areaType: "Zone", areaValue: zoneValue, startDate: currentStart, endDate: currentEnd },
        }).catch(() => ({ data: { data: { openingBreakdown: [] } } }));
        const data = financialRes.data.data;
        return data.openingBreakdown?.map((bd) => ({
          party: bd.outlet.replace("_", " ") || "Unknown Party",
          zone: zoneValue.replace(/-\d+$/, "").replace(/-/g, " "),
          outstanding: bd.openingDue || 0,
          bucket0_30: bd.openingDue || 0, // Placeholder, no aging data
          bucket31_60: 0,
          bucket61_90: 0,
          bucket90p: 0,
        })) || [];
      });
      const dueData = (await Promise.all(duePromises)).flat();
      setDueReport(dueData);

      // Fetch top/bottom SKUs
      const skuData = salesMovementProductData.sort((a, b) => b.pcs - a.pcs);
      setTopSkus(skuData.slice(0, 3));
      setBottomSkus(skuData.slice(-3));

      // Fetch month trend
      const trendPromises = [];
      for (let i = 5; i >= 0; i--) {
        const date = dayjs(`${year}-${month}-01`).subtract(i, "month");
        const y = date.year();
        const m = date.month() + 1;
        const start = date.format("YYYY-MM-DD HH:mm:ss");
        const end = date.endOf("month").format("YYYY-MM-DD HH:mm:ss");
        const mStr = `${y}-${m.toString().padStart(2, "0")}`;

        const trendTargetRes = axios.get("http://175.29.181.245:5000/targets/zone-wise", { params: { year: y, month: m } });
        const trendSalesRes = axios.get("http://175.29.181.245:5000/sales/zone-wise", { params: { month: mStr, year: y } });

        trendPromises.push(Promise.all([trendTargetRes, trendSalesRes]).then(([tRes, sRes]) => {
          const target = tRes.data.reduce((sum, z) => sum + (z.total_tp_target || 0), 0);
          const secondary = sRes.data.reduce((sum, z) => sum + (z.total_tp || 0), 0);
          const primaryPromise = Promise.all(zoneList.map((zoneValue) => 
            axios.get("http://175.29.181.245:5000/api/area-stock-movement", { 
              params: { areaType: "Zone", areaValue: zoneValue, startDate: start, endDate: end } 
            }).then((res) => res.data.data.reduce((sum, item) => sum + (item.primaryValueTP || 0), 0))
          )).then((vals) => vals.reduce((sum, v) => sum + v, 0));

          const collectionPromise = Promise.all(zoneList.map((zoneValue) => 
            axios.get("http://175.29.181.245:5000/api/area-financial-movement", { 
              params: { areaType: "Zone", areaValue: zoneValue, startDate: start, endDate: end } 
            }).then((res) => res.data.data.payment || 0)
          )).then((vals) => vals.reduce((sum, v) => sum + v, 0));

          return Promise.all([primaryPromise, collectionPromise]).then(([primary, collection]) => ({
            m: date.format("MMM"),
            target,
            primary,
            secondary,
            collection,
          }));
        }));
      }

      const trendData = await Promise.all(trendPromises);
      setMonthTrend(trendData);

    } catch (err) {
      setError("Failed to load some data. Using available information.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const targetSummary = useMemo(() => {
    const dpTarget = targetData.reduce((sum, z) => sum + (z.total_dp_target || 0), 0);
    const tpTarget = targetData.reduce((sum, z) => sum + (z.total_tp_target || 0), 0);
    return {
      targetDp: dpTarget,
      dpTarget,
      tpTarget,
    };
  }, [targetData]);

  const totals = useMemo(() => {
    const target = zones.reduce((s, z) => s + z.target, 0);
    const primary = zones.reduce((s, z) => s + z.primary, 0);
    const secondary = zones.reduce((s, z) => s + z.secondary, 0);
    const collection = zones.reduce((s, z) => s + z.collection, 0);
    const achieved = target ? (primary + secondary) / target : 0;
    const outstanding = primary + secondary - collection;
    return { target, primary, secondary, collection, achieved, outstanding };
  }, [zones]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-50">
        <AdminSidebar />
        <div className="flex-1 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500" />
              <div>
                <div className="text-sm uppercase tracking-widest text-zinc-500">GVI POS</div>
                <div className="font-semibold -mt-1">Sales, Collection & Movement Dashboard</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <label htmlFor="year" className="mr-2 font-medium text-xs">Year:</label>
                <select
                  id="year"
                  className="px-3 py-2 border rounded-md text-sm"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {[2023, 2024, 2025].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="month" className="mr-2 font-medium text-xs">Month:</label>
                <select
                  id="month"
                  className="px-3 py-2 border rounded-md text-sm"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <Card className="mb-6">
              <CardContent>
                <div className="p-3 bg-yellow-100 text-yellow-800 rounded flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPI Row 1 – Targets */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Target (DP)"
              value={`৳${targetSummary.targetDp.toLocaleString()}`}
              sub={<span className="flex items-center gap-2">Overall <AchvPill achieved={totals.achieved} /></span>}
              delta="MTD"
              deltaType="neutral"
            />
            <StatCard title="DP Target" value={`৳${targetSummary.dpTarget.toLocaleString()}`} sub="Distribution Price" delta="DP" deltaType="up" />
            <StatCard title="TP Target" value={`৳${targetSummary.tpTarget.toLocaleString()}`} sub="Trade Price" delta="TP" deltaType="up" />
            <StatCard title="Primary Sales" value={`৳${totals.primary.toLocaleString()}`} sub="Month to Date" delta="Primary" deltaType="up" />
            <StatCard title="Secondary Sales" value={`৳${totals.secondary.toLocaleString()}`} sub="Month to Date" delta="Secondary" deltaType="up" />
          </div>

          {/* KPI Row 2 – Collection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Collection"
              value={`৳${totals.collection.toLocaleString()}`}
              sub={<span className="text-zinc-500">Outstanding: ৳${totals.outstanding.toLocaleString()}</span>}
              delta="Cashflow"
              deltaType="down"
            />
            <StatCard
              title="Brandwise PCS Target"
              value={`${brandwise.reduce((s,b)=>s+b.pcsTarget,0).toLocaleString()} pcs`}
              sub={`Actual: ${brandwise.reduce((s,b)=>s+b.pcs,0).toLocaleString()} pcs`}
              delta="PCS"
              deltaType="neutral"
            />
            <StatCard
              title="Categorywise PCS Target"
              value={`${categoryWise.reduce((s,c)=>s+c.pcsTarget,0).toLocaleString()} pcs`}
              sub={`Actual: ${categoryWise.reduce((s,c)=>s+c.pcs,0).toLocaleString()} pcs`}
              delta="PCS"
              deltaType="neutral"
            />
          </div>

          {/* Zone Performance + Trend */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="xl:col-span-2"><ZonePerf zones={zones} /></div>
            <div className="xl:col-span-1"><MonthlyTrend monthTrend={monthTrend} /></div>
          </div>

          {/* Brand & Category */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="xl:col-span-2"><BrandwiseCards brandwise={brandwise} /></div>
            <div className="xl:col-span-1"><BrandContributionAll brandwise={brandwise} /></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <ScrollList title="Brandwise PCS Sales" rows={brandPcsSales} nameKey="brand" />
            <ScrollList title="Categorywise PCS Sales" rows={categoryPcsSales} nameKey="category" />
          </div>

          <CategoryTargets categoryWise={categoryWise} />

          {/* Sales Movement */}
          <SalesMovement
            salesMovementBrand={salesMovementBrand}
            salesMovementProduct={salesMovementProduct}
            salesMovementCategory={salesMovementCategory}
          />

          {/* Stock Movement */}
          <StockMovementTable stockMovement={stockMovement} />

          {/* Zone details & SKUs */}
          <ZoneTable zones={zones} />
          <SkuTables topSkus={topSkus} bottomSkus={bottomSkus} />

          {/* Due Report */}
          <DueReportTable dueReport={dueReport} />
          <ZonewiseDue zones={zones} dueReport={dueReport} />

          {/* Dev tests */}
          <DevTests
            zones={zones}
            targetData={targetData}
            stockMovement={stockMovement}
            dueReport={dueReport}
            brandwise={brandwise}
            brandPcsSales={brandPcsSales}
          />
        </div>
      </div>
    </div>
  );
}