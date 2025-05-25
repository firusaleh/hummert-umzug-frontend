import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Euro, CreditCard, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, PieChart,
  Calendar, Download, Filter, Moon, Sun, Bell, Search, Menu,
  RefreshCw, ChevronRight, Sparkles, Zap, Target, Award
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart as RePieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import financeService from '../../services/financeService';
import { theme, chartTheme } from '../../theme/financeTheme';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, trend, color, gradient, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-lg"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.glass.white}, ${theme.colors.glass.dark})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.colors.glass.border}`,
        boxShadow: theme.shadows.glass
      }}
    >
      <div className="absolute inset-0 opacity-20" style={{ background: gradient }} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}
               style={{ background: gradient }}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' 
            ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
            : value
          }
        </p>
        
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: gradient }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Sparkle effect on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute top-2 right-2"
          >
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Chart Card Component
const ChartCard = ({ title, children, action, fullWidth = false }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-2xl p-6 backdrop-blur-lg ${fullWidth ? 'col-span-full' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${theme.colors.glass.white}, ${theme.colors.glass.dark})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.colors.glass.border}`,
        boxShadow: theme.shadows.glass
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200"
      >
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm mt-1" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

export default function ModernFinanceDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 11)),
    end: endOfMonth(new Date())
  });
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [financialData, setFinancialData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summary, analytics, categories] = await Promise.all([
          financeService.getFinancialSummary(dateRange.start.getFullYear()),
          financeService.getMonthlyAnalytics(12),
          financeService.getCategoryBreakdown(dateRange)
        ]);
        
        setFinancialData(summary);
        setMonthlyData(analytics);
        setCategoryData(categories);
        
        // Generate performance data
        const performance = [
          { metric: 'Umsatz', value: 85, fullMark: 100 },
          { metric: 'Profit', value: 72, fullMark: 100 },
          { metric: 'Ausgaben', value: 45, fullMark: 100 },
          { metric: 'Effizienz', value: 90, fullMark: 100 },
          { metric: 'Wachstum', value: 78, fullMark: 100 }
        ];
        setPerformanceData(performance);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);
  
  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    if (!monthlyData || monthlyData.length < 2) return {};
    
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    
    return {
      revenue: previous?.revenue > 0 
        ? ((current.revenue - previous.revenue) / previous.revenue * 100)
        : 0,
      expenses: previous?.expenses > 0
        ? ((current.expenses - previous.expenses) / previous.expenses * 100)
        : 0,
      profit: previous?.profit !== 0
        ? ((current.profit - previous.profit) / Math.abs(previous.profit) * 100)
        : 0
    };
  }, [monthlyData]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-indigo-600" />
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
      </div>
      
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 backdrop-blur-lg border-b"
        style={{
          background: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                <Wallet className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Finance Dashboard
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Period selector */}
              <div className="flex items-center space-x-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                {['day', 'week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Actions */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bell className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Gesamtumsatz"
              value={financialData?.metrics?.totalRevenue || 0}
              icon={TrendingUp}
              trend={growthMetrics.revenue}
              gradient={theme.gradients.success}
              delay={0}
            />
            <KPICard
              title="Ausgaben"
              value={financialData?.metrics?.totalExpenses || 0}
              icon={CreditCard}
              trend={growthMetrics.expenses}
              gradient={theme.gradients.danger}
              delay={0.1}
            />
            <KPICard
              title="Nettogewinn"
              value={financialData?.metrics?.profit || 0}
              icon={PiggyBank}
              trend={growthMetrics.profit}
              gradient={theme.gradients.primary}
              delay={0.2}
            />
            <KPICard
              title="Gewinnmarge"
              value={`${financialData?.metrics?.profitMargin?.toFixed(1) || 0}%`}
              icon={Target}
              gradient={theme.gradients.warning}
              delay={0.3}
            />
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <ChartCard title="Umsatzentwicklung" fullWidth>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                    <XAxis dataKey="month" stroke={chartTheme.axis.stroke} />
                    <YAxis stroke={chartTheme.axis.stroke} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                      name="Umsatz"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                      name="Ausgaben"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown */}
            <ChartCard 
              title="Ausgaben nach Kategorie"
              action={
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  Details →
                </button>
              }
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartTheme.colors[index % chartTheme.colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: chartTheme.colors[index % chartTheme.colors.length] }}
                      />
                      <span className="text-sm text-gray-600">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {category.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
            
            {/* Performance Radar */}
            <ChartCard 
              title="Performance Metriken"
              action={
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">85% Score</span>
                </div>
              }
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceData}>
                    <PolarGrid stroke={chartTheme.grid.stroke} />
                    <PolarAngleAxis dataKey="metric" stroke={chartTheme.axis.stroke} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            {/* Quick Stats */}
            <ChartCard title="Quick Stats">
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-transparent"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Beste Leistung</p>
                      <p className="text-xs text-gray-500">März 2024</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">+42%</span>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Effizienz</p>
                      <p className="text-xs text-gray-500">Diese Woche</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">94%</span>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-transparent"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Jahresziel</p>
                      <p className="text-xs text-gray-500">Fortschritt</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-purple-600">78%</span>
                </motion.div>
              </div>
            </ChartCard>
          </div>
          
          {/* Monthly Profit Bars */}
          <ChartCard title="Monatlicher Gewinn" fullWidth>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis dataKey="month" stroke={chartTheme.axis.stroke} />
                  <YAxis stroke={chartTheme.axis.stroke} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="profit"
                    radius={[8, 8, 0, 0]}
                    name="Gewinn"
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.profit >= 0 ? '#10B981' : '#EF4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </main>
      
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg"
        style={{ boxShadow: theme.shadows.glow }}
      >
        <Download className="h-6 w-6" />
      </motion.button>
    </div>
  );
}