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

export function InventoryMaterialsScreen(props: AppScreenProps) {
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
    <WorkspacePanel
      title="Materials manager"
      subtitle="Rollup view for material demand, inferred on-hand stock, and reorder signals."
      actions={
        <Pressable onPress={openCreatePurchaseEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
          <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Restock</Text>
        </Pressable>
      }
    >
      <FilterToolbar>
        <SearchField
          onChangeText={setMaterialsSearch}
          placeholder="Search materials"
          value={materialsSearch}
        />

        <OptionChipRow
          allLabel="All categories"
          onChange={setMaterialsCategoryFilter}
          options={MATERIAL_CATEGORY_OPTIONS}
          value={materialsCategoryFilter}
        />

        <OptionChipRow
          allLabel="All stock"
          onChange={setMaterialsStockFilter}
          options={[
            { id: "ok", name: "Stock OK" },
            { id: "low", name: "Low stock" },
          ]}
          value={materialsStockFilter}
        />
      </FilterToolbar>

      {filteredMaterialRollups.map((row) => (
        <View key={row.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
          <View style={styles.queueRowHeader}>
            <View style={styles.queueRowPrimaryText}>
              <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{row.name}</Text>
              <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                {capitalize(row.category)} - vendor {row.vendor}
              </Text>
            </View>
            <Pressable
              onPress={() => openMaterialRestockEditor(row)}
              style={[
                styles.quickActionButton,
                appResponsiveStyles.quickActionButton,
                styles.quickActionButtonPrimary,
              ]}
            >
              <Text style={styles.quickActionButtonPrimaryLabel}>Restock</Text>
            </Pressable>
          </View>

          <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
            On hand {row.onHand} | Reorder {row.reorderPoint} | Open demand {row.openDemand}
          </Text>

          <View style={styles.queuePillRow}>
            <StatusPill
              label={row.stock === "low" ? "Low stock" : "Stock OK"}
              value={row.stock === "low" ? "critical" : "complete"}
            />
          </View>
        </View>
      ))}

      {filteredMaterialRollups.length === 0 ? (
        <EmptyState text="No materials match the current filters." />
      ) : null}

      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.materials} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
