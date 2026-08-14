"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  UserCircle2,
  Shield,
  Mail,
  Phone,
  BadgeCheck,
  Pencil,
  Trash2,
  AlertTriangle,
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
import { apiFetch } from "@/lib/api";

type UserRole = "admin" | "mechanic" | "advisor";
type UserStatus = "active" | "inactive";

type User = {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string | null;
};

const roleLabel: Record<UserRole, string> = {
  admin: "Administrador",
  mechanic: "Mecánico",
  advisor: "Asesor de servicio",
};

const roleBadgeClasses: Record<UserRole, string> = {
  admin:
    "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  mechanic:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  advisor:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const statusLabel: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

const statusBadgeClasses: Record<UserStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  inactive:
    "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] =
    useState<"all" | UserStatus>("all");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const isDeleteOpen = !!deleteUser;

  const [form, setForm] = useState<UserFormState>({
    name: "",
    email: "",
    phone: "",
    role: "mechanic",
    status: "active",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshUsers() {
    setApiError("");
    const data = await apiFetch<User[]>("/api/users/");
    setUsers(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshUsers();
      } catch (e: any) {
        setApiError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        search.trim().length === 0 ||
        `${user.name} ${user.email} ${user.phone ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" ? true : user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      role: "mechanic",
      status: "active",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      status: user.status,
    });
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
  };

  const handleFormChange = <K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        status: form.status,
      };

      if (editingUser) {
        // PUT
        await apiFetch<User>(`/api/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // POST
        await apiFetch<User>(`/api/users`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await refreshUsers();
      setIsFormOpen(false);
    } catch (e: any) {
      setApiError(e?.message ?? String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    setApiError("");

    try {
      await apiFetch<{ ok: boolean }>(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
      });
      setDeleteUser(null);
      await refreshUsers();
    } catch (e: any) {
      setApiError(e?.message ?? String(e));
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setDeleteUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Usuarios del sistema
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Administra las cuentas de acceso al sistema del taller Díaz &amp; Díaz.
          </p>
          {apiError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {apiError}
            </p>
          )}
        </div>

        <Button onClick={openCreateModal} className="mt-2 md:mt-0 gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <span>
            {loading ? "Cargando..." : `${users.length} usuario${users.length !== 1 ? "s" : ""} en total`}
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Rol */}
          <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Rol:
            </span>
            <select
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              disabled={loading}
            >
              <option value="all">Todos</option>
              <option value="admin">Administradores</option>
              <option value="advisor">Asesores</option>
              <option value="mechanic">Mecánicos</option>
            </select>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Estado:
            </span>
            <select
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              disabled={loading}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Buscar por nombre, correo o teléfono..."
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="border-b px-4 py-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Usuarios registrados
          </h3>
        </div>

        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Contacto</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Último acceso</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No se encontraron usuarios con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`border-t text-xs border-slate-100 dark:border-slate-800 ${
                      idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-900/80"
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                          <UserCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{user.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="truncate max-w-[220px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeClasses[user.role]}`}>
                        <Shield className="h-3 w-3" />
                        {roleLabel[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClasses[user.status]}`}>
                        <BadgeCheck className="h-3 w-3" />
                        {statusLabel[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {user.lastLogin ?? "Sin registros"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(user)}
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar usuario</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar usuario</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar usuario */}
      <Dialog open={isFormOpen} onOpenChange={closeFormModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription className="pt-1 text-sm">
              Define los datos y permisos del usuario dentro del sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Nombre completo
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Este correo se usará para el acceso y notificaciones del sistema.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Teléfono
              </label>
              <input
                value={form.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                placeholder="+56 9 ..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Rol
                </label>
                <select
                  value={form.role}
                  onChange={(e) => handleFormChange("role", e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="admin">Administrador</option>
                  <option value="advisor">Asesor de servicio</option>
                  <option value="mechanic">Mecánico</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Estado
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleFormChange("status", e.target.value as UserStatus)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeFormModal} className="border-slate-300 dark:border-slate-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <BadgeCheck className="h-4 w-4" />
                {isSubmitting ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal eliminar usuario */}
      <Dialog open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar usuario</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar la cuenta de{" "}
              <span className="font-semibold">{deleteUser?.name}</span>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Más adelante puedes implementar una eliminación lógica en la base de datos (marcar como inactivo) en lugar de eliminar el registro definitivamente.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)} className="border-slate-300 dark:border-slate-700">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
