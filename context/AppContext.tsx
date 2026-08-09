import {
  createContext,
  useContext,
  useEffect,
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
  initialShelters,
  initialTasks,
  initialVolunteers,
} from "../data/mockData";
import { supabase } from "../lib/supabase";
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
  ShelterResource,
  TaskStatus,
  Volunteer,
  VolunteerTask,
} from "../types";

type NewHelpRequest = Pick<HelpRequest, "type" | "location" | "description" | "priority">;

type VerificationSubmission = Pick<
  Volunteer,
  "idDocument" | "policeCheck" | "emergencyContact" | "safetyAgreement"
>;

type ShelterInput = Omit<ShelterResource, "id" | "updatedAt">;

type ShelterRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  contact_number: string;
  available_beds: number;
  total_capacity: number;
  food_support: number;
  water_support: number;
  medical_support: string;
  supplies: string;
  operating_hours: string;
  status: string;
  is_published: boolean;
  latitude: number;
  longitude: number;
  updated_at: string | null;
  created_at?: string | null;
};

type AppContextValue = {
  helpRequests: HelpRequest[];
  resources: ResourceAvailability;
  resourceDraft: ResourceAvailability | null;
  organizationStatus: OrganizationStatusRecord;
  shelters: ShelterResource[];
  publishedShelters: ShelterResource[];
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
  addShelter: (shelter: ShelterInput) => string;
  updateShelter: (shelterId: string, patch: Partial<ShelterInput>) => boolean;
  deleteShelter: (shelterId: string) => boolean;
  toggleShelterPublished: (shelterId: string, isPublished: boolean) => boolean;
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

const statusOptions: OrganizationStatusValue[] = ["Open", "Limited", "Full", "Closed"];

const now = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const makeUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });

const normalizeStatus = (status: string | null | undefined): OrganizationStatusValue => {
  if (statusOptions.includes(status as OrganizationStatusValue)) {
    return status as OrganizationStatusValue;
  }

  return "Open";
};

const isShelterAvailableForAffectedUsers = (shelter: ShelterResource) =>
  shelter.isPublished &&
  shelter.availableBeds > 0 &&
  (shelter.status === "Open" || shelter.status === "Limited");

const mapShelterRowToResource = (row: ShelterRow): ShelterResource => ({
  id: row.id,
  name: row.name ?? "",
  address: row.address ?? "",
  city: row.city ?? "",
  contactNumber: row.contact_number ?? "",
  availableBeds: Number(row.available_beds ?? 0),
  totalCapacity: Number(row.total_capacity ?? 0),
  foodSupport: Number(row.food_support ?? 0),
  waterSupport: Number(row.water_support ?? 0),
  medicalSupport: row.medical_support ?? "",
  supplies: row.supplies ?? "",
  operatingHours: row.operating_hours ?? "",
  status: normalizeStatus(row.status),
  isPublished: Boolean(row.is_published),
  latitude: Number(row.latitude ?? 0),
  longitude: Number(row.longitude ?? 0),
  updatedAt: row.updated_at ?? now(),
});

const mapShelterInputToRow = (shelter: ShelterInput, updatedAt: string) => ({
  name: shelter.name,
  address: shelter.address,
  city: shelter.city,
  contact_number: shelter.contactNumber,
  available_beds: shelter.availableBeds,
  total_capacity: shelter.totalCapacity,
  food_support: shelter.foodSupport,
  water_support: shelter.waterSupport,
  medical_support: shelter.medicalSupport,
  supplies: shelter.supplies,
  operating_hours: shelter.operatingHours,
  status: shelter.status,
  is_published: shelter.isPublished,
  latitude: shelter.latitude,
  longitude: shelter.longitude,
  updated_at: updatedAt,
});

const mapShelterPatchToRow = (
  patch: Partial<ShelterInput>,
  updatedAt: string,
): Partial<ShelterRow> => {
  const row: Partial<ShelterRow> = {
    updated_at: updatedAt,
  };

  if (patch.name !== undefined) row.name = patch.name;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.contactNumber !== undefined) row.contact_number = patch.contactNumber;
  if (patch.availableBeds !== undefined) row.available_beds = patch.availableBeds;
  if (patch.totalCapacity !== undefined) row.total_capacity = patch.totalCapacity;
  if (patch.foodSupport !== undefined) row.food_support = patch.foodSupport;
  if (patch.waterSupport !== undefined) row.water_support = patch.waterSupport;
  if (patch.medicalSupport !== undefined) row.medical_support = patch.medicalSupport;
  if (patch.supplies !== undefined) row.supplies = patch.supplies;
  if (patch.operatingHours !== undefined) row.operating_hours = patch.operatingHours;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.isPublished !== undefined) row.is_published = patch.isPublished;
  if (patch.latitude !== undefined) row.latitude = patch.latitude;
  if (patch.longitude !== undefined) row.longitude = patch.longitude;

  return row;
};

export function AppProvider({ children }: PropsWithChildren) {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(initialHelpRequests);
  const [resources, setResources] = useState<ResourceAvailability>(initialResources);
  const [resourceDraft, setResourceDraft] = useState<ResourceAvailability | null>(null);
  const [organizationStatus, setOrganizationStatus] =
    useState<OrganizationStatusRecord>(initialOrganizationStatus);
  const [shelters, setShelters] = useState<ShelterResource[]>(initialShelters);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [tasks, setTasks] = useState<VolunteerTask[]>(initialTasks);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [incidentReports, setIncidentReports] =
    useState<IncidentReport[]>(initialIncidentReports);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(initialReportDraft);

  useEffect(() => {
    let isMounted = true;

    const loadSheltersFromSupabase = async () => {
      const { data, error } = await supabase
        .from("shelters")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn("Could not load shelters from Supabase:", error.message);
        return;
      }

      setShelters((data as ShelterRow[]).map(mapShelterRowToResource));
    };

    loadSheltersFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentVolunteer =
    volunteers.find((volunteer) => volunteer.id === CURRENT_VOLUNTEER_ID) ?? volunteers[0];

  const publishedShelters = useMemo(
    () => shelters.filter(isShelterAvailableForAffectedUsers),
    [shelters],
  );

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

  const addShelter = (shelter: ShelterInput) => {
    const timestamp = now();
    const id = makeUuid();

    const optimisticShelter: ShelterResource = {
      ...shelter,
      id,
      updatedAt: timestamp,
    };

    setShelters((current) => [optimisticShelter, ...current]);

    supabase
      .from("shelters")
      .insert({
        id,
        ...mapShelterInputToRow(shelter, timestamp),
      })
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn("Could not add shelter to Supabase:", error.message);
          setShelters((current) => current.filter((item) => item.id !== id));
          return;
        }

        if (data) {
          setShelters((current) =>
            current.map((item) =>
              item.id === id ? mapShelterRowToResource(data as ShelterRow) : item,
            ),
          );
        }
      });

    return id;
  };

  const updateShelter = (shelterId: string, patch: Partial<ShelterInput>) => {
    const existingShelter = shelters.find((shelter) => shelter.id === shelterId);

    if (!existingShelter) {
      return false;
    }

    const timestamp = now();

    setShelters((current) =>
      current.map((shelter) =>
        shelter.id === shelterId ? { ...shelter, ...patch, updatedAt: timestamp } : shelter,
      ),
    );

    supabase
      .from("shelters")
      .update(mapShelterPatchToRow(patch, timestamp))
      .eq("id", shelterId)
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn("Could not update shelter in Supabase:", error.message);
          setShelters((current) =>
            current.map((shelter) => (shelter.id === shelterId ? existingShelter : shelter)),
          );
          return;
        }

        if (data) {
          setShelters((current) =>
            current.map((shelter) =>
              shelter.id === shelterId ? mapShelterRowToResource(data as ShelterRow) : shelter,
            ),
          );
        }
      });

    return true;
  };

  const deleteShelter = (shelterId: string) => {
    const existingShelter = shelters.find((shelter) => shelter.id === shelterId);

    if (!existingShelter) {
      return false;
    }

    setShelters((current) => current.filter((shelter) => shelter.id !== shelterId));

    supabase
      .from("shelters")
      .delete()
      .eq("id", shelterId)
      .then(({ error }) => {
        if (error) {
          console.warn("Could not delete shelter from Supabase:", error.message);
          setShelters((current) => [existingShelter, ...current]);
        }
      });

    return true;
  };

  const toggleShelterPublished = (shelterId: string, isPublished: boolean) => {
    return updateShelter(shelterId, { isPublished });
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
      shelters,
      publishedShelters,
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
      addShelter,
      updateShelter,
      deleteShelter,
      toggleShelterPublished,
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
      publishedShelters,
      reportDraft,
      resourceDraft,
      resources,
      shelters,
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