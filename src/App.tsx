import { useEffect, useMemo, useState } from "react";

import { Login } from "./components/Login";
import { OtpValidation } from "./components/OtpValidation";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { BottomNav } from "./components/layout/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { ResourceDetail } from "./components/ResourceDetail";
import { AdminDashboard } from "./components/AdminDashboard";
import { Sources } from "./components/Sources";
import { Tags } from "./components/Tags";
import { Repositories } from "./components/Repositories";
import {
  clearStoredSession,
  loadStoredSession,
  storeSession,
} from "./lib/auth";
import {
  ApiError,
  createAdmin,
  createDocRoute,
  createRepository,
  createResource,
  createSource,
  createTag,
  deleteAdmin,
  deleteDocRoute,
  deleteRepository,
  deleteResource,
  deleteSource,
  deleteTag,
  listAdmins,
  listAudits,
  listDocRoutes,
  listRepositories,
  uploadDocRoutesCsv,
  listResources,
  listSources,
  listTags,
  requestOtp,
  uploadResourcesCsv,
  updateAdmin,
  updateDocRoute,
  updateRepository,
  updateResource,
  updateSource,
  updateTag,
  verifyOtp,
} from "./lib/api";
import {
  AdminUser,
  AuditEntry,
  DocRoute,
  DocRoutePayload,
  DocRouteUpdatePayload,
  DocRouteUploadSummary,
  Repository,
  RepositoryPayload,
  Resource,
  ResourcePayload,
  ResourceUploadSummary,
  ResourceUpdatePayload,
  Source,
  Tag,
  ToastTone,
  View,
} from "./lib/types";
import { getErrorMessage } from "./lib/utils";

type AuthScreen = "login" | "otp";
type DetailOrigin = "dashboard" | "repositories";

type ToastState = {
  tone: ToastTone;
  message: string;
} | null;

const INVALID_ADMIN_EMAIL_DETAIL = "Invalid or inactive admin email.";

function ensureArray<T>(value: unknown, label: string): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  throw new Error(`Invalid ${label} response received from the server.`);
}

function repositoryToResource(repository: Repository): Resource {
  return {
    id: repository.resource_id,
    title: repository.title,
    url: repository.url,
    description: repository.description,
    is_repository: true,
    is_documentation: repository.is_documentation,
    source_id: repository.source_id,
    created_by: repository.created_by,
    created_at: repository.created_at,
    tag_ids: repository.tag_ids,
    repository_id: repository.id,
    last_synced_at: repository.last_synced_at,
  };
}

export default function App() {
  const [session, setSession] = useState(loadStoredSession());
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [view, setView] = useState<View>("dashboard");
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin>("dashboard");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [pendingEmail, setPendingEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(session));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);
  const [isLoadingDocRoutes, setIsLoadingDocRoutes] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [docRoutes, setDocRoutes] = useState<DocRoute[]>([]);

  const currentAdmin = session?.admin ?? null;
  const token = session?.token ?? null;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    void refreshAllData(token, true);
  }, [token]);

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    const updated = resources.find(
      (resource) => resource.id === selectedResource.id,
    );
    if (updated) {
      setSelectedResource(updated);
      return;
    }

    if (view === "detail") {
      setSelectedResource(null);
      setView(detailOrigin);
    }
  }, [detailOrigin, resources, selectedResource, view]);

  useEffect(() => {
    if (!token || view !== "detail" || !selectedResource) {
      setAudits([]);
      return;
    }

    void refreshAudits(token, selectedResource.id);
  }, [selectedResource, token, view]);

  useEffect(() => {
    if (
      !token ||
      view !== "detail" ||
      !selectedResource ||
      !selectedResource.is_documentation
    ) {
      setDocRoutes([]);
      return;
    }

    void refreshDocRoutes(token, selectedResource.id);
  }, [selectedResource, token, view]);

  async function refreshAllData(currentToken: string, initialLoad = false) {
    if (initialLoad) {
      setIsBootstrapping(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [
        sourcesData,
        tagsData,
        resourcesData,
        repositoriesData,
        adminsData,
      ] = await Promise.all([
        listSources(currentToken),
        listTags(currentToken),
        listResources(currentToken),
        listRepositories(currentToken),
        listAdmins(currentToken),
      ]);

      setSources(ensureArray<Source>(sourcesData, "sources"));
      setTags(ensureArray<Tag>(tagsData, "tags"));
      setResources(ensureArray<Resource>(resourcesData, "resources"));
      setRepositories(ensureArray<Repository>(repositoriesData, "repositories"));
      setAdmins(ensureArray<AdminUser>(adminsData, "admins"));
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setToast({
          tone: "error",
          message: getErrorMessage(error, "Could not load admin data."),
        });
      }
    } finally {
      setIsBootstrapping(false);
      setIsRefreshing(false);
    }
  }

  async function refreshAudits(currentToken: string, resourceId: string) {
    setIsLoadingAudits(true);
    try {
      const auditData = await listAudits(currentToken, resourceId);
      setAudits(auditData);
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setToast({
          tone: "error",
          message: getErrorMessage(error, "Could not load resource audits."),
        });
      }
    } finally {
      setIsLoadingAudits(false);
    }
  }

  async function refreshDocRoutes(currentToken: string, resourceId: string) {
    setIsLoadingDocRoutes(true);
    try {
      const routesData = await listDocRoutes(currentToken, resourceId);
      setDocRoutes(routesData);
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setToast({
          tone: "error",
          message: getErrorMessage(error, "Could not load documentation routes."),
        });
      }
    } finally {
      setIsLoadingDocRoutes(false);
    }
  }

  async function handleUploadDocRoutesCsv(
    file: File,
  ): Promise<DocRouteUploadSummary> {
    if (!token || !selectedResource) {
      throw new Error("You must be signed in to continue.");
    }

    setIsSubmitting(true);
    try {
      const summary = await uploadDocRoutesCsv(
        token,
        selectedResource.id,
        file,
      );
      await refreshDocRoutes(token, selectedResource.id);
      await refreshAudits(token, selectedResource.id);
      await refreshAllData(token);
      setToast({
        tone: "success",
        message: "Documentation routes import completed.",
      });
      return summary;
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setToast({
          tone: "error",
          message: getErrorMessage(error),
        });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAuthFailure(error: unknown) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      logout("Your session expired. Sign in again to continue.");
      return true;
    }

    return false;
  }

  function logout(message?: string) {
    clearStoredSession();
    setSession(null);
    setAuthScreen("login");
    setPendingEmail("");
    setSelectedResource(null);
    setAudits([]);
    setDocRoutes([]);
    setResources([]);
    setRepositories([]);
    setSources([]);
    setTags([]);
    setAdmins([]);
    setAuthError(null);
    setAuthInfo(message ?? null);
    setToast(message ? { tone: "info", message } : null);
  }

  async function runMutation(
    action: () => Promise<void>,
    successMessage: string,
  ) {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    try {
      await action();
      await refreshAllData(token);
      setToast({ tone: "success", message: successMessage });
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setToast({ tone: "error", message: getErrorMessage(error) });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runMutationWithResult<T>(
    action: () => Promise<T>,
    successMessage: string,
  ): Promise<T> {
    if (!token) {
      throw new Error("You must be signed in to continue.");
    }

    setIsSubmitting(true);
    try {
      const result = await action();
      await refreshAllData(token);
      setToast({ tone: "success", message: successMessage });
      return result;
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setToast({ tone: "error", message: getErrorMessage(error) });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestOtp(email: string) {
    setIsAuthSubmitting(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      const response = await requestOtp(email);
      console.log("response:::::", response);
      if (response.detail === INVALID_ADMIN_EMAIL_DETAIL) {
        setAuthError(response.detail);
        setAuthInfo(null);
        setAuthScreen("login");
        return;
      }

      setPendingEmail(email);
      setAuthScreen("otp");
      setAuthInfo(response.detail);
    } catch (error) {
      setAuthError(
        getErrorMessage(error, "Could not request an OTP right now."),
      );
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      const response = await verifyOtp(pendingEmail, code);
      const nextSession = {
        admin: response.admin,
        token: response.token.access_token,
      };

      storeSession(nextSession);
      setSession(nextSession);
      setView("dashboard");
      setAuthScreen("login");
      setPendingEmail("");
      setAuthInfo(null);
      setToast({ tone: "success", message: "Signed in successfully." });
    } catch (error) {
      setAuthError(getErrorMessage(error, "Could not verify the OTP."));
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (!pendingEmail) {
      return;
    }

    setIsResendingOtp(true);
    setAuthError(null);

    try {
      const response = await requestOtp(pendingEmail);
      if (response.detail === INVALID_ADMIN_EMAIL_DETAIL) {
        setAuthError(response.detail);
        setAuthInfo(null);
        return;
      }

      setAuthInfo(response.detail);
    } catch (error) {
      setAuthError(getErrorMessage(error, "Could not resend the OTP."));
    } finally {
      setIsResendingOtp(false);
    }
  }

  if (!session) {
    if (authScreen === "otp") {
      return (
        <OtpValidation
          email={pendingEmail}
          isSubmitting={isAuthSubmitting}
          isResending={isResendingOtp}
          error={authError}
          info={authInfo}
          onBack={() => {
            setAuthScreen("login");
            setAuthError(null);
          }}
          onResend={handleResendOtp}
          onSubmit={handleVerifyOtp}
        />
      );
    }

    return (
      <Login
        defaultEmail={pendingEmail}
        isSubmitting={isAuthSubmitting}
        error={authError}
        info={authInfo}
        onSubmit={handleRequestOtp}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <Sidebar
        currentView={view}
        currentAdmin={session.admin}
        onNavigate={setView}
        onLogout={() => logout()}
      />
      <main className="flex-1 flex flex-col md:ml-64 min-h-screen pb-24 md:pb-0">
        <Header
          currentView={view}
          currentAdmin={session.admin}
          isRefreshing={isRefreshing}
          onRefresh={() => {
            if (token) {
              void refreshAllData(token);
            }
          }}
          onLogout={() => logout()}
        />
        <div className="flex-1 p-4 md:p-8 mt-16 max-w-7xl mx-auto w-full">
          {isBootstrapping ? (
            <div className="min-h-[320px] rounded-2xl bg-surface-container-lowest border border-outline-variant/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-on-surface-variant">
                Loading admin workspace...
              </span>
            </div>
          ) : (
            <>
              {view === "dashboard" && currentAdmin ? (
                <Dashboard
                  resources={resources}
                  sources={sources}
                  tags={tags}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && resources.length === 0}
                  submitting={isSubmitting}
                  onViewDetail={(resource) => {
                    setSelectedResource(resource);
                    setDetailOrigin("dashboard");
                    setView("detail");
                  }}
                  onCreateResource={(payload) =>
                    runMutation(
                      () =>
                        createResource(token!, payload).then(() => undefined),
                      "Resource created.",
                    )
                  }
                  onUpdateResource={(resourceId, payload) =>
                    runMutation(
                      () =>
                        updateResource(token!, resourceId, payload).then(
                          () => undefined,
                        ),
                      "Resource updated.",
                    )
                  }
                  onDeleteResource={(resource) =>
                    runMutation(
                      () => deleteResource(token!, resource.id),
                      `${resource.title} deleted.`,
                    )
                  }
                  onUploadResourcesCsv={(file): Promise<ResourceUploadSummary> =>
                    runMutationWithResult(
                      () => uploadResourcesCsv(token!, file),
                      "Resources upload processed.",
                    )
                  }
                />
              ) : null}

              {view === "detail" && selectedResource && currentAdmin ? (
                <ResourceDetail
                  resource={selectedResource}
                  audits={audits}
                  docRoutes={docRoutes}
                  sources={sources}
                  tags={tags}
                  admins={admins}
                  currentAdmin={currentAdmin}
                  isSubmitting={isSubmitting}
                  isLoadingAudits={isLoadingAudits}
                  isLoadingDocRoutes={isLoadingDocRoutes}
                  onBack={() => setView(detailOrigin)}
                  onUpdateResource={(resourceId, payload) =>
                    runMutation(
                      () =>
                        updateResource(token!, resourceId, payload).then(
                          () => undefined,
                        ),
                      "Resource updated.",
                    )
                  }
                  onDeleteResource={(resource) =>
                    runMutation(async () => {
                      await deleteResource(token!, resource.id);
                      setSelectedResource(null);
                      setView(detailOrigin);
                    }, `${resource.title} deleted.`)
                  }
                  onCreateDocRoute={(payload: DocRoutePayload) =>
                    runMutation(async () => {
                      await createDocRoute(token!, payload);
                      await Promise.all([
                        refreshDocRoutes(token!, payload.resource_id),
                        refreshAudits(token!, payload.resource_id),
                      ]);
                    }, "Documentation route created.")
                  }
                  onUpdateDocRoute={(docRouteId: string, payload: DocRouteUpdatePayload) =>
                    runMutation(async () => {
                      await updateDocRoute(token!, docRouteId, payload);
                      if (selectedResource) {
                        await Promise.all([
                          refreshDocRoutes(token!, selectedResource.id),
                          refreshAudits(token!, selectedResource.id),
                        ]);
                      }
                    }, "Documentation route updated.")
                  }
                  onDeleteDocRoute={(docRoute) =>
                    runMutation(async () => {
                      await deleteDocRoute(token!, docRoute.id);
                      await Promise.all([
                        refreshDocRoutes(token!, docRoute.resource_id),
                        refreshAudits(token!, docRoute.resource_id),
                      ]);
                    }, `${docRoute.name} deleted.`)
                  }
                  onUploadDocRoutesCsv={handleUploadDocRoutesCsv}
                />
              ) : null}

              {view === "sources" && currentAdmin ? (
                <Sources
                  sources={sources}
                  resources={resources}
                  admins={admins}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && sources.length === 0}
                  submitting={isSubmitting}
                  onCreateSource={(title) =>
                    runMutation(
                      () =>
                        createSource(token!, { title }).then(() => undefined),
                      "Source created.",
                    )
                  }
                  onUpdateSource={(sourceId, title) =>
                    runMutation(
                      () =>
                        updateSource(token!, sourceId, { title }).then(
                          () => undefined,
                        ),
                      "Source updated.",
                    )
                  }
                  onDeleteSource={(source) =>
                    runMutation(
                      () => deleteSource(token!, source.id),
                      `${source.title} deleted.`,
                    )
                  }
                />
              ) : null}

              {view === "tags" && currentAdmin ? (
                <Tags
                  tags={tags}
                  resources={resources}
                  admins={admins}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && tags.length === 0}
                  submitting={isSubmitting}
                  onCreateTag={(title) =>
                    runMutation(
                      () => createTag(token!, { title }).then(() => undefined),
                      "Tag created.",
                    )
                  }
                  onUpdateTag={(tagId, title) =>
                    runMutation(
                      () =>
                        updateTag(token!, tagId, { title }).then(
                          () => undefined,
                        ),
                      "Tag updated.",
                    )
                  }
                  onDeleteTag={(tag) =>
                    runMutation(
                      () => deleteTag(token!, tag.id),
                      `${tag.title} deleted.`,
                    )
                  }
                />
              ) : null}

              {view === "repositories" && currentAdmin ? (
                <Repositories
                  repositories={repositories}
                  sources={sources}
                  tags={tags}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && repositories.length === 0}
                  submitting={isSubmitting}
                  onViewDetail={(repository) => {
                    setSelectedResource(repositoryToResource(repository));
                    setDetailOrigin("repositories");
                    setView("detail");
                  }}
                  onCreateRepository={(payload) =>
                    runMutation(
                      () =>
                        createRepository(token!, payload).then(() => undefined),
                      "Repository connected.",
                    )
                  }
                  onUpdateRepository={(repositoryId, payload) =>
                    runMutation(
                      () =>
                        updateRepository(token!, repositoryId, payload).then(
                          () => undefined,
                        ),
                      "Repository updated.",
                    )
                  }
                  onDeleteRepository={(repository) =>
                    runMutation(
                      () => deleteRepository(token!, repository.id),
                      `${repository.title} deleted.`,
                    )
                  }
                />
              ) : null}

              {view === "admin" && currentAdmin ? (
                <AdminDashboard
                  admins={admins}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && admins.length === 0}
                  submitting={isSubmitting}
                  onCreateAdmin={(payload) =>
                    runMutation(
                      () => createAdmin(token!, payload).then(() => undefined),
                      "Administrator invited.",
                    )
                  }
                  onUpdateAdmin={(adminId, payload) =>
                    runMutation(async () => {
                      const updated = await updateAdmin(
                        token!,
                        adminId,
                        payload,
                      );
                      if (currentAdmin.id === updated.id) {
                        const nextSession = { ...session, admin: updated };
                        setSession(nextSession);
                        storeSession(nextSession);
                      }
                    }, "Administrator updated.")
                  }
                  onDeleteAdmin={(admin) =>
                    runMutation(async () => {
                      await deleteAdmin(token!, admin.id);
                      if (admin.id === currentAdmin.id) {
                        logout("Your admin account was removed.");
                      }
                    }, `${admin.email} deleted.`)
                  }
                />
              ) : null}
            </>
          )}
        </div>
      </main>
      <BottomNav currentView={view} onNavigate={setView} />

      {toast ? (
        <div className="fixed top-20 right-4 z-120 max-w-sm rounded-xl border border-outline-variant/20 bg-white shadow-2xl px-4 py-3">
          <p
            className={`text-sm font-semibold ${toast.tone === "error" ? "text-error" : toast.tone === "success" ? "text-primary" : "text-on-surface"}`}
          >
            {toast.message}
          </p>
        </div>
      ) : null}
    </div>
  );
}
