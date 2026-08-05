import { Layout } from "@/components/layout";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

export default function Reports() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const COLORS = ['#10b981', '#6b7280', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const placeholderMonthlyData = [
    { name: 'Jan', filings: 40 },
    { name: 'Feb', filings: 30 },
    { name: 'Mar', filings: 45 },
    { name: 'Apr', filings: 50 },
    { name: 'May', filings: 65 },
    { name: 'Jun', filings: 55 },
    { name: 'Jul', filings: summary?.recentFilingsCount || 70 },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Court performance metrics and visualizations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border shadow-sm flex flex-col h-[400px]">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="font-serif">Case Status Breakdown</CardTitle>
              <CardDescription>Distribution of cases by current status</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary?.statusBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                    >
                      {(summary?.statusBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} cases`, 'Count']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm flex flex-col h-[400px]">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="font-serif">Monthly Filings</CardTitle>
              <CardDescription>New cases filed over the last 7 months</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={placeholderMonthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="filings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm flex flex-col h-[400px] lg:col-span-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="font-serif">Case Categories</CardTitle>
              <CardDescription>Volume of cases by category type</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={summary?.categoryBreakdown || []} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, width: 90 }} />
                    <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
