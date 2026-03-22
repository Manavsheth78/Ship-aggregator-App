import { Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KPICards({ shipments = [] }) {
  const stats = [
    {
      title: 'Total Shipments',
      value: shipments.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'In Transit',
      value: shipments.filter((s) => s.status === 'In Transit').length,
      icon: Truck,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Delivered',
      value: shipments.filter((s) => s.status === 'Delivered').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Label Created',
      value: shipments.filter((s) => s.status === 'Label Created').length,
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  const total = shipments.length || 1;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stat.value / total) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
