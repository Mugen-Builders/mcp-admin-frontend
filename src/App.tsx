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
import { Articles } from "./components/Articles";
import { Skills } from "./components/Skills";
import { ArticleDetail } from "./components/ArticleDetail";
import { SkillDetail } from "./components/SkillDetail";
import {
  clearStoredSession,
  loadStoredSession,
  storeSession,
} from "./lib/auth";
import {
  ApiError,
  createAdmin,
  createArticle,
  createDocRoute,
  createRepository,
  createResource,
  createSkill,
  createSource,
  createTag,
  deleteAdmin,
  deleteArticle,
  deleteDocRoute,
  deleteRepository,
  deleteResource,
  deleteSkill,
  deleteSource,
  deleteTag,
  listAdmins,
  postAdminPresence,
  listAudits,
  listArticles,
  listDocRoutes,
  listRepositories,
  listSkills,
  uploadDocRoutesCsv,
  listResources,
  listSources,
  listTags,
  requestOtp,
  uploadResourcesCsv,
  updateAdmin,
  updateArticle,
  updateDocRoute,
  updateRepository,
  updateResource,
  updateSkill,
  updateSource,
  updateTag,
  verifyOtp,
} from "./lib/api";
import {
  AdminUser,
  Article,
  ArticlePayload,
  AuditEntry,
  DocRoute,
  DocRoutePayload,
  DocRouteUpdatePayload,
  DocRouteUploadSummary,
  Repository,
  RepositoryPayload,
  Skill,
  SkillPayload,
  Resource,
  ResourcePayload,
  ResourceUploadSummary,
  ResourceUpdatePayload,
  Source,
  Tag,
  ToastTone,
  View,
  StoredSession,
} from "./lib/types";
import { getErrorMessage } from "./lib/utils";

type AuthScreen = "login" | "otp";
type DetailOrigin = "dashboard" | "repositories" | "articles" | "skills";

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
    is_article: false,
    is_skill: false,
    is_documentation: repository.is_documentation,
    source_id: repository.source_id,
    created_by: repository.created_by,
    created_at: repository.created_at,
    tag_ids: repository.tag_ids,
    repository_id: repository.id,
    article_id: null,
    skill_id: null,
    last_synced_at: repository.last_synced_at,
  };
}

function articleToResource(article: Article): Resource {
  return {
    id: article.resource_id,
    title: article.title,
    url: article.url,
    description: article.description,
    is_repository: false,
    is_article: true,
    is_skill: false,
    is_documentation: article.is_documentation,
    source_id: article.source_id,
    created_by: article.created_by,
    created_at: article.created_at,
    tag_ids: article.tag_ids,
    repository_id: null,
    article_id: article.id,
    skill_id: null,
    last_synced_at: null,
  };
}

function skillToResource(skill: Skill): Resource {
  return {
    id: skill.resource_id,
    title: skill.title,
    url: skill.url,
    description: skill.description,
    is_repository: false,
    is_article: false,
    is_skill: true,
    is_documentation: skill.is_documentation,
    source_id: skill.source_id,
    created_by: skill.created_by,
    created_at: skill.created_at,
    tag_ids: skill.tag_ids,
    repository_id: null,
    article_id: null,
    skill_id: skill.id,
    last_synced_at: null,
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [docRoutes, setDocRoutes] = useState<DocRoute[]>([]);

  const currentAdmin = session?.admin ?? null;
  const token = session?.token ?? null;
  const selectedResourceExtendedContent = useMemo(() => {
    if (!selectedResource) {
      return null;
    }
    if (selectedResource.is_article) {
      const article = articles.find((entry) => entry.resource_id === selectedResource.id);
      if (!article) {
        return null;
      }
      return {
        kind: "article" as const,
        id: article.id,
        title: "Article Body",
        body: article.body,
        year_published: article.year_published,
      };
    }
    if (selectedResource.is_skill) {
      const skill = skills.find((entry) => entry.resource_id === selectedResource.id);
      if (!skill) {
        return null;
      }
      return {
        kind: "skill" as const,
        id: skill.id,
        title: "Skill Content",
        body: skill.body,
      };
    }
    return null;
  }, [articles, selectedResource, skills]);

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
    if (!token) {
      return undefined;
    }

    const sendPresence = () => {
      void postAdminPresence(token)
        .then(() => {
          setSession((prev) => {
            if (!prev) {
              return prev;
            }
            const next: StoredSession = {
              ...prev,
              admin: {
                ...prev.admin,
                is_online: true,
                last_seen_at: new Date().toISOString(),
              },
            };
            storeSession(next);
            return next;
          });
        })
        .catch(() => {});
    };
    sendPresence();
    const intervalId = window.setInterval(sendPresence, 45_000);
    return () => window.clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
    if (!token || view !== "admin") {
      return undefined;
    }

    const refreshAdmins = () => {
      void listAdmins(token)
        .then((data) => setAdmins(ensureArray<AdminUser>(data, "admins")))
        .catch(() => {});
    };
    refreshAdmins();
    const intervalId = window.setInterval(refreshAdmins, 30_000);
    return () => window.clearInterval(intervalId);
  }, [token, view]);

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
    const detailResourceId =
      view === "detail"
        ? selectedResource?.id
        : view === "article-detail"
          ? selectedArticle?.resource_id
          : view === "skill-detail"
            ? selectedSkill?.resource_id
            : null;
    if (!token || !detailResourceId) {
      setAudits([]);
      return;
    }
    void refreshAudits(token, detailResourceId);
  }, [selectedArticle, selectedResource, selectedSkill, token, view]);

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
        articlesData,
        skillsData,
        adminsData,
      ] = await Promise.all([
        listSources(currentToken),
        listTags(currentToken),
        listResources(currentToken),
        listRepositories(currentToken),
        listArticles(currentToken),
        listSkills(currentToken),
        listAdmins(currentToken),
      ]);

      setSources(ensureArray<Source>(sourcesData, "sources"));
      setTags(ensureArray<Tag>(tagsData, "tags"));
      setResources(ensureArray<Resource>(resourcesData, "resources"));
      setRepositories(ensureArray<Repository>(repositoriesData, "repositories"));
      setArticles(ensureArray<Article>(articlesData, "articles"));
      setSkills(ensureArray<Skill>(skillsData, "skills"));
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
    if (error instanceof ApiError) {
      if (error.status === 401) {
        logout("Your session expired. Sign in again to continue.");
        return true;
      }

      // Do not force logout on generic 403 responses (permission/policy errors).
      // These should surface as regular API errors so the user can continue.
      if (error.status === 403) {
        const detail = error.message.toLowerCase();
        const looksLikeExpiredSession =
          detail.includes("not authenticated") ||
          detail.includes("invalid token") ||
          detail.includes("token expired") ||
          detail.includes("could not validate credentials");

        if (looksLikeExpiredSession) {
          logout("Your session expired. Sign in again to continue.");
          return true;
        }
      }
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
    setArticles([]);
    setSkills([]);
    setSelectedArticle(null);
    setSelectedSkill(null);
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
                  resourceExtendedContent={selectedResourceExtendedContent}
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
                  onUpdateArticleFromResource={(articleId, payload) =>
                    runMutation(
                      () =>
                        updateArticle(token!, articleId, payload).then(
                          () => undefined,
                        ),
                      "Article updated.",
                    )
                  }
                  onUpdateSkillFromResource={(skillId, payload) =>
                    runMutation(
                      () =>
                        updateSkill(token!, skillId, payload).then(
                          () => undefined,
                        ),
                      "Skill updated.",
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

              {view === "articles" && currentAdmin ? (
                <Articles
                  articles={articles}
                  sources={sources}
                  tags={tags}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && articles.length === 0}
                  submitting={isSubmitting}
                  onViewDetail={(article) => {
                    setSelectedArticle(article);
                    setSelectedResource(articleToResource(article));
                    setDetailOrigin("articles");
                    setView("article-detail");
                  }}
                  onCreateArticle={(payload: ArticlePayload) =>
                    runMutation(
                      () => createArticle(token!, payload).then(() => undefined),
                      "Article created.",
                    )
                  }
                  onUpdateArticle={(articleId: string, payload: ArticlePayload) =>
                    runMutation(
                      () => updateArticle(token!, articleId, payload).then(() => undefined),
                      "Article updated.",
                    )
                  }
                  onDeleteArticle={(article) =>
                    runMutation(
                      () => deleteArticle(token!, article.id),
                      `${article.title} deleted.`,
                    )
                  }
                />
              ) : null}

              {view === "article-detail" && selectedArticle && currentAdmin ? (
                <ArticleDetail
                  article={selectedArticle}
                  audits={audits}
                  sources={sources}
                  tags={tags}
                  admins={admins}
                  currentAdmin={currentAdmin}
                  isSubmitting={isSubmitting}
                  isLoadingAudits={isLoadingAudits}
                  onBack={() => setView("articles")}
                  onUpdateArticle={(articleId, payload) =>
                    runMutation(async () => {
                      await updateArticle(token!, articleId, payload);
                      const updated = await listArticles(token!);
                      const next = ensureArray<Article>(updated, "articles");
                      setArticles(next);
                      const match = next.find((entry) => entry.id === articleId) ?? null;
                      setSelectedArticle(match);
                      if (match) {
                        setSelectedResource(articleToResource(match));
                      }
                    }, "Article updated.")
                  }
                  onDeleteArticle={(article) =>
                    runMutation(async () => {
                      await deleteArticle(token!, article.id);
                      setSelectedArticle(null);
                      setSelectedResource(null);
                      setView("articles");
                    }, `${article.title} deleted.`)
                  }
                />
              ) : null}

              {view === "skills" && currentAdmin ? (
                <Skills
                  skills={skills}
                  sources={sources}
                  tags={tags}
                  currentAdmin={currentAdmin}
                  loading={isRefreshing && skills.length === 0}
                  submitting={isSubmitting}
                  onViewDetail={(skill) => {
                    setSelectedSkill(skill);
                    setSelectedResource(skillToResource(skill));
                    setDetailOrigin("skills");
                    setView("skill-detail");
                  }}
                  onCreateSkill={(payload: SkillPayload) =>
                    runMutation(
                      () => createSkill(token!, payload).then(() => undefined),
                      "Skill created.",
                    )
                  }
                  onUpdateSkill={(skillId: string, payload: SkillPayload) =>
                    runMutation(
                      () => updateSkill(token!, skillId, payload).then(() => undefined),
                      "Skill updated.",
                    )
                  }
                  onDeleteSkill={(skill) =>
                    runMutation(
                      () => deleteSkill(token!, skill.id),
                      `${skill.title} deleted.`,
                    )
                  }
                />
              ) : null}

              {view === "skill-detail" && selectedSkill && currentAdmin ? (
                <SkillDetail
                  skill={selectedSkill}
                  audits={audits}
                  sources={sources}
                  tags={tags}
                  admins={admins}
                  currentAdmin={currentAdmin}
                  isSubmitting={isSubmitting}
                  isLoadingAudits={isLoadingAudits}
                  onBack={() => setView("skills")}
                  onUpdateSkill={(skillId, payload) =>
                    runMutation(async () => {
                      await updateSkill(token!, skillId, payload);
                      const updated = await listSkills(token!);
                      const next = ensureArray<Skill>(updated, "skills");
                      setSkills(next);
                      const match = next.find((entry) => entry.id === skillId) ?? null;
                      setSelectedSkill(match);
                      if (match) {
                        setSelectedResource(skillToResource(match));
                      }
                    }, "Skill updated.")
                  }
                  onDeleteSkill={(skill) =>
                    runMutation(async () => {
                      await deleteSkill(token!, skill.id);
                      setSelectedSkill(null);
                      setSelectedResource(null);
                      setView("skills");
                    }, `${skill.title} deleted.`)
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
