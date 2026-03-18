import Link from "next/link";
import {
  Wrench,
  Car,
  ClipboardList,
  DollarSign,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      label: "Vehículos registrados",
      value: 42,
      icon: Car,
      trend: "+3 esta semana",
    },
    {
      label: "Órdenes abiertas",
      value: 7,
      icon: ClipboardList,
      trend: "2 en espera de repuestos",
    },
    {
      label: "Ingresos del mes",
      value: "$ 3.200.000",
      icon: DollarSign,
      trend: "Mes en curso",
    },
    {
      label: "Servicios realizados hoy",
      value: 5,
      icon: Wrench,
      trend: "Agenda al 60%",
    },
  ];

  const recentOrders = [
    {
      id: "OT-00125",
      vehicle: "Toyota Corolla 2018",
      customer: "Juan Pérez",
      status: "En proceso",
      date: "26-11-2025",
    },
    {
      id: "OT-00124",
      vehicle: "Hyundai Accent 2015",
      customer: "María López",
      status: "Finalizada",
      date: "25-11-2025",
    },
    {
      id: "OT-00123",
      vehicle: "Chevrolet Sail 2014",
      customer: "Carlos Díaz",
      status: "Esperando repuestos",
      date: "25-11-2025",
    },
  ];

  const todayAppointments = [
    {
      time: "09:00",
      vehicle: "Kia Rio 2017",
      customer: "Ana Gómez",
      reason: "Mantención 10.000 km",
    },
    {
      time: "11:30",
      vehicle: "Mazda 3 2019",
      customer: "Luis Herrera",
      reason: "Revisión frenos",
    },
    {
      time: "15:00",
      vehicle: "Nissan Versa 2016",
      customer: "Pedro Morales",
      reason: "Diagnóstico motor",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Resumen del taller
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aquí puedes ver una visión general de lo que está pasando hoy en el
          taller.
        </p>
      </section>

      {/* Tarjetas de estadísticas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex flex-col justify-between rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {stat.value}
                  </p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {stat.trend}
              </p>
            </div>
          );
        })}
      </section>

      {/* Zona inferior: 2 columnas principales */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Órdenes recientes */}
        <div className="xl:col-span-2 rounded-xl border bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between border-b px-4 py-3 border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Órdenes de trabajo recientes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Últimas órdenes creadas o actualizadas en el sistema.
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Ver todas
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                  <th className="px-4 py-2 font-medium">N° OT</th>
                  <th className="px-4 py-2 font-medium">Vehículo</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`border-t text-xs border-slate-100 dark:border-slate-800 ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-900/70"
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                      {order.id}
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {order.vehicle}
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {order.customer}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          order.status === "Finalizada"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : order.status === "En proceso"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {order.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha: Acciones rápidas + Citas */}
        <div className="space-y-4">
          {/* Acciones rápidas */}
          <div className="rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Acciones rápidas
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Atajos a las tareas más frecuentes del taller.
            </p>

            <div className="mt-4 space-y-2">
              <Link
                href="/dashboard/orders/new"
                className="flex items-center justify-between rounded-lg border bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25"
              >
                Crear nueva orden de trabajo
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/dashboard/quotes/new"
                className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Generar presupuesto
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/dashboard/vehicles/new"
                className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Registrar vehículo
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/dashboard/inventory"
                className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Revisar stock de repuestos
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Citas del día */}
          <div className="rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Citas de hoy
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Próximos vehículos agendados para hoy.
                </p>
              </div>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {todayAppointments.map((appt, idx) => (
                <div
                  key={`${appt.time}-${idx}`}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-slate-50 px-3 py-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                      {appt.time} · {appt.vehicle}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      {appt.customer}</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {appt.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-right">
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver agenda completa
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
