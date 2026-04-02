import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit2,
  Lock,
  Mail,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  AdminUser,
  CreateAdminPayload,
  UpdateAdminPayload,
} from "../lib/types";
import {
  formatDateTime,
  formatRelativeTime,
  getErrorMessage,
  initialsFromEmail,
} from "../lib/utils";
import { ConfirmDialog, Modal } from "./shared/Modal";
import { EmptyState, InlineAlert, LoadingState } from "./shared/States";

type AdminDashboardProps = {
  admins: AdminUser[];
  currentAdmin: AdminUser;
  loading?: boolean;
  submitting?: boolean;
  onCreateAdmin: (payload: CreateAdminPayload) => Promise<void>;
  onUpdateAdmin: (
    adminId: string,
    payload: UpdateAdminPayload,
  ) => Promise<void>;
  onDeleteAdmin: (admin: AdminUser) => Promise<void>;
};

type FormState = {
  email: string;
  is_superuser: boolean;
  is_active: boolean;
};

const PERMISSIONS = [
  "OTP Login",
  "Admin CRUD",
  "Resource Governance",
  "Audit Access",
];

function canEditTarget(currentAdmin: AdminUser, target: AdminUser) {
  return currentAdmin.is_superuser || currentAdmin.id === target.id;
}

function canDeleteTarget(currentAdmin: AdminUser) {
  return currentAdmin.is_superuser;
}

export function AdminDashboard({
  admins,
  currentAdmin,
  loading = false,
  submitting = false,
  onCreateAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}: AdminDashboardProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    email: "",
    is_superuser: false,
    is_active: true,
  });

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return admins;
    }

    return admins.filter((admin) => admin.email.toLowerCase().includes(query));
  }, [admins, search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (editingAdmin) {
        await onUpdateAdmin(editingAdmin.id, {
          email: formState.email.trim(),
          is_active: formState.is_active,
        });
        setEditingAdmin(null);
      } else {
        if (!currentAdmin.is_superuser) {
          setFormError("Only a super admin can invite a new administrator.");
          return;
        }

        await onCreateAdmin({
          email: formState.email.trim(),
          is_superuser: formState.is_superuser,
        });
        setCreateOpen(false);
      }

      setFormState({ email: "", is_superuser: false, is_active: true });
      setFormError(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (loading) {
    return <LoadingState title="Loading administrators..." />;
  }

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      <section className="bg-surface-container-low p-5 rounded-xl border-l-4 border-primary flex items-start gap-4">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-on-surface">
            Security Protocol Active
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
            Email OTP is the only supported admin authentication path. Invited
            administrators log in with the same verification flow.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-on-surface tracking-tight">
              Administrators
            </h3>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder="Search by email..."
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 text-sm w-56"
              />
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(true);
                  setFormState({
                    email: "",
                    is_superuser: false,
                    is_active: true,
                  });
                  setFormError(
                    currentAdmin.is_superuser
                      ? null
                      : "Only a super admin can invite a new administrator.",
                  );
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  currentAdmin.is_superuser
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant border border-outline-variant/20"
                }`}
              >
                {currentAdmin.is_superuser ? (
                  <Plus className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Invite
              </button>
            </div>
          </div>

          {filteredAdmins.length === 0 ? (
            <EmptyState
              title="No administrators found"
              description="Adjust your search or invite a new admin if you have sufficient permissions."
            />
          ) : (
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-outline-variant/10">
                {filteredAdmins.map((admin) => {
                  const editable = canEditTarget(currentAdmin, admin);
                  const deletable = canDeleteTarget(currentAdmin);

                  return (
                    <div
                      key={admin.id}
                      className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                          {initialsFromEmail(admin.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {admin.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${admin.is_active ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-outline"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-green-500" : "bg-slate-400"}`}
                              />
                              {admin.is_active ? "Active" : "Inactive"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                admin.is_online
                                  ? "bg-primary/10 text-primary"
                                  : "bg-surface-container-highest text-outline"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${admin.is_online ? "bg-emerald-500" : "bg-slate-400"}`}
                              />
                              {admin.is_online ? "Online" : "Offline"}
                            </span>
                            {admin.is_superuser ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Super Admin
                              </span>
                            ) : null}
                          </div>
                          {!admin.is_online ? (
                            <p className="text-[11px] text-outline mt-1.5">
                              Last seen{" "}
                              {admin.last_seen_at
                                ? `${formatRelativeTime(admin.last_seen_at)} · ${formatDateTime(admin.last_seen_at)}`
                                : "— never recorded"}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => {
                            setEditingAdmin(admin);
                            setFormState({
                              email: admin.email,
                              is_superuser: admin.is_superuser,
                              is_active: admin.is_active,
                            });
                          }}
                          className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary-fixed transition-all disabled:opacity-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => {
                            void onUpdateAdmin(admin.id, {
                              is_active: !admin.is_active,
                            });
                          }}
                          className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary-fixed transition-all disabled:opacity-50"
                        >
                          {admin.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={!deletable}
                          onClick={() => setDeleteTarget(admin)}
                          className="p-2 rounded-lg text-outline hover:text-error hover:bg-error-container transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-base font-bold text-on-surface tracking-tight">
            Your Profile
          </h3>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 pointer-events-none select-none">
              <ShieldCheck className="w-16 h-16 text-primary opacity-10 rotate-12" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                  {initialsFromEmail(currentAdmin.email)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-on-surface">
                    {currentAdmin.email}
                  </h4>
                  <p className="text-xs text-primary font-semibold tracking-wide uppercase">
                    {currentAdmin.is_superuser
                      ? "Primary Super Admin"
                      : "Administrator"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-outline font-bold uppercase tracking-wider block">
                    Email for Notifications
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface font-medium min-w-0">
                      {currentAdmin.email}
                    </div>
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-outline font-bold uppercase tracking-wider block">
                    Effective Permissions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSIONS.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-outline uppercase">
                    Auth Method
                  </span>
                  <span className="text-[11px] font-bold text-primary uppercase">
                    OTP Secure
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-outline uppercase">
                    Account Status
                  </span>
                  <span className="text-[11px] font-bold text-on-surface uppercase">
                    {currentAdmin.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-outline uppercase">
                    Presence
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase ${currentAdmin.is_online ? "text-primary" : "text-outline"}`}
                  >
                    {currentAdmin.is_online ? "Online" : "Offline"}
                  </span>
                </div>
                {!currentAdmin.is_online ? (
                  <p className="text-[10px] text-on-surface-variant pt-0.5">
                    Last seen{" "}
                    {currentAdmin.last_seen_at
                      ? `${formatRelativeTime(currentAdmin.last_seen_at)} · ${formatDateTime(currentAdmin.last_seen_at)}`
                      : "— never recorded"}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <Shield className="w-24 h-24" />
            </div>
            <h4 className="text-sm font-bold mb-2">Immutable Governance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrative actions remain gated by backend permissions, with
              OTP-authenticated sessions securing access.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={createOpen || Boolean(editingAdmin)}
        title={editingAdmin ? "Edit Administrator" : "Invite Administrator"}
        description="Administrators sign in with OTP, so invitations only need an email address and role selection."
        onClose={() => {
          setCreateOpen(false);
          setEditingAdmin(null);
          setFormState({ email: "", is_superuser: false, is_active: true });
          setFormError(null);
        }}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setEditingAdmin(null);
                setFormState({
                  email: "",
                  is_superuser: false,
                  is_active: true,
                });
                setFormError(null);
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="admin-form"
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {submitting
                ? "Saving..."
                : editingAdmin
                  ? "Save Changes"
                  : "Send Invitation"}
            </button>
          </div>
        }
      >
        <form id="admin-form" className="space-y-4" onSubmit={handleSubmit}>
          <InlineAlert message={formError} tone="error" />

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Admin Email
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          {!editingAdmin ? (
            <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={formState.is_superuser}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    is_superuser: event.target.checked,
                  }))
                }
              />
              <span>Create as super admin</span>
            </label>
          ) : (
            <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={formState.is_active}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
              />
              <span>Account is active</span>
            </label>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Administrator"
        description={`Delete ${deleteTarget?.email ?? "this administrator"} from the backend.`}
        confirmLabel="Delete Admin"
        isPending={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteAdmin(deleteTarget).then(() => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
