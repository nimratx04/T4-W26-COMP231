import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  CURRENT_VOLUNTEER_ID,
  initialAlerts,
  initialHelpRequests,
  initialIncidentReports,
  initialNearbyResources,
  initialOrganizationStatus,
  initialReportDraft,
  initialResources,
  initialTasks,
  initialVolunteers,
} from "../data/mockData";
import type {
  AlertItem,
  HelpRequest,
  HelpRequestStatus,
  IncidentReport,
  IncidentStatus,
  NearbyResource,
  OrganizationStatusRecord,
  OrganizationStatusValue,
  ReportDraft,
  ResourceAvailability,
  TaskStatus,
  Volunteer,
  VolunteerTask,
} from "../types";

type NewHelpRequest = Pick<HelpRequest, "type" | "location" | "description" | "priority">;
type VerificationSubmission = Pick<
  Volunteer,
  "idDocument" | "policeCheck" | "emergencyContact" | "safetyAgreement"
>;

type AppContextValue = {
  helpRequests: HelpRequest[];
  resources: ResourceAvailability;
  resourceDraft: ResourceAvailability | null;
  organizationStatus: OrganizationStatusRecord;
  volunteers: Volunteer[];
  currentVolunteer: Volunteer;
  tasks: VolunteerTask[];
  alerts: AlertItem[];
  incidentReports: IncidentReport[];
  nearbyResources: NearbyResource[];
  reportDraft: ReportDraft;
  addHelpRequest: (request: NewHelpRequest) => string;
  updateHelpRequestStatus: (requestId: string, status: HelpRequestStatus) => void;
  assignVolunteerToRequest: (requestId: string, volunteerId: string) => void;
  updateResources: (resources: ResourceAvailability) => void;
  confirmResourceChanges: () => boolean;
  updateOrganizationStatus: (status: OrganizationStatusValue, note: string) => void;
  submitVolunteerVerification: (submission: VerificationSubmission) => void;
  approveVolunteer: (volunteerId: string) => void;
  rejectVolunteer: (volunteerId: string) => void;
  acceptTask: (taskId: string) => boolean;
  updateTaskStatus: (taskId: string, status: Exclude<TaskStatus, "Available">) => void;
  addAlert: (alert: Omit<AlertItem, "id" | "createdAt">) => string;
  updateIncidentReportStatus: (incidentId: string, status: IncidentStatus) => void;
  updateReportDraft: (patch: Partial<ReportDraft>) => void;
  clearReportDraft: () => void;
  submitIncidentReport: () => string | null;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export function AppProvider({ children }: PropsWithChildren) {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(initialHelpRequests);
  const [resources, setResources] = useState<ResourceAvailability>(initialResources);
  const [resourceDraft, setResourceDraft] = useState<ResourceAvailability | null>(null);
  const [organizationStatus, setOrganizationStatus] =
    useState<OrganizationStatusRecord>(initialOrganizationStatus);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [tasks, setTasks] = useState<VolunteerTask[]>(initialTasks);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [incidentReports, setIncidentReports] =
    useState<IncidentReport[]>(initialIncidentReports);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(initialReportDraft);

  const currentVolunteer =
    volunteers.find((volunteer) => volunteer.id === CURRENT_VOLUNTEER_ID) ?? volunteers[0];

  const addHelpRequest = (request: NewHelpRequest) => {
    const timestamp = now();
    const id = makeId("request");
    setHelpRequests((current) => [
      {
        ...request,
        id,
        status: "Pending",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ...current,
    ]);
    return id;
  };

  const updateHelpRequestStatus = (requestId: string, status: HelpRequestStatus) => {
    setHelpRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, status, updatedAt: now() } : request,
      ),
    );
  };

  const assignVolunteerToRequest = (requestId: string, volunteerId: string) => {
    const volunteer = volunteers.find((item) => item.id === volunteerId);
    if (!volunteer || volunteer.status !== "Verified") {
      return;
    }

    setHelpRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              assignedVolunteerId: volunteer.id,
              assignedVolunteerName: volunteer.name,
              status: request.status === "Pending" ? "Active" : request.status,
              updatedAt: now(),
            }
          : request,
      ),
    );
  };

  const updateResources = (nextResources: ResourceAvailability) => {
    setResourceDraft({ ...nextResources, updatedAt: now() });
  };

  const confirmResourceChanges = () => {
    if (!resourceDraft) {
      return false;
    }
    setResources(resourceDraft);
    setResourceDraft(null);
    return true;
  };

  const updateOrganizationStatus = (status: OrganizationStatusValue, note: string) => {
    setOrganizationStatus({ status, note: note.trim(), updatedAt: now() });
  };

  const submitVolunteerVerification = (submission: VerificationSubmission) => {
    setVolunteers((current) =>
      current.map((volunteer) =>
        volunteer.id === CURRENT_VOLUNTEER_ID
          ? {
              ...volunteer,
              ...submission,
              status: "Pending",
              resultMessage: "Your information is waiting for administrator review.",
              submittedAt: now(),
            }
          : volunteer,
      ),
    );
  };

  const approveVolunteer = (volunteerId: string) => {
    setVolunteers((current) =>
      current.map((volunteer) =>
        volunteer.id === volunteerId
          ? {
              ...volunteer,
              status: "Verified",
              resultMessage: "Approved. Volunteer task access is enabled.",
            }
          : volunteer,
      ),
    );
  };

  const rejectVolunteer = (volunteerId: string) => {
    setVolunteers((current) =>
      current.map((volunteer) =>
        volunteer.id === volunteerId
          ? {
              ...volunteer,
              status: "Rejected",
              resultMessage:
                "The application was not approved. Review the submitted information before applying again.",
            }
          : volunteer,
      ),
    );
  };

  const acceptTask = (taskId: string) => {
    if (currentVolunteer.status !== "Verified") {
      return false;
    }

    const selectedTask = tasks.find((task) => task.id === taskId);
    if (!selectedTask || selectedTask.status !== "Available") {
      return false;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "Accepted",
              assignedVolunteerId: currentVolunteer.id,
              assignedVolunteerName: currentVolunteer.name,
            }
          : task,
      ),
    );
    return true;
  };

  const updateTaskStatus = (taskId: string, status: Exclude<TaskStatus, "Available">) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId && task.assignedVolunteerId === CURRENT_VOLUNTEER_ID
          ? { ...task, status }
          : task,
      ),
    );
  };

  const addAlert = (alert: Omit<AlertItem, "id" | "createdAt">) => {
    const id = makeId("alert");
    setAlerts((current) => [{ ...alert, id, createdAt: now() }, ...current]);
    return id;
  };

  const updateIncidentReportStatus = (incidentId: string, status: IncidentStatus) => {
    setIncidentReports((current) =>
      current.map((incident) =>
        incident.id === incidentId ? { ...incident, status } : incident,
      ),
    );
  };

  const updateReportDraft = (patch: Partial<ReportDraft>) => {
    setReportDraft((current) => ({ ...current, ...patch }));
  };

  const clearReportDraft = () => {
    setReportDraft(initialReportDraft);
  };

  const submitIncidentReport = () => {
    if (
      !reportDraft.type.trim() ||
      !reportDraft.description.trim() ||
      !reportDraft.location.trim() ||
      !reportDraft.urgency
    ) {
      return null;
    }

    const id = makeId("incident");
    const incident: IncidentReport = {
      id,
      type: reportDraft.type.trim(),
      description: reportDraft.description.trim(),
      location: reportDraft.location.trim(),
      urgency: reportDraft.urgency,
      photoName: reportDraft.photoName.trim() || undefined,
      status: "Pending Verification",
      createdAt: now(),
    };
    setIncidentReports((current) => [incident, ...current]);
    clearReportDraft();
    return id;
  };

  const value = useMemo<AppContextValue>(
    () => ({
      helpRequests,
      resources,
      resourceDraft,
      organizationStatus,
      volunteers,
      currentVolunteer,
      tasks,
      alerts,
      incidentReports,
      nearbyResources: initialNearbyResources,
      reportDraft,
      addHelpRequest,
      updateHelpRequestStatus,
      assignVolunteerToRequest,
      updateResources,
      confirmResourceChanges,
      updateOrganizationStatus,
      submitVolunteerVerification,
      approveVolunteer,
      rejectVolunteer,
      acceptTask,
      updateTaskStatus,
      addAlert,
      updateIncidentReportStatus,
      updateReportDraft,
      clearReportDraft,
      submitIncidentReport,
    }),
    [
      alerts,
      currentVolunteer,
      helpRequests,
      incidentReports,
      organizationStatus,
      reportDraft,
      resourceDraft,
      resources,
      tasks,
      volunteers,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
