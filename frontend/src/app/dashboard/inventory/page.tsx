"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ScanLine,
  Plus,
  Boxes,
  AlertTriangle,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type StockStatus = "OK" | "Bajo" | "Sin stock";

type InventoryItem = {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  location?: string;
  unitCost: number;
  unitPrice: number;
  supplier?: string;
  stockStatus?: StockStatus;
};

type InventoryApiItem = {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  location?: string | null;
  unit_cost: number;
  unit_price: number;
  supplier?: string | null;
  stock_status?: StockStatus;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const getStockStatus = (item: InventoryItem): StockStatus => {
  if (item.stock <= 0) return "Sin stock";
  if (item.stock <= item.minStock) return "Bajo";
  return "OK";
};

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

const mapInventoryItem = (item: InventoryApiItem): InventoryItem => ({
  id: item.id,
  code: item.code,
  barcode: item.barcode ?? undefined,
  name: item.name,
  category: item.category,
  stock: item.stock,
  minStock: item.min_stock,
  location: item.location ?? undefined,
  unitCost: Number(item.unit_cost),
  unitPrice: Number(item.unit_price),
  supplier: item.supplier ?? undefined,
  stockStatus: item.stock_status,
});

export default function InventoryPage() {
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [stockFilter, setStockFilter] = useState<"Todos" | StockStatus>("Todos");

  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const isDeleteOpen = !!itemToDelete;

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (categoryFilter !== "Todas") {
        params.set("category", categoryFilter);
      }

      if (stockFilter !== "Todos") {
        params.set("stock_status", stockFilter);
      }

      const url = `${API_URL}/api/inventory${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el inventario");
      }

      const data: InventoryApiItem[] = await response.json();
      setItems(data.map(mapInventoryItem));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el inventario.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSearch = async (barcodeValue?: string) => {
    const cleanBarcode = (barcodeValue ?? barcodeSearch).trim();

    if (!cleanBarcode) return;

    try {
      setIsSearchingBarcode(true);

      const response = await fetch(
        `${API_URL}/api/inventory/barcode/${encodeURIComponent(cleanBarcode)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (response.ok) {
        const item: InventoryApiItem = await response.json();
        router.push(`/dashboard/inventory/${item.id}/edit`);
        return;
      }

      if (response.status === 404) {
        router.push(
          `/dashboard/inventory/new?barcode=${encodeURIComponent(cleanBarcode)}`
        );
        return;
      }

      throw new Error("No se pudo buscar el código de barras");
    } catch (err) {
      console.error(err);
      alert("No se pudo buscar el código de barras.");
    } finally {
      setIsSearchingBarcode(false);
      setBarcodeSearch("");
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, stockFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(items.map((i) => i.category))).sort()],
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        search.trim().length === 0 ||
        [
          item.code,
          item.barcode,
          item.name,
          item.category,
          item.location,
          item.supplier,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "Todas" ? true : item.category === categoryFilter;

      const status = item.stockStatus ?? getStockStatus(item);
      const matchesStock = stockFilter === "Todos" ? true : status === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, search, categoryFilter, stockFilter]);

  const getStockBadgeClasses = (status: StockStatus) => {
    switch (status) {
      case "OK":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
      case "Bajo":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
      case "Sin stock":
        return "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300";
      default:
        return "bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(
        `${API_URL}/api/inventory/${itemToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar el repuesto");
      }

      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el repuesto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !isDeleting) {
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Inventario de repuestos
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Controla el stock de repuestos y consumibles del taller Díaz & Díaz.
          </p>
        </div>

        <Button asChild className="mt-2 md:mt-0">
          <Link href="/dashboard/inventory/new" className="inline-flex gap-2">
            <Plus className="h-4 w-4" />
            Registrar repuesto
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Boxes className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <span>{items.length} repuestos registrados</span>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Categoría:
              </span>
              <select
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Estado stock:
              </span>
              <select
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                value={stockFilter}
                onChange={(e) =>
                  setStockFilter(e.target.value as "Todos" | StockStatus)
                }
              >
                <option value="Todos">Todos</option>
                <option value="OK">OK</option>
                <option value="Bajo">Bajo stock</option>
                <option value="Sin stock">Sin stock</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-72 rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Buscar por código, nombre, proveedor..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleBarcodeSearch();
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Escanear o escribir código de barras"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleBarcodeSearch()}
            disabled={isSearchingBarcode || !barcodeSearch.trim()}
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            {isSearchingBarcode ? "Buscando..." : "Buscar barcode"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="border-b px-4 py-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Repuestos en inventario
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Código barras</th>
                <th className="px-4 py-2 font-medium">Repuesto</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Stock</th>
                <th className="px-4 py-2 font-medium">Costo</th>
                <th className="px-4 py-2 font-medium">Precio venta</th>
                <th className="px-4 py-2 font-medium">Ubicación</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    Cargando inventario...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-xs text-red-600 dark:text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No se encontraron repuestos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const status = item.stockStatus ?? getStockStatus(item);
                  const isLow = status === "Bajo" || status === "Sin stock";

                  return (
                    <tr
                      key={item.id}
                      className={`border-t text-xs border-slate-100 dark:border-slate-800 ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/70 dark:bg-slate-900/80"
                      } ${isLow ? "bg-amber-50/40 dark:bg-amber-500/5" : ""}`}
                    >
                      <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-50">
                        {item.code}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                        {item.barcode ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-slate-400" />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            {item.supplier && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Prov: {item.supplier}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                        {item.category}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-900 dark:text-slate-50">
                            {item.stock} unid.
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Mínimo: {item.minStock}
                          </span>
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStockBadgeClasses(
                              status
                            )}`}
                          >
                            {status === "OK"
                              ? "Stock OK"
                              : status === "Bajo"
                              ? "Bajo stock"
                              : "Sin stock"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                        {item.location ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                          >
                            <Link href={`/dashboard/inventory/${item.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemToDelete(item)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar repuesto</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar el repuesto{" "}
              <span className="font-semibold">
                {itemToDelete?.code} · {itemToDelete?.name}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Asegúrate de que este repuesto no esté siendo utilizado en órdenes
            activas o pendientes de facturación antes de eliminarlo.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
              className="border-slate-300 dark:border-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
