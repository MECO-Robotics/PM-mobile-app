import { Image, Pressable, ScrollView, View } from "react-native";

import { Text } from "../i18n";
import {
  ARCHIVE_FILTER_OPTIONS,
  BLOCKER_FILTER_OPTIONS,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_STYLES,
  INVENTORY_VIEW_OPTIONS,
  MANUFACTURING_STATUS_OPTIONS,
  MANUFACTURING_VIEW_OPTIONS,
  MATERIAL_CATEGORY_OPTIONS,
  PART_STATUS_OPTIONS,
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  STATUS_LABELS,
  SUBVIEW_INTERACTION_GUIDANCE,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_SUBTEAM_OPTIONS,
  TASK_VIEW_OPTIONS,
  WORKLOG_SORT_OPTIONS,
} from "../ui/constants";
import {
  capitalize,
  datePortion,
  formatDate,
  formatDateTime,
  splitList,
  timePortion,
  timelineProgress,
} from "../ui/helpers";
import { LandscapeSubsystemTimeline } from "../ui/LandscapeSubsystemTimeline";
import { styles } from "../ui/styles";
import {
  EmptyState,
  FilterToolbar,
  InteractionNote,
  OptionChipRow,
  SearchField,
  SectionTabs,
  StatusPill,
  SummaryRow,
  WorkspacePanel,
} from "../ui/ui";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";
import { InventoryMaterialsScreen } from "./InventoryMaterialsScreen";
import { InventoryPartsScreen } from "./InventoryPartsScreen";
import { InventoryPurchasesScreen } from "./InventoryPurchasesScreen";

export function InventoryScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    editTagStyle,
    filteredMaterialRollups,
    filteredPartDefinitions,
    filteredPartInstances,
    filteredPurchases,
    inventoryView,
    materialsCategoryFilter,
    materialsSearch,
    materialsStockFilter,
    mechanismsById,
    members,
    membersById,
    openCreatePartDefinitionEditor,
    openCreatePurchaseEditor,
    openEditPartDefinitionEditor,
    openEditPurchaseEditor,
    openMaterialRestockEditor,
    partDefinitions,
    partDefinitionsById,
    partInstancesWithStatus,
    partsSearch,
    partsStatusFilter,
    partsSubsystemFilter,
    purchaseApprovalFilter,
    purchaseArchiveFilter,
    purchaseRequesterFilter,
    purchaseSearch,
    purchaseStatusFilter,
    purchaseSubsystemFilter,
    purchaseVendorFilter,
    purchaseVendorOptions,
    setMaterialsCategoryFilter,
    setMaterialsSearch,
    setMaterialsStockFilter,
    setPartsSearch,
    setPartsStatusFilter,
    setPartsSubsystemFilter,
    setPurchaseApprovalFilter,
    setPurchaseArchiveFilter,
    setPurchaseRequesterFilter,
    setPurchaseSearch,
    setPurchaseStatusFilter,
    setPurchaseSubsystemFilter,
    setPurchaseVendorFilter,
    subsystems,
    subsystemsById,
  } = props;

const renderScreen = () => {
  return (
    <>
      {inventoryView === "materials"
        ? <InventoryMaterialsScreen {...props} />
        : inventoryView === "parts"
          ? <InventoryPartsScreen {...props} />
          : <InventoryPurchasesScreen {...props} />}
    </>
  );
};

  return renderScreen();
}
